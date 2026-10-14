import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import Base, engine

# Ensure tables exist for tests
Base.metadata.create_all(bind=engine)
client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "FoodLens API"

def test_user_registration_and_login():
    email = "test_user_pytest@foodlens.com"
    reg_payload = {
        "name": "Pytest User",
        "email": email,
        "password": "testpassword123"
    }
    # Register
    res_reg = client.post("/api/auth/register", json=reg_payload)
    if res_reg.status_code == 400:
        # Already registered, try login
        pass
    else:
        assert res_reg.status_code == 200
        assert "access_token" in res_reg.json()

    # Login
    res_log = client.post("/api/auth/login", json={"email": email, "password": "testpassword123"})
    assert res_log.status_code == 200
    token = res_log.json()["access_token"]
    assert token is not None

def test_dashboard_real_data_endpoint():
    # Login as pytest user
    res_log = client.post("/api/auth/login", json={"email": "test_user_pytest@foodlens.com", "password": "testpassword123"})
    assert res_log.status_code == 200
    token = res_log.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res_dash = client.get("/api/dashboard", headers=headers)
    assert res_dash.status_code == 200
    dash_data = res_dash.json()

    assert "weekly_score_trends" in dash_data
    assert len(dash_data["weekly_score_trends"]) == 7
    assert "nutrient_trends" in dash_data
    assert len(dash_data["nutrient_trends"]) == 7
    assert "profile_needs" in dash_data
    assert dash_data["profile_needs"]["goal_title"] is not None
    assert "timeframe_label" in dash_data
    assert isinstance(dash_data["today_scans_count"], int)

def test_profile_multi_goals_and_dietary():
    res_log = client.post("/api/auth/login", json={"email": "test_user_pytest@foodlens.com", "password": "testpassword123"})
    token = res_log.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_payload = {
        "health_goals": ["diabetes_oriented", "low_sodium", "high_protein"],
        "dietary_preferences": ["vegetarian", "dairy_free"],
        "allergies": ["peanuts"]
    }
    res_put = client.put("/api/profile", json=update_payload, headers=headers)
    assert res_put.status_code == 200
    data = res_put.json()
    assert "diabetes_oriented" in data["health_goals"]
    assert "low_sodium" in data["health_goals"]
    assert "high_protein" in data["health_goals"]
    assert "vegetarian" in data["dietary_preferences"]
    assert "dairy_free" in data["dietary_preferences"]
    assert "peanuts" in data["allergies"]

    # Verify via /api/auth/me
    res_me = client.get("/api/auth/me", headers=headers)
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert "diabetes_oriented" in me_data["health_goals"]
    assert "vegetarian" in me_data["dietary_preferences"]

def test_label_scan_with_custom_product_name():
    res_log = client.post("/api/auth/login", json={"email": "test_user_pytest@foodlens.com", "password": "testpassword123"})
    token = res_log.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload mock image with custom product_name and brand_name
    mock_img_bytes = b"fake-jpeg-bytes-for-test"
    files = {"file": ("test_label.jpg", mock_img_bytes, "image/jpeg")}
    data = {
        "product_name": "Haldiram's Aloo Bhujia",
        "brand_name": "Haldiram's"
    }
    res = client.post("/api/scan/label", files=files, data=data, headers=headers)
    assert res.status_code == 200
    scan_data = res.json()
    assert scan_data["product"]["name"] == "Haldiram's Aloo Bhujia"
    assert scan_data["product"]["brand"] == "Haldiram's"

    # Test PATCH to rename product
    prod_id = scan_data["product"]["id"]
    patch_res = client.patch(f"/api/products/{prod_id}", json={"name": "Haldiram's Spicy Aloo Bhujia (Updated)"})
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Haldiram's Spicy Aloo Bhujia (Updated)"



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

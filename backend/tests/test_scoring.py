import pytest
from app.services.scoring_engine import calculate_foodlens_score

def test_general_score_calculation():
    # Test high sugar product
    nutrition = {
        "energy_kcal": 450.0,
        "sugars_g": 25.0,
        "fat_g": 12.0,
        "saturated_fat_g": 6.0,
        "protein_g": 4.0,
        "fiber_g": 1.0,
        "sodium_mg": 600.0
    }
    res = calculate_foodlens_score(nutrition, ["sugar", "flour"], [])
    assert res["general_score"] < 50.0
    assert res["confidence_level"] == "High"

def test_personalized_diabetes_oriented_scoring():
    nutrition = {
        "energy_kcal": 250.0,
        "sugars_g": 18.0,
        "fat_g": 5.0,
        "saturated_fat_g": 1.0,
        "protein_g": 5.0,
        "fiber_g": 5.0,
        "sodium_mg": 200.0
    }
    res_general = calculate_foodlens_score(nutrition, ["sugar"], [], user_goal="general_healthy_eating")
    res_diabetes = calculate_foodlens_score(nutrition, ["sugar"], [], user_goal="diabetes_oriented")
    
    # Diabetes goal should penalize high sugar more severely than general profile
    assert res_diabetes["personalized_score"] < res_general["personalized_score"]
    assert any("Diabetes Warning" in w["factor"] for w in res_diabetes["breakdown"]["goal_warnings"])

def test_allergy_collision_penalty():
    nutrition = {"energy_kcal": 200.0, "sugars_g": 2.0, "protein_g": 8.0}
    res = calculate_foodlens_score(
        nutrition=nutrition,
        ingredients=["roasted peanuts", "salt"],
        allergens=["peanuts"],
        user_goal="general_healthy_eating",
        user_allergies=["peanuts"]
    )
    assert res["personalized_score"] <= 50.0
    assert any("CRITICAL ALLERGEN" in w["factor"] for w in res["breakdown"]["goal_warnings"])

def test_multiple_goals_scoring():
    nutrition = {
        "energy_kcal": 300.0,
        "sugars_g": 15.0,
        "fat_g": 4.0,
        "saturated_fat_g": 1.0,
        "protein_g": 14.0,
        "fiber_g": 2.0,
        "sodium_mg": 550.0
    }
    # Test with both diabetes_oriented and low_sodium simultaneously
    res = calculate_foodlens_score(
        nutrition=nutrition,
        ingredients=["soy protein", "sugar", "salt"],
        allergens=[],
        user_goal=["diabetes_oriented", "low_sodium"]
    )
    # Both warnings should appear: high sugar warning from diabetes and high sodium warning from low_sodium
    factors = [w["factor"] for w in res["breakdown"]["goal_warnings"]]
    assert any("Diabetes Warning" in f for f in factors)
    assert any("Low Sodium Goal Warning" in f for f in factors)


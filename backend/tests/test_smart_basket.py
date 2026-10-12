import pytest
from app.database.connection import SessionLocal
from app.services.smart_basket_service import seed_indian_food_catalogue, rank_and_recommend_smart_basket

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    seed_indian_food_catalogue(db)
    yield db
    db.close()

def test_smart_basket_budget_constraint(db_session):
    """Verify that proposed basket does not exceed the specified budget."""
    budget = 500.0
    result = rank_and_recommend_smart_basket(
        db=db_session,
        budget_inr=budget,
        primary_goal="high_protein",
        dietary_preference="vegetarian"
    )
    assert result["total_estimated_cost_inr"] <= budget
    assert result["remaining_budget_inr"] >= 0.0
    assert result["item_count"] > 0
    assert len(result["proposed_items"]) == result["item_count"]

def test_smart_basket_allergen_hard_exclusion(db_session):
    """Verify that peanut allergy strictly excludes peanut items even if they are high protein."""
    result = rank_and_recommend_smart_basket(
        db=db_session,
        budget_inr=1000.0,
        primary_goal="high_protein",
        dietary_preference="vegetarian",
        allergies=["peanuts"]
    )
    for item in result["proposed_items"]:
        assert "peanut" not in item["name"].lower()
        assert "mungfali" not in (item["hindi_name"] or "").lower()

def test_smart_basket_vegan_hard_exclusion(db_session):
    """Verify that vegan preference strictly excludes dairy (milk, paneer, curd, dahi)."""
    result = rank_and_recommend_smart_basket(
        db=db_session,
        budget_inr=1000.0,
        primary_goal="high_protein",
        dietary_preference="vegan"
    )
    for item in result["proposed_items"]:
        name_lower = item["name"].lower()
        assert "milk" not in name_lower
        assert "paneer" not in name_lower
        assert "curd" not in name_lower
        assert "dahi" not in name_lower
        assert "egg" not in name_lower

def test_smart_basket_rationales_provided(db_session):
    """Verify that every recommended food item carries an understandable plain-language rationale."""
    result = rank_and_recommend_smart_basket(
        db=db_session,
        budget_inr=800.0,
        primary_goal="high_fiber"
    )
    for item in result["proposed_items"]:
        assert item["rationale"] is not None
        assert len(item["rationale"]) > 5

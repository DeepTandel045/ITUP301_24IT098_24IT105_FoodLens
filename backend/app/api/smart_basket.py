from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.database.connection import get_db
from app.database.models import User, IndianFoodItem, ShoppingList, ShoppingListItem
from app.schemas.schemas import (
    SmartBasketPlanRequest,
    SmartBasketRecommendationResponse,
    IndianFoodItemResponse,
    ShoppingListCreate,
    ShoppingListUpdate,
    ShoppingListResponse,
    ShoppingListItemCreate,
    ShoppingListItemUpdate,
    ShoppingListItemResponse,
)
from app.services.smart_basket_service import (
    rank_and_recommend_smart_basket,
    seed_indian_food_catalogue
)
from app.core.security import decode_token

router = APIRouter(prefix="/smart-basket", tags=["Smart Basket"])


def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Helper to extract user if JWT Bearer token is provided, without failing for guest access."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        return None
    try:
        user_id = int(payload["sub"])
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


@router.post("/recommend", response_model=SmartBasketRecommendationResponse)
def get_smart_basket_recommendations(
    req: SmartBasketPlanRequest,
    db: Session = Depends(get_db)
):
    """
    Transparent recommendation engine for Smart Basket:
    Ranks Indian staples and packaged foods by user budget, nutrition goals,
    and dietary constraints, returning an actionable proposed basket.
    """
    return rank_and_recommend_smart_basket(
        db=db,
        budget_inr=req.budget_inr,
        primary_goal=req.primary_goal,
        secondary_goals=req.secondary_goals,
        dietary_preference=req.dietary_preference,
        avoided_ingredients=req.avoided_ingredients,
        allergies=req.allergies,
        household_size=req.household_size,
        shopping_duration=req.shopping_duration
    )


@router.get("/catalogue", response_model=List[IndianFoodItemResponse])
def get_indian_food_catalogue(
    category: Optional[str] = Query(None, description="Filter by category e.g. pulses_lentils, whole_grains, nuts_seeds"),
    search: Optional[str] = Query(None, description="Search by name or Hindi name"),
    db: Session = Depends(get_db)
):
    """Retrieve items from the verified Indian Food Catalogue."""
    query = db.query(IndianFoodItem)
    if category:
        query = query.filter(IndianFoodItem.category == category)
    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            (IndianFoodItem.name.ilike(s)) | (IndianFoodItem.hindi_name.ilike(s))
        )
    items = query.all()
    if not items:
        seed_indian_food_catalogue(db)
        items = query.all()
    return items


@router.post("/lists", response_model=ShoppingListResponse)
def create_shopping_list(
    payload: ShoppingListCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Save a new Smart Basket shopping list / checklist.
    Can be linked to an authenticated user or saved in guest session mode.
    """
    user_id = current_user.id if current_user else None

    # Calculate total initial cost from items
    total_cost = sum(item.estimated_price_inr * item.quantity for item in payload.items)

    new_list = ShoppingList(
        user_id=user_id,
        title=payload.title,
        budget_inr=payload.budget_inr,
        total_estimated_cost_inr=round(total_cost, 2),
        shopping_duration=payload.shopping_duration,
        household_size=payload.household_size,
        primary_nutrition_goal=payload.primary_nutrition_goal,
        secondary_nutrition_goals=payload.secondary_nutrition_goals or [],
        dietary_preference=payload.dietary_preference,
        avoided_ingredients=payload.avoided_ingredients or [],
        allergies=payload.allergies or [],
        notes=payload.notes,
        status="active"
    )
    db.add(new_list)
    db.commit()
    db.refresh(new_list)

    # Insert items
    for it in payload.items:
        db_item = ShoppingListItem(
            list_id=new_list.id,
            food_item_id=it.food_item_id,
            product_id=it.product_id,
            name=it.name,
            hindi_name=it.hindi_name,
            category=it.category,
            pack_size=it.pack_size,
            quantity=it.quantity,
            estimated_price_inr=it.estimated_price_inr,
            price_provenance=it.price_provenance,
            is_purchased=it.is_purchased,
            notes=it.notes,
            rationale=it.rationale,
            nutrition_snapshot=it.nutrition_snapshot or {}
        )
        db.add(db_item)

    db.commit()
    db.refresh(new_list)
    return new_list


@router.get("/lists", response_model=List[ShoppingListResponse])
def get_user_shopping_lists(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Retrieve all saved Smart Basket lists for the logged-in user."""
    if not current_user:
        return []
    return db.query(ShoppingList).filter(
        ShoppingList.user_id == current_user.id
    ).order_by(ShoppingList.updated_at.desc()).all()


@router.get("/lists/{list_id}", response_model=ShoppingListResponse)
def get_shopping_list_by_id(
    list_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Retrieve a single shopping checklist by ID."""
    s_list = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not s_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    
    # Ownership guard: if list belongs to a registered user, ensure requester matches
    if s_list.user_id and (not current_user or current_user.id != s_list.user_id):
        raise HTTPException(status_code=403, detail="Not authorized to access this shopping list")
    
    return s_list


@router.put("/lists/{list_id}", response_model=ShoppingListResponse)
def update_shopping_list_metadata(
    list_id: int,
    payload: ShoppingListUpdate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Update checklist title, budget, status, or notes."""
    s_list = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not s_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    if s_list.user_id and (not current_user or current_user.id != s_list.user_id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this shopping list")

    if payload.title is not None:
        s_list.title = payload.title
    if payload.budget_inr is not None:
        s_list.budget_inr = payload.budget_inr
    if payload.shopping_duration is not None:
        s_list.shopping_duration = payload.shopping_duration
    if payload.household_size is not None:
        s_list.household_size = payload.household_size
    if payload.status is not None:
        s_list.status = payload.status
    if payload.notes is not None:
        s_list.notes = payload.notes
    
    s_list.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(s_list)
    return s_list


@router.post("/lists/{list_id}/items", response_model=ShoppingListItemResponse)
def add_item_to_shopping_list(
    list_id: int,
    it: ShoppingListItemCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Add a new item to an existing checklist."""
    s_list = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not s_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    if s_list.user_id and (not current_user or current_user.id != s_list.user_id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this shopping list")

    db_item = ShoppingListItem(
        list_id=s_list.id,
        food_item_id=it.food_item_id,
        product_id=it.product_id,
        name=it.name,
        hindi_name=it.hindi_name,
        category=it.category,
        pack_size=it.pack_size,
        quantity=it.quantity,
        estimated_price_inr=it.estimated_price_inr,
        price_provenance=it.price_provenance,
        is_purchased=it.is_purchased,
        notes=it.notes,
        rationale=it.rationale,
        nutrition_snapshot=it.nutrition_snapshot or {}
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Recalculate total estimated cost
    total = sum(i.estimated_price_inr * i.quantity for i in s_list.items)
    s_list.total_estimated_cost_inr = round(total, 2)
    s_list.updated_at = datetime.datetime.utcnow()
    db.commit()

    return db_item


@router.patch("/lists/{list_id}/items/{item_id}", response_model=ShoppingListItemResponse)
def update_shopping_list_item(
    list_id: int,
    item_id: int,
    payload: ShoppingListItemUpdate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Toggle checklist item status (is_purchased), adjust quantity, or edit price/notes.
    Immediately recalculates list total.
    """
    s_list = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not s_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    if s_list.user_id and (not current_user or current_user.id != s_list.user_id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this shopping list")

    db_item = db.query(ShoppingListItem).filter(
        ShoppingListItem.id == item_id,
        ShoppingListItem.list_id == list_id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found in shopping list")

    if payload.is_purchased is not None:
        db_item.is_purchased = payload.is_purchased
    if payload.quantity is not None:
        db_item.quantity = max(1, payload.quantity)
    if payload.estimated_price_inr is not None:
        db_item.estimated_price_inr = max(0.0, payload.estimated_price_inr)
    if payload.notes is not None:
        db_item.notes = payload.notes

    db_item.updated_at = datetime.datetime.utcnow()
    db.commit()

    # Recalculate total estimated cost
    total = sum(i.estimated_price_inr * i.quantity for i in s_list.items)
    s_list.total_estimated_cost_inr = round(total, 2)
    s_list.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(db_item)

    return db_item


@router.delete("/lists/{list_id}/items/{item_id}")
def remove_item_from_shopping_list(
    list_id: int,
    item_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Remove an item from a shopping checklist."""
    s_list = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not s_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    if s_list.user_id and (not current_user or current_user.id != s_list.user_id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this shopping list")

    db_item = db.query(ShoppingListItem).filter(
        ShoppingListItem.id == item_id,
        ShoppingListItem.list_id == list_id
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(db_item)
    db.commit()

    # Recalculate total
    total = sum(i.estimated_price_inr * i.quantity for i in s_list.items)
    s_list.total_estimated_cost_inr = round(total, 2)
    s_list.updated_at = datetime.datetime.utcnow()
    db.commit()

    return {"message": "Item removed from shopping list"}


@router.delete("/lists/{list_id}")
def delete_shopping_list(
    list_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Delete an entire saved shopping list."""
    s_list = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not s_list:
        raise HTTPException(status_code=404, detail="Shopping list not found")
    if s_list.user_id and (not current_user or current_user.id != s_list.user_id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this shopping list")

    db.delete(s_list)
    db.commit()
    return {"message": "Shopping list deleted successfully"}

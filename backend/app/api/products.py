from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.database.models import Product, ProductNutrition, UserProfile, User
from app.schemas.schemas import ProductResponse, ProductUpdate
from app.api.auth import get_current_user
from app.services.scoring_engine import calculate_foodlens_score

router = APIRouter(prefix="/products", tags=["Products"])

@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update or accept product name, brand, or category."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product_in.name and product_in.name.strip():
        product.name = product_in.name.strip()
    if product_in.brand is not None:
        product.brand = product_in.brand.strip()
    if product_in.category is not None:
        product.category = product_in.category.strip()

    db.commit()
    db.refresh(product)

    nutr = db.query(ProductNutrition).filter(ProductNutrition.product_id == product.id).first()
    nutr_data = {
        "energy_kcal": nutr.energy_kcal if nutr else None,
        "carbohydrates_g": nutr.carbohydrates_g if nutr else None,
        "sugars_g": nutr.sugars_g if nutr else None,
        "fat_g": nutr.fat_g if nutr else None,
        "saturated_fat_g": nutr.saturated_fat_g if nutr else None,
        "trans_fat_g": nutr.trans_fat_g if nutr else None,
        "protein_g": nutr.protein_g if nutr else None,
        "fiber_g": nutr.fiber_g if nutr else None,
        "sodium_mg": nutr.sodium_mg if nutr else None,
        "serving_size": nutr.serving_size if nutr else "100g",
        "serving_unit": nutr.serving_unit if nutr else "g",
    }

    return ProductResponse(
        id=product.id,
        barcode=product.barcode,
        name=product.name,
        brand=product.brand,
        category=product.category,
        image_url=product.image_url,
        ingredients_raw=product.ingredients_raw,
        ingredients_normalized=product.ingredients_normalized or [],
        allergens=product.allergens or [],
        data_source=product.data_source,
        nutrition=nutr_data
    )

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    nutr = db.query(ProductNutrition).filter(ProductNutrition.product_id == product.id).first()
    nutr_data = {
        "energy_kcal": nutr.energy_kcal if nutr else None,
        "carbohydrates_g": nutr.carbohydrates_g if nutr else None,
        "sugars_g": nutr.sugars_g if nutr else None,
        "fat_g": nutr.fat_g if nutr else None,
        "saturated_fat_g": nutr.saturated_fat_g if nutr else None,
        "trans_fat_g": nutr.trans_fat_g if nutr else None,
        "protein_g": nutr.protein_g if nutr else None,
        "fiber_g": nutr.fiber_g if nutr else None,
        "sodium_mg": nutr.sodium_mg if nutr else None,
        "serving_size": nutr.serving_size if nutr else "100g",
        "serving_unit": nutr.serving_unit if nutr else "g",
    }

    return ProductResponse(
        id=product.id,
        barcode=product.barcode,
        name=product.name,
        brand=product.brand,
        category=product.category,
        image_url=product.image_url,
        ingredients_raw=product.ingredients_raw,
        ingredients_normalized=product.ingredients_normalized or [],
        allergens=product.allergens or [],
        data_source=product.data_source,
        nutrition=nutr_data
    )

@router.get("/{product_id}/alternatives", response_model=List[ProductResponse])
def get_product_alternatives(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Find healthier alternative food choices within the same or similar category."""
    target = db.query(Product).filter(Product.id == product_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target product not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    dietary_goal = profile.dietary_goal if profile else "general_healthy_eating"

    # Query candidate products in database (excluding target)
    candidates = db.query(Product).filter(Product.id != product_id).limit(10).all()
    
    scored_candidates = []
    for cand in candidates:
        nutr = db.query(ProductNutrition).filter(ProductNutrition.product_id == cand.id).first()
        nutr_dict = {
            "energy_kcal": nutr.energy_kcal if nutr else None,
            "sugars_g": nutr.sugars_g if nutr else None,
            "fat_g": nutr.fat_g if nutr else None,
            "saturated_fat_g": nutr.saturated_fat_g if nutr else None,
            "trans_fat_g": nutr.trans_fat_g if nutr else None,
            "protein_g": nutr.protein_g if nutr else None,
            "fiber_g": nutr.fiber_g if nutr else None,
            "sodium_mg": nutr.sodium_mg if nutr else None,
        }
        
        score_res = calculate_foodlens_score(
            nutrition=nutr_dict,
            ingredients=cand.ingredients_normalized or [],
            allergens=cand.allergens or [],
            user_goal=dietary_goal,
            user_preferences=[p.preference_type for p in current_user.preferences],
            user_allergies=[a.allergen for a in current_user.allergies]
        )
        scored_candidates.append((cand, score_res["personalized_score"], nutr_dict))

    # Sort candidates by personalized score descending
    scored_candidates.sort(key=lambda x: x[1], reverse=True)

    result = []
    for cand, p_score, nutr_dict in scored_candidates[:3]:
        result.append(ProductResponse(
            id=cand.id,
            barcode=cand.barcode,
            name=cand.name,
            brand=cand.brand,
            category=cand.category,
            image_url=cand.image_url,
            ingredients_raw=cand.ingredients_raw,
            ingredients_normalized=cand.ingredients_normalized or [],
            allergens=cand.allergens or [],
            data_source=cand.data_source,
            nutrition=nutr_dict
        ))
        
    return result

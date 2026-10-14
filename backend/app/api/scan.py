from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from sqlalchemy.orm import Session
from typing import Optional
import datetime

from app.database.connection import get_db
from app.database.models import User, Product, ProductNutrition, Scan, Score, AIExplanation, UserProfile
from app.schemas.schemas import ScanResponse, ProductResponse, ScoreResponse, ManualBarcodeRequest
from app.api.auth import get_current_user
from app.services.barcode_service import fetch_product_by_barcode
from app.services.scoring_engine import calculate_foodlens_score
from app.services.ai_service import generate_score_explanation, generate_healthy_next_step
from app.services.ocr_service import extract_text_from_image, parse_ocr_text_to_product

router = APIRouter(prefix="/scan", tags=["Scanning & OCR"])

async def process_and_save_product_scan(
    db: Session,
    user: User,
    product_data: dict,
    scan_method: str
) -> ScanResponse:
    """Helper to register/update Product, run Scoring Engine, trigger AI service, and log Scan history."""
    barcode = product_data.get("barcode")
    
    # 1. Product creation or update
    product = None
    if barcode:
        product = db.query(Product).filter(Product.barcode == barcode).first()

    if not product:
        product = Product(
            barcode=barcode,
            name=product_data.get("name", "Unknown Product"),
            brand=product_data.get("brand", "Unknown Brand"),
            category=product_data.get("category", "Packaged Food"),
            image_url=product_data.get("image_url"),
            ingredients_raw=product_data.get("ingredients_raw"),
            ingredients_normalized=product_data.get("ingredients_normalized", []),
            allergens=product_data.get("allergens", []),
            data_source=product_data.get("data_source", "open_food_facts")
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        # Create Nutrition record
        nutr_dict = product_data.get("nutrition", {})
        nutrition = ProductNutrition(
            product_id=product.id,
            energy_kcal=nutr_dict.get("energy_kcal"),
            carbohydrates_g=nutr_dict.get("carbohydrates_g"),
            sugars_g=nutr_dict.get("sugars_g"),
            fat_g=nutr_dict.get("fat_g"),
            saturated_fat_g=nutr_dict.get("saturated_fat_g"),
            trans_fat_g=nutr_dict.get("trans_fat_g"),
            protein_g=nutr_dict.get("protein_g"),
            fiber_g=nutr_dict.get("fiber_g"),
            sodium_mg=nutr_dict.get("sodium_mg"),
            serving_size=nutr_dict.get("serving_size", "100g"),
            serving_unit=nutr_dict.get("serving_unit", "g")
        )
        db.add(nutrition)
        db.commit()
    else:
        nutrition = db.query(ProductNutrition).filter(ProductNutrition.product_id == product.id).first()

    # 2. Get User Preferences & Goal (use defaults for guest users)
    if user:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        dietary_goal = profile.dietary_goal if profile else "general_healthy_eating"
        user_prefs = [p.preference_type for p in user.preferences]
        user_allergies = [a.allergen for a in user.allergies]
    else:
        dietary_goal = "general_healthy_eating"
        user_prefs = []
        user_allergies = []

    # Build nutrition dict for scoring engine
    nutr_data = {
        "energy_kcal": nutrition.energy_kcal if nutrition else None,
        "carbohydrates_g": nutrition.carbohydrates_g if nutrition else None,
        "sugars_g": nutrition.sugars_g if nutrition else None,
        "fat_g": nutrition.fat_g if nutrition else None,
        "saturated_fat_g": nutrition.saturated_fat_g if nutrition else None,
        "trans_fat_g": nutrition.trans_fat_g if nutrition else None,
        "protein_g": nutrition.protein_g if nutrition else None,
        "fiber_g": nutrition.fiber_g if nutrition else None,
        "sodium_mg": nutrition.sodium_mg if nutrition else None,
    }

    # 3. Calculate Scores
    score_res = calculate_foodlens_score(
        nutrition=nutr_data,
        ingredients=product.ingredients_normalized or [],
        allergens=product.allergens or [],
        user_goal=dietary_goal,
        user_preferences=user_prefs,
        user_allergies=user_allergies
    )

    # 4. Generate AI Explanation & Healthy Next Step
    ai_explanation = await generate_score_explanation(
        product_name=product.name,
        general_score=score_res["general_score"],
        personalized_score=score_res["personalized_score"],
        user_goal=dietary_goal,
        breakdown=score_res["breakdown"]
    )
    
    healthy_next_step = await generate_healthy_next_step(dietary_goal, [score_res["personalized_score"]])

    # 5. Save Scan & Score history if user is authenticated
    scan_id = 0
    scanned_at = datetime.datetime.utcnow()
    if user:
        scan = Scan(
            user_id=user.id,
            product_id=product.id,
            scan_method=scan_method,
            data_source=product.data_source,
            scanned_at=scanned_at
        )
        db.add(scan)
        db.commit()
        db.refresh(scan)
        scan_id = scan.id

        score = Score(
            scan_id=scan.id,
            general_score=score_res["general_score"],
            personalized_score=score_res["personalized_score"],
            goal_type=dietary_goal,
            breakdown_json=score_res["breakdown"]
        )
        db.add(score)

        ai_exp_obj = AIExplanation(
            scan_id=scan.id,
            explanation_type="score_explanation",
            content=ai_explanation
        )
        db.add(ai_exp_obj)
        db.commit()

    return ScanResponse(
        scan_id=scan_id,
        scanned_at=scanned_at,
        scan_method=scan_method,
        product=ProductResponse(
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
        ),
        score=ScoreResponse(
            general_score=score_res["general_score"],
            personalized_score=score_res["personalized_score"],
            goal_type=dietary_goal,
            confidence_level=score_res["confidence_level"],
            breakdown=score_res["breakdown"],
            ai_explanation=ai_explanation,
            healthy_next_step=healthy_next_step
        )
    )

def get_optional_user_for_scan(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Helper to retrieve user if logged in, but return None for guests without raising 401."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    from app.core.security import decode_token
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        return None
    try:
        user_id = int(payload["sub"])
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None

@router.post("/barcode", response_model=ScanResponse)
async def scan_barcode(
    req: ManualBarcodeRequest,
    current_user: Optional[User] = Depends(get_optional_user_for_scan),
    db: Session = Depends(get_db)
):
    """Scan product via Barcode string (lookup via Open Food Facts / regional database)."""
    product_data = await fetch_product_by_barcode(req.barcode)
    if not product_data:
        raise HTTPException(
            status_code=404,
            detail=f"Product with barcode '{req.barcode}' was not found. Please use 'Scan Label' (OCR) to upload a picture of the label instead!"
        )
    return await process_and_save_product_scan(db, current_user, product_data, "barcode")

@router.post("/label", response_model=ScanResponse)
async def scan_label_ocr(
    file: UploadFile = File(...),
    product_name: Optional[str] = Form(None),
    brand_name: Optional[str] = Form(None),
    current_user: Optional[User] = Depends(get_optional_user_for_scan),
    db: Session = Depends(get_db)
):
    """OCR Fallback Scanner: Process food label image upload via OpenCV + Tesseract OCR."""
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file upload")

    raw_text, confidence = extract_text_from_image(image_bytes)
    product_data = parse_ocr_text_to_product(raw_text, product_name=product_name, brand_name=brand_name)
    
    return await process_and_save_product_scan(db, current_user, product_data, "ocr")

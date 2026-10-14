from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from app.database.connection import get_db
from app.database.models import User, UserProfile, Scan, Score, Product, ProductNutrition, UserPreference, Allergy
from app.schemas.schemas import DashboardResponse, DashboardProfileNeeds, ScanResponse, ProductResponse, ScoreResponse
from app.api.auth import get_current_user
from app.services.ai_service import generate_healthy_next_step

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
async def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    dietary_goal = profile.dietary_goal if profile and profile.dietary_goal else "general_healthy_eating"
    active_goals = [g.strip() for g in dietary_goal.split(",") if g.strip()]
    if not active_goals:
        active_goals = ["general_healthy_eating"]

    # User profile preferences and allergies
    user_allergies = [a.allergen for a in current_user.allergies] if current_user.allergies else []
    user_prefs = [p.preference_type for p in current_user.preferences] if current_user.preferences else []

    # Map goals to tailored medical/dietary guidelines and primary focus nutrients
    guidelines_map = {
        "diabetes_oriented": {
            "metric": "Sugar",
            "unit": "g",
            "guideline": "Target <25g sugar / day with low glycemic index choices"
        },
        "high_protein": {
            "metric": "Protein",
            "unit": "g",
            "guideline": "Target 50g–75g+ daily lean protein for muscle repair"
        },
        "low_sodium": {
            "metric": "Sodium",
            "unit": "mg",
            "guideline": "Strict limit: Keep daily sodium intake under 1,500mg"
        },
        "low_sugar": {
            "metric": "Low Sugar",
            "unit": "g",
            "guideline": "Minimize added refined sugars and high-glycemic syrups"
        },
        "heart_conscious": {
            "metric": "Sodium & Saturated Fat",
            "unit": "mg",
            "guideline": "Prioritize heart health: limit saturated fats & sodium (<2,000mg)"
        },
        "weight_management": {
            "metric": "Calories & Fat",
            "unit": "kcal",
            "guideline": "Prioritize nutrient density and satiety with dietary fiber >25g"
        },
        "vegetarian": {
            "metric": "Plant Protein",
            "unit": "g",
            "guideline": "Balanced plant protein from pulses, paneer, and whole grains"
        },
        "vegan": {
            "metric": "Plant Protein",
            "unit": "g",
            "guideline": "Complete amino acid profile from millets, soy, pulses & nuts"
        },
        "general_healthy_eating": {
            "metric": "Balanced Score",
            "unit": "score",
            "guideline": "Keep whole nutrients high and minimize ultra-processed additives"
        }
    }
    
    matched_guidelines = [guidelines_map.get(g, guidelines_map["general_healthy_eating"]) for g in active_goals]
    metrics_list = list(dict.fromkeys([m["metric"] for m in matched_guidelines]))
    combined_metrics = " • ".join(metrics_list)
    combined_guideline = " • ".join([m["guideline"] for m in matched_guidelines])

    # 1. Fetch all user scans ordered by date
    all_user_scans = db.query(Scan).filter(Scan.user_id == current_user.id).order_by(Scan.scanned_at.desc()).all()

    # 2. Build recent scan response items (latest 6)
    recent_scans_sample = all_user_scans[:6]
    recent_scan_responses = []

    for scan in recent_scans_sample:
        product = db.query(Product).filter(Product.id == scan.product_id).first()
        if not product:
            continue
        nutr = db.query(ProductNutrition).filter(ProductNutrition.product_id == product.id).first()
        nutr_dict = {
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

        score_rec = db.query(Score).filter(Score.scan_id == scan.id).first()
        g_score = score_rec.general_score if score_rec else 75.0
        p_score = score_rec.personalized_score if score_rec else 75.0
        breakdown = score_rec.breakdown_json if score_rec else {"positive": [], "negative": [], "goal_warnings": []}

        recent_scan_responses.append(ScanResponse(
            scan_id=scan.id,
            scanned_at=scan.scanned_at,
            scan_method=scan.scan_method,
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
                nutrition=nutr_dict
            ),
            score=ScoreResponse(
                general_score=g_score,
                personalized_score=p_score,
                goal_type=dietary_goal,
                confidence_level="High",
                breakdown=breakdown,
                ai_explanation=f"Scan recorded on {scan.scanned_at.strftime('%b %d')}"
            )
        ))

    # 3. Calculate 7-day trend window
    now = datetime.utcnow()
    today_date = now.date()
    seven_days_ago = today_date - timedelta(days=6)

    # Check if there are scans in the current calendar week
    scans_in_current_week = [s for s in all_user_scans if s.scanned_at.date() >= seven_days_ago]

    if scans_in_current_week:
        anchor_end_date = today_date
        timeframe_label = "Past 7 Days"
    elif all_user_scans:
        # If user has older scans, anchor to their latest scan date so real data renders
        anchor_end_date = all_user_scans[0].scanned_at.date()
        timeframe_label = f"Latest Activity ({anchor_end_date.strftime('%b %d')})"
    else:
        anchor_end_date = today_date
        timeframe_label = "Past 7 Days"

    calendar_days = [anchor_end_date - timedelta(days=i) for i in reversed(range(7))]

    weekly_trends = []
    nutrient_trends = []
    window_scores = []
    window_scans_count = 0

    for day_date in calendar_days:
        day_scans = [s for s in all_user_scans if s.scanned_at.date() == day_date]
        day_name = day_date.strftime("%a")
        date_str = day_date.strftime("%b %d")

        if day_scans:
            window_scans_count += len(day_scans)
            day_p_scores = []
            day_g_scores = []
            day_sugars = []
            day_proteins = []
            day_sodiums = []

            for s in day_scans:
                sc = db.query(Score).filter(Score.scan_id == s.id).first()
                if sc:
                    day_p_scores.append(sc.personalized_score)
                    day_g_scores.append(sc.general_score)
                    window_scores.append(sc.personalized_score)

                nutr = db.query(ProductNutrition).filter(ProductNutrition.product_id == s.product_id).first()
                if nutr:
                    if nutr.sugars_g is not None:
                        day_sugars.append(nutr.sugars_g)
                    if nutr.protein_g is not None:
                        day_proteins.append(nutr.protein_g)
                    if nutr.sodium_mg is not None:
                        day_sodiums.append(nutr.sodium_mg)

            avg_pers = round(sum(day_p_scores) / len(day_p_scores), 1) if day_p_scores else None
            avg_gen = round(sum(day_g_scores) / len(day_g_scores), 1) if day_g_scores else None
            tot_sugar = round(sum(day_sugars), 1) if day_sugars else 0.0
            tot_protein = round(sum(day_proteins), 1) if day_proteins else 0.0
            tot_sodium = round(sum(day_sodiums), 1) if day_sodiums else 0.0

            weekly_trends.append({
                "day": day_name,
                "date": date_str,
                "personalized_score": avg_pers,
                "general_score": avg_gen,
                "scans_count": len(day_scans)
            })
            nutrient_trends.append({
                "day": day_name,
                "date": date_str,
                "sugar": tot_sugar,
                "protein": tot_protein,
                "sodium": tot_sodium,
                "scans_count": len(day_scans)
            })
        else:
            weekly_trends.append({
                "day": day_name,
                "date": date_str,
                "personalized_score": None,
                "general_score": None,
                "scans_count": 0
            })
            nutrient_trends.append({
                "day": day_name,
                "date": date_str,
                "sugar": 0.0,
                "protein": 0.0,
                "sodium": 0.0,
                "scans_count": 0
            })

    # 4. Today's Scans and Score Comparison
    today_scans = [s for s in all_user_scans if s.scanned_at.date() == today_date]
    yesterday_scans = [s for s in all_user_scans if s.scanned_at.date() == (today_date - timedelta(days=1))]

    today_scores = []
    for s in today_scans:
        sc = db.query(Score).filter(Score.scan_id == s.id).first()
        if sc:
            today_scores.append(sc.personalized_score)

    yesterday_scores = []
    for s in yesterday_scans:
        sc = db.query(Score).filter(Score.scan_id == s.id).first()
        if sc:
            yesterday_scores.append(sc.personalized_score)

    if today_scores:
        avg_today_score = round(sum(today_scores) / len(today_scores), 1)
    else:
        avg_today_score = 0.0

    score_diff_yesterday: Optional[float] = None
    if today_scores and yesterday_scores:
        yest_avg = sum(yesterday_scores) / len(yesterday_scores)
        score_diff_yesterday = round(avg_today_score - yest_avg, 1)

    # 5. Weekly average score & profile needs object
    weekly_avg = round(sum(window_scores) / len(window_scores), 1) if window_scores else None

    from app.services.ai_service import format_goals_label
    combined_title = format_goals_label(active_goals)

    profile_needs = DashboardProfileNeeds(
        goal_key=dietary_goal,
        goal_title=combined_title,
        active_goals=active_goals,
        dietary_preferences=user_prefs,
        primary_metric=combined_metrics if combined_metrics else "Balanced Nutrition",
        metric_unit="mixed",
        target_guideline=combined_guideline,
        allergies=user_allergies,
        preferences=user_prefs,
        weekly_total_scans=window_scans_count,
        weekly_avg_score=weekly_avg,
        total_scans_all_time=len(all_user_scans)
    )

    # 6. Generate healthy next step insight based on actual score and profile
    healthy_next_step = await generate_healthy_next_step(
        active_goals, 
        today_scores if today_scores else window_scores[-3:] if window_scores else []
    )

    return DashboardResponse(
        user_name=current_user.name,
        dietary_goal=combined_title,
        today_scans_count=len(today_scans),
        average_today_score=avg_today_score,
        score_change_from_yesterday=score_diff_yesterday,
        timeframe_label=timeframe_label,
        profile_needs=profile_needs,
        recent_scans=recent_scan_responses,
        weekly_score_trends=weekly_trends,
        nutrient_trends=nutrient_trends,
        healthy_next_step_insight=healthy_next_step
    )


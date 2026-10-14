from typing import Dict, Any, List, Tuple, Union

def calculate_foodlens_score(
    nutrition: Dict[str, Any],
    ingredients: List[str],
    allergens: List[str],
    user_goal: Union[str, List[str]] = "general_healthy_eating",
    user_preferences: List[str] = None,
    user_allergies: List[str] = None
) -> Dict[str, Any]:
    """
    Deterministic FoodLens Scoring Engine.
    Calculates:
    - General FoodLens Score (0-100)
    - Personalized FoodLens Score (0-100)
    - Data Confidence Rating (High / Medium / Low)
    - Transparent factor breakdown (Positives, Negatives, Goal Warnings)
    """
    user_preferences = user_preferences or []
    user_allergies = user_allergies or []
    
    # Extract nutrition values (defaulting to None if missing)
    energy = nutrition.get("energy_kcal")
    sugars = nutrition.get("sugars_g")
    fat = nutrition.get("fat_g")
    sat_fat = nutrition.get("saturated_fat_g")
    trans_fat = nutrition.get("trans_fat_g")
    protein = nutrition.get("protein_g")
    fiber = nutrition.get("fiber_g")
    sodium = nutrition.get("sodium_mg")

    # Data completeness check
    known_count = sum(1 for val in [energy, sugars, sat_fat, protein, sodium] if val is not None)
    if known_count >= 5:
        confidence = "High"
    elif known_count >= 3:
        confidence = "Medium"
    else:
        confidence = "Low"

    # --- 1. General Score Calculation (Base 80) ---
    general_score = 80.0
    positive_factors = []
    negative_factors = []

    # Sugars (Negative)
    if sugars is not None:
        if sugars > 22.5:
            penalty = 25.0
            negative_factors.append({"factor": "High Sugar", "detail": f"{sugars}g per 100g (High)", "impact": -penalty})
            general_score -= penalty
        elif sugars > 12.0:
            penalty = 15.0
            negative_factors.append({"factor": "Moderate Sugar", "detail": f"{sugars}g per 100g", "impact": -penalty})
            general_score -= penalty
        elif sugars > 5.0:
            penalty = 7.0
            negative_factors.append({"factor": "Slightly Elevated Sugar", "detail": f"{sugars}g per 100g", "impact": -penalty})
            general_score -= penalty
        elif sugars <= 2.5:
            positive_factors.append({"factor": "Low Sugar", "detail": f"{sugars}g per 100g", "impact": 5.0})
            general_score += 5.0

    # Saturated Fat (Negative)
    if sat_fat is not None:
        if sat_fat > 5.0:
            penalty = 18.0
            negative_factors.append({"factor": "High Saturated Fat", "detail": f"{sat_fat}g per 100g", "impact": -penalty})
            general_score -= penalty
        elif sat_fat > 2.5:
            penalty = 10.0
            negative_factors.append({"factor": "Moderate Saturated Fat", "detail": f"{sat_fat}g per 100g", "impact": -penalty})
            general_score -= penalty
        elif sat_fat <= 1.5:
            positive_factors.append({"factor": "Low Saturated Fat", "detail": f"{sat_fat}g per 100g", "impact": 5.0})
            general_score += 5.0

    # Trans Fat (Negative)
    if trans_fat is not None and trans_fat > 0.1:
        penalty = 15.0
        negative_factors.append({"factor": "Contains Trans Fat", "detail": f"{trans_fat}g per 100g", "impact": -penalty})
        general_score -= penalty

    # Sodium (Negative)
    if sodium is not None:
        if sodium > 900:
            penalty = 20.0
            negative_factors.append({"factor": "High Sodium", "detail": f"{sodium}mg per 100g", "impact": -penalty})
            general_score -= penalty
        elif sodium > 500:
            penalty = 12.0
            negative_factors.append({"factor": "Moderate Sodium", "detail": f"{sodium}mg per 100g", "impact": -penalty})
            general_score -= penalty
        elif sodium <= 120:
            positive_factors.append({"factor": "Low Sodium", "detail": f"{sodium}mg per 100g", "impact": 5.0})
            general_score += 5.0

    # Energy Kcal (Negative if very high)
    if energy is not None and energy > 450:
        penalty = 10.0
        negative_factors.append({"factor": "High Caloric Density", "detail": f"{energy} kcal per 100g", "impact": -penalty})
        general_score -= penalty

    # Fiber (Positive)
    if fiber is not None:
        if fiber >= 6.0:
            positive_factors.append({"factor": "High Fiber Source", "detail": f"{fiber}g per 100g", "impact": 12.0})
            general_score += 12.0
        elif fiber >= 3.0:
            positive_factors.append({"factor": "Good Fiber Source", "detail": f"{fiber}g per 100g", "impact": 6.0})
            general_score += 6.0

    # Protein (Positive)
    if protein is not None:
        if protein >= 12.0:
            positive_factors.append({"factor": "High Protein Content", "detail": f"{protein}g per 100g", "impact": 12.0})
            general_score += 12.0
        elif protein >= 5.0:
            positive_factors.append({"factor": "Good Protein Source", "detail": f"{protein}g per 100g", "impact": 6.0})
            general_score += 6.0

    # Clamp General Score between 5 and 100
    general_score = round(max(5.0, min(100.0, general_score)), 1)

    # --- 2. Personalized Score Calculation ---
    personalized_score = general_score
    goal_warnings = []

    # Parse active goals
    if isinstance(user_goal, list):
        active_goals = {str(g).strip().lower() for g in user_goal if str(g).strip()}
    elif isinstance(user_goal, str):
        active_goals = {g.strip().lower() for g in user_goal.split(",") if g.strip()}
    else:
        active_goals = set()

    if not active_goals:
        active_goals = {"general_healthy_eating"}

    # A. Goal Specific Adjustments (can evaluate multiple active goals simultaneously)
    if "diabetes_oriented" in active_goals:
        if sugars is not None and sugars > 8.0:
            penalty = 25.0
            goal_warnings.append({
                "factor": "Diabetes Warning: High Sugar",
                "detail": f"{sugars}g sugar exceeds recommended low-glycemic threshold for diabetes-oriented eating.",
                "impact": -penalty
            })
            personalized_score -= penalty
        elif sugars is not None and sugars <= 3.0:
            positive_factors.append({"factor": "Diabetes Friendly: Low Sugar", "detail": f"{sugars}g sugar per 100g", "impact": 8.0})
            personalized_score += 8.0
            
        if fiber is not None and fiber >= 4.0:
            positive_factors.append({"factor": "Diabetes Friendly: High Fiber", "detail": "Helps stabilize blood sugar spikes", "impact": 8.0})
            personalized_score += 8.0

    if "high_protein" in active_goals:
        if protein is not None:
            if protein >= 10.0:
                positive_factors.append({"factor": "High Protein Goal Alignment", "detail": f"{protein}g protein per 100g", "impact": 10.0})
                personalized_score += 10.0
            elif protein < 3.0:
                goal_warnings.append({"factor": "Low Protein for Muscle/Fitness Goal", "detail": f"Only {protein}g protein", "impact": -10.0})
                personalized_score -= 10.0

    if "low_sugar" in active_goals and "diabetes_oriented" not in active_goals:
        if sugars is not None and sugars > 8.0:
            penalty = 20.0
            goal_warnings.append({"factor": "Low Sugar Goal Warning", "detail": f"{sugars}g sugar per 100g", "impact": -penalty})
            personalized_score -= penalty
        elif sugars is not None and sugars <= 3.0:
            positive_factors.append({"factor": "Low Sugar Goal Alignment", "detail": f"{sugars}g sugar per 100g", "impact": 6.0})
            personalized_score += 6.0

    if "weight_management" in active_goals:
        if sugars is not None and sugars > 10.0 and "diabetes_oriented" not in active_goals and "low_sugar" not in active_goals:
            penalty = 18.0
            goal_warnings.append({"factor": "Weight Management: High Sugar", "detail": f"{sugars}g sugar", "impact": -penalty})
            personalized_score -= penalty
        if energy is not None and energy > 350:
            penalty = 12.0
            goal_warnings.append({"factor": "High Calorie Density for Weight Management", "detail": f"{energy} kcal", "impact": -penalty})
            personalized_score -= penalty
        if fiber is not None and fiber >= 3.0 and "diabetes_oriented" not in active_goals:
            positive_factors.append({"factor": "Good Satiety / Fiber for Weight Management", "detail": f"{fiber}g fiber", "impact": 6.0})
            personalized_score += 6.0

    if "low_sodium" in active_goals:
        if sodium is not None and sodium > 400:
            penalty = 22.0
            goal_warnings.append({"factor": "Low Sodium Goal Warning", "detail": f"{sodium}mg sodium exceeds low-sodium limit", "impact": -penalty})
            personalized_score -= penalty
        elif sodium is not None and sodium <= 120:
            positive_factors.append({"factor": "Optimal Low Sodium Alignment", "detail": f"{sodium}mg sodium", "impact": 6.0})
            personalized_score += 6.0

    if "heart_conscious" in active_goals:
        if sat_fat is not None and sat_fat > 3.0:
            penalty = 18.0
            goal_warnings.append({"factor": "Heart Health Warning: High Saturated Fat", "detail": f"{sat_fat}g sat fat", "impact": -penalty})
            personalized_score -= penalty
        if sodium is not None and sodium > 600 and "low_sodium" not in active_goals:
            penalty = 14.0
            goal_warnings.append({"factor": "Heart Health Warning: Elevated Sodium", "detail": f"{sodium}mg sodium", "impact": -penalty})
            personalized_score -= penalty

    # B. Preference Adjustments (Vegan / Vegetarian / Dairy-Free / Gluten-Free / Keto / Jain)
    non_veg_keywords = ["chicken", "beef", "pork", "fish", "gelatin", "lard", "bacon", "lamb", "shrimp", "anchovy", "meat", "seafood"]
    dairy_keywords = ["milk", "cheese", "butter", "whey", "casein", "cream", "ghee", "paneer", "curd", "yogurt", "lactose"]
    gluten_keywords = ["wheat", "barley", "rye", "gluten", "maida", "semolina"]
    root_veg_keywords = ["onion", "garlic", "potato", "carrot", "radish", "beetroot"]

    all_ingredient_text = " ".join([i.lower() for i in ingredients] + [a.lower() for a in allergens])
    active_prefs = {p.strip().lower() for p in user_preferences} | (active_goals & {"vegetarian", "vegan", "keto", "gluten_free", "dairy_free", "jain", "pescatarian"})
    
    if "vegetarian" in active_prefs or "jain" in active_prefs:
        found_non_veg = [k for k in non_veg_keywords if k in all_ingredient_text]
        if found_non_veg:
            penalty = 40.0
            goal_warnings.append({
                "factor": "Non-Vegetarian Ingredient Detected",
                "detail": f"Contains non-veg items: {', '.join(found_non_veg).title()}",
                "impact": -penalty
            })
            personalized_score -= penalty

    if "vegan" in active_prefs:
        found_non_vegan = [k for k in (non_veg_keywords + dairy_keywords + ["egg", "honey"]) if k in all_ingredient_text]
        if found_non_vegan:
            penalty = 45.0
            goal_warnings.append({
                "factor": "Non-Vegan Ingredient Detected",
                "detail": f"Contains animal/dairy items: {', '.join(found_non_vegan).title()}",
                "impact": -penalty
            })
            personalized_score -= penalty

    if "dairy_free" in active_prefs:
        found_dairy = [k for k in dairy_keywords if k in all_ingredient_text]
        if found_dairy:
            penalty = 35.0
            goal_warnings.append({
                "factor": "Dairy Ingredient Detected",
                "detail": f"Contains dairy derivatives: {', '.join(found_dairy).title()}",
                "impact": -penalty
            })
            personalized_score -= penalty

    if "gluten_free" in active_prefs:
        found_gluten = [k for k in gluten_keywords if k in all_ingredient_text]
        if found_gluten:
            penalty = 40.0
            goal_warnings.append({
                "factor": "Gluten Ingredient Detected",
                "detail": f"Contains gluten-bearing ingredients: {', '.join(found_gluten).title()}",
                "impact": -penalty
            })
            personalized_score -= penalty

    if "keto" in active_prefs:
        if sugars is not None and sugars > 4.0:
            penalty = 20.0
            goal_warnings.append({
                "factor": "Keto Misalignment: Elevated Sugar",
                "detail": f"{sugars}g sugar exceeds strict ketogenic limit (<4g)",
                "impact": -penalty
            })
            personalized_score -= penalty

    if "jain" in active_prefs:
        found_root = [k for k in root_veg_keywords if k in all_ingredient_text]
        if found_root:
            penalty = 30.0
            goal_warnings.append({
                "factor": "Root Vegetable Detected (Jain Conflict)",
                "detail": f"Contains underground root ingredient: {', '.join(found_root).title()}",
                "impact": -penalty
            })
            personalized_score -= penalty

    # C. Allergy Collisions (Severe Penalty)
    for allergy in user_allergies:
        allergy_clean = allergy.strip().lower()
        if allergy_clean and allergy_clean in all_ingredient_text:
            penalty = 50.0
            goal_warnings.append({
                "factor": f"CRITICAL ALLERGEN WARNING: {allergy.upper()}",
                "detail": f"This product contains or may contain your flagged allergen: {allergy.upper()}.",
                "impact": -penalty
            })
            personalized_score -= penalty

    # Clamp Personalized Score between 0 and 100
    personalized_score = round(max(0.0, min(100.0, personalized_score)), 1)

    goal_type_str = ", ".join(sorted(list(active_goals))) if active_goals else "general_healthy_eating"

    return {
        "general_score": general_score,
        "personalized_score": personalized_score,
        "goal_type": goal_type_str,
        "confidence_level": confidence,
        "breakdown": {
            "positive": positive_factors,
            "negative": negative_factors,
            "goal_warnings": goal_warnings
        }
    }

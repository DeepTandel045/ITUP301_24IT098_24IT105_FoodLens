from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User, UserProfile, UserPreference, Allergy
from app.schemas.schemas import UserProfileUpdate, UserProfileResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["User Profile"])

@router.get("", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    raw_goals = profile.dietary_goal if profile and profile.dietary_goal else "general_healthy_eating"
    health_goals = [g.strip() for g in raw_goals.split(",") if g.strip()]
    if not health_goals:
        health_goals = ["general_healthy_eating"]
    prefs = [p.preference_type for p in current_user.preferences]
    allergies = [a.allergen for a in current_user.allergies]

    return UserProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        age_range=profile.age_range if profile else "18-35",
        dietary_goal=raw_goals,
        health_goals=health_goals,
        dietary_preferences=prefs,
        preferences=prefs,
        allergies=allergies
    )

@router.put("", response_model=UserProfileResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if profile_in.age_range:
        profile.age_range = profile_in.age_range

    if profile_in.health_goals is not None:
        profile.dietary_goal = ",".join(profile_in.health_goals) if profile_in.health_goals else "general_healthy_eating"
    elif profile_in.dietary_goal is not None:
        profile.dietary_goal = profile_in.dietary_goal

    # Update preferences / dietary preferences
    chosen_prefs = profile_in.dietary_preferences if profile_in.dietary_preferences is not None else profile_in.preferences
    if chosen_prefs is not None:
        db.query(UserPreference).filter(UserPreference.user_id == current_user.id).delete()
        for pref in chosen_prefs:
            db.add(UserPreference(user_id=current_user.id, preference_type=pref.strip().lower(), preference_value="true"))

    # Update allergies
    if profile_in.allergies is not None:
        db.query(Allergy).filter(Allergy.user_id == current_user.id).delete()
        for alg in profile_in.allergies:
            db.add(Allergy(user_id=current_user.id, allergen=alg.strip().lower()))

    db.commit()
    db.refresh(current_user)

    raw_goals = profile.dietary_goal if profile and profile.dietary_goal else "general_healthy_eating"
    health_goals = [g.strip() for g in raw_goals.split(",") if g.strip()]
    if not health_goals:
        health_goals = ["general_healthy_eating"]
    prefs = [p.preference_type for p in current_user.preferences]
    allergies = [a.allergen for a in current_user.allergies]

    return UserProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        age_range=profile.age_range,
        dietary_goal=raw_goals,
        health_goals=health_goals,
        dietary_preferences=prefs,
        preferences=prefs,
        allergies=allergies
    )

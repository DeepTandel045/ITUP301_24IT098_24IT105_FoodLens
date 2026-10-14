from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import User, UserProfile
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserProfileResponse
from app.core.security import hash_password, verify_password, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pw = hash_password(user_in.password)
    user = User(name=user_in.name, email=user_in.email, password_hash=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create default user profile
    profile = UserProfile(user_id=user.id, age_range="18-35", dietary_goal="general_healthy_eating")
    db.add(profile)
    db.commit()

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email
    )

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email
    )

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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

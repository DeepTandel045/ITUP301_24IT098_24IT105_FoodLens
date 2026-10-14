from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import re

# --- Auth & User Schemas ---

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, example="John Doe")
    email: str = Field(..., example="john@example.com")
    password: str = Field(..., min_length=6, example="secret123")

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("Email is required")
        v = v.strip().lower()
        if "@" not in v or "." not in v or len(v) < 5:
            raise ValueError("Please enter a valid email address (e.g. name@domain.com)")
        return v

class UserLogin(BaseModel):
    email: str = Field(..., example="john@example.com")
    password: str = Field(..., example="secret123")

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("Email is required")
        v = v.strip().lower()
        if "@" not in v or "." not in v or len(v) < 5:
            raise ValueError("Please enter a valid email address (e.g. name@domain.com)")
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str

class UserProfileUpdate(BaseModel):
    age_range: Optional[str] = "18-35"
    dietary_goal: Optional[str] = None
    health_goals: Optional[List[str]] = None
    dietary_preferences: Optional[List[str]] = None
    preferences: Optional[List[str]] = None  # e.g., ["low_sugar", "high_protein"]
    allergies: Optional[List[str]] = None    # e.g., ["peanuts", "gluten"]

class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    age_range: str
    dietary_goal: str
    health_goals: List[str] = []
    dietary_preferences: List[str] = []
    preferences: List[str] = []
    allergies: List[str] = []

# --- Nutrition & Product Schemas ---

class NutritionData(BaseModel):
    energy_kcal: Optional[float] = None
    carbohydrates_g: Optional[float] = None
    sugars_g: Optional[float] = None
    fat_g: Optional[float] = None
    saturated_fat_g: Optional[float] = None
    trans_fat_g: Optional[float] = None
    protein_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    serving_size: Optional[str] = "100g"
    serving_unit: Optional[str] = "g"

class ProductResponse(BaseModel):
    id: int
    barcode: Optional[str] = None
    name: str
    brand: str
    category: str
    image_url: Optional[str] = None
    ingredients_raw: Optional[str] = None
    ingredients_normalized: List[str] = []
    allergens: List[str] = []
    data_source: str
    nutrition: Optional[NutritionData] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None

# --- Scoring & Analysis Schemas ---

class ScoreFactorBreakdown(BaseModel):
    positive: List[Dict[str, Any]]
    negative: List[Dict[str, Any]]
    goal_warnings: List[Dict[str, Any]]

class ScoreResponse(BaseModel):
    general_score: float
    personalized_score: float
    goal_type: str
    confidence_level: str  # High, Medium, Low
    breakdown: ScoreFactorBreakdown
    ai_explanation: Optional[str] = None
    healthy_next_step: Optional[str] = None

class ScanResponse(BaseModel):
    scan_id: int
    scanned_at: datetime
    scan_method: str
    product: ProductResponse
    score: ScoreResponse

class ManualBarcodeRequest(BaseModel):
    barcode: str = Field(..., min_length=4, example="8901058852387")

class CompareRequest(BaseModel):
    product_ids: List[int] = Field(..., min_length=2, max_length=4)

class CompareResponse(BaseModel):
    products: List[ProductResponse]
    scores: List[ScoreResponse]
    comparison_summary: str
    winner_product_id: Optional[int] = None

# --- Basket Schemas ---

class AddBasketItemRequest(BaseModel):
    product_id: int
    quantity: int = 1

class BasketItemResponse(BaseModel):
    id: int
    product: ProductResponse
    quantity: int

class BasketAnalysisResponse(BaseModel):
    basket_id: int
    name: str
    item_count: int
    aggregated_nutrition: NutritionData
    average_general_score: float
    average_personalized_score: float
    items: List[BasketItemResponse]
    basket_warnings: List[str]
    ai_basket_recommendation: str

# --- Dashboard Schemas ---

class DashboardProfileNeeds(BaseModel):
    goal_key: str
    goal_title: str
    active_goals: List[str] = []
    dietary_preferences: List[str] = []
    primary_metric: str
    metric_unit: str
    target_guideline: str
    allergies: List[str] = []
    preferences: List[str] = []
    weekly_total_scans: int = 0
    weekly_avg_score: Optional[float] = None
    total_scans_all_time: int = 0

class DashboardResponse(BaseModel):
    user_name: str
    dietary_goal: str
    today_scans_count: int
    average_today_score: float
    score_change_from_yesterday: Optional[float] = None
    timeframe_label: Optional[str] = "Past 7 Days"
    profile_needs: Optional[DashboardProfileNeeds] = None
    recent_scans: List[ScanResponse]
    weekly_score_trends: List[Dict[str, Any]]
    nutrient_trends: List[Dict[str, Any]]
    healthy_next_step_insight: str


# --- Smart Basket & Indian Food Catalogue Schemas ---

class IndianFoodItemResponse(BaseModel):
    id: int
    name: str
    hindi_name: Optional[str] = None
    category: str
    is_staple: bool
    brand: str
    pack_size: str
    serving_size: str
    estimated_price_inr: float
    price_provenance: str
    energy_kcal: float
    protein_g: float
    fiber_g: float
    sugars_g: float
    saturated_fat_g: float
    sodium_mg: float
    allergens: List[str]
    dietary_tags: List[str]
    description: Optional[str] = None
    key_benefit: Optional[str] = None
    data_source: str


class SmartBasketPlanRequest(BaseModel):
    budget_inr: float = Field(default=1000.0, ge=100.0, le=50000.0)
    primary_goal: str = Field(default="high_protein")  # high_protein, high_fiber, low_sugar, low_sodium, whole_grains, budget_value
    secondary_goals: Optional[List[str]] = []
    dietary_preference: str = Field(default="vegetarian")  # vegetarian, vegan, non_vegetarian, jain
    avoided_ingredients: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    household_size: int = Field(default=2, ge=1, le=12)
    shopping_duration: str = Field(default="weekly")  # daily, weekly, monthly


class ProposedBasketItem(BaseModel):
    food_item_id: Optional[int] = None
    name: str
    hindi_name: Optional[str] = None
    category: str
    pack_size: str
    quantity: int = 1
    estimated_price_inr: float
    price_provenance: str
    is_purchased: bool = False
    rationale: str
    nutrition_snapshot: Dict[str, Any]


class SmartBasketRecommendationResponse(BaseModel):
    budget_inr: float
    total_estimated_cost_inr: float
    remaining_budget_inr: float
    item_count: int
    proposed_items: List[ProposedBasketItem]
    available_candidates_count: int
    excluded_candidates_count: int
    primary_goal: str
    dietary_preference: str
    disclaimer: str


class ShoppingListItemCreate(BaseModel):
    food_item_id: Optional[int] = None
    product_id: Optional[int] = None
    name: str
    hindi_name: Optional[str] = None
    category: str = "General Food"
    pack_size: str = "1 pack"
    quantity: int = 1
    estimated_price_inr: float = 0.0
    price_provenance: str = "estimated_kirana_index"
    is_purchased: bool = False
    notes: Optional[str] = None
    rationale: Optional[str] = None
    nutrition_snapshot: Optional[Dict[str, Any]] = {}


class ShoppingListItemUpdate(BaseModel):
    quantity: Optional[int] = None
    estimated_price_inr: Optional[float] = None
    is_purchased: Optional[bool] = None
    notes: Optional[str] = None


class ShoppingListItemResponse(BaseModel):
    id: int
    list_id: int
    food_item_id: Optional[int] = None
    product_id: Optional[int] = None
    name: str
    hindi_name: Optional[str] = None
    category: str
    pack_size: str
    quantity: int
    estimated_price_inr: float
    price_provenance: str
    is_purchased: bool
    notes: Optional[str] = None
    rationale: Optional[str] = None
    nutrition_snapshot: Optional[Dict[str, Any]] = {}
    created_at: datetime
    updated_at: datetime


class ShoppingListCreate(BaseModel):
    title: str = "My Smart Basket Checklist"
    budget_inr: float = 1000.0
    shopping_duration: str = "weekly"
    household_size: int = 2
    primary_nutrition_goal: str = "high_protein"
    secondary_nutrition_goals: Optional[List[str]] = []
    dietary_preference: str = "vegetarian"
    avoided_ingredients: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    notes: Optional[str] = None
    items: List[ShoppingListItemCreate] = []


class ShoppingListUpdate(BaseModel):
    title: Optional[str] = None
    budget_inr: Optional[float] = None
    shopping_duration: Optional[str] = None
    household_size: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ShoppingListResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    budget_inr: float
    total_estimated_cost_inr: float
    shopping_duration: str
    household_size: int
    primary_nutrition_goal: str
    secondary_nutrition_goals: List[str]
    dietary_preference: str
    status: str
    notes: Optional[str] = None
    items: List[ShoppingListItemResponse]
    created_at: datetime
    updated_at: datetime


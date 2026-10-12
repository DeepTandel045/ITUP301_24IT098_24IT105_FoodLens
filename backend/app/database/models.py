import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="user", cascade="all, delete-orphan")
    scans = relationship("Scan", back_populates="user", cascade="all, delete-orphan")
    baskets = relationship("Basket", back_populates="user", cascade="all, delete-orphan")
    shopping_lists = relationship("ShoppingList", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    age_range = Column(String, default="18-35")
    dietary_goal = Column(String, default="general_healthy_eating")  # general_healthy_eating, diabetes_oriented, weight_management, low_sugar, low_sodium, high_protein, heart_conscious, vegetarian, vegan
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    preference_type = Column(String, nullable=False)  # e.g., low_sugar, low_sodium, vegetarian, vegan, high_protein
    preference_value = Column(String, nullable=False, default="true")

    user = relationship("User", back_populates="preferences")


class Allergy(Base):
    __tablename__ = "allergies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    allergen = Column(String, nullable=False)  # peanuts, gluten, milk, soy, eggs, shellfish, tree_nuts, sesame, fish

    user = relationship("User", back_populates="allergies")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=False)
    brand = Column(String, default="Unknown Brand")
    category = Column(String, default="General Food")
    image_url = Column(String, nullable=True)
    ingredients_raw = Column(Text, nullable=True)
    ingredients_normalized = Column(JSON, nullable=True)  # List of normalized ingredient strings
    allergens = Column(JSON, nullable=True)  # List of allergen strings
    data_source = Column(String, default="open_food_facts")  # open_food_facts, ocr, manual
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    nutrition = relationship("ProductNutrition", back_populates="product", uselist=False, cascade="all, delete-orphan")
    scans = relationship("Scan", back_populates="product")


class ProductNutrition(Base):
    __tablename__ = "product_nutrition"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, unique=True)
    energy_kcal = Column(Float, nullable=True)
    carbohydrates_g = Column(Float, nullable=True)
    sugars_g = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    saturated_fat_g = Column(Float, nullable=True)
    trans_fat_g = Column(Float, nullable=True)
    protein_g = Column(Float, nullable=True)
    fiber_g = Column(Float, nullable=True)
    sodium_mg = Column(Float, nullable=True)
    serving_size = Column(String, default="100g")
    serving_unit = Column(String, default="g")

    product = relationship("Product", back_populates="nutrition")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    normalized_name = Column(String, index=True, nullable=False)
    ins_code = Column(String, index=True, nullable=True)  # e.g., INS 322, INS 415
    category = Column(String, default="General Ingredient")  # Emulsifier, Stabilizer, Preservative, Sweetener, Color
    description = Column(Text, nullable=True)
    common_use = Column(Text, nullable=True)
    allergen_flag = Column(Boolean, default=False)


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    scan_method = Column(String, nullable=False, default="barcode")  # barcode, manual_barcode, ocr
    data_source = Column(String, default="open_food_facts")
    scanned_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="scans")
    product = relationship("Product", back_populates="scans")
    score = relationship("Score", back_populates="scan", uselist=False, cascade="all, delete-orphan")
    ai_explanations = relationship("AIExplanation", back_populates="scan", cascade="all, delete-orphan")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, unique=True)
    general_score = Column(Float, nullable=False)
    personalized_score = Column(Float, nullable=False)
    goal_type = Column(String, nullable=False)
    score_version = Column(String, default="v1.0")
    breakdown_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scan = relationship("Scan", back_populates="score")


class Basket(Base):
    __tablename__ = "baskets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, default="My Grocery Basket")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="baskets")
    items = relationship("BasketItem", back_populates="basket", cascade="all, delete-orphan")


class BasketItem(Base):
    __tablename__ = "basket_items"

    id = Column(Integer, primary_key=True, index=True)
    basket_id = Column(Integer, ForeignKey("baskets.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, default=1)

    basket = relationship("Basket", back_populates="items")
    product = relationship("Product")


class AIExplanation(Base):
    __tablename__ = "ai_explanations"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False)
    explanation_type = Column(String, nullable=False)  # score_explanation, ingredient_summary, healthy_next_step
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scan = relationship("Scan", back_populates="ai_explanations")


class IndianFoodItem(Base):
    """
    Indian food and grocery catalogue:
    Covers staples (dal, pulses, millets, whole grains, dairy, seeds)
    and packaged products with price provenance, nutrition per 100g, and dietary tags.
    """
    __tablename__ = "indian_food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    hindi_name = Column(String, nullable=True)
    category = Column(String, nullable=False, index=True)  # pulses_lentils, whole_grains, dairy_alternatives, nuts_seeds, packaged_staples, healthy_snacks
    is_staple = Column(Boolean, default=True)  # True = ordinary kirana loose staple; False = packaged branded item
    brand = Column(String, default="Kirana Staple")
    pack_size = Column(String, default="1 kg")  # e.g., 1 kg, 500 g, 1 Litre, 250 g
    serving_size = Column(String, default="100g")
    estimated_price_inr = Column(Float, nullable=False, default=100.0)
    price_provenance = Column(String, default="estimated_kirana_index_2026")  # estimated_kirana_index_2026, verified_retail_price
    energy_kcal = Column(Float, nullable=False, default=0.0)
    protein_g = Column(Float, nullable=False, default=0.0)
    fiber_g = Column(Float, nullable=False, default=0.0)
    sugars_g = Column(Float, nullable=False, default=0.0)
    saturated_fat_g = Column(Float, nullable=False, default=0.0)
    sodium_mg = Column(Float, nullable=False, default=0.0)
    allergens = Column(JSON, default=list)  # e.g., ["peanuts"], ["milk"], ["gluten"]
    dietary_tags = Column(JSON, default=list)  # ["vegetarian", "vegan", "high_protein", "high_fiber", "whole_grain"]
    description = Column(Text, nullable=True)
    key_benefit = Column(String, nullable=True)
    data_source = Column(String, default="IFCT_2017_OpenFoodFacts")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ShoppingList(Base):
    """
    Saved Smart Basket shopping plan / interactive checklist.
    Can be linked to an authenticated user or saved anonymously in guest mode.
    """
    __tablename__ = "shopping_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(String, default="My Smart Basket Plan", nullable=False)
    budget_inr = Column(Float, nullable=False, default=1000.0)
    total_estimated_cost_inr = Column(Float, default=0.0)
    shopping_duration = Column(String, default="weekly")  # daily, weekly, monthly
    household_size = Column(Integer, default=2)
    primary_nutrition_goal = Column(String, default="high_protein")
    secondary_nutrition_goals = Column(JSON, default=list)
    dietary_preference = Column(String, default="vegetarian")
    avoided_ingredients = Column(JSON, default=list)
    allergies = Column(JSON, default=list)
    status = Column(String, default="active")  # active, completed, archived
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="shopping_lists")
    items = relationship("ShoppingListItem", back_populates="shopping_list", cascade="all, delete-orphan")


class ShoppingListItem(Base):
    """
    Interactive shopping checklist item.
    Supports checked/purchased state, quantity changes, manual price editing, and custom notes.
    """
    __tablename__ = "shopping_list_items"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("shopping_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    food_item_id = Column(Integer, ForeignKey("indian_food_items.id", ondelete="SET NULL"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    hindi_name = Column(String, nullable=True)
    category = Column(String, default="General Food")
    pack_size = Column(String, default="1 pack")
    quantity = Column(Integer, default=1, nullable=False)
    estimated_price_inr = Column(Float, nullable=False, default=0.0)
    price_provenance = Column(String, default="estimated_kirana_index")
    is_purchased = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    rationale = Column(String, nullable=True)
    nutrition_snapshot = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    shopping_list = relationship("ShoppingList", back_populates="items")
    food_item = relationship("IndianFoodItem")
    product = relationship("Product")


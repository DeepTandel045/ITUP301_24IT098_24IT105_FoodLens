import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import IndianFoodItem, ShoppingList, ShoppingListItem, User

# --- Verified Indian Food Catalogue Data ---
# Nutritional benchmarks sourced from Indian Food Composition Tables (IFCT 2017, ICMR-NIN)
# and verified Open Food Facts product profiles. Prices reflect representative Kirana / Retail Index (2026).

INITIAL_INDIAN_FOOD_CATALOGUE = [
    # --- 1. Pulses & Lentils (Dal & Legumes) ---
    {
        "name": "Toor Dal (Arhar Dal)",
        "hindi_name": "तुवर दाल",
        "category": "pulses_lentils",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "1 kg",
        "serving_size": "50g",
        "estimated_price_inr": 150.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 343.0,
        "protein_g": 22.3,
        "fiber_g": 15.0,
        "sugars_g": 2.1,
        "saturated_fat_g": 0.4,
        "sodium_mg": 28.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "high_fiber", "gluten_free"],
        "description": "Essential Indian staple rich in digestible plant protein, complex carbohydrates, and soluble dietary fiber.",
        "key_benefit": "22.3g protein per 100g; staple daily protein source for Indian vegetarian diets.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Moong Dal (Yellow Split)",
        "hindi_name": "मूंग दाल",
        "category": "pulses_lentils",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "1 kg",
        "serving_size": "50g",
        "estimated_price_inr": 130.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 348.0,
        "protein_g": 24.0,
        "fiber_g": 16.3,
        "sugars_g": 2.0,
        "saturated_fat_g": 0.3,
        "sodium_mg": 25.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "high_fiber", "gluten_free"],
        "description": "Easily digestible yellow lentil, gentle on the stomach and rich in potassium, folate, and protein.",
        "key_benefit": "Light on digestion with 24g protein and high fiber content.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Chana Dal (Split Bengal Gram)",
        "hindi_name": "चना दाल",
        "category": "pulses_lentils",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "1 kg",
        "serving_size": "50g",
        "estimated_price_inr": 95.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 372.0,
        "protein_g": 21.5,
        "fiber_g": 15.2,
        "sugars_g": 2.5,
        "saturated_fat_g": 0.9,
        "sodium_mg": 32.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "high_fiber", "low_glycemic", "gluten_free"],
        "description": "Low glycemic index lentil that releases glucose slowly, ideal for blood sugar stability and sustained energy.",
        "key_benefit": "Exceptional value for money: 21.5g protein at under ₹100 per kg.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Kala Chana (Whole Brown Chickpeas)",
        "hindi_name": "काला चना",
        "category": "pulses_lentils",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "1 kg",
        "serving_size": "50g",
        "estimated_price_inr": 85.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 360.0,
        "protein_g": 20.0,
        "fiber_g": 17.5,
        "sugars_g": 1.8,
        "saturated_fat_g": 0.8,
        "sodium_mg": 24.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "high_fiber", "low_glycemic", "gluten_free"],
        "description": "Whole dark chickpeas rich in iron, zinc, and insoluble dietary fiber.",
        "key_benefit": "High fiber (17.5g) supporting gut health and sustained satiety at ₹85/kg.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Rajma (Red Kidney Beans)",
        "hindi_name": "राजमा",
        "category": "pulses_lentils",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "1 kg",
        "serving_size": "50g",
        "estimated_price_inr": 140.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 346.0,
        "protein_g": 22.9,
        "fiber_g": 15.2,
        "sugars_g": 2.2,
        "saturated_fat_g": 0.4,
        "sodium_mg": 24.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "high_fiber", "gluten_free"],
        "description": "Nutrient-dense legume packed with molybdenum, folate, iron, and slow-digesting resistant starch.",
        "key_benefit": "Substantial 22.9g protein with high resistant starch for prolonged satiety.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Kabuli Chana (White Chickpeas)",
        "hindi_name": "काबुली चना",
        "category": "pulses_lentils",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "1 kg",
        "serving_size": "50g",
        "estimated_price_inr": 135.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 364.0,
        "protein_g": 19.3,
        "fiber_g": 12.2,
        "sugars_g": 2.4,
        "saturated_fat_g": 0.7,
        "sodium_mg": 26.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "high_fiber", "gluten_free"],
        "description": "Versatile whole legume high in magnesium and plant protein, staple for chole and nutritious salads.",
        "key_benefit": "High satiety profile with 19g protein per 100g.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Masoor Dal (Split Red Lentils)",
        "hindi_name": "लाल मसूर दाल",
        "category": "pulses_lentils",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "1 kg",
        "serving_size": "50g",
        "estimated_price_inr": 105.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 343.0,
        "protein_g": 25.1,
        "fiber_g": 10.8,
        "sugars_g": 1.9,
        "saturated_fat_g": 0.3,
        "sodium_mg": 18.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "high_fiber", "gluten_free"],
        "description": "Quick-cooking red split lentils with one of the highest protein densities among Indian pulses.",
        "key_benefit": "25.1g protein per 100g; cooks rapidly without prior soaking.",
        "data_source": "IFCT_2017_ICMR"
    },

    # --- 2. Whole Grains & Millets (Cereals & Millets) ---
    {
        "name": "Ragi Flour (Finger Millet Atta)",
        "hindi_name": "रागी का आटा / मडुआ",
        "category": "whole_grains",
        "is_staple": True,
        "brand": "Kirana Staple",
        "pack_size": "1 kg",
        "serving_size": "60g",
        "estimated_price_inr": 55.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 328.0,
        "protein_g": 7.3,
        "fiber_g": 11.5,
        "sugars_g": 0.6,
        "saturated_fat_g": 0.3,
        "sodium_mg": 11.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "whole_grain", "high_fiber", "low_glycemic", "gluten_free"],
        "description": "Ancient super-grain extraordinarily rich in bioavailable calcium (344mg/100g) and polyphenols.",
        "key_benefit": "Exceptional calcium content and dietary fiber; non-spiking carbohydrate.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Jowar Flour (Sorghum Atta)",
        "hindi_name": "ज्वार का आटा",
        "category": "whole_grains",
        "is_staple": True,
        "brand": "Kirana Staple",
        "pack_size": "1 kg",
        "serving_size": "60g",
        "estimated_price_inr": 60.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 349.0,
        "protein_g": 10.4,
        "fiber_g": 9.7,
        "sugars_g": 0.9,
        "saturated_fat_g": 0.5,
        "sodium_mg": 12.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "whole_grain", "high_fiber", "low_glycemic", "gluten_free"],
        "description": "Gluten-free traditional millet flour high in copper, iron, and heart-healthy phytosterols.",
        "key_benefit": "Gluten-free rotational flour offering 10.4g protein and slow digestion.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Bajra Flour (Pearl Millet Atta)",
        "hindi_name": "बाजरा का आटा",
        "category": "whole_grains",
        "is_staple": True,
        "brand": "Kirana Staple",
        "pack_size": "1 kg",
        "serving_size": "60g",
        "estimated_price_inr": 50.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 361.0,
        "protein_g": 11.6,
        "fiber_g": 11.5,
        "sugars_g": 0.7,
        "saturated_fat_g": 1.2,
        "sodium_mg": 10.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "whole_grain", "high_fiber", "low_glycemic", "gluten_free"],
        "description": "Iron-dense millet flour that promotes metabolic satiety, commonly consumed as bhakri/roti.",
        "key_benefit": "Rich in iron (8mg/100g) and 11.6g protein at just ₹50/kg.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Rolled Oats (Plain / Unflavoured)",
        "hindi_name": "ओट्स",
        "category": "whole_grains",
        "is_staple": False,
        "brand": "Quaker / Disano",
        "pack_size": "1 kg",
        "serving_size": "40g",
        "estimated_price_inr": 140.0,
        "price_provenance": "verified_retail_price",
        "energy_kcal": 389.0,
        "protein_g": 13.5,
        "fiber_g": 10.0,
        "sugars_g": 1.0,
        "saturated_fat_g": 1.3,
        "sodium_mg": 6.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "whole_grain", "high_fiber", "low_sugar"],
        "description": "100% whole grain rolled oats naturally rich in beta-glucan soluble fiber that helps lower LDL cholesterol.",
        "key_benefit": "Beta-glucan soluble fiber supports heart health and keeps morning blood sugar steady.",
        "data_source": "Open_Food_Facts_India"
    },
    {
        "name": "Chakkki Whole Wheat Atta",
        "hindi_name": "चक्की आटा",
        "category": "whole_grains",
        "is_staple": True,
        "brand": "Aashirvaad / Local Kirana Chakki",
        "pack_size": "5 kg",
        "serving_size": "50g",
        "estimated_price_inr": 230.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 340.0,
        "protein_g": 12.0,
        "fiber_g": 11.0,
        "sugars_g": 1.5,
        "saturated_fat_g": 0.4,
        "sodium_mg": 8.0,
        "allergens": ["gluten"],
        "dietary_tags": ["vegetarian", "vegan", "whole_grain", "high_fiber"],
        "description": "Stone-ground whole wheat retaining the wheat germ and bran layers for traditional rotis.",
        "key_benefit": "Foundational daily household staple with 11g fiber per 100g.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Thick Poha (Flattened Rice)",
        "hindi_name": "मोटा पोहा",
        "category": "whole_grains",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "1 kg",
        "serving_size": "60g",
        "estimated_price_inr": 55.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 353.0,
        "protein_g": 6.8,
        "fiber_g": 3.0,
        "sugars_g": 0.5,
        "saturated_fat_g": 0.2,
        "sodium_mg": 15.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "gluten_free", "low_fat"],
        "description": "Traditional flattened rice flakes, light on digestion and easy to prepare as a quick breakfast.",
        "key_benefit": "Easy-to-digest breakfast carbohydrate; pairs perfectly with roasted peanuts for protein balance.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Besan (Pure Bengal Gram Flour)",
        "hindi_name": "चना बेसन",
        "category": "whole_grains",
        "is_staple": True,
        "brand": "Fortune / Tata Sampann",
        "pack_size": "1 kg",
        "serving_size": "50g",
        "estimated_price_inr": 95.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 387.0,
        "protein_g": 22.0,
        "fiber_g": 10.8,
        "sugars_g": 2.6,
        "saturated_fat_g": 0.8,
        "sodium_mg": 40.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "gluten_free", "low_glycemic"],
        "description": "Finely milled pure chickpea flour used for making high-protein chillas, missi roti, and curries.",
        "key_benefit": "Doubles the protein of regular flour (22g/100g) while being naturally gluten-free.",
        "data_source": "IFCT_2017_ICMR"
    },

    # --- 3. Dairy, Soy & High-Protein Staples ---
    {
        "name": "Nutrela Soya Chunks",
        "hindi_name": "सोया वड़ी / सोया चंक्स",
        "category": "dairy_alternatives",
        "is_staple": False,
        "brand": "Nutrela",
        "pack_size": "200 g",
        "serving_size": "30g",
        "estimated_price_inr": 50.0,
        "price_provenance": "verified_retail_price",
        "energy_kcal": 345.0,
        "protein_g": 52.0,
        "fiber_g": 13.0,
        "sugars_g": 1.0,
        "saturated_fat_g": 0.1,
        "sodium_mg": 18.0,
        "allergens": ["soy"],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "high_fiber", "low_fat"],
        "description": "Defatted soy protein chunks offering the single highest protein concentration per rupee in India.",
        "key_benefit": "52g pure plant protein per 100g — unmatched budget efficiency for protein goals.",
        "data_source": "Open_Food_Facts_India"
    },
    {
        "name": "Amul Toned Milk (Taaza / Pouch)",
        "hindi_name": "अमूल टोंड दूध",
        "category": "dairy_alternatives",
        "is_staple": True,
        "brand": "Amul",
        "pack_size": "500 ml",
        "serving_size": "200ml",
        "estimated_price_inr": 29.0,
        "price_provenance": "verified_retail_price",
        "energy_kcal": 58.0,
        "protein_g": 3.1,
        "fiber_g": 0.0,
        "sugars_g": 4.7,
        "saturated_fat_g": 1.8,
        "sodium_mg": 50.0,
        "allergens": ["milk"],
        "dietary_tags": ["vegetarian", "gluten_free", "low_fat"],
        "description": "Fresh pasteurised toned milk with 3.0% fat and 8.5% solids-not-fat, providing complete bioavailable casein protein.",
        "key_benefit": "Complete amino acid profile and high calcium for daily bone and muscle maintenance.",
        "data_source": "Open_Food_Facts_India"
    },
    {
        "name": "Fresh Curd / Dahi (Plain Unsweetened)",
        "hindi_name": "ताजा दही",
        "category": "dairy_alternatives",
        "is_staple": True,
        "brand": "Amul Masti / Mother Dairy",
        "pack_size": "400 g",
        "serving_size": "100g",
        "estimated_price_inr": 35.0,
        "price_provenance": "verified_retail_price",
        "energy_kcal": 62.0,
        "protein_g": 4.0,
        "fiber_g": 0.0,
        "sugars_g": 4.5,
        "saturated_fat_g": 1.9,
        "sodium_mg": 45.0,
        "allergens": ["milk"],
        "dietary_tags": ["vegetarian", "gluten_free", "gut_health"],
        "description": "Naturally fermented probiotic curd that aids gut flora and nutrient bioavailability.",
        "key_benefit": "Probiotic bacteria support healthy digestion and gut microbiome.",
        "data_source": "Open_Food_Facts_India"
    },
    {
        "name": "Fresh Paneer (Cottage Cheese)",
        "hindi_name": "पनीर",
        "category": "dairy_alternatives",
        "is_staple": True,
        "brand": "Amul / Local Dairy",
        "pack_size": "200 g",
        "serving_size": "50g",
        "estimated_price_inr": 95.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 289.0,
        "protein_g": 18.5,
        "fiber_g": 0.0,
        "sugars_g": 1.8,
        "saturated_fat_g": 12.0,
        "sodium_mg": 38.0,
        "allergens": ["milk"],
        "dietary_tags": ["vegetarian", "high_protein", "low_carb", "gluten_free"],
        "description": "Dense fresh cheese with 18.5g protein and near-zero carbohydrates.",
        "key_benefit": "18.5g protein per 100g with very low carbohydrate content for sustained fullness.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Farm Fresh Eggs (Pack of 6)",
        "hindi_name": "अंडे",
        "category": "dairy_alternatives",
        "is_staple": True,
        "brand": "Local Poultry / Farm Fresh",
        "pack_size": "6 eggs",
        "serving_size": "2 eggs (100g)",
        "estimated_price_inr": 45.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 143.0,
        "protein_g": 13.0,
        "fiber_g": 0.0,
        "sugars_g": 0.4,
        "saturated_fat_g": 3.1,
        "sodium_mg": 142.0,
        "allergens": ["eggs"],
        "dietary_tags": ["non_vegetarian", "high_protein", "low_carb", "gluten_free"],
        "description": "Standard biological gold-standard protein with 100% biological value, rich in choline and B12.",
        "key_benefit": "Gold-standard complete protein; ₹45 for 6 eggs (approx. 36g total protein).",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Fresh Tofu (Soya Paneer)",
        "hindi_name": "टोफू",
        "category": "dairy_alternatives",
        "is_staple": False,
        "brand": "Moringa / Local Vegan Brand",
        "pack_size": "200 g",
        "serving_size": "50g",
        "estimated_price_inr": 65.0,
        "price_provenance": "verified_retail_price",
        "energy_kcal": 144.0,
        "protein_g": 14.0,
        "fiber_g": 2.3,
        "sugars_g": 0.8,
        "saturated_fat_g": 1.1,
        "sodium_mg": 14.0,
        "allergens": ["soy"],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "low_fat", "dairy_free"],
        "description": "100% plant-based soy curd offering a lactose-free, lower-fat alternative to traditional paneer.",
        "key_benefit": "Lactose-free, 100% vegan protein alternative with low saturated fat.",
        "data_source": "Open_Food_Facts_India"
    },

    # --- 4. Nuts, Seeds & Healthy Kirana Snacks ---
    {
        "name": "Roasted Chana with Skin (Bhuna Chana)",
        "hindi_name": "भुना चना (छिलके सहित)",
        "category": "nuts_seeds",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "250 g",
        "serving_size": "30g",
        "estimated_price_inr": 55.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 369.0,
        "protein_g": 22.0,
        "fiber_g": 16.8,
        "sugars_g": 1.2,
        "saturated_fat_g": 0.8,
        "sodium_mg": 38.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "high_fiber", "low_sugar", "snack"],
        "description": "Traditional roasted black gram with outer husk. Zero added sugar and deeply satisfying crunch.",
        "key_benefit": "Ideal portable snack: 22g protein, 16.8g fiber, zero added sugar.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Roasted Peanuts (Unsalted Mungfali)",
        "hindi_name": "भुनी मूंगफली",
        "category": "nuts_seeds",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "250 g",
        "serving_size": "30g",
        "estimated_price_inr": 50.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 567.0,
        "protein_g": 25.8,
        "fiber_g": 8.5,
        "sugars_g": 4.0,
        "saturated_fat_g": 6.8,
        "sodium_mg": 18.0,
        "allergens": ["peanuts"],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "healthy_fats"],
        "description": "Nutrient-dense legumes loaded with monounsaturated fatty acids, resveratrol, and plant protein.",
        "key_benefit": "25.8g protein with cardio-protective unsaturated fats at low cost.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Phool Makhana (Raw Foxnuts)",
        "hindi_name": "फूल मखाना",
        "category": "healthy_snacks",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "250 g",
        "serving_size": "25g",
        "estimated_price_inr": 180.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 347.0,
        "protein_g": 9.7,
        "fiber_g": 7.6,
        "sugars_g": 0.4,
        "saturated_fat_g": 0.1,
        "sodium_mg": 5.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "low_sodium", "low_fat", "gluten_free", "healthy_snack"],
        "description": "Expanded lotus water-lily seeds, naturally very low in sodium, fat, and calories.",
        "key_benefit": "Guilt-free low-sodium roasted snack ideal for heart-conscious and diabetes goals.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Flax Seeds (Alsi ke Beej)",
        "hindi_name": "अलसी के बीज",
        "category": "nuts_seeds",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "200 g",
        "serving_size": "15g",
        "estimated_price_inr": 45.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 534.0,
        "protein_g": 18.3,
        "fiber_g": 27.3,
        "sugars_g": 1.5,
        "saturated_fat_g": 3.7,
        "sodium_mg": 30.0,
        "allergens": [],
        "dietary_tags": ["vegetarian", "vegan", "high_fiber", "omega_3", "gluten_free"],
        "description": "Powerhouse seed providing alpha-linolenic acid (plant Omega-3) and lignan phytoestrogens.",
        "key_benefit": "Tremendous 27.3g fiber per 100g to support lower cholesterol absorption.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Raw Almonds (Badam Giri)",
        "hindi_name": "बादाम",
        "category": "nuts_seeds",
        "is_staple": True,
        "brand": "Kirana Loose Staple",
        "pack_size": "250 g",
        "serving_size": "20g",
        "estimated_price_inr": 230.0,
        "price_provenance": "estimated_kirana_index_2026",
        "energy_kcal": 579.0,
        "protein_g": 21.2,
        "fiber_g": 12.5,
        "sugars_g": 4.4,
        "saturated_fat_g": 3.8,
        "sodium_mg": 1.0,
        "allergens": ["tree_nuts"],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "vitamin_e", "low_sodium"],
        "description": "High-quality tree nut rich in antioxidant Vitamin E and monounsaturated fatty acids.",
        "key_benefit": "Brain and heart support with Vitamin E, protein, and zero sodium.",
        "data_source": "IFCT_2017_ICMR"
    },
    {
        "name": "Natural Unsweetened Peanut Butter",
        "hindi_name": "मूंगफली का मक्खन (बिना चीनी)",
        "category": "healthy_snacks",
        "is_staple": False,
        "brand": "Pintola / Disano",
        "pack_size": "350 g",
        "serving_size": "30g",
        "estimated_price_inr": 150.0,
        "price_provenance": "verified_retail_price",
        "energy_kcal": 625.0,
        "protein_g": 30.0,
        "fiber_g": 9.0,
        "sugars_g": 3.0,
        "saturated_fat_g": 6.5,
        "sodium_mg": 20.0,
        "allergens": ["peanuts"],
        "dietary_tags": ["vegetarian", "vegan", "high_protein", "low_sugar"],
        "description": "100% roasted peanuts spread with no added sugar, hydrogenated palm oil, or preservatives.",
        "key_benefit": "Clean 30g protein spread without hidden confectionery sugars or palm oil.",
        "data_source": "Open_Food_Facts_India"
    }
]


def seed_indian_food_catalogue(db: Session) -> int:
    """Idempotently seed or update verified Indian food items in the database."""
    count = 0
    for item in INITIAL_INDIAN_FOOD_CATALOGUE:
        existing = db.query(IndianFoodItem).filter(IndianFoodItem.name == item["name"]).first()
        if not existing:
            new_item = IndianFoodItem(**item)
            db.add(new_item)
            count += 1
        else:
            # Refresh price or provenance if updated
            existing.estimated_price_inr = item["estimated_price_inr"]
            existing.price_provenance = item["price_provenance"]
            existing.key_benefit = item["key_benefit"]
    db.commit()
    return count


def rank_and_recommend_smart_basket(
    db: Session,
    budget_inr: float,
    primary_goal: str = "high_protein",
    secondary_goals: Optional[List[str]] = None,
    dietary_preference: str = "vegetarian",
    avoided_ingredients: Optional[List[str]] = None,
    allergies: Optional[List[str]] = None,
    household_size: int = 2,
    shopping_duration: str = "weekly"
) -> Dict[str, Any]:
    """
    Transparent, deterministic recommendation engine for Smart Basket.
    Evaluates candidate foods, enforces hard dietary & allergy exclusions,
    ranks by goal suitability and budget efficiency, and generates a proposed basket.
    """
    secondary_goals = secondary_goals or []
    avoided_ingredients = [a.lower().strip() for a in (avoided_ingredients or [])]
    allergies = [a.lower().strip() for a in (allergies or [])]

    # 1. Fetch all items from Indian catalogue
    all_candidates = db.query(IndianFoodItem).all()
    if not all_candidates:
        seed_indian_food_catalogue(db)
        all_candidates = db.query(IndianFoodItem).all()

    filtered_candidates = []
    excluded_count = 0

    # 2. Hard Exclusion Filter (Allergies & Dietary Preferences)
    for item in all_candidates:
        item_allergens = [a.lower() for a in (item.allergens or [])]
        item_tags = [t.lower() for t in (item.dietary_tags or [])]
        item_name_lower = item.name.lower()

        # Check allergen collisions
        has_allergen_collision = any(alg in item_allergens or alg in item_name_lower for alg in allergies)
        if has_allergen_collision:
            excluded_count += 1
            continue

        # Check avoided ingredient keywords
        has_avoided_keyword = any(avoid in item_name_lower or avoid in (item.description or "").lower() for avoid in avoided_ingredients)
        if has_avoided_keyword:
            excluded_count += 1
            continue

        # Check dietary preference restrictions
        if dietary_preference == "vegan" and "vegan" not in item_tags:
            excluded_count += 1
            continue
        if dietary_preference == "vegetarian" and "vegetarian" not in item_tags:
            excluded_count += 1
            continue
        if dietary_preference == "jain" and ("root" in item_name_lower or "onion" in item_name_lower or "garlic" in item_name_lower):
            excluded_count += 1
            continue

        filtered_candidates.append(item)

    # 3. Transparent Goal-Based Scoring & Ranking
    ranked_items = []
    for item in filtered_candidates:
        score = 50.0  # Baseline neutral score
        rationale_points = []

        # Goal A: Higher Protein
        if primary_goal == "high_protein" or "high_protein" in secondary_goals:
            protein_density = item.protein_g  # per 100g
            if protein_density >= 20.0:
                score += 30.0
                rationale_points.append(f"High protein concentration ({protein_density}g/100g)")
            elif protein_density >= 10.0:
                score += 18.0
                rationale_points.append(f"Moderate protein contributor ({protein_density}g/100g)")
            # Protein-to-price efficiency (grams of protein per rupee)
            protein_per_pack = (protein_density * 10) if "1 kg" in item.pack_size else (protein_density * 2.5)
            protein_per_rupee = protein_per_pack / max(item.estimated_price_inr, 1.0)
            if protein_per_rupee > 1.2:
                score += 10.0
                rationale_points.append("High protein efficiency per rupee spent")

        # Goal B: Higher Fibre
        if primary_goal == "high_fiber" or "high_fiber" in secondary_goals:
            fiber_val = item.fiber_g
            if fiber_val >= 12.0:
                score += 28.0
                rationale_points.append(f"Rich in dietary fiber ({fiber_val}g/100g) for digestive satiety")
            elif fiber_val >= 6.0:
                score += 15.0
                rationale_points.append(f"Good fiber source ({fiber_val}g/100g)")

        # Goal C: Lower Added Sugar / Low Sugar
        if primary_goal == "low_sugar" or "low_sugar" in secondary_goals:
            if item.sugars_g <= 2.0:
                score += 25.0
                rationale_points.append(f"Minimal sugars ({item.sugars_g}g/100g)")
            elif item.sugars_g > 10.0:
                score -= 20.0

        # Goal D: Lower Sodium
        if primary_goal == "low_sodium" or "low_sodium" in secondary_goals:
            if item.sodium_mg <= 40.0:
                score += 25.0
                rationale_points.append(f"Naturally low sodium ({item.sodium_mg}mg/100g)")
            elif item.sodium_mg > 300.0:
                score -= 15.0

        # Goal E: Whole Grains & Millets
        if primary_goal == "whole_grains" or "whole_grains" in secondary_goals:
            if "whole_grain" in (item.dietary_tags or []):
                score += 30.0
                rationale_points.append("100% unrefined whole grain or traditional millet")

        # Goal F: Budget Value
        if primary_goal == "budget_value" or "budget_value" in secondary_goals:
            if item.estimated_price_inr <= 100.0:
                score += 25.0
                rationale_points.append("Highly economical price point")

        # Default fallback rationale if none triggered
        if not rationale_points:
            rationale_points.append(f"Balanced staple nutrition matching your {dietary_preference} preferences.")

        ranked_items.append({
            "item": item,
            "suitability_score": round(score, 1),
            "primary_rationale": rationale_points[0],
            "all_rationales": rationale_points
        })

    # Sort descending by suitability score
    ranked_items.sort(key=lambda x: x["suitability_score"], reverse=True)

    # 4. Budget-Aware Proposed Basket Assembly
    # Ensure balanced diversity across pulses, grains, dairy/alternatives, and snacks
    proposed_basket = []
    accumulated_cost = 0.0
    category_counts = {}

    for ranked in ranked_items:
        candidate = ranked["item"]
        cat = candidate.category
        curr_cat_count = category_counts.get(cat, 0)

        # Allow at most 3 items per category in initial proposal to maintain basket balance
        if curr_cat_count >= 3:
            continue

        item_price = candidate.estimated_price_inr
        # Check if adding item fits within total budget
        if accumulated_cost + item_price <= budget_inr:
            proposed_basket.append({
                "food_item_id": candidate.id,
                "name": candidate.name,
                "hindi_name": candidate.hindi_name,
                "category": candidate.category,
                "pack_size": candidate.pack_size,
                "quantity": 1,
                "estimated_price_inr": item_price,
                "price_provenance": candidate.price_provenance,
                "is_purchased": False,
                "rationale": ranked["primary_rationale"],
                "nutrition_snapshot": {
                    "energy_kcal": candidate.energy_kcal,
                    "protein_g": candidate.protein_g,
                    "fiber_g": candidate.fiber_g,
                    "sugars_g": candidate.sugars_g,
                    "sodium_mg": candidate.sodium_mg
                }
            })
            accumulated_cost += item_price
            category_counts[cat] = curr_cat_count + 1

    remaining_budget = max(0.0, round(budget_inr - accumulated_cost, 2))

    return {
        "budget_inr": budget_inr,
        "total_estimated_cost_inr": round(accumulated_cost, 2),
        "remaining_budget_inr": remaining_budget,
        "item_count": len(proposed_basket),
        "proposed_items": proposed_basket,
        "available_candidates_count": len(filtered_candidates),
        "excluded_candidates_count": excluded_count,
        "primary_goal": primary_goal,
        "dietary_preference": dietary_preference,
        "disclaimer": "All prices are estimated Kirana/retail benchmark prices in INR. Actual shop prices may vary slightly."
    }

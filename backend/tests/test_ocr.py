import pytest
import numpy as np
import cv2
from app.services.ocr_service import (
    extract_text_from_image,
    parse_ocr_text_to_product,
    split_ingredients_balanced,
    clean_num
)

def test_split_ingredients_balanced():
    raw = "Refined Wheat Flour (Maida) (59%), Sugar, Edible Vegetable Oil (Palm Oil), Butter (2%), Invert Sugar Syrup, Raising Agents [INS 503(ii), INS 500(ii)], Milk Solids, Iodised Salt, Emulsifiers [INS 322] and Artificial Flavouring Substances (Butter, Vanilla)"
    items = split_ingredients_balanced(raw)
    assert len(items) >= 8
    # Ensure nested brackets were not split
    assert any("INS 503(ii), INS 500(ii)" in item for item in items)
    assert any("Butter, Vanilla" in item for item in items)

def test_parse_ocr_text_indian_label():
    ocr_text = """
    BRITANNIA GOOD DAY BUTTER COOKIES
    NUTRITIONAL INFORMATION Per 100g (Approx.)
    Energy (kcal) ........... 494
    Protein (g) ............. 7.0
    Carbohydrate (g) ........ 67.5
    of which Total Sugars (g) 22.0
    Total Fat (g) ........... 22.0
    Saturated Fat (g) ....... 11.0
    Trans Fat (g) ........... 0
    Sodium (mg) ............. 320
    Dietary Fiber (g) ....... 2.5
    INGREDIENTS: Refined Wheat Flour (Maida), Sugar, Palm Oil, Butter, Salt, INS 322.
    Contains Wheat, Milk and Soya.
    """
    prod = parse_ocr_text_to_product(ocr_text)
    assert prod["name"] == "Britannia Good Day Butter Cookies"
    assert prod["nutrition"]["energy_kcal"] == 494.0
    assert prod["nutrition"]["protein_g"] == 7.0
    assert prod["nutrition"]["carbohydrates_g"] == 67.5
    assert prod["nutrition"]["sugars_g"] == 22.0
    assert prod["nutrition"]["fat_g"] == 22.0
    assert prod["nutrition"]["saturated_fat_g"] == 11.0
    assert prod["nutrition"]["sodium_mg"] == 320.0
    assert prod["nutrition"]["fiber_g"] == 2.5
    assert "Wheat" in prod["allergens"]
    assert "Soya" in prod["allergens"]

def test_parse_ocr_text_european_label():
    ocr_text = """
    Énergie / Energy: 1980 kJ / 473 kcal
    Matières grasses / Fat: 19,5 g
    dont acides gras saturés / of which saturates: 8,2 g
    Glucides / Carbohydrate: 67,0 g
    dont sucres / of which sugars: 28,5 g
    Fibres alimentaires / Fibre: 3,4 g
    Protéines / Protein: 5,8 g
    Sel / Salt: 0,75 g
    Ingredients: Wheat Flour, Sugar, Vegetable Oil, Cocoa, Salt.
    """
    prod = parse_ocr_text_to_product(ocr_text)
    assert prod["nutrition"]["energy_kcal"] == 473.0
    assert prod["nutrition"]["fat_g"] == 19.5
    assert prod["nutrition"]["saturated_fat_g"] == 8.2
    assert prod["nutrition"]["carbohydrates_g"] == 67.0
    assert prod["nutrition"]["sugars_g"] == 28.5
    assert prod["nutrition"]["fiber_g"] == 3.4
    assert prod["nutrition"]["protein_g"] == 5.8
    # Salt 0.75g * 400 = 300.0 mg sodium
    assert prod["nutrition"]["sodium_mg"] == 300.0

def test_rapid_ocr_image_extraction():
    # Render an image with clear text and run OCR extraction
    img = np.ones((200, 600, 3), dtype=np.uint8) * 255
    cv2.putText(img, "ENERGY 350 KCAL", (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
    cv2.putText(img, "SUGARS 15.5 G", (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)
    cv2.putText(img, "PROTEIN 9 G", (20, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 0), 2)

    _, buf = cv2.imencode(".png", img)
    img_bytes = buf.tobytes()

    text, conf = extract_text_from_image(img_bytes)
    assert "350" in text
    assert conf > 50.0

    prod = parse_ocr_text_to_product(text)
    assert prod["nutrition"]["energy_kcal"] == 350.0
    assert prod["nutrition"]["sugars_g"] == 15.5
    assert prod["nutrition"]["protein_g"] == 9.0

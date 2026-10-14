from typing import Dict, Any, List, Optional, Union
import httpx
from app.core.config import settings

def format_goals_label(goal: Union[str, List[str]]) -> str:
    """Format single or multiple goals into a natural English title."""
    if isinstance(goal, list):
        items = [str(g).strip().replace("_", " ").title() for g in goal if str(g).strip()]
    elif isinstance(goal, str):
        items = [g.strip().replace("_", " ").title() for g in goal.split(",") if g.strip()]
    else:
        items = ["General Healthy Eating"]
    if not items:
        return "General Healthy Eating"
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + " & " + items[-1]

async def generate_score_explanation(
    product_name: str,
    general_score: float,
    personalized_score: float,
    user_goal: Union[str, List[str]],
    breakdown: Dict[str, Any]
) -> str:
    """Generate plain-English, educational score explanation using OpenAI or intelligent offline generator."""
    goal_label = format_goals_label(user_goal)
    if settings.OPENAI_API_KEY:
        try:
            return await _call_openai_score_explanation(product_name, general_score, personalized_score, goal_label, breakdown)
        except Exception:
            pass

    # Offline intelligent fallback generator
    positives = [p["factor"] for p in breakdown.get("positive", [])]
    negatives = [n["factor"] for n in breakdown.get("negative", [])]
    warnings = [w["factor"] for w in breakdown.get("goal_warnings", [])]

    explanation = f"{product_name} received a General FoodLens score of **{general_score}/100**"
    if personalized_score != general_score:
        explanation += f" and a Personalized Suitability score of **{personalized_score}/100** tailored to your **{goal_label}** goal(s)."
    else:
        explanation += f" for your **{goal_label}** profile."

    details = []
    if positives:
        details.append(f"✓ Key Strengths: {', '.join(positives[:3])}.")
    if negatives:
        details.append(f"⚠ Areas of Concern: {', '.join(negatives[:3])}.")
    if warnings:
        details.append(f"🚨 Goal Specific Alerts: {', '.join(warnings[:2])}.")

    summary_note = "\n\n" + " ".join(details)
    disclaimer = "\n\n*Note: FoodLens provides educational decision-support information, not medical advice or clinical diagnosis.*"

    return explanation + summary_note + disclaimer


async def _call_openai_score_explanation(
    product_name: str,
    general_score: float,
    personalized_score: float,
    user_goal: str,
    breakdown: Dict[str, Any]
) -> str:
    """Call OpenAI Chat Completions API with strict educational guardrails."""
    prompt = f"""
    You are FoodLens AI, an educational food intelligence assistant.
    Product: {product_name}
    General Score: {general_score}/100
    Personalized Score: {personalized_score}/100
    User Goal: {user_goal}
    Positives: {breakdown.get('positive')}
    Negatives: {breakdown.get('negative')}
    Warnings: {breakdown.get('goal_warnings')}

    Write a 2-3 paragraph plain-English summary explaining why this product received these scores.
    Rules:
    - Never diagnose, prescribe, or claim to cure diseases (like diabetes).
    - Do not invent nutritional numbers not provided above.
    - Clearly distinguish raw facts from educational suggestions.
    """
    
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are a helpful food science and nutrition educational assistant."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.5,
        "max_tokens": 250
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(url, headers=headers, json=payload)
        if res.status_code == 200:
            return res.json()["choices"][0]["message"]["content"].strip()
        raise Exception("OpenAI API call failed")


async def generate_healthy_next_step(user_goal: Union[str, List[str]], recent_scores: List[float]) -> str:
    """Generate educational next-step recommendation based on recent intake trends."""
    goal_name = format_goals_label(user_goal)
    avg_score = sum(recent_scores) / len(recent_scores) if recent_scores else 70.0

    if avg_score < 60.0:
        return f"Based on your recent scans, your average product score ({round(avg_score, 1)}/100) is below your **{goal_name}** target. For your next meal, consider choosing fresh whole foods, lower-sodium options, or snacks with at least 3g of dietary fiber."
    else:
        return f"Great job maintaining a solid average score ({round(avg_score, 1)}/100) aligned with your **{goal_name}** goal! To keep up your progress, ensure adequate water intake and balance your next meal with high-quality protein."

from __future__ import annotations

from .risk_engine import analyze_risk
from .spelling_engine import analyze_spelling


def _build_spelling_reason(errors: list[dict]) -> str | None:
    if not errors:
        return None

    examples: list[str] = []
    for error in errors[:4]:
        word = str(error.get("word") or "").strip()
        suggestion = str(error.get("suggestion") or "").strip()
        if not word or not suggestion:
            continue
        examples.append(f'"{word}" -> "{suggestion}"')

    if not examples:
        return "Spelling errors detected in the email."

    suffix = " and more." if len(errors) > len(examples) else "."
    return f"Spelling errors detected in the email: {', '.join(examples)}{suffix}"


def analyze_email_risk(parsed_email: dict) -> dict:
    risk_score, _, _, reasons = analyze_risk(parsed_email)
    spelling_analysis = analyze_spelling(parsed_email)
    spelling_errors = spelling_analysis.get("errors", [])

    if spelling_errors:
        risk_score = min(risk_score + 30, 100)
        spelling_reason = _build_spelling_reason(spelling_errors)
        if spelling_reason:
            reasons.append(spelling_reason)

    if risk_score <= 25:
        risk_level = "SAFE"
        color = "#00C853"
    elif risk_score <= 45:
        risk_level = "SUSPICIOUS"
        color = "#FFD600"
    elif risk_score <= 75:
        risk_level = "HIGH_RISK"
        color = "#FF9100"
    else:
        risk_level = "CRITICAL"
        color = "#D50000"

    print(
        f"[Scanvoro Email Risk] final_risk_score={risk_score} final_risk_level={risk_level} final_color={color}",
        flush=True,
    )

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "color": color,
        "reasons": reasons,
        "spelling_analysis": spelling_analysis,
    }

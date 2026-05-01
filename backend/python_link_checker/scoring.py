from __future__ import annotations

from dataclasses import dataclass

from .features import LinkFeatures
from .parser import ParsedURL


@dataclass(frozen=True)
class RiskAssessment:
    risk_score: int
    classification: str
    reasons: tuple[str, ...]


def _classify(score: int) -> str:
    if score <= 30:
        return "safe"
    if score <= 60:
        return "suspicious"
    return "high-risk"


def assess_risk(parsed_url: ParsedURL, features: LinkFeatures) -> RiskAssessment:
    score = 0
    reasons: list[str] = []

    if not parsed_url.domain:
        return RiskAssessment(
            risk_score=100,
            classification="high-risk",
            reasons=("The URL is invalid and no domain could be extracted.",),
        )

    if not features.has_https:
        score += 15
        reasons.append("The URL does not use HTTPS.")

    if features.uses_ip_address:
        score += 25
        reasons.append("The URL uses an IP address instead of a normal domain name.")

    if features.subdomain_count > 2:
        score += 10
        reasons.append("The URL contains more than two subdomains.")

    if features.domain_length > 25:
        score += 10
        reasons.append("The domain is unusually long.")

    if features.contains_suspicious_keywords:
        score += 20
        reasons.append(
            f"The URL contains suspicious keywords: {', '.join(features.matched_keywords)}."
        )

    if features.tld_risk_level == "high":
        score += 15
        reasons.append(f"The URL uses a high-risk top-level domain: {parsed_url.tld}.")
    elif features.tld_risk_level == "medium":
        reasons.append(f"The URL uses a medium-risk top-level domain: {parsed_url.tld}.")

    if features.is_brand_impersonation:
        score += 30
        reasons.append(
            f"The domain appears to imitate the trusted brand '{features.impersonated_brand}'."
        )

    if features.entropy_score >= 3.6:
        score += 20
        reasons.append("The domain looks highly random or algorithmically generated.")

    if features.is_trusted_domain and score == 0:
        reasons.append("The domain exactly matches a trusted domain or valid subdomain.")

    if not reasons:
        reasons.append("No high-confidence phishing indicators were detected by the offline rule set.")

    risk_score = max(0, min(100, score))

    return RiskAssessment(
        risk_score=risk_score,
        classification=_classify(risk_score),
        reasons=tuple(reasons),
    )

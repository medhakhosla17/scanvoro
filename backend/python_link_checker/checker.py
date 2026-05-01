from __future__ import annotations

from .features import extract_features
from .parser import parse_url
from .scoring import assess_risk


def check_link(url: str) -> dict:
    parsed_url = parse_url(url)
    features = extract_features(parsed_url)
    assessment = assess_risk(parsed_url, features)

    return {
        "url": url,
        "domain": parsed_url.domain,
        "risk_score": assessment.risk_score,
        "classification": assessment.classification,
        "features": {
            "has_https": features.has_https,
            "uses_ip_address": features.uses_ip_address,
            "domain_length": features.domain_length,
            "subdomain_count": features.subdomain_count,
            "contains_suspicious_keywords": features.contains_suspicious_keywords,
            "is_brand_impersonation": features.is_brand_impersonation,
            "tld_risk_level": features.tld_risk_level,
            "entropy_score": features.entropy_score,
        },
        "reasons": list(assessment.reasons),
    }

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from ipaddress import ip_address

from .constants import (
    BRAND_TARGETS,
    HIGH_RISK_TLDS,
    MEDIUM_RISK_TLDS,
    SUSPICIOUS_KEYWORDS,
    TRUSTED_DOMAINS,
    TRUSTED_HOSTNAME_TOKENS,
)
from .parser import ParsedURL


@dataclass(frozen=True)
class LinkFeatures:
    has_https: bool
    uses_ip_address: bool
    domain_length: int
    subdomain_count: int
    contains_suspicious_keywords: bool
    is_brand_impersonation: bool
    tld_risk_level: str
    entropy_score: float
    matched_keywords: tuple[str, ...]
    impersonated_brand: str | None
    is_trusted_domain: bool


def _domain_label(main_domain: str) -> str:
    return main_domain.split(".")[0] if main_domain else ""


def _normalize_brand_text(value: str) -> str:
    substitutions = str.maketrans({
        "0": "o",
        "1": "l",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
        "@": "a",
        "$": "s",
    })
    return re.sub(r"[^a-z]", "", value.lower().translate(substitutions))


def _collapse_repeated_letters(value: str) -> str:
    return re.sub(r"(.)\1+", r"\1", value)


def _levenshtein_distance(left: str, right: str) -> int:
    if left == right:
        return 0
    if not left:
        return len(right)
    if not right:
        return len(left)

    previous = list(range(len(right) + 1))
    for row_index, left_char in enumerate(left, start=1):
        current = [row_index]
        for column_index, right_char in enumerate(right, start=1):
            insert_cost = current[column_index - 1] + 1
            delete_cost = previous[column_index] + 1
            replace_cost = previous[column_index - 1] + (left_char != right_char)
            current.append(min(insert_cost, delete_cost, replace_cost))
        previous = current
    return previous[-1]


def _jaro_similarity(left: str, right: str) -> float:
    if left == right:
        return 1.0
    if not left or not right:
        return 0.0

    match_distance = max(len(left), len(right)) // 2 - 1
    left_matches = [False] * len(left)
    right_matches = [False] * len(right)

    matches = 0
    for index, char in enumerate(left):
        start = max(0, index - match_distance)
        end = min(index + match_distance + 1, len(right))
        for offset in range(start, end):
            if right_matches[offset] or char != right[offset]:
                continue
            left_matches[index] = True
            right_matches[offset] = True
            matches += 1
            break

    if not matches:
        return 0.0

    transpositions = 0
    pointer = 0
    for index, matched in enumerate(left_matches):
        if not matched:
            continue
        while not right_matches[pointer]:
            pointer += 1
        if left[index] != right[pointer]:
            transpositions += 1
        pointer += 1

    return (
        (matches / len(left))
        + (matches / len(right))
        + ((matches - transpositions / 2) / matches)
    ) / 3


def _jaro_winkler_similarity(left: str, right: str) -> float:
    jaro = _jaro_similarity(left, right)
    prefix = 0
    max_prefix = min(4, len(left), len(right))
    while prefix < max_prefix and left[prefix] == right[prefix]:
        prefix += 1
    return jaro + prefix * 0.1 * (1 - jaro)


def _is_single_transposition(left: str, right: str) -> bool:
    if len(left) != len(right) or left == right:
        return False

    mismatches = [index for index, pair in enumerate(zip(left, right)) if pair[0] != pair[1]]
    if len(mismatches) != 2:
        return False

    first, second = mismatches
    return second == first + 1 and left[first] == right[second] and left[second] == right[first]


def _is_ip_address(domain: str) -> bool:
    try:
        ip_address(domain)
        return True
    except ValueError:
        return False


def _has_excessive_repeated_characters(label: str) -> bool:
    return bool(re.search(r"(.)\1{3,}", label or "", re.IGNORECASE))


def _entropy_score(text: str) -> float:
    normalized = text or ""
    if not normalized:
        return 0.0

    length = len(normalized)
    frequencies = [normalized.count(char) / length for char in set(normalized)]
    return round(-sum(probability * math.log2(probability) for probability in frequencies), 3)


def _keyword_matches(parsed_url: ParsedURL) -> tuple[str, ...]:
    haystack = " ".join(
        part for part in (parsed_url.domain, parsed_url.path, parsed_url.original_url.lower()) if part
    )
    return tuple(keyword for keyword in SUSPICIOUS_KEYWORDS if keyword in haystack)


def _trusted_domain_match(domain: str) -> bool:
    return any(domain == trusted or domain.endswith(f".{trusted}") for trusted in TRUSTED_DOMAINS)


def _brand_impersonation(domain: str, main_domain: str) -> tuple[bool, str | None]:
    if _trusted_domain_match(domain):
        return False, None

    candidate = _normalize_brand_text(_domain_label(main_domain))
    if not candidate:
        return False, None

    for brand in BRAND_TARGETS:
        normalized_brand = _normalize_brand_text(brand)
        if candidate == normalized_brand:
            return True, brand
        if normalized_brand in candidate and candidate != normalized_brand:
            return True, brand
        if _levenshtein_distance(candidate, normalized_brand) <= 1:
            return True, brand
        if _is_single_transposition(candidate, normalized_brand):
            return True, brand
        if abs(len(candidate) - len(normalized_brand)) == 1 and _levenshtein_distance(candidate, normalized_brand) == 1:
            return True, brand
        if _jaro_winkler_similarity(candidate, normalized_brand) >= 0.93:
            return True, brand

    return False, None


def _token_impersonation(domain: str) -> tuple[bool, str | None]:
    normalized_parts = [part for part in re.split(r"\.", domain) if part]

    for raw_token in normalized_parts:
        candidate = _normalize_brand_text(raw_token)
        if not candidate:
            continue

        for trusted_token in TRUSTED_HOSTNAME_TOKENS:
            normalized_trusted = _normalize_brand_text(trusted_token)
            if candidate == normalized_trusted:
                continue
            if _levenshtein_distance(candidate, normalized_trusted) <= 1:
                return True, trusted_token
            if _is_single_transposition(candidate, normalized_trusted):
                return True, trusted_token
            if abs(len(candidate) - len(normalized_trusted)) == 1 and _levenshtein_distance(candidate, normalized_trusted) == 1:
                return True, trusted_token
            if _jaro_winkler_similarity(candidate, normalized_trusted) >= 0.93:
                return True, trusted_token

    return False, None


def _tld_risk_level(tld: str) -> str:
    if tld in HIGH_RISK_TLDS:
        return "high"
    if tld in MEDIUM_RISK_TLDS:
        return "medium"
    return "low"


def extract_features(parsed_url: ParsedURL) -> LinkFeatures:
    matched_keywords = _keyword_matches(parsed_url)
    is_brand_impersonation, impersonated_brand = _brand_impersonation(parsed_url.domain, parsed_url.main_domain)
    if not is_brand_impersonation:
        is_brand_impersonation, impersonated_brand = _token_impersonation(parsed_url.domain)

    return LinkFeatures(
        has_https=parsed_url.protocol == "https",
        uses_ip_address=_is_ip_address(parsed_url.domain),
        domain_length=len(parsed_url.domain),
        subdomain_count=len(parsed_url.subdomains),
        contains_suspicious_keywords=bool(matched_keywords),
        is_brand_impersonation=is_brand_impersonation,
        tld_risk_level=_tld_risk_level(parsed_url.tld),
        entropy_score=_entropy_score(_domain_label(parsed_url.main_domain)),
        matched_keywords=matched_keywords,
        impersonated_brand=impersonated_brand,
        is_trusted_domain=_trusted_domain_match(parsed_url.domain),
    )

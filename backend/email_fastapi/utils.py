from __future__ import annotations

import re
from difflib import SequenceMatcher

SHORTENER_DOMAINS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "rebrand.ly",
    "cutt.ly",
    "shorturl.at",
}

FREE_EMAIL_DOMAINS = {
    "gmail.com",
    "outlook.com",
    "hotmail.com",
    "yahoo.com",
    "icloud.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
}

TRUSTED_BRANDS = {
    "paypal": ["paypal.com"],
    "google": ["google.com"],
    "microsoft": ["microsoft.com", "office.com", "outlook.com"],
    "apple": ["apple.com", "icloud.com"],
    "amazon": ["amazon.com"],
    "bank": [],
}

PHISHING_PHRASES = [
    "urgent",
    "verify immediately",
    "account suspended",
    "suspended",
    "verify your account",
    "act now",
    "security alert",
    "click here",
    "confirm your identity",
    "password reset",
    "unauthorized login",
    "payment failed",
    "claim your reward",
    "limited time",
]

GENERIC_GREETINGS = [
    "dear customer",
    "dear user",
    "valued customer",
    "dear account holder",
]

BRAND_TERMS = {
    "paypal",
    "google",
    "microsoft",
    "apple",
    "amazon",
    "bank",
    "security team",
    "support team",
}

URL_PATTERN = re.compile(r"https?://[^\s<>()]+", re.IGNORECASE)
EMAIL_PATTERN = re.compile(r"([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})", re.IGNORECASE)


def normalize_domain(domain: str) -> str:
    return domain.lower().strip().removeprefix("www.")


def extract_domain(value: str) -> str:
    if "@" in value:
        return normalize_domain(value.split("@", 1)[1])
    cleaned = re.sub(r"^https?://", "", value, flags=re.IGNORECASE)
    return normalize_domain(cleaned.split("/", 1)[0])


def find_urls(text: str) -> list[str]:
    return URL_PATTERN.findall(text or "")


def similarity_ratio(left: str, right: str) -> float:
    return SequenceMatcher(None, left, right).ratio()


def find_brand_mentions(text: str) -> list[str]:
    lower_text = (text or "").lower()
    return [term for term in BRAND_TERMS if term in lower_text]


def detect_lookalike_domain(domain: str) -> tuple[str | None, str | None]:
    normalized = normalize_domain(domain)
    root = normalized.split(".")[0]

    for brand, valid_domains in TRUSTED_BRANDS.items():
        if root == brand:
            continue

        if similarity_ratio(root, brand) >= 0.8:
            return brand, valid_domains[0] if valid_domains else None

    return None, None

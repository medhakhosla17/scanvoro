from __future__ import annotations

import re
from urllib.parse import urlparse

from .utils import SHORTENER_DOMAINS, TRUSTED_BRANDS, detect_lookalike_domain, extract_domain, find_brand_mentions

HTML_TAG_PATTERN = re.compile(r"<[^>]+>")

URGENCY_PATTERNS = (
    "urgent action required",
    "account will be closed",
    "immediate response needed",
    "urgent",
    "immediately",
    "final warning",
    "act now",
    "account will be suspended",
    "suspended unless",
    "within 24 hours",
    "immediate payment required",
    "failure to act",
    "restore access immediately",
)

FINANCIAL_REQUEST_PATTERNS = (
    "bank details",
    "payment request",
    "refund claim",
    "crypto transfer",
    "wire transfer",
    "transfer funds",
    "send payment",
    "invoice payment",
    "payment failed",
    "refund",
    "bank account",
    "credit card",
    "debit card",
    "password",
    "otp",
    "pin",
    "invoice",
    "outstanding invoice",
    "settle the invoice",
    "overdue",
    "legal action",
    "vendor transfer",
    "confidential transfer",
    "process a quick confidential transfer",
    "pay now",
)

IMPERSONATION_PATTERNS = (
    "security team",
    "support team",
    "billing team",
    "payment team",
    "bank security team",
    "accounts department",
    "courier service",
    "microsoft security alert",
    "apple support",
    "ceo",
    "bank",
    "government",
    "microsoft",
    "google",
    "apple",
    "paypal",
    "amazon",
)

MANIPULATION_PATTERNS = (
    "your account is locked",
    "account will be suspended",
    "unauthorized login",
    "you won a prize",
    "claim your reward",
    "limited time",
    "avoid disruption",
    "your account will be closed",
    "legal action",
    "permanent suspension",
    "keep this private",
    "i'm in a meeting and unavailable",
    "virus detected on your device",
    "infected with",
    "no one was available",
)

CLICK_PATTERNS = (
    "click here to verify",
    "verify now",
    "login here",
    "click here",
    "schedule redelivery here",
    "pay now",
)

ATTACHMENT_PATTERNS = re.compile(
    r"\b(?:attachment|attached|invoice_\d+|[\w.-]+\.(?:zip|rar|7z|exe|scr|js|docm|xlsm))\b",
    re.IGNORECASE,
)

GENERIC_GREETING_PATTERNS = (
    "dear customer",
    "dear user",
    "dear sir/madam",
    "sir/madam",
    "hi customer",
    "hello,",
)


def risk_level_for_score(score: int) -> str:
    if score <= 25:
        return "SAFE"
    if score <= 45:
        return "LOW_RISK"
    if score <= 75:
        return "HIGH_RISK"
    return "CRITICAL"


def color_for_score(score: int) -> str:
    if score <= 25:
        return "#00C853"
    if score <= 45:
        return "#FFD600"
    if score <= 75:
        return "#FF9100"
    return "#D50000"


def _normalize_for_risk(text: str) -> str:
    normalized = HTML_TAG_PATTERN.sub(" ", text or "")
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.lower().strip()


def _detect_urgency(normalized_text: str) -> tuple[int, str | None]:
    if any(pattern in normalized_text for pattern in URGENCY_PATTERNS):
        return 20, "Urgency language detected."
    return 0, None


def _detect_financial_requests(normalized_text: str) -> tuple[int, str | None]:
    if any(pattern in normalized_text for pattern in FINANCIAL_REQUEST_PATTERNS):
        return 30, "Payment, transfer, invoice, or credential request detected."
    return 0, None


def _detect_invoice_attachment(normalized_text: str) -> tuple[int, str | None]:
    has_attachment = ATTACHMENT_PATTERNS.search(normalized_text) is not None
    has_invoice_context = any(term in normalized_text for term in ("invoice", "payment", "receipt", "account"))

    if has_attachment and has_invoice_context:
        return 15, "Invoice or payment attachment mentioned. Treat the file with caution before opening or downloading."

    if has_attachment:
        return 10, "Attachment mentioned. Be cautious before opening or downloading the file."

    return 0, None


def _detect_impersonation(normalized_text: str, sender_domain: str) -> tuple[int, str | None]:
    matched_brand_mentions = find_brand_mentions(normalized_text)
    if any(pattern in normalized_text for pattern in IMPERSONATION_PATTERNS):
        return 25, "Impersonation pattern detected."

    for mention in matched_brand_mentions:
        valid_domains = TRUSTED_BRANDS.get(mention, [])
        if valid_domains and sender_domain and sender_domain not in valid_domains:
            return 25, "Brand impersonation pattern detected."

    return 0, None


def _detect_manipulation(normalized_text: str) -> tuple[int, str | None]:
    if any(pattern in normalized_text for pattern in MANIPULATION_PATTERNS):
        return 20, "Psychological manipulation or fear tactic detected."
    return 0, None


def _detect_generic_greeting(normalized_text: str, current_reasons: list[str]) -> tuple[int, str | None]:
    if current_reasons and any(pattern in normalized_text for pattern in GENERIC_GREETING_PATTERNS):
        return 10, "Generic greeting used with other suspicious signals."
    return 0, None


def _detect_suspicious_links(normalized_text: str, urls: list[str], sender_domain: str) -> tuple[int, str | None]:
    score = 0
    severity = 0

    if any(pattern in normalized_text for pattern in CLICK_PATTERNS):
        severity += 1

    for url in urls:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        path = (parsed.path or "").lower()
        linked_domain = extract_domain(url)
        url_severity = 0

        if hostname in SHORTENER_DOMAINS:
            url_severity += 1
        if hostname.endswith((".xyz", ".top", ".click", ".site")):
            url_severity += 1
        if not hostname.endswith((".com", ".org", ".net", ".edu", ".gov", ".co")):
            url_severity += 1
        if any(term in path for term in ("login", "verify", "signin", "account", "update")):
            url_severity += 1
        if sender_domain and linked_domain and linked_domain != sender_domain:
            url_severity += 1
        if hostname.count("-") >= 2 and sum(term in hostname for term in ("secure", "payment", "payments", "alert", "support", "verify")) >= 2:
            url_severity += 1

        lookalike_brand, _ = detect_lookalike_domain(hostname)
        if lookalike_brand:
            url_severity += 1

        severity = max(severity, url_severity)

    if severity >= 3:
        score = 30
    elif severity >= 1:
        score = 25

    if score:
        return score, "Suspicious link or domain detected."
    return 0, None


def analyze_risk(parsed_email: dict) -> tuple[int, str, str, list[str]]:
    sender = parsed_email.get("sender") or ""
    subject = parsed_email.get("subject") or ""
    body = parsed_email.get("body") or ""
    urls = parsed_email.get("urls") or []
    sender_domain = extract_domain(sender) if sender else ""
    normalized_text = _normalize_for_risk(f"{subject}\n{body}")

    risk_score = 0
    reasons: list[str] = []

    for detector in (
        lambda: _detect_urgency(normalized_text),
        lambda: _detect_financial_requests(normalized_text),
        lambda: _detect_invoice_attachment(normalized_text),
        lambda: _detect_suspicious_links(normalized_text, urls, sender_domain),
        lambda: _detect_impersonation(normalized_text, sender_domain),
        lambda: _detect_manipulation(normalized_text),
    ):
        score, reason = detector()
        risk_score += score
        if reason:
            reasons.append(reason)

    greeting_score, greeting_reason = _detect_generic_greeting(normalized_text, reasons)
    risk_score += greeting_score
    if greeting_reason:
        reasons.append(greeting_reason)

    risk_score = min(risk_score, 100)
    risk_level = risk_level_for_score(risk_score)
    color = color_for_score(risk_score)
    return risk_score, risk_level, color, reasons

from __future__ import annotations

import re
from urllib.parse import urlparse

from .dictionary import STANDARD_ENGLISH_WORDS
from .utils import TRUSTED_BRANDS, extract_domain

TOKEN_PATTERN = re.compile(r"\b[a-zA-Z']+\b")
CORRUPTED_TOKEN_PATTERN = re.compile(r"[A-Za-z][^\sA-Za-z0-9'/-]+[A-Za-z]")
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")

COMMON_EMAIL_WORDS = {
    "about",
    "account",
    "accounts",
    "act",
    "action",
    "add",
    "agenda",
    "alert",
    "anything",
    "attached",
    "attachment",
    "availability",
    "available",
    "bank",
    "before",
    "body",
    "business",
    "call",
    "change",
    "check",
    "claim",
    "click",
    "close",
    "closed",
    "company",
    "confirm",
    "confirmation",
    "crypto",
    "customer",
    "customers",
    "day",
    "dear",
    "delivery",
    "details",
    "discuss",
    "discussion",
    "document",
    "documents",
    "email",
    "finance",
    "financial",
    "friday",
    "government",
    "here",
    "hours",
    "held",
    "hello",
    "hi",
    "identity",
    "immediate",
    "immediately",
    "invoice",
    "know",
    "let",
    "link",
    "links",
    "like",
    "locked",
    "login",
    "lunch",
    "meeting",
    "meetings",
    "monday",
    "money",
    "next",
    "notice",
    "now",
    "otp",
    "overdue",
    "password",
    "payment",
    "payments",
    "please",
    "portal",
    "prize",
    "progress",
    "project",
    "processed",
    "refund",
    "regards",
    "recent",
    "reminder",
    "reply",
    "request",
    "requested",
    "reports",
    "response",
    "review",
    "reward",
    "safe",
    "salary",
    "schedule",
    "scheduled",
    "secure",
    "security",
    "sender",
    "service",
    "services",
    "sprint",
    "statement",
    "subject",
    "submit",
    "support",
    "suspended",
    "suspicious",
    "task",
    "tasks",
    "team",
    "temporary",
    "temporarily",
    "thanks",
    "thursday",
    "today",
    "tomorrow",
    "transfer",
    "tuesday",
    "update",
    "urgent",
    "verify",
    "weekly",
    "wednesday",
    "winner",
    "won",
    "would",
    "wasn",
    "wasnt",
    "zip",
}

SCAM_VOCABULARY = {
    "account",
    "alert",
    "bank",
    "click",
    "closed",
    "confirm",
    "crypto",
    "identity",
    "immediately",
    "login",
    "otp",
    "password",
    "payment",
    "refund",
    "secure",
    "security",
    "support",
    "urgent",
    "verify",
}


def _clean_text_for_spelling(text: str) -> str:
    cleaned = HTML_TAG_PATTERN.sub(" ", text or "")
    cleaned = cleaned.replace("’", "'").replace("‘", "'")
    cleaned = re.sub(r"https?://[^\s<>()]+", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", " ", cleaned, flags=re.IGNORECASE)
    return cleaned


def _levenshtein_distance(left: str, right: str) -> int:
    if left == right:
        return 0
    if not left:
        return len(right)
    if not right:
        return len(left)

    previous = list(range(len(right) + 1))
    for index, left_char in enumerate(left, start=1):
        current = [index]
        for inner_index, right_char in enumerate(right, start=1):
            insert_cost = current[inner_index - 1] + 1
            delete_cost = previous[inner_index] + 1
            replace_cost = previous[inner_index - 1] + (left_char != right_char)
            current.append(min(insert_cost, delete_cost, replace_cost))
        previous = current
    return previous[-1]


def _candidate_words() -> set[str]:
    trusted_brand_tokens = set(TRUSTED_BRANDS.keys())
    return STANDARD_ENGLISH_WORDS | COMMON_EMAIL_WORDS | SCAM_VOCABULARY | trusted_brand_tokens


def _is_known_word_variant(token: str, candidates: set[str]) -> bool:
    if re.fullmatch(r"[a-z]+['?][a-z]+", token) and token.replace("'", "").replace("?", "") in candidates:
        return True
    if token.endswith("ss") and token[:-1] in candidates:
        return False
    if token.endswith("s") and token[:-1] in candidates:
        return True
    if token.endswith("es") and token[:-2] in candidates:
        return True
    if token.endswith("ed") and (token[:-2] in candidates or f"{token[:-2]}e" in candidates):
        return True
    if token.endswith("ing") and (token[:-3] in candidates or f"{token[:-3]}e" in candidates):
        return True
    if token.endswith("ly") and token[:-2] in candidates:
        return True
    if token.endswith("ation") and token[:-5] in candidates:
        return True
    return False


def _context_tokens(parsed_email: dict) -> set[str]:
    tokens: set[str] = set()

    sender = parsed_email.get("sender") or ""
    sender_domain = extract_domain(sender) if sender else ""
    urls = parsed_email.get("urls") or []

    for value in [sender_domain, *urls]:
        parsed_value = urlparse(value if "://" in value else f"https://{value}")
        hostname = (parsed_value.hostname or "").lower()
        for token in re.findall(r"[a-z0-9]+", hostname):
            if token:
                tokens.add(token)

    return tokens


def _best_suggestion(word: str, candidates: set[str]) -> str | None:
    best_word = None
    best_distance = 3

    for candidate in candidates:
        if abs(len(candidate) - len(word)) > 2:
            continue
        distance = _levenshtein_distance(word, candidate)
        if len(word) <= 4 and distance > 1:
            continue
        if distance < best_distance:
            best_distance = distance
            best_word = candidate
            if distance == 1:
                break

    return best_word if best_distance <= 2 else None


def _is_probable_proper_noun(token: str, source_text: str, start_index: int) -> bool:
    if not (token[:1].isupper() and token[1:].islower()):
        return False

    previous_text = source_text[:start_index].rstrip()
    if not previous_text:
        return False
    return previous_text[-1] not in ".!?:\n"


def analyze_spelling(parsed_email: dict) -> dict:
    text = parsed_email.get("body") or parsed_email.get("subject") or ""
    cleaned = _clean_text_for_spelling(f"{parsed_email.get('subject') or ''}\n{text}")
    candidates = _candidate_words()
    context_tokens = _context_tokens(parsed_email)
    errors: list[dict[str, str]] = []
    seen_words: set[str] = set()

    for raw_token in re.findall(r"\S+", cleaned):
        core = raw_token.strip("()[]{}<>\"'.,!?;:")
        if not core or core.lower() in seen_words:
            continue
        if not CORRUPTED_TOKEN_PATTERN.search(core):
            continue

        normalized = core.lower()
        collapsed = re.sub(r"[^a-z']", "", normalized)
        if len(collapsed) < 3:
            continue

        suggestion = collapsed if collapsed in candidates else _best_suggestion(collapsed, candidates)
        if suggestion == collapsed and _is_known_word_variant(normalized, candidates):
            seen_words.add(normalized)
            continue
        if suggestion:
            errors.append({"word": core, "suggestion": suggestion})
            seen_words.add(normalized)

    for match in TOKEN_PATTERN.finditer(cleaned):
        token = match.group(0)
        normalized = token.lower().replace("'", "")
        if len(normalized) < 3 or normalized in seen_words:
            continue
        if (
            normalized in candidates
            or normalized in context_tokens
            or normalized in SCAM_VOCABULARY
            or _is_known_word_variant(normalized, candidates)
        ):
            continue
        if _is_probable_proper_noun(token, cleaned, match.start()):
            continue

        suggestion = _best_suggestion(normalized, candidates)
        if suggestion:
            errors.append({"word": token, "suggestion": suggestion})
            seen_words.add(normalized)

    return {"errors": errors}

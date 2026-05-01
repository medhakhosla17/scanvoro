from __future__ import annotations

import re

from .utils import EMAIL_PATTERN, find_urls


def parse_email_text(email_text: str) -> dict:
    text = email_text.strip()
    lines = [line.rstrip() for line in text.splitlines()]

    sender = None
    subject = None
    body_start = 0

    for index, line in enumerate(lines):
        stripped = line.strip()

        if stripped.lower().startswith("from:") and sender is None:
            match = EMAIL_PATTERN.search(stripped)
            sender = match.group(1) if match else stripped.split(":", 1)[1].strip()
            body_start = index + 1
            continue

        if stripped.lower().startswith("subject:") and subject is None:
            subject = stripped.split(":", 1)[1].strip()
            body_start = index + 1
            continue

        if not stripped and index > 0:
            body_start = index + 1
            break

    body = "\n".join(lines[body_start:]).strip() or text

    return {
        "sender": sender,
        "subject": subject,
        "body": body,
        "urls": find_urls(text),
    }


def count_basic_writing_issues(text: str) -> tuple[int, list[str]]:
    reasons: list[str] = []
    issue_points = 0
    normalized_text = text.strip()
    lowered = normalized_text.lower()

    if normalized_text.count("!!") > 0 or normalized_text.count("???") > 0:
        issue_points += 5
        reasons.append("The email uses excessive punctuation, which is common in scam messages.")

    if re.search(r"\b(?:pls|kindly do the needful|immediatly|verfy|accunt|suspnded)\b", lowered):
        issue_points += 5
        reasons.append("The email contains obvious spelling or phrasing problems.")

    common_mistakes = {
        "quic": "quick",
        "immediatly": "immediately",
        "verfy": "verify",
        "accunt": "account",
        "suspnded": "suspended",
        "recieve": "receive",
        "teh": "the",
    }
    for wrong, correct in common_mistakes.items():
        if re.search(rf"\b{re.escape(wrong)}\b", lowered):
            issue_points += 4
            reasons.append(f"Detected spelling error: '{wrong}' instead of '{correct}'.")

    lines = [line.strip() for line in normalized_text.splitlines() if line.strip()]
    malformed_sentences = 0
    for line in lines:
        if len(line.split()) >= 8 and not re.search(r"[.!?]$", line):
            malformed_sentences += 1
        if re.search(r"\b(?:please verify now at|confirm your password and otp)\b", line.lower()):
            issue_points += 2
            reasons.append("The sentence structure contains suspiciously compressed phishing phrasing.")

    if malformed_sentences >= 2:
        issue_points += 5
        reasons.append("Several long lines are missing normal sentence punctuation.")

    return issue_points, reasons

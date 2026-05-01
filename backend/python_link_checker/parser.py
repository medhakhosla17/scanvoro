from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse

COMPOUND_SUFFIXES = {"com.au", "net.au", "org.au", "co.uk", "org.uk", "gov.uk", "co.nz", "co.in"}


@dataclass(frozen=True)
class ParsedURL:
    original_url: str
    protocol: str
    domain: str
    main_domain: str
    subdomains: tuple[str, ...]
    path: str
    tld: str


def _normalize_domain(hostname: str) -> str:
    normalized = (hostname or "").strip().lower()
    if normalized.startswith("www."):
        normalized = normalized[4:]
    return normalized


def _split_domain(domain: str) -> tuple[str, tuple[str, ...], str]:
    parts = tuple(part for part in domain.split(".") if part)
    if len(parts) >= 3 and ".".join(parts[-2:]) in COMPOUND_SUFFIXES:
        main_domain = ".".join(parts[-3:])
        subdomains = parts[:-3]
        tld = f".{parts[-2]}.{parts[-1]}"
    elif len(parts) >= 2:
        main_domain = ".".join(parts[-2:])
        subdomains = parts[:-2]
        tld = f".{parts[-1]}"
    else:
        main_domain = domain
        subdomains = ()
        tld = ""
    return main_domain, subdomains, tld


def parse_url(url: str) -> ParsedURL:
    candidate = (url or "").strip()
    parsed = urlparse(candidate)

    if not parsed.scheme and not parsed.netloc:
        parsed = urlparse(f"http://{candidate}")

    domain = _normalize_domain(parsed.hostname or "")
    main_domain, subdomains, tld = _split_domain(domain)

    return ParsedURL(
        original_url=candidate,
        protocol=(parsed.scheme or "").lower(),
        domain=domain,
        main_domain=main_domain,
        subdomains=subdomains,
        path=parsed.path or "",
        tld=tld.lower(),
    )

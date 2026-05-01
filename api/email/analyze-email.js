const URL_PATTERN = /https?:\/\/[^\s<>()]+/gi;
const EMAIL_PATTERN = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;

const urgencyPatterns = [
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
];

const financialRequestPatterns = [
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
];

const impersonationPatterns = [
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
];

const manipulationPatterns = [
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
];

const clickPatterns = ["click here to verify", "verify now", "login here", "click here", "schedule redelivery here", "pay now"];
const genericGreetingPatterns = ["dear customer", "dear user", "dear sir/madam", "sir/madam", "hi customer", "hello,"];
const shortenerDomains = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at"]);

function clampScore(score) {
  return Math.max(0, Math.min(100, score));
}

function riskLevelForScore(score) {
  if (score <= 25) return "SAFE";
  if (score <= 45) return "SUSPICIOUS";
  if (score <= 75) return "HIGH_RISK";
  return "CRITICAL";
}

function colorForScore(score) {
  if (score <= 25) return "#00C853";
  if (score <= 45) return "#FFD600";
  if (score <= 75) return "#FF9100";
  return "#D50000";
}

function parseEmailText(emailText) {
  const text = String(emailText || "").trim();
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+$/g, ""));
  let sender = null;
  let subject = null;
  let bodyStart = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const stripped = line.trim();

    if (/^from:/i.test(stripped) && sender === null) {
      const match = stripped.match(EMAIL_PATTERN);
      sender = match ? match[1] : stripped.split(":", 2)[1]?.trim() || "";
      bodyStart = index + 1;
      continue;
    }

    if (/^subject:/i.test(stripped) && subject === null) {
      subject = stripped.split(":", 2)[1]?.trim() || "";
      bodyStart = index + 1;
      continue;
    }

    if (!stripped && index > 0) {
      bodyStart = index + 1;
      break;
    }
  }

  return {
    sender,
    subject,
    body: lines.slice(bodyStart).join("\n").trim() || text,
    urls: text.match(URL_PATTERN) || [],
  };
}

function normalizeForRisk(text) {
  return String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function extractDomain(value) {
  const cleaned = String(value || "").toLowerCase().trim().replace(/^https?:\/\//, "");
  if (cleaned.includes("@")) {
    return cleaned.split("@").pop().replace(/^www\./, "");
  }
  return cleaned.split("/")[0].replace(/^www\./, "");
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function detectSuspiciousLinks(normalizedText, urls, senderDomain) {
  let severity = hasAny(normalizedText, clickPatterns) ? 1 : 0;

  urls.forEach((url) => {
    let urlSeverity = 0;
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      const path = parsed.pathname.toLowerCase();
      const linkedDomain = extractDomain(url);

      if (shortenerDomains.has(hostname)) urlSeverity += 1;
      if (/\.(xyz|top|click|site)$/i.test(hostname)) urlSeverity += 1;
      if (!/\.(com|org|net|edu|gov|co)$/i.test(hostname)) urlSeverity += 1;
      if (/(login|verify|signin|account|update)/i.test(path)) urlSeverity += 1;
      if (senderDomain && linkedDomain && linkedDomain !== senderDomain) urlSeverity += 1;
      if ((hostname.match(/-/g) || []).length >= 2 && ["secure", "payment", "payments", "alert", "support", "verify"].filter((term) => hostname.includes(term)).length >= 2) {
        urlSeverity += 1;
      }
    } catch {
      urlSeverity += 1;
    }
    severity = Math.max(severity, urlSeverity);
  });

  if (severity >= 3) return [30, "Suspicious link or domain detected."];
  if (severity >= 1) return [25, "Suspicious link or domain detected."];
  return [0, null];
}

function detectAttachment(normalizedText) {
  const hasAttachment = /\b(?:attachment|attached|invoice_\d+|[\w.-]+\.(?:zip|rar|7z|exe|scr|js|docm|xlsm))\b/i.test(normalizedText);
  const hasInvoiceContext = /\b(invoice|payment|receipt|account)\b/i.test(normalizedText);

  if (hasAttachment && hasInvoiceContext) {
    return [15, "Invoice or payment attachment mentioned. Treat the file with caution before opening or downloading."];
  }

  if (hasAttachment) {
    return [10, "Attachment mentioned. Be cautious before opening or downloading the file."];
  }

  return [0, null];
}

function analyzeEmail(emailText) {
  const parsed = parseEmailText(emailText);
  const senderDomain = parsed.sender ? extractDomain(parsed.sender) : "";
  const normalizedText = normalizeForRisk(`${parsed.subject || ""}\n${parsed.body || ""}`);
  let riskScore = 0;
  const reasons = [];

  const detectors = [
    () => (hasAny(normalizedText, urgencyPatterns) ? [20, "Urgency language detected."] : [0, null]),
    () => (hasAny(normalizedText, financialRequestPatterns) ? [30, "Payment, transfer, invoice, or credential request detected."] : [0, null]),
    () => detectAttachment(normalizedText),
    () => detectSuspiciousLinks(normalizedText, parsed.urls, senderDomain),
    () => (hasAny(normalizedText, impersonationPatterns) ? [25, "Impersonation pattern detected."] : [0, null]),
    () => (hasAny(normalizedText, manipulationPatterns) ? [20, "Psychological manipulation or fear tactic detected."] : [0, null]),
  ];

  detectors.forEach((detector) => {
    const [score, reason] = detector();
    riskScore += score;
    if (reason) reasons.push(reason);
  });

  if (reasons.length && hasAny(normalizedText, genericGreetingPatterns)) {
    riskScore += 10;
    reasons.push("Generic greeting used with other suspicious signals.");
  }

  riskScore = clampScore(riskScore);

  if (!reasons.length) {
    reasons.push("No suspicious patterns were detected by the current email rules.");
  }

  return {
    risk_score: riskScore,
    risk_level: riskLevelForScore(riskScore),
    color: colorForScore(riskScore),
    reasons,
    spelling_analysis: { errors: [] },
  };
}

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { email_text: emailText } = req.body || {};

  if (!emailText) {
    return res.status(400).json({ error: "Email text is required." });
  }

  return res.status(200).json(analyzeEmail(emailText));
};

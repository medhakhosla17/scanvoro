const {
  suspiciousLinkKeywords,
  trustedDomains,
  trustedHostnameTokens,
  knownSubdomains,
  weirdExtensions,
  compoundSuffixes,
  collapsedCompoundSuffixes,
} = require("./linkIntelConfig");
const urgencyWords = ["urgent", "immediately", "asap", "action required"];
const senderRedFlags = ["noreply", "security-alert", "support-update", "payments-alert"];
const unusualCategories = ["international", "unknown", "crypto", "giftcard"];
const commonMisspellings = {
  acccount: "account",
  accout: "account",
  accountt: "account",
  imediately: "immediately",
  immediatly: "immediately",
  suspened: "suspended",
  suspnded: "suspended",
  verfy: "verify",
  verfiy: "verify",
  pasword: "password",
  passwrod: "password",
  secuirty: "security",
  reciept: "receipt",
  paymant: "payment",
  payement: "payment",
  custmer: "customer",
  confrim: "confirm",
  logn: "login",
  tranfer: "transfer",
  updat: "update",
  informtion: "information",
  credntials: "credentials",
  requried: "required",
  unauthorised: "unauthorized",
  wll: "will",
  pls: "please",
};
const emailLexicon = new Set([
  "account",
  "accounts",
  "action",
  "alert",
  "bank",
  "billing",
  "business",
  "click",
  "code",
  "company",
  "confirm",
  "credentials",
  "customer",
  "customers",
  "dear",
  "details",
  "document",
  "documents",
  "email",
  "immediately",
  "information",
  "invoice",
  "link",
  "login",
  "message",
  "notice",
  "notification",
  "otp",
  "password",
  "payment",
  "payments",
  "please",
  "process",
  "receipt",
  "regards",
  "required",
  "reset",
  "review",
  "secure",
  "security",
  "sender",
  "service",
  "statement",
  "submit",
  "support",
  "suspended",
  "team",
  "transaction",
  "transfer",
  "unauthorized",
  "update",
  "urgent",
  "user",
  "validate",
  "verification",
  "verify",
  "will",
  "your",
]);

function clampScore(score) {
  return Math.max(0, Math.min(100, score));
}

function getRiskLabel(score) {
  if (score >= 70) {
    return "HIGH RISK";
  }

  if (score >= 35) {
    return "SUSPICIOUS";
  }

  return "SAFE";
}

function getLinkRiskLabel(score) {
  if (score >= 61) {
    return "HIGH RISK";
  }

  if (score >= 31) {
    return "RISK";
  }

  if (score >= 16) {
    return "SUSPICIOUS";
  }

  return "SAFE";
}

function extractHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (error) {
    return "";
  }
}

function normalizeHostname(hostname) {
  return String(hostname).toLowerCase().trim();
}

function getDomainParts(hostname) {
  return normalizeHostname(hostname)
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getRegistrableParts(hostname) {
  const parts = getDomainParts(hostname);

  if (parts.length <= 2) {
    return parts;
  }

  const suffix = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  if (compoundSuffixes.has(suffix)) {
    return parts.slice(-3);
  }

  return parts.slice(-2);
}

function getMainDomain(hostname) {
  const parts = getRegistrableParts(hostname);
  if (parts.length >= 2) {
    return parts.join(".");
  }

  return parts[0] || "";
}

function normalizeLookalikeText(value) {
  return String(value)
    .toLowerCase()
    .replace(/[0135@$]/g, (char) => {
      const replacements = {
        0: "o",
        1: "l",
        3: "e",
        5: "s",
        "@": "a",
        $: "s",
      };

      return replacements[char] || char;
    })
    .replace(/[^a-z]/g, "");
}

function collapseRepeatedLetters(value) {
  return String(value).replace(/(.)\1{1,}/g, "$1");
}

function getDomainLabel(domain) {
  return String(domain).split(".")[0] || "";
}

function getSubdomainParts(hostname) {
  const domainParts = getDomainParts(hostname);
  const registrableParts = getRegistrableParts(hostname);
  return domainParts.slice(0, Math.max(domainParts.length - registrableParts.length, 0));
}

function isTrustedDomain(hostname) {
  const normalizedHostname = normalizeHostname(hostname);

  return trustedDomains.find(
    (trustedDomain) => normalizedHostname === trustedDomain || normalizedHostname.endsWith(`.${trustedDomain}`)
  );
}

function levenshteinDistance(source, target) {
  const a = String(source);
  const b = String(target);
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let row = 0; row <= a.length; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column <= b.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function jaroSimilarity(source, target) {
  const a = String(source);
  const b = String(target);

  if (a === b) {
    return 1;
  }

  if (!a.length || !b.length) {
    return 0;
  }

  const matchDistance = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  for (let index = 0; index < a.length; index += 1) {
    const start = Math.max(0, index - matchDistance);
    const end = Math.min(index + matchDistance + 1, b.length);

    for (let offset = start; offset < end; offset += 1) {
      if (bMatches[offset] || a[index] !== b[offset]) {
        continue;
      }

      aMatches[index] = true;
      bMatches[offset] = true;
      matches += 1;
      break;
    }
  }

  if (!matches) {
    return 0;
  }

  let transpositions = 0;
  let pointer = 0;
  for (let index = 0; index < a.length; index += 1) {
    if (!aMatches[index]) {
      continue;
    }

    while (!bMatches[pointer]) {
      pointer += 1;
    }

    if (a[index] !== b[pointer]) {
      transpositions += 1;
    }

    pointer += 1;
  }

  return (
    (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3
  );
}

function jaroWinklerSimilarity(source, target) {
  const a = String(source);
  const b = String(target);
  const jaro = jaroSimilarity(a, b);

  let prefixLength = 0;
  const maxPrefix = Math.min(4, a.length, b.length);
  while (prefixLength < maxPrefix && a[prefixLength] === b[prefixLength]) {
    prefixLength += 1;
  }

  return jaro + prefixLength * 0.1 * (1 - jaro);
}

function isSingleTransposition(source, target) {
  const a = String(source);
  const b = String(target);

  if (a.length !== b.length || a === b) {
    return false;
  }

  const mismatches = [];
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      mismatches.push(index);
      if (mismatches.length > 2) {
        return false;
      }
    }
  }

  if (mismatches.length !== 2) {
    return false;
  }

  const [first, second] = mismatches;
  return second === first + 1 && a[first] === b[second] && a[second] === b[first];
}

function splitSentences(text) {
  return String(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function sanitizeEmailText(text) {
  return String(text)
    .replace(/https?:\/\/[^\s)]+/gi, " ")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, " ")
    .replace(/[^A-Za-z.!?,\s']/g, " ");
}

function detectWritingIssues(text) {
  const sanitized = sanitizeEmailText(text);
  const tokens = sanitized.toLowerCase().match(/\b[a-z']{3,}\b/g) || [];
  const typoFindings = new Set();
  const punctuationFindings = new Set();
  const grammarFindings = new Set();

  tokens.forEach((token) => {
    if (commonMisspellings[token]) {
      typoFindings.add(`Possible spelling mistake: "${token}" should likely be "${commonMisspellings[token]}".`);
      return;
    }

    if (!emailLexicon.has(token) && token.length >= 5) {
      for (const expectedWord of emailLexicon) {
        const smallDifference = levenshteinDistance(token, expectedWord) === 1;
        const adjacentSwap = isSingleTransposition(token, expectedWord);
        if (smallDifference || adjacentSwap) {
          typoFindings.add(`Possible spelling mistake: "${token}" is very close to "${expectedWord}".`);
          break;
        }
      }
    }
  });

  splitSentences(text).forEach((sentence) => {
    const trimmed = sentence.trim();
    if (!trimmed) {
      return;
    }

    const isHeaderLine = /^(from|subject|to|cc|bcc):/i.test(trimmed);

    if (!isHeaderLine && /^[a-z]/.test(trimmed)) {
      grammarFindings.add(`Sentence starts with lowercase text: "${trimmed.slice(0, 40)}".`);
    }

    const wordCount = (trimmed.match(/\b[\w']+\b/g) || []).length;
    if (wordCount >= 8 && !/[.!?]$/.test(trimmed) && !isHeaderLine) {
      punctuationFindings.add(`Long sentence is missing ending punctuation: "${trimmed.slice(0, 50)}".`);
    }

    if (!isHeaderLine && /\s+[,.!?]/.test(trimmed)) {
      punctuationFindings.add(`Punctuation spacing looks incorrect in: "${trimmed.slice(0, 50)}".`);
    }

    if (!isHeaderLine && /[.!?][A-Za-z]/.test(trimmed)) {
      punctuationFindings.add(`Missing space after punctuation in: "${trimmed.slice(0, 50)}".`);
    }
  });

  return {
    typoFindings: Array.from(typoFindings),
    grammarFindings: Array.from(grammarFindings),
    punctuationFindings: Array.from(punctuationFindings),
  };
}

function hasExcessiveRepeatedCharacters(label) {
  return /(.)\1{3,}/i.test(String(label));
}

function hasMalformedInstitutionalSuffix(domainParts) {
  if (!domainParts.length) {
    return false;
  }

  const collapsedLastLabel = collapseRepeatedLetters(normalizeLookalikeText(domainParts[domainParts.length - 1]));
  return collapsedCompoundSuffixes.has(collapsedLastLabel);
}

function findLookalikeToken(domainParts) {
  const tokens = domainParts
    .map((part) => normalizeLookalikeText(part))
    .filter(Boolean);

  for (const token of tokens) {
    for (const trustedToken of trustedHostnameTokens) {
      if (token === trustedToken) {
        continue;
      }

      const smallDifference = levenshteinDistance(token, trustedToken) <= 1;
      const adjacentSwap = isSingleTransposition(token, trustedToken);
      const missingOrExtraCharacter =
        Math.abs(token.length - trustedToken.length) === 1 && levenshteinDistance(token, trustedToken) === 1;
      const fuzzySimilarity = jaroWinklerSimilarity(token, trustedToken) >= 0.93;

      if (smallDifference || adjacentSwap || missingOrExtraCharacter || fuzzySimilarity) {
        return { token, trustedToken };
      }
    }
  }

  return null;
}

function analyzeTrustedSubdomain(hostname, trustedRoot) {
  const allowedSubdomains = knownSubdomains[trustedRoot];
  const subdomainParts = getSubdomainParts(hostname);

  if (!trustedRoot || !allowedSubdomains || !subdomainParts.length) {
    return null;
  }

  const subdomain = subdomainParts.join(".");
  if (allowedSubdomains.includes(subdomain)) {
    return {
      score: 0,
      reasons: [`The subdomain pattern "${subdomain}" matches an expected subdomain for "${trustedRoot}".`],
    };
  }

  const bestMatch = allowedSubdomains.reduce(
    (best, candidate) => {
      const normalizedSubdomain = normalizeLookalikeText(subdomain);
      const normalizedCandidate = normalizeLookalikeText(candidate);
      const distance = levenshteinDistance(normalizedSubdomain, normalizedCandidate);
      const similarity = jaroWinklerSimilarity(normalizedSubdomain, normalizedCandidate);

      if (distance < best.distance || (distance === best.distance && similarity > best.similarity)) {
        return { candidate, distance, similarity };
      }

      return best;
    },
    { candidate: "", distance: Number.POSITIVE_INFINITY, similarity: 0 }
  );

  const reasons = [`The subdomain pattern "${subdomain}" is not a known subdomain for "${trustedRoot}".`];
  let score = 25;

  if (hasExcessiveRepeatedCharacters(subdomain)) {
    score += 15;
    reasons.push(`The subdomain "${subdomain}" uses excessive repeated characters.`);
  }

  if (
    bestMatch.candidate &&
    (bestMatch.distance <= 1 || isSingleTransposition(normalizeLookalikeText(subdomain), normalizeLookalikeText(bestMatch.candidate)) || bestMatch.similarity >= 0.93)
  ) {
    score += 20;
    reasons.push(`The subdomain "${subdomain}" looks like a typo of the expected subdomain "${bestMatch.candidate}".`);
  }

  if (/^[a-z]{1,3}$/i.test(subdomain) && !allowedSubdomains.includes(subdomain)) {
    score += 10;
    reasons.push("The subdomain is unusually short and does not match expected trusted patterns.");
  }

  if (subdomainParts.length > 1) {
    score += 10;
    reasons.push("The trusted root uses an unexpected multi-level subdomain structure.");
  }

  return { score, reasons };
}

function findLookalikeDomain(mainDomain) {
  const inputLabel = normalizeLookalikeText(getDomainLabel(mainDomain));

  if (!inputLabel) {
    return null;
  }

  return (
    trustedDomains.find((trustedDomain) => {
      const trustedLabel = normalizeLookalikeText(getDomainLabel(trustedDomain));
      const looksLikeSubstitution = inputLabel === trustedLabel && getDomainLabel(mainDomain) !== getDomainLabel(trustedDomain);
      const smallDifference = levenshteinDistance(inputLabel, trustedLabel) <= 1;
      const adjacentSwap = isSingleTransposition(inputLabel, trustedLabel);
      const missingOrExtraCharacter =
        Math.abs(inputLabel.length - trustedLabel.length) === 1 && levenshteinDistance(inputLabel, trustedLabel) === 1;
      const fuzzySimilarity = jaroWinklerSimilarity(inputLabel, trustedLabel) >= 0.93;

      return (
        mainDomain !== trustedDomain &&
        (looksLikeSubstitution || smallDifference || adjacentSwap || missingOrExtraCharacter || fuzzySimilarity)
      );
    }) || null
  );
}

function analyzeLink(url) {
  const reasons = [];
  let score = 0;
  const rawUrl = String(url).trim();
  const lowerUrl = rawUrl.toLowerCase();
  const hostname = normalizeHostname(extractHostname(rawUrl));
  const mainDomain = getMainDomain(hostname);
  const trustedDomain = isTrustedDomain(hostname);
  const lookalikeDomain = findLookalikeDomain(mainDomain);
  const domainParts = getDomainParts(hostname);
  const registrableParts = getRegistrableParts(hostname);
  const subdomainParts = getSubdomainParts(hostname);
  const repeatedCharacterLabel = domainParts.find((part) => hasExcessiveRepeatedCharacters(part));
  const malformedSuffix = hasMalformedInstitutionalSuffix(domainParts);
  const lookalikeToken = findLookalikeToken(domainParts);
  const followsAcademicPattern = hostname.endsWith(".edu.au");
  const unusualHierarchy = registrableParts.length > 2 && !compoundSuffixes.has(`${registrableParts[registrableParts.length - 2]}.${registrableParts[registrableParts.length - 1]}`);
  const trustedSubdomainAnalysis = analyzeTrustedSubdomain(hostname, trustedDomain);

  if (!hostname) {
    return {
      score: 100,
      result: getLinkRiskLabel(100),
      reasons: ["The URL format is invalid."],
    };
  }

  if (!lowerUrl.startsWith("https://")) {
    score += 20;
    reasons.push("The link does not use HTTPS.");
  }

  if (trustedDomain) {
    score = Math.max(0, score - 12);
    reasons.push(`The domain matches the trusted domain "${trustedDomain}" or one of its valid subdomains.`);
  }

  if (followsAcademicPattern) {
    reasons.push("The domain follows the expected .edu.au academic naming pattern.");
  }

  if (lookalikeDomain) {
    score += 70;
    reasons.push(`The domain closely imitates the trusted domain "${lookalikeDomain}".`);
  }

  if (trustedSubdomainAnalysis) {
    score += trustedSubdomainAnalysis.score;
    reasons.push(...trustedSubdomainAnalysis.reasons);
  }

  if (lookalikeToken && !trustedDomain) {
    score += 65;
    reasons.push(`The hostname token "${lookalikeToken.token}" closely imitates the trusted token "${lookalikeToken.trustedToken}".`);
  }

  if (repeatedCharacterLabel) {
    score += 35;
    reasons.push(`The domain label "${repeatedCharacterLabel}" uses excessive repeated characters, which is a strong phishing indicator.`);
  }

  if (malformedSuffix) {
    score += 35;
    reasons.push("The domain suffix appears to imitate a trusted institutional suffix such as .edu.au or .gov.au.");
  }

  suspiciousLinkKeywords.forEach((keyword) => {
    if (lowerUrl.includes(keyword)) {
      score += 8;
      reasons.push(`The URL contains the suspicious keyword "${keyword}".`);
    }
  });

  weirdExtensions.forEach((extension) => {
    if (mainDomain.endsWith(extension)) {
      score += 20;
      reasons.push(`The domain uses a high-risk extension "${extension}".`);
    }
  });

  if (rawUrl.length > 120) {
    score += 15;
    reasons.push("The URL is unusually long.");
  } else if (rawUrl.length > 75) {
    score += 8;
    reasons.push("The URL is longer than normal and may be trying to hide suspicious parts.");
  }

  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    score += 12;
    reasons.push("The domain contains multiple hyphens, which is common in misleading URLs.");
  } else if (hyphenCount >= 2) {
    score += 6;
    reasons.push("The domain contains several hyphens.");
  }

  const subdomainCount = subdomainParts.length;
  if (subdomainCount >= 3) {
    score += 12;
    reasons.push("The URL uses too many subdomains.");
  } else if (subdomainCount >= 2) {
    score += 6;
    reasons.push("The URL contains multiple subdomains.");
  }

  if (unusualHierarchy) {
    score += 10;
    reasons.push("The domain hierarchy is unusual for a legitimate site.");
  }

  score = clampScore(score);

  if (reasons.length === 0) {
    reasons.push("No suspicious domain manipulations or structural anomalies were detected by the current offline rule set.");
  }

  return {
    score,
    result: getLinkRiskLabel(score),
    reasons,
  };
}

function analyzeEmail(emailText) {
  const text = String(emailText);
  const lowerText = text.toLowerCase();
  const reasons = [];
  const highlights = [];
  let score = 0;
  const writingIssues = detectWritingIssues(text);

  urgencyWords.forEach((word) => {
    if (lowerText.includes(word)) {
      score += 12;
      highlights.push(`Urgency phrase detected: "${word}"`);
      reasons.push(`The email uses urgency language such as "${word}".`);
    }
  });

  ["otp", "password", "passcode"].forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      score += 18;
      highlights.push(`Credential request detected: "${keyword}"`);
      reasons.push(`The email references sensitive credentials like "${keyword}".`);
    }
  });

  const suspiciousLinks = text.match(/https?:\/\/[^\s)]+/gi) || [];
  suspiciousLinks.forEach((link) => {
    const linkResult = analyzeLink(link);
    if (linkResult.score >= 35) {
      score += 20;
      highlights.push(`Suspicious link found: ${link}`);
      reasons.push("The email contains a suspicious link.");
    }
  });

  senderRedFlags.forEach((pattern) => {
    if (lowerText.includes(pattern)) {
      score += 10;
      highlights.push(`Sender pattern detected: "${pattern}"`);
      reasons.push(`The sender pattern "${pattern}" is commonly used in phishing emails.`);
    }
  });

  const fromLine = text.match(/from:\s*(.+)/i);
  if (fromLine && !/@/.test(fromLine[1])) {
    score += 15;
    highlights.push("Unknown sender format");
    reasons.push("The sender line does not look like a valid email address.");
  }

  const writingIssueCount =
    writingIssues.typoFindings.length + writingIssues.grammarFindings.length + writingIssues.punctuationFindings.length;
  if (writingIssueCount > 0) {
    score = Math.max(score, 70);
    highlights.push("Writing-quality issue detected");
    reasons.push("The email contains spelling, grammar, or punctuation issues that commonly appear in phishing messages.");
    writingIssues.typoFindings.forEach((issue) => reasons.push(issue));
    writingIssues.grammarFindings.forEach((issue) => reasons.push(issue));
    writingIssues.punctuationFindings.forEach((issue) => reasons.push(issue));
  }

  score = clampScore(score);

  if (reasons.length === 0) {
    reasons.push("No suspicious patterns were detected by the current email rules.");
  }

  return {
    score,
    result: getRiskLabel(score),
    reasons,
    highlights,
  };
}

function analyzeTransactions(transactions) {
  // Normalize the payload so the rule engine can safely score mixed input data.
  const normalizedTransactions = transactions.map((transaction) => ({
    ...transaction,
    amount: Number(transaction.amount) || 0,
    category: String(transaction.category || "unknown").toLowerCase(),
    description: String(transaction.description || "Unknown transaction"),
    date: transaction.date || "",
  }));

  const reasons = [];
  const alerts = [];
  const flaggedTransactions = [];
  const totalSpending = normalizedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  let score = 0;

  normalizedTransactions.forEach((transaction) => {
    if (transaction.amount > 1000) {
      score += 15;
      flaggedTransactions.push(transaction);
      reasons.push(`High-value transaction detected: ${transaction.description} for $${transaction.amount.toFixed(2)}.`);
    }

    if (unusualCategories.includes(transaction.category)) {
      score += 12;
      flaggedTransactions.push(transaction);
      alerts.push(`Unusual category found: ${transaction.category} on ${transaction.description}.`);
    }
  });

  const sortedByDate = [...normalizedTransactions]
    .filter((transaction) => transaction.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  for (let index = 1; index < sortedByDate.length; index += 1) {
    const previous = sortedByDate[index - 1];
    const current = sortedByDate[index];
    const minutesDiff = Math.abs(new Date(current.date) - new Date(previous.date)) / 60000;

    if (minutesDiff <= 10) {
      score += 8;
      flaggedTransactions.push(current);
      alerts.push(`Rapid transaction activity detected between "${previous.description}" and "${current.description}".`);
    }
  }

  const averageSpending = normalizedTransactions.length ? totalSpending / normalizedTransactions.length : 0;
  normalizedTransactions.forEach((transaction) => {
    if (averageSpending && transaction.amount > averageSpending * 2.5) {
      score += 10;
      flaggedTransactions.push(transaction);
      alerts.push(`Spending spike detected for "${transaction.description}".`);
    }
  });

  score = clampScore(score);

  if (reasons.length === 0 && alerts.length === 0) {
    reasons.push("No transaction risks were detected by the current rule set.");
  }

  return {
    totalSpending,
    score,
    result: getRiskLabel(score),
    reasons,
    flaggedTransactions: Array.from(new Set(flaggedTransactions.map((item) => JSON.stringify(item)))).map((item) =>
      JSON.parse(item)
    ),
    alerts,
  };
}

function maskPreservingLayout(match) {
  return match.replace(/[A-Za-z0-9]/g, "*");
}

function analyzeBankStatement(content) {
  let redactedData = String(content);
  const detectedFields = new Set();
  const reasons = [];
  let score = 0;
  const originalText = String(content);
  const headerRow = (originalText.split(/\r?\n/)[0] || "").split(",");
  const lowerHeaderRow = headerRow.map((header) => header.trim().toLowerCase());

  const patterns = [
    { label: "Emails", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, points: 16 },
    { label: "Phone Numbers", regex: /\b(?:\+?61|0)\d{8,9}\b/g, points: 14 },
    { label: "Account Numbers", regex: /\b\d{10,16}\b/g, points: 22 },
  ];

  patterns.forEach((pattern) => {
    const matches = redactedData.match(pattern.regex);
    if (matches) {
      detectedFields.add(pattern.label);
      score += pattern.points;
      reasons.push(`${pattern.label} were detected and redacted.`);
      redactedData = redactedData.replace(pattern.regex, (match) => maskPreservingLayout(match));
    }
  });

  const tfnLikeRegex = /\b\d{8,9}\b/g;
  const tfnMatches = originalText.match(tfnLikeRegex);
  if (tfnMatches) {
    const hasTfnColumn = lowerHeaderRow.some((header) => header.includes("tfn") || header.includes("tax") || header.includes("id"));
    if (hasTfnColumn || tfnMatches.some((match) => match.length === 9)) {
      detectedFields.add("TFN / ID Numbers");
      score += 18;
      reasons.push("TFN or ID-like numbers were detected and redacted.");
      redactedData = redactedData.replace(tfnLikeRegex, (match) => maskPreservingLayout(match));
    }
  }

  const nameColumnPattern = /\b(account name|customer name|name)\b/i;
  if (nameColumnPattern.test(originalText)) {
    detectedFields.add("Names");
    score += 12;
    reasons.push("Name-related columns were detected in the statement.");

    // Redact values only in columns that look like name fields to preserve the rest of the CSV.
    redactedData = redactedData
      .split(/\r?\n/)
      .map((line, index) => {
        if (index === 0) {
          return line;
        }

        const parts = line.split(",");
        return parts
          .map((part, partIndex) => {
            const header = headerRow[partIndex] || "";
            if (nameColumnPattern.test(header)) {
              return part.replace(/[A-Za-z]/g, "*");
            }
            return part;
          })
          .join(",");
      })
      .join("\n");
  }

  score = clampScore(score);

  if (detectedFields.size === 0) {
    reasons.push("No sensitive fields were detected by the current redaction rules.");
  }

  return {
    redactedData,
    detectedFields: Array.from(detectedFields),
    score,
    result: getRiskLabel(score),
    reasons,
  };
}

module.exports = {
  analyzeLink,
  analyzeEmail,
  analyzeTransactions,
  analyzeBankStatement,
};

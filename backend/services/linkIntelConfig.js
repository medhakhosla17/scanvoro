const suspiciousLinkKeywords = ["login", "verify", "secure", "account", "update", "urgent", "bank"];

const trustedDomains = [
  "google.com",
  "amazon.com",
  "microsoft.com",
  "paypal.com",
  "apple.com",
  "youtube.com",
  "shein.com",
  "facebook.com",
  "instagram.com",
  "netflix.com",
  "linkedin.com",
  "whatsapp.com",
  "tiktok.com",
  "xero.com",
  "mygov.au",
  "commbank.com.au",
  "nab.com.au",
  "westpac.com.au",
  "anz.com.au",
];

const trustedHostnameTokens = [
  "google",
  "amazon",
  "microsoft",
  "paypal",
  "apple",
  "youtube",
  "shein",
  "facebook",
  "instagram",
  "netflix",
  "linkedin",
  "whatsapp",
  "tiktok",
  "xero",
  "mygov",
  "commbank",
  "nab",
  "westpac",
  "anz",
  "canberra",
  "uclearn",
];

const knownSubdomains = {
  "youtube.com": ["www", "m", "studio", "music"],
  "google.com": ["www", "mail", "drive", "docs", "accounts", "maps", "news"],
  "microsoft.com": ["www", "login", "account", "support", "learn"],
  "paypal.com": ["www", "www.paypalobjects", "history", "checkout", "c"],
  "amazon.com": ["www", "smile", "sellercentral", "music", "primevideo"],
  "apple.com": ["www", "support", "music", "tv", "developer", "idmsa"],
  "facebook.com": ["www", "m", "business", "developers"],
  "instagram.com": ["www", "help", "about", "business"],
  "netflix.com": ["www", "help", "media", "jobs"],
  "linkedin.com": ["www", "help", "learning", "business"],
  "whatsapp.com": ["www", "web", "faq", "blog"],
  "tiktok.com": ["www", "m", "ads", "support"],
  "xero.com": ["www", "login", "central", "go"],
  "mygov.au": ["www", "my", "signin"],
  "commbank.com.au": ["www", "netbank", "secure", "business"],
  "nab.com.au": ["www", "ib", "online", "business"],
  "westpac.com.au": ["www", "online", "payments", "business"],
  "anz.com.au": ["www", "internetbanking", "business"],
};

const weirdExtensions = [".xyz", ".top", ".click", ".online", ".ru"];
const compoundSuffixes = new Set(["com.au", "net.au", "org.au", "co.uk", "org.uk", "gov.uk", "co.nz", "co.in"]);
const collapsedCompoundSuffixes = new Set(["comau", "netau", "orgau", "eduau", "govau", "couk", "orguk", "govuk", "conz", "coin"]);

module.exports = {
  suspiciousLinkKeywords,
  trustedDomains,
  trustedHostnameTokens,
  knownSubdomains,
  weirdExtensions,
  compoundSuffixes,
  collapsedCompoundSuffixes,
};

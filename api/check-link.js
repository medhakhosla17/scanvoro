const { analyzeLink } = require("../backend/services/fraudEngine");

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: "A URL is required." });
  }

  return res.status(200).json(analyzeLink(url));
};

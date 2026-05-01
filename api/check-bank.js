const { analyzeBankStatement } = require("../backend/services/fraudEngine");

module.exports = function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { content } = req.body || {};

  if (!content) {
    return res.status(400).json({ error: "Bank statement content is required." });
  }

  return res.status(200).json(analyzeBankStatement(content));
};

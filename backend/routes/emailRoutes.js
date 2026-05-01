const express = require("express");
const { analyzeEmail } = require("../services/fraudEngine");

const router = express.Router();

router.post("/check-email", (req, res) => {
  const { emailText } = req.body;

  if (!emailText) {
    return res.status(400).json({ error: "Email content is required." });
  }

  return res.json(analyzeEmail(emailText));
});

module.exports = router;

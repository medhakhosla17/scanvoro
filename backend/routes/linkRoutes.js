const express = require("express");
const { analyzeLink } = require("../services/fraudEngine");

const router = express.Router();

router.post("/check-link", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "A URL is required." });
  }

  return res.json(analyzeLink(url));
});

module.exports = router;

const express = require("express");
const { analyzeBankStatement } = require("../services/fraudEngine");

const router = express.Router();

router.post("/check-bank", (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Bank statement content is required." });
  }

  return res.json(analyzeBankStatement(content));
});

module.exports = router;

const express = require("express");
const { analyzeTransactions } = require("../services/fraudEngine");

const router = express.Router();

router.post("/check-transactions", (req, res) => {
  const { transactions } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: "A transaction array is required." });
  }

  return res.json(analyzeTransactions(transactions));
});

module.exports = router;

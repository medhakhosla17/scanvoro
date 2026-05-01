const express = require("express");
const cors = require("cors");

const linkRoutes = require("./routes/linkRoutes");
const emailRoutes = require("./routes/emailRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const bankRoutes = require("./routes/bankRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Register each fraud analysis route under the shared /api base path.
app.use("/api", linkRoutes);
app.use("/api", emailRoutes);
app.use("/api", transactionRoutes);
app.use("/api", bankRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Scanvoro backend is running." });
});

app.listen(PORT, () => {
  console.log(`Scanvoro backend listening on port ${PORT}`);
});

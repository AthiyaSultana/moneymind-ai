require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const journalRoutes = require("./routes/journalRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const savingsRoutes = require("./routes/savingsRoutes");
const askMoneyRoutes = require("./routes/askMoneyRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "MoneyMind AI API",
  });
});

// API routes
app.use("/api/journal", journalRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/ask-money", askMoneyRoutes);

// React frontend
const frontendPath = path.join(__dirname, "../../frontend/dist");

app.use(express.static(frontendPath));

// Return 404 for unknown API endpoints
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
  });
});

// React SPA fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`MoneyMind AI API running on port ${PORT}`);
});
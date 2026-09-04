const express = require("express");
const authenticate = require("../middleware/authMiddleware");

const {
  extractExpenseFromMessage,
  saveExpense,
  getExpenses,
} = require("../controllers/expenseController");

const router = express.Router();

router.use(authenticate);

router.get("/", getExpenses);

router.post("/extract", extractExpenseFromMessage);

router.post("/save", saveExpense);

module.exports = router;
const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
  createIncome,
  getIncome,
  deleteIncome,
} = require("../controllers/incomeController");

const router = express.Router();

router.use(authenticate);

router.get("/", getIncome);

router.post("/", createIncome);

router.delete("/:id", deleteIncome);

module.exports = router;
const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
  askMyMoney,
} = require("../controllers/askMoneyController");

const router = express.Router();

router.use(authenticate);

router.post("/", askMyMoney);

module.exports = router;
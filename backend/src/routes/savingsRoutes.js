const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const {
  createSaving,
  getSavings,
  deleteSaving,
} = require("../controllers/savingsController");

const router = express.Router();

router.use(authenticate);

router.get("/", getSavings);

router.post("/", createSaving);

router.delete("/:id", deleteSaving);

module.exports = router;
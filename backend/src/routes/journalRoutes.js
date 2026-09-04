const express = require("express");
const authenticate = require("../middleware/authMiddleware");

const {
  createJournalEntry,
  getJournalEntries,
  sendJournalMessage,
} = require("../controllers/journalController");

const router = express.Router();

router.use(authenticate);

router.get("/", getJournalEntries);

router.post("/", createJournalEntry);

router.post("/message", sendJournalMessage);

module.exports = router;
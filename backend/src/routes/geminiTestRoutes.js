const express = require("express");

const {
  generateJournalResponse,
} = require("../services/geminiService");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const response = await generateJournalResponse(message);

    return res.status(200).json({
      response,
    });
  } catch (error) {
    console.error("Gemini test failed:", error);

    return res.status(500).json({
      error: "Failed to generate Gemini response",
    });
  }
});

module.exports = router;
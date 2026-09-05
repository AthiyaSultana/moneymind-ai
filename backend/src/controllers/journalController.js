const { FieldValue } = require("firebase-admin/firestore");
const { adminDb } = require("../config/firebaseAdmin");
const {
  generateJournalResponse,
} = require("../services/geminiService");

const journalCollection = (uid) =>
  adminDb.collection("users").doc(uid).collection("journalEntries");

/**
 * Generate a safe fallback response when Gemini is unavailable.
 *
 * This keeps the Journal feature functional even when:
 * - Gemini quota is exhausted
 * - Gemini temporarily returns 503
 * - Gemini API is unavailable
 */
function generateJournalFallback(message) {
  const text = message.toLowerCase();

  if (
    text.includes("spent") ||
    text.includes("spend") ||
    text.includes("paid") ||
    text.includes("bought") ||
    text.includes("purchase") ||
    text.includes("expense")
  ) {
    return (
      "I've saved your journal entry. It looks like you may be recording " +
      "an expense. AI analysis is temporarily unavailable, so please " +
      "review the entry later."
    );
  }

  if (
    text.includes("income") ||
    text.includes("salary") ||
    text.includes("earned") ||
    text.includes("received")
  ) {
    return (
      "I've saved your journal entry. It looks like you're recording " +
      "income. AI analysis is temporarily unavailable right now."
    );
  }

  if (
    text.includes("save") ||
    text.includes("saving") ||
    text.includes("savings") ||
    text.includes("investment") ||
    text.includes("invest")
  ) {
    return (
      "I've saved your journal entry. Your savings or investment-related " +
      "note is recorded. AI analysis is temporarily unavailable right now."
    );
  }

  return (
    "I've saved your journal entry successfully. " +
    "AI responses are temporarily unavailable right now, " +
    "but your information is safe."
  );
}

/**
 * Check whether the Gemini error looks like a quota/rate-limit error.
 */
function isGeminiQuotaError(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  const status = String(error?.status || "").toLowerCase();

  return (
    status === "429" ||
    code === "429" ||
    code.includes("resource_exhausted") ||
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("resource exhausted") ||
    message.includes("rate limit") ||
    message.includes("free_tier")
  );
}

/**
 * Check whether Gemini is temporarily unavailable.
 */
function isGeminiTemporaryError(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  const status = String(error?.status || "").toLowerCase();

  return (
    status === "503" ||
    code === "503" ||
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("temporarily unavailable")
  );
}


// --------------------------------------------------
// Create a single journal entry
// --------------------------------------------------

async function createJournalEntry(req, res) {
  try {
    const uid = req.user.uid;

    const { role, content } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({
        error: "Journal content is required",
      });
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return res.status(400).json({
        error: "Journal content cannot be empty",
      });
    }

    if (trimmedContent.length > 10000) {
      return res.status(400).json({
        error: "Journal content is too long",
      });
    }

    const validRole = role === "assistant" ? "assistant" : "user";

    const journalRef = journalCollection(uid).doc();

    await journalRef.set({
      role: validRole,
      content: trimmedContent,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      id: journalRef.id,
      role: validRole,
      content: trimmedContent,
    });
  } catch (error) {
    console.error("Failed to create journal entry:", error);

    return res.status(500).json({
      error: "Failed to create journal entry",
    });
  }
}


// --------------------------------------------------
// Get all journal entries for the authenticated user
// --------------------------------------------------

async function getJournalEntries(req, res) {
  try {
    const uid = req.user.uid;

    const snapshot = await journalCollection(uid)
      .orderBy("createdAt", "asc")
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      entries,
    });
  } catch (error) {
    console.error("Failed to get journal entries:", error);

    return res.status(500).json({
      error: "Failed to get journal entries",
    });
  }
}


// --------------------------------------------------
// Send message to Gemini with conversation history
// --------------------------------------------------

async function sendJournalMessage(req, res) {
  try {
    const uid = req.user.uid;
    const { message } = req.body;

    // --------------------------------------------------
    // Validate message
    // --------------------------------------------------

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return res.status(400).json({
        error: "Message cannot be empty",
      });
    }

    if (trimmedMessage.length > 10000) {
      return res.status(400).json({
        error: "Message is too long",
      });
    }

    // --------------------------------------------------
    // 1. Save user's message
    // --------------------------------------------------

    const journalRef = journalCollection(uid).doc();

    await journalRef.set({
      role: "user",
      content: trimmedMessage,
      createdAt: FieldValue.serverTimestamp(),
    });

    // --------------------------------------------------
    // 2. Get conversation history
    // --------------------------------------------------

    const snapshot = await journalCollection(uid)
      .orderBy("createdAt", "asc")
      .get();

    const history = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        role: data.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: data.content || "",
          },
        ],
      };
    });

    // --------------------------------------------------
    // 3. Send conversation history to Gemini
    // --------------------------------------------------

    let aiResponse;
    let source = "gemini";

    try {
      aiResponse = await generateJournalResponse(history);
    } catch (geminiError) {
      // -----------------------------------------------
      // Gemini failed.
      //
      // IMPORTANT:
      // Do NOT allow Gemini failure to break Journal.
      // -----------------------------------------------

      if (isGeminiQuotaError(geminiError)) {
        console.warn(
          "Gemini quota unavailable. Using Journal fallback."
        );
      } else if (isGeminiTemporaryError(geminiError)) {
        console.warn(
          "Gemini temporarily unavailable. Using Journal fallback."
        );
      } else {
        console.error(
          "Gemini Journal request failed. Using fallback:",
          geminiError?.message || geminiError
        );
      }

      aiResponse = generateJournalFallback(trimmedMessage);
      source = "fallback";
    }

    // --------------------------------------------------
    // 4. Save assistant/fallback response
    // --------------------------------------------------

    const assistantRef = journalCollection(uid).doc();

    await assistantRef.set({
      role: "assistant",
      content: aiResponse,
      createdAt: FieldValue.serverTimestamp(),
    });

    // --------------------------------------------------
    // 5. Return both messages to frontend
    // --------------------------------------------------

    return res.status(200).json({
      userMessage: {
        id: journalRef.id,
        role: "user",
        content: trimmedMessage,
      },
      assistantMessage: {
        id: assistantRef.id,
        role: "assistant",
        content: aiResponse,
      },
      source,
    });
  } catch (error) {
    // --------------------------------------------------
    // Only unexpected application/database errors should
    // reach this block.
    // --------------------------------------------------

    console.error("========== JOURNAL ERROR ==========");
    console.error("Message:", error.message);
    console.error("Status:", error.status);
    console.error("Code:", error.code);
    console.error("Full error:", error);
    console.error("===================================");

    return res.status(500).json({
      error: "Failed to process journal message",
    });
  }
}


module.exports = {
  createJournalEntry,
  getJournalEntries,
  sendJournalMessage,
};
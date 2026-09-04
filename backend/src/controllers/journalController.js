const { FieldValue } = require("firebase-admin/firestore");
const { adminDb } = require("../config/firebaseAdmin");
const {
  generateJournalResponse,
} = require("../services/geminiService");

const journalCollection = (uid) =>
  adminDb.collection("users").doc(uid).collection("journalEntries");

// Create a single journal entry
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

// Get all journal entries for the authenticated user
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

// Send message to Gemini with conversation history
async function sendJournalMessage(req, res) {
  try {
    const uid = req.user.uid;
    const { message } = req.body;

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

    console.log("User message saved:", journalRef.id);

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
            text: data.content,
          },
        ],
      };
    });

    console.log(
      "Conversation history messages:",
      history.length
    );

    // --------------------------------------------------
    // 3. Send conversation history to Gemini
    // --------------------------------------------------

    const aiResponse = await generateJournalResponse(history);

    console.log("Gemini response received");

    // --------------------------------------------------
    // 4. Save Gemini response
    // --------------------------------------------------

    const assistantRef = journalCollection(uid).doc();

    await assistantRef.set({
      role: "assistant",
      content: aiResponse,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(
      "Assistant response saved:",
      assistantRef.id
    );

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
    });
  } catch (error) {
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
const { FieldValue } = require("firebase-admin/firestore");
const {
  extractExpense,
  EXPENSE_CATEGORIES,
} = require("../services/expenseService");

const { adminDb } = require("../config/firebaseAdmin");

const expenseCollection = (uid) =>
  adminDb.collection("users").doc(uid).collection("expenses");

// --------------------------------------------------
// Extract expense from natural language
// --------------------------------------------------

async function extractExpenseFromMessage(req, res) {
  try {
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

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({
        error: "Message is too long",
      });
    }

    const expense = await extractExpense(trimmedMessage);

    if (typeof expense.isExpense !== "boolean") {
      throw new Error("Invalid expense classification");
    }

    if (
      expense.category &&
      !EXPENSE_CATEGORIES.includes(expense.category)
    ) {
      throw new Error("Invalid expense category");
    }

    if (
      expense.amount !== null &&
      expense.amount !== undefined &&
      (typeof expense.amount !== "number" || expense.amount <= 0)
    ) {
      throw new Error("Invalid expense amount");
    }

    return res.status(200).json({
      expense,
    });
  } catch (error) {
    console.error("Expense extraction failed:", error);

    return res.status(500).json({
      error: "Failed to extract expense",
    });
  }
}

// --------------------------------------------------
// Save confirmed expense
// --------------------------------------------------

async function saveExpense(req, res) {
  try {
    // IMPORTANT:
    // Always use UID from Firebase ID token.
    // Never accept UID from frontend.
    const uid = req.user.uid;

    const {
      amount,
      currency,
      merchant,
      category,
      date,
      description,
    } = req.body;

    // Validate amount
    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        error: "Valid expense amount is required",
      });
    }

    // Validate category
    if (!EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: "Invalid expense category",
      });
    }

    // Validate currency
    if (currency !== "INR") {
      return res.status(400).json({
        error: "Only INR expenses are currently supported",
      });
    }

    // Validate optional fields
    if (merchant !== null && merchant !== undefined) {
      if (typeof merchant !== "string" || merchant.length > 200) {
        return res.status(400).json({
          error: "Invalid merchant",
        });
      }
    }

    if (date !== null && date !== undefined) {
      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      ) {
        return res.status(400).json({
          error: "Invalid expense date",
        });
      }
    }

    if (description !== null && description !== undefined) {
      if (
        typeof description !== "string" ||
        description.length > 1000
      ) {
        return res.status(400).json({
          error: "Invalid expense description",
        });
      }
    }
    const expenseDate = date || new Date().toISOString().split("T")[0];
    const expenseRef = expenseCollection(uid).doc();

    await expenseRef.set({
      amount,
      currency,
      merchant: merchant || null,
      category,
      date: expenseDate,
      description: description || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      expense: {
        id: expenseRef.id,
        amount,
        currency,
        merchant: merchant || null,
        category,
        date: expenseDate,
        description: description || null,
      },
    });
  } catch (error) {
    console.error("Failed to save expense:", error);

    return res.status(500).json({
      error: "Failed to save expense",
    });
  }
}

// --------------------------------------------------
// Get expenses for authenticated user
// --------------------------------------------------

async function getExpenses(req, res) {
    try {
      // IMPORTANT:
      // UID comes only from the verified Firebase token.
      const uid = req.user.uid;
  
      const snapshot = await expenseCollection(uid)
        .orderBy("createdAt", "desc")
        .get();
  
      const expenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      return res.status(200).json({
        expenses,
      });
    } catch (error) {
      console.error("Failed to get expenses:", error);
  
      return res.status(500).json({
        error: "Failed to load expenses",
      });
    }
  }
  module.exports = {
    extractExpenseFromMessage,
    saveExpense,
    getExpenses,
  };
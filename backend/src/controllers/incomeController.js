const { adminDb } = require("../config/firebaseAdmin");

const incomeCollection = (uid) =>
  adminDb.collection("users").doc(uid).collection("income");

const ALLOWED_INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Other",
];

async function createIncome(req, res) {
  try {
    const uid = req.user.uid;

    const {
      amount,
      category,
      source,
      date,
      description,
    } = req.body;

    // Validate amount
    if (
      amount === undefined ||
      amount === null ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        error: "Amount must be a positive number",
      });
    }

    // Validate category
    if (!ALLOWED_INCOME_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: "Invalid income category",
      });
    }

    const incomeDate =
      date || new Date().toISOString().split("T")[0];

    const incomeData = {
      amount,
      category,
      source: source || null,
      date: incomeDate,
      description: description || "",
      createdAt: new Date(),
    };

    const docRef = await incomeCollection(uid).add(incomeData);

    return res.status(201).json({
      id: docRef.id,
      ...incomeData,
    });
  } catch (error) {
    console.error("Create income error:", error);

    return res.status(500).json({
      error: "Failed to create income",
    });
  }
}

async function getIncome(req, res) {
  try {
    const uid = req.user.uid;

    const snapshot = await incomeCollection(uid)
      .orderBy("createdAt", "desc")
      .get();

    const income = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(income);
  } catch (error) {
    console.error("Get income error:", error);

    return res.status(500).json({
      error: "Failed to fetch income",
    });
  }
}

async function deleteIncome(req, res) {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Income ID is required",
      });
    }

    const incomeRef = incomeCollection(uid).doc(id);

    const snapshot = await incomeRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({
        error: "Income not found",
      });
    }

    await incomeRef.delete();

    return res.status(200).json({
      message: "Income deleted successfully",
    });
  } catch (error) {
    console.error("Delete income error:", error);

    return res.status(500).json({
      error: "Failed to delete income",
    });
  }
}

module.exports = {
  createIncome,
  getIncome,
  deleteIncome,
  ALLOWED_INCOME_CATEGORIES,
};
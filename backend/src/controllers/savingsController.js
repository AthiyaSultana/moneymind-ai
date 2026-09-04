const { adminDb } = require("../config/firebaseAdmin");

const savingsCollection = (uid) =>
  adminDb.collection("users").doc(uid).collection("savings");

const ALLOWED_SAVING_CATEGORIES = [
  "Emergency Fund",
  "Investment",
  "SIP",
  "Goal",
  "Other",
];

async function createSaving(req, res) {
  try {
    const uid = req.user.uid;

    const {
      amount,
      category,
      goal,
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
    if (!ALLOWED_SAVING_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: "Invalid savings category",
      });
    }

    const savingDate =
      date || new Date().toISOString().split("T")[0];

    const savingData = {
      amount,
      category,
      goal: goal || null,
      date: savingDate,
      description: description || "",
      createdAt: new Date(),
    };

    const docRef = await savingsCollection(uid).add(savingData);

    return res.status(201).json({
      id: docRef.id,
      ...savingData,
    });
  } catch (error) {
    console.error("Create saving error:", error);

    return res.status(500).json({
      error: "Failed to create saving",
    });
  }
}

async function getSavings(req, res) {
  try {
    const uid = req.user.uid;

    const snapshot = await savingsCollection(uid)
      .orderBy("createdAt", "desc")
      .get();

    const savings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(savings);
  } catch (error) {
    console.error("Get savings error:", error);

    return res.status(500).json({
      error: "Failed to fetch savings",
    });
  }
}

async function deleteSaving(req, res) {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: "Savings ID is required",
      });
    }

    const savingRef = savingsCollection(uid).doc(id);

    const snapshot = await savingRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({
        error: "Saving not found",
      });
    }

    await savingRef.delete();

    return res.status(200).json({
      message: "Saving deleted successfully",
    });
  } catch (error) {
    console.error("Delete saving error:", error);

    return res.status(500).json({
      error: "Failed to delete saving",
    });
  }
}

module.exports = {
  createSaving,
  getSavings,
  deleteSaving,
  ALLOWED_SAVING_CATEGORIES,
};
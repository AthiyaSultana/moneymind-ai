const { adminDb } = require("../config/firebaseAdmin");

const userCollection = (uid, collectionName) =>
  adminDb
    .collection("users")
    .doc(uid)
    .collection(collectionName);

const getCollectionData = async (uid, collectionName) => {
  const snapshot = await userCollection(
    uid,
    collectionName
  ).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

const getTotal = (items) =>
  items.reduce(
    (total, item) =>
      total + Number(item.amount || 0),
    0
  );

const isCurrentMonth = (date) => {
  if (!date) return false;

  const transactionDate = new Date(`${date}T00:00:00`);
  const now = new Date();

  return (
    transactionDate.getFullYear() === now.getFullYear() &&
    transactionDate.getMonth() === now.getMonth()
  );
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

async function askMyMoney(req, res) {
  try {
    const uid = req.user.uid;
    const { question } = req.body;

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    const normalizedQuestion =
      question.trim().toLowerCase();

    // IMPORTANT:
    // UID comes ONLY from the verified Firebase token.
    // Never accept a UID from the frontend.

    const [expenses, income, savings] =
      await Promise.all([
        getCollectionData(uid, "expenses"),
        getCollectionData(uid, "income"),
        getCollectionData(uid, "savings"),
      ]);

    const totalIncome = getTotal(income);
    const totalExpenses = getTotal(expenses);
    const totalSavings = getTotal(savings);

    const availableBalance =
      totalIncome -
      totalExpenses -
      totalSavings;

    const monthlyIncome = getTotal(
      income.filter((item) =>
        isCurrentMonth(item.date)
      )
    );

    const monthlyExpenses = getTotal(
      expenses.filter((item) =>
        isCurrentMonth(item.date)
      )
    );

    const monthlySavings = getTotal(
      savings.filter((item) =>
        isCurrentMonth(item.date)
      )
    );

    const categoryTotals = expenses.reduce(
      (totals, expense) => {
        const category =
          expense.category || "Other";

        totals[category] =
          (totals[category] || 0) +
          Number(expense.amount || 0);

        return totals;
      },
      {}
    );

    const categoryList = Object.entries(
      categoryTotals
    ).sort(
      ([, amountA], [, amountB]) =>
        amountB - amountA
    );

    const topCategory = categoryList[0];

    let answer;

    if (
      normalizedQuestion.includes("balance")
    ) {
      answer =
        `Your available balance is ${formatCurrency(
          availableBalance
        )}. ` +
        `This is calculated as income minus expenses and savings.`;
    } else if (
      normalizedQuestion.includes("income") &&
      normalizedQuestion.includes("month")
    ) {
      answer = `Your income this month is ${formatCurrency(
        monthlyIncome
      )}.`;
    } else if (
      normalizedQuestion.includes("income") ||
      normalizedQuestion.includes("earned")
    ) {
      answer = `Your total recorded income is ${formatCurrency(
        totalIncome
      )}.`;
    } else if (
      normalizedQuestion.includes("saving") &&
      normalizedQuestion.includes("month")
    ) {
      answer = `You have saved ${formatCurrency(
        monthlySavings
      )} this month.`;
    } else if (
      normalizedQuestion.includes("saving")
    ) {
      answer = `Your total recorded savings are ${formatCurrency(
        totalSavings
      )}.`;
    } else if (
      normalizedQuestion.includes("spend") ||
      normalizedQuestion.includes("expense")
    ) {
      if (
        normalizedQuestion.includes("month")
      ) {
        answer = `You have spent ${formatCurrency(
          monthlyExpenses
        )} this month.`;
      } else {
        answer = `Your total recorded expenses are ${formatCurrency(
          totalExpenses
        )}.`;
      }
    } else if (
      normalizedQuestion.includes("top") ||
      normalizedQuestion.includes("highest") ||
      normalizedQuestion.includes("most")
    ) {
      if (topCategory) {
        answer = `Your highest spending category is ${topCategory[0]} at ${formatCurrency(
          topCategory[1]
        )}.`;
      } else {
        answer =
          "You don't have any recorded expenses yet.";
      }
    } else if (
      normalizedQuestion.includes("summary") ||
      normalizedQuestion.includes("overview")
    ) {
      answer =
        `Here is your financial summary:\n\n` +
        `Income: ${formatCurrency(totalIncome)}\n` +
        `Expenses: ${formatCurrency(totalExpenses)}\n` +
        `Savings: ${formatCurrency(totalSavings)}\n` +
        `Available balance: ${formatCurrency(
          availableBalance
        )}`;
    } else {
      answer =
        "I can answer questions about your income, expenses, savings, balance and spending categories.";
    }

    return res.status(200).json({
      answer,
      data: {
        totalIncome,
        totalExpenses,
        totalSavings,
        availableBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        topCategory: topCategory
          ? {
              category: topCategory[0],
              amount: topCategory[1],
            }
          : null,
      },
    });
  } catch (error) {
    console.error(
      "Ask My Money error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to process your financial question",
    });
  }
}

module.exports = {
  askMyMoney,
};
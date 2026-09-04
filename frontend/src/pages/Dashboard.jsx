import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

function Dashboard() {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [savings, setSavings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await user.getIdToken();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [expensesResponse, incomeResponse, savingsResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/expenses`, { headers }),
          fetch(`${API_URL}/api/income`, { headers }),
          fetch(`${API_URL}/api/savings`, { headers }),
        ]);

      if (
        !expensesResponse.ok ||
        !incomeResponse.ok ||
        !savingsResponse.ok
      ) {
        throw new Error("Failed to load dashboard data");
      }

      const [expensesData, incomeData, savingsData] =
        await Promise.all([
          expensesResponse.json(),
          incomeResponse.json(),
          savingsResponse.json(),
        ]);

        setExpenses(
            Array.isArray(expensesData)
              ? expensesData
              : Array.isArray(expensesData.expenses)
              ? expensesData.expenses
              : []
          );
      setIncome(
        Array.isArray(incomeData) ? incomeData : []
      );

      setSavings(
        Array.isArray(savingsData) ? savingsData : []
      );
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Unable to load your financial data.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const isCurrentMonth = (date) => {
    if (!date) return false;

    const transactionDate = new Date(`${date}T00:00:00`);
    const now = new Date();

    return (
      transactionDate.getFullYear() === now.getFullYear() &&
      transactionDate.getMonth() === now.getMonth()
    );
  };

  const totalIncome = useMemo(
    () =>
      income.reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      ),
    [income]
  );

  const totalExpenses = useMemo(
    () =>
      expenses.reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      ),
    [expenses]
  );

  const totalSavings = useMemo(
    () =>
      savings.reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      ),
    [savings]
  );

  const availableBalance =
    totalIncome - totalExpenses - totalSavings;

  const monthlyIncome = useMemo(
    () =>
      income
        .filter((item) => isCurrentMonth(item.date))
        .reduce(
          (total, item) =>
            total + Number(item.amount || 0),
          0
        ),
    [income]
  );

  const monthlyExpenses = useMemo(
    () =>
      expenses
        .filter((item) => isCurrentMonth(item.date))
        .reduce(
          (total, item) =>
            total + Number(item.amount || 0),
          0
        ),
    [expenses]
  );

  const monthlySavings = useMemo(
    () =>
      savings
        .filter((item) => isCurrentMonth(item.date))
        .reduce(
          (total, item) =>
            total + Number(item.amount || 0),
          0
        ),
    [savings]
  );

  const categoryTotals = useMemo(() => {
    return expenses.reduce((totals, expense) => {
      const category = expense.category || "Other";

      totals[category] =
        (totals[category] || 0) +
        Number(expense.amount || 0);

      return totals;
    }, {});
  }, [expenses]);

  const categoryList = useMemo(() => {
    return Object.entries(categoryTotals)
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .map(([category, amount]) => ({
        category,
        amount,
      }));
  }, [categoryTotals]);

  const topCategory = categoryList[0];

  const recentActivity = useMemo(() => {
    const expenseItems = expenses.map((item) => ({
      ...item,
      type: "expense",
    }));

    const incomeItems = income.map((item) => ({
      ...item,
      type: "income",
    }));

    const savingItems = savings.map((item) => ({
      ...item,
      type: "saving",
    }));

    return [
      ...expenseItems,
      ...incomeItems,
      ...savingItems,
    ]
      .sort((a, b) => {
        return (
          new Date(b.date || 0) -
          new Date(a.date || 0)
        );
      })
      .slice(0, 5);
  }, [expenses, income, savings]);

  const getActivityName = (item) => {
    if (item.type === "expense") {
      return item.merchant || item.description || item.category;
    }

    if (item.type === "income") {
      return item.source || item.description || item.category;
    }

    return item.goal || item.description || item.category;
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading your financial overview...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Your complete financial overview
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Available Balance */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Available Balance
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(availableBalance)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Income − Expenses − Savings
          </p>
        </div>

        {/* Income */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Income
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(totalIncome)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            This month: {formatCurrency(monthlyIncome)}
          </p>
        </div>

        {/* Expenses */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Expenses
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatCurrency(totalExpenses)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            This month: {formatCurrency(monthlyExpenses)}
          </p>
        </div>

        {/* Savings */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Savings
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {formatCurrency(totalSavings)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            This month: {formatCurrency(monthlySavings)}
          </p>
        </div>
      </div>

      {/* Secondary Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Savings Rate
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {totalIncome > 0
              ? `${Math.round(
                  (totalSavings / totalIncome) * 100
                )}%`
              : "0%"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Based on total income
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Transactions
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {expenses.length +
              income.length +
              savings.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Income, expenses and savings
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Top Spending Category
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {topCategory?.category || "—"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {topCategory
              ? formatCurrency(topCategory.amount)
              : "No expenses yet"}
          </p>
        </div>
      </div>

      {/* Category Breakdown + Recent Activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">
              Spending by Category
            </h2>
          </div>

          {categoryList.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              No expenses recorded yet.
            </div>
          ) : (
            <div className="space-y-5 p-6">
              {categoryList.map(
                ({ category, amount }) => {
                  const percentage =
                    totalExpenses > 0
                      ? (amount / totalExpenses) * 100
                      : 0;

                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">
                          {category}
                        </span>

                        <span className="text-slate-500">
                          {formatCurrency(amount)}
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {Math.round(percentage)}%
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">
              Recent Activity
            </h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              No financial activity yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((item) => {
                const isExpense =
                  item.type === "expense";

                const isIncome =
                  item.type === "income";

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                        {isExpense
                          ? "💳"
                          : isIncome
                          ? "💰"
                          : "🏦"}
                      </div>

                      <div>
                        <p className="font-medium text-slate-900">
                          {getActivityName(item)}
                        </p>

                        <p className="text-xs text-slate-500">
                          {item.category} •{" "}
                          {formatDate(item.date)}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`font-semibold ${
                        isExpense
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {isExpense ? "-" : "+"}
                      {formatCurrency(
                        Number(item.amount || 0)
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
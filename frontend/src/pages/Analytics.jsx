import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

function Analytics() {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [savings, setSavings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await user.getIdToken();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        expensesResponse,
        incomeResponse,
        savingsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/expenses`, { headers }),
        fetch(`${API_URL}/api/income`, { headers }),
        fetch(`${API_URL}/api/savings`, { headers }),
      ]);

      if (
        !expensesResponse.ok ||
        !incomeResponse.ok ||
        !savingsResponse.ok
      ) {
        throw new Error("Failed to load analytics data");
      }

      const [
        expensesData,
        incomeData,
        savingsData,
      ] = await Promise.all([
        expensesResponse.json(),
        incomeResponse.json(),
        savingsResponse.json(),
      ]);

      // Expenses API returns { expenses: [...] }
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
      console.error("Analytics error:", err);
      setError("Unable to load your analytics.");
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

  const getMonthKey = (date) => {
    if (!date) return null;

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return `${parsedDate.getFullYear()}-${String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0")}`;
  };

  const getMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split("-");

    return new Date(
      Number(year),
      Number(month) - 1,
      1
    ).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
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

  const monthlyData = useMemo(() => {
    const months = {};

    const addTransaction = (item, type) => {
      const monthKey = getMonthKey(item.date);

      if (!monthKey) return;

      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          income: 0,
          expenses: 0,
          savings: 0,
        };
      }

      months[monthKey][type] += Number(
        item.amount || 0
      );
    };

    income.forEach((item) =>
      addTransaction(item, "income")
    );

    expenses.forEach((item) =>
      addTransaction(item, "expenses")
    );

    savings.forEach((item) =>
      addTransaction(item, "savings")
    );

    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [income, expenses, savings]);

  const currentMonthKey = getMonthKey(
    new Date().toISOString().split("T")[0]
  );

  const currentMonth = useMemo(() => {
    return (
      monthlyData.find(
        (item) => item.month === currentMonthKey
      ) || {
        income: 0,
        expenses: 0,
        savings: 0,
      }
    );
  }, [monthlyData, currentMonthKey]);

  const currentSavingsRate =
    currentMonth.income > 0
      ? Math.round(
          (currentMonth.savings /
            currentMonth.income) *
            100
        )
      : 0;

  const currentBalance =
    currentMonth.income -
    currentMonth.expenses -
    currentMonth.savings;

  const maxMonthlyValue = Math.max(
    ...monthlyData.flatMap((item) => [
      item.income,
      item.expenses,
      item.savings,
    ]),
    1
  );

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Analytics
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Understand your income, spending and savings
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Current Month */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">
          This Month
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Income
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {formatCurrency(currentMonth.income)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Expenses
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {formatCurrency(currentMonth.expenses)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Savings
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600">
              {formatCurrency(currentMonth.savings)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Savings Rate
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {currentSavingsRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            Monthly Overview
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Last 6 months with recorded activity
          </p>
        </div>

        {monthlyData.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No dated financial activity available yet.
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {monthlyData.map((item) => (
              <div key={item.month}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    {getMonthLabel(item.month)}
                  </p>

                  <p className="text-xs text-slate-400">
                    Balance:{" "}
                    {formatCurrency(
                      item.income -
                        item.expenses -
                        item.savings
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  {/* Income */}
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-xs text-slate-500">
                      Income
                    </span>

                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{
                          width: `${
                            (item.income /
                              maxMonthlyValue) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <span className="w-24 text-right text-xs font-medium text-slate-700">
                      {formatCurrency(item.income)}
                    </span>
                  </div>

                  {/* Expenses */}
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-xs text-slate-500">
                      Expenses
                    </span>

                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{
                          width: `${
                            (item.expenses /
                              maxMonthlyValue) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <span className="w-24 text-right text-xs font-medium text-slate-700">
                      {formatCurrency(item.expenses)}
                    </span>
                  </div>

                  {/* Savings */}
                  <div className="flex items-center gap-3">
                    <span className="w-16 text-xs text-slate-500">
                      Savings
                    </span>

                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${
                            (item.savings /
                              maxMonthlyValue) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <span className="w-24 text-right text-xs font-medium text-slate-700">
                      {formatCurrency(item.savings)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending Analysis */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Category */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">
              Spending by Category
            </h2>
          </div>

          {categoryList.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              No expenses available for analysis.
            </div>
          ) : (
            <div className="space-y-5 p-6">
              {categoryList.map(
                ({ category, amount }) => {
                  const percentage =
                    totalExpenses > 0
                      ? (amount / totalExpenses) *
                        100
                      : 0;

                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          {category}
                        </span>

                        <span className="text-sm text-slate-500">
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
                        {Math.round(percentage)}% of
                        total spending
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* Financial Health */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-semibold text-slate-900">
              Financial Summary
            </h2>
          </div>

          <div className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Total Income
              </span>

              <span className="font-semibold text-green-600">
                {formatCurrency(totalIncome)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Total Expenses
              </span>

              <span className="font-semibold text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Total Savings
              </span>

              <span className="font-semibold text-blue-600">
                {formatCurrency(totalSavings)}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">
                  Overall Balance
                </span>

                <span className="text-xl font-bold text-slate-900">
                  {formatCurrency(
                    totalIncome -
                      totalExpenses -
                      totalSavings
                  )}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Current Month Balance
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatCurrency(currentBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Coverage */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">
          Data Overview
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">
              Income Records
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              {income.length}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Expense Records
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              {expenses.length}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Savings Records
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              {savings.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
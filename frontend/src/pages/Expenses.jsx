import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const EXPENSE_CATEGORIES = [
  "Groceries",
  "Dining",
  "Transport",
  "Shopping",
  "Entertainment",
  "Travel",
  "Bills",
  "Healthcare",
  "Housing",
  "Utilities",
  "Subscriptions",
  "Other",
];

function Expenses() {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    amount: "",
    merchant: "",
    category: "Groceries",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await user.getIdToken();

      const response = await fetch(
        `${API_URL}/api/expenses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load expenses");
      }

      const data = await response.json();

      // Your API returns { expenses: [...] }
      setExpenses(
        Array.isArray(data)
          ? data
          : Array.isArray(data.expenses)
          ? data.expenses
          : []
      );
    } catch (err) {
      console.error("Load expenses error:", err);
      setError("Unable to load expenses.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    try {
      setSaving(true);

      const token = await user.getIdToken();

      const response = await fetch(
        `${API_URL}/api/expenses/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: Number(form.amount),
            currency: "INR",
            merchant: form.merchant.trim() || null,
            category: form.category,
            date:
              form.date ||
              new Date().toISOString().split("T")[0],
            description: form.description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save expense"
        );
      }

      // Add the newly-created expense immediately
      setExpenses((previous) => [
        data.expense || data,
        ...previous,
      ]);

      // Reset form
      setForm({
        amount: "",
        merchant: "",
        category: "Groceries",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });

      setShowForm(false);
    } catch (err) {
      console.error("Save expense error:", err);
      setError(
        err.message || "Unable to save expense."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = await user.getIdToken();

      const response = await fetch(
        `${API_URL}/api/expenses/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      setExpenses((previous) =>
        previous.filter((expense) => expense.id !== id)
      );
    } catch (err) {
      console.error("Delete expense error:", err);
      setError("Unable to delete expense.");
    }
  };

  const totalExpenses = expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount || 0),
    0
  );

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

  const getCategoryIcon = (category) => {
    const icons = {
      Groceries: "🛒",
      Dining: "🍽️",
      Transport: "🚗",
      Shopping: "🛍️",
      Entertainment: "🎬",
      Travel: "✈️",
      Bills: "🧾",
      Healthcare: "🏥",
      Housing: "🏠",
      Utilities: "💡",
      Subscriptions: "📱",
      Other: "💳",
    };

    return icons[category] || "💳";
  };

  return (
    <div className="min-h-full bg-slate-50 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Expenses
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track and manage your spending
          </p>
        </div>

        <button
          onClick={() =>
            setShowForm((previous) => !previous)
          }
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "+ Add Expense"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Expenses
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalExpenses)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Transactions
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {expenses.length}
          </p>
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Add Expense
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Amount
              </label>

              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="850"
                min="0"
                step="0.01"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            {/* Merchant */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Merchant
              </label>

              <input
                type="text"
                name="merchant"
                value={form.merchant}
                onChange={handleChange}
                placeholder="Swiggy"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Date
              </label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Food order"
                rows="3"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            {/* Submit */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Expense"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense List */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            Recent Expenses
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              No expenses recorded yet.
            </p>

            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-medium text-slate-900 underline"
            >
              Add your first expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
                    {getCategoryIcon(
                      expense.category
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-slate-900">
                      {expense.merchant ||
                        expense.category}
                    </p>

                    <p className="text-sm text-slate-500">
                      {expense.category} •{" "}
                      {formatDate(expense.date)}
                    </p>

                    {expense.description && (
                      <p className="mt-1 text-xs text-slate-400">
                        {expense.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-semibold text-red-600">
                    -{formatCurrency(
                      Number(expense.amount || 0)
                    )}
                  </p>

                  <button
                    onClick={() =>
                      handleDelete(expense.id)
                    }
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Expenses;
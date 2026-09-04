import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Other",
];

function Income() {
  const { user } = useAuth();

  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    amount: "",
    category: "Salary",
    source: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    if (user) {
      loadIncome();
    }
  }, [user]);

  const loadIncome = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/income`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load income");
      }

      const data = await response.json();

      setIncome(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load income.");
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

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/income`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(form.amount),
          category: form.category,
          source: form.source.trim() || null,
          date: form.date,
          description: form.description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save income");
      }

      setIncome((previous) => [data, ...previous]);

      setForm({
        amount: "",
        category: "Salary",
        source: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });

      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to save income.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this income?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/income/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete income");
      }

      setIncome((previous) =>
        previous.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error(err);
      setError("Unable to delete income.");
    }
  };

  const totalIncome = income.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const transactionCount = income.length;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-full bg-slate-50 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Income
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track and manage your income
          </p>
        </div>

        <button
          onClick={() => setShowForm((previous) => !previous)}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "+ Add Income"}
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
            Total Income
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Transactions
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {transactionCount}
          </p>
        </div>
      </div>

      {/* Add Income Form */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Add Income
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
                placeholder="50000"
                min="0"
                step="0.01"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                required
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
                {INCOME_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Source
              </label>

              <input
                type="text"
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="Company"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />
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
                placeholder="September salary"
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
                {saving ? "Saving..." : "Save Income"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Income List */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            Recent Income
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Loading income...
          </div>
        ) : income.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              No income recorded yet.
            </p>

            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-medium text-slate-900 underline"
            >
              Add your first income
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {income.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
                    💰
                  </div>

                  <div>
                    <p className="font-medium text-slate-900">
                      {item.source || item.category}
                    </p>

                    <p className="text-sm text-slate-500">
                      {item.category} • {formatDate(item.date)}
                    </p>

                    {item.description && (
                      <p className="mt-1 text-xs text-slate-400">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-semibold text-green-600">
                    +{formatCurrency(Number(item.amount || 0))}
                  </p>

                  <button
                    onClick={() => handleDelete(item.id)}
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

export default Income;
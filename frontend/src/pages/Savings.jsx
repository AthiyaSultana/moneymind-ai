import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const SAVING_CATEGORIES = [
  "Emergency Fund",
  "Investment",
  "SIP",
  "Goal",
  "Other",
];

function Savings() {
  const { user } = useAuth();

  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    amount: "",
    category: "Emergency Fund",
    goal: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    if (user) {
      loadSavings();
    }
  }, [user]);

  const loadSavings = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/savings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load savings");
      }

      const data = await response.json();

      setSavings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load savings.");
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

      const response = await fetch(`${API_URL}/api/savings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(form.amount),
          category: form.category,
          goal: form.goal.trim() || null,
          date: form.date,
          description: form.description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save saving");
      }

      setSavings((previous) => [data, ...previous]);

      setForm({
        amount: "",
        category: "Emergency Fund",
        goal: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });

      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to save savings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saving?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/savings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete saving");
      }

      setSavings((previous) =>
        previous.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error(err);
      setError("Unable to delete saving.");
    }
  };

  const totalSavings = savings.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const transactionCount = savings.length;

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
            Savings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Build and track your savings
          </p>
        </div>

        <button
          onClick={() => setShowForm((previous) => !previous)}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "+ Add Saving"}
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
            Total Saved
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalSavings)}
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

      {/* Add Saving Form */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Add Saving
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
                placeholder="8000"
                min="0"
                step="0.01"
                required
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
                {SAVING_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Goal */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Goal
              </label>

              <input
                type="text"
                name="goal"
                value={form.goal}
                onChange={handleChange}
                placeholder="Emergency fund"
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
                placeholder="Monthly emergency fund contribution"
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
                {saving ? "Saving..." : "Save Saving"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Savings List */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            Savings History
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Loading savings...
          </div>
        ) : savings.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-500">
              No savings recorded yet.
            </p>

            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-medium text-slate-900 underline"
            >
              Add your first saving
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {savings.map((item) => (
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
                      {item.goal || item.category}
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

export default Savings;
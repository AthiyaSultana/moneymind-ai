import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

function Journal() {
  const { user } = useAuth();

  const [entries, setEntries] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [detectedExpense, setDetectedExpense] = useState(null);
  const [savingExpense, setSavingExpense] = useState(false);

  const messagesEndRef = useRef(null);

  // --------------------------------------------------
  // Load journal entries
  // --------------------------------------------------

  useEffect(() => {
    if (user) {
      loadJournal();
    }
  }, [user]);

  // --------------------------------------------------
  // Scroll to latest message
  // --------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [entries]);

  // --------------------------------------------------
  // Load Journal
  // --------------------------------------------------

  const loadJournal = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/journal`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load journal");
      }

      const data = await response.json();

      setEntries(
        Array.isArray(data.entries)
          ? data.entries.filter(Boolean)
          : []
      );
    } catch (err) {
      console.error(err);
      setError("Unable to load your journal.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Send Journal Message
  // --------------------------------------------------

  const sendMessage = async (event) => {
    if (event) {
      event.preventDefault();
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending) {
      return;
    }

    setSending(true);
    setError("");

    // Clear any previous detected expense
    setDetectedExpense(null);

    // --------------------------------------------------
    // Show user's message immediately
    // --------------------------------------------------

    const temporaryUserMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: trimmedMessage,
    };

    setEntries((prevEntries) => [
      ...prevEntries,
      temporaryUserMessage,
    ]);

    setMessage("");

    try {
      const token = await user.getIdToken();

      // --------------------------------------------------
      // 1. Send message to Journal API
      // --------------------------------------------------

      const response = await fetch(
        `${API_URL}/api/journal/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: trimmedMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to send message"
        );
      }

      // --------------------------------------------------
      // 2. Add Gemini response to Journal
      // --------------------------------------------------

      if (data.assistantMessage) {
        setEntries((prevEntries) => [
          ...prevEntries,
          data.assistantMessage,
        ]);
      }

      // --------------------------------------------------
      // 3. Detect possible expense
      // --------------------------------------------------

      try {
        const expenseResponse = await fetch(
          `${API_URL}/api/expenses/extract`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              message: trimmedMessage,
            }),
          }
        );

        const expenseData = await expenseResponse.json();

        if (
          expenseResponse.ok &&
          expenseData.expense?.isExpense === true &&
          typeof expenseData.expense?.amount === "number" &&
          expenseData.expense.amount > 0
        ) {
          setDetectedExpense(expenseData.expense);
        }
      } catch (expenseError) {
        // Expense detection should never break Journal
        console.error(
          "Expense detection failed:",
          expenseError
        );
      }
    } catch (error) {
      console.error(
        "Failed to send journal message:",
        error
      );

      setError(
        "Unable to get a response. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  // --------------------------------------------------
  // Confirm and save expense
  // --------------------------------------------------

  const confirmExpense = async () => {
    if (!detectedExpense || savingExpense) {
      return;
    }

    try {
      setSavingExpense(true);
      setError("");

      const token = await user.getIdToken();

      const response = await fetch(
        `${API_URL}/api/expenses/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(detectedExpense),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save expense"
        );
      }

      console.log("Expense saved:", data.expense);

      setDetectedExpense(null);
    } catch (error) {
      console.error(
        "Failed to save expense:",
        error
      );

      setError(
        "Unable to save expense. Please try again."
      );
    } finally {
      setSavingExpense(false);
    }
  };

  // --------------------------------------------------
  // Dismiss expense
  // --------------------------------------------------

  const dismissExpense = () => {
    setDetectedExpense(null);
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-slate-50">

      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-4xl">

          <h1 className="text-2xl font-bold text-slate-900">
            MoneyMind Journal
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Talk about your money, expenses and financial goals.
          </p>

        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">

        <div className="mx-auto max-w-4xl">

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
            </div>
          )}

          {/* Empty Journal */}
          {!loading && entries.length === 0 && (
            <div className="flex min-h-[400px] items-center justify-center">

              <div className="max-w-md text-center">

                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
                  💰
                </div>

                <h2 className="text-xl font-semibold text-slate-900">
                  Welcome to MoneyMind
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Start a conversation about your finances.
                  Tell me about an expense, income, savings goal,
                  or anything related to your money.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">

                  {/* Expense suggestion */}
                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        "I spent ₹450 on groceries today"
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-700 shadow-sm transition hover:border-slate-400 hover:shadow"
                  >
                    🛒

                    <span className="ml-2">
                      Track an expense
                    </span>
                  </button>

                  {/* Savings suggestion */}
                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        "Help me create a monthly savings goal"
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-700 shadow-sm transition hover:border-slate-400 hover:shadow"
                  >
                    🏦

                    <span className="ml-2">
                      Plan savings
                    </span>
                  </button>

                </div>

              </div>
            </div>
          )}

          {/* Conversation */}
          <div className="space-y-5">

            {entries
              .filter(Boolean)
              .map((entry, index) => {

                const isUser = entry.role === "user";

                return (
                  <div
                    key={
                      entry.id ||
                      `${entry.role}-${index}`
                    }
                    className={`flex ${
                      isUser
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                        isUser
                          ? "rounded-br-md bg-slate-900 text-white"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm"
                      }`}
                    >

                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {entry.content}
                      </p>

                    </div>

                  </div>
                );
              })}

            {/* Gemini typing indicator */}
            {sending && (
              <div className="flex justify-start">

                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-5 py-3 shadow-sm">

                  <div className="flex gap-1">

                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />

                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />

                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />

                  </div>

                </div>

              </div>
            )}

            <div ref={messagesEndRef} />

          </div>

        </div>

      </div>

      {/* Expense Confirmation */}
      {detectedExpense && (
        <div className="mx-auto mb-4 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4">

            <p className="text-sm font-semibold text-slate-900">
              💰 Expense detected
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Would you like to add this to your expenses?
            </p>

          </div>

          <div className="rounded-xl bg-slate-50 p-4">

            {/* Amount */}
            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Amount
              </span>

              <span className="text-lg font-semibold text-slate-900">
                ₹{detectedExpense.amount}
              </span>

            </div>

            {/* Merchant */}
            <div className="mt-2 flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Merchant
              </span>

              <span className="text-sm font-medium text-slate-900">
                {detectedExpense.merchant ||
                  "Not specified"}
              </span>

            </div>

            {/* Category */}
            <div className="mt-2 flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Category
              </span>

              <span className="text-sm font-medium text-slate-900">
                {detectedExpense.category}
              </span>

            </div>

            {/* Date */}
            <div className="mt-2 flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Date
              </span>

              <span className="text-sm font-medium text-slate-900">
                {detectedExpense.date ||
                  "Not specified"}
              </span>

            </div>

          </div>

          {/* Buttons */}
          <div className="mt-4 flex gap-3">

            <button
              type="button"
              onClick={confirmExpense}
              disabled={savingExpense}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingExpense
                ? "Saving..."
                : "Add Expense"}
            </button>

            <button
              type="button"
              onClick={dismissExpense}
              disabled={savingExpense}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Dismiss
            </button>

          </div>

        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-auto w-full max-w-4xl px-4">

          <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>

        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-4 py-4">

        <form
          onSubmit={sendMessage}
          className="mx-auto flex max-w-4xl items-end gap-3"
        >

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            onKeyDown={(event) => {

              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();

                sendMessage(event);
              }

            }}
            placeholder="Tell me about your money..."
            rows={1}
            className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200"
          />

          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↑
          </button>

        </form>

        <p className="mx-auto mt-2 max-w-4xl text-xs text-slate-400">
          Press Enter to send · Shift + Enter for a new line
        </p>

      </div>

    </div>
  );
}

export default Journal;
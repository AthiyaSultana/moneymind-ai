import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const suggestedQuestions = [
  "How much did I spend this month?",
  "How much have I saved?",
  "What is my available balance?",
  "What is my top spending category?",
  "Give me a summary of my finances",
];

function AskMyMoney() {
  const { user } = useAuth();

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askQuestion = async (questionText) => {
    const trimmedQuestion = questionText.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    setError("");

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: trimmedQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const token = await user.getIdToken();

      const response = await fetch(
        `${API_URL}/api/ask-money`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: trimmedQuestion,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to process question"
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.answer,
        },
      ]);
    } catch (err) {
      console.error(
        "Ask My Money error:",
        err
      );

      setError(
        err.message ||
          "Unable to get an answer."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    askQuestion(question);
  };

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Ask My Money
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Ask questions about your personal finances
        </p>
      </div>

      <div className="mt-6 max-w-4xl">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {messages.length === 0 && (
            <div className="px-6 py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-xl">
                🤖
              </div>

              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                Your personal financial assistant
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Ask questions about your income,
                expenses and savings. MoneyMind
                answers using your authenticated
                financial data.
              </p>

              <div className="mt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Try asking
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestedQuestions.map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() =>
                          askQuestion(suggestion)
                        }
                        className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-white"
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="max-h-[500px] space-y-5 overflow-y-auto p-6">
              {messages.map(
                (message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {message.text
                        .split("\n")
                        .map(
                          (line, lineIndex) => (
                            <p key={lineIndex}>
                              {line ||
                                "\u00A0"}
                            </p>
                          )
                        )}
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                    Analyzing your finances...
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="border-t border-slate-200 p-4">
            <form
              onSubmit={handleSubmit}
              className="flex gap-3"
            >
              <input
                type="text"
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                placeholder="Ask about your finances..."
                className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  !question.trim()
                }
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "..." : "Ask"}
              </button>
            </form>

            <p className="mt-2 text-xs text-slate-400">
              MoneyMind provides informational
              insights, not professional financial
              advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AskMyMoney;
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { register, login } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }

      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      setError("Unable to authenticate. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">

      {/* Background decoration */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">

        {/* Brand */}
        <div className="mb-8 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-slate-950 shadow-lg">
            ₹
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">
            MoneyMind AI
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Your intelligent personal finance companion
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-7 shadow-2xl sm:p-8">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {isRegistering
                ? "Create your account"
                : "Welcome back"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isRegistering
                ? "Start managing your money smarter."
                : "Sign in to continue to your financial journal."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  isRegistering
                    ? "new-password"
                    : "current-password"
                }
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Please wait..."
                : isRegistering
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          {/* Switch */}
          <div className="mt-6 border-t border-slate-100 pt-6 text-center">

            <button
              type="button"
              onClick={() => {
                setError("");
                setIsRegistering((value) => !value);
              }}
              className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500 hover:underline"
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </button>

          </div>
        </div>

        {/* Privacy */}
        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          Your financial information is private and protected by
          user-specific authentication and data isolation.
        </p>

      </div>
    </div>
  );
}

export default LoginPage;
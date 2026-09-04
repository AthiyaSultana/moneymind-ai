import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Journal from "./pages/Journal";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Savings from "./pages/Savings";
import Analytics from "./pages/Analytics";
import AskMyMoney from "./pages/AskMyMoney";

function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading...
        </p>
      </div>
    );
  }
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================= */}

        <Route
          path="/login"
          element={
            user
              ? <Navigate to="/dashboard" replace />
              : <LoginPage />
          }
        />

        {/* =========================
            PROTECTED ROUTES
        ========================= */}

        <Route element={<ProtectedRoute />}>

          <Route element={<AppLayout />}>

            <Route
              path="/"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/journal"
              element={<Journal />}
            />

            <Route
              path="/expenses"
              element={<Expenses />}
            />

            <Route
              path="/income"
              element={<Income />}
            />

            <Route
              path="/savings"
              element={<Savings />}
            />

            <Route
              path="/analytics"
              element={<Analytics />}
            />

            <Route
              path="/ask-my-money"
              element={<AskMyMoney />}
            />

          </Route>

        </Route>

        {/* Unknown route */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import PaymentsPage from "./pages/PaymentsPage";
import DocumentsPage from "./pages/DocumentsPage";
import MonthlyOverviewPage from "./pages/MonthlyOverviewPage";
import { supabase } from "./lib/supabase";
import type { Bill } from "./types/Bill";
import type { Session } from "@supabase/supabase-js";

// ── Protected route — redirects to /login if not authenticated ────────────────
function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [session,      setSession]      = useState<Session | null>(null);
  const [authLoading,  setAuthLoading]  = useState(true); // true until we know auth state
  const [bills,        setBills]        = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(true);

  // ── Listen to auth state changes ──────────────────────────────────────────
  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Load bills from Supabase when user is logged in ───────────────────────
  useEffect(() => {


    async function fetchBills() {

      if (!session) {
      setBills([]);
      setBillsLoading(false);
      return;
      }
      setBillsLoading(true);
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load bills:", error.message);
        setBillsLoading(false);
        return;
      }

      const mapped: Bill[] = (data ?? []).map((row) => ({
        id:       row.id,
        name:     row.name,
        amount:   row.amount,
        paid:     row.paid,
        dueDate:  row.due_date,
        category: row.category,
      }));

      setBills(mapped);
      setBillsLoading(false);
    }

    fetchBills();
  }, [session]); // re-fetch when session changes

  // ── Show nothing while checking auth (prevents flash of login page) ───────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4a8c6a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={session ? <Navigate to="/dashboard" replace /> : <SignUpPage />}
        />

        {/* Protected routes — require login */}
        <Route
          element={
            <ProtectedRoute session={session}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard bills={bills} loading={billsLoading} />} />
          <Route path="/calendar"  element={<CalendarPage />} />
          <Route path="/payments"  element={<PaymentsPage bills={bills} setBills={setBills} />} />
          <Route path="/documents" element={<DocumentsPage setBills={setBills} />} />
          <Route path="/monthly-overview" element={<MonthlyOverviewPage bills={bills} />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

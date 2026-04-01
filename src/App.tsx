import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import CalendarPage from "./pages/CalendarPage";
import PaymentsPage from "./pages/PaymentsPage";
import DocumentsPage from "./pages/DocumentsPage";
import { supabase } from "./lib/supabase";
import type { Bill } from "./types/Bill";

export default function App() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(true);

  // ── Load bills from Supabase on app start ─────────────────────────────────
  useEffect(() => {
    async function fetchBills() {
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

      // Map Supabase snake_case → our camelCase Bill type
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
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route element={<Layout />}>
          <Route
            path="/dashboard"
            element={<Dashboard bills={bills} loading={billsLoading} />}
          />
          <Route
            path="/calendar"
            element={<CalendarPage />}
          />
          <Route
            path="/payments"
            element={<PaymentsPage bills={bills} setBills={setBills} />}
          />
          <Route
            path="/documents"
            element={<DocumentsPage setBills={setBills} />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

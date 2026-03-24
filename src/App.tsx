import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/CalendarPage'
import PaymentsPage from './pages/PaymentsPage'
import type { Bill } from "./types/Bill";

const initialBills: Bill[] = [
  { id: "1", name: "Rent",        amount: 1500, paid: true,  dueDate: "2026-03-01", category: "Housing"   },
  { id: "2", name: "Electricity", amount: 120,  paid: false, dueDate: "2026-03-20", category: "Utilities" },
  { id: "3", name: "Internet",    amount: 65,   paid: false, dueDate: "2026-03-22", category: "Utilities" },
  { id: "4", name: "Water",       amount: 45,   paid: true,  dueDate: "2026-03-15", category: "Utilities" },
  { id: "5", name: "Gas",         amount: 78,   paid: true,  dueDate: "2026-03-12", category: "Utilities" },
]

function App() {
  const [bills, setBills] = useState<Bill[]>(initialBills)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard bills={bills} />} />
          <Route path="/calendar"  element={<CalendarPage />} />
          <Route path="/payments"  element={<PaymentsPage bills={bills} setBills={setBills} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import Dashboard from './pages/Dashboard'
import CalendarPage from './pages/CalendarPage'
import PaymentsPage from './pages/PaymentsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route element={<Layout />}>
         <Route path="/dashboard" element={<Dashboard />} />
         <Route path="/calendar" element={<CalendarPage />} />
         <Route path="/payments" element={<PaymentsPage />} />
       </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

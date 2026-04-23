import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import ProjectIntake from '@/pages/ProjectIntake'
import ContractorResults from '@/pages/ContractorResults'
import ProjectPayment from '@/pages/ProjectPayment'
import PaymentReturn from '@/pages/PaymentReturn'
import ClaimPassword from '@/pages/ClaimPassword'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import { useAuthStore } from '@/stores/auth'

export default function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        {/* Full-screen pages — no header/footer */}
        <Route path="/project/new" element={<ProjectIntake />} />
        <Route path="/project/:id/pay" element={<ProjectPayment />} />
        <Route path="/project/:id/payment/return" element={<PaymentReturn />} />
        <Route path="/project/:id/claim" element={<ClaimPassword />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/project/:id/results" element={<ContractorResults />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

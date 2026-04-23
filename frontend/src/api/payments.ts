import api from './client'

export interface CheckoutSessionResponse {
  payment_id: string
  checkout_session_id: string
  client_secret: string
  publishable_key: string
  amount_cents: number
  currency: string
}

export interface PaymentStatusResponse {
  payment_id: string
  project_id: string
  checkout_session_id: string | null
  status: 'pending' | 'completed' | 'failed'
  amount_cents: number
  currency: string
  payment_type: string
}

interface ApiResponse<T> {
  data: T
}

export const paymentsApi = {
  createCheckoutSession: (projectId: string, paymentType = 'test_payment') =>
    api.post<ApiResponse<CheckoutSessionResponse>, ApiResponse<CheckoutSessionResponse>>(
      '/payments/checkout-session',
      { project_id: projectId, payment_type: paymentType }
    ),
  getSessionStatus: (checkoutSessionId: string) =>
    api.get<ApiResponse<PaymentStatusResponse>, ApiResponse<PaymentStatusResponse>>(
      `/payments/session/${checkoutSessionId}`
    ),
}

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Sparkles } from 'lucide-react'
import { paymentsApi, type PaymentStatusResponse } from '@/api/payments'
import { useAuthStore } from '@/stores/auth'

type Phase = 'loading' | 'success' | 'failed' | 'timeout' | 'not_found'

const POLL_INTERVAL_MS = 1000
const POLL_MAX_TRIES = 15 // ~15s total to wait for webhook
const SUCCESS_REDIRECT_DELAY_MS = 2000

export default function PaymentReturn() {
  const { id: projectId } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = params.get('session_id')
  const refreshMe = useAuthStore((s) => s.refreshMe)

  const [phase, setPhase] = useState<Phase>('loading')
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const triesRef = useRef(0)

  useEffect(() => {
    if (!sessionId) {
      setPhase('not_found')
      setMessage('Missing Stripe session id in the return URL.')
      return
    }

    let cancelled = false

    const poll = async () => {
      try {
        const res = await paymentsApi.getSessionStatus(sessionId)
        if (cancelled) return
        const p = res.data
        setPayment(p)
        if (p.status === 'completed') {
          setPhase('success')
          return
        }
        if (p.status === 'failed') {
          // The backend intentionally does not expose failure_reason in
          // the API response — render a generic message to the user.
          setPhase('failed')
          setMessage(null)
          return
        }
        // still pending → try again unless we've exhausted tries
        triesRef.current += 1
        if (triesRef.current >= POLL_MAX_TRIES) {
          setPhase('timeout')
          return
        }
        setTimeout(poll, POLL_INTERVAL_MS)
      } catch (err: any) {
        if (cancelled) return
        if (err?.response?.status === 404) {
          setPhase('not_found')
          setMessage('We couldn’t find a payment for this session.')
          return
        }
        setPhase('failed')
        setMessage(err?.response?.data?.detail || err?.message || 'Something went wrong.')
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  useEffect(() => {
    if (phase !== 'success' || !projectId) return
    let cancelled = false

    // After a successful charge, if the account was auto-created from intake
    // and still carries the throwaway password, route the user to the claim
    // screen so they can set a real password. Otherwise go to results.
    const t = setTimeout(async () => {
      await refreshMe()
      if (cancelled) return
      const current = useAuthStore.getState().user
      const purchased = payment?.payment_type
      const resultsUrl = purchased
        ? `/project/${projectId}/results?purchased=${purchased}`
        : `/project/${projectId}/results`
      if (current && !current.password_set) {
        navigate(`/project/${projectId}/claim`, { replace: true })
      } else {
        navigate(resultsUrl, { replace: true })
      }
    }, SUCCESS_REDIRECT_DELAY_MS)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [phase, projectId, navigate, refreshMe, payment?.payment_type])

  return (
    <div className="min-h-screen bg-[#0c0f14] flex flex-col">
      <div className="flex-shrink-0 border-b border-white/10 bg-[#0c0f14]/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <Link
            to="/"
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-headline font-bold text-white text-base">
            helpico<span className="text-primary">.ai</span>
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6 py-10">
          {phase === 'loading' && (
            <>
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h1 className="font-headline font-bold text-white text-xl">
                  Confirming your payment…
                </h1>
                <p className="text-neutral-400 text-sm mt-1">
                  This usually takes a second or two.
                </p>
              </div>
            </>
          )}

          {phase === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h1 className="font-headline font-bold text-white text-2xl">
                  Payment successful
                </h1>
                <p className="text-neutral-400 text-sm mt-2">
                  {payment
                    ? `We received $${(payment.amount_cents / 100).toFixed(2)}.`
                    : 'Thanks!'}{' '}
                  Redirecting you to your contractor matches…
                </p>
              </div>
              {projectId && (
                <Link
                  to={`/project/${projectId}/results`}
                  className="inline-block px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Go now
                </Link>
              )}
            </>
          )}

          {phase === 'failed' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <h1 className="font-headline font-bold text-white text-2xl">
                  Payment didn't go through
                </h1>
                <p className="text-neutral-400 text-sm mt-2">
                  {message || 'Please try again with a different payment method.'}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                {projectId && (
                  <Link
                    to={`/project/${projectId}/pay`}
                    className="inline-block px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Try again
                  </Link>
                )}
                <Link
                  to="/"
                  className="inline-block px-5 py-2.5 rounded-xl bg-white/5 text-neutral-200 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </>
          )}

          {phase === 'timeout' && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="font-headline font-bold text-white text-xl">
                  Still processing…
                </h1>
                <p className="text-neutral-400 text-sm mt-2">
                  Your bank hasn't confirmed the payment yet. Refresh this page
                  in a minute, or check back later.
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="inline-block px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Refresh
              </button>
            </>
          )}

          {phase === 'not_found' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <h1 className="font-headline font-bold text-white text-2xl">
                  We couldn't find that payment
                </h1>
                <p className="text-neutral-400 text-sm mt-2">
                  {message || 'That checkout session does not exist.'}
                </p>
              </div>
              <Link
                to="/project/new"
                className="inline-block px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Start over
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

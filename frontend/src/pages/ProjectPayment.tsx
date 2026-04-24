import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react'
import { paymentsApi } from '@/api/payments'

const stripePromiseCache = new Map<string, Promise<Stripe | null>>()

function stripePromise(pk: string) {
  if (!stripePromiseCache.has(pk)) {
    stripePromiseCache.set(pk, loadStripe(pk))
  }
  return stripePromiseCache.get(pk)!
}

const PAYMENT_TYPE_COPY: Record<string, { title: string; tagline: string }> = {
  test_payment: {
    title: 'Unlock your contractor matches',
    tagline: 'One-time payment to view your top ranked contractors.',
  },
  concierge_full: {
    title: 'Negotiate with contractors',
    tagline: 'Our AI concierge reaches out, coordinates visits, and handles back-and-forth.',
  },
  concierge_vetting: {
    title: 'Get the best price',
    tagline: 'We vet contractors and negotiate the lowest price on your behalf.',
  },
  design_session: {
    title: 'AI design session',
    tagline: 'Explore design options and materials with a guided AI consultation.',
  },
  concierge_bundle: {
    title: 'Full concierge bundle',
    tagline: 'Vetting, negotiation, and project coordination — everything in one.',
  },
}

export default function ProjectPayment() {
  const { id: projectId } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const paymentType = params.get('type') || 'test_payment'
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [publishableKey, setPublishableKey] = useState<string | null>(null)
  const [amountCents, setAmountCents] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const copy = PAYMENT_TYPE_COPY[paymentType] || PAYMENT_TYPE_COPY.test_payment

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    paymentsApi
      .createCheckoutSession(projectId, paymentType)
      .then((res) => {
        if (cancelled) return
        setClientSecret(res.data.client_secret)
        setPublishableKey(res.data.publishable_key)
        setAmountCents(res.data.amount_cents)
      })
      .catch((err) => {
        if (cancelled) return
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.error?.message ||
          err?.message ||
          'Unable to start checkout.'
        setError(msg)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, paymentType])

  const options = useMemo(
    () => (clientSecret ? { clientSecret } : undefined),
    [clientSecret]
  )

  return (
    <div className="min-h-screen bg-[#0c0f14] flex flex-col">
      {/* Header */}
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

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div className="space-y-2">
            <h1 className="font-headline font-bold text-white text-2xl">
              {copy.title}
            </h1>
            <p className="text-neutral-400 text-sm">
              {copy.tagline}{' '}
              {amountCents != null && (
                <span className="text-white font-semibold">
                  ${(amountCents / 100).toFixed(2)}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2 text-neutral-500 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure payment via Stripe. We never see your card details.
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/*
            The Embedded Checkout iframe interior is Stripe-controlled; its
            base light/dark theme is configured in the Stripe Dashboard under
            Settings → Branding → Checkout. Here we only style the wrapper so
            it blends with the dark page surround.
          */}
          <div
            id="stripe-checkout-container"
            className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.03]"
          >
            {options && publishableKey ? (
              <EmbeddedCheckoutProvider
                stripe={stripePromise(publishableKey)}
                options={options}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            ) : !error ? (
              <div className="py-16 flex items-center justify-center text-neutral-500 text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                Loading secure checkout…
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

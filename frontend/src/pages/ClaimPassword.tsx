import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, Lock, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

/**
 * Post-payment password claim. The user's account was created with a
 * throwaway password during intake; this screen lets them choose their
 * real one before we drop them into the contractor results.
 */
export default function ClaimPassword() {
  const { id: projectId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const claimPassword = useAuthStore((s) => s.claimPassword)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // If the visitor doesn't need to claim (already set, or no account),
  // bounce them straight to results.
  useEffect(() => {
    if (user && user.password_set && projectId) {
      navigate(`/project/${projectId}/results`, { replace: true })
    }
  }, [user, projectId, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setIsSaving(true)
    try {
      await claimPassword(password)
      if (projectId) {
        navigate(`/project/${projectId}/results`, { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error?.message ||
          'Could not save your password. Try again.'
      )
      setIsSaving(false)
    }
  }

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
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="font-headline font-bold text-white text-2xl">
              Payment received
            </h1>
            <p className="text-neutral-400 text-sm mt-2">
              Last step — pick a password so you can sign back in anytime and
              keep track of your project.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-white/[0.03] border border-white/10 rounded-xl p-6"
          >
            {user?.email && (
              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                <Lock className="w-4 h-4 text-primary" />
                Setting password for{' '}
                <span className="text-white font-medium">{user.email}</span>
              </div>
            )}

            <label className="block">
              <span className="text-xs text-neutral-400">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
                className="mt-1 w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </label>

            <label className="block">
              <span className="text-xs text-neutral-400">Confirm password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter it"
                autoComplete="new-password"
                required
                minLength={8}
                className="mt-1 w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </label>

            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving…' : 'Save password and see my contractors'}
            </button>
          </form>

          <p className="text-center text-xs text-neutral-600 mt-4">
            You can skip this later from your account, but your project is
            already saved either way.
          </p>
        </div>
      </div>
    </div>
  )
}

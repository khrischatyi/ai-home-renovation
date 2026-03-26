import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuthStore } from '@/stores/auth'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await register(email, password, fullName || undefined)
      navigate('/dashboard')
    } catch {
      setError('Could not create account. Email may already be in use.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-cream min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-headline font-bold text-3xl">Create your account</h1>
          <p className="text-muted-foreground mt-2">Start your renovation journey</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Email"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button variant="primary" size="lg" className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

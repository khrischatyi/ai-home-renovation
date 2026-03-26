import { Link } from 'react-router-dom'
import { Sparkles, LogIn } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth'

export default function Header() {
  const { isAuthenticated, logout } = useAuthStore()

  return (
    <header className="bg-dark/90 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-headline font-bold text-xl text-white">helpico<span className="text-primary">.ai</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/project/new" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              Start Project
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => logout()}>
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                </Link>
                <Link to="/project/new">
                  <Button variant="primary" size="sm">Get Started Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

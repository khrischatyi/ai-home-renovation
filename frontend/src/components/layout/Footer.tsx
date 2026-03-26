import { Sparkles, Shield, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-dark text-dark-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="font-headline font-bold text-xl">helpico<span className="text-primary">.ai</span></span>
            </div>
            <p className="text-neutral-400 max-w-md">
              The first AI-native home renovation platform that serves homeowners, not contractors.
              Your data stays yours.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Shield className="w-4 h-4 text-green-400" />
                <span>No data sales</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Lock className="w-4 h-4 text-green-400" />
                <span>Privacy first</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-headline font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-neutral-400">
              <li><Link to="/project/new" className="hover:text-white transition-colors">Start a Project</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-headline font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-neutral-400">
              <li><Link to="/" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-12 pt-8 text-center text-sm text-neutral-500">
          &copy; {new Date().getFullYear()} helpico.ai. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

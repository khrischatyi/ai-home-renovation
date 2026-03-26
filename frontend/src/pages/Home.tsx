import { Link } from 'react-router-dom'
import { Bath, ChefHat, Square, Home as HomeIcon, Shield, Lock, Eye, Zap, DollarSign, Paintbrush, ArrowRight, Clock, UserCheck, Star } from 'lucide-react'
import Button from '@/components/ui/Button'

const projectTypes = [
  { type: 'bathroom', label: 'Bathroom Remodel', icon: Bath, desc: 'Full or partial bathroom renovation', range: '$8K - $25K' },
  { type: 'kitchen', label: 'Kitchen Remodel', icon: ChefHat, desc: 'Transform your kitchen space', range: '$12K - $45K' },
  { type: 'windows', label: 'Window Replacement', icon: Square, desc: 'Energy-efficient window upgrades', range: '$3K - $15K' },
  { type: 'roofing', label: 'Roofing', icon: HomeIcon, desc: 'Roof repair or full replacement', range: '$5K - $20K' },
]

const trustPoints = [
  { icon: Shield, title: 'No Data Sales', desc: 'Your information is never sold to contractors or third parties.' },
  { icon: Lock, title: 'You Are The Customer', desc: 'Unlike lead-gen platforms, we work for you — not contractors.' },
  { icon: Eye, title: 'Full Transparency', desc: 'See exactly what data we have. Delete it anytime.' },
]

const valueProps = [
  { icon: Zap, title: 'Instant Contractor Matching', desc: 'Get 5 top-ranked contractors in seconds. AI-powered scoring from multiple data sources.' },
  { icon: DollarSign, title: 'Transparent Cost Estimates', desc: 'Know what your project should cost before talking to anyone. No surprises.' },
  { icon: Paintbrush, title: 'AI-Powered Design', desc: 'Visualize your renovation with AI. Select materials, see renders, get detailed breakdowns.' },
]

const stats = [
  { icon: Clock, value: '90 sec', label: 'Results in 90 seconds' },
  { icon: UserCheck, value: 'Free', label: 'No account needed' },
  { icon: Star, value: '100%', label: '100% free to start' },
]

export default function Home() {
  return (
    <div>
      {/* Hero Section — Dark */}
      <section className="bg-dark relative overflow-hidden">
        {/* Subtle gradient glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-neutral-300 mb-8">
              <Star className="w-4 h-4 text-primary" />
              Finally, a renovation service on your side
            </div>

            <h1 className="font-headline font-black text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight">
              Renovate with{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                confidence
              </span>
              , not confusion
            </h1>

            <p className="mt-8 text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
              AI-powered contractor matching, transparent cost estimates, and project visualization.
              No data selling. No lead generation. Just honest help.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link to="/project/new">
                <Button variant="primary" size="lg">
                  Start my project
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-neutral-400">
              {stats.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Project Types */}
      <section className="bg-[#111318]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="font-headline font-bold text-3xl md:text-4xl text-center mb-4 text-white">
            What are you renovating?
          </h2>
          <p className="text-neutral-400 text-center mb-12 max-w-lg mx-auto">
            Select your project type to get matched with top contractors in your area.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projectTypes.map(({ type, label, icon: Icon, desc, range }) => (
              <Link key={type} to={`/project/new?type=${type}`}>
                <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-primary/30 transition-all duration-200 cursor-pointer h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-headline font-bold text-lg mb-2 text-white">{label}</h3>
                  <p className="text-sm text-neutral-400 mb-3">{desc}</p>
                  <span className="text-sm font-medium text-primary">{range}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h2 className="font-headline font-black text-4xl md:text-6xl text-center mb-6 text-white">
            We Don't Sell Your Data
          </h2>
          <p className="text-neutral-400 text-center max-w-2xl mx-auto mb-16 text-lg">
            Unlike HomeAdvisor, Angi, and Thumbtack — we don't sell your information to contractors.
            You are the customer, not the product.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trustPoints.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="font-headline font-bold text-xl mb-2 text-white">{title}</h3>
                <p className="text-neutral-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-[#111318]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="font-headline font-bold text-3xl md:text-4xl text-center mb-12 text-white">
            Everything you need to renovate smarter
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {valueProps.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-headline font-bold text-xl mb-3 text-white">{title}</h3>
                <p className="text-neutral-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h2 className="font-headline font-black text-4xl md:text-5xl mb-6 text-white">
            Ready to renovate?
          </h2>
          <p className="text-neutral-400 text-lg mb-10 max-w-lg mx-auto">
            Get matched with top contractors in your area. Free, instant, and private.
          </p>
          <Link to="/project/new">
            <Button variant="primary" size="lg">
              Start Your Project
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

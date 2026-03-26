import { Link } from 'react-router-dom'
import { Bath, ChefHat, Square, Home as HomeIcon, Shield, Lock, Eye, Zap, DollarSign, Paintbrush, ArrowRight, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

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

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-4xl">
            <h1 className="font-headline font-black text-5xl md:text-7xl lg:text-8xl text-foreground leading-[0.95] tracking-tight">
              Transform Your Home With Confidence
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
              AI-powered contractor matching, transparent cost estimates, and project visualization.
              No data selling. No lead generation. Just honest help for homeowners.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/project/new">
                <Button variant="primary" size="lg">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                See How It Works
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>No account required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Results in seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>100% free to start</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Types */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="font-headline font-bold text-3xl md:text-4xl text-center mb-4">
            What are you renovating?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Select your project type to get matched with top contractors in your area.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projectTypes.map(({ type, label, icon: Icon, desc, range }) => (
              <Link key={type} to={`/project/new?type=${type}`}>
                <Card className="hover:shadow-lg hover:border-accent/30 transition-all duration-200 cursor-pointer h-full">
                  <CardContent>
                    <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-headline font-bold text-lg mb-2">{label}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{desc}</p>
                    <span className="text-sm font-medium text-accent">{range}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section - Dark */}
      <section className="bg-dark text-dark-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h2 className="font-headline font-black text-4xl md:text-6xl text-center mb-6">
            We Don't Sell Your Data
          </h2>
          <p className="text-neutral-400 text-center max-w-2xl mx-auto mb-16 text-lg">
            Unlike HomeAdvisor, Angi, and Thumbtack — we don't sell your information to contractors.
            You are the customer, not the product.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trustPoints.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="font-headline font-bold text-xl mb-2">{title}</h3>
                <p className="text-neutral-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="font-headline font-bold text-3xl md:text-4xl text-center mb-12">
            Everything you need to renovate smarter
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {valueProps.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="text-center p-8">
                <CardContent>
                  <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-headline font-bold text-xl mb-3">{title}</h3>
                  <p className="text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h2 className="font-headline font-black text-4xl md:text-5xl mb-6">
            Ready to renovate?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
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

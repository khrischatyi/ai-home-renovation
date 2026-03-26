import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Shield, CheckCircle, Clock, Phone, Mail, Globe, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import type { Project, Contractor } from '@/api/projects'

// Mock data for now - will connect to API when backend is running
const mockProject: Project = {
  id: '1',
  project_type: 'bathroom',
  zip_code: '90210',
  scope: { level: 'Full remodel' },
  preferences: {},
  cost_estimate_low: 12000,
  cost_estimate_high: 22000,
  cost_confidence: 0.78,
  status: 'results',
  tier: 1,
  created_at: new Date().toISOString(),
}

const mockContractors: Contractor[] = [
  {
    id: '1', business_name: 'Beverly Hills Bath & Kitchen', slug: 'beverly-hills-bath', phone: '(310) 555-0101',
    email: 'info@bhbath.com', website: 'https://bhbath.com', zip_code: '90210', specialties: ['bathroom', 'kitchen'],
    license_status: 'active', insurance_verified: true, years_in_business: 15, composite_score: 92,
    score_breakdown: { reviews: 95, sentiment: 88, license: 100, complaints: 90, longevity: 85, engagement: 80 },
  },
  {
    id: '2', business_name: 'Pacific Renovations Co', slug: 'pacific-renovations', phone: '(310) 555-0202',
    email: 'hello@pacreno.com', website: 'https://pacreno.com', zip_code: '90211', specialties: ['bathroom'],
    license_status: 'active', insurance_verified: true, years_in_business: 8, composite_score: 87,
    score_breakdown: { reviews: 90, sentiment: 85, license: 100, complaints: 82, longevity: 70, engagement: 75 },
  },
  {
    id: '3', business_name: 'Sunset Home Builders', slug: 'sunset-builders', phone: '(310) 555-0303',
    email: 'info@sunsetbuilders.com', website: null, zip_code: '90212', specialties: ['bathroom', 'roofing'],
    license_status: 'active', insurance_verified: true, years_in_business: 22, composite_score: 84,
    score_breakdown: { reviews: 82, sentiment: 80, license: 100, complaints: 85, longevity: 95, engagement: 60 },
  },
  {
    id: '4', business_name: 'Modern Touch Remodeling', slug: 'modern-touch', phone: '(310) 555-0404',
    email: 'team@moderntouch.com', website: 'https://moderntouch.com', zip_code: '90213', specialties: ['bathroom', 'kitchen'],
    license_status: 'active', insurance_verified: false, years_in_business: 5, composite_score: 76,
    score_breakdown: { reviews: 85, sentiment: 78, license: 100, complaints: 70, longevity: 50, engagement: 90 },
  },
  {
    id: '5', business_name: 'Elite Bath Solutions', slug: 'elite-bath', phone: '(310) 555-0505',
    email: 'elite@bathsolutions.com', website: 'https://elitebath.com', zip_code: '90214', specialties: ['bathroom'],
    license_status: 'active', insurance_verified: true, years_in_business: 11, composite_score: 71,
    score_breakdown: { reviews: 75, sentiment: 70, license: 100, complaints: 65, longevity: 78, engagement: 65 },
  },
]

export default function ContractorResults() {
  const { id: _id } = useParams()
  const [project] = useState<Project>(mockProject)
  const [contractors] = useState<Contractor[]>(mockContractors)

  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="bg-cream min-h-screen">
      {/* Results Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-headline font-bold text-2xl md:text-3xl mb-2">
            Your Top Contractors for <span className="capitalize">{project.project_type}</span> Remodel
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Zip: {project.zip_code}</span>
            <span>|</span>
            <span>Scope: {(project.scope as Record<string, string>).level}</span>
            <span>|</span>
            <span className="font-medium text-foreground">
              Est. {formatCurrency(project.cost_estimate_low!)} - {formatCurrency(project.cost_estimate_high!)}
            </span>
          </div>
        </div>
      </div>

      {/* Trust Banner */}
      <div className="bg-green-50 border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">
            We don't sell your data. Contact contractors directly — they won't know you came from us.
          </span>
        </div>
      </div>

      {/* Contractor Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {contractors.map((contractor, idx) => (
              <Card key={contractor.id} className="hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground font-medium">#{idx + 1}</span>
                      <ScoreBadge score={contractor.composite_score} size="md" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-headline font-bold text-lg">{contractor.business_name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{contractor.years_in_business} years</span>
                            </div>
                            {contractor.license_status === 'active' && (
                              <Badge variant="success">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Licensed
                              </Badge>
                            )}
                            {contractor.insurance_verified && (
                              <Badge variant="success">
                                <Shield className="w-3 h-3 mr-1" />
                                Insured
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Highly rated for {project.project_type} projects in the {project.zip_code} area.
                        Consistent quality and on-time completion reported across multiple review sources.
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <a href={`tel:${contractor.phone}`} className="flex items-center gap-1 hover:text-foreground">
                            <Phone className="w-3.5 h-3.5" /> {contractor.phone}
                          </a>
                          <a href={`mailto:${contractor.email}`} className="flex items-center gap-1 hover:text-foreground">
                            <Mail className="w-3.5 h-3.5" /> Email
                          </a>
                          {contractor.website && (
                            <a href={contractor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                              <Globe className="w-3.5 h-3.5" /> Website
                            </a>
                          )}
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent>
                <h3 className="font-headline font-bold text-lg mb-4">Cost Estimate</h3>
                <div className="text-3xl font-headline font-bold text-accent mb-1">
                  {formatCurrency(project.cost_estimate_low!)} - {formatCurrency(project.cost_estimate_high!)}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Confidence: {Math.round((project.cost_confidence || 0) * 100)}%
                </p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${(project.cost_confidence || 0) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark text-dark-foreground">
              <CardContent>
                <h3 className="font-headline font-bold text-lg mb-2">Want to go deeper?</h3>
                <p className="text-neutral-400 text-sm mb-4">
                  Get AI-powered design visualization, material selection, and detailed cost breakdowns.
                </p>
                <Button variant="primary" size="md" className="w-full">
                  Explore Design Options
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bath, ChefHat, Square, Home as HomeIcon, ArrowRight, ArrowLeft, MapPin } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { projectsApi } from '@/api/projects'

const projectTypes = [
  { type: 'bathroom', label: 'Bathroom Remodel', icon: Bath },
  { type: 'kitchen', label: 'Kitchen Remodel', icon: ChefHat },
  { type: 'windows', label: 'Window Replacement', icon: Square },
  { type: 'roofing', label: 'Roofing', icon: HomeIcon },
]

const scopeOptions: Record<string, { label: string; options: string[] }> = {
  bathroom: { label: 'Scope', options: ['Full remodel', 'Partial update', 'Fixtures only', 'Tile work'] },
  kitchen: { label: 'Scope', options: ['Full remodel', 'Cabinet refacing', 'Countertops only', 'Appliance upgrade'] },
  windows: { label: 'Number of windows', options: ['1-3 windows', '4-6 windows', '7-10 windows', '10+ windows'] },
  roofing: { label: 'Scope', options: ['Full replacement', 'Partial repair', 'Inspection only', 'Gutter work'] },
}

export default function ProjectIntake() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [projectType, setProjectType] = useState(searchParams.get('type') || '')
  const [zipCode, setZipCode] = useState('')
  const [scope, setScope] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('type')) {
      setStep(2)
    }
  }, [searchParams])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    try {
      const response = await projectsApi.create({
        project_type: projectType,
        zip_code: zipCode,
        scope: { level: scope },
        preferences: {},
      })
      const project = (response as any).data
      navigate(`/project/${project.id}/results`)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-colors ${s <= step ? 'bg-accent' : 'bg-border'}`} />
            </div>
          ))}
        </div>

        {/* Step 1: Project Type */}
        {step === 1 && (
          <div>
            <h1 className="font-headline font-bold text-3xl md:text-4xl mb-2">What are you renovating?</h1>
            <p className="text-muted-foreground mb-8">Select your project type to get started.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projectTypes.map(({ type, label, icon: Icon }) => (
                <Card
                  key={type}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    projectType === type ? 'border-accent shadow-md ring-2 ring-accent/20' : ''
                  }`}
                  onClick={() => { setProjectType(type); setStep(2) }}
                >
                  <CardContent className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <span className="font-headline font-bold text-lg">{label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="font-headline font-bold text-3xl md:text-4xl mb-2">Tell us about your project</h1>
            <p className="text-muted-foreground mb-8">We'll use this to find the best contractors and estimate costs.</p>

            <div className="space-y-6">
              <div>
                <Input
                  label="Zip Code"
                  id="zipCode"
                  placeholder="e.g. 90210"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength={5}
                />
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>Used to find local contractors and regional pricing</span>
                </div>
              </div>

              {projectType && scopeOptions[projectType] && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {scopeOptions[projectType].label}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {scopeOptions[projectType].options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setScope(opt)}
                        className={`p-3 rounded-lg border text-left text-sm font-medium transition-all cursor-pointer ${
                          scope === opt
                            ? 'border-accent bg-amber-50 text-accent'
                            : 'border-border bg-white hover:border-warm-gray'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-4"
                onClick={() => setStep(3)}
                disabled={!zipCode || !scope}
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="font-headline font-bold text-3xl md:text-4xl mb-2">Review your project</h1>
            <p className="text-muted-foreground mb-8">Confirm details and get your contractor matches.</p>

            <Card className="mb-6">
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Type</span>
                  <span className="font-medium capitalize">{projectType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zip Code</span>
                  <span className="font-medium">{zipCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scope</span>
                  <span className="font-medium">{scope}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Your data stays private</p>
                <p className="text-sm text-green-600">No account needed. We won't share your info with contractors.</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Finding contractors...' : 'Find My Contractors'}
              {!isSubmitting && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

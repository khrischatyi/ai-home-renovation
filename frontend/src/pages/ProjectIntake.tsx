import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Bath, ChefHat, Square, Home as HomeIcon, Send, ArrowRight, Sparkles, ArrowLeft } from 'lucide-react'
import { projectsApi } from '@/api/projects'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

// ── Chat data definitions ──

const projectTypeOptions = [
  { type: 'bathroom', label: 'Bathroom Remodel', icon: Bath },
  { type: 'kitchen', label: 'Kitchen Remodel', icon: ChefHat },
  { type: 'windows', label: 'Window Replacement', icon: Square },
  { type: 'roofing', label: 'Roofing', icon: HomeIcon },
]

const scopeOptions: Record<string, string[]> = {
  bathroom: ['Full remodel', 'Partial update', 'Fixtures only', 'Tile work'],
  kitchen: ['Full remodel', 'Cabinet refacing', 'Countertops only', 'Appliance upgrade'],
  windows: ['1-3 windows', '4-6 windows', '7-10 windows', '10+ windows'],
  roofing: ['Full replacement', 'Partial repair', 'Inspection only', 'Gutter work'],
}

const sizeOptions: Record<string, string[]> = {
  bathroom: ['Small (under 40 sq ft)', 'Medium (40-70 sq ft)', 'Large (70+ sq ft)', 'Not sure'],
  kitchen: ['Small (under 100 sq ft)', 'Medium (100-200 sq ft)', 'Large (200+ sq ft)', 'Not sure'],
  windows: ['Double-hung', 'Casement', 'Sliding', 'Bay/Bow', 'Not sure'],
  roofing: ['Small (under 1000 sq ft)', 'Medium (1000-2000 sq ft)', 'Large (2000+ sq ft)', 'Not sure'],
}

const workAreaOptions: Record<string, string[]> = {
  bathroom: ['Shower/tub', 'Toilet', 'Vanity/sink', 'Flooring', 'Lighting', 'Plumbing'],
  kitchen: ['Cabinets', 'Countertops', 'Appliances', 'Flooring', 'Lighting', 'Plumbing', 'Backsplash'],
  windows: ['Wood frames', 'Vinyl frames', 'Aluminum frames', 'Not sure'],
  roofing: ['Asphalt shingles', 'Metal', 'Tile', 'Flat/low-slope', 'Not sure'],
}

const propertyTypes = ['Single-family home', 'Townhouse', 'Condo/Apartment', 'Multi-family']
const propertyAges = ['< 5 years', '5-15 years', '15-30 years', '30+ years']
const ownershipOptions = ['I own it', "I'm buying it", "I'm renting"]
const budgetOptions = ['Under $5K', '$5K-$15K', '$15K-$30K', '$30K-$50K', '$50K+', 'Not sure yet']
const timelineOptions = ['ASAP', '1-3 months', '3-6 months', 'No rush']

// ── Types ──

type QuestionType =
  | 'project_type' | 'zip_code' | 'property_type' | 'property_age'
  | 'ownership' | 'scope' | 'size' | 'work_areas' | 'budget'
  | 'timeline' | 'has_quotes' | 'is_emergency'
  | 'contact_name' | 'contact_email' | 'contact_email_password'
  | 'password_reset_code' | 'password_reset_new_password'
  | 'notes' | 'confirm'

interface Message {
  id: string
  sender: 'bot' | 'user'
  text: string
}

interface IntakeData {
  project_type: string
  zip_code: string
  property_type: string
  property_age: string
  ownership: string
  scope: string
  size: string
  work_areas: string[]
  budget: string
  timeline: string
  has_quotes: boolean | null
  is_emergency: boolean | null
  contact_name: string
  contact_email: string
  notes: string
}

// ── Question flow ──

function getQuestionConfig(step: QuestionType, data: IntakeData) {
  const pt = data.project_type
  const configs: Record<QuestionType, { text: string; options?: string[]; multi?: boolean; input?: 'text' | 'email' | 'password' | 'textarea'; placeholder?: string; skip?: boolean }> = {
    project_type: {
      text: "Hey! I'm here to help you find the perfect contractor. What type of project are you planning?",
    },
    zip_code: {
      text: 'Great choice! What\'s your zip code? This helps me find local contractors.',
      input: 'text',
      placeholder: 'Enter zip code (e.g. 90210)',
    },
    property_type: {
      text: 'What type of property is this for?',
      options: propertyTypes,
    },
    property_age: {
      text: 'How old is the property?',
      options: propertyAges,
    },
    ownership: {
      text: 'What\'s your ownership status?',
      options: ownershipOptions,
    },
    scope: {
      text: pt === 'windows' ? 'How many windows need replacing?' : `What's the scope of the project?`,
      options: scopeOptions[pt] || [],
    },
    size: {
      text: pt === 'windows' ? 'What type of windows do you have?' : 'How large is the space?',
      options: sizeOptions[pt] || [],
    },
    work_areas: {
      text: ['bathroom', 'kitchen'].includes(pt) ? 'Which areas need work? Pick all that apply.' : pt === 'windows' ? 'Current frame material?' : 'What type of roofing?',
      options: workAreaOptions[pt] || [],
      multi: pt === 'bathroom' || pt === 'kitchen',
    },
    budget: {
      text: 'What\'s your approximate budget?',
      options: budgetOptions,
    },
    timeline: {
      text: 'When do you need this done?',
      options: timelineOptions,
    },
    has_quotes: {
      text: 'Have you gotten any quotes already?',
      options: ['Yes', 'No'],
    },
    is_emergency: {
      text: 'Is this an emergency or urgent repair?',
      options: ['Yes, it\'s urgent', 'No, not urgent'],
    },
    contact_name: {
      text: 'Almost done! What\'s your name? (optional — hit send to skip)',
      input: 'text',
      placeholder: 'Your name',
      skip: true,
    },
    contact_email: {
      text: 'What\'s your email? We\'ll create an account so your project, payment, and contractor matches stay yours.',
      input: 'email',
      placeholder: 'you@example.com',
    },
    contact_email_password: {
      text: `Looks like ${data.contact_email || 'that email'} already has a helpico account. Enter your password to sign in and continue.`,
      input: 'password',
      placeholder: 'Your password',
    },
    password_reset_code: {
      text: `Sent a reset code to ${data.contact_email}. Enter it here to continue.${import.meta.env.DEV ? ' (Dev mode: type 0000.)' : ''}`,
      input: 'text',
      placeholder: '4-digit code',
    },
    password_reset_new_password: {
      text: 'Pick a new password (at least 8 characters).',
      input: 'password',
      placeholder: 'New password',
    },
    notes: {
      text: 'Anything else contractors should know? (optional)',
      input: 'textarea',
      placeholder: 'Special requirements, preferences...',
      skip: true,
    },
    confirm: {
      text: `Here's your project summary:\n\n` +
        `**Project:** ${pt ? pt.charAt(0).toUpperCase() + pt.slice(1) : ''} — ${data.scope}\n` +
        `**Location:** ${data.zip_code} • ${data.property_type}\n` +
        `**Property:** ${data.property_age} • ${data.ownership}\n` +
        `**Size:** ${data.size}\n` +
        `**Details:** ${data.work_areas.join(', ')}\n` +
        `**Budget:** ${data.budget} • **Timeline:** ${data.timeline}\n` +
        (data.contact_name ? `**Name:** ${data.contact_name}\n` : '') +
        (data.contact_email ? `**Email:** ${data.contact_email}\n` : '') +
        (data.notes ? `**Notes:** ${data.notes}\n` : '') +
        `\nReady? I'll find the best contractors for you!`,
      options: ['Find my contractors!', 'Start over'],
    },
  }
  return configs[step]
}

const QUESTION_ORDER: QuestionType[] = [
  'project_type', 'zip_code', 'property_type', 'property_age', 'ownership',
  'scope', 'size', 'work_areas', 'budget', 'timeline', 'has_quotes',
  'is_emergency', 'contact_name', 'contact_email', 'notes', 'confirm',
]

// ── Component ──

export default function ProjectIntake() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initRef = useRef(false)
  // Transient reset-flow state, scoped to this component lifetime only.
  const resetCodeRef = useRef<string>('')

  const [messages, setMessages] = useState<Message[]>([])
  const [currentStep, setCurrentStep] = useState<QuestionType>('project_type')
  const [inputValue, setInputValue] = useState('')
  const [selectedMulti, setSelectedMulti] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<IntakeData>({
    project_type: '', zip_code: '', property_type: '', property_age: '',
    ownership: '', scope: '', size: '', work_areas: [], budget: '',
    timeline: '', has_quotes: null, is_emergency: null,
    contact_name: '', contact_email: '', notes: '',
  })

  const addMessage = useCallback((sender: 'bot' | 'user', text: string) => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sender,
      text,
    }])
  }, [])

  const showBotMessage = useCallback((text: string) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      addMessage('bot', text)
    }, 500 + Math.random() * 300)
  }, [addMessage])

  // Initialize
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    const preselectedType = searchParams.get('type')
    if (preselectedType && ['bathroom', 'kitchen', 'windows', 'roofing'].includes(preselectedType)) {
      const label = projectTypeOptions.find(p => p.type === preselectedType)?.label || preselectedType
      setData(prev => ({ ...prev, project_type: preselectedType }))
      const config = getQuestionConfig('project_type', { ...data, project_type: preselectedType })
      addMessage('bot', config.text)
      addMessage('user', label)
      const nextConfig = getQuestionConfig('zip_code', { ...data, project_type: preselectedType })
      setTimeout(() => {
        addMessage('bot', nextConfig.text)
        setCurrentStep('zip_code')
      }, 500)
    } else {
      const config = getQuestionConfig('project_type', data)
      addMessage('bot', config.text)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input
  useEffect(() => {
    const config = getQuestionConfig(currentStep, data)
    if (config.input === 'textarea') {
      textareaRef.current?.focus()
    } else if (config.input) {
      inputRef.current?.focus()
    }
  }, [currentStep, data])

  const advanceToNextStep = useCallback((updatedData: IntakeData) => {
    const idx = QUESTION_ORDER.indexOf(currentStep)
    if (idx < QUESTION_ORDER.length - 1) {
      const next = QUESTION_ORDER[idx + 1]
      setCurrentStep(next)
      showBotMessage(getQuestionConfig(next, updatedData).text)
    }
  }, [currentStep, showBotMessage])

  const handleOptionSelect = (option: string) => {
    if (isTyping || isSubmitting) return
    let updatedData = { ...data }
    let displayText = option

    switch (currentStep) {
      case 'project_type': {
        const pt = projectTypeOptions.find(p => p.label === option)
        if (pt) { updatedData.project_type = pt.type; displayText = pt.label }
        break
      }
      case 'property_type': updatedData.property_type = option; break
      case 'property_age': updatedData.property_age = option; break
      case 'ownership': updatedData.ownership = option; break
      case 'scope': updatedData.scope = option; break
      case 'size': updatedData.size = option; break
      case 'work_areas': updatedData.work_areas = [option]; break
      case 'budget': updatedData.budget = option; break
      case 'timeline': updatedData.timeline = option; break
      case 'has_quotes': updatedData.has_quotes = option === 'Yes'; break
      case 'is_emergency': updatedData.is_emergency = option.startsWith('Yes'); break
      case 'confirm':
        if (option === 'Start over') {
          setMessages([])
          setCurrentStep('project_type')
          setData({ project_type: '', zip_code: '', property_type: '', property_age: '', ownership: '', scope: '', size: '', work_areas: [], budget: '', timeline: '', has_quotes: null, is_emergency: null, contact_name: '', contact_email: '', notes: '' })
          setTimeout(() => addMessage('bot', getQuestionConfig('project_type', data).text), 300)
          return
        }
        handleSubmit(updatedData)
        return
    }
    setData(updatedData)
    addMessage('user', displayText)
    advanceToNextStep(updatedData)
  }

  const handleMultiConfirm = () => {
    if (selectedMulti.length === 0 || isTyping) return
    const updatedData = { ...data, work_areas: selectedMulti }
    setData(updatedData)
    addMessage('user', selectedMulti.join(', '))
    setSelectedMulti([])
    advanceToNextStep(updatedData)
  }

  const toggleMultiOption = (opt: string) => {
    setSelectedMulti(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  }

  // "Use a different email" — jump back to the email step. We clear the
  // stored email so the existence check re-runs for the next input.
  const handleUseDifferentEmail = () => {
    if (isTyping || isSubmitting) return
    setInputValue('')
    setData((d) => ({ ...d, contact_email: '' }))
    setCurrentStep('contact_email')
    showBotMessage("OK, what email should I use instead?")
  }

  // "Forgot password?" — kicks off the reset flow. In dev the code is
  // always 0000; we still hit the backend so the server-side log fires
  // (will send real email via SES later).
  const handleForgotPassword = async () => {
    if (isTyping || isSubmitting) return
    if (!data.contact_email) return
    try {
      await authApi.requestPasswordReset(data.contact_email)
    } catch {
      // Non-fatal — endpoint is intentionally idempotent / silent.
    }
    setInputValue('')
    setCurrentStep('password_reset_code')
    showBotMessage(
      `Sent a reset code to ${data.contact_email}. Enter it here to continue.` +
        (import.meta.env.DEV ? ' (Dev mode: type 0000.)' : '')
    )
  }

  const handleInputSubmit = async () => {
    if (isTyping || isSubmitting) return
    const config = getQuestionConfig(currentStep, data)
    const value = inputValue.trim()

    if (!value && config.skip) {
      addMessage('user', 'Skipped')
      setInputValue('')
      advanceToNextStep({ ...data })
      return
    }
    if (!value) return

    if (currentStep === 'zip_code' && !/^\d{5}$/.test(value)) {
      showBotMessage("That doesn't look right. Please enter a 5-digit US zip code.")
      return
    }
    if (currentStep === 'contact_email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      showBotMessage("That doesn't look like a valid email. Please try again.")
      return
    }

    // Email step: check if the address already belongs to an account.
    // If so, branch into the inline sign-in step instead of advancing.
    if (currentStep === 'contact_email') {
      const updatedData = { ...data, contact_email: value }
      setData(updatedData)
      addMessage('user', value)
      setInputValue('')
      // Read the live store state — the closure-captured `authStore` can
      // be stale right after an inline login.
      if (useAuthStore.getState().isAuthenticated) {
        advanceToNextStep(updatedData)
        return
      }
      try {
        const res: any = await authApi.checkEmail(value)
        if (res.data?.exists) {
          setCurrentStep('contact_email_password')
          showBotMessage(
            `Looks like ${value} already has a helpico account. Enter your password to sign in and continue.`
          )
          return
        }
      } catch {
        // fail-open: on network hiccup, treat as new and continue.
      }
      advanceToNextStep(updatedData)
      return
    }

    // Inline password step for existing accounts.
    // On success we skip the remaining optional questions (notes, confirm)
    // and jump straight to creating the project + navigating to payment —
    // returning users have already told us everything we need.
    if (currentStep === 'contact_email_password') {
      addMessage('user', '••••••••')
      setInputValue('')
      try {
        await authStore.login(data.contact_email, value)
        showBotMessage("Signed in successfully — taking you to payment.")
        // Submit using whatever we've collected so far; `notes` stays empty.
        await handleSubmit({ ...data }, { fromLogin: true })
      } catch {
        showBotMessage("Password doesn't match. Please try again.")
      }
      return
    }

    // Reset-flow: user typed the reset code.
    if (currentStep === 'password_reset_code') {
      addMessage('user', value)
      setInputValue('')
      // Keep the code in state so we can pair it with the new password
      // on the next step. We stash it on `resetCode` via a ref so we don't
      // have to grow IntakeData for a transient value.
      resetCodeRef.current = value
      setCurrentStep('password_reset_new_password')
      showBotMessage('Pick a new password (at least 8 characters).')
      return
    }

    // Reset-flow: user typed the new password. Submit to backend.
    if (currentStep === 'password_reset_new_password') {
      if (value.length < 8) {
        showBotMessage('Password needs at least 8 characters. Try again.')
        return
      }
      addMessage('user', '••••••••')
      setInputValue('')
      try {
        await authApi.resetPassword({
          email: data.contact_email,
          code: resetCodeRef.current,
          new_password: value,
        })
        // Refresh the store so subsequent decisions see the authed user.
        await authStore.refreshMe()
        showBotMessage("Password updated — taking you to payment.")
        await handleSubmit({ ...data }, { fromLogin: true })
      } catch (err: any) {
        const detail = err?.response?.data?.detail
        if (detail === 'Invalid reset code') {
          showBotMessage("That code didn't work. Try typing it again.")
          setCurrentStep('password_reset_code')
          return
        }
        showBotMessage(detail || "Couldn't reset password. Try again.")
      }
      return
    }

    const updatedData = { ...data }
    switch (currentStep) {
      case 'zip_code': updatedData.zip_code = value; break
      case 'contact_name': updatedData.contact_name = value; break
      case 'notes': updatedData.notes = value; break
    }
    setData(updatedData)
    addMessage('user', value)
    setInputValue('')
    advanceToNextStep(updatedData)
  }

  const handleSubmit = async (
    finalData: IntakeData,
    opts?: { fromLogin?: boolean }
  ) => {
    setIsSubmitting(true)
    setError('')
    if (!opts?.fromLogin) {
      addMessage('user', 'Find my contractors!')
      showBotMessage('Setting up your account and project…')
    }

    try {
      // If the user isn't already signed in (new email path), auto-create
      // their account from the intake details. Existing-email users signed
      // in earlier via the inline password step.
      // Read the live store state — the component-captured `authStore`
      // object reflects render-time snapshot and can be stale immediately
      // after `authStore.login(...)` resolves in the same tick.
      if (!useAuthStore.getState().isAuthenticated) {
        await authStore.ensureFromIntake(
          finalData.contact_email,
          finalData.contact_name || undefined
        )
      }

      const response = await projectsApi.create({
        project_type: finalData.project_type,
        zip_code: finalData.zip_code,
        scope: {
          level: finalData.scope,
          property_type: finalData.property_type,
          property_age: finalData.property_age,
          ownership: finalData.ownership,
          size: finalData.size,
          work_areas: finalData.work_areas,
          budget_range: finalData.budget,
          timeline: finalData.timeline,
          has_quotes: finalData.has_quotes,
          is_emergency: finalData.is_emergency,
        },
        preferences: {
          contact_name: finalData.contact_name,
          contact_email: finalData.contact_email,
          notes: finalData.notes,
        },
      })
      const project = (response as any).data
      navigate(`/project/${project.id}/pay`)
    } catch (err: any) {
      setIsSubmitting(false)
      const detail = err?.response?.data?.detail
      if (detail === 'needs_password') {
        // Race: email became taken between check-email and submit. Send user
        // back to the inline sign-in step.
        setCurrentStep('contact_email_password')
        showBotMessage(
          `Looks like ${finalData.contact_email} already has a helpico account. Enter your password to sign in and continue.`
        )
        return
      }
      setError(detail || err?.response?.data?.error?.message || 'Something went wrong.')
      showBotMessage('Sorry, something went wrong. Please try again.')
    }
  }

  const config = getQuestionConfig(currentStep, data)

  const renderBotText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
            : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  const currentStepIndex = QUESTION_ORDER.indexOf(currentStep)

  return (
    <div className="fixed inset-0 bg-[#0c0f14] flex flex-col">
      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#0c0f14]/95 backdrop-blur-sm safe-top">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <Link to="/" className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/5 transition-colors" aria-label="Back to home">
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-headline font-bold text-white text-base">helpico<span className="text-primary">.ai</span></span>
          <div className="flex-1" />
          {/* Step dots */}
          <div className="flex items-center gap-1">
            {QUESTION_ORDER.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i < currentStepIndex
                    ? 'w-1.5 h-1.5 bg-primary'
                    : i === currentStepIndex
                    ? 'w-2.5 h-2.5 bg-primary ring-2 ring-primary/30'
                    : 'w-1.5 h-1.5 bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-3 min-h-full flex flex-col">
          {/* Push initial messages toward center */}
          {messages.length <= 4 && <div className="flex-1" />}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeSlideIn_0.25s_ease-out]`}>
              {msg.sender === 'bot' && (
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-white/[0.06] text-neutral-300 rounded-bl-sm'
              }`}>
                {msg.sender === 'bot' ? renderBotText(msg.text) : msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:150ms]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {/* Submitting */}
          {isSubmitting && !isTyping && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-neutral-400 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Searching...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ── Input Area ── */}
      {!isSubmitting && !isTyping && (
        <div className="flex-shrink-0 border-t border-white/10 bg-[#0c0f14]/95 backdrop-blur-sm safe-bottom">
          <div className="max-w-2xl mx-auto px-3 py-3 space-y-2">

            {/* Project type grid */}
            {currentStep === 'project_type' && (
              <div className="grid grid-cols-2 gap-2">
                {projectTypeOptions.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => handleOptionSelect(label)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-200 text-[13px] font-medium hover:bg-white/[0.08] hover:border-primary/30 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Single-select pills */}
            {currentStep !== 'project_type' && config.options && !config.multi && (
              <div className="flex flex-wrap gap-1.5">
                {config.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    className="px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-200 text-[13px] font-medium hover:bg-white/[0.08] hover:border-primary/30 active:scale-[0.97] transition-all cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Multi-select pills */}
            {config.multi && config.options && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {config.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => toggleMultiOption(opt)}
                      className={`px-3.5 py-2 rounded-full border text-[13px] font-medium transition-all cursor-pointer active:scale-[0.97] ${
                        selectedMulti.includes(opt)
                          ? 'bg-primary/15 border-primary/40 text-primary'
                          : 'bg-white/[0.04] border-white/[0.08] text-neutral-200 hover:bg-white/[0.08]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {selectedMulti.length > 0 && (
                  <button
                    onClick={handleMultiConfirm}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Continue with {selectedMulti.length} selected
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Text / email input */}
            {config.input && config.input !== 'textarea' && (
              <>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type={config.input}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                    placeholder={config.placeholder}
                    className="flex-1 min-w-0 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
                    autoComplete={
                      currentStep === 'contact_email' ? 'email'
                      : currentStep === 'contact_name' ? 'name'
                      : currentStep === 'contact_email_password' ? 'current-password'
                      : currentStep === 'password_reset_new_password' ? 'new-password'
                      : currentStep === 'password_reset_code' ? 'one-time-code'
                      : 'off'
                    }
                  />
                  <button
                    onClick={handleInputSubmit}
                    className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary/90 active:scale-[0.95] transition-all cursor-pointer flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Inline helpers shown only on the existing-account password step. */}
                {currentStep === 'contact_email_password' && (
                  <div className="flex items-center justify-between gap-3 pt-1 text-[12px]">
                    <button
                      type="button"
                      onClick={handleUseDifferentEmail}
                      className="text-neutral-400 hover:text-neutral-200 transition-colors underline underline-offset-2 cursor-pointer"
                    >
                      Use a different email
                    </button>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-primary hover:text-primary/80 transition-colors underline underline-offset-2 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Textarea */}
            {config.input === 'textarea' && (
              <div className="space-y-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={config.placeholder}
                  rows={2}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setInputValue(''); handleInputSubmit() }}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-[13px] font-medium hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleInputSubmit}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Privacy */}
            <p className="text-center text-[11px] text-neutral-600 pb-1">
              Your data stays private &middot; No account needed
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .safe-top { padding-top: env(safe-area-inset-top, 0px); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>
    </div>
  )
}

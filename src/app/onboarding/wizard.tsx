'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Target as TargetIcon,
  User,
  Scale,
} from 'lucide-react'
import { PERSONA_LABELS_PL, type CoachPersona } from '@/lib/gemini/prompts'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/cn'
import { finishOnboarding } from './actions'

const PERSONA_ORDER: CoachPersona[] = [
  'empathetic',
  'hardcore',
  'friend',
  'pro',
]

type Props = { initialName: string }

export function OnboardingWizard({ initialName }: Props) {
  const [step, setStep] = useState(1)
  const [displayName, setDisplayName] = useState(initialName)
  const [bodyWeight, setBodyWeight] = useState('')
  const [goal, setGoal] = useState('')
  const [persona, setPersona] = useState<CoachPersona>('empathetic')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // Warm up /chat route + RSC payload so the post-save navigation is instant.
  // Triggers when user reaches step 3 — they're seconds away from clicking finish.
  useEffect(() => {
    if (step === 3) router.prefetch('/chat')
  }, [step, router])

  function next() {
    setError(null)
    if (step === 1) {
      if (displayName.trim().length < 1 || displayName.trim().length > 40) {
        setError('Imię: 1-40 znaków')
        return
      }
      if (bodyWeight.trim()) {
        const n = Number(bodyWeight.replace(',', '.'))
        if (!Number.isFinite(n) || n < 30 || n > 250) {
          setError('Waga: 30-250 kg (albo zostaw puste)')
          return
        }
      }
    }
    setStep((s) => s + 1)
  }

  function back() {
    setError(null)
    setStep((s) => Math.max(1, s - 1))
  }

  function finish() {
    setError(null)
    const bw = bodyWeight.trim()
      ? Number(bodyWeight.replace(',', '.'))
      : null
    startTransition(async () => {
      const res = await finishOnboarding({
        display_name: displayName,
        body_weight_kg: bw,
        goal,
        coach_persona: persona,
      })
      if ('error' in res && res.error) {
        setError(res.error)
        toast.error(res.error)
        return
      }
      toast.success('Witamy w FitMind!', {
        description: `${PERSONA_LABELS_PL[persona].title} czeka na czacie.`,
      })
      router.push('/chat')
      router.refresh()
    })
  }

  const totalSteps = 3

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse, rgba(245,158,11,0.25), rgba(249,115,22,0.08) 40%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative w-full max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Sparkles size={14} className="text-white" strokeWidth={2} />
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-100">
              FitMind
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="nums text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              {step} / {totalSteps}
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    n < step && 'w-6 bg-amber-500',
                    n === step && 'w-10 bg-gradient-to-r from-amber-500 to-orange-500',
                    n > step && 'w-6 bg-zinc-800',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-xl p-6 sm:p-8 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)]">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400 mb-2">
                  Krok 1 · Poznajmy się
                </p>
                <h1 className="font-bold text-4xl tracking-tight text-zinc-50 leading-tight">
                  Cześć, powiedz mi coś o sobie.
                </h1>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                    <User size={12} strokeWidth={1.75} />
                    Jak się nazywasz?
                  </span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={40}
                    autoFocus
                    className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                    placeholder="np. Janek"
                  />
                </label>
                <label className="block">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
                      <Scale size={12} strokeWidth={1.75} />
                      Waga ciała
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      opcjonalne, do kalisteniki
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      value={bodyWeight}
                      onChange={(e) => setBodyWeight(e.target.value)}
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="30"
                      max="250"
                      className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/60 pl-4 pr-12 py-3 text-sm nums text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                      placeholder="78"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                      kg
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400 mb-2">
                  Krok 2 · Cel
                </p>
                <h1 className="font-bold text-4xl tracking-tight text-zinc-50 leading-tight">
                  Po co tu jesteś?
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Krótko, jedno zdanie. Zapamiętam i będę o nim przypominał.
                </p>
              </div>

              <div className="relative">
                <TargetIcon
                  size={14}
                  strokeWidth={1.75}
                  className="absolute left-4 top-4 text-amber-400"
                />
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  maxLength={200}
                  autoFocus
                  className="w-full resize-none rounded-xl border border-zinc-800/80 bg-zinc-950/60 pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                  placeholder="np. Pierwsze 100 kg w ławce do końca roku"
                />
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                  Pomysły
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    'Zbudować 5 kg mięśni w pół roku',
                    'Pierwsze podciąganie bez pomocy',
                    'Przebiec 10 km bez stania',
                    'Czuć się dobrze w ciele',
                  ].map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => setGoal(idea)}
                      className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2 text-left text-[12px] text-zinc-400 transition hover:border-amber-500/40 hover:bg-zinc-900/60 hover:text-zinc-200"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400 mb-2">
                  Krok 3 · Twój trener
                </p>
                <h1 className="font-bold text-4xl tracking-tight text-zinc-50 leading-tight">
                  Wybierz styl.
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Możesz zmienić kiedy chcesz w profilu.
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {PERSONA_ORDER.map((p) => {
                  const info = PERSONA_LABELS_PL[p]
                  const active = persona === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPersona(p)}
                      className={cn(
                        'relative rounded-xl border p-4 text-left transition',
                        active
                          ? 'border-amber-500/60 bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-transparent'
                          : 'border-zinc-800/60 bg-zinc-950/40 hover:border-zinc-700',
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-3 right-3 h-4 w-4 rounded-full border-2 transition flex items-center justify-center',
                          active
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-zinc-700',
                        )}
                      >
                        <Check
                          size={10}
                          strokeWidth={3}
                          className={cn(
                            'text-white transition',
                            active ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      </div>
                      <div className="pr-6">
                        <div className="text-sm font-semibold text-zinc-100">
                          {info.title}
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          {info.tagline}
                        </p>
                      </div>
                      <p className="mt-3 text-[12px] text-zinc-400 leading-snug">
                        &ldquo;{info.preview}&rdquo;
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={back}
              disabled={step === 1 || pending}
              leftIcon={<ArrowLeft size={14} />}
            >
              Wstecz
            </Button>
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={next}
                disabled={pending}
                rightIcon={<ArrowRight size={14} />}
              >
                Dalej
              </Button>
            ) : (
              <Button
                type="button"
                onClick={finish}
                loading={pending}
                rightIcon={!pending && <ArrowRight size={14} />}
              >
                {pending ? 'Zapisuję...' : 'Zaczynamy'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import {
  Sparkles,
  Dumbbell,
  Coffee,
  Bike,
  ChevronDown,
  RefreshCw,
  Clock,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/components/ui/cn'
import { Button } from '@/components/ui/button'
import type { WeeklyPlan, PlanDay, PlanExercise } from '@/lib/gemini/plan'
import type { CoachPersona } from '@/lib/gemini/prompts'
import { COACH_NAMES } from '@/lib/gemini/prompts'

type CurrentPlan = {
  id: string
  weekStart: string
  persona: string
  goal: string | null
  createdAt: string
  plan: WeeklyPlan
}

type Props = {
  initialPlan: CurrentPlan | null
  persona: CoachPersona
  hasGoal: boolean
  hasChatHistory: boolean
}

const DAY_LABELS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']

const LOADING_MESSAGES: Record<CoachPersona, string[]> = {
  empathetic: [
    'Max analizuje twój cel…',
    'Dobiera ćwiczenia do twojego poziomu…',
    'Prawie gotowe — będziesz zadowolony!',
  ],
  hardcore: [
    'SARGE UKŁADA PLAN. CZEKAJ.',
    'BEZ LITOŚCI. BEZ WYMÓWEK.',
    'TWÓJ TYDZIEŃ WŁAŚNIE GOT HARDER.',
  ],
  friend: [
    'Kumpel robi plan, chwila…',
    'Nie będzie źle, obiecuję 😅',
    'No dobra, mam coś dla ciebie!',
  ],
  pro: [
    'Coach analizuje dane…',
    'Obliczanie optymalnej objętości i intensywności…',
    'Generowanie planu periodyzacji…',
  ],
}

export function PlanUi({ initialPlan, persona, hasGoal, hasChatHistory }: Props) {
  const [plan, setPlan] = useState<CurrentPlan | null>(initialPlan)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [pending, startTransition] = useTransition()

  function generate(briefing?: string) {
    // Guard: when called via onClick={generate}, React passes a SyntheticEvent
    // as the first argument. Only trust string values.
    const safeBriefing = typeof briefing === 'string' ? briefing.trim() : ''
    startTransition(async () => {
      const msgs = LOADING_MESSAGES[persona]
      setLoadingMsg(0)
      const interval = setInterval(() => {
        setLoadingMsg((i) => (i + 1) % msgs.length)
      }, 2200)

      try {
        const res = await fetch('/api/plan/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ briefing: safeBriefing || undefined }),
        })
        const data = await res.json() as { plan?: WeeklyPlan; id?: string; error?: string }
        if (!res.ok || data.error) {
          toast.error(data.error ?? 'Błąd generowania planu')
          return
        }
        setPlan({
          id: data.id!,
          weekStart: getMonday(new Date()),
          persona,
          goal: null,
          createdAt: new Date().toISOString(),
          plan: data.plan!,
        })
        toast.success('Plan gotowy!', {
          description: `${COACH_NAMES[persona]} ułożył twój tydzień.`,
        })
      } catch {
        toast.error('Nie udało się połączyć z serwerem')
      } finally {
        clearInterval(interval)
      }
    })
  }

  if (pending) {
    return <LoadingState persona={persona} msgIndex={loadingMsg} />
  }

  if (!plan) {
    return (
      <EmptyState
        persona={persona}
        onGenerate={generate}
        needsBriefing={!hasGoal && !hasChatHistory}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PlanHeader plan={plan} onRegenerate={generate} />
      {plan.plan.summary && (
        <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl px-5 py-4">
          <p className="text-sm text-zinc-300 leading-relaxed font-medium">
            &ldquo;{plan.plan.summary}&rdquo;
          </p>
          {plan.plan.progression_note && (
            <p className="mt-2 text-xs text-amber-400/80 flex items-center gap-1.5">
              <RotateCcw size={11} />
              {plan.plan.progression_note}
            </p>
          )}
        </div>
      )}
      <WeekStrip days={plan.plan.days} />
      <DayList days={plan.plan.days} />
    </div>
  )
}

function EmptyState({
  persona,
  onGenerate,
  needsBriefing,
}: {
  persona: CoachPersona
  onGenerate: (briefing?: string) => void
  needsBriefing: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-xl p-8 sm:p-12 text-center">
      <div
        className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-48 w-80 rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.4), transparent 70%)' }}
        aria-hidden
      />
      <div className="relative">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <Image
            src="/images/logo-icon.webp"
            alt="FitMind logo"
            width={64}
            height={64}
            style={{ transform: 'translateX(-7px) translateY(9px)' }}
            className="object-contain drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]"
          />
        </div>
        <h2 className="font-bold text-3xl tracking-tight text-zinc-50 mb-2">
          Brak planu na ten tydzień.
        </h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
          {needsBriefing
            ? `${COACH_NAMES[persona]} ma na razie mało danych. Plan będzie ogólny — dodaj kontekst, żeby był dopasowany.`
            : `${COACH_NAMES[persona]} przeanalizuje twój cel, historię treningów i rozmów, i ułoży spersonalizowany plan na 7 dni — w kilka sekund.`}
        </p>

        <BriefingPanel
          onSubmit={onGenerate}
          submitLabel="Wygeneruj plan"
          startOpen={needsBriefing}
          align="center"
        />
      </div>
    </div>
  )
}

function BriefingPanel({
  onSubmit,
  submitLabel,
  startOpen = false,
  align = 'center',
}: {
  onSubmit: (briefing?: string) => void
  submitLabel: string
  startOpen?: boolean
  align?: 'center' | 'start'
}) {
  const [open, setOpen] = useState(startOpen)
  const [briefing, setBriefing] = useState('')
  const trimmed = briefing.trim()

  const buttonLabel = trimmed.length > 0 ? `${submitLabel} z briefingiem` : submitLabel

  return (
    <div className={cn('flex flex-col', align === 'center' ? 'items-center' : 'items-start')}>
      {open && (
        <div className={cn('mb-4 w-full max-w-md', align === 'start' && 'self-stretch')}>
          <textarea
            value={briefing}
            onChange={(e) => setBriefing(e.target.value.slice(0, 1000))}
            placeholder="np. W tym tygodniu mniej czasu, focus na nogi. Boli mnie lekko bark po wyciskaniu."
            rows={4}
            autoFocus
            className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
          />
          <div className="mt-1 text-right text-[10px] text-zinc-600">
            {briefing.length}/1000
          </div>
        </div>
      )}

      <Button
        onClick={() => onSubmit(trimmed || undefined)}
        rightIcon={<Sparkles size={14} />}
      >
        {buttonLabel}
      </Button>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-3 text-[11px] text-zinc-500 hover:text-amber-300 transition flex items-center gap-1"
      >
        <ChevronDown
          size={11}
          className={cn('transition-transform', open && 'rotate-180')}
        />
        {open ? 'Schowaj kontekst' : 'Dodaj kontekst dla tego planu'}
      </button>
    </div>
  )
}

function LoadingState({ persona, msgIndex }: { persona: CoachPersona; msgIndex: number }) {
  const msgs = LOADING_MESSAGES[persona]
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-zinc-900/20 backdrop-blur-xl p-8 sm:p-12 text-center">
      <div
        className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-48 w-80 rounded-full blur-3xl opacity-50 animate-pulse"
        style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.5), transparent 70%)' }}
        aria-hidden
      />
      <div className="relative">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
          <RefreshCw size={28} className="text-white animate-spin" strokeWidth={1.5} />
        </div>
        <p
          key={msgIndex}
          className="font-bold text-2xl tracking-tight text-zinc-100 animate-in fade-in duration-500"
        >
          {msgs[msgIndex]}
        </p>
        <p className="mt-2 text-xs text-zinc-500">Gemini układa twój tydzień…</p>
      </div>
    </div>
  )
}

function PlanHeader({
  plan,
  onRegenerate,
}: {
  plan: CurrentPlan
  onRegenerate: (briefing?: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [briefing, setBriefing] = useState('')
  const date = new Date(plan.createdAt)
  const trimmed = briefing.trim()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          Wygenerowano {date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })} przez{' '}
          <span className="text-amber-400">
            {COACH_NAMES[plan.persona as CoachPersona] ?? plan.persona}
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            if (open) {
              onRegenerate(trimmed || undefined)
            } else {
              setOpen(true)
            }
          }}
          className="flex items-center gap-1.5 rounded-full border border-zinc-800/60 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-amber-500/40 hover:text-amber-300"
        >
          <RefreshCw size={11} />
          {open ? (trimmed ? 'Wygeneruj z briefingiem' : 'Wygeneruj nowy') : 'Nowy plan'}
        </button>
      </div>

      {open && (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
            Coś co {COACH_NAMES[plan.persona as CoachPersona] ?? plan.persona} powinien wiedzieć?
            <span className="ml-1 normal-case text-zinc-600 tracking-normal">(opcjonalnie)</span>
          </label>
          <textarea
            value={briefing}
            onChange={(e) => setBriefing(e.target.value.slice(0, 1000))}
            placeholder="np. W tym tygodniu mam mniej czasu, focus na nogi. Boli mnie lekko bark."
            rows={3}
            autoFocus
            className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setBriefing('')
              }}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
            >
              Anuluj
            </button>
            <span className="nums text-[10px] text-zinc-600">
              {briefing.length}/1000
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function WeekStrip({ days }: { days: PlanDay[] }) {
  const sorted = [...days].sort((a, b) => a.day_index - b.day_index)
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {sorted.map((d) => (
        <div
          key={d.day_index}
          className={cn(
            'flex flex-col items-center gap-1 rounded-xl border py-2 px-1 transition',
            d.kind === 'workout'
              ? 'border-amber-500/40 bg-amber-500/5'
              : d.kind === 'cardio'
                ? 'border-sky-500/30 bg-sky-500/5'
                : 'border-zinc-800/40 bg-zinc-900/20',
          )}
        >
          <span className="text-[9px] uppercase tracking-wider text-zinc-500">
            {DAY_LABELS[(d.day_index - 1) % 7]}
          </span>
          <DayIcon kind={d.kind} size={14} />
        </div>
      ))}
    </div>
  )
}

function DayIcon({ kind, size }: { kind: PlanDay['kind']; size: number }) {
  if (kind === 'workout') return <Dumbbell size={size} className="text-amber-400" strokeWidth={1.75} />
  if (kind === 'cardio') return <Bike size={size} className="text-sky-400" strokeWidth={1.75} />
  return <Coffee size={size} className="text-zinc-500" strokeWidth={1.75} />
}

function DayList({ days }: { days: PlanDay[] }) {
  const sorted = [...days].sort((a, b) => a.day_index - b.day_index)
  return (
    <div className="flex flex-col gap-3">
      {sorted.map((d) => (
        <DayCard key={d.day_index} day={d} />
      ))}
    </div>
  )
}

function DayCard({ day }: { day: PlanDay }) {
  const [open, setOpen] = useState(day.kind === 'workout' && day.day_index <= 2)
  const isRest = day.kind === 'rest'

  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden transition',
        day.kind === 'workout'
          ? 'border-zinc-800/50 bg-zinc-900/30'
          : day.kind === 'cardio'
            ? 'border-sky-900/30 bg-sky-950/10'
            : 'border-zinc-800/30 bg-zinc-900/15',
      )}
    >
      <button
        type="button"
        onClick={() => !isRest && setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3.5 text-left',
          !isRest && 'hover:bg-zinc-800/20 transition',
        )}
      >
        <DayIcon kind={day.kind} size={16} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-100">{day.day_name}</span>
            {day.kind === 'workout' && (
              <span className="text-[10px] uppercase tracking-wider text-amber-400/70 bg-amber-500/10 rounded-full px-2 py-0.5">
                {day.exercises.length} ćw.
              </span>
            )}
            {day.kind === 'cardio' && (
              <span className="text-[10px] uppercase tracking-wider text-sky-400/70 bg-sky-500/10 rounded-full px-2 py-0.5">
                cardio
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-zinc-500">{day.focus}</span>
            {day.estimated_minutes > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                <Clock size={10} />
                {day.estimated_minutes} min
              </span>
            )}
          </div>
        </div>
        {!isRest && (
          <ChevronDown
            size={16}
            className={cn(
              'shrink-0 text-zinc-500 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        )}
      </button>

      {isRest && day.rest_note && (
        <div className="px-4 pb-3 text-xs text-zinc-500 italic">{day.rest_note}</div>
      )}

      {!isRest && open && (
        <div className="border-t border-zinc-800/40">
          {day.rest_note && (
            <p className="px-4 py-2 text-xs text-zinc-500 italic border-b border-zinc-800/30">
              {day.rest_note}
            </p>
          )}
          <ul className="divide-y divide-zinc-800/30">
            {day.exercises.map((ex, i) => (
              <ExerciseRow key={i} exercise={ex} index={i} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ExerciseRow({ exercise, index }: { exercise: PlanExercise; index: number }) {
  const typeColors = {
    weighted: 'bg-sky-500/10 text-sky-400',
    bodyweight: 'bg-amber-500/10 text-amber-400',
    timed: 'bg-emerald-500/10 text-emerald-400',
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="nums mt-0.5 w-5 shrink-0 text-center text-xs text-zinc-600">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-100">{exercise.name}</span>
          <span
            className={cn(
              'text-[9px] uppercase tracking-wider rounded-full px-1.5 py-0.5',
              typeColors[exercise.type],
            )}
          >
            {exercise.type === 'weighted' ? 'ciężar' : exercise.type === 'bodyweight' ? 'bw' : 'czas'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="nums text-xs text-amber-300">
            {exercise.sets} × {exercise.reps}
          </span>
          {exercise.weight_hint && (
            <span className="text-[11px] text-zinc-500">· {exercise.weight_hint}</span>
          )}
          <span className="text-[11px] text-zinc-600">
            odpoczynek {exercise.rest_seconds}s
          </span>
        </div>
        {exercise.notes && (
          <p className="mt-1 text-[11px] text-zinc-500 italic">{exercise.notes}</p>
        )}
      </div>
    </li>
  )
}

function getMonday(d: Date): string {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

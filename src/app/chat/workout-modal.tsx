'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dumbbell,
  X,
  Trophy,
  AlertCircle,
  Sparkles,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/cn'

type ExerciseType = 'weighted' | 'bodyweight' | 'timed'

type NewPR = {
  lift: string
  label: string
  weight_kg: number
  reps: number
  estimated_1rm: number
  previous_1rm: number | null
}

type SavedResponse = {
  ok: true
  workout_id: string
  total_volume_kg: number
  total_work_seconds: number
  xp_awarded: number
  exercises: {
    name: string
    exercise_type: ExerciseType
    sets: {
      reps: number
      weight_kg: number
      duration_seconds?: number | null
    }[]
  }[]
  notes: string | null
  new_prs?: NewPR[]
}

type Props = {
  open: boolean
  onClose: () => void
}

const EXAMPLES = [
  'Dziś 4x8 przysiady 100kg, 3x10 wyciskanie 60kg, 3x12 wiosłowanie 40kg',
  '5x5 martwy ciąg 120kg RPE 8, potem 3x max podciągania na masie',
  'Pompki 4x20, dipy 3x12, plank 3x60s',
]

export function WorkoutModal({ open, onClose }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SavedResponse | null>(null)
  const [needsBw, setNeedsBw] = useState(false)
  const [bwInput, setBwInput] = useState('')
  const [prevOpen, setPrevOpen] = useState(open)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset state when transitioning closed -> open. React 19 recommends
  // setState-during-render for prop-driven resets instead of useEffect.
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setError(null)
      setResult(null)
      setText('')
      setNeedsBw(false)
      setBwInput('')
    }
  }

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 50)
      document.documentElement.classList.add('modal-open')
      return () => {
        clearTimeout(t)
        document.documentElement.classList.remove('modal-open')
      }
    }
    document.documentElement.classList.remove('modal-open')
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function submit(bodyWeightOverride?: number) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          body_weight_kg: bodyWeightOverride,
        }),
      })
      const data = await res.json()
      if (res.status === 428 && data.error === 'need_body_weight') {
        setNeedsBw(true)
        setError(null)
        return
      }
      if (!res.ok) {
        const msg = data.reason ?? data.error ?? `HTTP ${res.status}`
        setError(msg)
        toast.error(msg)
        return
      }
      const saved = data as SavedResponse
      setResult(saved)
      setNeedsBw(false)
      toast.success('Trening zapisany', {
        description: `+${saved.xp_awarded} XP${
          saved.total_volume_kg > 0
            ? ` · ${Math.round(saved.total_volume_kg)} kg tonażu`
            : ''
        }`,
      })
      if (saved.new_prs && saved.new_prs.length > 0) {
        for (const pr of saved.new_prs) {
          toast('🏆 Nowy PR!', {
            description: `${pr.label}: ${pr.weight_kg} kg × ${pr.reps} (1RM ≈ ${Math.round(pr.estimated_1rm)} kg)`,
            duration: 5000,
          })
        }
      }
      startTransition(() => router.refresh())
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Nie udało się zapisać treningu'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function submitWithBodyWeight() {
    const bw = Number(bwInput.replace(',', '.'))
    if (!bw || bw < 30 || bw > 250) {
      setError('Podaj wagę w kg (30-250)')
      return
    }
    void submit(bw)
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[100dvh] sm:max-h-[85vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-zinc-800/60 bg-zinc-950/95 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 flex items-center justify-between border-b border-zinc-800/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Dumbbell size={15} strokeWidth={2} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Zaloguj trening
              </h2>
              <p className="text-[10px] text-zinc-500">AI sparsuje Twój tekst</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-800/60 hover:text-zinc-200"
            aria-label="Zamknij"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </header>

        {result ? (
          <SuccessView result={result} onClose={onClose} />
        ) : needsBw ? (
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
              <Scale size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-amber-400" />
              <span className="leading-relaxed">
                Masz ćwiczenia na masie własnej (pompki, podciąganie). Bez Twojej
                wagi nie policzę tonażu — wpisz raz, zapiszę w profilu.
              </span>
            </div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
              <Scale size={12} strokeWidth={1.75} />
              Twoja waga
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                autoFocus
                value={bwInput}
                onChange={(e) => setBwInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitWithBodyWeight()
                }}
                disabled={loading}
                placeholder="78"
                className="w-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 pl-4 pr-12 py-3 text-sm nums text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                kg
              </span>
            </div>
            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNeedsBw(false)
                  setError(null)
                }}
                disabled={loading}
              >
                Wróć
              </Button>
              <Button
                type="button"
                onClick={submitWithBodyWeight}
                loading={loading}
                disabled={!bwInput}
                size="md"
              >
                {loading ? 'Liczę...' : 'Zapisz i policz'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <p className="mb-3 flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
              <Sparkles size={12} strokeWidth={1.75} className="mt-0.5 shrink-0 text-amber-400" />
              Napisz po swojemu — AI rozbije to na ćwiczenia, serie i ciężary.
            </p>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              rows={5}
              placeholder="np. 4x8 przysiady 100kg, 3x10 wyciskanie 60kg..."
              className="w-full resize-none rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
            />

            <div className="mt-4 space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                Przykłady
              </p>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setText(ex)}
                  disabled={loading}
                  className="block w-full rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-3 py-2 text-left text-[12px] text-zinc-400 transition hover:border-amber-500/40 hover:bg-zinc-900/60 hover:text-zinc-200 disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="hidden sm:block text-[11px] text-zinc-600">
                <kbd className="font-sans">Ctrl+Enter</kbd> aby zapisać
              </p>
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={loading}
                >
                  Anuluj
                </Button>
                <Button
                  type="button"
                  onClick={() => submit()}
                  loading={loading}
                  disabled={!text.trim()}
                  size="md"
                >
                  {loading ? 'Parsuję...' : 'Zapisz trening'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SuccessView({
  result,
  onClose,
}: {
  result: SavedResponse
  onClose: () => void
}) {
  return (
    <>
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent p-5">
        <div
          className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full blur-2xl opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.5), transparent)',
          }}
          aria-hidden
        />
        <div className="relative flex items-baseline justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300">
              Zapisane
            </p>
            <p className="nums font-bold tracking-tight text-4xl text-zinc-50 leading-none mt-1">
              +{result.xp_awarded}
              <span className="text-sm font-medium text-amber-300/80 ml-1">XP</span>
            </p>
          </div>
          <Trophy size={24} strokeWidth={1.5} className="text-amber-400" />
        </div>
        <div className="relative mt-3 flex flex-wrap gap-x-4 gap-y-1 nums text-[11px] text-zinc-400">
          {result.total_volume_kg > 0 && (
            <span>
              Tonaż:{' '}
              <span className="font-semibold text-zinc-100">
                {Math.round(result.total_volume_kg).toLocaleString('pl-PL')} kg
              </span>
            </span>
          )}
          {result.total_work_seconds > 0 && (
            <span>
              Czas:{' '}
              <span className="font-semibold text-zinc-100">
                {formatSeconds(result.total_work_seconds)}
              </span>
            </span>
          )}
        </div>
        {result.notes && (
          <p className="relative mt-2 text-[12px] text-zinc-400">
            {result.notes}
          </p>
        )}
      </div>

      {result.new_prs && result.new_prs.length > 0 ? (
        <div className="mb-4 space-y-2">
          {result.new_prs.map((pr) => (
            <div
              key={pr.lift}
              className="relative overflow-hidden rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-500/20 to-orange-500/5 p-3 animate-in fade-in zoom-in-95 duration-500"
            >
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-amber-300" strokeWidth={2} />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  Nowy PR · {pr.label}
                </span>
              </div>
              <p className="mt-1.5 nums text-[12px] text-zinc-300">
                <span className="font-semibold text-zinc-100">{pr.weight_kg} kg</span>
                {' × '}
                <span className="font-semibold text-zinc-100">{pr.reps}</span>
                {' reps · 1RM ≈ '}
                <span className="font-bold text-lg text-amber-300">
                  {Math.round(pr.estimated_1rm)}
                </span>{' '}
                kg
                {pr.previous_1rm ? (
                  <span className="text-zinc-500 ml-1">
                    (było: {Math.round(pr.previous_1rm)} kg)
                  </span>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {result.exercises.map((ex, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-100">
                {ex.name}
              </span>
              <TypeTag type={ex.exercise_type} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ex.sets.map((s, j) => (
                <span
                  key={j}
                  className="nums rounded-md border border-zinc-800/60 bg-zinc-950/60 px-2 py-0.5 text-[11px] text-zinc-300"
                >
                  {formatSet(ex.exercise_type, s)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
    <div className="shrink-0 border-t border-zinc-800/60 bg-zinc-950/95 px-5 py-3">
      <Button
        type="button"
        onClick={onClose}
        size="lg"
        className="w-full"
      >
        Super, dalej
      </Button>
    </div>
    </>
  )
}

function formatSeconds(total: number): string {
  if (total < 60) return `${total}s`
  const m = Math.floor(total / 60)
  const s = total % 60
  if (s === 0) return `${m} min`
  return `${m}:${String(s).padStart(2, '0')} min`
}

function formatSet(
  type: ExerciseType,
  s: { reps: number; weight_kg: number; duration_seconds?: number | null },
): string {
  if (type === 'timed' && s.duration_seconds) {
    return formatSeconds(s.duration_seconds)
  }
  if (type === 'bodyweight') {
    return s.weight_kg > 0 ? `${s.reps} + ${s.weight_kg}kg` : `${s.reps}`
  }
  return s.weight_kg > 0 ? `${s.reps} × ${s.weight_kg}kg` : `${s.reps}`
}

function TypeTag({ type }: { type: ExerciseType }) {
  const labels: Record<ExerciseType, { text: string; cls: string }> = {
    weighted: {
      text: 'ciężar',
      cls: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    },
    bodyweight: {
      text: 'masa własna',
      cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    },
    timed: {
      text: 'czas',
      cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    },
  }
  const l = labels[type]
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        l.cls,
      )}
    >
      {l.text}
    </span>
  )
}

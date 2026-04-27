'use client'

import { useState } from 'react'
import { ChevronDown, Dumbbell } from 'lucide-react'
import { cn } from '@/components/ui/cn'

type ExerciseType = 'weighted' | 'bodyweight' | 'timed'

export type HistoryWorkout = {
  id: string
  performed_at: string
  total_volume_kg: number
  total_work_seconds: number
  notes: string | null
  exercises: {
    name: string
    exercise_type: ExerciseType
    sets: {
      reps: number
      weight_kg: number
      duration_seconds: number | null
    }[]
  }[]
}

type Props = { workouts: HistoryWorkout[] }

export function WorkoutHistory({ workouts }: Props) {
  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/60">
          <Dumbbell size={18} strokeWidth={1.5} className="text-zinc-500" />
        </div>
        <p className="text-xs text-zinc-500 max-w-[200px] leading-relaxed">
          Brak treningów. Zaloguj pierwszy z poziomu czatu.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {workouts.map((w, i) => (
        <HistoryItem key={w.id} workout={w} isFirst={i === 0} />
      ))}
    </div>
  )
}

function HistoryItem({
  workout,
  isFirst,
}: {
  workout: HistoryWorkout
  isFirst: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={cn(
        'rounded-xl border transition',
        open
          ? 'border-zinc-700/60 bg-zinc-900/50'
          : 'border-zinc-800/50 bg-zinc-900/30 hover:border-zinc-700/50',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-100">
              {formatDate(workout.performed_at)}
            </span>
            {isFirst && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-400 uppercase tracking-wider">
                Ostatni
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 nums text-[11px] text-zinc-500">
            <span>{workout.exercises.length} ćw.</span>
            {workout.total_volume_kg > 0 && (
              <span>{Math.round(workout.total_volume_kg)} kg</span>
            )}
            {workout.total_work_seconds > 0 && (
              <span>{formatSeconds(workout.total_work_seconds)}</span>
            )}
          </div>
        </div>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={cn(
            'shrink-0 text-zinc-500 transition-transform',
            open && 'rotate-180 text-zinc-300',
          )}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-zinc-800/50 p-4">
          {workout.notes && (
            <p className="rounded-lg bg-zinc-950/40 px-3 py-2 text-[12px] text-zinc-400 leading-snug">
              {workout.notes}
            </p>
          )}
          {workout.exercises.map((ex, i) => (
            <div key={i}>
              <div className="text-[12px] font-medium text-zinc-200">
                {ex.name}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {ex.sets.map((s, j) => (
                  <span
                    key={j}
                    className="nums rounded-md border border-zinc-800/60 bg-zinc-950/60 px-2 py-0.5 text-[11px] text-zinc-400"
                  >
                    {formatSet(ex.exercise_type, s)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays === 0) return 'Dziś'
  if (diffDays === 1) return 'Wczoraj'
  if (diffDays < 7) return `${diffDays} dni temu`
  return d.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })
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
  s: { reps: number; weight_kg: number; duration_seconds: number | null },
): string {
  if (type === 'timed' && s.duration_seconds) {
    return formatSeconds(s.duration_seconds)
  }
  if (type === 'bodyweight') {
    return s.weight_kg > 0 ? `${s.reps} + ${s.weight_kg}kg` : `${s.reps}`
  }
  return s.weight_kg > 0 ? `${s.reps} × ${s.weight_kg}kg` : `${s.reps}`
}

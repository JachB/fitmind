import type { SupabaseClient } from '@supabase/supabase-js'
import type { ParsedExercise } from '@/lib/gemini/workout-parser'

export type Lift = 'bench' | 'squat' | 'deadlift'

export const LIFT_LABELS_PL: Record<Lift, string> = {
  bench: 'Ławka płaska',
  squat: 'Przysiad',
  deadlift: 'Martwy ciąg',
}

const LIFT_ALIASES: Record<Lift, string[]> = {
  bench: [
    'wyciskanie sztangi lezac',
    'wyciskanie sztangi',
    'wyciskanie na lawce',
    'lawka plaska',
    'wyciskanie lezac',
    'bench press',
    'bench',
    'lawka',
  ],
  squat: [
    'przysiad ze sztanga',
    'przysiady ze sztanga',
    'przysiad tylni',
    'back squat',
    'przysiady',
    'przysiad',
    'squat',
  ],
  deadlift: [
    'martwy ciag',
    'martwy ciag klasyczny',
    'martwy ciag sumo',
    'deadlift',
    'mc',
  ],
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function detectLift(exerciseName: string): Lift | null {
  const norm = normalize(exerciseName)
  let best: { lift: Lift; len: number } | null = null
  for (const lift of Object.keys(LIFT_ALIASES) as Lift[]) {
    for (const alias of LIFT_ALIASES[lift]) {
      const an = normalize(alias)
      if (norm === an || norm.includes(an)) {
        if (!best || an.length > best.len) {
          best = { lift, len: an.length }
        }
      }
    }
  }
  return best?.lift ?? null
}

/**
 * Brzycki 1RM formula: weight × 36 / (37 - reps). Clamped to reps ∈ [1, 12].
 * Above 12 reps the formula diverges from reality.
 */
export function brzycki1RM(weightKg: number, reps: number): number {
  if (reps < 1 || weightKg <= 0) return 0
  const r = Math.min(reps, 12)
  return (weightKg * 36) / (37 - r)
}

export type NewPR = {
  lift: Lift
  label: string
  weight_kg: number
  reps: number
  estimated_1rm: number
  previous_1rm: number | null
}

const PR_XP_REWARD = 50

export async function checkAndUpdatePRs(
  service: SupabaseClient,
  userId: string,
  workoutId: string,
  exercises: ParsedExercise[],
): Promise<NewPR[]> {
  const bestPerLift = new Map<
    Lift,
    { weight_kg: number; reps: number; est: number }
  >()

  for (const ex of exercises) {
    if (ex.exercise_type !== 'weighted') continue
    const lift = detectLift(ex.name)
    if (!lift) continue
    for (const set of ex.sets) {
      if (set.weight_kg <= 0 || set.reps < 1) continue
      const est = brzycki1RM(set.weight_kg, set.reps)
      const cur = bestPerLift.get(lift)
      if (!cur || est > cur.est) {
        bestPerLift.set(lift, {
          weight_kg: set.weight_kg,
          reps: set.reps,
          est,
        })
      }
    }
  }

  if (bestPerLift.size === 0) return []

  const { data: existing } = await service
    .from('personal_records')
    .select('lift, estimated_1rm')
    .eq('user_id', userId)
    .in('lift', Array.from(bestPerLift.keys()))

  const existingMap = new Map<Lift, number>(
    (existing ?? []).map((r) => [r.lift as Lift, Number(r.estimated_1rm)]),
  )

  const newPRs: NewPR[] = []
  const upserts: Array<{
    user_id: string
    lift: Lift
    weight_kg: number
    reps: number
    estimated_1rm: number
    workout_id: string
  }> = []

  for (const [lift, candidate] of bestPerLift) {
    const prev = existingMap.get(lift) ?? null
    if (prev !== null && candidate.est <= prev) continue
    upserts.push({
      user_id: userId,
      lift,
      weight_kg: candidate.weight_kg,
      reps: candidate.reps,
      estimated_1rm: Math.round(candidate.est * 100) / 100,
      workout_id: workoutId,
    })
    newPRs.push({
      lift,
      label: LIFT_LABELS_PL[lift],
      weight_kg: candidate.weight_kg,
      reps: candidate.reps,
      estimated_1rm: Math.round(candidate.est * 100) / 100,
      previous_1rm: prev,
    })
  }

  if (upserts.length === 0) return []

  await service
    .from('personal_records')
    .upsert(upserts, { onConflict: 'user_id,lift' })

  await service.from('xp_events').insert(
    upserts.map((u) => ({
      user_id: userId,
      amount: PR_XP_REWARD,
      reason: 'pr_set' as const,
      meta: { lift: u.lift, weight_kg: u.weight_kg, reps: u.reps },
    })),
  )

  return newPRs
}

import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  calculateWorkoutMetrics,
  needsBodyWeight,
  parseWorkoutText,
  type ParsedWorkout,
} from '@/lib/gemini/workout-parser'
import { bumpQuestProgress } from '@/lib/gamification/quests'
import {
  checkAndUnlockAchievements,
  type UnlockedAchievement,
} from '@/lib/gamification/achievements'
import {
  checkAndUpdatePRs,
  type NewPR,
} from '@/lib/gamification/personal-records'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WORKOUT_BASE_XP = 20
const VOLUME_XP_PER_1000KG = 5
const WORK_XP_PER_MINUTE = 2
const MAX_PERFORMANCE_BONUS = 80

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function diffDays(a: string, b: string) {
  const da = new Date(a + 'T00:00:00Z').getTime()
  const db = new Date(b + 'T00:00:00Z').getTime()
  return Math.round((db - da) / 86400000)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { text?: string; body_weight_kg?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const text = body.text?.trim()
  if (!text) {
    return NextResponse.json({ error: 'Text required' }, { status: 400 })
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: 'Text too long' }, { status: 400 })
  }

  let parsed: ParsedWorkout
  try {
    parsed = await parseWorkoutText(text)
  } catch {
    return NextResponse.json(
      { error: 'AI parsing failed' },
      { status: 502 },
    )
  }

  if (!parsed.is_valid || parsed.exercises.length === 0) {
    return NextResponse.json(
      {
        error: 'invalid_workout',
        reason: parsed.reason ?? 'To nie wygląda na opis treningu',
      },
      { status: 422 },
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('body_weight_kg')
    .eq('id', user.id)
    .single()

  let bodyWeight = Number(profile?.body_weight_kg ?? 0) || null

  // Body weight override only allowed when profile has no value yet, AND only
  // when current workout actually requires it. Validation prevents inflated
  // tonnage for leaderboard gaming.
  if (
    !bodyWeight &&
    needsBodyWeight(parsed.exercises) &&
    typeof body.body_weight_kg === 'number' &&
    Number.isFinite(body.body_weight_kg) &&
    body.body_weight_kg >= 30 &&
    body.body_weight_kg <= 250
  ) {
    bodyWeight = body.body_weight_kg
    await supabase
      .from('profiles')
      .update({ body_weight_kg: bodyWeight })
      .eq('id', user.id)
  }

  if (!bodyWeight && needsBodyWeight(parsed.exercises)) {
    return NextResponse.json(
      {
        error: 'need_body_weight',
        reason:
          'Trening zawiera ćwiczenia na masie ciała — podaj swoją wagę żeby policzyć tonaż',
        parsed,
      },
      { status: 428 },
    )
  }

  const metrics = calculateWorkoutMetrics(parsed.exercises, bodyWeight)

  const { data: workoutRow, error: workoutErr } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      notes: parsed.notes || null,
      total_volume_kg: metrics.total_volume_kg,
      total_work_seconds: metrics.total_work_seconds,
    })
    .select('id')
    .single()

  if (workoutErr || !workoutRow) {
    return NextResponse.json(
      { error: 'Failed to save workout' },
      { status: 500 },
    )
  }

  const exerciseRows = parsed.exercises.map((e, i) => ({
    workout_id: workoutRow.id,
    name: e.name,
    position: i,
    exercise_type: e.exercise_type,
    bw_coefficient: e.bw_coefficient,
  }))

  const { data: insertedExercises, error: exErr } = await supabase
    .from('exercises')
    .insert(exerciseRows)
    .select('id, position')

  if (exErr || !insertedExercises) {
    await supabase.from('workouts').delete().eq('id', workoutRow.id)
    return NextResponse.json(
      { error: 'Failed to save exercises' },
      { status: 500 },
    )
  }

  const exerciseByPosition = new Map(
    insertedExercises.map((e) => [e.position, e.id]),
  )

  const setRows = parsed.exercises.flatMap((ex, exIdx) => {
    const exerciseId = exerciseByPosition.get(exIdx)
    if (!exerciseId) return []
    return ex.sets.map((s, setIdx) => ({
      exercise_id: exerciseId,
      reps: s.reps,
      weight_kg: s.weight_kg,
      rpe: s.rpe ?? null,
      duration_seconds: s.duration_seconds ?? null,
      position: setIdx,
    }))
  })

  if (setRows.length > 0) {
    const { error: setsErr } = await supabase.from('sets').insert(setRows)
    if (setsErr) {
      await supabase.from('workouts').delete().eq('id', workoutRow.id)
      return NextResponse.json(
        { error: 'Failed to save sets' },
        { status: 500 },
      )
    }
  }

  const service = createServiceClient()

  const volumeBonus = Math.floor(
    (metrics.total_volume_kg / 1000) * VOLUME_XP_PER_1000KG,
  )
  const workBonus = Math.floor(
    (metrics.total_work_seconds / 60) * WORK_XP_PER_MINUTE,
  )
  const performanceBonus = Math.min(
    MAX_PERFORMANCE_BONUS,
    volumeBonus + workBonus,
  )
  const xpAward = WORKOUT_BASE_XP + performanceBonus

  await service.from('xp_events').insert({
    user_id: user.id,
    amount: xpAward,
    reason: 'workout_logged',
    meta: {
      workout_id: workoutRow.id,
      volume_kg: metrics.total_volume_kg,
      work_seconds: metrics.total_work_seconds,
      exercise_count: parsed.exercises.length,
    },
  })

  const { data: stats } = await service
    .from('user_stats')
    .select(
      'total_volume_kg, total_work_seconds, current_streak, longest_streak, last_active_date',
    )
    .eq('user_id', user.id)
    .single()

  const today = todayISODate()
  let currentStreak = stats?.current_streak ?? 0
  let longestStreak = stats?.longest_streak ?? 0
  const last = stats?.last_active_date as string | null | undefined

  if (!last) {
    currentStreak = 1
  } else if (last === today) {
    // same day — no change
  } else {
    const gap = diffDays(last, today)
    currentStreak = gap === 1 ? currentStreak + 1 : 1
  }
  if (currentStreak > longestStreak) longestStreak = currentStreak

  await service
    .from('user_stats')
    .update({
      total_volume_kg:
        Number(stats?.total_volume_kg ?? 0) + metrics.total_volume_kg,
      total_work_seconds:
        (stats?.total_work_seconds ?? 0) + metrics.total_work_seconds,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: today,
    })
    .eq('user_id', user.id)

  await bumpQuestProgress(service, user.id, 'workout_log')
  await bumpQuestProgress(service, user.id, 'streak_day')

  const { count: workoutCount } = await service
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: userMsgCount } = await service
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('role', 'user')

  const { data: freshStats } = await service
    .from('user_stats')
    .select('total_xp, level, current_streak, total_volume_kg')
    .eq('user_id', user.id)
    .single()

  let unlocked: UnlockedAchievement[] = []
  if (freshStats) {
    unlocked = await checkAndUnlockAchievements(service, {
      userId: user.id,
      totalXp: freshStats.total_xp,
      level: freshStats.level,
      currentStreak: freshStats.current_streak,
      totalVolumeKg: Number(freshStats.total_volume_kg ?? 0),
      messageCount: userMsgCount ?? 0,
      workoutCount: workoutCount ?? 0,
    })
  }

  let newPRs: NewPR[] = []
  try {
    newPRs = await checkAndUpdatePRs(
      service,
      user.id,
      workoutRow.id,
      parsed.exercises,
    )
  } catch {
    // PR tracker is optional — don't fail the workout save
  }

  return NextResponse.json({
    ok: true,
    workout_id: workoutRow.id,
    total_volume_kg: metrics.total_volume_kg,
    total_work_seconds: metrics.total_work_seconds,
    xp_awarded: xpAward,
    exercises: parsed.exercises,
    notes: parsed.notes ?? null,
    unlocked,
    new_prs: newPRs,
  })
}

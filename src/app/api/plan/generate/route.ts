import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGeminiClient, GEMINI_MODEL } from '@/lib/gemini/client'
import type { Json } from '@/lib/supabase/database.types'
import {
  buildPlanSystemPrompt,
  planResponseSchema,
  PLAN_USER_TURN,
  type WeeklyPlan,
} from '@/lib/gemini/plan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function getMonday(d: Date): string {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let briefing: string | null = null
  try {
    const body = (await request.json()) as { briefing?: string }
    if (typeof body.briefing === 'string') {
      const trimmed = body.briefing.trim()
      if (trimmed.length > 1000) {
        return NextResponse.json(
          { error: 'Briefing: max 1000 znaków' },
          { status: 400 },
        )
      }
      briefing = trimmed || null
    }
  } catch {
    // empty body is fine
  }

  const [profileRes, workoutsRes, prsRes, summaryRes, messagesRes] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, coach_persona, goal, body_weight_kg')
        .eq('id', user.id)
        .single(),
      supabase
        .from('workouts')
        .select('performed_at, total_volume_kg, exercises(name)')
        .eq('user_id', user.id)
        .order('performed_at', { ascending: false })
        .limit(5),
      supabase
        .from('personal_records')
        .select('lift, estimated_1rm')
        .eq('user_id', user.id),
      supabase
        .from('conversation_summaries')
        .select('summary')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('messages')
        .select('role, content')
        .eq('user_id', user.id)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: false })
        .limit(10),
    ])

  if (profileRes.error) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
  }

  const profile = profileRes.data
  const recentWorkouts = (workoutsRes.data ?? []).map((w) => ({
    performed_at: w.performed_at,
    total_volume_kg: Number(w.total_volume_kg),
    exercises: (w.exercises as { name: string }[]).map((e) => e.name),
  }))

  const existingPRs = (prsRes.data ?? []).map((pr) => ({
    lift: pr.lift,
    estimated_1rm: Number(pr.estimated_1rm),
  }))

  const recentMessages = (messagesRes.data ?? [])
    .reverse()
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  const systemPrompt = buildPlanSystemPrompt({
    displayName: profile.display_name,
    goal: profile.goal,
    bodyWeightKg: profile.body_weight_kg ? Number(profile.body_weight_kg) : null,
    persona: profile.coach_persona,
    recentWorkouts,
    existingPRs,
    chatSummary: summaryRes.data?.summary ?? null,
    recentMessages,
    briefing,
  })

  const ai = getGeminiClient()

  let plan: WeeklyPlan
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: PLAN_USER_TURN }] }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
        responseMimeType: 'application/json',
        responseSchema: planResponseSchema,
      },
    })

    const raw = response.text
    if (!raw) throw new Error('Empty response from Gemini')
    plan = JSON.parse(raw) as WeeklyPlan
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gemini error'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const weekStart = getMonday(new Date())
  const { data: saved, error: saveErr } = await supabase
    .from('workout_plans')
    .insert({
      user_id: user.id,
      week_start: weekStart,
      persona_snapshot: profile.coach_persona,
      goal_snapshot: profile.goal,
      plan: plan as unknown as Json,
    })
    .select('id')
    .single()

  if (saveErr) {
    return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 })
  }

  return NextResponse.json({ plan, id: saved.id })
}

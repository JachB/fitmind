import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getGeminiClient, GEMINI_MODEL } from '@/lib/gemini/client'
import { buildSystemPrompt } from '@/lib/gemini/prompts'
import {
  buildContents,
  countMessagesSinceSummary,
  loadContext,
  SUMMARIZE_THRESHOLD,
} from '@/lib/gemini/memory'
import { summarizeConversation } from '@/lib/gemini/summarize'
import { bumpQuestProgress } from '@/lib/gamification/quests'
import { checkAndUnlockAchievements } from '@/lib/gamification/achievements'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const XP_PER_MESSAGE = 1
const LONG_MESSAGE_THRESHOLD = 150
const LONG_MESSAGE_BONUS = 5

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { message?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const userMessage = body.message?.trim()
  if (!userMessage) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }
  if (userMessage.length > 4000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  const [profileRes, statsRes, contextData] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, coach_persona, goal')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_stats')
      .select('level, total_xp, current_streak, total_volume_kg')
      .eq('user_id', user.id)
      .single(),
    loadContext(supabase, user.id),
  ])

  if (profileRes.error || statsRes.error) {
    return NextResponse.json(
      { error: 'Profile not initialised' },
      { status: 500 },
    )
  }

  const systemPrompt = buildSystemPrompt({
    displayName: profileRes.data.display_name,
    level: statsRes.data.level,
    totalXp: statsRes.data.total_xp,
    currentStreak: statsRes.data.current_streak,
    totalVolumeKg: statsRes.data.total_volume_kg,
    persona: profileRes.data.coach_persona,
    goal: profileRes.data.goal,
  })

  const { data: savedUserMsg, error: saveUserError } = await supabase
    .from('messages')
    .insert({ user_id: user.id, role: 'user', content: userMessage })
    .select('id')
    .single()

  if (saveUserError) {
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 },
    )
  }

  const service = createServiceClient()
  await service.from('xp_events').insert({
    user_id: user.id,
    amount: XP_PER_MESSAGE,
    reason: 'message',
    meta: { message_id: savedUserMsg.id },
  })

  if (userMessage.length >= LONG_MESSAGE_THRESHOLD) {
    await service.from('xp_events').insert({
      user_id: user.id,
      amount: LONG_MESSAGE_BONUS,
      reason: 'long_message_bonus',
      meta: { message_id: savedUserMsg.id, length: userMessage.length },
    })
  }

  await bumpQuestProgress(service, user.id, 'message_count')
  await bumpQuestProgress(service, user.id, 'streak_day')

  const [{ count: userMsgCount }, { count: workoutCount }] = await Promise.all([
    service
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user'),
    service
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const { data: freshStats } = await service
    .from('user_stats')
    .select('total_xp, level, current_streak, total_volume_kg')
    .eq('user_id', user.id)
    .single()

  if (freshStats) {
    await checkAndUnlockAchievements(service, {
      userId: user.id,
      totalXp: freshStats.total_xp,
      level: freshStats.level,
      currentStreak: freshStats.current_streak,
      totalVolumeKg: Number(freshStats.total_volume_kg ?? 0),
      messageCount: userMsgCount ?? 0,
      workoutCount: workoutCount ?? 0,
    })
  }

  const contents = buildContents(
    contextData.summary,
    contextData.recent,
    userMessage,
  )

  const ai = getGeminiClient()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = ''
      try {
        const response = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        })

        for await (const chunk of response) {
          const text = chunk.text
          if (text) {
            fullText += text
            controller.enqueue(encoder.encode(text))
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Gemini error'
        controller.enqueue(
          encoder.encode(`\n\n[Błąd AI: ${message}]`),
        )
      } finally {
        controller.close()

        if (fullText.trim()) {
          await supabase.from('messages').insert({
            user_id: user.id,
            role: 'assistant',
            content: fullText,
          })

          const msgCount = await countMessagesSinceSummary(supabase, user.id)
          if (msgCount >= SUMMARIZE_THRESHOLD) {
            const { data: allRecent } = await supabase
              .from('messages')
              .select('role, content')
              .eq('user_id', user.id)
              .in('role', ['user', 'assistant'])
              .order('created_at', { ascending: true })
              .limit(60)

            if (allRecent && allRecent.length > 0) {
              try {
                const summary = await summarizeConversation(
                  contextData.summary,
                  allRecent.map((m) => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    text: m.content,
                  })),
                )
                const lastId = (
                  await supabase
                    .from('messages')
                    .select('id')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()
                ).data?.id
                if (summary) {
                  await supabase.from('conversation_summaries').insert({
                    user_id: user.id,
                    summary,
                    up_to_message_id: lastId ?? null,
                  })
                }
              } catch {
                // summaryzacja to background task — błąd nie przerywa czatu
              }
            }
          }
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

import type { SupabaseClient } from '@supabase/supabase-js'

export type QuestType =
  | 'message_count'
  | 'workout_log'
  | 'exercise_variety'
  | 'streak_day'

type QuestTemplate = {
  type: QuestType
  target: number
  xp_reward: number
  description: string
}

const DAILY_TEMPLATES: QuestTemplate[] = [
  {
    type: 'message_count',
    target: 5,
    xp_reward: 50,
    description: 'Wyślij 5 wiadomości do trenera',
  },
  {
    type: 'workout_log',
    target: 1,
    xp_reward: 150,
    description: 'Zaloguj jeden trening',
  },
  {
    type: 'streak_day',
    target: 1,
    xp_reward: 30,
    description: 'Bądź dziś aktywny',
  },
]

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

export async function ensureTodaysQuests(
  service: SupabaseClient,
  userId: string,
): Promise<void> {
  const date = todayISODate()
  const { data: existing } = await service
    .from('daily_quests')
    .select('type')
    .eq('user_id', userId)
    .eq('quest_date', date)

  const existingTypes = new Set((existing ?? []).map((r) => r.type))
  const toCreate = DAILY_TEMPLATES.filter((t) => !existingTypes.has(t.type))
  if (toCreate.length === 0) return

  await service.from('daily_quests').insert(
    toCreate.map((t) => ({
      user_id: userId,
      quest_date: date,
      type: t.type,
      target: t.target,
      xp_reward: t.xp_reward,
      description: t.description,
    })),
  )
}

export type CompletedQuest = {
  id: string
  type: QuestType
  xp_reward: number
  description: string
}

export async function bumpQuestProgress(
  service: SupabaseClient,
  userId: string,
  type: QuestType,
  delta = 1,
): Promise<CompletedQuest[]> {
  await ensureTodaysQuests(service, userId)
  const date = todayISODate()

  const { data: quests } = await service
    .from('daily_quests')
    .select('id, type, target, progress, xp_reward, completed, description')
    .eq('user_id', userId)
    .eq('quest_date', date)
    .eq('type', type)
    .eq('completed', false)

  if (!quests || quests.length === 0) return []

  const completed: CompletedQuest[] = []
  for (const q of quests) {
    const newProgress = (q.progress ?? 0) + delta
    const justCompleted = newProgress >= q.target
    await service
      .from('daily_quests')
      .update({
        progress: Math.min(newProgress, q.target),
        completed: justCompleted,
      })
      .eq('id', q.id)

    if (justCompleted) {
      await service.from('xp_events').insert({
        user_id: userId,
        amount: q.xp_reward,
        reason: 'quest_completed',
        meta: { quest_id: q.id, type: q.type },
      })
      completed.push({
        id: q.id,
        type: q.type,
        xp_reward: q.xp_reward,
        description: q.description,
      })
    }
  }
  return completed
}

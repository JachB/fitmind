import type { SupabaseClient } from '@supabase/supabase-js'

export type AchievementCtx = {
  userId: string
  totalXp: number
  level: number
  currentStreak: number
  totalVolumeKg: number
  messageCount: number
  workoutCount: number
}

type Rule = {
  slug: string
  check: (c: AchievementCtx) => boolean
}

const RULES: Rule[] = [
  { slug: 'first_message', check: (c) => c.messageCount >= 1 },
  { slug: 'messages_100', check: (c) => c.messageCount >= 100 },
  { slug: 'first_workout', check: (c) => c.workoutCount >= 1 },
  { slug: 'workouts_10', check: (c) => c.workoutCount >= 10 },
  { slug: 'streak_7', check: (c) => c.currentStreak >= 7 },
  { slug: 'streak_30', check: (c) => c.currentStreak >= 30 },
  { slug: 'volume_1000', check: (c) => c.totalVolumeKg >= 1000 },
  { slug: 'volume_10000', check: (c) => c.totalVolumeKg >= 10000 },
  { slug: 'level_10', check: (c) => c.level >= 10 },
  { slug: 'level_25', check: (c) => c.level >= 25 },
]

export type UnlockedAchievement = {
  slug: string
  xp_reward: number
  name: string
  icon: string
}

export async function checkAndUnlockAchievements(
  service: SupabaseClient,
  ctx: AchievementCtx,
): Promise<UnlockedAchievement[]> {
  const candidateSlugs = RULES.filter((r) => r.check(ctx)).map((r) => r.slug)
  if (candidateSlugs.length === 0) return []

  const { data: already } = await service
    .from('user_achievements')
    .select('achievement_slug')
    .eq('user_id', ctx.userId)
    .in('achievement_slug', candidateSlugs)

  const alreadySet = new Set((already ?? []).map((r) => r.achievement_slug))
  const toUnlock = candidateSlugs.filter((s) => !alreadySet.has(s))
  if (toUnlock.length === 0) return []

  const { data: defs } = await service
    .from('achievements')
    .select('slug, name, icon, xp_reward')
    .in('slug', toUnlock)

  if (!defs || defs.length === 0) return []

  await service.from('user_achievements').insert(
    defs.map((d) => ({
      user_id: ctx.userId,
      achievement_slug: d.slug,
    })),
  )

  const xpRows = defs
    .filter((d) => d.xp_reward > 0)
    .map((d) => ({
      user_id: ctx.userId,
      amount: d.xp_reward,
      reason: 'achievement_unlocked' as const,
      meta: { slug: d.slug },
    }))
  if (xpRows.length > 0) {
    await service.from('xp_events').insert(xpRows)
  }

  return defs.map((d) => ({
    slug: d.slug,
    xp_reward: d.xp_reward,
    name: d.name,
    icon: d.icon,
  }))
}

export const ACHIEVEMENT_LABELS_PL: Record<
  string,
  { name: string; description: string }
> = {
  first_message: {
    name: 'Pierwsze słowa',
    description: 'Pierwsza wiadomość do trenera',
  },
  messages_100: {
    name: 'Gaduła',
    description: '100 wymienionych wiadomości',
  },
  first_workout: {
    name: 'Pierwszy trening',
    description: 'Zalogowany pierwszy trening',
  },
  workouts_10: {
    name: 'Systematyk',
    description: '10 zalogowanych treningów',
  },
  streak_7: {
    name: 'Tydzień w formie',
    description: '7 dni pod rząd aktywny',
  },
  streak_30: {
    name: 'Miesięczna maszyna',
    description: '30 dni pod rząd aktywny',
  },
  volume_1000: {
    name: 'Klub 1 tony',
    description: 'Podniesione 1 000 kg łącznie',
  },
  volume_10000: {
    name: 'Bestia 10 ton',
    description: 'Podniesione 10 000 kg łącznie',
  },
  level_10: {
    name: 'Dwucyfrowy',
    description: 'Poziom 10 zdobyty',
  },
  level_25: {
    name: 'Weteran',
    description: 'Poziom 25 zdobyty',
  },
}

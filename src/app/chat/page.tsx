import { redirect } from 'next/navigation'
import { Flame, Dumbbell, Clock, TrendingUp, Target } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { signOut } from '../login/actions'
import { ChatUi } from './chat-ui'
import { ensureTodaysQuests } from '@/lib/gamification/quests'
import { ACHIEVEMENT_LABELS_PL } from '@/lib/gamification/achievements'
import { COACH_NAMES, type CoachPersona } from '@/lib/gemini/prompts'
import { AppHeader } from '@/components/shell/app-header'
import { MobileBottomNav } from '@/components/shell/mobile-bottom-nav'
import { Ring } from '@/components/ui/ring'
import { Stat } from '@/components/ui/stat'

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=%2Fchat')

  const service = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)

  const weekStart = new Date()
  weekStart.setUTCHours(0, 0, 0, 0)
  weekStart.setUTCDate(
    weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7),
  )

  // Run quest seeding in parallel with all data fetches — prior code blocked
  // the page on a serial INSERT round-trip before any read started.
  const [
    ,
    profileRes,
    statsRes,
    messagesRes,
    questsRes,
    badgesRes,
    weeklyXpRes,
  ] = await Promise.all([
    ensureTodaysQuests(service, user.id),
    supabase
      .from('profiles')
      .select('display_name, coach_persona, body_weight_kg, onboarded_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_stats')
      .select(
        'total_xp, level, current_streak, longest_streak, total_volume_kg, total_work_seconds',
      )
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('daily_quests')
      .select('id, type, target, progress, completed, xp_reward, description')
      .eq('user_id', user.id)
      .eq('quest_date', today)
      .order('xp_reward', { ascending: true }),
    supabase
      .from('user_achievements')
      .select('achievement_slug, unlocked_at, achievements(name, icon, xp_reward)')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })
      .limit(6),
    supabase
      .from('xp_events')
      .select('amount')
      .eq('user_id', user.id)
      .gte('created_at', weekStart.toISOString()),
  ])

  const profile = profileRes.data
  if (profile && !profile.onboarded_at) redirect('/onboarding')
  const stats = statsRes.data
  const coachName = profile?.coach_persona
    ? COACH_NAMES[profile.coach_persona as CoachPersona]
    : 'Max'
  const initialMessages = (messagesRes.data ?? []).map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))
  const quests = questsRes.data ?? []
  type BadgeRow = {
    achievement_slug: string
    achievements: { name: string; icon: string; xp_reward: number } | null
  }
  const badges = ((badgesRes.data ?? []) as BadgeRow[]).map((b) => ({
    slug: b.achievement_slug,
    icon: b.achievements?.icon ?? '🏅',
    name:
      ACHIEVEMENT_LABELS_PL[b.achievement_slug]?.name ??
      b.achievements?.name ??
      b.achievement_slug,
  }))

  const weeklyXp = (weeklyXpRes.data ?? []).reduce(
    (sum, r) => sum + (r.amount ?? 0),
    0,
  )

  const userName =
    profile?.display_name?.trim() ||
    user.email?.split('@')[0] ||
    'sportowcu'

  const level = stats?.level ?? 1
  const xpInLevel = (stats?.total_xp ?? 0) % 100
  const toNext = 100 - xpInLevel

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        userName={userName}
        userEmail={user.email ?? ''}
        signOutAction={signOut}
      />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-4 pb-24 md:pb-6 sm:px-6 sm:py-6">
        <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_360px] lg:gap-6">
          <ChatUi
            initialMessages={initialMessages}
            coachName={coachName}
            userName={userName}
          />

          <aside className="hidden lg:flex flex-col gap-4">
            <div className="relative rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 backdrop-blur-xl overflow-hidden">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" aria-hidden />
              <div className="relative flex items-center gap-4">
                <Ring value={xpInLevel} max={100} size={80} strokeWidth={6}>
                  <div className="text-center">
                    <div className="font-bold text-2xl tracking-tight text-zinc-50 leading-none">
                      {level}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500 mt-0.5">
                      lvl
                    </div>
                  </div>
                </Ring>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Doświadczenie
                  </div>
                  <div className="nums mt-0.5 text-xl font-semibold text-zinc-50 tracking-tight">
                    {stats?.total_xp ?? 0}{' '}
                    <span className="text-xs font-medium text-zinc-500">XP</span>
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    jeszcze <span className="nums text-amber-400 font-medium">{toNext}</span> do lvl {level + 1}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Streak"
                value={stats?.current_streak ?? 0}
                unit="dni"
                icon={Flame}
                accent="amber"
                size="sm"
              />
              <Stat
                label="Tyg. XP"
                value={weeklyXp}
                icon={TrendingUp}
                accent="emerald"
                size="sm"
              />
              <Stat
                label="Tonaż"
                value={Math.round((stats?.total_volume_kg ?? 0) as number).toLocaleString('pl-PL')}
                unit="kg"
                icon={Dumbbell}
                accent="sky"
                size="sm"
              />
              <Stat
                label="Czas"
                value={formatTotalMinutes(stats?.total_work_seconds ?? 0)}
                icon={Clock}
                accent="zinc"
                size="sm"
              />
            </div>

            {profile?.body_weight_kg ? (
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 px-4 py-2.5 text-[11px] text-zinc-500">
                Waga ciała:{' '}
                <span className="nums font-semibold text-zinc-200">
                  {profile.body_weight_kg} kg
                </span>{' '}
                · tonaż kalisteniki
              </div>
            ) : null}

            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={14} strokeWidth={1.75} className="text-amber-400" />
                  <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                    Dzisiejsze questy
                  </h3>
                </div>
                <span className="nums text-[10px] text-zinc-600">
                  {quests.filter((q) => q.completed).length}/{quests.length}
                </span>
              </div>
              <div className="space-y-2">
                {quests.length === 0 && (
                  <p className="text-xs text-zinc-500">Wczytuję questy...</p>
                )}
                {quests.map((q) => {
                  const pct = Math.min(
                    100,
                    Math.round(((q.progress ?? 0) / q.target) * 100),
                  )
                  return (
                    <div
                      key={q.id}
                      className={
                        q.completed
                          ? 'rounded-xl border border-amber-500/30 bg-amber-500/5 p-3'
                          : 'rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-3'
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-zinc-200 leading-snug">
                          {q.description}
                        </span>
                        <span
                          className={
                            q.completed
                              ? 'shrink-0 nums text-[10px] font-semibold text-amber-300'
                              : 'shrink-0 nums text-[10px] font-semibold text-zinc-500'
                          }
                        >
                          {q.completed ? '✓' : `+${q.xp_reward}`}
                        </span>
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-800/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-[width] duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-1 nums text-[10px] text-zinc-600">
                        {q.progress ?? 0}/{q.target}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 backdrop-blur-xl">
              <h3 className="mb-3 text-xs uppercase tracking-wider text-zinc-400 font-medium">
                Odznaki
              </h3>
              {badges.length === 0 ? (
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Zdobądź pierwszą pisząc do trenera lub logując trening.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {badges.map((b) => (
                    <div
                      key={b.slug}
                      title={b.name}
                      className="group flex aspect-square flex-col items-center justify-center rounded-xl border border-zinc-800/60 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-2 transition hover:border-amber-500/40 hover:from-amber-500/20"
                    >
                      <span className="text-2xl transition-transform group-hover:scale-110">
                        {b.icon}
                      </span>
                      <span className="mt-1 text-center text-[9px] leading-tight text-zinc-400">
                        {b.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  )
}

function formatTotalMinutes(seconds: number): string {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

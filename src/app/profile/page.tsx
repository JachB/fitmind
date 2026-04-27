import { redirect } from 'next/navigation'
import { Dumbbell, Flame, Trophy, Clock, TrendingUp, Target, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../login/actions'
import { ProfileForm } from './profile-form'
import { WorkoutHistory, type HistoryWorkout } from './workout-history'
import { LIFT_LABELS_PL, type Lift } from '@/lib/gamification/personal-records'
import type { CoachPersona } from '@/lib/gemini/prompts'
import { AppHeader } from '@/components/shell/app-header'
import { MobileBottomNav } from '@/components/shell/mobile-bottom-nav'
import { Avatar } from '@/components/ui/avatar'
import { Ring } from '@/components/ui/ring'
import { Stat } from '@/components/ui/stat'

const LIFT_ORDER: Lift[] = ['bench', 'squat', 'deadlift']
const LIFT_ICONS: Record<Lift, string> = {
  bench: '🏋️',
  squat: '🦵',
  deadlift: '💪',
}

type PRRow = {
  lift: string
  weight_kg: number
  reps: number
  estimated_1rm: number
  achieved_at: string
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=%2Fprofile')

  const [profileRes, statsRes, prsRes, workoutsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'display_name, body_weight_kg, goal, coach_persona, onboarded_at',
      )
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
      .from('personal_records')
      .select('lift, weight_kg, reps, estimated_1rm, achieved_at')
      .eq('user_id', user.id),
    supabase
      .from('workouts')
      .select(
        'id, performed_at, total_volume_kg, total_work_seconds, notes, exercises(name, exercise_type, position, sets(reps, weight_kg, duration_seconds, position))',
      )
      .eq('user_id', user.id)
      .order('performed_at', { ascending: false })
      .limit(20),
  ])

  const profile = profileRes.data
  if (!profile) redirect('/login')
  if (!profile.onboarded_at) redirect('/onboarding')

  const stats = statsRes.data
  const prs = (prsRes.data ?? []) as PRRow[]
  const prMap = new Map<Lift, PRRow>()
  for (const pr of prs) {
    if (LIFT_ORDER.includes(pr.lift as Lift)) {
      prMap.set(pr.lift as Lift, pr)
    }
  }

  type RawExercise = {
    name: string
    exercise_type: 'weighted' | 'bodyweight' | 'timed'
    position: number
    sets: {
      reps: number
      weight_kg: number
      duration_seconds: number | null
      position: number
    }[]
  }
  type RawWorkout = {
    id: string
    performed_at: string
    total_volume_kg: number
    total_work_seconds: number
    notes: string | null
    exercises: RawExercise[]
  }

  const workouts: HistoryWorkout[] = (
    (workoutsRes.data ?? []) as RawWorkout[]
  ).map((w) => ({
    id: w.id,
    performed_at: w.performed_at,
    total_volume_kg: Number(w.total_volume_kg),
    total_work_seconds: w.total_work_seconds,
    notes: w.notes,
    exercises: [...(w.exercises ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((e) => ({
        name: e.name,
        exercise_type: e.exercise_type,
        sets: [...(e.sets ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((s) => ({
            reps: s.reps,
            weight_kg: Number(s.weight_kg),
            duration_seconds: s.duration_seconds,
          })),
      })),
  }))

  const displayName =
    profile.display_name?.trim() ||
    user.email?.split('@')[0] ||
    'sportowcu'

  const level = stats?.level ?? 1
  const xpInLevel = (stats?.total_xp ?? 0) % 100

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        userName={displayName}
        userEmail={user.email ?? ''}
        signOutAction={signOut}
      />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 pb-24 md:pb-10 sm:px-6">
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full blur-3xl opacity-40"
            style={{
              background:
                'radial-gradient(circle, rgba(245,158,11,0.4), transparent 70%)',
            }}
            aria-hidden
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <Avatar name={displayName} size="xl" ring className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">
                Profil
              </div>
              <h1 className="font-bold text-4xl sm:text-5xl italic tracking-tight text-zinc-50 leading-none">
                {displayName}
              </h1>
              {profile.goal && (
                <div className="mt-3 flex items-start gap-2 text-sm text-zinc-400">
                  <Target size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-amber-400" />
                  <span className="leading-snug">{profile.goal}</span>
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Ring value={xpInLevel} max={100} size={28} strokeWidth={3} />
                  <span className="text-zinc-400">
                    Level <span className="nums font-semibold text-zinc-100">{level}</span>
                  </span>
                </div>
                <div className="h-3 w-px bg-zinc-800" />
                <span className="text-zinc-400">
                  <span className="nums font-semibold text-zinc-100">{stats?.total_xp ?? 0}</span> XP
                </span>
                <div className="h-3 w-px bg-zinc-800" />
                <span className="text-zinc-400 flex items-center gap-1">
                  <Flame size={12} className="text-amber-400" />
                  <span className="nums font-semibold text-zinc-100">{stats?.current_streak ?? 0}</span>{' '}
                  dni streaku
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={16} strokeWidth={1.75} className="text-amber-400" />
              <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-medium">
                Personal Records
              </h2>
            </div>
            <span className="text-[10px] text-zinc-600">
              1RM · Brzycki
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {LIFT_ORDER.map((lift) => {
              const pr = prMap.get(lift)
              return (
                <div
                  key={lift}
                  className={
                    pr
                      ? 'relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-5'
                      : 'rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5'
                  }
                >
                  {pr && (
                    <div
                      className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-60"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(245,158,11,0.5), transparent)',
                      }}
                      aria-hidden
                    />
                  )}
                  <div className="relative">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{LIFT_ICONS[lift]}</span>
                        <span className="text-xs font-medium text-zinc-300">
                          {LIFT_LABELS_PL[lift]}
                        </span>
                      </div>
                      {pr && (
                        <Trophy size={12} strokeWidth={2} className="text-amber-400" />
                      )}
                    </div>
                    {pr ? (
                      <div className="mt-3">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold tracking-tight text-4xl text-zinc-50 tracking-tight nums">
                            {Math.round(Number(pr.estimated_1rm))}
                          </span>
                          <span className="text-xs font-medium text-zinc-500">
                            kg 1RM
                          </span>
                        </div>
                        <div className="mt-1 nums text-[11px] text-zinc-500">
                          z {Number(pr.weight_kg)} kg × {pr.reps} powtórzeń
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-[11px] text-zinc-500 leading-relaxed">
                        Zaloguj trening z tym ćwiczeniem, a 1RM policzy się sam.
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-zinc-400 font-medium">
            Statystyki
          </h2>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Level"
              value={level}
              icon={TrendingUp}
              accent="amber"
              size="sm"
            />
            <Stat
              label="XP łącznie"
              value={(stats?.total_xp ?? 0).toLocaleString('pl-PL')}
              icon={Trophy}
              accent="amber"
              size="sm"
            />
            <Stat
              label="Najdłuższy streak"
              value={stats?.longest_streak ?? 0}
              unit="dni"
              icon={Flame}
              accent="rose"
              size="sm"
            />
            <Stat
              label="Tonaż łącznie"
              value={Math.round(Number(stats?.total_volume_kg ?? 0)).toLocaleString('pl-PL')}
              unit="kg"
              icon={Dumbbell}
              accent="sky"
              size="sm"
            />
            <Stat
              label="Czas treningu"
              value={formatTotalMinutes(stats?.total_work_seconds ?? 0)}
              icon={Clock}
              accent="zinc"
              size="sm"
              className="col-span-2 lg:col-span-1"
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <ProfileForm
            initial={{
              display_name: displayName,
              body_weight_kg: profile.body_weight_kg
                ? Number(profile.body_weight_kg)
                : null,
              goal: profile.goal,
              coach_persona: profile.coach_persona as CoachPersona,
            }}
          />

          <aside>
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl p-5">
              <div className="mb-4 flex items-center gap-2">
                <History size={14} strokeWidth={1.75} className="text-zinc-400" />
                <h2 className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                  Historia treningów
                </h2>
              </div>
              <WorkoutHistory workouts={workouts} />
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

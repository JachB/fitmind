import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../login/actions'
import { AppHeader } from '@/components/shell/app-header'
import { MobileBottomNav } from '@/components/shell/mobile-bottom-nav'
import { PlanUi } from './plan-ui'
import type { WeeklyPlan } from '@/lib/gemini/plan'

export const dynamic = 'force-dynamic'

export default async function PlanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=%2Fplan')

  const [profileRes, planRes, msgCountRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, coach_persona, goal')
      .eq('id', user.id)
      .single(),
    supabase
      .from('workout_plans')
      .select('id, plan, week_start, persona_snapshot, goal_snapshot, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user'),
  ])

  const userMessageCount = msgCountRes.count ?? 0
  const hasGoal = !!profileRes.data?.goal?.trim()
  const hasChatHistory = userMessageCount >= 3

  const userName =
    profileRes.data?.display_name?.trim() ||
    user.email?.split('@')[0] ||
    'sportowcu'

  const currentPlan = planRes.data
    ? {
        id: planRes.data.id,
        weekStart: planRes.data.week_start,
        persona: planRes.data.persona_snapshot,
        goal: planRes.data.goal_snapshot,
        createdAt: planRes.data.created_at,
        plan: planRes.data.plan as unknown as WeeklyPlan,
      }
    : null

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        userName={userName}
        userEmail={user.email ?? ''}
        signOutAction={signOut}
      />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 pb-24 md:pb-10 sm:px-6">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400 mb-2">
            Plan tygodniowy
          </p>
          <h1 className="font-bold text-5xl tracking-tight text-zinc-50 leading-none">
            Twój plan.
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-lg">
            Gemini układa plan pod twój cel, historię i osobowość trenera. Jeden klik.
          </p>
        </div>

        <PlanUi
          initialPlan={currentPlan}
          persona={profileRes.data?.coach_persona ?? 'empathetic'}
          hasGoal={hasGoal}
          hasChatHistory={hasChatHistory}
        />
      </main>

      <MobileBottomNav />
    </div>
  )
}

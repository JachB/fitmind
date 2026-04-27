import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../login/actions'
import { LeaderboardsUi } from './leaderboards-ui'
import { AppHeader } from '@/components/shell/app-header'
import { MobileBottomNav } from '@/components/shell/mobile-bottom-nav'

export const dynamic = 'force-dynamic'

export default async function LeaderboardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=%2Fleaderboards')

  const [profileRes, weeklyRes, volumeRes, xpRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single(),
    supabase.rpc('get_weekly_leaderboard', { row_limit: 20 }),
    supabase.rpc('get_volume_leaderboard', { row_limit: 20 }),
    supabase.rpc('get_xp_leaderboard', { row_limit: 20 }),
  ])

  const userName =
    profileRes.data?.display_name?.trim() ||
    user.email?.split('@')[0] ||
    'sportowcu'

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        userName={userName}
        userEmail={user.email ?? ''}
        signOutAction={signOut}
      />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 pb-24 md:pb-10 sm:px-6">
        <div className="mb-8 relative">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400 mb-2">
            Rankingi
          </p>
          <h1 className="font-bold text-5xl tracking-tight text-zinc-50 leading-none">
            Kto tu rządzi?
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-lg">
            Rankingi żyją na żywo — każdy nowy XP przerzuca kolejność.
          </p>
        </div>

        <LeaderboardsUi
          currentUserId={user.id}
          initialWeekly={weeklyRes.data ?? []}
          initialVolume={volumeRes.data ?? []}
          initialXp={xpRes.data ?? []}
        />
      </main>

      <MobileBottomNav />
    </div>
  )
}

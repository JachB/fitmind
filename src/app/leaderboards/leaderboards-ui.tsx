'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Crown, Medal, Radio } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/components/ui/cn'

type WeeklyRow = {
  user_id: string
  display_name: string
  avatar_url: string | null
  level: number | null
  weekly_xp: number
}

type VolumeRow = {
  user_id: string
  display_name: string
  avatar_url: string | null
  level: number | null
  total_volume_kg: number
}

type XpRow = {
  user_id: string
  display_name: string
  avatar_url: string | null
  level: number | null
  total_xp: number
}

type Tab = 'weekly' | 'xp' | 'volume'

type Row = {
  user_id: string
  name: string
  level: number | null
  value: number
  valueLabel: string
  unit: string
}

type Props = {
  currentUserId: string
  initialWeekly: WeeklyRow[]
  initialVolume: VolumeRow[]
  initialXp: XpRow[]
}

export function LeaderboardsUi({
  currentUserId,
  initialWeekly,
  initialVolume,
  initialXp,
}: Props) {
  const [tab, setTab] = useState<Tab>('weekly')
  const [weekly, setWeekly] = useState(initialWeekly)
  const [volume, setVolume] = useState(initialVolume)
  const [xp, setXp] = useState(initialXp)
  const [pulse, setPulse] = useState(false)
  const supabase = useRef(createClient())
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refetchAll = useCallback(async () => {
    const [w, v, x] = await Promise.all([
      supabase.current.rpc('get_weekly_leaderboard', { row_limit: 20 }),
      supabase.current.rpc('get_volume_leaderboard', { row_limit: 20 }),
      supabase.current.rpc('get_xp_leaderboard', { row_limit: 20 }),
    ])
    if (w.data) setWeekly(w.data as WeeklyRow[])
    if (v.data) setVolume(v.data as VolumeRow[])
    if (x.data) setXp(x.data as XpRow[])
    setPulse(true)
    setTimeout(() => setPulse(false), 800)
  }, [])

  useEffect(() => {
    const sb = supabase.current
    const timer = refetchTimer
    const channel = sb
      .channel('leaderboards')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_stats' },
        () => {
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(() => {
            void refetchAll()
          }, 600)
        },
      )
      .subscribe()

    return () => {
      if (timer.current) clearTimeout(timer.current)
      void sb.removeChannel(channel)
    }
  }, [refetchAll])

  const rows: Row[] = useMemo(() => {
    if (tab === 'weekly')
      return weekly.map((r) => ({
        user_id: r.user_id,
        name: r.display_name,
        level: r.level,
        value: r.weekly_xp,
        valueLabel: r.weekly_xp.toLocaleString('pl-PL'),
        unit: 'XP',
      }))
    if (tab === 'xp')
      return xp.map((r) => ({
        user_id: r.user_id,
        name: r.display_name,
        level: r.level,
        value: r.total_xp,
        valueLabel: r.total_xp.toLocaleString('pl-PL'),
        unit: 'XP',
      }))
    return volume.map((r) => ({
      user_id: r.user_id,
      name: r.display_name,
      level: r.level,
      value: Math.round(Number(r.total_volume_kg)),
      valueLabel: Math.round(Number(r.total_volume_kg)).toLocaleString('pl-PL'),
      unit: 'kg',
    }))
  }, [tab, weekly, xp, volume])

  const podium = rows.slice(0, 3)
  const rest = rows.slice(3)
  const myRow = rows.find((r) => r.user_id === currentUserId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-xl p-1">
          <TabBtn label="Tyg. XP" active={tab === 'weekly'} onClick={() => setTab('weekly')} />
          <TabBtn label="Total XP" active={tab === 'xp'} onClick={() => setTab('xp')} />
          <TabBtn label="Tonaż" active={tab === 'volume'} onClick={() => setTab('volume')} />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span
            className={cn(
              'h-2 w-2 rounded-full transition',
              pulse
                ? 'bg-amber-400 shadow-[0_0_8px_2px] shadow-amber-400/80'
                : 'bg-emerald-500 animate-pulse',
            )}
          />
          <Radio size={12} strokeWidth={1.75} />
          Live
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl py-16 text-center text-sm text-zinc-500">
          Brak danych w tej kategorii — bądź pierwszy!
        </div>
      ) : (
        <>
          {podium.length > 0 && <Podium rows={podium} currentUserId={currentUserId} />}

          {rest.length > 0 && (
            <ul className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl divide-y divide-zinc-800/40 overflow-hidden">
              {rest.map((r, i) => (
                <LeaderRow
                  key={r.user_id}
                  row={r}
                  rank={i + 4}
                  isMe={r.user_id === currentUserId}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {myRow && rows.indexOf(myRow) >= 3 && (
        <div className="sticky bottom-20 md:bottom-4 z-30">
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-zinc-900/80 backdrop-blur-xl p-3 shadow-[0_16px_40px_-12px_rgba(249,115,22,0.4)]">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-amber-300/80">
              Ty
            </p>
            <LeaderRow
              row={myRow}
              rank={rows.indexOf(myRow) + 1}
              isMe
              compact
            />
          </div>
        </div>
      )}

      <p className="text-center text-[10px] tracking-wide text-zinc-600">
        Realtime via Supabase · aktualizuje się gdy ktoś zarabia XP
      </p>
    </div>
  )
}

function Podium({ rows, currentUserId }: { rows: Row[]; currentUserId: string }) {
  const [first, second, third] = rows
  const order: Array<{ row: Row | undefined; place: 1 | 2 | 3 }> = [
    { row: second, place: 2 },
    { row: first, place: 1 },
    { row: third, place: 3 },
  ]

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-xl p-4 pt-8 sm:p-6 sm:pt-10">
      <div
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full blur-3xl opacity-60"
        style={{
          background:
            'radial-gradient(ellipse, rgba(245,158,11,0.3), transparent 70%)',
        }}
        aria-hidden
      />
      <div className="relative grid grid-cols-3 gap-3 items-end">
        {order.map(({ row, place }) => {
          if (!row) return <div key={place} />
          const isMe = row.user_id === currentUserId
          const size = place === 1 ? 'lg' : 'md'
          const barHeight = place === 1 ? 'h-32' : place === 2 ? 'h-24' : 'h-20'
          const icon =
            place === 1 ? (
              <Crown size={18} className="text-amber-400" strokeWidth={2} />
            ) : place === 2 ? (
              <Medal size={16} className="text-zinc-300" strokeWidth={2} />
            ) : (
              <Medal size={16} className="text-orange-700" strokeWidth={2} />
            )

          return (
            <div
              key={place}
              className="flex flex-col items-center"
            >
              <div className="flex flex-col items-center">
                <div className="mb-2">{icon}</div>
                <Avatar
                  name={row.name}
                  size={size}
                  ring={place === 1}
                  className={place === 1 ? 'shadow-[0_0_24px_-4px_rgba(245,158,11,0.6)]' : ''}
                />
                <div
                  className={cn(
                    'mt-2 max-w-full truncate text-center text-[11px] font-medium',
                    isMe ? 'text-amber-300' : 'text-zinc-200',
                  )}
                >
                  {row.name}
                  {isMe && ' · Ty'}
                </div>
                <div className="nums text-[10px] text-zinc-500">
                  Lvl {row.level ?? 1}
                </div>
              </div>
              <div
                className={cn(
                  'mt-3 w-full rounded-t-xl border border-b-0 flex flex-col items-center justify-center gap-0.5 px-2',
                  barHeight,
                  place === 1
                    ? 'border-amber-500/40 bg-gradient-to-t from-amber-500/20 via-amber-500/5 to-transparent'
                    : 'border-zinc-800/60 bg-gradient-to-t from-zinc-800/30 via-zinc-900/10 to-transparent',
                )}
              >
                <span
                  className={cn(
                    'nums font-bold tracking-tight',
                    place === 1 ? 'text-3xl text-amber-300' : 'text-xl text-zinc-200',
                  )}
                >
                  {row.valueLabel}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500">
                  {row.unit}
                </span>
                <span
                  className={cn(
                    'mt-1 nums font-bold text-lg',
                    place === 1 ? 'text-amber-400' : 'text-zinc-500',
                  )}
                >
                  {place}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LeaderRow({
  row,
  rank,
  isMe,
  compact = false,
}: {
  row: Row
  rank: number
  isMe: boolean
  compact?: boolean
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition',
        !compact && (isMe ? 'bg-amber-500/5' : 'hover:bg-zinc-800/20'),
      )}
    >
      <span
        className={cn(
          'nums w-8 shrink-0 text-center text-sm font-semibold',
          rank <= 10 ? 'text-zinc-300' : 'text-zinc-500',
        )}
      >
        #{rank}
      </span>
      <Avatar name={row.name} size="sm" ring={isMe} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-100 truncate">
          <span className="truncate">{row.name}</span>
          {isMe && !compact && (
            <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-300">
              Ty
            </span>
          )}
        </div>
        <div className="nums text-[11px] text-zinc-500">
          Lvl {row.level ?? 1}
        </div>
      </div>
      <div className="text-right">
        <div className="nums text-sm font-semibold text-zinc-100">
          {row.valueLabel}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
          {row.unit}
        </div>
      </div>
    </li>
  )
}

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 sm:px-4 py-1.5 text-xs font-medium transition',
        active
          ? 'bg-gradient-to-b from-amber-500 to-orange-600 text-white shadow-[0_4px_12px_-4px_rgba(249,115,22,0.6)]'
          : 'text-zinc-400 hover:text-zinc-100',
      )}
    >
      {label}
    </button>
  )
}

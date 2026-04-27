'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, Trophy, User, CalendarDays } from 'lucide-react'
import { cn } from '@/components/ui/cn'

type Tab = {
  href: string
  label: string
  icon: typeof MessageCircle
}

const TABS: Tab[] = [
  { href: '/chat', label: 'Trener', icon: MessageCircle },
  { href: '/plan', label: 'Plan', icon: CalendarDays },
  { href: '/leaderboards', label: 'Rankingi', icon: Trophy },
  { href: '/profile', label: 'Profil', icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      data-mobile-nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-800/60 bg-zinc-950/90 backdrop-blur-xl safe-bottom"
      aria-label="Nawigacja mobilna"
    >
      <ul className="flex h-16 items-stretch justify-around px-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'relative flex h-full flex-col items-center justify-center gap-1 transition',
                  active ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300',
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2.25 : 1.75}
                  className={cn(
                    'transition-transform',
                    active && 'scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]',
                  )}
                />
                <span className="text-[10px] font-medium tracking-wide">
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { LogOut, ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/components/ui/cn'

type NavItem = { href: string; label: string }

const NAV: NavItem[] = [
  { href: '/chat', label: 'Trener' },
  { href: '/plan', label: 'Plan' },
  { href: '/leaderboards', label: 'Rankingi' },
  { href: '/profile', label: 'Profil' },
]

type Props = {
  userName: string
  userEmail: string
  signOutAction: () => Promise<void>
}

export function AppHeader({ userName, userEmail, signOutAction }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', onClick)
      return () => document.removeEventListener('mousedown', onClick)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl safe-top">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/chat" className="flex items-center gap-2 group">
          <Image
            src="/images/logo-icon.webp"
            alt="FitMind logo"
            width={40}
            height={40}
            style={{ width: 40, height: 40 }}
            className="object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover:drop-shadow-[0_0_16px_rgba(245,158,11,0.8)] transition"
          />
          <span className="font-bold text-xl tracking-tight text-zinc-50">
            FitMind
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  active
                    ? 'text-zinc-50'
                    : 'text-zinc-400 hover:text-zinc-100',
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[17px] h-[2px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border border-zinc-800/50 bg-zinc-900/40 p-1 pr-2 transition hover:border-zinc-700 hover:bg-zinc-900/60"
          >
            <Avatar name={userName} size="sm" />
            <span className="hidden sm:inline text-xs font-medium text-zinc-300 max-w-[100px] truncate">
              {userName}
            </span>
            <ChevronDown
              size={14}
              className={cn(
                'text-zinc-500 transition hidden sm:inline',
                menuOpen && 'rotate-180',
              )}
            />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900/95 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)]">
              <div className="border-b border-zinc-800/60 px-4 py-3">
                <div className="text-sm font-medium text-zinc-100 truncate">
                  {userName}
                </div>
                <div className="text-[11px] text-zinc-500 truncate">
                  {userEmail}
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-xs text-zinc-300 transition hover:bg-zinc-800/60 hover:text-zinc-50"
              >
                Ustawienia profilu
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 border-t border-zinc-800/60 px-4 py-2.5 text-left text-xs text-rose-400 transition hover:bg-rose-500/10"
                >
                  <LogOut size={14} strokeWidth={1.75} />
                  Wyloguj
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

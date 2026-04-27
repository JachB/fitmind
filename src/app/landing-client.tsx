'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import {
  ArrowRight,
  MessageSquare,
  Trophy,
  Flame,
  Dumbbell,
  Target,
  Zap,
  CalendarDays,
  Coffee,
  Bike,
  ChevronDown,
  Brain,
  Rocket,
  Check,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { CountUp } from '@/components/ui/count-up'
import { cn } from '@/components/ui/cn'

export function LandingClient() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <ScrollProgress />
      <AuroraBackground />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-5 animate-[reveal-up_0.6s_cubic-bezier(0.22,1,0.36,1)_forwards]">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/images/logo-icon.webp"
            alt="FitMind logo"
            width={40}
            height={40}
            style={{ width: 40, height: 40 }}
            className="object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] group-hover:drop-shadow-[0_0_16px_rgba(245,158,11,0.9)] transition"
          />
          <span className="text-xl font-bold tracking-tight text-zinc-50">FitMind</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="hidden sm:inline text-sm text-zinc-400 hover:text-zinc-100 transition px-3 py-2">
            Zaloguj się
          </Link>
          <Link href="/login?mode=register">
            <Button size="sm" rightIcon={<ArrowRight size={14} />}>Zacznij</Button>
          </Link>
        </div>
      </nav>

      <HeroSection />
      <LogoStripSection />
      <HowItWorksSection />
      <PersonasSection />
      <FeaturesSection />
      <StatsSection />
      <FaqSection />
      <CtaSection />

      <footer className="relative border-t border-zinc-800/40 mt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-600">
          <span>FitMind · Portfolio by Jan Bartnicki</span>
          <span>Next.js 16 · Gemini 3 · Supabase · Tailwind v4</span>
        </div>
      </footer>
    </main>
  )
}

/* ============================================================ */
/*  Scroll progress bar — top of viewport                         */
/* ============================================================ */
function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const el = ref.current
        if (!el) return
        const max = document.documentElement.scrollHeight - window.innerHeight
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
        el.style.setProperty('--scroll', String(p))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return <div ref={ref} className="scroll-progress" aria-hidden />
}

/* ============================================================ */
/*  Aurora background                                             */
/* ============================================================ */
function AuroraBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[900px] -z-10"
      aria-hidden
      style={{
        background:
          'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,158,11,0.18), transparent 60%), radial-gradient(ellipse 40% 40% at 100% 20%, rgba(244,63,94,0.10), transparent 60%)',
      }}
    />
  )
}

/* ============================================================ */
/*  Hero                                                          */
/* ============================================================ */
function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(pointer: coarse)').matches) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${e.clientX - r.left}px`)
        el.style.setProperty('--my', `${e.clientY - r.top}px`)
      })
    }
    el.addEventListener('mousemove', onMove)
    return () => {
      el.removeEventListener('mousemove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <section
      ref={ref}
      className="spotlight relative mx-auto max-w-6xl px-4 sm:px-6 pt-10 sm:pt-16 pb-20 sm:pb-28"
    >
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
        <div>
          <Reveal variant="up" delay={0}>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
              </span>
              Beta · wczesny dostęp
            </div>
          </Reveal>

          <h1 className="mt-6 text-[2.75rem] sm:text-6xl lg:text-[5rem] leading-[1.02] tracking-[-0.035em] font-bold text-zinc-50">
            <span className="hero-line l-1 block">Trenuj tak,</span>
            <span className="hero-line l-2 block">jakby ktoś</span>
            <span className="hero-line l-3 block">
              <span className="shimmer-text">naprawdę</span>{' '}
              <span className="text-zinc-50">patrzył.</span>
            </span>
          </h1>

          <Reveal variant="up" delay={4}>
            <p className="mt-6 max-w-lg text-base sm:text-lg text-zinc-400 leading-relaxed">
              AI trener, który pamięta Twoje cele, rozbiera każdy trening
              na czynniki pierwsze i pisze do Ciebie tak, jak lubisz —
              empatycznie, brutalnie, po koleżeńsku, profesjonalnie.
            </p>
          </Reveal>

          <Reveal variant="up" delay={5}>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/login?mode=register">
                <Button size="lg" rightIcon={<ArrowRight size={16} />} className="w-full sm:w-auto">
                  Zacznij za darmo
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Mam już konto
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal variant="up" delay={6}>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" strokeWidth={2.5} />
                Bez karty
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" strokeWidth={2.5} />
                30 sekund do startu
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" strokeWidth={2.5} />
                Anuluj kiedy chcesz
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal variant="right" delay={3} className="relative lg:ml-8">
          <div className="float-y">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-amber-500/25 via-orange-500/10 to-rose-500/10 blur-2xl" aria-hidden />
            <div className="relative rounded-3xl border border-zinc-800/60 bg-zinc-900/50  p-5 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.85)] ">
              <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name="Sarge" size="sm" ring />
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">Sarge</div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500">Online</span>
                    </div>
                  </div>
                </div>
                <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-rose-300">
                  Hardcore
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-800/60 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100">
                    <p className="leading-relaxed">Boli mnie po wczorajszym, może jutro sobie odpuszczę?</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-amber-500 to-orange-600 px-4 py-2.5 text-sm text-white shadow-[0_4px_16px_-4px_rgba(249,115,22,0.45)]">
                    <p className="leading-relaxed font-medium">
                      BOLI CIĘ? DOBRZE. TO ZNACZY ŻE COŚ ROBIŁEŚ.
                      NAJLEPSI NIE CZEKAJĄ AŻ PRZESTANIE BOLEĆ.
                      JUTRO. 6:00. NIE ODPUSZCZAMY.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="rounded-2xl rounded-tl-sm border border-zinc-800/60 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 dot-typing">
                    <span>·</span><span>·</span><span>·</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-500">
                <MessageSquare size={12} strokeWidth={1.75} />
                <span className="flex-1">Odpowiedz Sarge…</span>
                <kbd className="hidden sm:inline rounded bg-zinc-800/60 px-1.5 py-0.5 text-[9px] text-zinc-400">↵</kbd>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ============================================================ */
/*  Logo strip — tech credibility                                 */
/* ============================================================ */
function LogoStripSection() {
  const items = [
    'Next.js 16',
    'Gemini 3',
    'Supabase',
    'Realtime',
    'Tailwind v4',
    'TypeScript',
    'Vercel',
    'Server Components',
    'OAuth',
    'Edge Runtime',
  ]
  return (
    <section className="relative border-y border-zinc-800/40 bg-zinc-950/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center gap-4 sm:gap-6">
        <span className="hidden sm:inline shrink-0 text-[10px] uppercase tracking-[0.25em] text-zinc-600">
          Zbudowane na
        </span>
        <div
          className="marquee relative flex-1 overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage:
              'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div className="marquee-track">
            {[...items, ...items].map((it, i) => (
              <span
                key={`${it}-${i}`}
                className="mx-6 text-xs font-medium text-zinc-500 whitespace-nowrap hover:text-amber-300 transition-colors"
              >
                {it}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================ */
/*  How it works — 3 steps                                        */
/* ============================================================ */
function HowItWorksSection() {
  const steps = [
    {
      n: 1,
      icon: <Brain size={18} className="text-amber-400" strokeWidth={2} />,
      title: 'Wybierz trenera',
      desc: 'Empatyczny Max, brutalny Sarge, kumpel-ziomek czy profesjonalny Coach. Każdy ma inny ton.',
    },
    {
      n: 2,
      icon: <MessageSquare size={18} className="text-amber-400" strokeWidth={2} />,
      title: 'Pisz jak do człowieka',
      desc: '"4×8 przysiady 100kg" albo "zrobiłem dziś 10 km". AI parsuje, zapisuje, liczy tonaż.',
    },
    {
      n: 3,
      icon: <Rocket size={18} className="text-amber-400" strokeWidth={2} />,
      title: 'Wracaj',
      desc: 'Streak, questy, PRs, leaderboardy realtime. Appka wciąga, bo widzisz progres.',
    },
  ]

  return (
    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
      <Reveal variant="up" className="text-center mb-12">
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400 mb-3">Jak to działa</p>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-50">
          Trzy kroki, zero tarcia.
        </h2>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
        {steps.map((s, i) => (
          <Reveal key={s.n} variant="up" delay={((i + 1) * 1) as 1 | 2 | 3}>
            <div className="relative h-full rounded-2xl border border-zinc-800/50 bg-zinc-900/30  p-6 hover:border-zinc-700/60 transition">
              <div
                className="absolute top-4 right-5 font-bold text-[4.5rem] leading-none text-zinc-800/60 select-none tabular-nums"
                aria-hidden
              >
                {s.n}
              </div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/5 mb-5">
                {s.icon}
              </div>
              <h3 className="relative text-lg font-semibold text-zinc-100 mb-2">{s.title}</h3>
              <p className="relative text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ============================================================ */
/*  Personas                                                      */
/* ============================================================ */
function PersonasSection() {
  const personas: Array<{
    title: string
    tagline: string
    quote: string
    accent: 'emerald' | 'rose' | 'amber' | 'sky'
    featured?: boolean
  }> = [
    { title: 'Max', tagline: 'Empatyczny', accent: 'emerald', quote: 'Hej, jak się dziś czujesz? Zrobimy coś dobrego dla Ciebie.' },
    { title: 'Sarge', tagline: 'Hardcore', accent: 'rose', quote: 'PŁACZ POZA SIŁOWNIĄ. TUTAJ PRACUJESZ.', featured: true },
    { title: 'Kumpel', tagline: 'Ziomek', accent: 'amber', quote: 'Eluwinka, jedziemy z tym koksem?' },
    { title: 'Coach', tagline: 'Profesjonalny', accent: 'sky', quote: 'Progresja RPE 7-8, objętość +5% do poprzedniego cyklu.' },
  ]

  return (
    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
      <Reveal variant="up" className="text-center mb-12">
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400 mb-3">Cztery persony, jeden Gemini</p>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-50">
          Wybierz swojego <span className="shimmer-text">trenera</span>.
        </h2>
        <p className="mt-3 text-sm text-zinc-500 max-w-md mx-auto">
          Każda persona ma inny ton, inny prompt, inne nawyki. Ten sam silnik pod spodem.
        </p>
      </Reveal>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {personas.map((p, i) => (
          <Reveal key={p.title} variant="up" delay={((i + 1) * 1) as 1 | 2 | 3 | 4}>
            <PersonaCard {...p} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function PersonaCard({
  title,
  tagline,
  quote,
  accent,
  featured,
}: {
  title: string
  tagline: string
  quote: string
  accent: 'emerald' | 'rose' | 'amber' | 'sky'
  featured?: boolean
}) {
  const taglineColor = { emerald: 'text-emerald-400', rose: 'text-rose-400', amber: 'text-amber-400', sky: 'text-sky-400' }[accent]
  const glow = { emerald: 'from-emerald-500/20', rose: 'from-rose-500/25', amber: 'from-amber-500/20', sky: 'from-sky-500/20' }[accent]

  return (
    <div
      className={cn(
        'card-lift group relative overflow-hidden rounded-2xl p-5 h-full',
        featured
          ? 'border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent'
          : 'border border-zinc-800/50 bg-zinc-900/30 hover:border-zinc-700/60',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br',
          glow,
          'to-transparent',
        )}
        aria-hidden
      />
      {featured && (
        <div className="absolute top-3 right-3 text-[9px] uppercase tracking-wider text-amber-400 font-medium">
          Popularne
        </div>
      )}
      <Avatar name={title} size="md" ring={featured} />
      <div className="mt-3">
        <div className="text-base font-semibold text-zinc-100">{title}</div>
        <div className={cn('text-[11px] uppercase tracking-wider', taglineColor)}>{tagline}</div>
      </div>
      <p className="mt-3 text-[13px] text-zinc-400 leading-snug">
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  )
}

/* ============================================================ */
/*  Features                                                      */
/* ============================================================ */
function FeaturesSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
      <Reveal variant="up" className="text-center mb-12">
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400 mb-3">Wszystko w jednej appce</p>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-50">
          Nie kolejny <span className="line-through decoration-rose-500/60 decoration-[3px] text-zinc-500">tracker</span>. Trener.
        </h2>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        <Reveal variant="scale" className="lg:col-span-2" amount={0.1}>
          <FeatureCard
              icon={<CalendarDays size={18} className="text-amber-400" strokeWidth={2} />}
              title="Gemini układa plan na 7 dni · jeden klik"
              desc="Podajesz cel, wybierasz trenera, klikasz Generuj — Gemini analizuje historię treningów i tworzy spersonalizowany plan na cały tydzień. Structured output gwarantuje poprawny format za każdym razem."
              badge="Structured output"
              mock={
                <div className="mt-1">
                  <div className="grid grid-cols-7 gap-1.5 mb-4">
                    {[
                      { label: 'Pon', kind: 'workout' },
                      { label: 'Wt', kind: 'workout' },
                      { label: 'Śr', kind: 'rest' },
                      { label: 'Czw', kind: 'workout' },
                      { label: 'Pt', kind: 'cardio' },
                      { label: 'Sob', kind: 'workout' },
                      { label: 'Nd', kind: 'rest' },
                    ].map((d) => (
                      <div
                        key={d.label}
                        className={
                          d.kind === 'workout'
                            ? 'flex flex-col items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/5 py-2 px-1'
                            : d.kind === 'cardio'
                              ? 'flex flex-col items-center gap-1 rounded-xl border border-sky-500/30 bg-sky-500/5 py-2 px-1'
                              : 'flex flex-col items-center gap-1 rounded-xl border border-zinc-800/40 bg-zinc-900/20 py-2 px-1'
                        }
                      >
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500">{d.label}</span>
                        {d.kind === 'workout' ? (
                          <Dumbbell size={13} className="text-amber-400" strokeWidth={1.75} />
                        ) : d.kind === 'cardio' ? (
                          <Bike size={13} className="text-sky-400" strokeWidth={1.75} />
                        ) : (
                          <Coffee size={13} className="text-zinc-500" strokeWidth={1.75} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/60 divide-y divide-zinc-800/40 overflow-hidden">
                    {[
                      { name: 'Wyciskanie sztangi na ławce poziomej', sets: '4', reps: '6-8', hint: '75% 1RM' },
                      { name: 'Wyciskanie hantli nad głowę', sets: '3', reps: '10-12', hint: null },
                      { name: 'Rozpiętki na kablach', sets: '3', reps: '12-15', hint: null },
                    ].map((ex, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2">
                        <span className="nums text-[10px] text-zinc-600 w-4">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-zinc-200 truncate">{ex.name}</div>
                          {ex.hint && <div className="text-[10px] text-zinc-600">{ex.hint}</div>}
                        </div>
                        <span className="nums text-xs text-amber-300 shrink-0">{ex.sets}×{ex.reps}</span>
                      </div>
                    ))}
                  </div>
                </div>
              }
            />
        </Reveal>

        <Reveal variant="up" delay={1}>
          <FeatureCard
              icon={<Zap size={18} className="text-amber-400" strokeWidth={2} />}
              title="Parsuje trening z jednego zdania"
              desc='Wrzuć "4×8 przysiady 100kg, pompki 3×20", a AI rozbije to na ćwiczenia, serie, ciężary i tonaż. Bez klikania w formularze.'
              mock={
                <div className="space-y-2 pt-2">
                  <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400">
                    &ldquo;4×8 przysiady 100kg&rdquo;
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-600 pl-2">
                    <ArrowRight size={12} />
                    <span>Przysiad ze sztangą</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {['8×100kg', '8×100kg', '8×100kg', '8×100kg'].map((s, i) => (
                      <span key={i} className="nums rounded-md border border-zinc-800/60 bg-zinc-900/60 px-2 py-0.5 text-[11px] text-zinc-300">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="pl-6 pt-1 nums text-[11px] text-amber-400">Tonaż: 3 200 kg · +40 XP</div>
                </div>
              }
            />
        </Reveal>

        <Reveal variant="up" delay={2}>
          <FeatureCard
              icon={<Trophy size={18} className="text-amber-400" strokeWidth={2} />}
              title="Personal Records · formuła Brzyckiego"
              desc="Świętą trójcę (ławka / przysiad / martwy ciąg) trackujemy automatycznie. Nowy PR = badge + 50 XP + toast."
              mock={
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    { label: 'Ławka', val: 102 },
                    { label: 'Przysiad', val: 138, hl: true },
                    { label: 'MC', val: 160 },
                  ].map((pr) => (
                    <div
                      key={pr.label}
                      className={
                        pr.hl
                          ? 'relative rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 overflow-hidden'
                          : 'rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5'
                      }
                    >
                      {pr.hl && (
                        <div
                          className="pointer-events-none absolute -top-4 -right-4 h-12 w-12 rounded-full blur-xl opacity-60"
                          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.6), transparent)' }}
                        />
                      )}
                      <div className="text-[9px] uppercase tracking-wider text-zinc-500">{pr.label}</div>
                      <div className="mt-1 font-bold text-xl text-zinc-100 nums">
                        <CountUp to={pr.val} />
                        <span className="text-[10px] text-zinc-500 ml-0.5 font-normal">kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              }
            />
        </Reveal>

        <Reveal variant="up" delay={3}>
          <FeatureCard
              icon={<Flame size={18} className="text-amber-400" strokeWidth={2} />}
              title="Streak, questy, poziomy"
              desc="Każdy dzień się liczy. Dzienne questy od AI, XP za aktywność, level-up z efektem. Wracasz, bo chcesz."
              mock={
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1">
                    <Flame size={12} className="text-amber-400" />
                    <span className="nums text-xs font-semibold text-amber-200">12 dni</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Target size={12} className="text-emerald-400" />
                    <span className="nums">2/3 questy</span>
                  </div>
                  <div className="nums text-xs text-zinc-400">Lvl <span className="text-zinc-100 font-semibold">7</span></div>
                </div>
              }
            />
        </Reveal>

        <Reveal variant="up" delay={4}>
          <FeatureCard
              icon={<Dumbbell size={18} className="text-amber-400" strokeWidth={2} />}
              title="Leaderboardy na żywo"
              desc="Tygodniowy ranking XP, total XP, łączny tonaż. Realtime przez Supabase — ktoś dorzuci set, Twoja pozycja drgnie."
              mock={
                <div className="space-y-1 pt-2">
                  {[
                    { rank: 1, name: 'Marek', xp: '2 140' },
                    { rank: 2, name: 'Ty', xp: '1 980', me: true },
                    { rank: 3, name: 'Kasia', xp: '1 760' },
                  ].map((r) => (
                    <div
                      key={r.rank}
                      className={
                        r.me
                          ? 'flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5'
                          : 'flex items-center gap-2.5 px-2.5 py-1.5'
                      }
                    >
                      <span className="nums w-5 text-xs text-zinc-500 font-semibold">#{r.rank}</span>
                      <Avatar name={r.name} size="xs" />
                      <span className="text-xs text-zinc-200 flex-1">{r.name}</span>
                      <span className="nums text-xs font-semibold text-zinc-300">{r.xp} XP</span>
                    </div>
                  ))}
                </div>
              }
            />
        </Reveal>
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  desc,
  mock,
  badge,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  mock: React.ReactNode
  badge?: string
}) {
  return (
    <div className="card-lift gradient-border-hover group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 hover:border-zinc-700/60 h-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-semibold text-zinc-100 leading-snug">{title}</h3>
            {badge && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-300">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="mt-4">{mock}</div>
    </div>
  )
}

/* ============================================================ */
/*  Stats bar — animated counters                                 */
/* ============================================================ */
function StatsSection() {
  const stats = [
    { value: 4, suffix: '', label: 'Persony AI', sub: 'Każda z własnym promptem' },
    { value: 300, suffix: '+', label: 'Ćwiczeń w bazie', sub: 'Ze sztangą, z masą, timed' },
    { value: 7, suffix: ' dni', label: 'Plan w 10 sekund', sub: 'Gemini · structured output' },
    { value: 0, suffix: '', label: 'Klikania w formularze', sub: 'Tylko rozmowa', custom: 'ZERO' },
  ]

  return (
    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/60 via-zinc-950/60 to-zinc-900/30  p-8 sm:p-12">
        <div
          className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full blur-3xl opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.35), transparent 70%)' }}
          aria-hidden
        />
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} variant="up" delay={((i + 1) * 1) as 1 | 2 | 3 | 4}>
              <div>
                <div className="font-bold text-4xl sm:text-5xl text-zinc-50 nums leading-none tracking-tight">
                  {s.custom ? (
                    <span>{s.custom}</span>
                  ) : (
                    <>
                      <CountUp to={s.value} />
                      <span>{s.suffix}</span>
                    </>
                  )}
                </div>
                <div className="mt-3 text-sm font-medium text-zinc-200">{s.label}</div>
                <div className="text-[11px] text-zinc-500 mt-1">{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================ */
/*  FAQ                                                           */
/* ============================================================ */
function FaqSection() {
  const faqs = [
    {
      q: 'Czy to jest prawdziwy AI czy chatbot ze skryptami?',
      a: 'Prawdziwy Gemini 3 przez oficjalne API Google. Każda odpowiedź jest generowana w czasie rzeczywistym z pełnym kontekstem Twojego profilu, historii treningów i PRs. Persona = inny system prompt, nie inny bot.',
    },
    {
      q: 'Jak działa parsowanie treningu?',
      a: 'Piszesz naturalnym językiem, Gemini zwraca structured output (JSON Schema). App waliduje, zapisuje w Supabase, przelicza tonaż i XP. Jeśli AI nie rozpozna ćwiczenia — pyta zamiast zgadywać.',
    },
    {
      q: 'Czy muszę podawać wagę?',
      a: 'Nie. Ale jeśli podasz — ćwiczenia kalisteniczne (pompki, podciągania, dipy) wliczą Twoją masę ciała do tonażu. Bez wagi to 0 kg i niższe XP.',
    },
    {
      q: 'Ile to kosztuje?',
      a: 'Zero. To portfolio-project, nie SaaS. Możesz stworzyć konto, testować, porównywać persony, rywalizować w leaderboardach. Limit rozsądku na zapytania per dzień, żeby nie spalić Gemini budget.',
    },
  ]

  return (
    <section className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24">
      <Reveal variant="up" className="text-center mb-10">
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400 mb-3">Pytania, które zadajesz</p>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-50">
          FAQ <span className="shimmer-text">bez lania wody</span>.
        </h2>
      </Reveal>

      <div className="space-y-2">
        {faqs.map((f, i) => (
          <Reveal key={f.q} variant="up" delay={((i + 1) * 1) as 1 | 2 | 3 | 4}>
            <FaqItem q={f.q} a={f.a} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="faq-item group rounded-2xl border border-zinc-800/50 bg-zinc-900/30 transition-colors duration-150 hover:border-zinc-700/60 open:border-amber-500/35">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left [&::-webkit-details-marker]:hidden">
        <span className="text-sm sm:text-base font-medium text-zinc-100 group-open:text-amber-100 transition-colors duration-150">
          {q}
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-800/60 bg-zinc-950/40 transition-all duration-150 group-open:rotate-180 group-open:border-amber-500/50 group-open:bg-amber-500/10">
          <ChevronDown
            size={14}
            strokeWidth={2}
            className="text-zinc-500 transition-colors duration-150 group-open:text-amber-400"
          />
        </span>
      </summary>
      <div className="faq-body overflow-hidden">
        <p className="px-5 pb-5 pt-3 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/40">
          {a}
        </p>
      </div>
    </details>
  )
}

/* ============================================================ */
/*  CTA                                                           */
/* ============================================================ */
function CtaSection() {
  return (
    <section className="relative mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28">
      <Reveal variant="scale">
        <div className="conic-border relative overflow-hidden rounded-[2rem] border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-500/5 p-8 sm:p-14 text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.35) 0%, transparent 60%)',
            }}
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-50 leading-[1.05]">
              Pierwszy trening za <span className="shimmer-text">30 sekund</span>.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-zinc-300 max-w-lg mx-auto">
              Google lub email · wybierasz trenera · piszesz cel · jedziemy.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login?mode=register">
                <Button size="lg" rightIcon={<ArrowRight size={16} />} className="px-10">
                  Załóż konto
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8">
                  Zaloguj się
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-400">
              {['Bez karty', 'Bez spamu', 'Bez instalacji'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

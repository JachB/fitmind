import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, Lock, Mail } from 'lucide-react'
import { signInWithEmail, signUpWithEmail, signInWithOAuth } from './actions'
import { Button } from '@/components/ui/button'

type SearchParams = Promise<{
  error?: string
  mode?: string
  email?: string
  redirect?: string
}>

export default async function LoginPage(props: { searchParams: SearchParams }) {
  const { error, mode, email, redirect: redirectTo } = await props.searchParams
  const isRegister = mode === 'register'
  const safeRedirect =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : ''

  async function googleAction() {
    'use server'
    await signInWithOAuth('google')
  }
  async function githubAction() {
    'use server'
    await signInWithOAuth('github')
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      >
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(249,115,22,0.12) 40%, transparent 70%)',
          }}
        />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-6 flex items-center justify-center">
            <div className="relative flex items-center justify-center" style={{ transform: 'translateX(-10px) translateY(14px)' }}>
              <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-2xl" />
              <Image
                src="/images/logo-icon.webp"
                alt="FitMind logo"
                width={96}
                height={96}
                className="relative object-contain drop-shadow-[0_0_24px_rgba(245,158,11,0.7)]"
              />
            </div>
          </div>

          <h1 className="font-bold text-6xl tracking-tight text-zinc-50 leading-none">
            FitMind
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-xs">
            {isRegister
              ? 'Załóż konto i znajdź swojego trenera.'
              : 'Wróciłeś. Kontynuujmy.'}
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-xl p-6 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          <div className="space-y-2.5">
            <form action={googleAction}>
              <button
                type="submit"
                className="group w-full h-11 inline-flex items-center justify-center gap-3 rounded-xl bg-white text-zinc-900 text-sm font-medium transition hover:bg-zinc-100 active:scale-[0.98]"
              >
                <GoogleIcon />
                Kontynuuj z Google
              </button>
            </form>

            <form action={githubAction}>
              <button
                type="submit"
                className="group w-full h-11 inline-flex items-center justify-center gap-3 rounded-xl border border-zinc-700/60 bg-zinc-950/60 text-sm font-medium text-zinc-100 transition hover:bg-zinc-900 active:scale-[0.98]"
              >
                <GithubIcon />
                Kontynuuj z GitHub
              </button>
            </form>
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-zinc-800/80 flex-1" />
            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
              lub email
            </span>
            <div className="h-px bg-zinc-800/80 flex-1" />
          </div>

          <form
            action={isRegister ? signUpWithEmail : signInWithEmail}
            className="space-y-3"
          >
            {safeRedirect && (
              <input type="hidden" name="redirect" value={safeRedirect} />
            )}
            <div className="relative">
              <Mail
                size={16}
                strokeWidth={1.75}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
              <input
                name="email"
                type="email"
                placeholder="email@example.com"
                required
                autoComplete="email"
                defaultValue={email ?? ''}
                className="w-full h-11 rounded-xl border border-zinc-800/80 bg-zinc-950/60 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div className="relative">
              <Lock
                size={16}
                strokeWidth={1.75}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
              <input
                name="password"
                type="password"
                placeholder="Hasło"
                required
                minLength={6}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="w-full h-11 rounded-xl border border-zinc-800/80 bg-zinc-950/60 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              {isRegister ? 'Stwórz konto' : 'Zaloguj się'}
            </Button>
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-300">
              <AlertCircle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          {isRegister ? 'Masz już konto?' : 'Nie masz konta?'}{' '}
          <Link
            href={
              isRegister
                ? safeRedirect
                  ? `/login?redirect=${encodeURIComponent(safeRedirect)}`
                  : '/login'
                : safeRedirect
                  ? `/login?mode=register&redirect=${encodeURIComponent(safeRedirect)}`
                  : '/login?mode=register'
            }
            className="font-medium text-amber-400 hover:text-amber-300 transition"
          >
            {isRegister ? 'Zaloguj się' : 'Załóż konto'}
          </Link>
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.807 1.305 3.492.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

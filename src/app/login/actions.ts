'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { translateAuthError } from '@/lib/auth-errors'

function safeRedirect(target: string | undefined | null): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return '/chat'
  if (target.startsWith('/login') || target.startsWith('/auth')) return '/chat'
  return target
}

function errorRedirect(
  error: string,
  opts: { mode?: 'register'; email?: string; redirect?: string } = {},
) {
  const params = new URLSearchParams({ error: translateAuthError(error) })
  if (opts.mode) params.set('mode', opts.mode)
  if (opts.email) params.set('email', opts.email)
  if (opts.redirect) params.set('redirect', opts.redirect)
  redirect(`/login?${params.toString()}`)
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = safeRedirect(String(formData.get('redirect') ?? ''))

  if (!email || !password) {
    errorRedirect('Podaj email i hasło', { email, redirect: redirectTo })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) errorRedirect(error.message, { email, redirect: redirectTo })
  redirect(redirectTo)
}

export async function signUpWithEmail(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = safeRedirect(String(formData.get('redirect') ?? ''))

  if (!email || !password) {
    errorRedirect('Podaj email i hasło', { mode: 'register', email, redirect: redirectTo })
  }
  if (password.length < 6) {
    errorRedirect('Hasło musi mieć minimum 6 znaków', {
      mode: 'register',
      email,
      redirect: redirectTo,
    })
  }

  const supabase = await createClient()
  const origin = (await headers()).get('origin') ?? ''
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  if (error) errorRedirect(error.message, { mode: 'register', email, redirect: redirectTo })

  // Supabase zwraca 200 OK przy duplikacie maila (security feature)
  // Wykrywamy to po pustej tablicy identities
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    errorRedirect('Ten email jest już zarejestrowany. Zaloguj się', {
      email,
      redirect: redirectTo,
    })
  }

  redirect(`/login/check-email?email=${encodeURIComponent(email)}`)
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const supabase = await createClient()
  const origin = (await headers()).get('origin') ?? ''
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  })
  if (error) errorRedirect(error.message)
  if (data.url) redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

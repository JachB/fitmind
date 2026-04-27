'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CoachPersona } from '@/lib/gemini/prompts'

const VALID_PERSONAS: CoachPersona[] = [
  'empathetic',
  'hardcore',
  'friend',
  'pro',
]

type FinishInput = {
  display_name: string
  body_weight_kg: number | null
  goal: string
  coach_persona: CoachPersona
}

export async function finishOnboarding(input: FinishInput) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const displayName = input.display_name.trim()
  if (displayName.length < 1 || displayName.length > 40) {
    return { error: 'Imię: 1-40 znaków' }
  }
  if (
    input.body_weight_kg !== null &&
    (input.body_weight_kg < 30 || input.body_weight_kg > 250)
  ) {
    return { error: 'Waga: 30-250 kg' }
  }
  if (!VALID_PERSONAS.includes(input.coach_persona)) {
    return { error: 'Nieznana persona' }
  }
  if ((input.goal ?? '').length > 500) {
    return { error: 'Cel: max 500 znaków' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      body_weight_kg: input.body_weight_kg,
      goal: input.goal.trim() || null,
      coach_persona: input.coach_persona,
      onboarded_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: 'Zapis nie wyszedł: ' + error.message }
  return { ok: true as const }
}

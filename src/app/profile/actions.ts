'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CoachPersona } from '@/lib/gemini/prompts'

type ActionResult = { error?: string; ok?: true }

const VALID_PERSONAS: CoachPersona[] = [
  'empathetic',
  'hardcore',
  'friend',
  'pro',
]

export async function updateProfile(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const displayName = String(formData.get('display_name') ?? '').trim()
  const bwRaw = String(formData.get('body_weight_kg') ?? '').trim()
  const goal = String(formData.get('goal') ?? '').trim()
  const personaRaw = String(formData.get('coach_persona') ?? '').trim()

  if (displayName.length < 1 || displayName.length > 40) {
    return { error: 'Imię: 1-40 znaków' }
  }
  if (goal.length > 500) {
    return { error: 'Cel: max 500 znaków' }
  }

  let bodyWeight: number | null = null
  if (bwRaw) {
    const n = Number(bwRaw.replace(',', '.'))
    if (!Number.isFinite(n) || n < 30 || n > 250) {
      return { error: 'Waga: 30-250 kg' }
    }
    bodyWeight = n
  }

  if (!VALID_PERSONAS.includes(personaRaw as CoachPersona)) {
    return { error: 'Nieznana persona trenera' }
  }
  const persona = personaRaw as CoachPersona

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      body_weight_kg: bodyWeight,
      goal: goal || null,
      coach_persona: persona,
    })
    .eq('id', user.id)

  if (error) return { error: 'Nie udało się zapisać: ' + error.message }

  revalidatePath('/profile')
  revalidatePath('/chat')
  return { ok: true }
}

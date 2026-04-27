import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=%2Fonboarding')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, body_weight_kg, goal, coach_persona, onboarded_at')
    .eq('id', user.id)
    .single()

  if (profile?.onboarded_at) redirect('/chat')

  const initialName =
    profile?.display_name?.trim() || user.email?.split('@')[0] || ''

  return <OnboardingWizard initialName={initialName} />
}

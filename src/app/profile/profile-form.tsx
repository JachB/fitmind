'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Check, User, Scale, Target as TargetIcon, Save } from 'lucide-react'
import { PERSONA_LABELS_PL, type CoachPersona } from '@/lib/gemini/prompts'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/cn'
import { updateProfile } from './actions'

type Props = {
  initial: {
    display_name: string
    body_weight_kg: number | null
    goal: string | null
    coach_persona: CoachPersona
  }
}

const PERSONA_ORDER: CoachPersona[] = [
  'empathetic',
  'hardcore',
  'friend',
  'pro',
]

export function ProfileForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState(updateProfile, {})

  useEffect(() => {
    if (state.ok) toast.success('Profil zapisany', { duration: 2500 })
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl p-5 sm:p-6">
        <h2 className="mb-1 text-sm font-semibold text-zinc-100">Dane osobowe</h2>
        <p className="mb-5 text-[11px] text-zinc-500">
          Używane do personalizacji rozmów i tonażu.
        </p>
        <div className="space-y-4">
          <Field
            label="Imię"
            hint="Jak Cię nazywa trener"
            icon={User}
          >
            <input
              name="display_name"
              defaultValue={initial.display_name}
              required
              minLength={1}
              maxLength={40}
              className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </Field>
          <Field
            label="Waga ciała"
            hint="Do liczenia tonażu kalisteniki"
            icon={Scale}
          >
            <div className="relative">
              <input
                name="body_weight_kg"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="30"
                max="250"
                defaultValue={initial.body_weight_kg ?? ''}
                placeholder="np. 78"
                className="w-full rounded-xl border border-zinc-800/80 bg-zinc-950/60 pl-4 pr-12 py-2.5 text-sm text-zinc-100 nums placeholder:text-zinc-600 transition focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                kg
              </span>
            </div>
          </Field>
          <Field
            label="Cel"
            hint="Krótko, jedno zdanie — trener to zapamięta"
            icon={TargetIcon}
          >
            <textarea
              name="goal"
              rows={2}
              maxLength={200}
              defaultValue={initial.goal ?? ''}
              placeholder="np. Pierwsze 100 kg w ławce do końca roku"
              className="w-full resize-none rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl p-5 sm:p-6">
        <h2 className="mb-1 text-sm font-semibold text-zinc-100">Trener</h2>
        <p className="mb-5 text-[11px] text-zinc-500">
          Wybór persony zmienia ton rozmowy. Możesz zmienić kiedy chcesz.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PERSONA_ORDER.map((p) => {
            const info = PERSONA_LABELS_PL[p]
            return (
              <label
                key={p}
                className={cn(
                  'group relative flex cursor-pointer flex-col rounded-xl border p-4 transition',
                  'border-zinc-800/60 bg-zinc-950/40',
                  'hover:border-zinc-700/80',
                  'has-[:checked]:border-amber-500/50 has-[:checked]:bg-gradient-to-br has-[:checked]:from-amber-500/10 has-[:checked]:via-orange-500/5 has-[:checked]:to-transparent',
                )}
              >
                <input
                  type="radio"
                  name="coach_persona"
                  value={p}
                  defaultChecked={initial.coach_persona === p}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="absolute top-3 right-3 h-4 w-4 rounded-full border-2 border-zinc-700 transition group-has-[:checked]:border-amber-500 group-has-[:checked]:bg-amber-500 flex items-center justify-center">
                  <Check
                    size={10}
                    strokeWidth={3}
                    className="text-white opacity-0 transition group-has-[:checked]:opacity-100"
                  />
                </div>
                <div className="pr-6">
                  <div className="text-sm font-semibold text-zinc-100">
                    {info.title}
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {info.tagline}
                  </p>
                </div>
                <p className="mt-3 text-[12px] text-zinc-400 leading-snug">
                  &ldquo;{info.preview}&rdquo;
                </p>
              </label>
            )
          })}
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          size="lg"
          loading={pending}
          leftIcon={!pending && <Save size={16} strokeWidth={2} />}
        >
          {pending ? 'Zapisuję...' : 'Zapisz zmiany'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string
  hint?: string
  icon?: typeof User
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
          {Icon && <Icon size={12} strokeWidth={1.75} />}
          {label}
        </span>
        {hint && <span className="text-[10px] text-zinc-600">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

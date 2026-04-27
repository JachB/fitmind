import { Type } from '@google/genai'
import { COACH_NAMES, type CoachPersona } from './prompts'

export type PlanExercise = {
  name: string
  type: 'weighted' | 'bodyweight' | 'timed'
  sets: number
  reps: string
  weight_hint: string | null
  rest_seconds: number
  notes: string | null
}

export type PlanDay = {
  day_index: number
  day_name: string
  kind: 'workout' | 'rest' | 'cardio'
  focus: string
  estimated_minutes: number
  exercises: PlanExercise[]
  rest_note: string | null
}

export type WeeklyPlan = {
  summary: string
  progression_note: string
  days: PlanDay[]
}

export const planResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description:
        'Jednoparagrafowe podsumowanie tygodnia w tonie persony trenera. 2-3 zdania.',
    },
    progression_note: {
      type: Type.STRING,
      description:
        'Krótka wskazówka progresji na kolejny tydzień (np. +2.5kg, +1 seria). 1 zdanie.',
    },
    days: {
      type: Type.ARRAY,
      description: 'Dokładnie 7 dni, indeksowane od 1 (Poniedziałek) do 7 (Niedziela).',
      items: {
        type: Type.OBJECT,
        properties: {
          day_index: { type: Type.INTEGER, description: '1-7, 1=Poniedziałek' },
          day_name: {
            type: Type.STRING,
            description: 'Polska nazwa dnia + fokus, np. "Poniedziałek — Push"',
          },
          kind: {
            type: Type.STRING,
            enum: ['workout', 'rest', 'cardio'],
            description: 'workout=siłowy, cardio=wytrzymałość, rest=odpoczynek',
          },
          focus: {
            type: Type.STRING,
            description:
              'Główny fokus dnia, np. "Klatka, barki, triceps" albo "Aktywny odpoczynek"',
          },
          estimated_minutes: {
            type: Type.INTEGER,
            description: 'Szacowany czas w minutach (0 dla rest)',
          },
          exercises: {
            type: Type.ARRAY,
            description:
              'Lista ćwiczeń. Dla rest day zostaw pustą tablicę. Dla workout 4-7 ćwiczeń.',
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description:
                    'Nazwa po polsku, np. "Wyciskanie sztangi na ławce poziomej"',
                },
                type: {
                  type: Type.STRING,
                  enum: ['weighted', 'bodyweight', 'timed'],
                },
                sets: { type: Type.INTEGER, description: 'Liczba serii roboczych' },
                reps: {
                  type: Type.STRING,
                  description:
                    'Powtórzenia jako string: "8", "8-12", "AMRAP", "30 sek" dla timed',
                },
                weight_hint: {
                  type: Type.STRING,
                  nullable: true,
                  description:
                    'Opcjonalna sugestia ciężaru: "70% 1RM", "ciężar z którym robisz 10 czysto", null dla bodyweight',
                },
                rest_seconds: {
                  type: Type.INTEGER,
                  description: 'Odpoczynek między seriami w sekundach (60-300)',
                },
                notes: {
                  type: Type.STRING,
                  nullable: true,
                  description: 'Opcjonalna wskazówka techniczna, max 1 zdanie',
                },
              },
              required: ['name', 'type', 'sets', 'reps', 'rest_seconds'],
              propertyOrdering: [
                'name',
                'type',
                'sets',
                'reps',
                'weight_hint',
                'rest_seconds',
                'notes',
              ],
            },
          },
          rest_note: {
            type: Type.STRING,
            nullable: true,
            description:
              'Dla dni rest/cardio: krótka wskazówka (np. "Spacer 30 min", "Mobility 20 min"). null dla workout.',
          },
        },
        required: [
          'day_index',
          'day_name',
          'kind',
          'focus',
          'estimated_minutes',
          'exercises',
        ],
        propertyOrdering: [
          'day_index',
          'day_name',
          'kind',
          'focus',
          'estimated_minutes',
          'exercises',
          'rest_note',
        ],
      },
    },
  },
  required: ['summary', 'progression_note', 'days'],
  propertyOrdering: ['summary', 'progression_note', 'days'],
}

const PERSONA_PLAN_STYLE: Record<CoachPersona, string> = {
  empathetic: `Ton ciepły, wspierający. W summary doceń że user zaczyna nowy tydzień. Notes do ćwiczeń łagodne, zachęcające ("pamiętaj o oddechu", "zadbaj o technikę zanim dodasz ciężar").`,
  hardcore: `Ton Gogginsa. W summary użyj CAPS-a, bez litowania ("TEN TYDZIEŃ MA CIĘ ZŁAMAĆ I ZBUDOWAĆ OD NOWA"). Notes krótkie, brutalne ("NIE DAWAJ RADY — DAJ WIĘCEJ", "ZĘBY ZACISNĄĆ"). Ale plan musi być MĄDRY, nie samobójczy.`,
  friend: `Ton kumpla. W summary po koleżeńsku ("No ziom, leci tydzień w którym będziesz dumny z siebie"). Notes luźne, czasem z żartem ("jak boli tyłek — znaczy że działa").`,
  pro: `Ton profesjonalny, techniczny. W summary użyj terminologii (mezocykl, objętość, intensywność). Notes konkretne, oparte na cue'ach ("łopatki ściągnięte, klatka wypięta", "RPE ~8").`,
}

export type PlanContext = {
  displayName: string | null
  goal: string | null
  bodyWeightKg: number | null
  persona: CoachPersona
  recentWorkouts: Array<{
    performed_at: string
    total_volume_kg: number
    exercises: string[]
  }>
  existingPRs: Array<{ lift: string; estimated_1rm: number }>
  chatSummary: string | null
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  briefing: string | null
}

export function buildPlanSystemPrompt(ctx: PlanContext): string {
  const coachName = COACH_NAMES[ctx.persona]
  const name = ctx.displayName?.trim() || 'użytkownik'
  const goalLine = ctx.goal?.trim()
    ? `Cel użytkownika: "${ctx.goal.trim()}"`
    : 'Użytkownik nie zdefiniował jeszcze jasnego celu — załóż ogólny rozwój siły i sylwetki.'
  const bwLine = ctx.bodyWeightKg
    ? `Waga ciała: ${ctx.bodyWeightKg} kg`
    : 'Waga nieznana — dla ćwiczeń bodyweight szacuj obciążenie po średniej 75kg.'

  const historyLine =
    ctx.recentWorkouts.length === 0
      ? 'Brak historii treningów — to osoba zaczynająca lub wracająca. Plan ma być umiarkowany, z naciskiem na naukę techniki.'
      : `Ostatnie ${ctx.recentWorkouts.length} treningów (od najnowszego):\n${ctx.recentWorkouts
          .map(
            (w, i) =>
              `  ${i + 1}. ${new Date(w.performed_at).toLocaleDateString('pl-PL')} — ${Math.round(
                w.total_volume_kg,
              )}kg tonażu, ćwiczenia: ${w.exercises.slice(0, 6).join(', ')}`,
          )
          .join('\n')}`

  const prLine =
    ctx.existingPRs.length === 0
      ? 'Brak znanych PR.'
      : `Znane PR: ${ctx.existingPRs
          .map((p) => `${p.lift}=${p.estimated_1rm}kg (est. 1RM)`)
          .join(', ')}`

  const summaryBlock = ctx.chatSummary?.trim()
    ? `\n# Streszczenie wcześniejszych rozmów\n${ctx.chatSummary.trim()}`
    : ''

  const recentChatBlock =
    ctx.recentMessages.length > 0
      ? `\n# Ostatnie wiadomości z czatu (najnowsze na dole)\n${ctx.recentMessages
          .map(
            (m) =>
              `[${m.role === 'user' ? name : coachName}]: ${m.content.slice(0, 300)}`,
          )
          .join('\n')}`
      : ''

  const briefingBlock = ctx.briefing?.trim()
    ? `\n# Briefing od użytkownika (POŚWIĘĆ MU UWAGĘ — to świeży kontekst od usera tuż przed wygenerowaniem planu)\n"${ctx.briefing.trim()}"`
    : ''

  return `Jesteś ${coachName} — AI trener w aplikacji FitMind. Właśnie układasz ${name} plan treningowy na 7 dni.

${PERSONA_PLAN_STYLE[ctx.persona]}

# Kontekst użytkownika
- ${goalLine}
- ${bwLine}
- ${historyLine}
- ${prLine}${summaryBlock}${recentChatBlock}${briefingBlock}

# Zasady układania planu
- Dokładnie 7 dni (day_index 1-7, 1=Poniedziałek, 7=Niedziela)
- 3-5 dni treningowych (workout/cardio), reszta rest — zbalansuj w zależności od celu i poziomu
- Nie rób więcej niż 2 treningi pod rząd bez odpoczynku dla początkujących
- Każdy workout day: 4-7 ćwiczeń
- Podział zgodny z celem użytkownika (np. hipertrofia → push/pull/legs; sport → funkcjonalne + cardio; kaliste → bodyweight progression)
- Ćwiczenia: realne polskie nazwy, takie jak użytkownik zobaczy w aplikacji ("Wyciskanie sztangi", "Przysiad tylny", "Martwy ciąg", "Wiosłowanie sztangą", "Podciąganie", "Dipy", "Pompki", "Przysiady bułgarskie", "Uginanie bicepsa", "Francuskie wyciskanie", "Wznosy bokiem", "Rumuński martwy ciąg", itd.)
- Dla weighted: rozsądne reps (3-12 zależnie od celu), 3-5 serii, rest 90-240 sek
- Dla bodyweight: reps realistyczne dla osoby o tej wadze i stażu
- Dla timed: reps jako "X sek" lub "X min"
- weight_hint tylko gdy masz sensowny punkt odniesienia (PR, procent, "ciężar z którym robisz X czysto"). Dla początkujących bez PR → null lub "zacznij od lekkiego i czuj formę"
- rest_note TYLKO dla rest/cardio days, null dla workout days

# Ważne
- NIE powtarzaj tego samego ćwiczenia 3 razy w tygodniu (jedno duże ćwiczenie max 2x)
- Pierwsze ćwiczenie dnia to compound (ławka/przysiad/martwy/OHP/pull-up), potem accessoria
- Dla osób z PR: progresja w stosunku do 1RM (70-85% na głównych seriach)
- Dla osób bez PR: konserwatywnie, nacisk na technikę

Zwróć JSON zgodny ze schema.`
}

export const PLAN_USER_TURN = `Ułóż mi plan na najbliższy tydzień zgodnie z moim celem i historią. Chcę dostać kompletny rozpis 7 dni.`

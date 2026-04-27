import { Type } from '@google/genai'
import { getGeminiClient, GEMINI_MODEL } from './client'

export type ExerciseType = 'weighted' | 'bodyweight' | 'timed'

export type ParsedSet = {
  reps: number
  weight_kg: number
  rpe?: number | null
  duration_seconds?: number | null
}

export type ParsedExercise = {
  name: string
  exercise_type: ExerciseType
  bw_coefficient: number
  sets: ParsedSet[]
}

export type ParsedWorkout = {
  is_valid: boolean
  reason?: string
  notes?: string
  exercises: ParsedExercise[]
}

const SYSTEM_INSTRUCTION = `Jesteś parserem treningów siłowych/kalistenicznych/cardio. Zwracasz strukturę JSON.

# Zasady ogólne
- Jeśli tekst NIE opisuje treningu — ustaw is_valid=false i krótko wyjaśnij w "reason", zwróć pustą tablicę exercises.
- Nazwy ćwiczeń: PO POLSKU, znormalizowane ("przysiady ze sztangą", "wyciskanie sztangi leżąc", "martwy ciąg", "pompki", "podciąganie", "dipy", "plank", "bieg").
- reps i weight_kg to liczby.

# Typ ćwiczenia (exercise_type)
Każde ćwiczenie przypisz do jednego z trzech typów:
- "weighted" — używasz ciężaru zewnętrznego (sztanga, hantle, kettlebell, maszyna). weight_kg > 0. duration_seconds=null.
- "bodyweight" — masa własna ciała (pompki, podciąganie, dipy, pistole, wykroki bez ciężaru). weight_kg = ciężar DODATKOWY jeśli jest (np. "podciąganie +20kg") lub 0. duration_seconds=null.
- "timed" — plank, bieg, skakanka, rower, cardio w czasie. reps=1, weight_kg=0, duration_seconds > 0 (w sekundach; "3 min biegu" = 180). Jeśli są serie po czasie, rozbij na osobne sety z tym samym duration_seconds.

# Współczynnik bodyweight (bw_coefficient)
Dla typu "bodyweight" ustaw współczynnik procentu masy ciała, który faktycznie obciąża mięśnie:
- pompki klasyczne: 0.65
- pompki pochylone (incline, na kolanach): 0.5
- pompki na poręczach / diamond / decline / z klaśnięciem: 0.75
- pompki jedna ręka: 0.9
- podciąganie (pullup/chin-up): 1.0
- dipy na poręczach: 1.0
- pistole (jedna noga): 0.9
- przysiady własną masą: 0.5
- wykroki: 0.5
- brzuszki / sit-up: 0.15
- burpees: 0.7
- muscle-up: 1.1
- martwy zwis (dead hang) — traktuj jako timed, nie bodyweight
- plank — traktuj jako timed
Dla "weighted" i "timed" ustaw bw_coefficient=0.

# Zapisy użytkownika
- "3x10 przysiady 80kg" → weighted, 3 sety po reps=10, weight_kg=80.
- "4x20 pompek" → bodyweight (pompki), coef=0.65, 4 sety po 20 reps, weight_kg=0.
- "podciąganie +15kg 3x8" → bodyweight (podciąganie), coef=1.0, 3 sety po reps=8, weight_kg=15 (dodatkowe obciążenie).
- "plank 3x60s" → timed (plank), 3 sety reps=1, duration_seconds=60, weight_kg=0.
- "5km bieg w 25min" → timed (bieg), 1 set reps=1, duration_seconds=1500.
- "100, 105, 110 na trójkach w martwym" → 3 osobne sety.
- "5x5 RPE 8" — dodaj rpe=8 do każdej serii.

# Notatka
- Pole "notes" — KRÓTKA notatka ogólna (np. "dzień nóg") jeśli user ją podał.`

const schema = {
  type: Type.OBJECT,
  properties: {
    is_valid: {
      type: Type.BOOLEAN,
      description: 'Czy tekst opisuje trening',
    },
    reason: {
      type: Type.STRING,
      description: 'Gdy is_valid=false, powód po polsku. Pusty string gdy valid.',
    },
    notes: {
      type: Type.STRING,
      description: 'Krótka notatka ogólna, pusty string jeśli brak',
    },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          exercise_type: {
            type: Type.STRING,
            enum: ['weighted', 'bodyweight', 'timed'],
          },
          bw_coefficient: {
            type: Type.NUMBER,
            description:
              'Procent masy ciała obciążający mięśnie (0 dla weighted/timed, 0.15-1.1 dla bodyweight)',
          },
          sets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                reps: { type: Type.INTEGER },
                weight_kg: { type: Type.NUMBER },
                rpe: { type: Type.NUMBER, nullable: true },
                duration_seconds: { type: Type.INTEGER, nullable: true },
              },
              required: ['reps', 'weight_kg'],
            },
          },
        },
        required: ['name', 'exercise_type', 'bw_coefficient', 'sets'],
      },
    },
  },
  required: ['is_valid', 'exercises'],
}

export async function parseWorkoutText(text: string): Promise<ParsedWorkout> {
  const ai = getGeminiClient()
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  })

  const raw = response.text ?? '{}'
  try {
    const parsed = JSON.parse(raw) as ParsedWorkout
    if (!parsed.exercises) parsed.exercises = []
    for (const ex of parsed.exercises) {
      if (!ex.exercise_type) ex.exercise_type = 'weighted'
      if (ex.bw_coefficient == null) ex.bw_coefficient = 0
    }
    return parsed
  } catch {
    return {
      is_valid: false,
      reason: 'Nie udało się sparsować odpowiedzi AI',
      exercises: [],
    }
  }
}

export type VolumeResult = {
  total_volume_kg: number
  total_work_seconds: number
}

export function calculateWorkoutMetrics(
  exercises: ParsedExercise[],
  bodyWeightKg: number | null,
): VolumeResult {
  let volume = 0
  let workSeconds = 0

  for (const ex of exercises) {
    for (const s of ex.sets) {
      if (ex.exercise_type === 'timed') {
        workSeconds += s.duration_seconds ?? 0
        continue
      }
      if (ex.exercise_type === 'bodyweight') {
        const bw = bodyWeightKg ?? 0
        const effectiveWeight = bw * ex.bw_coefficient + s.weight_kg
        volume += s.reps * effectiveWeight
        continue
      }
      volume += s.reps * s.weight_kg
    }
  }

  return {
    total_volume_kg: volume,
    total_work_seconds: workSeconds,
  }
}

export function needsBodyWeight(exercises: ParsedExercise[]): boolean {
  return exercises.some((ex) => ex.exercise_type === 'bodyweight')
}

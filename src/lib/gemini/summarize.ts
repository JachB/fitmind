import { getGeminiClient, GEMINI_MODEL } from './client'
import { SUMMARY_PROMPT } from './prompts'
import type { ChatTurn } from './memory'

export async function summarizeConversation(
  previousSummary: string | null,
  turns: ChatTurn[],
): Promise<string> {
  const ai = getGeminiClient()

  const history = turns
    .map((t) => `${t.role === 'user' ? 'User' : 'Max'}: ${t.text}`)
    .join('\n\n')

  const prompt = previousSummary
    ? `Poprzednie streszczenie:\n${previousSummary}\n\nNowa rozmowa do dodania:\n${history}\n\nZaktualizuj streszczenie zachowując najważniejsze fakty, łącząc nowe informacje z wcześniejszymi.`
    : `Rozmowa:\n${history}`

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SUMMARY_PROMPT,
      temperature: 0.3,
    },
  })

  return response.text ?? ''
}

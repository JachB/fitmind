import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type ChatTurn = { role: 'user' | 'model'; text: string }

const RECENT_WINDOW = 12
export const SUMMARIZE_THRESHOLD = 24

export async function loadContext(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ summary: string | null; recent: ChatTurn[] }> {
  const [summaryRes, messagesRes] = await Promise.all([
    supabase
      .from('conversation_summaries')
      .select('summary, up_to_message_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(RECENT_WINDOW),
  ])

  const summary = summaryRes.data?.summary ?? null
  const recent: ChatTurn[] = (messagesRes.data ?? [])
    .reverse()
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.content,
    }))

  return { summary, recent }
}

export function buildContents(
  summary: string | null,
  recent: ChatTurn[],
  userMessage: string,
): { role: 'user' | 'model'; parts: { text: string }[] }[] {
  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = []

  if (summary) {
    contents.push({
      role: 'user',
      parts: [
        {
          text: `[STRESZCZENIE WCZEŚNIEJSZEJ ROZMOWY — użyj do zachowania ciągłości]\n${summary}`,
        },
      ],
    })
    contents.push({
      role: 'model',
      parts: [{ text: 'Zapamiętałem. Kontynuujemy.' }],
    })
  }

  for (const turn of recent) {
    contents.push({ role: turn.role, parts: [{ text: turn.text }] })
  }

  contents.push({ role: 'user', parts: [{ text: userMessage }] })
  return contents
}

export async function countMessagesSinceSummary(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const { data: latestSummary } = await supabase
    .from('conversation_summaries')
    .select('up_to_message_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const query = supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('role', ['user', 'assistant'])

  if (latestSummary?.created_at) {
    query.gt('created_at', latestSummary.created_at)
  }

  const { count } = await query
  return count ?? 0
}

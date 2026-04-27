'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dumbbell, SendHorizonal, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/components/ui/cn'
import { WorkoutModal } from './workout-modal'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type Props = {
  initialMessages: Message[]
  coachName: string
  userName: string
}

export function ChatUi({ initialMessages, coachName, userName }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workoutOpen, setWorkoutOpen] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  async function sendMessage(text: string) {
    setError(null)
    const userMsg: Message = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: text,
    }
    const assistantMsg: Message = {
      id: `tmp-a-${Date.now()}`,
      role: 'assistant',
      content: '',
    }
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: last.content + chunk }
          }
          return copy
        })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Nie udało się pobrać odpowiedzi'
      setError(message)
      setMessages((prev) => prev.slice(0, -2))
    } finally {
      setStreaming(false)
      startTransition(() => router.refresh())
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    void sendMessage(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const showEmpty = messages.length === 0

  return (
    <section className="flex flex-col rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl overflow-hidden min-h-[calc(100vh-180px)] lg:min-h-[calc(100vh-140px)]">
      <header className="flex items-center justify-between border-b border-zinc-800/50 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={coachName} size="sm" ring />
          <div className="min-w-0">
            <div className="text-sm font-medium text-zinc-100 truncate">
              {coachName}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                Online
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setWorkoutOpen(true)}
          className="group flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:border-amber-500/60 hover:bg-amber-500/15 active:scale-[0.98]"
        >
          <Dumbbell size={14} strokeWidth={2} className="transition-transform group-hover:rotate-12" />
          <span className="hidden sm:inline">Zaloguj trening</span>
          <span className="sm:hidden">Trening</span>
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-5 sm:px-5"
      >
        {showEmpty ? (
          <EmptyState
            coachName={coachName}
            userName={userName}
            onPromptClick={(p) => {
              setInput(p)
              textareaRef.current?.focus()
            }}
          />
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                coachName={coachName}
                userName={userName}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mx-3 mb-3 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-300 sm:mx-5">
          <AlertCircle size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-800/50 bg-zinc-950/40 p-3 sm:p-4"
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Napisz do ${coachName}...`}
              rows={1}
              disabled={streaming}
              className="min-h-[44px] max-h-40 w-full resize-none rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className={cn(
              'h-11 w-11 shrink-0 flex items-center justify-center rounded-xl transition active:scale-[0.96]',
              'bg-gradient-to-b from-amber-500 to-orange-600 text-white shadow-[0_8px_20px_-8px_rgba(249,115,22,0.7)]',
              'hover:from-amber-400 hover:to-orange-500',
              'disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:shadow-none disabled:cursor-not-allowed',
            )}
            aria-label="Wyślij"
          >
            {streaming ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <SendHorizonal size={18} strokeWidth={2} />
            )}
          </button>
        </div>
        <p className="mt-2 hidden sm:block text-[10px] text-zinc-600">
          <kbd className="font-sans">Enter</kbd> aby wysłać ·{' '}
          <kbd className="font-sans">Shift + Enter</kbd> nowa linia
        </p>
      </form>

      <WorkoutModal
        open={workoutOpen}
        onClose={() => {
          setWorkoutOpen(false)
          startTransition(() => router.refresh())
        }}
      />
    </section>
  )
}

function MessageBubble({
  message,
  coachName,
  userName,
}: {
  message: Message
  coachName: string
  userName: string
}) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar
        name={isUser ? userName : coachName}
        size="xs"
        className="mt-0.5 shrink-0"
      />
      <div className={cn('max-w-[82%] min-w-0', isUser && 'items-end')}>
        {!isUser && (
          <div className="mb-1 text-[11px] font-medium text-amber-400/90">
            {coachName}
          </div>
        )}
        <div
          className={cn(
            'px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-2xl rounded-tr-sm bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_4px_16px_-4px_rgba(249,115,22,0.4)]'
              : 'rounded-2xl rounded-tl-sm border border-zinc-800/60 bg-zinc-900/60 text-zinc-100',
          )}
        >
          {message.content ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <TypingDots />
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  coachName,
  userName,
  onPromptClick,
}: {
  coachName: string
  userName: string
  onPromptClick: (prompt: string) => void
}) {
  const prompts = [
    'Ułóż mi plan treningowy na 3 dni w tygodniu',
    'Jak zacząć z kalisteniką?',
    'Boli mnie kolano po bieganiu, co robić?',
    'Chcę schudnąć 5 kg, od czego zacząć?',
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center text-center py-8">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 blur-2xl opacity-40" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_8px_24px_-8px_rgba(249,115,22,0.6)]">
          <Sparkles size={22} className="text-white" strokeWidth={2} />
        </div>
      </div>
      <h2 className="mb-2 font-bold text-3xl tracking-tight text-zinc-50">
        Cześć {userName}
      </h2>
      <p className="mb-8 max-w-sm text-sm text-zinc-400 leading-relaxed">
        Jestem <span className="text-amber-400 font-medium">{coachName}</span>, Twój AI trener.
        Powiedz co dziś robimy — trening, plan, pytanie o formę?
      </p>
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
        Spróbuj na przykład
      </p>
      <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {prompts.map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => onPromptClick(p)}
            className="group rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-3.5 py-2.5 text-left text-xs text-zinc-300 transition hover:border-amber-500/40 hover:bg-zinc-900/80 hover:text-zinc-100"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
    </span>
  )
}

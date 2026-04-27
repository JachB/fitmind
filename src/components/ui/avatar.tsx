import { cn } from './cn'

type Props = {
  name: string | null | undefined
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
  className?: string
}

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-2xl',
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function hashColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const palettes = [
    'from-amber-500/30 to-orange-600/40',
    'from-rose-500/30 to-red-600/40',
    'from-emerald-500/30 to-teal-600/40',
    'from-sky-500/30 to-indigo-600/40',
    'from-violet-500/30 to-purple-600/40',
    'from-fuchsia-500/30 to-pink-600/40',
  ]
  return palettes[Math.abs(h) % palettes.length]
}

export function Avatar({ name, src, size = 'md', ring, className }: Props) {
  const initials = getInitials(name)
  const gradient = hashColor(name ?? 'u')

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold uppercase tracking-wide text-zinc-50',
        ring && 'ring-2 ring-amber-500/60 ring-offset-2 ring-offset-zinc-950',
        sizeClasses[size],
        !src && `bg-gradient-to-br ${gradient}`,
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ''} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
import { cn } from './cn'

type Props = {
  label: string
  value: string | number
  unit?: string
  icon?: LucideIcon
  accent?: 'amber' | 'emerald' | 'sky' | 'rose' | 'zinc'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const accentClasses: Record<NonNullable<Props['accent']>, string> = {
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
  sky: 'text-sky-400',
  rose: 'text-rose-400',
  zinc: 'text-zinc-400',
}

const sizeClasses = {
  sm: { value: 'text-xl', label: 'text-[10px]' },
  md: { value: 'text-2xl', label: 'text-[11px]' },
  lg: { value: 'text-4xl', label: 'text-xs' },
}

export function Stat({
  label,
  value,
  unit,
  icon: Icon,
  accent = 'zinc',
  size = 'md',
  className,
}: Props) {
  const s = sizeClasses[size]
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-4 backdrop-blur-xl transition hover:border-zinc-700/50',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'uppercase tracking-wider text-zinc-500',
            s.label,
          )}
        >
          {label}
        </span>
        {Icon && (
          <Icon
            size={14}
            strokeWidth={1.75}
            className={accentClasses[accent]}
          />
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={cn(
            'nums font-semibold text-zinc-50 tracking-tight',
            s.value,
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-zinc-500">{unit}</span>
        )}
      </div>
    </div>
  )
}

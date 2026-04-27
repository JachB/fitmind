import type { HTMLAttributes } from 'react'
import { cn } from './cn'

type SurfaceVariant = 'default' | 'elevated' | 'glow' | 'glass'
type SurfacePadding = 'none' | 'sm' | 'md' | 'lg'

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: SurfaceVariant
  padding?: SurfacePadding
}

const variantClasses: Record<SurfaceVariant, string> = {
  default:
    'border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl',
  elevated:
    'border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]',
  glow:
    'border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.06] via-zinc-900/60 to-zinc-900/40 backdrop-blur-xl shadow-[0_0_40px_-12px_rgba(245,158,11,0.35)]',
  glass:
    'border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl',
}

const paddingClasses: Record<SurfacePadding, string> = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-7',
}

export function Surface({
  variant = 'default',
  padding = 'md',
  className,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        variantClasses[variant],
        paddingClasses[padding],
        className,
      )}
      {...rest}
    />
  )
}

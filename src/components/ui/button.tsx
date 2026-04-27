import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
type Size = 'sm' | 'md' | 'lg' | 'icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 relative'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-amber-500 to-orange-600 text-white shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_8px_24px_-8px_rgba(249,115,22,0.6)] hover:from-amber-400 hover:to-orange-500 hover:shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_12px_32px_-8px_rgba(249,115,22,0.7)]',
  secondary:
    'bg-zinc-800/80 text-zinc-100 border border-zinc-700/50 hover:bg-zinc-700/80 hover:border-zinc-600/50',
  ghost:
    'text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100',
  outline:
    'border border-zinc-700/60 bg-zinc-900/40 text-zinc-300 backdrop-blur-xl hover:border-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-100',
  destructive:
    'bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-[0_8px_24px_-8px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-red-500',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-sm',
  icon: 'h-10 w-10',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
})

'use client'

import { useRef, type ReactNode } from 'react'
import { cn } from './cn'

type Props = {
  children: ReactNode
  className?: string
  strength?: number
}

export function Magnetic({ children, className, strength = 0.25 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left - r.width / 2
    const y = e.clientY - r.top - r.height / 2
    el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = `translate3d(0, 0, 0)`
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn('inline-block transition-transform duration-300 ease-out will-change-transform', className)}
    >
      {children}
    </div>
  )
}

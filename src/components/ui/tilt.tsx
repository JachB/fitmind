'use client'

import { useRef, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from './cn'

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  max?: number
}

export function Tilt({ children, className, max = 8, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    const ry = (x - 0.5) * 2 * max
    const rx = (0.5 - y) * 2 * max
    el.style.setProperty('--rx', `${rx}deg`)
    el.style.setProperty('--ry', `${ry}deg`)
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', `0deg`)
    el.style.setProperty('--ry', `0deg`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn('tilt', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

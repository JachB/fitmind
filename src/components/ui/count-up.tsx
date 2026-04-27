'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  to: number
  duration?: number
  suffix?: string
  prefix?: string
  format?: (n: number) => string
  className?: string
}

export function CountUp({ to, duration = 1600, suffix = '', prefix = '', format, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(() =>
    typeof IntersectionObserver === 'undefined' ? to : 0,
  )
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started.current) {
            started.current = true
            const start = performance.now()
            const tick = (now: number) => {
              const p = Math.min(1, (now - start) / duration)
              const eased = 1 - Math.pow(1 - p, 3)
              setValue(Math.round(to * eased))
              if (p < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  const shown = format ? format(value) : value.toLocaleString('pl-PL')
  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown}
      {suffix}
    </span>
  )
}

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
  // Same initial value on server + client to avoid hydration mismatch.
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate SSR fallback
      setValue(to)
      return
    }
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

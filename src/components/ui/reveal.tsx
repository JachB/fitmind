'use client'

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode, type ElementType } from 'react'
import { cn } from './cn'

type Variant = 'up' | 'left' | 'right' | 'scale'

type Props = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  children: ReactNode
  variant?: Variant
  delay?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
  as?: 'div' | 'section' | 'header' | 'li' | 'span'
  amount?: number
}

const VARIANT_CLASS: Record<Variant, string> = {
  up: 'reveal',
  left: 'reveal reveal-left',
  right: 'reveal reveal-right',
  scale: 'reveal reveal-scale',
}

export function Reveal({
  children,
  className,
  variant = 'up',
  delay = 0,
  amount = 0.12,
  as: Tag = 'div',
  ...rest
}: Props) {
  const ref = useRef<HTMLElement>(null)
  // Always start as not-visible. Browsers without IntersectionObserver are
  // handled in the effect. Same initial state on server + client = no hydration
  // mismatch.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate SSR fallback
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true)
            io.disconnect()
            break
          }
        }
      },
      { threshold: amount, rootMargin: '0px 0px -5% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [amount])

  const delayClass = delay > 0 ? `d-${delay}` : ''
  const classes = cn(
    VARIANT_CLASS[variant],
    delayClass,
    visible && 'is-visible',
    className,
  )

  const Component = Tag as ElementType
  return (
    <Component ref={ref} className={classes} {...rest}>
      {children}
    </Component>
  )
}

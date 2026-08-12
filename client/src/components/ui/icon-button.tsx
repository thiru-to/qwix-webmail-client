import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  pressed?: boolean
  children: ReactNode
}

export function IconButton({ label, pressed, className, children, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={pressed}
      className={cn('ui-icon-button', pressed && 'is-pressed', className)}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

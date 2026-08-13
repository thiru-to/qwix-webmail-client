import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'icon' | 'sm'
}

export function Button({ className, variant = 'default', size = 'default', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      // HTML defaults a button to submit, which made every unlabelled Button inside a form submit
      // it — the discard X in the composer sent the message it was meant to throw away. Submitting
      // is now something a button has to ask for.
      type={type}
      className={cn('ui-button', `ui-button-${variant}`, `ui-button-${size}`, className)}
      {...props}
    />
  )
}

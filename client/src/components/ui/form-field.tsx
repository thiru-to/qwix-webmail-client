import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type FormFieldProps = {
  label: string
  htmlFor: string
  error?: string | null
  children: ReactNode
  className?: string
}

export function FormField({ label, htmlFor, error, children, className }: FormFieldProps) {
  return (
    <label className={cn('ui-form-field', className)} htmlFor={htmlFor}>
      <span className="ui-form-label">{label}</span>
      {children}
      {error ? <span className="ui-form-error">{error}</span> : null}
    </label>
  )
}

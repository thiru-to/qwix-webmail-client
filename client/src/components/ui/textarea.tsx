import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('ui-textarea', className)} {...props} />
}

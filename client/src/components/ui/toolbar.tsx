import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('ui-toolbar', className)}>{children}</div>
}

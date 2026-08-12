import { cn } from '../../lib/utils'

type AvatarProps = {
  initials: string
  tone?: string
  size?: 'default' | 'large'
  className?: string
}

export function Avatar({ initials, tone = 'rose', size = 'default', className }: AvatarProps) {
  return (
    <div className={cn('sender-avatar', tone, size === 'large' && 'large', className)} aria-hidden="true">
      {initials}
    </div>
  )
}

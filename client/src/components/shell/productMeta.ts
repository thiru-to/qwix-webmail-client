import { CalendarDays, Mail as MailIcon, UsersRound } from 'lucide-react'
import type { ProductView } from '../../stores/shellStore'

export const productViews = [
  { id: 'mail' as const, label: 'Inbox', icon: MailIcon },
  { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  { id: 'contacts' as const, label: 'Contacts', icon: UsersRound },
]

export function getProductMeta(view: ProductView) {
  return productViews.find((item) => item.id === view) ?? productViews[0]
}

import { CalendarDays, Mail as MailIcon, Settings as SettingsIcon, UsersRound } from 'lucide-react'
import type { ProductView } from '../../stores/shellStore'

export const productViews = [
  { id: 'mail' as const, label: 'Inbox', icon: MailIcon },
  { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  { id: 'contacts' as const, label: 'Contacts', icon: UsersRound },
  { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
]

export function getProductMeta(view: ProductView) {
  return productViews.find((item) => item.id === view) ?? productViews[0]
}

/** Gmail's bindings, so muscle memory carries over. `g i` style chords are written "g i". */
export type ShortcutId =
  | 'compose'
  | 'search'
  | 'next'
  | 'previous'
  | 'open'
  | 'back'
  | 'reply'
  | 'replyAll'
  | 'forward'
  | 'archive'
  | 'trash'
  | 'spam'
  | 'star'
  | 'markRead'
  | 'markUnread'
  | 'goInbox'
  | 'help'

export type Shortcut = { id: ShortcutId; keys: string; description: string }

export const SHORTCUTS: Shortcut[] = [
  { id: 'compose', keys: 'c', description: 'Compose' },
  { id: 'search', keys: '/', description: 'Search mail' },
  { id: 'next', keys: 'j', description: 'Next message' },
  { id: 'previous', keys: 'k', description: 'Previous message' },
  { id: 'open', keys: 'o', description: 'Open message' },
  { id: 'back', keys: 'u', description: 'Back to list' },
  { id: 'reply', keys: 'r', description: 'Reply' },
  { id: 'replyAll', keys: 'a', description: 'Reply all' },
  { id: 'forward', keys: 'f', description: 'Forward' },
  { id: 'archive', keys: 'e', description: 'Archive' },
  { id: 'trash', keys: '#', description: 'Move to trash' },
  { id: 'spam', keys: '!', description: 'Report spam' },
  { id: 'star', keys: 's', description: 'Star' },
  { id: 'markRead', keys: 'I', description: 'Mark as read' },
  { id: 'markUnread', keys: 'U', description: 'Mark as unread' },
  { id: 'goInbox', keys: 'g i', description: 'Go to inbox' },
  { id: 'help', keys: '?', description: 'Shortcut help' },
]

export const shortcutKeys = (overrides: Record<string, string>) =>
  SHORTCUTS.map((shortcut) => ({ ...shortcut, keys: overrides[shortcut.id] || shortcut.keys }))

/** Typing in a field must never trigger a shortcut. */
export const isTypingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null
  if (!element) return false
  const tag = element.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable
}

/** The printable form of a key event, matching how bindings are written above. */
export const eventKey = (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return null
  return event.key.length === 1 ? event.key : null
}

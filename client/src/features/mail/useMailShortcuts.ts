import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMailUiStore } from '../../stores/mailUiStore'
import { useShellStore } from '../../stores/shellStore'
import { eventKey, isTypingTarget, shortcutKeys, type ShortcutId } from '../../lib/shortcuts'
import { useSettings } from '../settings/queries'
import { mailQueries } from './queries'

const CHORD_MS = 1200

type Handlers = Partial<Record<ShortcutId, () => void>>

/** Binds the Gmail-style shortcuts, honouring the user's overrides and the global on/off switch. */
export function useMailShortcuts(handlers: Handlers) {
  const settings = useSettings()
  const queryClient = useQueryClient()
  const folder = useMailUiStore((state) => state.folder)
  const setFolder = useMailUiStore((state) => state.setFolder)
  const openCompose = useMailUiStore((state) => state.openCompose)
  const setShortcutsHelpOpen = useShellStore((state) => state.setShortcutsHelpOpen)

  const latest = useRef<Handlers>(handlers)
  const chord = useRef<{ key: string; at: number } | null>(null)

  // The listener is bound once, so it reads the current handlers through a ref rather than
  // re-subscribing on every render.
  useEffect(() => {
    latest.current = handlers
  })

  const enabled = settings.shortcutsEnabled
  const overrides = settings.shortcutOverrides

  useEffect(() => {
    if (!enabled) return

    const bindings = shortcutKeys(overrides)

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return
      const key = eventKey(event)
      if (!key) return

      const now = Date.now()
      const previous = chord.current && now - chord.current.at < CHORD_MS ? chord.current.key : null
      chord.current = { key, at: now }

      const combo = previous ? `${previous} ${key}` : null
      const match = bindings.find((binding) => binding.keys === combo) ?? bindings.find((binding) => binding.keys === key)
      if (!match) return

      // Only swallow the keystroke once something is actually bound to it.
      event.preventDefault()
      chord.current = null

      if (match.id === 'goInbox') {
        setFolder('INBOX')
        void queryClient.invalidateQueries({ queryKey: mailQueries.messages('INBOX').queryKey })
        return
      }
      if (match.id === 'compose') return openCompose()
      if (match.id === 'help') return setShortcutsHelpOpen(true)
      if (match.id === 'search') {
        document.querySelector<HTMLInputElement>('.search-row input')?.focus()
        return
      }
      latest.current[match.id]?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, folder, openCompose, overrides, queryClient, setFolder, setShortcutsHelpOpen])
}

import type { MailFolder, SendInput } from '@api/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { moveMessages, sendMessage, setFlags } from '../../api/mail'
import { useMailUiStore } from '../../stores/mailUiStore'
import { mailQueries } from './queries'

const FLAGGED = '\\Flagged'
const SEEN = '\\Seen'

/** Where archive/spam/trash actually go, by SPECIAL-USE with a name fallback. */
export function useRoleFolders() {
  const { data } = useQuery(mailQueries.folders())

  const byRole = (role: string, names: string[]) => {
    const declared = data?.find((folder) => folder.specialUse === role)
    if (declared) return declared.path
    return data?.find((folder) => names.some((name) => name.toLowerCase() === folder.path.toLowerCase()))?.path ?? null
  }

  return {
    archive: byRole('\\Archive', ['Archive', 'Archives']),
    spam: byRole('\\Junk', ['Junk', 'Spam']),
    trash: byRole('\\Trash', ['Trash', 'Deleted Items']),
    folders: data ?? ([] as MailFolder[]),
  }
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  const setFolder = useMailUiStore((state) => state.setFolder)
  const closeCompose = useMailUiStore((state) => state.closeCompose)

  return useMutation({
    mutationFn: (input: SendInput) => sendMessage(input),
    onSuccess: async (result) => {
      closeCompose()
      // The copy only exists if the Sent append succeeded; the send itself already went through.
      if (result.savedTo) setFolder(result.savedTo)
      await queryClient.invalidateQueries({ queryKey: ['mail'] })
    },
  })
}

function useFlagMutation(flag: string, unseenDelta = 0) {
  const queryClient = useQueryClient()
  const folder = useMailUiStore((state) => state.folder)

  return useMutation({
    mutationFn: ({ uid, set }: { uid: number; set: boolean }) =>
      setFlags({ folder, uids: [uid], ...(set ? { add: [flag] } : { remove: [flag] }) }),
    onSuccess: async (_result, { uid, set }) => {
      // IMAP STATUS on the mailbox that is currently selected is allowed to lag, so the unseen
      // count is adjusted here rather than waiting for the server to agree.
      if (unseenDelta) {
        const step = set ? -unseenDelta : unseenDelta
        queryClient.setQueryData(mailQueries.folders().queryKey, (current?: MailFolder[]) =>
          current?.map((entry) =>
            entry.path === folder ? { ...entry, unseen: Math.max(0, entry.unseen + step) } : entry,
          ),
        )
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: mailQueries.messages(folder).queryKey }),
        queryClient.invalidateQueries({ queryKey: mailQueries.message(folder, uid).queryKey }),
      ])
    },
  })
}

export const useToggleFlagged = () => useFlagMutation(FLAGGED)

export const useMarkSeen = () => useFlagMutation(SEEN, 1)

/** Archive, spam and trash are all the same IMAP move; only the destination differs. */
export function useMoveMessage() {
  const queryClient = useQueryClient()
  const folder = useMailUiStore((state) => state.folder)
  const setSelectedUid = useMailUiStore((state) => state.setSelectedUid)
  const setInboxDetailOpen = useMailUiStore((state) => state.setInboxDetailOpen)

  return useMutation({
    mutationFn: ({ uid, to }: { uid: number; to: string }) => moveMessages({ folder, uids: [uid], to }),
    onSuccess: async () => {
      // The message is no longer in this folder, so nothing should stay selected.
      setSelectedUid(null)
      setInboxDetailOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['mail'] })
    },
  })
}

import type { IdentityInput, MailFilterInput, SettingsInput } from '@api/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createFilter,
  deleteFilter,
  deleteForwarder,
  requestForwarder,
  runFilters,
  updateFilter,
  verifyForwarder,
} from '../../api/filters'
import { createIdentity, deleteIdentity, updateIdentity } from '../../api/identities'
import { createFolder, deleteFolder, renameFolder } from '../../api/mail'
import { patchSettings } from '../../api/settings'
import { settingsQueries } from './queries'

function useInvalidating<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  keys: readonly (readonly unknown[])[],
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SettingsInput) => patchSettings(input),
    // Write straight to the cache so theme and density flip without a round trip.
    onSuccess: (next) => queryClient.setQueryData(settingsQueries.settings().queryKey, next),
  })
}

const IDENTITY_KEYS = [['identities'], ['labels']] as const
export const useCreateIdentity = () => useInvalidating((input: IdentityInput) => createIdentity(input), IDENTITY_KEYS)
export const useUpdateIdentity = () =>
  useInvalidating(({ id, ...input }: Partial<IdentityInput> & { id: number }) => updateIdentity(id, input), IDENTITY_KEYS)
export const useDeleteIdentity = () => useInvalidating((id: number) => deleteIdentity(id), IDENTITY_KEYS)

const FILTER_KEYS = [['filters']] as const
export const useCreateFilter = () => useInvalidating((input: MailFilterInput) => createFilter(input), FILTER_KEYS)
export const useUpdateFilter = () =>
  useInvalidating(
    ({ id, ...input }: Partial<MailFilterInput> & { id: number; position?: number }) => updateFilter(id, input),
    FILTER_KEYS,
  )
export const useDeleteFilter = () => useInvalidating((id: number) => deleteFilter(id), FILTER_KEYS)
export const useRunFilters = () => useInvalidating((folder: string) => runFilters(folder), [['mail'], ['labels']])

const FORWARDER_KEYS = [['forwarders']] as const
export const useRequestForwarder = () => useInvalidating((email: string) => requestForwarder(email), FORWARDER_KEYS)
export const useVerifyForwarder = () =>
  useInvalidating((input: { email: string; code: string }) => verifyForwarder(input), FORWARDER_KEYS)
export const useDeleteForwarder = () => useInvalidating((id: number) => deleteForwarder(id), FORWARDER_KEYS)

const FOLDER_KEYS = [['mail']] as const
export const useCreateFolder = () => useInvalidating((path: string) => createFolder({ path }), FOLDER_KEYS)
export const useRenameFolder = () =>
  useInvalidating((input: { path: string; to: string }) => renameFolder(input), FOLDER_KEYS)
export const useDeleteFolder = () =>
  useInvalidating((input: { path: string; moveTo?: string }) => deleteFolder(input), FOLDER_KEYS)

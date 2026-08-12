import type { LoginInput } from '@api/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, logout } from '../../api/auth'
import { useShellStore } from '../../stores/shellStore'
import { authQueries } from './queries'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (user) => {
      useShellStore.getState().setSessionExpired(false)
      const session = authQueries.session().queryKey
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== session[0] })
      queryClient.setQueryData(session, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    // Every cached page belongs to the mailbox that just signed out. Removing them leaves the
    // mounted session observer with nothing, so reset it explicitly to force the /auth/me
    // round trip that lands on the login screen.
    onSettled: async () => {
      // A deliberate sign-out is not an expiry, so the login screen should not claim it was.
      useShellStore.getState().setSessionExpired(false)
      const session = authQueries.session().queryKey
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== session[0] })
      // Reset rather than remove, so the observer App is holding refetches and lands on the 401.
      await queryClient.resetQueries({ queryKey: session })
    },
  })
}

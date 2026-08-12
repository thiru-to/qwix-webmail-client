import { useQuery } from '@tanstack/react-query'
import { Button } from './components/ui/button'
import { Spinner } from './components/ui/spinner'
import { WorkspaceErrorBoundary } from './components/WorkspaceErrorBoundary'
import { LoginScreen } from './features/auth/LoginScreen'
import { authQueries } from './features/auth/queries'
import { MailWorkspace } from './features/mail/MailWorkspace'
import { CalendarWorkspace } from './features/calendar/CalendarWorkspace'
import { ContactsWorkspace } from './features/contacts/ContactsWorkspace'
import { useShellStore } from './stores/shellStore'
import { useSettings } from './features/settings/queries'
import { SettingsWorkspace } from './features/settings/SettingsWorkspace'
import { cn } from './lib/utils'
import './App.css'
import './components/ui/ui.css'
import './components/shell/shell.css'
import './features/auth/auth.css'

function App() {
  const productView = useShellStore((state) => state.productView)
  const theme = useSettings().theme
  const sessionExpired = useShellStore((state) => state.sessionExpired)
  const { data: session, isPending, isError, error, refetch, isFetching } = useQuery(authQueries.session())

  if (isPending) {
    return (
      <div className={cn('mail-app auth-screen', theme === 'light' && 'theme-light')}>
        <Spinner size={22} />
      </div>
    )
  }

  if (!session || sessionExpired) return <LoginScreen />

  if (isError) {
    return (
      <div className={cn('mail-app auth-screen', theme === 'light' && 'theme-light')}>
        <div className="auth-card query-error" role="alert">
          <p>{error?.message ?? 'Could not load your session.'}</p>
          <Button type="button" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? <Spinner size={14} /> : null}
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <WorkspaceErrorBoundary resetKey={productView}>
      {productView === 'mail' ? <MailWorkspace /> : null}
      {productView === 'calendar' ? <CalendarWorkspace /> : null}
      {productView === 'contacts' ? <ContactsWorkspace /> : null}
      {productView === 'settings' ? <SettingsWorkspace /> : null}
    </WorkspaceErrorBoundary>
  )
}

export default App

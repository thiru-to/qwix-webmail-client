import { WorkspaceErrorBoundary } from './components/WorkspaceErrorBoundary'
import { MailWorkspace } from './features/mail/MailWorkspace'
import { CalendarWorkspace } from './features/calendar/CalendarWorkspace'
import { ContactsWorkspace } from './features/contacts/ContactsWorkspace'
import { useShellStore } from './stores/shellStore'
import './App.css'
import './components/ui/ui.css'
import './components/shell/shell.css'

function App() {
  const productView = useShellStore((state) => state.productView)

  return (
    <WorkspaceErrorBoundary resetKey={productView}>
      {productView === 'mail' ? <MailWorkspace /> : null}
      {productView === 'calendar' ? <CalendarWorkspace /> : null}
      {productView === 'contacts' ? <ContactsWorkspace /> : null}
    </WorkspaceErrorBoundary>
  )
}

export default App

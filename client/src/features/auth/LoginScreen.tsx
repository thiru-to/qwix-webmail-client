import type { ServerInput } from '@api/types'
import { useState, type FormEvent } from 'react'
import { LogIn } from 'lucide-react'
import { manualConfigDomain } from '../../api/auth'
import { Button } from '../../components/ui/button'
import { FormField } from '../../components/ui/form-field'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import { useShellStore } from '../../stores/shellStore'
import { useSettings } from '../settings/queries'
import { cn } from '../../lib/utils'
import { useLogin } from './mutations'
import './auth.css'
import { ICON, ICON_STROKE } from '../../lib/icons'

type ValidationErrors = Partial<Record<'email' | 'password' | 'server', string>>

const emptyServer: ServerInput = {
  name: '',
  imapHost: '',
  imapPort: 993,
  smtpHost: '',
  smtpPort: 465,
  davUrl: '',
}

export function LoginScreen() {
  const theme = useSettings().theme
  const sessionExpired = useShellStore((state) => state.sessionExpired)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [server, setServer] = useState<ServerInput>(emptyServer)
  const [manualDomain, setManualDomain] = useState<string | null>(null)
  const [validation, setValidation] = useState<ValidationErrors>({})
  const { mutateAsync, isPending, error } = useLogin()

  function updateServer<K extends keyof ServerInput>(key: K, value: ServerInput[K]) {
    setServer((current) => ({ ...current, [key]: value }))
    setValidation((current) => ({ ...current, server: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const needsServer = manualDomain !== null
    const nextValidation: ValidationErrors = {
      ...(!email.includes('@') && { email: 'Enter your full email address.' }),
      ...(!password && { password: 'Enter your password.' }),
      ...(needsServer &&
        !(server.imapHost.trim() && server.smtpHost.trim() && server.davUrl.trim()) && {
          server: 'IMAP host, SMTP host and DAV URL are all required.',
        }),
    }

    setValidation(nextValidation)
    if (Object.keys(nextValidation).length > 0) return

    try {
      await mutateAsync({ email, password, server: needsServer ? server : undefined })
    } catch (loginError) {
      // Sticky once asked for: a later wrong-password 401 must not collapse the server
      // fields and throw away what was typed into them.
      const domain = manualConfigDomain(loginError)
      if (domain) setManualDomain(domain)
    }
  }

  return (
    <div className={cn('mail-app auth-screen', theme === 'light' && 'theme-light')}>
      <form className="auth-card" onSubmit={(event) => void handleSubmit(event)}>
        <div className="auth-heading">
          <div className="eyebrow">Qwix</div>
          <h1>Sign in to your mailbox</h1>
          <p>Your mail server checks the password — nothing is stored here.</p>
          {sessionExpired ? (
            <p className="auth-expired" role="status">
              Your session expired. Sign in again to pick up where you left off.
            </p>
          ) : null}
        </div>

        <FormField label="Email" htmlFor="login-email" error={validation.email}>
          <Input
            id="login-email"
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setValidation((current) => ({ ...current, email: undefined }))
            }}
            placeholder="you@example.com"
          />
        </FormField>
        <FormField label="Password" htmlFor="login-password" error={validation.password}>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setValidation((current) => ({ ...current, password: undefined }))
            }}
          />
        </FormField>

        {manualDomain ? (
          <div className="auth-server">
            <p className="auth-server-note">
              We don’t know where <strong>{manualDomain}</strong> is hosted yet. Add its server details and we’ll
              remember them.
            </p>
            <FormField label="Server name" htmlFor="login-server-name">
              <Input
                id="login-server-name"
                value={server.name}
                onChange={(event) => updateServer('name', event.target.value)}
                placeholder={manualDomain}
              />
            </FormField>
            <div className="auth-server-row">
              <FormField label="IMAP host" htmlFor="login-imap-host">
                <Input
                  id="login-imap-host"
                  value={server.imapHost}
                  onChange={(event) => updateServer('imapHost', event.target.value)}
                  placeholder="imap.example.com"
                />
              </FormField>
              <FormField label="Port" htmlFor="login-imap-port">
                <Input
                  id="login-imap-port"
                  type="number"
                  value={server.imapPort}
                  onChange={(event) => updateServer('imapPort', Number(event.target.value))}
                />
              </FormField>
            </div>
            <div className="auth-server-row">
              <FormField label="SMTP host" htmlFor="login-smtp-host">
                <Input
                  id="login-smtp-host"
                  value={server.smtpHost}
                  onChange={(event) => updateServer('smtpHost', event.target.value)}
                  placeholder="smtp.example.com"
                />
              </FormField>
              <FormField label="Port" htmlFor="login-smtp-port">
                <Input
                  id="login-smtp-port"
                  type="number"
                  value={server.smtpPort}
                  onChange={(event) => updateServer('smtpPort', Number(event.target.value))}
                />
              </FormField>
            </div>
            <FormField label="CalDAV / CardDAV URL" htmlFor="login-dav-url" error={validation.server}>
              <Input
                id="login-dav-url"
                value={server.davUrl}
                onChange={(event) => updateServer('davUrl', event.target.value)}
                placeholder="https://dav.example.com"
              />
            </FormField>
          </div>
        ) : null}

        {error && !manualConfigDomain(error) ? (
          <p className="ui-form-error" role="alert">
            {error.message}
          </p>
        ) : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? <Spinner size={ICON.md} /> : null}
          Sign in <LogIn size={ICON.md} strokeWidth={ICON_STROKE} />
        </Button>
      </form>
    </div>
  )
}

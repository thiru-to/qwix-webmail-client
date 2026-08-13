import { useQuery } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { Spinner } from '../../components/ui/spinner'
import { useLogout } from './mutations'
import { authQueries } from './queries'
import { ICON_STROKE } from '../../lib/icons'

export function AccountDock() {
  const { data } = useQuery(authQueries.session())
  const { mutate, isPending } = useLogout()
  const [local = '', domain = ''] = (data?.email ?? '').split('@')

  return (
    <div className="account-dock">
      <div className="account-chip" title={data?.email}>
        <span className="account-avatar" aria-hidden="true">
          {local.slice(0, 2).toUpperCase() || '?'}
        </span>
        <span className="account-lines">
          <span className="account-local">{local}</span>
          <span className="account-domain">@{domain}</span>
        </span>
      </div>
      <button className="signout-button" type="button" onClick={() => mutate()} disabled={isPending}>
        {isPending ? <Spinner size={15} /> : <LogOut size={15} strokeWidth={ICON_STROKE} />}
        <span>Sign out</span>
      </button>
    </div>
  )
}

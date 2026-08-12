import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { useShellStore } from '../../stores/shellStore'
import { useSettings } from '../../features/settings/queries'
import { cn } from '../../lib/utils'

type AppShellProps = {
  sidebar: ReactNode
  dock?: ReactNode
  primaryAction?: ReactNode
  children: ReactNode
  workspaceClassName?: string
}

export function AppShell({ sidebar, dock, primaryAction, children, workspaceClassName }: AppShellProps) {
  const sidebarCollapsed = useShellStore((state) => state.sidebarCollapsed)
  const settings = useSettings()

  return (
    <div className={cn('mail-app', settings.theme === 'light' && 'theme-light', `density-${settings.density}`)}>
      <div className={cn('workspace', sidebarCollapsed && 'sidebar-collapsed', workspaceClassName)}>
        <Sidebar primaryAction={primaryAction} dock={dock}>
          {sidebar}
        </Sidebar>
        {children}
      </div>
    </div>
  )
}

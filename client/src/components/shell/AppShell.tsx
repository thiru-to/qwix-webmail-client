import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { useShellStore } from '../../stores/shellStore'
import { cn } from '../../lib/utils'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const lightMode = useShellStore((state) => state.lightMode)
  const toggleLightMode = useShellStore((state) => state.toggleLightMode)

  return (
    <button
      aria-label={lightMode ? 'Switch to dark theme' : 'Switch to light theme'}
      className="theme-toggle"
      type="button"
      onClick={toggleLightMode}
    >
      {lightMode ? <Moon size={15} strokeWidth={1.75} /> : <Sun size={15} strokeWidth={1.75} />}
    </button>
  )
}

type AppShellProps = {
  sidebar: ReactNode
  dock?: ReactNode
  primaryAction?: ReactNode
  children: ReactNode
  workspaceClassName?: string
}

export function AppShell({
  sidebar,
  dock,
  primaryAction,
  children,
  workspaceClassName,
}: AppShellProps) {
  const lightMode = useShellStore((state) => state.lightMode)
  const sidebarCollapsed = useShellStore((state) => state.sidebarCollapsed)

  return (
    <div className={cn('mail-app', lightMode && 'theme-light')}>
      <div className={cn('workspace', sidebarCollapsed && 'sidebar-collapsed', workspaceClassName)}>
        <Sidebar primaryAction={primaryAction} dock={dock}>
          {sidebar}
        </Sidebar>
        {children}
      </div>
    </div>
  )
}

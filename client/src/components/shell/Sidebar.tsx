import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { ProductNav } from './ProductNav'
import { getProductMeta } from './productMeta'
import { useShellStore } from '../../stores/shellStore'
import { ICON, ICON_STROKE } from '../../lib/icons'

type SidebarProps = {
  children: ReactNode
  dock?: ReactNode
  primaryAction?: ReactNode
}

export function Sidebar({ children, dock, primaryAction }: SidebarProps) {
  const productView = useShellStore((state) => state.productView)
  const sidebarCollapsed = useShellStore((state) => state.sidebarCollapsed)
  const toggleSidebarCollapsed = useShellStore((state) => state.toggleSidebarCollapsed)
  const ActiveIcon = getProductMeta(productView).icon

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-mark" aria-hidden="true">
          <ActiveIcon size={ICON.lg} strokeWidth={ICON_STROKE} />
        </div>
        <span className="brand-name" aria-hidden={sidebarCollapsed || undefined}>
          Qwix<span>Mail</span>
        </span>
        <Button
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="collapse-button"
          size="icon"
          variant="ghost"
          onClick={toggleSidebarCollapsed}
        >
          {sidebarCollapsed ? <ChevronRight size={ICON.md} strokeWidth={ICON_STROKE} /> : <ChevronLeft size={ICON.md} strokeWidth={ICON_STROKE} />}
        </Button>
      </div>

      <ProductNav />
      {primaryAction}
      <div className="sidebar-scroll">{children}</div>
      {dock ? <div className="sidebar-dock">{dock}</div> : null}
    </aside>
  )
}

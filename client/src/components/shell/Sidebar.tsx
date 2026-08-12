import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { ProductNav } from './ProductNav'
import { getProductMeta } from './productMeta'
import { useShellStore } from '../../stores/shellStore'

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
          <ActiveIcon size={18} strokeWidth={1.75} />
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
          {sidebarCollapsed ? <ChevronRight size={16} strokeWidth={1.75} /> : <ChevronLeft size={16} strokeWidth={1.75} />}
        </Button>
      </div>

      <ProductNav />
      {primaryAction}
      <div className="sidebar-scroll">{children}</div>
      {dock ? <div className="sidebar-dock">{dock}</div> : null}
    </aside>
  )
}

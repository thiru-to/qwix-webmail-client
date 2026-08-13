import { useShellStore } from '../../stores/shellStore'
import { productViews } from './productMeta'
import { ICON, ICON_STROKE } from '../../lib/icons'

export function ProductNav() {
  const productView = useShellStore((state) => state.productView)
  const setProductView = useShellStore((state) => state.setProductView)
  const alternateViews = productViews.filter((view) => view.id !== productView)

  return (
    <nav className="product-nav" aria-label="Switch product area">
      {alternateViews.map(({ id, label, icon: Icon }) => (
        <button
          className="product-tab"
          key={id}
          title={label}
          type="button"
          onClick={() => setProductView(id)}
        >
          <Icon size={ICON.md} strokeWidth={ICON_STROKE} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

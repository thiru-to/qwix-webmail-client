import { Search, X } from 'lucide-react'
import { Input } from './input'
import { cn } from '../../lib/utils'
import { ICON_STROKE } from '../../lib/icons'

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  className,
}: SearchFieldProps) {
  return (
    <div className={cn('search-box', className)}>
      <Search size={18} strokeWidth={ICON_STROKE} />
      <Input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {value ? (
        <button className="clear-search" type="button" onClick={() => onChange('')} aria-label="Clear search">
          <X size={15} strokeWidth={ICON_STROKE} />
        </button>
      ) : null}
    </div>
  )
}

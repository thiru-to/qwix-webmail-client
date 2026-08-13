import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ICON_STROKE } from '../../lib/icons'

type ChipInputProps = {
  id?: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  label?: string
  className?: string
}

export function ChipInput({ id, value, onChange, placeholder, label, className }: ChipInputProps) {
  const [draft, setDraft] = useState('')

  function commit(raw: string) {
    const next = raw.trim()
    if (!next || value.includes(next)) {
      setDraft('')
      return
    }
    onChange([...value, next])
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit(draft)
    }
    if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className={cn('ui-chip-input', className)}>
      {value.map((chip) => (
        <span key={chip} className="ui-chip">
          {chip}
          <button
            type="button"
            aria-label={`Remove ${chip}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange(value.filter((item) => item !== chip))}
          >
            <X size={12} strokeWidth={ICON_STROKE} />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        aria-label={label}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        placeholder={value.length ? undefined : placeholder}
      />
    </div>
  )
}

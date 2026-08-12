import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

type ChipInputProps = {
  id?: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  className?: string
}

export function ChipInput({ id, value, onChange, placeholder, className }: ChipInputProps) {
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
            onClick={() => onChange(value.filter((item) => item !== chip))}
          >
            <X size={12} strokeWidth={1.75} />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        placeholder={value.length ? undefined : placeholder}
      />
    </div>
  )
}

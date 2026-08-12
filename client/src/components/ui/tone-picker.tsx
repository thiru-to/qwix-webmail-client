import { cn } from '../../lib/utils'

type ToneOption = { id: string; label: string }

type TonePickerProps = {
  value: string
  onChange: (value: string) => void
  options: ToneOption[]
  label?: string
}

export function TonePicker({ value, onChange, options, label = 'Color' }: TonePickerProps) {
  return (
    <div className="ui-tone-picker" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={cn('ui-tone-swatch', `tone-${option.id}`, value === option.id && 'active')}
          aria-pressed={value === option.id}
          aria-label={option.label}
          onClick={() => onChange(option.id)}
        />
      ))}
    </div>
  )
}

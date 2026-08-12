import { HardDrive } from 'lucide-react'

type StorageMeterProps = {
  used?: string
  limit?: string
  percent?: number
  collapsedLabel?: string
}

export function StorageMeter({ used, limit, percent = 0, collapsedLabel }: StorageMeterProps) {
  return (
    <div className="storage-meter" title={collapsedLabel}>
      <div className="storage-label">
        <HardDrive size={18} strokeWidth={1.75} className="hard-drive-icon" />
        <span>
          {used} ({percent}%) / {limit}
        </span>
      </div>
      <div className="storage-track">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

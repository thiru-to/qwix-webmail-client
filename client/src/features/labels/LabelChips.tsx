import { useQuery } from '@tanstack/react-query'
import { labelQueries } from './queries'

export function LabelChips({ ids }: { ids: number[] }) {
  const { data } = useQuery(labelQueries.all())
  if (!ids.length || !data?.length) return null

  const shown = data.filter((label) => ids.includes(label.id))
  if (!shown.length) return null

  return (
    <>
      {shown.map((label) => (
        <span className={`label-badge ${label.color}`} key={label.id}>
          <span />
          {label.name}
        </span>
      ))}
    </>
  )
}

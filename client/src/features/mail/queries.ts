import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { fetchFolders, fetchMessage, fetchMessages } from '../../api/mail'

export const PAGE_SIZE = 50

const folderOptions = queryOptions({ queryKey: ['mail', 'folders'] as const, queryFn: fetchFolders })

export const mailQueries = {
  folders: () => folderOptions,

  messages: (folder: string) =>
    infiniteQueryOptions({
      queryKey: ['mail', 'messages', folder] as const,
      queryFn: ({ pageParam }) => fetchMessages(folder, PAGE_SIZE, pageParam),
      initialPageParam: 0,
      getNextPageParam: (page) => {
        const next = page.offset + page.messages.length
        return page.messages.length > 0 && next < page.total ? next : undefined
      },
    }),

  message: (folder: string, uid: number | null) =>
    queryOptions({
      queryKey: ['mail', 'message', folder, uid] as const,
      queryFn: () => fetchMessage(folder, uid!),
      enabled: uid !== null,
    }),
}

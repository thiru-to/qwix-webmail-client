import type {
  FlagsInput,
  FolderDelete,
  FolderInput,
  FolderRename,
  MailFolder,
  Message,
  MessagePage,
  MoveInput,
  OkResult,
  SendInput,
  SendResult,
} from '@api/types'
import { apiUrl, request } from './client'

export const fetchFolders = () => request<MailFolder[]>('/mail/folders')

export const fetchMessages = (folder: string, limit: number, offset: number) =>
  request<MessagePage>(`/mail/messages?folder=${encodeURIComponent(folder)}&limit=${limit}&offset=${offset}`)

export const fetchMessage = (folder: string, uid: number) =>
  request<Message>(`/mail/message?folder=${encodeURIComponent(folder)}&uid=${uid}`)

export const setFlags = (input: FlagsInput) => request<OkResult>('/mail/flags', { method: 'POST', body: input })

export const sendMessage = (input: SendInput) => request<SendResult>('/mail/send', { method: 'POST', body: input })

export const attachmentUrl = (folder: string, uid: number, part: string) =>
  apiUrl(`/mail/attachment?folder=${encodeURIComponent(folder)}&uid=${uid}&part=${encodeURIComponent(part)}`)

export const moveMessages = (input: MoveInput) => request<OkResult>('/mail/move', { method: 'POST', body: input })

export const createFolder = (input: FolderInput) => request<OkResult>('/mail/folders', { method: 'POST', body: input })

export const renameFolder = (input: FolderRename) =>
  request<OkResult>('/mail/folders', { method: 'PATCH', body: input })

export const deleteFolder = (input: FolderDelete) =>
  request<OkResult & { moved: number }>('/mail/folders', { method: 'DELETE', body: input })

import type { Message } from '@api/types'
import {
  Archive,
  ArrowLeft,
  Forward,
  FolderInput,
  Filter,
  MailOpen,
  MailX,
  Reply,
  ReplyAll,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { IconButton } from '../../components/ui/icon-button'
import { LabelPicker } from '../labels/LabelPicker'
import { useSettingsUiStore } from '../../stores/settingsUiStore'
import { useShellStore } from '../../stores/shellStore'
import { useMoveMessage, useRoleFolders } from './mutations'
import { ICON, ICON_STROKE } from '../../lib/icons'

type ReaderToolbarProps = {
  message: Message
  onBack?: () => void
  onReply: () => void
  onReplyAll: () => void
  onForward: () => void
  onMarkSeen: (seen: boolean) => void
}

export function ReaderToolbar({
  message,
  onBack,
  onReply,
  onReplyAll,
  onForward,
  onMarkSeen,
}: ReaderToolbarProps) {
  const { archive, spam, trash, folders } = useRoleFolders()
  const move = useMoveMessage()
  const setProductView = useShellStore((state) => state.setProductView)
  const setSection = useSettingsUiStore((state) => state.setSection)
  const setFilterDraft = useSettingsUiStore((state) => state.setFilterDraft)
  const [moveOpen, setMoveOpen] = useState(false)

  const moveTo = (to: string | null) => to && move.mutate({ uid: message.uid, to })

  function filterLikeThis() {
    setFilterDraft({ from: message.from?.address ?? '' })
    setSection('filters')
    setProductView('settings')
  }

  return (
    <div className="reader-toolbar">
      {onBack ? (
        <IconButton label="Back to inbox" className="reader-back" onClick={onBack}>
          <ArrowLeft size={ICON.lg} strokeWidth={ICON_STROKE} />
        </IconButton>
      ) : null}

      <Button size="sm" onClick={onReply}>
        <Reply size={ICON.md} strokeWidth={ICON_STROKE} /> Reply
      </Button>
      <Button size="sm" variant="outline" onClick={onReplyAll}>
        <ReplyAll size={ICON.md} strokeWidth={ICON_STROKE} /> Reply all
      </Button>
      <Button size="sm" variant="outline" onClick={onForward}>
        <Forward size={ICON.md} strokeWidth={ICON_STROKE} /> Forward
      </Button>

      <div className="reader-toolbar-icons">
        <IconButton label="Archive" disabled={!archive || move.isPending} onClick={() => moveTo(archive)}>
          <Archive size={ICON.lg} strokeWidth={ICON_STROKE} />
        </IconButton>
        <IconButton label="Report spam" disabled={!spam || move.isPending} onClick={() => moveTo(spam)}>
          <ShieldAlert size={ICON.lg} strokeWidth={ICON_STROKE} />
        </IconButton>
        <IconButton label="Move to trash" disabled={!trash || move.isPending} onClick={() => moveTo(trash)}>
          <Trash2 size={ICON.lg} strokeWidth={ICON_STROKE} />
        </IconButton>
        <IconButton
          label={message.seen ? 'Mark as unread' : 'Mark as read'}
          onClick={() => onMarkSeen(!message.seen)}
        >
          {message.seen ? <MailX size={ICON.lg} strokeWidth={ICON_STROKE} /> : <MailOpen size={ICON.lg} strokeWidth={ICON_STROKE} />}
        </IconButton>

        <div className="label-picker">
          <IconButton label="Move to folder" onClick={() => setMoveOpen((current) => !current)}>
            <FolderInput size={ICON.lg} strokeWidth={ICON_STROKE} />
          </IconButton>
          {moveOpen ? (
            <>
              <button
                className="label-picker-backdrop"
                type="button"
                aria-label="Close move menu"
                onClick={() => setMoveOpen(false)}
              />
              <div className="label-picker-menu">
                {folders
                  .filter((folder) => folder.path !== message.folder)
                  .map((folder) => (
                    <button
                      key={folder.path}
                      type="button"
                      className="label-option"
                      onClick={() => {
                        setMoveOpen(false)
                        moveTo(folder.path)
                      }}
                    >
                      {folder.name}
                    </button>
                  ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <LabelPicker kind="message" resourceId={message.messageId} active={message.labelIds} />

      <Button size="sm" variant="ghost" onClick={filterLikeThis} disabled={!message.from?.address}>
        <Filter size={ICON.md} strokeWidth={ICON_STROKE} /> Filter like this
      </Button>
    </div>
  )
}

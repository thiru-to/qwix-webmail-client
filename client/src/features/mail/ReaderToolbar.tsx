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

const stroke = 1.75

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
        <Button aria-label="Back to inbox" className="reader-back" size="icon" variant="ghost" onClick={onBack}>
          <ArrowLeft size={18} strokeWidth={stroke} />
        </Button>
      ) : null}

      <Button size="sm" onClick={onReply}>
        <Reply size={15} strokeWidth={stroke} /> Reply
      </Button>
      <Button size="sm" variant="outline" onClick={onReplyAll}>
        <ReplyAll size={15} strokeWidth={stroke} /> Reply all
      </Button>
      <Button size="sm" variant="outline" onClick={onForward}>
        <Forward size={15} strokeWidth={stroke} /> Forward
      </Button>

      <div className="reader-toolbar-icons">
        <IconButton label="Archive" disabled={!archive || move.isPending} onClick={() => moveTo(archive)}>
          <Archive size={17} strokeWidth={stroke} />
        </IconButton>
        <IconButton label="Report spam" disabled={!spam || move.isPending} onClick={() => moveTo(spam)}>
          <ShieldAlert size={17} strokeWidth={stroke} />
        </IconButton>
        <IconButton label="Move to trash" disabled={!trash || move.isPending} onClick={() => moveTo(trash)}>
          <Trash2 size={17} strokeWidth={stroke} />
        </IconButton>
        <IconButton
          label={message.seen ? 'Mark as unread' : 'Mark as read'}
          onClick={() => onMarkSeen(!message.seen)}
        >
          {message.seen ? <MailX size={17} strokeWidth={stroke} /> : <MailOpen size={17} strokeWidth={stroke} />}
        </IconButton>

        <div className="label-picker">
          <IconButton label="Move to folder" onClick={() => setMoveOpen((current) => !current)}>
            <FolderInput size={17} strokeWidth={stroke} />
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
        <Filter size={15} strokeWidth={stroke} /> Filter like this
      </Button>
    </div>
  )
}

import type { MailFolder } from '@api/types'
import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Lock, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Spinner } from '../../../components/ui/spinner'
import { mailQueries } from '../../mail/queries'
import { useCreateFolder, useDeleteFolder, useRenameFolder } from '../mutations'
import { ICON, ICON_STROKE } from '../../../lib/icons'

const isSystem = (folder: MailFolder) => Boolean(folder.specialUse) || folder.path.toUpperCase() === 'INBOX'

export function FolderSettings() {
  const { data: folders } = useQuery(mailQueries.folders())
  const [name, setName] = useState('')
  const [renaming, setRenaming] = useState<MailFolder | null>(null)
  const [renameTo, setRenameTo] = useState('')
  const [confirming, setConfirming] = useState<MailFolder | null>(null)

  const create = useCreateFolder()
  const rename = useRenameFolder()
  const remove = useDeleteFolder()
  const error = create.error ?? rename.error ?? remove.error

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    create.mutate(name.trim(), { onSuccess: () => setName('') })
  }

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!renaming || !renameTo.trim()) return
    rename.mutate({ path: renaming.path, to: renameTo.trim() }, { onSuccess: () => setRenaming(null) })
  }

  return (
    <div className="settings-sections">
      <form className="settings-inline-form" onSubmit={submit}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New folder name"
          aria-label="New folder name"
        />
        <Button type="submit" size="sm" disabled={create.isPending}>
          {create.isPending ? <Spinner size={ICON.md} /> : null}
          Create
        </Button>
      </form>

      <ul className="settings-list">
        {folders?.map((folder) => (
          <li key={folder.path}>
            {renaming?.path === folder.path ? (
              <form className="settings-inline-form settings-rename" onSubmit={submitRename}>
                <Input
                  autoFocus
                  value={renameTo}
                  onChange={(event) => setRenameTo(event.target.value)}
                  aria-label={`Rename ${folder.name}`}
                />
                <Button type="submit" size="sm" disabled={rename.isPending}>
                  <Check size={ICON.md} strokeWidth={ICON_STROKE} />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                  <X size={ICON.md} strokeWidth={ICON_STROKE} />
                </Button>
              </form>
            ) : (
              <>
                <span className="settings-folder-name">
                  {folder.name}
                  <em>{folder.total} messages</em>
                </span>
                {isSystem(folder) ? (
                  <span className="settings-locked" title="System folder">
                    <Lock size={ICON.sm} strokeWidth={ICON_STROKE} />
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label={`Rename ${folder.name}`}
                      onClick={() => {
                        setRenaming(folder)
                        setRenameTo(folder.path)
                      }}
                    >
                      <Pencil size={ICON.sm} strokeWidth={ICON_STROKE} />
                    </button>
                    <button type="button" aria-label={`Delete ${folder.name}`} onClick={() => setConfirming(folder)}>
                      <Trash2 size={ICON.sm} strokeWidth={ICON_STROKE} />
                    </button>
                  </>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {confirming ? (
        <div className="settings-confirm" role="alertdialog" aria-label="Confirm folder deletion">
          <p>
            Delete <strong>{confirming.name}</strong>?
            {confirming.total > 0 ? (
              <>
                {' '}
                It still holds <strong>{confirming.total}</strong>{' '}
                {confirming.total === 1 ? 'message' : 'messages'}, which will be moved to your Inbox first —
                nothing is deleted.
              </>
            ) : (
              ' It is empty.'
            )}
          </p>
          <div className="settings-confirm-actions">
            <Button
              size="sm"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate({ path: confirming.path }, { onSuccess: () => setConfirming(null) })
              }
            >
              {remove.isPending ? <Spinner size={ICON.md} /> : null}
              {confirming.total > 0 ? 'Move to Inbox and delete' : 'Delete folder'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="ui-form-error" role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  )
}

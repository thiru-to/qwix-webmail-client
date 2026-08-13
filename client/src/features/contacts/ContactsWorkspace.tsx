import type { ContactItem } from '@api/types'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Mail, Pencil, Phone, UsersRound } from 'lucide-react'
import { AppShell } from '../../components/shell/AppShell'
import { AccountDock } from '../auth/AccountDock'
import { Avatar } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import { SearchField } from '../../components/ui/search-field'
import { List, ListRow } from '../../components/ui/list'
import { Panel } from '../../components/ui/panel'
import { QueryState } from '../../components/ui/query-state'
import { SkeletonRow } from '../../components/ui/skeleton'
import { avatarTone, initialsOf } from '../../lib/format'
import { LabelChips } from '../labels/LabelChips'
import { LabelPicker } from '../labels/LabelPicker'
import { useContactsUiStore } from '../../stores/contactsUiStore'
import { ContactFormPanel } from './ContactFormPanel'
import { contactsQueries } from './queries'
import './contacts.css'
import { ICON, ICON_STROKE } from '../../lib/icons'

const primaryEmail = (contact: ContactItem) => contact.emails[0]?.value ?? ''

export function ContactsWorkspace() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(contactsQueries.contacts())
  const contacts = useMemo(() => data?.contacts ?? [], [data?.contacts])
  const search = useContactsUiStore((state) => state.search)
  const setSearch = useContactsUiStore((state) => state.setSearch)
  const selectedId = useContactsUiStore((state) => state.selectedId)
  const setSelectedId = useContactsUiStore((state) => state.setSelectedId)
  const panel = useContactsUiStore((state) => state.panel)
  const setPanel = useContactsUiStore((state) => state.setPanel)

  const visible = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return contacts
    return contacts.filter((contact) =>
      [contact.name, primaryEmail(contact), contact.organization ?? '', contact.title ?? '']
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  }, [contacts, search])

  const selected = contacts.find((contact) => contact.id === selectedId) ?? visible[0] ?? contacts[0]

  return (
    <AppShell
      workspaceClassName="workspace-inbox product-contacts"
      sidebar={
        <nav className="folder-list" aria-label="Contact groups">
          <button className="folder-item active" type="button">
            <UsersRound size={ICON.lg} strokeWidth={ICON_STROKE} />
            <span>All contacts</span>
            <span className="folder-count">{contacts.length || '—'}</span>
          </button>
        </nav>
      }
      dock={
<AccountDock />
      }
    >
      <main className="inbox-column contacts-main">
        <div className="search-row">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search contacts…"
            label="Search contacts"
          />
        </div>

        <QueryState
          isPending={isPending}
          isError={isError}
          error={error}
          onRetry={() => void refetch()}
          isFetching={isFetching}
          pending={
            <div className="query-pending">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          }
        >
          <div className="contacts-split">
            <Panel
              eyebrow="Directory"
              title="Contacts"
              description={`${visible.length} people`}
              className="contacts-list-panel"
              actions={
                <Button size="sm" onClick={() => setPanel('create')}>
                  New contact
                </Button>
              }
            >
              <List label="Contacts">
                {visible.length === 0 ? (
                  <div className="loading-state">
                    {search.trim() ? `No contacts match “${search}”.` : 'This address book is empty.'}
                  </div>
                ) : (
                  visible.map((contact) => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      selected={contact.id === selected?.id}
                      onSelect={() => setSelectedId(contact.id)}
                    />
                  ))
                )}
              </List>
            </Panel>

            {panel !== 'none' ? (
              <ContactFormPanel key={panel === 'edit' ? selected?.id : 'new'} contact={panel === 'edit' ? selected : undefined} />
            ) : null}

            {(
              <section className="contacts-detail reader-panel">
                {selected ? (
                  <>
                    <div className="reader-sender">
                      <Avatar initials={initialsOf(selected.name)} tone={avatarTone(selected.id)} size="large" />
                      <div className="sender-details">
                        <h2>{selected.name}</h2>
                        <p>
                          {selected.title ?? '—'}
                          <br />
                          {selected.organization ?? '—'}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setPanel('edit')}>
                        <Pencil size={ICON.md} strokeWidth={ICON_STROKE} /> Edit
                      </Button>
                    </div>
                    <div className="detail-labels">
                      <LabelPicker kind="contact" resourceId={selected.id} active={selected.labelIds} />
                      <LabelChips ids={selected.labelIds} />
                    </div>
                    <div className="contact-fields">
                      {selected.emails.map((email) => (
                        <p key={email.value}>
                          <Mail size={ICON.md} strokeWidth={ICON_STROKE} /> {email.value}
                          {email.type ? <em>{email.type}</em> : null}
                        </p>
                      ))}
                      {selected.phones.map((phone) => (
                        <p key={phone.value}>
                          <Phone size={ICON.md} strokeWidth={ICON_STROKE} /> {phone.value}
                          {phone.type ? <em>{phone.type}</em> : null}
                        </p>
                      ))}
                      {selected.organization ? (
                        <p>
                          <Building2 size={ICON.md} strokeWidth={ICON_STROKE} /> {selected.organization}
                        </p>
                      ) : null}
                    </div>
                    {selected.note ? (
                      <div className="message-body">
                        <p>{selected.note}</p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="loading-state">Select a contact to view details.</p>
                )}
              </section>
            )}
          </div>
        </QueryState>
      </main>
    </AppShell>
  )
}

function ContactRow({
  contact,
  selected,
  onSelect,
}: {
  contact: ContactItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <ListRow
      selected={selected}
      onSelect={onSelect}
      leading={<Avatar initials={initialsOf(contact.name)} tone={avatarTone(contact.id)} />}
    >
      <div className="mail-card-topline">
        <h2>{contact.name}</h2>
        <time>{contact.organization ?? ''}</time>
      </div>
      <div className="sender-name">{contact.title ?? ''}</div>
      <p>{primaryEmail(contact)}</p>
    </ListRow>
  )
}

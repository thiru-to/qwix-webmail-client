import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Mail, Phone, UsersRound } from 'lucide-react'
import { AppShell, ThemeToggle } from '../../components/shell/AppShell'
import { Avatar } from '../../components/ui/avatar'
import { SearchField } from '../../components/ui/search-field'
import { List, ListRow } from '../../components/ui/list'
import { Panel } from '../../components/ui/panel'
import { QueryState } from '../../components/ui/query-state'
import { SkeletonRow } from '../../components/ui/skeleton'
import { contactsQueries } from './queries'
import type { Contact } from '../../data/mockContacts'
import './contacts.css'

export function ContactsWorkspace() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(contactsQueries.contacts())
  const contacts = useMemo(() => data?.contacts ?? [], [data?.contacts])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('avery')

  const visible = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return contacts
    return contacts.filter((contact) =>
      [contact.name, contact.email, contact.company, contact.role].join(' ').toLowerCase().includes(normalized),
    )
  }, [contacts, search])

  const selected = visible.find((contact) => contact.id === selectedId) ?? visible[0] ?? contacts[0]

  return (
    <AppShell
      workspaceClassName="workspace-inbox product-contacts"
      sidebar={
        <nav className="folder-list" aria-label="Contact groups">
          <button className="folder-item active" type="button">
            <UsersRound size={18} strokeWidth={1.75} />
            <span>All contacts</span>
            <span className="folder-count">{contacts.length || '—'}</span>
          </button>
          <button className="folder-item" type="button">
            <Building2 size={18} strokeWidth={1.75} />
            <span>Companies</span>
          </button>
        </nav>
      }
      dock={
        <div className="sidebar-controls">
          <ThemeToggle />
        </div>
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
            >
              <List label="Contacts">
                {visible.length === 0 ? (
                  <div className="loading-state">No contacts match “{search}”.</div>
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

            <section className="contacts-detail reader-panel">
              {selected ? (
                <>
                  <div className="reader-sender">
                    <Avatar initials={selected.initials} tone={selected.avatarTone} size="large" />
                    <div className="sender-details">
                      <h2>{selected.name}</h2>
                      <p>
                        {selected.role}
                        <br />
                        {selected.company}
                      </p>
                    </div>
                  </div>
                  <div className="contact-fields">
                    <p>
                      <Mail size={15} strokeWidth={1.75} /> {selected.email}
                    </p>
                    <p>
                      <Phone size={15} strokeWidth={1.75} /> {selected.phone}
                    </p>
                    <p>
                      <Building2 size={15} strokeWidth={1.75} /> {selected.company}
                    </p>
                  </div>
                  <div className="message-body">
                    <p>{selected.notes}</p>
                  </div>
                </>
              ) : (
                <p className="loading-state">Select a contact to view details.</p>
              )}
            </section>
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
  contact: Contact
  selected: boolean
  onSelect: () => void
}) {
  return (
    <ListRow
      selected={selected}
      onSelect={onSelect}
      leading={<Avatar initials={contact.initials} tone={contact.avatarTone} />}
    >
      <div className="mail-card-topline">
        <h2>{contact.name}</h2>
        <time>{contact.company}</time>
      </div>
      <div className="sender-name">{contact.role}</div>
      <p>{contact.email}</p>
    </ListRow>
  )
}

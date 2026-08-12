import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { DAVAddressBook, DAVClient } from 'tsdav'
import type { Account } from '../lib/account'
import type { Vars } from '../lib/auth'
import { buildVCard, updateVCard } from '../lib/build'
import { client, collectionId, fetchVCards } from '../lib/dav'
import { labelIndex, labelsOf } from '../lib/labels'
import { parseContact, parseContacts } from '../lib/parse'
import type {
  AddressBookSummary,
  ContactInput,
  ContactItem,
  ContactsResponse,
  ContactUpdate,
  Typed,
} from '../types'

const contacts = new Hono<Vars>()

const typedList = (raw: unknown): Typed[] =>
  Array.isArray(raw)
    ? raw
        .map((entry) => ({ value: String(entry?.value ?? '').trim(), type: entry?.type || undefined }))
        .filter((entry) => entry.value)
    : []

const contactInput = (raw: Partial<ContactInput>): ContactInput => {
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) throw new HTTPException(400, { message: 'name is required' })
  return { ...raw, name, emails: typedList(raw.emails), phones: typedList(raw.phones) }
}

const books = async (account: Account, only?: string) => {
  const carddav = await client(account, 'carddav')
  const all = await carddav.fetchAddressBooks()
  const selected = only ? all.filter((book) => collectionId(book.url) === only) : all
  if (only && !selected.length) throw new HTTPException(404, { message: `No address book with id ${only}` })
  return { carddav, selected }
}

// The address book that owns a card, found by URL prefix so an edit lands where the card already lives.
const owningBook = (all: DAVAddressBook[], url: string) => {
  const book = all.find((entry) => url.startsWith(entry.url))
  if (!book) throw new HTTPException(404, { message: 'No address book holds that contact' })
  return book
}

const readCard = async (account: Account, carddav: DAVClient, book: DAVAddressBook, url: string) => {
  const existing = (await fetchVCards(account, carddav, book)).find((card) => card.url === url)
  if (!existing) throw new HTTPException(404, { message: 'That contact no longer exists' })
  return existing
}

contacts.get('/addressbooks', async (c) => {
  const carddav = await client(c.get('account'), 'carddav')
  const all = await carddav.fetchAddressBooks()
  const summaries: AddressBookSummary[] = all.map((book) => ({
    id: collectionId(book.url),
    name: (book.displayName as string | undefined) ?? null,
    ctag: book.ctag ?? null,
    url: book.url,
  }))
  return c.json(summaries)
})

contacts.get('/list', async (c) => {
  const account = c.get('account')
  const { carddav, selected } = await books(account, c.req.query('addressBook'))

  const parsed = (
    await Promise.all(
      selected.map(async (book) => {
        const id = collectionId(book.url)
        return parseContacts(await fetchVCards(account, carddav, book)).map((contact) => ({
          ...contact,
          addressBookId: id,
        }))
      }),
    )
  ).flat()

  const index = labelIndex(account.userId, 'contact', parsed.map((contact) => contact.id))
  const list: ContactsResponse['contacts'] = parsed.map((contact) => ({
    ...contact,
    labelIds: labelsOf(index, 'contact', contact.id),
  }))

  list.sort((a, b) => a.name.localeCompare(b.name))
  return c.json<ContactsResponse>({ contacts: list })
})

contacts.post('/create', async (c) => {
  const account = c.get('account')
  const input = contactInput((await c.req.json()) as Partial<ContactInput>)
  const { carddav, selected } = await books(account, input.addressBook)
  const target = selected[0]
  if (!target) throw new HTTPException(404, { message: 'No address book available' })

  const uid = crypto.randomUUID()
  const filename = `${uid}.vcf`
  const data = buildVCard(uid, input)
  const response = await carddav.createVCard({ addressBook: target, vCardString: data, filename })
  if (!response.ok) {
    throw new HTTPException(502, { message: `Address book rejected the contact (${response.status})` })
  }

  // Round-tripping what we just wrote keeps a created contact byte-identical to one that came back from a read.
  const url = new URL(filename, target.url).href
  const contact = parseContact({ url, etag: response.headers.get('etag') ?? undefined, data })!
  return c.json<ContactItem>({ ...contact, addressBookId: collectionId(target.url), labelIds: [] }, 201)
})

contacts.put('/update', async (c) => {
  const account = c.get('account')
  const raw = (await c.req.json()) as Partial<ContactUpdate>
  if (typeof raw.url !== 'string' || !raw.url) throw new HTTPException(400, { message: 'url is required' })
  const input = contactInput(raw)

  const carddav = await client(account, 'carddav')
  const book = owningBook(await carddav.fetchAddressBooks(), raw.url)
  const existing = await readCard(account, carddav, book, raw.url)

  const data = updateVCard(existing.data, input)
  const response = await carddav.updateVCard({
    vCard: { url: raw.url, etag: raw.etag ?? existing.etag, data },
  })
  if (response.status === 412) {
    throw new HTTPException(409, { message: 'That contact changed elsewhere; reload and try again' })
  }
  if (!response.ok) {
    throw new HTTPException(502, { message: `Address book rejected the edit (${response.status})` })
  }

  const contact = parseContact({ url: raw.url, etag: response.headers.get('etag') ?? undefined, data })!
  const index = labelIndex(account.userId, 'contact', [contact.id])
  return c.json<ContactItem>({
    ...contact,
    addressBookId: collectionId(book.url),
    labelIds: labelsOf(index, 'contact', contact.id),
  })
})

export default contacts

import { DAVNamespaceShort } from 'tsdav'
import type { DavObject } from '../dav'
import { standard } from './standard'
import type { Provider } from './types'

export const smartermail: Provider = {
  ...standard,
  name: 'smartermail',

  // Rejects addressbook-query (400) and addressbook-multiget (403); enumerate via PROPFIND then GET each.
  fetchVCards: async (client, addressBook): Promise<DavObject[]> => {
    const entries = await client.propfind({
      url: addressBook.url,
      props: { [`${DAVNamespaceShort.DAV}:getetag`]: {} },
      depth: '1',
    })
    const origin = new URL(addressBook.url).origin
    const objects = entries
      .filter((e) => e.href && /\.vcf\/?$/.test(e.href))
      .map((e) => ({ url: new URL(e.href!, origin).href, etag: e.props?.getetag as string | undefined }))

    return Promise.all(
      objects.map(async ({ url, etag }) => {
        const [res] = await client.davRequest({ url, init: { method: 'GET', headers: {}, body: undefined } })
        return { url, etag, data: res.raw as string }
      }),
    )
  },

  // Fails SELECT of an unknown mailbox with an unparseable response rather than NONEXISTENT.
  isMissingMailbox: async (client, path) => !(await client.list()).some((box) => box.path === path),

  sentFolderNames: ['Sent Items', 'Sent'],
}

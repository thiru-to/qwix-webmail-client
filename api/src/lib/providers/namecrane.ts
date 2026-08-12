import { smartermail } from './smartermail'
import type { Provider } from './types'

// A SmarterMail host, so it inherits every SmarterMail quirk; only the account prefix differs.
export const namecrane: Provider = { ...smartermail, name: 'namecrane' }

import { mxroute } from './mxroute'
import { namecrane } from './namecrane'
import { smartermail } from './smartermail'
import { standard } from './standard'
import type { Provider } from './types'

// Quirk profiles, selected by the `profile` column on a server config. Hosts and ports live in the
// database; these only describe how a server misbehaves.
export const profiles: Record<string, Provider> = { standard, smartermail, namecrane, mxroute }

export const profile = (name: string): Provider => profiles[name] ?? standard

export type { Provider }

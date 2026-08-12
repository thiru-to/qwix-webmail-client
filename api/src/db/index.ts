import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import * as schema from './schema'

const sqlite = new Database(process.env.DB_FILE ?? 'qwix.db', { create: true })
sqlite.exec('PRAGMA journal_mode = WAL')
sqlite.exec('PRAGMA foreign_keys = ON')

export const db = drizzle({ client: sqlite, schema })

migrate(db, { migrationsFolder: `${import.meta.dir}/../../drizzle` })

export { schema }

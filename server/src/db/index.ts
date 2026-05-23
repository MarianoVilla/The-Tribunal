import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.resolve(__dirname, '../../data/tribunal.db')
const dbDir = path.dirname(dbPath)

fs.mkdirSync(dbDir, { recursive: true })

export const libsqlClient = createClient({
  url: `file:${dbPath}`,
})

export const db = drizzle(libsqlClient, { schema })

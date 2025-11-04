// app/Services/LowDB.ts
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join } from 'path'

// Tentukan tipe struktur data
interface DatabaseSchema {
  users: {
    id: number
    name: string
    email: string
  }[]
}

// Lokasi file JSON
const file = join(process.cwd(), 'database', 'db.json')

// Default struktur data
const defaultData: DatabaseSchema = { users: [] }

// Inisialisasi adapter
const adapter = new JSONFile<DatabaseSchema>(file)
const db = new Low<DatabaseSchema>(adapter, defaultData)

// Fungsi inisialisasi untuk memastikan data terbaca
export const initDB = async () => {
  await db.read()
  if (!db.data) {
    db.data = defaultData
    await db.write()
  }
}

await initDB()

export default db

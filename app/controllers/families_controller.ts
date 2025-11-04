import type { HttpContext } from '@adonisjs/core/http'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const file = path.join(__dirname, '../../db/datas.json')
const adapter = new JSONFile(file)
const db = new Low(adapter, { defaultValue: [] })

export default class FamiliesController {

    private async loadDb() {
        await db.read()
        if (!db.data) {
            db.data = []
            await db.write()
        }
    }

    async index({ inertia }: HttpContext) {
        await this.loadDb()
        return inertia.render('familyChart', { families: db.data })
    }

    async save({ request, response }: HttpContext) {
        await this.loadDb()
        
        const payload = request.input('families')

        // Helper: replace null with empty string recursively
        const cleanNode = (node: any) => {
            if (node === null) return ''
            if (Array.isArray(node)) return node.map(cleanNode)
            if (typeof node === 'object') {
            const newObj: any = {}
            for (const key in node) {
                newObj[key] = cleanNode(node[key])
            }
            return newObj
            }
            return node
        }

        if (Array.isArray(payload)) {
            payload.forEach((node) => {
            const cleanedNode = cleanNode(node)
            const index = db.data.findIndex((n) => n.id === cleanedNode.id)
            if (index !== -1) {
                db.data[index] = { ...db.data[index], ...cleanedNode }
            } else {
                db.data.push(cleanedNode)
            }
            })
            await db.write()
            return response.ok({ message: 'Family tree updated successfully', families: db.data })
        }

        // Jika frontend hanya mengirim satu node
        const cleanedNode = cleanNode(payload)
        const { id, data, rels, main } = cleanedNode
        if (!id || !data || !rels) {
            return response.badRequest({ message: 'Invalid request format' })
        }

        const nodeIndex = db.data.findIndex((node) => node.id === id)
        if (nodeIndex === -1) {
            return response.notFound({ message: 'Node not found' })
        }

        db.data[nodeIndex] = { ...db.data[nodeIndex], data, rels, main }
        await db.write()

        return response.ok({ message: 'Node updated successfully', node: db.data[nodeIndex] })
    }

    async delete({ request, response }: HttpContext) {
        await this.loadDb()

        console.log(request.input('id'))

        const idToDelete = request.input('id')
        if (!idToDelete) {
            return response.badRequest({ message: 'Missing id' })
        }

        // Hapus node utama
        const nodeIndex = db.data.findIndex(node => node.id === idToDelete)
        if (nodeIndex === -1) {
            return response.notFound({ message: 'Node not found' })
        }
        db.data.splice(nodeIndex, 1)

        await db.write()
        return response.ok({ message: `Node ${idToDelete} and all references removed successfully` })
    }

}

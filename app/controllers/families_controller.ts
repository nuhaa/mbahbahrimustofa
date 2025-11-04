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

        const { node, tree } = request.all()
        console.log('Node:', node);
        console.log('Tree:', tree);

        const cleanNode = (node: any): any => {
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

        // **BERSIHKAN DATA**
        const cleanedNode = cleanNode(node)
        const cleanedTree = cleanNode(tree)

        // Validasi
        if (!cleanedNode.id || !cleanedNode.data) {
            return response.badRequest({ message: 'ID and data are required' })
        }

        // Cek apakah node sudah ada di database
        const nodeIndex = db.data.findIndex(n => n.id === cleanedNode.id)

        if (nodeIndex !== -1) {
            // **UPDATE existing node**
            db.data[nodeIndex] = {
                ...db.data[nodeIndex],
                ...cleanedNode
            }

            await db.write()
            return response.ok({
                message: 'Node updated successfully',
                operation: 'update'
            })
        } else {
            // **CREATE new node**
            const newNode = {
                id: cleanedNode.id,
                data: cleanedNode.data || {},
                rels: cleanedNode.rels || { parents: [], children: [], spouses: [] },
                main: cleanedNode.main || false
            }

            db.data.push(newNode)

            // **FILTER YANG SANGAT KETAT - hapus semua node tidak lengkap**
            const cleanTreeData = (tree: any[]): any[] => {
                // **Hapus semua properti underscore**
                const removeUnderscoreProps = (obj: any): any => {
                    if (Array.isArray(obj)) {
                        return obj.map(removeUnderscoreProps)
                    } else if (obj !== null && typeof obj === 'object') {
                        const cleaned: any = {}
                        for (const key in obj) {
                            if (!key.startsWith('_')) {
                                cleaned[key] = removeUnderscoreProps(obj[key])
                            }
                        }
                        return cleaned
                    }
                    return obj
                }

                const cleanedTree = tree.map(node => removeUnderscoreProps(node))

                // **Filter node yang tidak memenuhi kriteria**
                return cleanedTree.filter(node => {
                    if (!node.data || typeof node.data !== 'object') {
                        return false
                    }

                    // **KRITERIA NODE YANG LAYAK DISIMPAN:**
                    const hasFirstName = !!(node.data['first name'] || node.data['firstName'] || node.data['first_name'])
                    const hasGender = !!node.data.gender
                    const hasRequiredData = hasFirstName && hasGender

                    const hasRels = node.rels && (
                        (node.rels.parents && node.rels.parents.length > 0) ||
                        (node.rels.children && node.rels.children.length > 0) ||
                        (node.rels.spouses && node.rels.spouses.length > 0)
                    )

                    const dataKeys = Object.keys(node.data)
                    const hasOnlyGender = dataKeys.length === 1 && dataKeys[0] === 'gender'

                    // **HAPUS JIKA:**
                    // - Tidak memiliki first name DAN gender ATAU
                    // - Hanya memiliki gender saja TANPA first name DAN tidak memiliki relasi
                    if (!hasRequiredData || (hasOnlyGender && !hasRels)) {
                        console.log(`Removing node ${node.id}:`, {
                            hasFirstName,
                            hasGender,
                            hasRequiredData,
                            hasOnlyGender,
                            hasRels,
                            dataKeys
                        })
                        return false
                    }

                    return true
                })
            }

            // **BERSIHKAN RELASI**
            const cleanBrokenRelations = (tree: any[]) => {
                const validIds = new Set(tree.map(node => node.id))
                return tree.map(node => {
                    if (node.rels) {
                        ['parents', 'children', 'spouses'].forEach(relType => {
                            if (node.rels[relType]) {
                                node.rels[relType] = node.rels[relType].filter((id: string) => validIds.has(id))
                            }
                        })
                    }
                    return node
                })
            }

            // **UPDATE TREE**
            const cleanedTreeData = cleanTreeData(cleanedTree)
            const finalTreeData = cleanBrokenRelations(cleanedTreeData)

            db.data = finalTreeData

            await db.write()
            return response.created({
                message: 'Node created successfully and tree updated',
                operation: 'create'
            })
        }
    }

    async delete({ request, response }: HttpContext) {
        await this.loadDb()

        const idToDelete = request.input('id')
        console.log('Menghapus node:', idToDelete)

        if (!idToDelete) {
            return response.badRequest({ message: 'Missing id' })
        }

        // Hapus node utama
        const nodeIndex = db.data.findIndex(node => node.id === idToDelete)
        if (nodeIndex === -1) {
            return response.notFound({ message: 'Node not found' })
        }

        // Simpan data node yang akan dihapus untuk referensi
        const nodeToDelete = db.data[nodeIndex]
        db.data.splice(nodeIndex, 1)

        // **BERSIHKAN SEMUA REFERENSI DARI NODE LAIN**
        db.data.forEach(node => {
            if (node.rels) {
                // Hapus dari spouses
                if (node.rels.spouses && Array.isArray(node.rels.spouses)) {
                    node.rels.spouses = node.rels.spouses.filter(spouseId => spouseId !== idToDelete)
                }

                // Hapus dari children
                if (node.rels.children && Array.isArray(node.rels.children)) {
                    node.rels.children = node.rels.children.filter(childId => childId !== idToDelete)
                }

                // Hapus dari parents
                if (node.rels.parents && Array.isArray(node.rels.parents)) {
                    node.rels.parents = node.rels.parents.filter(parentId => parentId !== idToDelete)
                }
            }
        })

        await db.write()

        console.log(`Node ${idToDelete} deleted successfully`)
        return response.ok({
            message: `Node ${idToDelete} and all references removed successfully`,
            deletedNode: nodeToDelete
        })
    }

}

<template>
    <div id="tree" ref="tree"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import FamilyTree2 from '@balkangraph/familytree2.js'

const tree = ref(null)
const familyTreeInstance = ref(null)

const nodes = [
    { id: 1, name: 'Ayah', spouseIds: [2], motherId: 3, fatherId: 4 },
    { id: 2, name: 'Ibu' },
    { id: 3, name: 'Kakek' },
    { id: 4, name: 'Nenek' },
    { id: 5, name: 'Anak 1', motherId: 2, fatherId: 1 },
    { id: 6, name: 'Anak 2', motherId: 2, fatherId: 1 },
]

const mytree = (domEl, data) => {
    const ft = new FamilyTree2(domEl)
    ft.readOnly = false
    ft.addFamilyMembers(data).draw(1)
    familyTreeInstance.value = ft
}

onMounted(() => {
    if (tree.value) {
        mytree(tree.value, nodes)
    }
    // hapus watermark
    // setTimeout(() => {
    //     const svg = tree.value.querySelector('svg[width="195"][height="27"]')
    //     if (svg) svg.remove()
    // }, 500)
})
</script>

<style scoped>
#tree {
    width: 100%;
    height: 100vh;
    overflow: hidden;
}

html,
body,
#app {
    height: 100%;
    margin: 0;
    padding: 0;
}
</style>
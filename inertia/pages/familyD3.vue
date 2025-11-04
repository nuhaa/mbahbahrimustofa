<template>
    <div id="tree" ref="chartContainer" class="chart-container"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { OrgChart } from 'd3-org-chart'

const chartContainer = ref(null)

const nodes = [
    { id: 1, name: 'Kakek', positionName: 'Pensiunan' },
    { id: 2, name: 'Nenek', positionName: 'Ibu Rumah Tangga', spouseId: 1 },
    { id: 3, name: 'Ayah', positionName: 'Karyawan', parentId: 1 },
    { id: 4, name: 'Ibu', positionName: 'Guru', spouseId: 3 },
    { id: 5, name: 'Anak 1', positionName: 'Mahasiswa', parentId: 3 },
    { id: 6, name: 'Anak 2', positionName: 'SMA', parentId: 3 },
]

// 🔧 Gabungkan pasangan agar anak mengacu ke pasangan, bukan salah satu
function mergeCouples(data) {
    const merged = []
    const seen = new Set()

    for (const person of data) {
        if (seen.has(person.id)) continue

        const spouse = data.find((p) => p.spouseId === person.id || p.id === person.spouseId)

        if (spouse) {
            merged.push({
                id: person.id,
                name: `${person.name} ❤️ ${spouse.name}`,
                positionName: `${person.positionName} & ${spouse.positionName}`,
                parentId: person.parentId || spouse.parentId || null,
            })
            seen.add(person.id)
            seen.add(spouse.id)
        } else {
            merged.push({
                ...person,
                parentId: person.parentId || null,
            })
            seen.add(person.id)
        }
    }

    // Pastikan hanya 1 root
    const roots = merged.filter((p) => !p.parentId)
    if (roots.length > 1) {
        roots.slice(1).forEach((r) => (r.parentId = roots[0].id))
    }

    return merged
}

onMounted(() => {
    const data = mergeCouples(nodes)

    const chart = new OrgChart()
        .container(chartContainer.value)
        .data(data)
        .nodeWidth(() => 240)
        .nodeHeight(() => 120)
        .childrenMargin(() => 50)
        .compact(false)
        .nodeContent((d) => {
            return `
        <div style="width:${d.width}px;height:${d.height}px;display:flex;align-items:center;justify-content:center;">
          <div style="
            width:220px;
            min-height:100px;
            background:white;
            border:1px solid #ddd;
            border-radius:12px;
            box-shadow:0 2px 8px rgba(0,0,0,0.1);
            text-align:center;
            padding:10px;
            display:flex;
            flex-direction:column;
            justify-content:center;
            word-wrap:break-word;
          ">
            <div style='font-weight:bold;font-size:16px;color:#333;'>${d.data.name}</div>
            <div style='font-size:12px;color:#777;margin-top:5px;'>${d.data.positionName}</div>
          </div>
        </div>
      `
        })
        .render()
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
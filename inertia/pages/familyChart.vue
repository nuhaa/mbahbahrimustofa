<template>
  <div
    id="FamilyChart"
    ref="chartContainer"
    class="f3"
    style="width:100%;height:900px;margin:auto;background-color:rgb(33,33,33);color:#fff;"
  ></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as d3 from 'd3'
import * as f3 from 'family-chart'
import 'family-chart/styles/family-chart.css'

const props = defineProps({
  families: {
    type: Array,
    default: () => []
  }
})
const chartContainer = ref(null)

const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

const createChart = (data) => {
    const f3Chart = f3.createChart('#FamilyChart', data)
                        .setTransitionTime(1000)
                        .setCardXSpacing(250)
                        .setCardYSpacing(150)

    const f3Card = f3Chart.setCardHtml().setOnCardUpdate(function (d) {
        if (d.data._new_rel_data) return
        if (f3EditTree.isRemovingRelative()) return

        d3.select(this).select('.card').style('cursor', 'default')
        const card = this.querySelector('.card-inner')

        // Tombol Edit
        d3.select(card)
            .append('div')
            .attr('class', 'f3-svg-circle-hover')
            .attr(
                'style',
                'cursor: pointer; width: 20px; height: 20px; position: absolute; top: 0; right: 0;'
            )
            .html(f3.icons.userEditSvgIcon())
            .select('svg')
            .style('padding', '0')
            .on('click', (e) => {
                e.stopPropagation()
                f3EditTree.open(d.data)
                if (f3EditTree.isAddingRelative()) return
                if (f3EditTree.isRemovingRelative()) return
                f3Card.onCardClickDefault(e, d)
            })

        // Tombol Tambah
        d3.select(card)
            .append('div')
            .attr('class', 'f3-svg-circle-hover')
            .attr(
            'style',
            'cursor: pointer; width: 20px; height: 20px; position: absolute; top: 0; right: 23px;'
            )
            .html(f3.icons.userPlusSvgIcon())
            .select('svg')
            .style('padding', '0')
            .on('click', (e) => {
                e.stopPropagation()
                if (f3EditTree.isAddingRelative()) {
                    if (f3Chart.store.getMainDatum().id === d.data.id) {
                    f3EditTree.addRelativeInstance.onCancel()
                    } else {
                    f3EditTree.addRelativeInstance.onCancel()
                    f3EditTree.open(d.data)
                    f3Card.onCardClickDefault(e, d)
                    document.querySelector('.f3-add-relative-btn').click()
                    }
                } else {
                    f3EditTree.open(d.data)
                    f3Card.onCardClickDefault(e, d)
                    document.querySelector('.f3-add-relative-btn').click()
                }
            })
        })

    f3Card.setOnCardClick((e, d) => {
        if (f3EditTree.isAddingRelative()) {
            if (d.data._new_rel_data) {
                f3EditTree.open(d.data)
            } else {
                f3EditTree.addRelativeInstance.onCancel()
                f3EditTree.closeForm()
                f3Card.onCardClickDefault(e, d)
            }
        } else if (f3EditTree.isRemovingRelative()) {
            f3EditTree.open(d.data)
        } else {
            if (f3Chart.getMainDatum().id === d.data.id) {
                f3EditTree.open(d.data)
                f3Card.onCardClickDefault(e, d)
            } else {
                f3EditTree.closeForm()
                f3Card.onCardClickDefault(e, d)
            }
        }
    })

    const f3EditTree = f3Chart
        .editTree()
        .fixed(true)
        .setFields(['first name', 'last name', 'birthday', 'avatar'])
        .setEditFirst(true)

    f3EditTree.setEdit()
    // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(f3EditTree)).filter(prop => typeof f3EditTree[prop] === 'function'));
    f3EditTree.setPostSubmit(async (dataEdit, datas) => {
        console.log('Data yang diedit:', dataEdit);
        try {
            const response = await fetch('/families/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({ families: dataEdit }), // kirim semua data tree
            });
            const result = await response.json();
            if (!response.ok) {
                console.error('Gagal menyimpan data keluarga:', result);
                return;
            }
            console.log('Data keluarga berhasil disimpan:', result.message);
        } catch (err) {
            console.error('Error saat menyimpan data keluarga:', err);
        }
    });

    f3EditTree.setOnDelete(async (dataHapus, datas) => {
        console.log('Data yang dihapus:', dataHapus.id);
        try {
            const response = await fetch('/families/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({ id: dataHapus.id }), // kirim semua data tree
            });
            const result = await response.json();
            if (!response.ok) {
                console.error('Gagal menyimpan data keluarga:', result);
                return;
            }
            console.log('Data keluarga berhasil disimpan:', result.message);
            f3Chart.updateTree();
        } catch (err) {
            console.error('Error saat menyimpan data keluarga:', err);
        }
    })
    // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(f3EditTree)).filter(prop => typeof f3EditTree[prop] === 'function'));
    f3Chart.updateTree({ initial: true })
}

onMounted(() => {
    if (!props.families || props.families.length === 0) {
        console.warn('Data keluarga tidak ditemukan!')
        return
    }
    createChart(props.families)
})
</script>

<style scoped>
.f3 {
  overflow: hidden;
}
</style>

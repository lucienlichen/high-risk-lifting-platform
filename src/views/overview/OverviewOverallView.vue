<template>
  <div v-if="card" class="ov-overall">
    <header class="ov-sub">
      <button type="button" class="back" @click="back">← 返回部件模型</button>
      <b class="code">{{ card.code }}</b>
      <span class="muted">{{ card.type || '冶金桥式起重机' }}</span>
      <span class="sep"></span>
      <b>{{ PROF_NAME[prof] }}整体</b>
      <span class="overall-tag">专业整体</span>
      <span class="subtail">
        <label class="profsel">切换专业
          <select :value="prof" @change="changeProf">
            <option v-for="(name, key) in PROF_NAME" :key="key" :value="key">{{ name }}</option>
          </select>
        </label>
        <span>{{ prof === 'metal' ? '结构 · 健康状态由累积损伤度判定' : '机构 · 健康状态由监测指标判定' }}</span>
        <span>数据更新 2026-11-11 15:30</span>
      </span>
    </header>
    <nav class="ov-menu">
      <button v-for="item in menus" :key="item.key" type="button" :class="{ on: menu === item.key }" @click="setMenu(item.key)">{{ item.label }}</button>
      <span class="tail">{{ prof === 'metal' ? '结构类服务' : '机构类服务' }}</span>
    </nav>
    <main class="ov-main">
      <section class="panel">
        <div class="panelhead"><b>{{ table.title }}</b><span class="muted">{{ table.hint }}</span></div>
        <div class="toolbar">
          <label><input v-model="search" placeholder="搜索点位编号、名称或部件"></label>
          <div class="mini-legend"><span class="green">正常</span><span class="orange">异常</span><span class="red">报警</span></div>
        </div>
        <div class="tablewrap" ref="tableWrap">
          <table @click="onTable">
            <colgroup><col v-for="(width, index) in table.widths" :key="index" :style="{ width: `${width}px` }"></colgroup>
            <thead><tr><th v-for="header in table.headers" :key="header" v-html="header"></th></tr></thead>
            <tbody v-html="table.body"></tbody>
          </table>
        </div>
        <div class="tablefoot"><span>{{ table.footerLeft }}</span><span v-html="table.footerRight"></span></div>
      </section>
      <section class="panel">
        <div class="panelhead"><b>{{ PROF_NAME[prof] }}整体模型</b><span class="muted">点击点位定位</span></div>
        <div class="modellegend">
          <span><i class="dot green-bg"></i>正常</span>
          <span><i class="dot orange-bg"></i>异常</span>
          <span><i class="dot red-bg"></i>报警</span>
          <span class="typeleg">{{ prof === 'metal' ? '● 实测　○ 孪生' : '◌ 虚线为未接入' }}</span>
        </div>
        <div class="model" ref="modelHost"></div>
        <div class="pickinfo">
          <div class="name"><span class="pid">{{ pick.id }}</span>{{ pick.name }}<span class="status" :class="pick.tone">{{ TONE_TEXT[pick.tone] }}</span></div>
          <div class="route">{{ pick.route }}</div>
          <div class="values"><div v-for="item in pick.values" :key="item[0]"><small>{{ item[0] }}</small><b>{{ item[1] }}<em>{{ item[2] }}</em></b></div></div>
          <div class="conclusion">{{ pick.conclusion }}</div>
          <a v-if="pick.link === 'point'" href="#" @click.prevent="goPoint(pick.id)">进入点位详情 ›</a>
          <a v-else-if="pick.link === 'structure'" href="#" title="示意：只有 ML-01～ML-10 在点位页有数据" @click.prevent="goPoint()">进入点位详情 ›</a>
          <a v-else href="#" title="机构点位详情沿用现网" @click.prevent>进入点位详情 ›</a>
        </div>
      </section>
      <aside class="panel">
        <div class="panelhead"><b>数据分析</b><span class="selected-tag">{{ pick.id }} · {{ pick.name }}</span></div>
        <div id="analysis" ref="analysisHost"></div>
      </aside>
    </main>
  </div>
  <el-empty v-else description="没有这台设备" />
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePartsDevice } from '@/composables/usePartsDevice'
import { paintAnalysis, paintModel } from '@/components/profession/professionDraw'
import {
  PROF_NAME, TONE_TEXT, buildTable, defaultPid, describePick, isProf, pointsOf,
  type MenuKey, type Prof
} from '@/components/profession/professionOverall'
import '@/styles/profession-overall.css'

const { card, query, route, router } = usePartsDevice()
const prof = ref<Prof>('metal')
const menu = ref<MenuKey>('health')
const pid = ref('')
const search = ref('')
const modelHost = ref<HTMLElement | null>(null)
const analysisHost = ref<HTMLElement | null>(null)
const tableWrap = ref<HTMLElement | null>(null)
const menus = computed(() => prof.value === 'metal'
  ? [{ key: 'health' as MenuKey, label: '健康评估' }, { key: 'crack' as MenuKey, label: '裂纹预测' }, { key: 'damage' as MenuKey, label: '损伤识别' }]
  : [{ key: 'health' as MenuKey, label: '健康评估' }, { key: 'diag' as MenuKey, label: '故障诊断' }, { key: 'life' as MenuKey, label: '剩余寿命' }])
const table = computed(() => buildTable(prof.value, menu.value, search.value, pid.value))
const pick = computed(() => describePick(prof.value, menu.value, pid.value || defaultPid(prof.value)))

function readRoute() {
  const nextProf = typeof route.query.prof === 'string' && isProf(route.query.prof) ? route.query.prof : 'metal'
  const allowed = nextProf === 'metal' ? ['health', 'crack', 'damage'] : ['health', 'diag', 'life']
  const requestedMenu = typeof route.query.menu === 'string' ? route.query.menu : 'health'
  const nextMenu = (allowed.includes(requestedMenu) ? requestedMenu : 'health') as MenuKey
  const requested = typeof route.query.pt === 'string' ? route.query.pt : ''
  const nextPid = pointsOf(nextProf).some(point => point.id === requested) ? requested : defaultPid(nextProf)
  prof.value = nextProf
  menu.value = nextMenu
  pid.value = nextPid
}
function writeRoute() {
  if (route.query.prof === prof.value && route.query.menu === menu.value && route.query.pt === pid.value) return
  router.replace({ query: { ...route.query, prof: prof.value, menu: menu.value, pt: pid.value } })
}
watch(() => [route.query.prof, route.query.menu, route.query.pt], readRoute, { immediate: true })

function back() {
  router.push({ name: 'overviewParts', params: { id: String(route.params.id || '') }, query: { ...query.value } })
}
function changeProf(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (!isProf(value) || value === prof.value) return
  prof.value = value
  menu.value = 'health'
  pid.value = defaultPid(value)
  search.value = ''
  writeRoute()
}
function setMenu(next: MenuKey) {
  if (menu.value === next) return
  menu.value = next
  writeRoute()
}
function selectPoint(id: string) {
  if (pid.value === id) return
  pid.value = id
  writeRoute()
}
function onTable(event: MouseEvent) {
  const row = (event.target as HTMLElement).closest('tr.pt')
  const id = row?.getAttribute('data-pid')
  if (id) selectPoint(id)
}
function goPoint(id = '') {
  router.push({
    name: 'overviewPoint',
    params: { id: String(route.params.id || '') },
    query: { ...query.value, side: 'structure', specialty: '金属结构', part: '单双主梁', mode: 'structure', ...(id ? { pid: id } : {}) }
  })
}

let frame = 0
async function redraw() {
  await nextTick()
  if (modelHost.value) paintModel(modelHost.value, prof.value, pid.value, selectPoint)
  cancelAnimationFrame(frame)
  const drawCharts = () => { if (analysisHost.value) paintAnalysis(analysisHost.value, prof.value, menu.value, pid.value) }
  frame = requestAnimationFrame(() => requestAnimationFrame(drawCharts))
  await nextTick()
  tableWrap.value?.querySelector('tr.sel')?.scrollIntoView({ block: 'nearest' })
}
watch([prof, menu, pid], redraw)
onMounted(() => { redraw(); window.addEventListener('resize', redraw) })
onBeforeUnmount(() => { cancelAnimationFrame(frame); window.removeEventListener('resize', redraw) })
</script>

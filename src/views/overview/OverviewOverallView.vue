<template>
  <div v-if="card" class="ov-overall is-summary">
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
        <span>{{ prof === 'metal' ? '结构 · 健康状态由累积损伤度判定' : prof === 'hoist' ? '机构 · 健康状态由监测指标判定' : '该专业汇总字段待完善' }}</span>
        <span>数据更新 2026-11-11 15:30</span>
      </span>
    </header>
    <DeviceMenuBar active="health" :device-id="String(route.params.id || '')" />
    <main class="ov-main">
      <section v-if="prof === 'metal' || prof === 'hoist'" class="panel">
        <div class="panelhead"><b>汇总排序表</b><span class="muted">点击列名排序，点击行进入点位。不重复模型和服务曲线。</span></div>
        <div class="tablewrap">
          <table>
            <thead>
              <tr v-if="prof === 'metal'">
                <th>序号</th>
                <th><button type="button" @click="sortBy('id')">点位编号</button></th>
                <th><button type="button" @click="sortBy('loc')">位置</button></th>
                <th><button type="button" @click="sortBy('D')">累计损伤度 D</button></th>
                <th>健康状态</th>
                <th><button type="button" @click="sortBy('L')">裂纹预测剩余年限 / 年</button></th>
                <th>声发射结论</th>
                <th>涡流结论</th>
                <th>全局状态</th>
              </tr>
              <tr v-else>
                <th>序号</th>
                <th><button type="button" @click="sortBy('id')">点位编号</button></th>
                <th><button type="button" @click="sortBy('name')">位置</button></th>
                <th><button type="button" @click="sortBy('rms')">有效值 / g</button></th>
                <th><button type="button" @click="sortBy('kurtosis')">峭度</button></th>
                <th><button type="button" @click="sortBy('severity')">振动烈度 / mm/s</button></th>
                <th>轴承预测剩余寿命 / h</th>
                <th>全局状态</th>
              </tr>
            </thead>
            <tbody v-if="prof === 'metal'">
              <tr v-for="(point, index) in structureRows" :key="point.id" class="pt" @click="openPoint(point.id, 'structure')">
                <td>{{ index + 1 }}</td>
                <td>{{ point.id }}</td>
                <td class="tleft">{{ point.loc }}</td>
                <td>{{ point.D.toFixed(2) }}</td>
                <td><span class="status" :class="point.healthTone">{{ point.health }}</span></td>
                <td>{{ point.L.toFixed(1) }}</td>
                <td class="wrap">{{ point.ae }}</td>
                <td>未发现裂纹</td>
                <td><span class="status" :class="point.status">{{ point.globalName }}</span></td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr v-for="(point, index) in mechanismRows" :key="point.id" class="pt" @click="openPoint(point.id, 'mechanism')">
                <td>{{ index + 1 }}</td>
                <td>{{ point.id }}</td>
                <td class="tleft">{{ point.name }}</td>
                <td>{{ point.rms.toFixed(1) }}</td>
                <td>{{ point.kurtosis.toFixed(1) }}</td>
                <td>{{ point.severity.toFixed(1) }}</td>
                <td class="wrap">{{ point.life }}</td>
                <td><span class="status" :class="point.status">{{ point.globalName }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="tablefoot"><span>{{ prof === 'metal' ? 'D＜0.7 健康；0.7≤D＜1 亚健康。健康等级不等于全局状态。D≥1 不取样。' : '寿命只给轴承测点。不使用结构损伤度或裂纹年限。' }}</span><span>演示数据</span></div>
      </section>
      <section v-else class="panel">
        <div class="panelhead"><b>{{ PROF_NAME[prof] }}整体</b></div>
        <p class="ov-empty-note">该专业汇总字段待完善。保留整体入口，不套用结构损伤或轴承寿命。</p>
      </section>
    </main>
  </div>
  <el-empty v-else description="没有这台设备" />
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DeviceMenuBar from '@/components/overview/DeviceMenuBar.vue'
import { usePartsDevice } from '@/composables/usePartsDevice'
import { BEARING_DEMO } from '@/mock/mechanismPointDetail'
import { featureBase, MECH_POINTS, statusName as mechStatusName } from '@/mock/mechanismPointDetail'
import { AE_QUIET, STRUCTURE_POINTS, gradeOf, statusName as structureStatusName } from '@/mock/structurePointDetail'
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
const sortKey = ref('')
const sortDir = ref<1 | -1>(1)
const structureRows = computed(() => {
  const rows = STRUCTURE_POINTS.map(point => {
    const grade = gradeOf(point.D)
    return { ...point, health: grade.name, healthTone: grade.key, ae: point.aeActive ? '存在活跃扩展迹象' : AE_QUIET, globalName: structureStatusName(point.status) }
  })
  return sortRows(rows)
})
const mechanismRows = computed(() => {
  const rows = MECH_POINTS.map(point => {
    const base = featureBase(point)
    return { ...point, ...base, life: point.bearing ? `${BEARING_DEMO.ci[1]}（CI 末项，演示）` : '—', globalName: mechStatusName(point.status) }
  })
  return sortRows(rows)
})
function sortRows<T extends Record<string, unknown>>(rows: T[]) {
  if (!sortKey.value) return rows
  const key = sortKey.value
  return [...rows].sort((a, b) => {
    const left = a[key]
    const right = b[key]
    const diff = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'zh-CN')
    return diff * sortDir.value
  })
}
function sortBy(key: string) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 1 ? -1 : 1
  else { sortKey.value = key; sortDir.value = -1 }
}
function openPoint(id: string, side: 'structure' | 'mechanism') {
  router.push({ name: 'overviewPoint', params: { id: String(route.params.id || '') }, query: { ...query.value, side, pid: id } })
}
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

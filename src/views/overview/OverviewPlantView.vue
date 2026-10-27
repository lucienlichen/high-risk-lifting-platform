<template>
  <div class="ov-split">
    <aside class="ov-tree" aria-label="公司与厂区">
      <div class="ov-tree-caption">公司与厂区</div>
      <div class="ov-scene-chip">{{ sceneChip }}</div>
      <template v-for="group in tree" :key="group.id">
        <button type="button" class="ov-tree-btn depth-group" :class="{ active: isGroupActive(group) }" @click="select(group.enterprise, '')">
          <span class="name" :title="group.label">{{ group.label }}</span>
          <span class="ov-badges"><span>{{ group.total }}</span></span>
        </button>
        <template v-if="openGroups.has(group.enterprise)">
          <p v-if="group.hint" class="ov-hint">{{ group.hint }}</p>
          <template v-if="group.sector">
            <button type="button" class="ov-tree-btn depth-sector" :class="{ active: !unit && enterprise === group.enterprise }" @click="select(group.enterprise, '')">
              <span class="name" :title="group.sector">{{ group.sector }}</span>
              <span class="ov-badges">
                <span v-if="group.abnormal" class="ov-badge red">{{ group.abnormal }}</span>
                <span>{{ group.total }}</span>
              </span>
            </button>
          </template>
          <button
            v-for="item in group.units"
            :key="item.unit"
            type="button"
            class="ov-tree-btn depth-unit"
            :class="{ active: unit === item.unit && enterprise === group.enterprise }"
            @click="select(group.enterprise, item.unit)"
          >
            <span class="name" :title="item.unit">{{ item.unit }}</span>
            <span class="ov-badges">
              <span v-if="item.abnormal" class="ov-badge red">{{ item.abnormal }}</span>
              <span>{{ item.total }}</span>
            </span>
          </button>
        </template>
      </template>
    </aside>
    <main class="ov-main">
      <section class="ov-section-head">
        <div class="ov-scope">
          <nav aria-label="位置">{{ crumb }}</nav>
          <h1>{{ scopeName }} <span>{{ scopeCards.length }} 台设备</span></h1>
        </div>
        <div class="ov-tools">
          <label class="ov-search">
            <span class="ov-sr">搜索设备编号或位置</span>
            <input v-model="q" type="search" placeholder="设备编号 / 位置" />
          </label>
          <div class="ov-toggle" role="group" aria-label="卡片信息量">
            <button type="button" :class="{ active: !brief }" @click="brief = false">详细</button>
            <button type="button" :class="{ active: brief }" @click="brief = true">精简</button>
          </div>
          <div class="ov-toggle" role="group" aria-label="显示方式">
            <button type="button" :class="{ active: view === 'cards' }" @click="view = 'cards'">卡片</button>
            <button type="button" :class="{ active: view === 'plan' }" @click="view = 'plan'">厂区平面图</button>
          </div>
        </div>
      </section>
      <section class="ov-chips" role="group" aria-label="按状态筛选">
        <button v-for="chip in chips" :key="chip.id" type="button" class="ov-chip" :class="[`is-${chip.id === 'all' ? 'all' : chip.id}`, { ['active-' + chip.id]: stateFilter === chip.id }]" @click="stateFilter = chip.id; limit = 40">
          <span class="dot"></span>{{ chip.label }}<b>{{ chip.n }}</b>
        </button>
        <span class="ov-chip-split"></span>
        <button v-for="chip in runChips" :key="chip.id" type="button" class="ov-chip" :class="[`is-${chip.id}`, { ['active-' + chip.id]: runFilter === chip.id }]" @click="toggleRun(chip.id)">
          <span class="dot"></span>{{ chip.label }}<b>{{ chip.n }}</b>
        </button>
        <span class="ov-chip-note">异常设备自动排在最前</span>
      </section>

      <template v-if="view === 'cards'">
        <section class="ov-grid" aria-label="设备卡片">
          <OverviewDeviceCard v-for="card in visible" :key="card.id" :card="card" :brief="brief" @open="open(card.id)" />
        </section>
        <button v-if="filtered.length > limit" type="button" class="ov-more" @click="limit += 40">显示更多（还有 {{ filtered.length - limit }} 台）</button>
        <p v-if="!filtered.length" class="ov-empty">没有符合条件的设备</p>
      </template>

      <p v-else-if="!unit" class="ov-plan-need">平面图按厂区显示，请在左侧选择一个厂区</p>
      <section v-else class="ov-plan">
        <div class="ov-section-head">
          <h2>{{ scopeName }}平面布置 · 点击起重机查看设备卡片</h2>
          <span class="ov-legend">
            <span><i class="ov-swatch" style="background:#f5222d"></i> 异常</span>
            <span><i class="ov-swatch" style="background:#c7d4e5"></i> 正常</span>
            <span><i class="ov-swatch" style="background:#fff;border:1px dashed #64748b"></i> 离线</span>
            <span><i class="ov-swatch" style="background:#c7d4e5;box-shadow:inset 0 0 0 2px #1677ff"></i> 作业中</span>
          </span>
        </div>
        <div class="ov-baybox">
          <div v-for="bay in bays" :key="bay.name" class="ov-bay">
            <span class="ov-bay-name"><b>{{ bay.name }}</b><span>{{ bay.cards.length }} 台</span></span>
            <span class="ov-trackbed">
              <span class="ov-rail top"></span>
              <span class="ov-rail bot"></span>
              <button
                v-for="(crane, index) in bay.cards"
                :key="crane.id"
                type="button"
                class="ov-plan-crane"
                :class="[`is-${crane.state}`, { 'is-run': crane.run === 'running', dim: !match(crane), sel: selectedId === crane.id }]"
                :style="craneStyle(index, bay.cards.length)"
                :title="crane.code"
                @click="selectedId = selectedId === crane.id ? '' : crane.id"
              >{{ bay.cards.length <= 18 ? crane.code.slice(-4) : '' }}</button>
              <div v-if="bayPop(bay)" class="ov-pop">
                <OverviewDeviceCard :card="bayPop(bay)!" :brief="brief" @open="open(bayPop(bay)!.id)" />
              </div>
            </span>
          </div>
        </div>
        <p class="ov-footnote">示意布局：每一行是台账里的一个使用地点，竖条是该地点的起重机。没有坐标，不能当成厂区 CAD。</p>
      </section>
      <p class="ov-footnote">编号来自设备台账，悬停可看类型、额定起重量和位置。异常 = 结构、机构或其他预警，或定期检验已超期。吊重次数为演示派生值。</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OverviewDeviceCard from '@/components/overview/OverviewDeviceCard.vue'
import {
  BENGANG,
  SHAGANG,
  YONGGANG,
  enterpriseLabel,
  getOverviewCards,
  legalHint,
  rollupUnits,
  sortCards,
  worstUnit,
  type CardState,
  type OverviewCard,
  type RunState
} from '@/mock/overviewDemo'
import { overviewAccessOf, useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const all = getOverviewCards()
const access = computed(() => overviewAccessOf(auth))
const q = ref('')
const brief = ref(false)
const view = ref<'cards' | 'plan'>('cards')
const stateFilter = ref<'all' | CardState>('all')
const runFilter = ref<'all' | RunState>('all')
const limit = ref(40)
const selectedId = ref('')
const openGroups = ref(new Set<string>())

const allowed = computed(() => {
  const current = access.value
  if (current.kind === 'factory') return all.filter(card => card.enterprise === current.enterprise && card.unit === current.unit)
  if (current.kind === 'group') return all.filter(card => card.enterprise === current.enterprise)
  return all
})

const enterprise = computed(() => {
  const current = access.value
  if (current.kind === 'factory' || current.kind === 'group') return current.enterprise || BENGANG
  const value = String(route.query.enterprise || '')
  if (value === BENGANG || value === YONGGANG || value === SHAGANG) return value
  return BENGANG
})
const unit = computed(() => access.value.kind === 'factory' ? (access.value.unit || '') : String(route.query.unit || ''))

watch([enterprise, unit, access], () => {
  openGroups.value = new Set([enterprise.value])
  const queryEnterprise = String(route.query.enterprise || '')
  const queryUnit = String(route.query.unit || '')
  const nextUnit = unit.value || worstUnit(allowed.value, enterprise.value)
  if (queryEnterprise !== enterprise.value || (access.value.kind === 'factory' && queryUnit !== unit.value) || (!queryUnit && access.value.kind !== 'factory')) {
    router.replace({ name: 'overviewPlant', query: { enterprise: enterprise.value, unit: nextUnit } })
  }
}, { immediate: true })

const tree = computed(() => {
  const ids = access.value.kind === 'super' ? [BENGANG, YONGGANG, SHAGANG] : [enterprise.value]
  return ids.map(id => {
    const cards = allowed.value.filter(card => card.enterprise === id)
    const plateOrder = ['冷轧厂', '原料厂', '热连轧厂', '炼铁厂', '特钢厂', '炼钢厂', '能源总厂（供水系统）', '储运（板材区域）', '焦化厂', '冶金渣公司', '发电', '废钢厂', '能源总厂（燃气系统）', '铁运公司']
    const units = rollupUnits(cards).sort((a, b) => {
      if (a.unit === '待归属') return 1
      if (b.unit === '待归属') return -1
      if (id === BENGANG) return plateOrder.indexOf(a.unit) - plateOrder.indexOf(b.unit)
      return b.abnormal - a.abnormal || b.total - a.total || a.unit.localeCompare(b.unit, 'zh-CN')
    })
    return {
      id,
      enterprise: id,
      label: enterpriseLabel(id),
      sector: id === BENGANG ? '板材板块' : '',
      hint: legalHint(id),
      total: cards.length,
      abnormal: cards.filter(card => card.state === 'abnormal').length,
      units
    }
  }).filter(group => group.total > 0)
})

const scopeCards = computed(() => allowed.value.filter(card => card.enterprise === enterprise.value && (!unit.value || card.unit === unit.value)))
const searched = computed(() => {
  const keyword = q.value.trim()
  if (!keyword) return scopeCards.value
  return scopeCards.value.filter(card => card.code.includes(keyword) || card.location.includes(keyword) || card.unit.includes(keyword) || card.name.includes(keyword))
})
const counts = computed(() => {
  const base = { all: searched.value.length, abnormal: 0, normal: 0, off: 0, running: 0, stopped: 0 }
  searched.value.forEach(card => {
    base[card.state] += 1
    if (card.run) base[card.run] += 1
  })
  return base
})
const chips = computed(() => [
  { id: 'all' as const, label: '全部', n: counts.value.all },
  { id: 'abnormal' as const, label: '异常', n: counts.value.abnormal },
  { id: 'normal' as const, label: '正常', n: counts.value.normal },
  { id: 'off' as const, label: '离线', n: counts.value.off }
])
const runChips = computed(() => [
  { id: 'running' as const, label: '作业中', n: counts.value.running },
  { id: 'stopped' as const, label: '停机', n: counts.value.stopped }
])
const filtered = computed(() => sortCards(searched.value.filter(card => {
  const stateOk = stateFilter.value === 'all' || card.state === stateFilter.value
  const runOk = runFilter.value === 'all' || card.run === runFilter.value
  return stateOk && runOk
})))
const visible = computed(() => filtered.value.slice(0, limit.value))
const scopeName = computed(() => unit.value || (enterprise.value === BENGANG ? '板材板块' : enterpriseLabel(enterprise.value)))
const crumb = computed(() => [enterpriseLabel(enterprise.value), enterprise.value === BENGANG ? '板材板块' : '', unit.value].filter(Boolean).join(' / '))
const sceneChip = computed(() => {
  if (access.value.kind === 'factory') return `冶金场景 · ${unit.value}`
  if (access.value.kind === 'group') return `冶金场景 · ${enterpriseLabel(enterprise.value)}`
  return '冶金场景 · 全部公司'
})

const bays = computed(() => {
  const map = new Map<string, OverviewCard[]>()
  scopeCards.value.forEach(card => {
    const key = card.location || '未填地点'
    const list = map.get(key) ?? []
    list.push(card)
    map.set(key, list)
  })
  let rows = [...map.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'zh-CN'))
  if (rows.length > 6) {
    const rest = rows.slice(5).flatMap(([, list]) => list)
    rows = [...rows.slice(0, 5), ['其他地点', rest]]
  }
  return rows.map(([name, cards]) => ({ name, cards: sortCards(cards) }))
})

function isGroupActive(group: { enterprise: string }) {
  return enterprise.value === group.enterprise && !unit.value
}
function select(nextEnterprise: string, nextUnit: string) {
  openGroups.value = new Set(openGroups.value).add(nextEnterprise)
  selectedId.value = ''
  limit.value = 40
  router.push({ name: 'overviewPlant', query: { enterprise: nextEnterprise, unit: nextUnit } })
}
function toggleRun(id: RunState) {
  runFilter.value = runFilter.value === id ? 'all' : id
  limit.value = 40
}
function match(card: OverviewCard) {
  const keyword = q.value.trim()
  const hit = !keyword || card.code.includes(keyword) || card.location.includes(keyword)
  const stateOk = stateFilter.value === 'all' || card.state === stateFilter.value
  const runOk = runFilter.value === 'all' || card.run === runFilter.value
  return hit && stateOk && runOk
}
function craneStyle(index: number, count: number) {
  const width = Math.min(5.5, 70 / Math.max(count, 1))
  const center = (index + 0.5) / count * 100
  return { left: `${center - width / 2}%`, width: `${width}%` }
}
function bayPop(bay: { cards: OverviewCard[] }) {
  return bay.cards.find(card => card.id === selectedId.value) || null
}
function open(id: string) {
  router.push({ name: 'overviewDevice', params: { id }, query: { enterprise: enterprise.value, unit: unit.value } })
}
</script>

<style scoped>
.ov-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.ov-legend span { display: inline-flex; align-items: center; gap: 5px; }
</style>

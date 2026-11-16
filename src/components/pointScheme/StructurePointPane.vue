<template>
  <div class="spd">
    <p class="spd-note">
      本页为交互示意，数值均为<b>演示数据</b>，非实时监测。时刻按 <b>America/Araguaina（UTC-3）</b> 显示。健康评估：<b>D＜0.7 健康</b>，<b>0.7≤D＜1 亚健康</b>；<b>D＝1 及以上分级待核</b>。全局状态仍为「正常 / 异常 / 报警」，与损伤度分级分开。报警记录为独立事件，不由损伤度阈值生成。
    </p>
    <div class="spd-main">
      <aside class="spd-left">
        <section class="spd-card spd-table">
          <div class="spd-hd">
            <div class="spd-hd-top">
              <span class="spd-title">点位表</span>
              <span class="spd-meta">共 {{ summary.total }} 个 · 异常 {{ summary.warn }} · 报警 {{ summary.alarm }}</span>
            </div>
            <div class="spd-tools">
              <input v-model="query" type="search" placeholder="搜索编号或位置" aria-label="搜索点位">
              <label><input v-model="onlyBad" type="checkbox">仅看异常/报警</label>
            </div>
          </div>
          <div class="spd-colhd"><span>编号</span><span>位置</span><span>状态</span></div>
          <div class="spd-body">
            <p v-if="!groups.length" class="spd-empty">{{ onlyBad ? '当前没有异常或报警点位' : '没有匹配的点位' }}</p>
            <template v-for="group in groups" :key="group.beam">
              <div class="spd-grp">{{ group.beam }} <span>{{ group.rows.length }} 个</span></div>
              <button
                v-for="row in group.rows"
                :key="row.id"
                type="button"
                class="spd-row"
                :class="{ sel: row.id === active.id }"
                @click="pick(row.id)"
                @mouseenter="crane?.applyHover(row.id)"
                @mouseleave="crane?.applyHover(null)"
              >
                <span class="id">{{ row.id }}</span>
                <span class="loc">{{ row.loc }}</span>
                <span class="spd-status" :class="row.status">{{ statusName(row.status) }}</span>
              </button>
            </template>
          </div>
          <div class="spd-foot">
            <span>生成点已统一，不再区分来源</span>
            <button type="button" @click="openAlarms">查看报警记录（{{ alarms.length }}）</button>
          </div>
        </section>
      </aside>

      <section class="spd-mid">
        <section class="spd-card spd-model">
          <div class="spd-mid-hd">
            <span class="spd-title">结构模型</span>
            <span class="spd-badge">模型示意</span>
            <span class="sub">单双主梁桥机 · 非真实三维模型 · 非计算结果</span>
            <div class="spd-seg" aria-label="模型显示">
              <button type="button" :class="{ on: modelMode === 'model' }" @click="modelMode = 'model'">模型</button>
              <button type="button" :class="{ on: modelMode === 'cloud' }" @click="modelMode = 'cloud'">应力云图</button>
            </div>
          </div>
          <StructureCraneModel ref="crane" :mode="modelMode" :point-id="active.id" @select="pick" />
          <div class="spd-mid-ft">
            <div>当前点位 <span class="pn">{{ active.id }}</span>　{{ active.loc }}　状态 <span class="spd-status" :class="active.status">{{ statusName(active.status) }}</span></div>
            <div class="hint">点击模型点位或左侧表格可切换 · 点位颜色表示全局状态（正常 / 异常 / 报警）</div>
          </div>
        </section>
      </section>

      <aside class="spd-right" aria-label="分析服务">
        <button
          v-for="card in cards"
          :key="card.id"
          type="button"
          class="spd-svc"
          :class="{ abn: card.abnormal, wait: card.pending }"
          @click="openService(card.id)"
        >
          <div class="top">
            <span class="name">{{ card.name }}</span>
            <span class="spd-status" :class="[card.badgeTone, card.badge.length > 8 ? 'is-long' : '']">{{ card.badge }}</span>
          </div>
          <div class="spd-kpis">
            <div v-for="kpi in card.kpis" :key="kpi.label" class="spd-kpi">
              <span class="lab">{{ kpi.label }}</span>
              <span class="val" :class="[kpi.small ? 'sm' : '', kpi.tone || '']">{{ kpi.value }}</span>
            </div>
          </div>
          <div v-if="card.bar != null" class="spd-dbar" title="对照 0.7 的阅读示意，不是报警线">
            <div class="spd-dbar-track">
              <div class="spd-dbar-fill" :style="{ width: card.bar + '%' }"></div>
              <div class="spd-dbar-mark"></div>
            </div>
            <div class="spd-dbar-labs"><span>0</span><span class="l7">0.7</span><span>1</span></div>
            <div class="spd-dbar-note">对照 0.7 的阅读示意，不是报警线</div>
          </div>
          <div v-if="card.note" class="spd-ex">{{ card.note }}</div>
          <div class="spd-concl">{{ card.conclusion }}</div>
          <div class="spd-go">查看图表与记录</div>
        </button>
      </aside>
    </div>

    <div v-if="toast" class="spd-toast" role="status">{{ toast }}</div>

    <div v-if="modal" class="spd-mask" @click.self="closeModal">
      <div class="spd-modal" role="dialog" aria-modal="true" :aria-labelledby="'spd-title'" @click.stop>
        <div class="spd-mhd">
          <span id="spd-title" class="mt">{{ serviceName(modal) }}</span>
          <span class="ms">{{ active.id }}　{{ active.loc }}　全局状态 {{ statusName(active.status) }}　·　演示数据</span>
          <label>切点
            <select :value="active.id" aria-label="切换点位" @change="onPointChange">
              <option v-for="point in points" :key="point.id" :value="point.id">{{ point.id }}　{{ point.loc }}</option>
            </select>
          </label>
          <button ref="closeBtn" type="button" class="spd-x" title="关闭（Esc）" @click="closeModal">✕</button>
        </div>
        <div class="spd-banner" :class="banner.kind">
          <div v-html="banner.html"></div>
          <button v-if="banner.action === 'now'" type="button" class="backnow" @click="returnCurrent">返回当前</button>
          <button v-else-if="banner.action === 'reset'" type="button" class="resetq" @click="resetRange">恢复当前时段</button>
        </div>
        <div class="spd-mtabs">
          <button type="button" :class="{ on: view === 'current' }" @click="returnCurrent">当前</button>
          <button type="button" :class="{ on: view === 'alarm' }" @click="showAlarmTab">报警记录</button>
        </div>
        <div class="spd-mbody">
          <aside class="spd-mside">
            <div class="spd-conclbox">
              <div class="k">{{ copy.head }}</div>
              <div class="v">{{ copy.body }}</div>
              <div v-if="copy.sub" class="s">{{ copy.sub }}</div>
            </div>
            <div class="spd-hint">依据：{{ copy.basis }}</div>
            <div class="spd-qbox">
              <div class="k">时间范围查询</div>
              <div class="spd-hint">时区：{{ tz }}。查询只过滤本弹窗内的演示曲线和记录。</div>
              <div class="spd-qrow"><label for="spd-from">开始</label><input id="spd-from" v-model="draftFrom" type="datetime-local" :disabled="modal === 'eddy'"></div>
              <div class="spd-qrow"><label for="spd-to">结束</label><input id="spd-to" v-model="draftTo" type="datetime-local" :disabled="modal === 'eddy'"></div>
              <div class="spd-qact"><button type="button" :disabled="modal === 'eddy'" @click="runQuery">查询</button></div>
              <div class="spd-hint">{{ modal === 'eddy' ? '本示意不提供裂纹长度或大小曲线，时间查询不适用。' : queryHint }}</div>
            </div>
          </aside>
          <div class="spd-mmain">
            <template v-if="evidence.kind === 'list' || evidence.kind === 'redirect'">
              <div v-if="evidence.kind === 'redirect'" class="spd-pending">
                <b>该报警记录对应「损伤活性诊断」</b>
                <span>健康评估与裂纹预测不把损伤度阈值记为报警。可打开损伤活性诊断回看该时段。</span>
                <button type="button" class="spd-jump" @click="modal = 'ae'">打开损伤活性诊断回看</button>
              </div>
              <p class="spd-hint">报警记录是独立事件。本示意仅列出损伤活性诊断（声发射）异常事件，不会把损伤度 D 的阈值写成报警。点击一条记录后，会定位到该点位、打开对应服务，并回看该时段数据。</p>
              <div class="spd-alist">
                <button v-for="alarm in alarms" :key="alarm.id" type="button" class="spd-aitem" :class="{ on: alarm.id === alarmId }" @click="selectAlarm(alarm.id)">
                  <div class="t"><span class="id">{{ alarm.id }}</span><span class="spd-status" :class="alarm.level">{{ statusName(alarm.level) }}</span></div>
                  <div class="d">{{ alarm.title }}</div>
                  <div class="m">{{ alarm.pid }}　{{ pointLoc(alarm.pid) }}　·　损伤活性诊断　·　{{ fmtRange(alarm.from, alarm.to) }}（{{ tz }}）</div>
                </button>
              </div>
            </template>
            <div v-else-if="evidence.kind === 'note'" class="spd-eddy-note">
              <b>该位置未发现裂纹</b>
              <span>本能力为柔性涡流阵列，用于判别裂纹长度与大小。本示意不给出裂纹长度、大小，也不绘制阻抗平面或相位曲线。</span>
            </div>
            <template v-else>
              <article v-for="chart in evidence.charts" :key="chart.key" class="spd-chartblock">
                <div class="spd-ctitle">{{ chart.title }}<span class="spd-demo">演示数据</span></div>
                <div class="spd-cdesc">{{ chart.desc }}</div>
                <SchemeChart class="spd-cg" :option="chart.option" />
              </article>
              <div class="spd-rec">
                <div class="rh"><span>{{ evidence.recordsTitle }}</span><span>演示数据</span></div>
                <div v-if="!evidence.records.length" class="spd-empty">该时段没有可展示的记录</div>
                <div v-else class="scroll">
                  <table>
                    <thead><tr><th>时间（{{ tz }}）</th><th>项目</th><th>数值</th><th>说明</th></tr></thead>
                    <tbody>
                      <tr v-for="(row, index) in evidence.records" :key="index" :class="{ hit: row.hit }">
                        <td>{{ fmtDT(row.t) }}</td>
                        <td>{{ row.item }}</td>
                        <td>{{ row.val }}</td>
                        <td>{{ recordNote(row) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SchemeChart from '@/components/pointScheme/SchemeChart.vue'
import StructureCraneModel from '@/components/pointScheme/StructureCraneModel.vue'
import { evidenceFor, recordNote } from '@/components/pointScheme/structureCharts'
import {
  ALARMS, CUR_FROM, CUR_TO, SERVICES, STRUCTURE_POINTS, TZ,
  DEMO_AS_OF, fmtDT, fmtRange, groupedPoints, modalConclusion, parseDT, pointSummary, serviceCards, statusName, structurePoint,
  type ModalView, type ModelMode, type SvcId
} from '@/mock/structurePointDetail'

const props = defineProps<{ pointId: string }>()
const emit = defineEmits<{ select: [id: string] }>()

const crane = ref<{ applyHover: (id: string | null) => void } | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
const activeId = ref(props.pointId)
const query = ref('')
const onlyBad = ref(false)
const modelMode = ref<ModelMode>('model')
const modal = ref<SvcId | null>(null)
const view = ref<ModalView>('current')
const alarmId = ref<string | null>(null)
const tFrom = ref(CUR_FROM)
const tTo = ref(CUR_TO)
const draftFrom = ref(CUR_FROM)
const draftTo = ref(CUR_TO)
const queried = ref(false)
const queryHint = ref('')
const toast = ref('')
let toastTimer = 0

const points = STRUCTURE_POINTS
const alarms = ALARMS
const tz = TZ
const summary = pointSummary()
const active = computed(() => structurePoint(activeId.value))
const groups = computed(() => groupedPoints(query.value, onlyBad.value))
const cards = computed(() => serviceCards(active.value))
const selectedAlarm = computed(() => alarms.find(item => item.id === alarmId.value) || null)
const copy = computed(() => modal.value ? modalConclusion(modal.value, active.value, view.value, selectedAlarm.value) : { head: '', body: '', sub: '', basis: '' })
const evidence = computed(() => evidenceFor(modal.value || 'health', active.value, tFrom.value, tTo.value, view.value, selectedAlarm.value))
const banner = computed(() => {
  if (view.value === 'alarm' && selectedAlarm.value) {
    const alarm = selectedAlarm.value
    return {
      kind: 'alarm',
      action: 'now' as const,
      html: `<strong>正在回看报警记录 ${alarm.id}</strong>　时段 ${fmtRange(alarm.from, alarm.to)}（${TZ}）　点位 ${alarm.pid} · 损伤活性诊断。此为历史上下文，不是当前数据。`
    }
  }
  if (view.value === 'alarm') {
    return { kind: 'alarm', action: '' as const, html: '<strong>报警记录</strong>　请选择一条独立事件回看对应时段数据。列表中的事件来自损伤活性诊断，<strong>不是</strong>由损伤度阈值生成。' }
  }
  if (queried.value && (tFrom.value !== CUR_FROM || tTo.value !== CUR_TO)) {
    return { kind: 'query', action: 'reset' as const, html: `<strong>当前查看 · 自选时段</strong>　查询范围 ${fmtRange(tFrom.value, tTo.value)}（${TZ}）。这不是报警回看。` }
  }
  return { kind: 'current', action: '' as const, html: `<strong>正在查看当前数据</strong>　演示数据截至 ${DEMO_AS_OF}。默认窗口 ${fmtRange(CUR_FROM, CUR_TO)}（${TZ}）。` }
})

function serviceName(id: SvcId) {
  return SERVICES.find(item => item.id === id)?.name || ''
}
function pointLoc(id: string) {
  return structurePoint(id).loc
}

watch(() => props.pointId, id => {
  if (!id || id === activeId.value) return
  activeId.value = structurePoint(id).id
  if (view.value === 'alarm' && selectedAlarm.value && selectedAlarm.value.pid !== activeId.value) {
    view.value = 'current'
    alarmId.value = null
    resetRange()
  }
})

watch([tFrom, tTo], () => {
  draftFrom.value = tFrom.value
  draftTo.value = tTo.value
})

watch(modal, value => {
  if (value) nextTick(() => closeBtn.value?.focus())
})

function showToast(message: string) {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = '' }, 1800)
}

function resetRange() {
  tFrom.value = CUR_FROM
  tTo.value = CUR_TO
  queried.value = false
  queryHint.value = ''
}

function pick(id: string) {
  if (id === activeId.value) return
  if (view.value === 'alarm' && selectedAlarm.value && selectedAlarm.value.pid !== id) {
    view.value = 'current'
    alarmId.value = null
    resetRange()
    showToast('已切换点位，并退出报警回看，回到当前数据')
  }
  activeId.value = id
  emit('select', id)
}

function onPointChange(event: Event) {
  pick((event.target as HTMLSelectElement).value)
}

function openService(id: SvcId, keepRange = false) {
  modal.value = id
  if (!keepRange && !(view.value === 'alarm' && alarmId.value)) {
    view.value = 'current'
    alarmId.value = null
    if (!queried.value) resetRange()
  }
}

function openAlarms() {
  view.value = 'alarm'
  alarmId.value = null
  openService('ae', true)
}

function closeModal() {
  modal.value = null
  view.value = 'current'
  alarmId.value = null
  resetRange()
}

function returnCurrent() {
  view.value = 'current'
  alarmId.value = null
  resetRange()
}

function showAlarmTab() {
  if (!modal.value) return
  view.value = 'alarm'
  const alarm = selectedAlarm.value
  if (!alarm || alarm.pid !== active.value.id || alarm.svc !== modal.value) alarmId.value = null
}

function selectAlarm(id: string) {
  const alarm = alarms.find(item => item.id === id)
  if (!alarm) return
  alarmId.value = alarm.id
  view.value = 'alarm'
  modal.value = alarm.svc
  tFrom.value = alarm.from
  tTo.value = alarm.to
  queried.value = false
  queryHint.value = ''
  if (activeId.value !== alarm.pid) {
    activeId.value = alarm.pid
    emit('select', alarm.pid)
  }
}

function runQuery() {
  if (!draftFrom.value || !draftTo.value) {
    queryHint.value = '请填写开始和结束时间'
    return
  }
  if (parseDT(draftFrom.value) >= parseDT(draftTo.value)) {
    queryHint.value = '开始时间必须早于结束时间'
    return
  }
  if (parseDT(draftTo.value) - parseDT(draftFrom.value) > 16 * 86400000) {
    queryHint.value = '示意数据窗口最长 16 天'
    return
  }
  tFrom.value = draftFrom.value
  tTo.value = draftTo.value
  queried.value = true
  queryHint.value = ''
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && modal.value) closeModal()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.clearTimeout(toastTimer)
})
</script>

<style src="@/styles/structure-point-detail.css"></style>

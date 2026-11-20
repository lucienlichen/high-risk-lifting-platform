<template>
  <div class="spd">
    <div class="spd-main">
      <aside class="spd-left">
        <section class="spd-card spd-table">
          <div class="spd-hd">
            <div class="spd-hd-top">
              <span class="spd-title">点位表</span>
              <span class="spd-meta">共 {{ points.length }} 个 · 异常 {{ summary.warn }} · 故障 {{ summary.fault }}</span>
            </div>
            <div class="spd-tools">
              <input v-model="query" type="search" placeholder="搜索编号或位置" aria-label="搜索点位">
              <label><input v-model="onlyBad" type="checkbox">仅看异常/报警</label>
            </div>
          </div>
          <div class="spd-colhd"><span>编号</span><span>位置</span><span>状态</span></div>
          <div class="spd-body">
            <p v-if="!visible.length" class="spd-empty">没有匹配的点位</p>
            <button
              v-for="row in visible"
              :key="row.id"
              type="button"
              class="spd-row"
              :class="{ sel: row.id === active.id }"
              @click="pick(row.id)"
            >
              <span class="id">{{ row.id }}</span>
              <span class="loc">{{ row.name }}</span>
              <span class="spd-status" :class="row.status">{{ statusName(row.status) }}</span>
            </button>
          </div>
          <div class="spd-foot">
            <span>齿轮箱轴、电机输出轴、卷筒轴承座</span>
          </div>
        </section>
      </aside>

      <section class="spd-mid">
        <section class="spd-card spd-model">
          <div class="spd-mid-hd">
            <span class="spd-title">机构模型</span>
            <span class="spd-badge">传动链示意</span>
            <span class="sub">{{ device }} · {{ org }} · 非岸桥总览</span>
          </div>
          <div class="spd-mech-stage">
            <SchemeModel side="mechanism" :points="schemePoints" :selected-id="active.id" :hidden-ids="hiddenIds" @select="pick" />
          </div>
          <div class="spd-mid-ft">
            <div>机构状态 <span class="spd-status" :class="summary.overall">{{ statusName(summary.overall) }}</span>　正常 {{ summary.normal }} · 异常 {{ summary.warn }} · 故障 {{ summary.fault }}</div>
            <div class="hint">点位颜色对应全局状态。频谱与特征值在右侧服务抽屉中打开。</div>
          </div>
        </section>
        <section class="spd-card spd-raw">
          <div class="spd-mid-hd">
            <span class="spd-title">当前点位监测数据</span>
            <span class="sub">只显示当前测点，振动与转速同时展开</span>
          </div>
          <div class="spd-raw-query">
            <div class="spd-grain" role="group" aria-label="原始数据时间范围">
              <button type="button" :class="{ on: rawSeconds === 2 }" @click="applyRawSeconds(2)">2 秒</button>
              <button type="button" :class="{ on: rawSeconds === 5 }" @click="applyRawSeconds(5)">5 秒</button>
              <button type="button" :class="{ on: rawSeconds === 10 }" @click="applyRawSeconds(10)">10 秒</button>
              <button type="button" :class="{ on: rawCustom }" @click="rawCustom = true">自定义</button>
              <span>已应用 {{ rawSeconds }} 秒 · 起点 {{ rawStartLabel }} · 演示数据</span>
            </div>
            <div v-if="rawCustom" class="spd-custom">
              <label>开始 <input v-model="rawDraftFrom" type="datetime-local"></label>
              <label>时长
                <select v-model.number="rawDraftSeconds">
                  <option :value="2">2 秒</option>
                  <option :value="5">5 秒</option>
                  <option :value="10">10 秒</option>
                </select>
              </label>
              <button type="button" @click="applyRawQuery">查询</button>
              <span>{{ rawHint || '与故障诊断相同，只提供 2、5、10 秒。未查询前仍用已应用窗口' }}</span>
            </div>
          </div>
          <div class="spd-raw-row">
            <article class="spd-raw-pane">
              <header>振动</header>
              <SchemeChart class="spd-cg spd-raw-chart" :option="vibrationOption" />
            </article>
            <article class="spd-raw-pane">
              <header>转速</header>
              <p class="spd-scope">转速采集项仅明确写了电机输出轴；其他点的转速曲线标明为该轴演示速度。</p>
              <SchemeChart class="spd-cg spd-raw-chart" :option="rpmOption" />
            </article>
          </div>
        </section>
      </section>

      <aside class="spd-right is-compact" aria-label="机构服务">
        <template v-for="group in mechGroups" :key="group.title">
          <p class="spd-cat">{{ group.title }}</p>
          <button v-for="card in group.items" :key="card.id" type="button" class="spd-svc" :class="{ abn: card.abnormal }" @click="drawer = card.id">
          <div class="top">
            <span class="name">{{ card.name }}</span>
            <span class="spd-status" :class="card.tone">{{ card.badge }}</span>
          </div>
          <div class="spd-kpis">
            <div v-for="kpi in card.kpis" :key="kpi.label" class="spd-kpi">
              <span class="lab">{{ kpi.label }}</span>
              <span class="val" :class="{ sm: kpi.small }">{{ kpi.value }}</span>
            </div>
          </div>
          <div class="spd-concl">{{ card.conclusion }}</div>
          <div class="spd-go">查看详情</div>
        </button>
        </template>
        <p class="spd-cat">维修与报警</p>
        <button type="button" class="spd-svc" @click="drawer = 'predict'">
          <div class="top"><span class="name">预知维修</span><span class="spd-status pending">演示</span></div>
          <div class="spd-concl">{{ active.bearing ? '轴承按 CI 末项安排复查' : '非轴承测点不预测寿命' }}</div>
          <div class="spd-go">查看报告</div>
        </button>
        <button type="button" class="spd-svc" @click="openAlarms">
          <div class="top"><span class="name">历史报警记录</span><span class="spd-status" :class="alarms.length ? 'warn' : 'ok'">{{ alarms.length }} 条</span></div>
          <div class="spd-concl">独立于服务结论的历史事件</div>
          <div class="spd-go">查看记录</div>
        </button>
      </aside>
    </div>

    <div v-if="toast" class="spd-toast" role="status">{{ toast }}</div>

    <div v-if="drawer" class="spd-drawer-mask" @click.self="drawer = null">
      <aside class="spd-drawer" role="dialog" aria-modal="true" @click.stop>
        <header class="spd-dhd">
          <div class="spd-dhd-copy">
            <strong>{{ drawerTitle }}</strong>
            <span>{{ active.id }}　{{ active.name }}　全局 {{ statusName(active.status) }}　·　演示数据</span>
          </div>
          <label>切点
            <select :value="active.id" aria-label="切换点位" @change="onPointChange">
              <option v-for="point in points" :key="point.id" :value="point.id">{{ point.id }}　{{ point.name }}</option>
            </select>
          </label>
          <button ref="drawerClose" type="button" class="spd-x" title="关闭（Esc）" @click="drawer = null">✕</button>
        </header>
        <div ref="drawerBody" class="spd-drawer-body">
          <template v-if="drawer === 'predict'">
            <p class="spd-scope">演示决策输出，不是正式维修方案。</p>
            <div class="spd-conclbox">
              <div class="k">综合预知维修报告</div>
              <div class="v">{{ active.id }} · {{ active.name }} · {{ active.rpm }} r/min</div>
              <div class="s">{{ assessConclusion(active) }}。{{ diagnosisConclusion(active) }}</div>
            </div>
            <p class="spd-scope">{{ active.bearing ? `轴承寿命只显示 CI 末项 ${bearing.ci[1]} 小时，建议按该演示值安排复查，不外推预测曲线。` : '本点不是轴承测点，不给出剩余寿命，也不借用结构损伤度安排更换。' }}</p>
            <p class="spd-scope">事故防控：振动超过示意异常线时按现有关注流程复核。不新增停机阈值。</p>
          </template>
          <template v-else-if="drawer === 'monitor'">
            <p class="spd-scope">健康监测沿用页面中部的传动链示意和当前点位。这里只列各测点的状态和三个特征值，不另做岸桥总览。</p>
            <div class="spd-scrollx">
              <table class="spd-grid">
                <thead><tr><th>序号</th><th>位置</th><th>状态</th><th>峭度</th><th>振动烈度</th><th>有效值</th><th>转速</th></tr></thead>
                <tbody>
                  <tr v-for="point in points" :key="point.id" :class="{ hit: point.id === active.id }">
                    <td>{{ point.id }}</td><td>{{ point.name }}</td>
                    <td><span class="spd-status" :class="point.status">{{ statusName(point.status) }}</span></td>
                    <td>{{ featureBase(point).kurtosis.toFixed(1) }}</td>
                    <td>{{ featureBase(point).severity.toFixed(1) }} mm/s</td>
                    <td>{{ featureBase(point).rms.toFixed(1) }} g</td>
                    <td>{{ point.id === 'M-01' ? `${point.rpm} r/min` : '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="spd-scope">转速采集项只明确写了电机输出轴，其他轴的转速不在这张表里冒充采集值。频谱分析和特征值分别进入故障诊断、健康评估。</p>
            <div class="spd-grain">
              <button type="button" @click="drawer = 'fault'">打开频谱分析</button>
              <button type="button" @click="drawer = 'assess'">打开特征值</button>
            </div>
            <div class="spd-eddy-note">
              <b>未实现的监测动作</b>
              <span>PPT 第6页还有「一键关闭报警」和「跳转其他岸桥同一子机构」。本页只服务当前这台起重机，不新增全厂看板，也不提供会改写报警状态的开关。</span>
            </div>
          </template>

          <template v-else-if="drawer === 'assess'">
            <div class="spd-custom">
              <label>开始 <input v-model="assessStart" type="datetime-local"></label>
              <label>时长
                <select v-model.number="assessHours">
                  <option :value="6">6 小时</option>
                  <option :value="24">24 小时</option>
                  <option :value="72">72 小时</option>
                </select>
              </label>
              <span>设备 {{ device }} · 机构 {{ org }} · 测点 {{ active.id }}</span>
            </div>
            <p class="spd-scope">异常线、危险线是示意值。PPT 第7页只标出这两条线，没有给出具体限值。统计量对应当前窗口。</p>
            <article v-for="(key, index) in panel" :key="index" class="spd-feature">
              <div class="spd-feature-hd">
                <select :value="key" :aria-label="`特征值 ${index + 1}`" @change="setPanel(index, $event)">
                  <option v-for="item in featureKeys" :key="item" :value="item">{{ features[item].name }}</option>
                </select>
                <span class="spd-demo">演示数据</span>
              </div>
              <div class="spd-feature-body">
                <SchemeChart class="spd-cg" :option="featureOptions[index]" />
                <dl class="spd-stats">
                  <dt>最大值</dt><dd>{{ stat(key).max.toFixed(2) }} {{ features[key].unit }}</dd>
                  <dt>最小值</dt><dd>{{ stat(key).min.toFixed(2) }} {{ features[key].unit }}</dd>
                  <dt>平均值</dt><dd>{{ stat(key).mean.toFixed(2) }} {{ features[key].unit }}</dd>
                </dl>
              </div>
            </article>
          </template>

          <template v-else-if="drawer === 'fault'">
            <div class="spd-custom">
              <label>开始 <input v-model="diagStart" type="datetime-local"></label>
              <label>时长
                <select v-model.number="diagSeconds">
                  <option :value="2">2 秒</option>
                  <option :value="5">5 秒</option>
                  <option :value="10">10 秒</option>
                </select>
              </label>
              <span>设备 {{ device }} · 机构 {{ org }} · 测点 {{ active.id }} · {{ active.rpm }} r/min</span>
            </div>
            <p class="spd-scope">{{ sampleNote }} 每张图下方可拖动缩放。时域、角域、频谱、阶次、转速和包络阶次来自同一段示意信号。转频 {{ shaftText }} Hz。</p>
            <div class="spd-chart-grid">
              <article v-for="chart in diagCharts" :key="chart.title" class="spd-chartblock">
                <div class="spd-ctitle">{{ chart.title }}<span class="spd-demo">演示数据</span></div>
                <div class="spd-cdesc">{{ chart.desc }}</div>
                <SchemeChart class="spd-cg spd-zoom" :option="chart.option" />
              </article>
            </div>
          </template>

          <template v-else>
            <div v-if="!active.bearing" class="spd-eddy-note">
              <b>该测点不是轴承测点</b>
              <span>轴承寿命只给卷筒轴承座 D-01。电机轴和齿轮箱轴不展示剩余寿命，也不借用结构损伤度。</span>
            </div>
            <template v-else>
              <div class="spd-conclbox">
                <div class="k">轴承阶段（与全局状态分开）</div>
                <div class="v">阶段 {{ stageLabel(bearing.stage) }}</div>
                <div class="s">全局状态仍是{{ statusName(active.status) }}。A 正常、B 早期、C 故障、D 失效只用于轴承，不映射成结构健康等级或全局报警。</div>
              </div>
              <div class="spd-kpis spd-drawer-kpis">
                <div class="spd-kpi"><span class="lab">计算用故障时间</span><span class="val sm">{{ bearing.faultTime }}</span></div>
                <div class="spd-kpi"><span class="lab">RUL CI (ist)</span><span class="val sm">[{{ bearing.ci[0] }}, {{ bearing.ci[1] }}] h</span></div>
                <div class="spd-kpi"><span class="lab">显示值（区间末项）</span><span class="val">{{ bearing.ci[1] }} 小时</span></div>
                <div class="spd-kpi"><span class="lab">入参时长</span><span class="val sm">故障前 {{ bearing.inputHours }} 小时有效值</span></div>
              </div>
              <article class="spd-chartblock">
                <div class="spd-ctitle">故障前有效值<span class="spd-demo">演示数据</span></div>
                <div class="spd-cdesc">PPT 写「上报故障时间往回取 xx 时间的有效值」。xx 没有具体数字，这里用 24 小时。不绘制预测曲线，因为没有给出计算公式。</div>
                <SchemeChart class="spd-cg" :option="rmsOption" />
              </article>
              <p class="spd-scope">PPT 图例另有轨道吊示例：故障时间 {{ bearing.pptExampleFault }}，剩余寿命 {{ bearing.pptExampleLife }}。那不是本测点的计算结果。</p>
            </template>
          </template>
        </div>
      </aside>
    </div>

    <div v-if="alarmOpen" class="spd-mask" @click.self="closeAlarms">
      <div class="spd-modal" role="dialog" aria-modal="true" @click.stop>
        <div class="spd-mhd">
          <span class="mt">报警记录</span>
          <span class="ms">独立于机构服务　·　演示数据　·　共 {{ alarms.length }} 条</span>
          <button ref="alarmClose" type="button" class="spd-x" title="关闭（Esc）" @click="closeAlarms">✕</button>
        </div>
        <div class="spd-banner" :class="alarmId ? 'alarm' : 'current'">
          <div v-if="selectedAlarm"><strong>正在回看 {{ selectedAlarm.id }}</strong>　{{ fmtRange(alarmFrom, alarmTo) }}　{{ selectedAlarm.pid }}。这是历史证据，不是当前服务窗口。</div>
          <div v-else><strong>报警记录</strong>　选择一条振动事件回看。这些记录不出现在服务抽屉里。</div>
          <button v-if="alarmId" type="button" class="backnow" @click="returnCurrent">返回当前</button>
        </div>
        <div class="spd-mbody">
          <aside class="spd-mside">
            <div class="spd-alist">
              <button v-for="alarm in alarms" :key="alarm.id" type="button" class="spd-aitem" :class="{ on: alarm.id === alarmId }" @click="selectAlarm(alarm.id)">
                <div class="t"><span class="id">{{ alarm.id }}</span><span class="spd-status" :class="alarm.level">{{ statusName(alarm.level) }}</span></div>
                <div class="d">{{ alarm.title }}</div>
                <div class="m">{{ alarm.pid }}　{{ mechPoint(alarm.pid).name }}　·　{{ fmtRange(alarm.from, alarm.to) }}</div>
              </button>
            </div>
            <div v-if="selectedAlarm" class="spd-qbox">
              <div class="k">时间范围查询</div>
              <div class="spd-hint">只过滤本弹窗的证据，不影响服务抽屉。</div>
              <div class="spd-qrow"><label>开始</label><input v-model="alarmDraftFrom" type="datetime-local"></div>
              <div class="spd-qrow"><label>结束</label><input v-model="alarmDraftTo" type="datetime-local"></div>
              <div class="spd-qact"><button type="button" @click="runAlarmQuery">查询</button></div>
              <div class="spd-hint">{{ alarmHint }}</div>
            </div>
          </aside>
          <div class="spd-mmain">
            <div v-if="!selectedAlarm" class="spd-eddy-note">
              <b>选择一条报警记录</b>
              <span>回看后显示该时段的特征值证据。</span>
            </div>
            <template v-else>
              <article class="spd-chartblock">
                <div class="spd-ctitle">{{ features[selectedAlarm.feature].name }}证据<span class="spd-demo">演示数据</span></div>
                <div class="spd-cdesc">{{ selectedAlarm.note }}</div>
                <SchemeChart class="spd-cg" :option="alarmOption" />
              </article>
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
import SchemeModel from '@/components/pointScheme/SchemeModel.vue'
import { featureOption, xyOption } from '@/components/pointScheme/mechanismCharts'
import { parseDT } from '@/mock/structurePointDetail'
import {
  BEARING_DEMO, FEATURES, MECH_ALARMS, MECH_DEVICE, MECH_ORG, MECH_POINTS, SAMPLE_RATE_NOTE,
  assessConclusion, capture, diagnosisConclusion, featureBase, featureSeries, lifeConclusion,
  mechPoint, mechSummary, monitorConclusion, rmsInput, stageLabel, statusName,
  type FeatureKey
} from '@/mock/mechanismPointDetail'

const props = defineProps<{ pointId: string }>()
const emit = defineEmits<{ select: [id: string] }>()

const drawerClose = ref<HTMLButtonElement | null>(null)
const alarmClose = ref<HTMLButtonElement | null>(null)
const drawerBody = ref<HTMLElement | null>(null)
const activeId = ref(props.pointId)
const query = ref('')
const onlyBad = ref(false)
const drawer = ref<'monitor' | 'assess' | 'fault' | 'life' | 'predict' | null>(null)
const alarmOpen = ref(false)
const alarmId = ref<string | null>(null)
const alarmFrom = ref('')
const alarmTo = ref('')
const alarmDraftFrom = ref('')
const alarmDraftTo = ref('')
const alarmHint = ref('')
const toast = ref('')
const assessStart = ref('2026-11-15T22:00')
const assessHours = ref(6)
const diagStart = ref('2026-11-16T02:00')
const RAW_ORIGIN = '2026-11-16T02:00'
const rawSeconds = ref<2 | 5 | 10>(5)
const rawStart = ref(RAW_ORIGIN)
const rawCustom = ref(false)
const rawDraftFrom = ref(RAW_ORIGIN)
const rawDraftSeconds = ref<2 | 5 | 10>(5)
const rawHint = ref('')
const rawStartLabel = computed(() => rawStart.value.replace('T', ' '))
const diagSeconds = ref(5)
const panel = ref<FeatureKey[]>(['kurtosis', 'severity', 'rms'])
let toastTimer = 0

const points = MECH_POINTS
const alarms = MECH_ALARMS
const features = FEATURES
const device = MECH_DEVICE
const org = MECH_ORG
const bearing = BEARING_DEMO
const sampleNote = SAMPLE_RATE_NOTE
const featureKeys = Object.keys(FEATURES) as FeatureKey[]
const summary = computed(() => mechSummary())
const active = computed(() => mechPoint(activeId.value))
const schemePoints = points.map(point => ({ id: point.id, name: point.name, measured: true, status: point.status }))
const visible = computed(() => {
  const text = query.value.trim().toLowerCase()
  return points.filter(point => {
    if (onlyBad.value && point.status === 'ok') return false
    if (!text) return true
    return `${point.id}${point.name}`.toLowerCase().includes(text)
  })
})
const hiddenIds = computed(() => points.filter(point => !visible.value.some(item => item.id === point.id)).map(point => point.id))
const cards = computed(() => {
  const point = active.value
  const base = featureBase(point)
  const summaryNow = summary.value
  return [
    {
      id: 'monitor' as const, name: '健康监测', badge: statusName(summaryNow.overall), tone: summaryNow.overall, abnormal: summaryNow.overall !== 'ok',
      kpis: [{ label: '正常 / 异常 / 故障', value: `${summaryNow.normal} / ${summaryNow.warn} / ${summaryNow.fault}`, small: true }, { label: '本点峭度', value: base.kurtosis.toFixed(1), small: false }],
      conclusion: monitorConclusion(point)
    },
    {
      id: 'assess' as const, name: '健康评估', badge: assessConclusion(point).includes('均在') ? '正常' : '关注', tone: point.status, abnormal: point.status !== 'ok',
      kpis: [{ label: '振动烈度', value: `${base.severity.toFixed(1)} mm/s`, small: false }, { label: '有效值', value: `${base.rms.toFixed(1)} g`, small: false }],
      conclusion: assessConclusion(point)
    },
    {
      id: 'fault' as const, name: '故障诊断', badge: point.status === 'warn' ? '转频偏高' : '未见额外峰', tone: point.status, abnormal: point.status !== 'ok',
      kpis: [{ label: '转速', value: `${point.rpm} r/min`, small: true }, { label: '主要分量', value: '1×、2×', small: true }],
      conclusion: diagnosisConclusion(point)
    },
    {
      id: 'life' as const, name: '轴承寿命预测', badge: point.bearing ? stageLabel(bearing.stage) : '不适用', tone: point.bearing ? 'ok' : 'pending', abnormal: false,
      kpis: point.bearing
        ? [{ label: 'CI 末项', value: `${bearing.ci[1]} 小时`, small: false }, { label: '区间', value: `${bearing.ci[0]}–${bearing.ci[1]}`, small: true }]
        : [{ label: '适用测点', value: 'D-01', small: true }, { label: '本点', value: '非轴承', small: true }],
      conclusion: lifeConclusion(point)
    }
  ]
})
const assessEnd = computed(() => shiftHours(assessStart.value, assessHours.value))
const featureOptions = computed(() => panel.value.map(key => {
  const series = featureSeries(active.value, key, assessStart.value, assessEnd.value)
  return featureOption(series.labels, series.values, key)
}))
const wave = computed(() => capture(active.value, diagSeconds.value))
const shaftText = computed(() => wave.value.shaftHz.toFixed(2))
const diagCharts = computed(() => {
  const data = wave.value
  return [
    { title: '时域信号', desc: '单位 g，横轴 s。', option: xyOption(data.time, data.signal, '时间 / s', 'g', '#1677ff') },
    { title: '角域信号', desc: '横轴为转数，纵轴 g。由同一段信号对转频积分得到。', option: xyOption(data.angle, data.signal, '转数', 'g', '#ea580c') },
    { title: 'FFT 频谱', desc: '横轴 Hz，纵轴为示意幅值。峰在转频及其二次谐波。', option: xyOption(data.freq, data.mag, '频率 / Hz', '幅值', '#7c3aed') },
    { title: '阶次谱', desc: '阶次 = 频率 / 转频。1 与 2 对应转频和二次谐波。', option: xyOption(data.order, data.orderMag, '阶次', '幅值', '#0f766e') },
    { title: '转速信号', desc: '单位 r/min。围绕该点名义转速小幅波动。', option: xyOption(data.time, data.rpm, '时间 / s', 'r/min', '#1677ff') },
    { title: '包络阶次谱', desc: '异常点的 3.5 阶是演示调幅，不是按轴承几何算出的故障阶次。', option: xyOption(data.envOrder, data.envMag, '阶次', '幅值', '#7c3aed') }
  ]
})
const rmsOption = computed(() => {
  const series = rmsInput(active.value)
  return featureOption(series.labels, series.values, 'rms', false)
})
const selectedAlarm = computed(() => alarms.find(item => item.id === alarmId.value) || null)
const rawWave = computed(() => capture(active.value, rawSeconds.value))
const vibrationOption = computed(() => xyOption(rawWave.value.time, rawWave.value.signal, '时间 / s', 'g', '#1677ff', false))
const rpmOption = computed(() => xyOption(rawWave.value.time, rawWave.value.rpm, '时间 / s', 'r/min', '#1677ff', false))
const alarmOption = computed(() => {
  const alarm = selectedAlarm.value
  if (!alarm || !alarmFrom.value || !alarmTo.value) return featureOption([], [], 'severity')
  const series = featureSeries(mechPoint(alarm.pid), alarm.feature, alarmFrom.value, alarmTo.value)
  return featureOption(series.labels, series.values, alarm.feature)
})
const mechGroups = computed(() => [
  { title: '监测诊断', items: cards.value.filter(card => card.id === 'monitor' || card.id === 'fault') },
  { title: '评估预测', items: cards.value.filter(card => card.id === 'assess' || card.id === 'life') }
])
const drawerTitle = computed(() => drawer.value === 'predict' ? '预知维修决策' : cards.value.find(card => card.id === drawer.value)?.name || '')

watch(() => props.pointId, id => { if (id && id !== activeId.value && points.some(point => point.id === id)) activeId.value = id })
watch(drawer, value => { if (value) nextTick(() => drawerClose.value?.focus()) })
watch(alarmOpen, value => { if (value) nextTick(() => alarmClose.value?.focus()) })
watch([alarmFrom, alarmTo], () => { alarmDraftFrom.value = alarmFrom.value; alarmDraftTo.value = alarmTo.value })

function stat(key: FeatureKey) {
  return featureSeries(active.value, key, assessStart.value, assessEnd.value)
}
function shiftHours(value: string, hours: number) {
  const [date, time] = value.split('T')
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = (time || '00:00').split(':').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day, hour + hours, minute || 0))
  const pad = (item: number) => String(item).padStart(2, '0')
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}T${pad(next.getUTCHours())}:${pad(next.getUTCMinutes())}`
}
function showToast(message: string) {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = '' }, 1800)
}
function pick(id: string) {
  if (id === activeId.value) return
  if (alarmId.value && selectedAlarm.value && selectedAlarm.value.pid !== id) {
    alarmId.value = null
    alarmFrom.value = ''
    alarmTo.value = ''
    showToast('已切换点位，并退出报警回看')
  }
  activeId.value = id
  emit('select', id)
}
function onPointChange(event: Event) {
  pick((event.target as HTMLSelectElement).value)
}
function setPanel(index: number, event: Event) {
  const value = (event.target as HTMLSelectElement).value as FeatureKey
  panel.value = panel.value.map((item, itemIndex) => itemIndex === index ? value : item)
}
function openAlarms() { alarmOpen.value = true }
function closeAlarms() {
  alarmOpen.value = false
  alarmId.value = null
  alarmFrom.value = ''
  alarmTo.value = ''
  alarmHint.value = ''
}
function returnCurrent() {
  alarmId.value = null
  alarmFrom.value = ''
  alarmTo.value = ''
  alarmHint.value = ''
}
function selectAlarm(id: string) {
  const alarm = alarms.find(item => item.id === id)
  if (!alarm) return
  alarmId.value = alarm.id
  alarmFrom.value = alarm.from
  alarmTo.value = alarm.to
  alarmHint.value = ''
  if (activeId.value !== alarm.pid) {
    activeId.value = alarm.pid
    emit('select', alarm.pid)
  }
}
function applyRawSeconds(seconds: 2 | 5 | 10) {
  if (rawCustom.value && !rawDraftFrom.value) {
    rawHint.value = '请填写开始时间'
    return
  }
  rawSeconds.value = seconds
  rawStart.value = rawDraftFrom.value || RAW_ORIGIN
  rawDraftSeconds.value = seconds
  rawHint.value = ''
}
function applyRawQuery() {
  if (!rawDraftFrom.value) {
    rawHint.value = '请填写开始时间'
    return
  }
  if (rawDraftSeconds.value !== 2 && rawDraftSeconds.value !== 5 && rawDraftSeconds.value !== 10) {
    rawHint.value = '机构原始采集只提供 2、5、10 秒'
    return
  }
  const end = rawDraftFrom.value
  if (!end || Number.isNaN(parseDT(rawDraftFrom.value))) {
    rawHint.value = '请填写开始时间'
    return
  }
  rawStart.value = rawDraftFrom.value
  rawSeconds.value = rawDraftSeconds.value
  rawHint.value = '已应用。演示波形只随时长变化，不随钟点改形。'
}
function runAlarmQuery() {
  if (!alarmDraftFrom.value || !alarmDraftTo.value || alarmDraftFrom.value >= alarmDraftTo.value) {
    alarmHint.value = '开始时间必须早于结束时间'
    return
  }
  alarmFrom.value = alarmDraftFrom.value
  alarmTo.value = alarmDraftTo.value
  alarmHint.value = ''
}
function fmtRange(from: string, to: string) {
  return `${from.replace('T', ' ')} 至 ${to.replace('T', ' ')}`
}
function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (alarmOpen.value) closeAlarms()
  else drawer.value = null
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); window.clearTimeout(toastTimer) })
</script>

<style src="@/styles/structure-point-detail.css"></style>
<style>
.spd-mech-stage { flex: 1; min-height: 220px; display: flex; align-items: center; padding: 8px 12px 0; }
.spd-feature { border: 1px solid #e5eaf0; border-radius: 8px; background: #fff; padding: 8px 10px; }
.spd-feature-hd { display: flex; align-items: center; gap: 8px; }
.spd-feature-hd select { height: 28px; border: 1px solid #d1d5db; border-radius: 6px; }
.spd-feature-body { display: grid; grid-template-columns: minmax(0, 1fr) 148px; gap: 8px; align-items: stretch; }
.spd-stats { margin: 8px 0 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 8px; font-size: 12px; }
.spd-stats dt { color: #6b7280; }
.spd-stats dd { margin: 0; font-weight: 700; }
.spd-zoom.ps-echart, .spd-feature .spd-cg.ps-echart { height: 220px; }
@media (max-width: 1280px) {
  .spd-feature-body { grid-template-columns: 1fr; }
}
</style>

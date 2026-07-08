<template>
  <div class="had-drawer">
    <div class="had-shell">
      <div class="had-top-bar">
        <div class="had-module-tabs">
          <button
            v-for="item in moduleTabs"
            :key="item.key"
            :class="['had-module-tab', { active: activeModule === item.key }]"
            @click="activeModule = item.key"
          >
            <span class="had-module-tab-title">{{ item.label }}</span>
          </button>
        </div>
        <div class="had-actions">
          <el-tag type="primary" effect="plain" round>最近 24h</el-tag>
          <el-button size="small" circle @click="emit('close')">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- ── 减速机状态诊断 ── -->
      <div v-if="activeModule === 'gearbox'" class="had-body had-assess-body">
        <div class="had-panel had-assess-panel">
          <div class="had-table-wrap had-assess-table-wrap">
            <el-table :data="gearboxRows" style="width:100%" height="100%">
              <el-table-column prop="no" label="编号" min-width="5%" align="center" />
              <el-table-column prop="obj" label="监测对象" min-width="8%" align="center" />
              <el-table-column prop="pos" label="具体位置" min-width="7%" align="center" />
              <el-table-column label="历史数据" min-width="8%" align="center">
                <template #default="{ row }">
                  <button class="had-hist-link" @click="openHistory('gearbox', row.idx, row.title, row.loc, row.level)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    查看数据
                  </button>
                </template>
              </el-table-column>
              <el-table-column label="温度 最大/均(℃)" min-width="9%" align="center">
                <template #default="{ row }"><span class="had-stat">{{ row.temp.max }} <em>/ {{ row.temp.avg }}</em></span></template>
              </el-table-column>
              <el-table-column label="声音 最大/均(dB)" min-width="9%" align="center">
                <template #default="{ row }"><span class="had-stat">{{ row.sound.max }} <em>/ {{ row.sound.avg }}</em></span></template>
              </el-table-column>
              <el-table-column label="振动 最大/均(mm/s)" min-width="10%" align="center">
                <template #default="{ row }"><span class="had-stat">{{ row.vib.max }} <em>/ {{ row.vib.avg }}</em></span></template>
              </el-table-column>
              <el-table-column label="评级" min-width="6%" align="center">
                <template #default="{ row }">
                  <el-tag :type="levelTagType(row.level)" size="small" effect="dark">{{ healthLabel(row.level) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="assess.health" label="健康评估" min-width="12%" show-overflow-tooltip />
              <el-table-column prop="assess.diagnosis" label="故障诊断" min-width="12%" show-overflow-tooltip />
              <el-table-column prop="assess.prognosis" label="故障预测" min-width="12%" show-overflow-tooltip />
              <el-table-column prop="assess.maintain" label="维修建议" min-width="14%" show-overflow-tooltip />
            </el-table>
          </div>
        </div>
      </div>

      <!-- ── 行走车轮状态诊断 ── -->
      <div v-else-if="activeModule === 'wheel'" class="had-body had-assess-body">
        <div class="had-panel had-assess-panel">
          <div class="had-table-wrap had-assess-table-wrap">
            <el-table :data="wheelRows" style="width:100%" height="100%">
              <el-table-column prop="no" label="编号" min-width="5%" align="center" />
              <el-table-column prop="pos" label="安装位置" min-width="11%" align="center" />
              <el-table-column label="历史数据" min-width="8%" align="center">
                <template #default="{ row }">
                  <button class="had-hist-link" @click="openHistory('wheel', row.idx, row.title, row.loc, row.level)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    查看数据
                  </button>
                </template>
              </el-table-column>
              <el-table-column label="温度 最大/均(℃)" min-width="9%" align="center">
                <template #default="{ row }"><span class="had-stat">{{ row.temp.max }} <em>/ {{ row.temp.avg }}</em></span></template>
              </el-table-column>
              <el-table-column label="声音 最大/均(dB)" min-width="9%" align="center">
                <template #default="{ row }"><span class="had-stat">{{ row.sound.max }} <em>/ {{ row.sound.avg }}</em></span></template>
              </el-table-column>
              <el-table-column label="振动 最大/均(mm/s)" min-width="10%" align="center">
                <template #default="{ row }"><span class="had-stat">{{ row.vib.max }} <em>/ {{ row.vib.avg }}</em></span></template>
              </el-table-column>
              <el-table-column label="评级" min-width="6%" align="center">
                <template #default="{ row }">
                  <el-tag :type="levelTagType(row.level)" size="small" effect="dark">{{ healthLabel(row.level) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="assess.health" label="健康评估" min-width="12%" show-overflow-tooltip />
              <el-table-column prop="assess.diagnosis" label="故障诊断" min-width="12%" show-overflow-tooltip />
              <el-table-column prop="assess.prognosis" label="故障预测" min-width="12%" show-overflow-tooltip />
              <el-table-column prop="assess.maintain" label="维修建议" min-width="14%" show-overflow-tooltip />
            </el-table>
          </div>
        </div>
      </div>

      <!-- ── 制动器状态诊断（闸瓦图像识别 · 按日 · 历史数据=当日抓拍） ── -->
      <div v-else-if="activeModule === 'brake'" class="had-body had-assess-body">
        <div class="had-panel had-assess-panel">
          <div class="had-table-wrap had-assess-table-wrap">
            <el-table :data="brakeDays" style="width:100%" height="100%">
              <el-table-column label="日期" min-width="12%" align="center">
                <template #default="{ row }">
                  <span class="had-brake-date">{{ row.date }}</span>
                  <el-tag :type="levelTagType(row.level)" size="small" effect="dark" style="margin-left:6px">{{ healthLabel(row.level) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="历史数据" min-width="12%" align="center">
                <template #default="{ row }">
                  <button class="had-hist-link" @click="openBrakeDay(row)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    当日抓拍（{{ row.shots.length }} 张）
                  </button>
                </template>
              </el-table-column>
              <el-table-column prop="assess.health" label="健康评估" min-width="17%" show-overflow-tooltip />
              <el-table-column prop="assess.diagnosis" label="故障诊断" min-width="16%" show-overflow-tooltip />
              <el-table-column prop="assess.prognosis" label="故障预测" min-width="16%" show-overflow-tooltip />
              <el-table-column prop="assess.maintain" label="维修建议" min-width="18%" show-overflow-tooltip />
            </el-table>
          </div>
        </div>
      </div>

      <div v-else class="had-empty">
        <el-empty description="当前设备暂无可诊断的监测数据" />
      </div>

      <!-- ═══ 历史数据文件弹窗（减速机 / 行走车轮） ═══ -->
      <div v-if="historyModal" class="had-modal-mask" @click.self="closeHistory">
        <div class="had-modal-card had-hist-card">
          <header class="had-modal-head">
            <div class="had-modal-title">
              <span class="had-modal-name">{{ historyModal.title }} · 历史数据文件</span>
              <span class="had-modal-loc">{{ historyModal.location }}</span>
            </div>
            <button class="had-modal-close" @click="closeHistory"><el-icon><Close /></el-icon></button>
          </header>
          <div class="had-modal-sub">
            <span>{{ FILE_META[historyModal.mode].desc }}</span>
            <span>每日 1 个数据文件 · 共 {{ historyModal.days.length }} 个</span>
          </div>
          <div class="had-hist-head">
            <span>日期</span><span>数据文件</span><span class="ta-r">下载</span>
          </div>
          <div class="had-hist-list">
            <div v-for="day in historyModal.days" :key="day.date" class="had-hist-row">
              <span class="had-hist-date">{{ day.date }}</span>
              <span class="had-hist-file">
                <svg class="had-hist-file-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span class="had-hist-file-main">
                  <span class="had-hist-fname">{{ day.file.name }}</span>
                  <span class="had-hist-fmeta">上传 {{ day.file.time }} · {{ day.file.sizeMB }} MB · {{ day.file.records.toLocaleString() }} 点</span>
                </span>
                <el-tag v-if="day.file.level !== 'normal'" :type="levelTagType(day.file.level)" size="small" effect="plain">{{ day.file.level === 'danger' ? '异常段' : '波动段' }}</el-tag>
              </span>
              <span class="ta-r">
                <button class="had-hist-dl" title="下载数据文件（演示占位）">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ 制动器当日抓拍弹窗 ═══ -->
      <div v-if="brakeDayModal" class="had-modal-mask" @click.self="closeBrakeDay">
        <div class="had-modal-card had-brakeday-card">
          <header class="had-modal-head">
            <div class="had-modal-title">
              <span class="had-modal-name">{{ brakeDayModal.date }} · 当日抓拍</span>
              <span class="had-modal-loc">每小时 1 张 · 共 {{ brakeDayModal.shots.length }} 张</span>
              <el-tag :type="levelTagType(brakeDayModal.level)" size="small" effect="dark">{{ healthLabel(brakeDayModal.level) }}</el-tag>
            </div>
            <button class="had-modal-close" @click="closeBrakeDay"><el-icon><Close /></el-icon></button>
          </header>
          <div class="had-modal-sub"><span>点击任意一张查看大图与图像识别结果</span></div>
          <div class="had-brakeday-grid">
            <button
              v-for="shot in brakeDayModal.shots"
              :key="shot.id"
              :class="['had-brake-shot', `is-${shot.level}`]"
              @click="openBrakeShot(brakeDayModal, shot)"
            >
              <span class="had-brake-shot-img">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span class="had-brake-shot-badge">{{ healthLabel(shot.level) }}</span>
              </span>
              <span class="had-brake-shot-time">{{ shot.time }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ 制动器快照大图（图像识别） ═══ -->
      <div v-if="brakeLightbox" class="had-brake-lightbox" @click="closeBrakeShot">
        <div class="had-brake-lightbox-card" @click.stop>
          <div :class="['had-brake-lightbox-img', `is-${brakeLightbox.shot.level}`]">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>闸瓦图像占位</span>
          </div>
          <div class="had-brake-lightbox-info">
            <div class="had-brake-lightbox-title">
              <span>{{ brakeLightbox.day }} · {{ brakeLightbox.shot.time }}</span>
              <el-tag :type="levelTagType(brakeLightbox.shot.level)" size="small" effect="dark">{{ healthLabel(brakeLightbox.shot.level) }}</el-tag>
            </div>
            <div class="had-brake-lightbox-rows">
              <div><span>闸瓦剩余厚度</span><strong>{{ brakeLightbox.shot.thickness }} mm</strong></div>
              <div><span>制动间隙</span><strong>{{ brakeLightbox.shot.gap }} mm</strong></div>
              <div><span>图像识别</span><strong>{{ brakeLightbox.shot.surface }}</strong></div>
            </div>
            <el-button size="small" type="primary" plain @click="closeBrakeShot">关闭</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { getRemoteMonitoringData } from '@/mock'
import type { Device, RemoteMonitoringData, RemoteTrendHistory } from '@/mock'

const props = defineProps<{
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

type AssessmentLevel = 'normal' | 'warn' | 'danger'
type ModuleKey = 'gearbox' | 'brake' | 'wheel'

const moduleTabs = [
  { key: 'gearbox', label: '减速机状态诊断', sub: '温度 / 声音 / 振动' },
  { key: 'brake', label: '制动器状态诊断', sub: '闸瓦图像识别' },
  { key: 'wheel', label: '行走车轮状态诊断', sub: '温度 / 声音 / 振动' }
] as const

const activeModule = ref<ModuleKey>('gearbox')

const monitoringData = computed<RemoteMonitoringData | null>(() =>
  props.device ? getRemoteMonitoringData(props.device) : null
)

function levelTagType(level: AssessmentLevel) {
  if (level === 'danger') return 'danger'
  if (level === 'warn') return 'warning'
  return 'success'
}

/* ════════════════════════════════════════════════════════════════
   减速机 / 行走车轮 / 制动器 状态诊断
   - 数据沿用 getRemoteMonitoringData（与「健康监测数据」Tab 口径一致）
   - 每行复刻评估文本列：健康评估 / 故障诊断 / 故障预测 / 维修建议
   - 历史数据列用最大/最小/平均统计值（不做迷你图）
   ════════════════════════════════════════════════════════════════ */

interface AssessText { health: string; diagnosis: string; prognosis: string; maintain: string }
interface TrendStat { max: number; min: number; avg: number; unit: string }

function statOf(h: RemoteTrendHistory, digits = 0): TrendStat {
  const f = Math.pow(10, digits)
  const round = (n: number) => Math.round(n * f) / f
  const v = h.values
  return {
    max: round(Math.max(...v)),
    min: round(Math.min(...v)),
    avg: round(v.reduce((a, b) => a + b, 0) / v.length),
    unit: h.valueLabel ?? ''
  }
}

function siteOfLabel(label: string): string {
  const seg = label.includes('·') ? label.split('·')[1] : label
  return seg.replace(/（.*?）/g, '').trim()
}

function seedHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}

function healthLabel(level: AssessmentLevel): string {
  return level === 'danger' ? '高风险' : level === 'warn' ? '亚健康' : '健康'
}

const devId = computed(() => props.device?.id ?? '')

interface MechRow {
  no: string; idx: number; obj: string; pos: string; title: string; loc: string
  temp: TrendStat; sound: TrendStat; vib: TrendStat
  level: AssessmentLevel; assess: AssessText
}

// ── 减速机状态诊断 ────────────────────────────────────────────
const GEARBOX_SHAFT = ['高速轴', '低速轴', '中间轴'] as const
const GEARBOX_ASSESS: Record<AssessmentLevel, AssessText> = {
  normal: {
    health: '健康度良好，箱体温度、运行声级与振动均在正常范围，运行平稳。',
    diagnosis: '未见齿轮啮合冲击或轴承故障特征，温升与振动平稳，无异常。',
    prognosis: '按当前趋势短期内无故障风险，预计可稳定运行至下一保养周期。',
    maintain: '维持周期性测温、声级与振动监测，按计划保养并做好油液检测与趋势归档。'
  },
  warn: {
    health: '健康度下降，温度或振动阶段性偏高，处于早期劣化状态。',
    diagnosis: '疑似润滑不足或齿面/轴承早期磨损，振动与声级出现间歇性升高。',
    prognosis: '若工况维持，劣化将缓慢发展，建议在 1～2 个保养周期内安排检修。',
    maintain: '加密监测频次，检查润滑油位与油质，复核联轴器对中，必要时更换润滑油并复查轴承。'
  },
  danger: {
    health: '健康度差，温度/振动显著超限，存在明显故障征兆。',
    diagnosis: '存在齿轮断齿/轴承损坏或严重缺油的高风险特征，振动与温升明显异常。',
    prognosis: '短期内有突发失效风险，继续运行可能造成停机或二次损坏。',
    maintain: '立即停机检查减速机内部齿轮与轴承，更换损坏件与润滑油，确认合格前不得投运。'
  }
}

const gearboxRows = computed<MechRow[]>(() => {
  const data = monitoringData.value
  if (!data) return []
  return data.gearbox.flatMap((p, i) => {
    const h = p.history
    if (h.kind !== 'tripleTrend') return []
    const level = p.status as AssessmentLevel
    return [{
      no: `${i + 1}#`,
      idx: i,
      obj: siteOfLabel(p.label),
      pos: GEARBOX_SHAFT[i] ?? '齿轮箱体',
      title: siteOfLabel(p.label),
      loc: GEARBOX_SHAFT[i] ?? '齿轮箱体',
      temp: statOf(h.temperature, 0),
      sound: statOf(h.sound, 0),
      vib: statOf(h.vibration, 2),
      level,
      assess: GEARBOX_ASSESS[level]
    }]
  })
})

// ── 行走车轮状态诊断 ──────────────────────────────────────────
const WHEEL_POS = [
  '大车主动端·北轨', '大车主动端·南轨', '大车从动端·北轨', '大车从动端·南轨',
  '小车主动端·东侧', '小车主动端·西侧', '小车从动端·东侧', '小车从动端·西侧'
] as const
const WHEEL_ASSESS: Record<AssessmentLevel, AssessText> = {
  normal: {
    health: '健康度良好，轮缘温度、运行噪声与振动均处于正常范围，运行平稳。',
    diagnosis: '未见啃轨、踏面剥离或轴承异响特征，温升与振动平稳。',
    prognosis: '按当前趋势短期内无异常风险，预计可稳定运行至下一保养周期。',
    maintain: '维持周期性温声振监测，定期复核车轮踏面与轨道间隙、轮缘磨损量。'
  },
  warn: {
    health: '健康度下降，温度或振动阶段性偏高，疑似早期啃轨或轴承劣化。',
    diagnosis: '疑似车轮啃轨、踏面磨损不均或轴承早期故障，振动与噪声间歇性升高。',
    prognosis: '若不干预，磨损与冲击将逐步加剧，建议近期安排检查与调整。',
    maintain: '加密监测频次，检查轮缘磨损与轨道直线度，调整大车跨度与车轮对中，必要时更换轴承。'
  },
  danger: {
    health: '健康度差，温度/振动显著超限，存在明显啃轨或轴承损坏征兆。',
    diagnosis: '存在严重啃轨、踏面剥离或轴承损坏的高风险特征，温升与冲击明显异常。',
    prognosis: '短期内有卡轨或轴承抱死风险，继续运行可能损伤轨道与车体结构。',
    maintain: '立即停机检查车轮、轴承与轨道，校正啃轨并更换损坏车轮/轴承，确认合格前不得投运。'
  }
}

const wheelRows = computed<MechRow[]>(() => {
  const data = monitoringData.value
  if (!data) return []
  return data.wheel.flatMap((p, i) => {
    const h = p.history
    if (h.kind !== 'tripleTrend') return []
    const level = p.status as AssessmentLevel
    return [{
      no: `${i + 1}#`,
      idx: i,
      obj: siteOfLabel(p.label),
      pos: WHEEL_POS[i] ?? `车轮 ${i + 1}`,
      title: `行走车轮·${String(i + 1).padStart(2, '0')}#`,
      loc: WHEEL_POS[i] ?? `车轮 ${i + 1}`,
      temp: statOf(h.temperature, 0),
      sound: statOf(h.sound, 0),
      vib: statOf(h.vibration, 2),
      level,
      assess: WHEEL_ASSESS[level]
    }]
  })
})

// ── 制动器状态诊断（闸瓦图像识别式）────────────────────────────
const BRAKE_ASSESS: Record<AssessmentLevel, AssessText> = {
  normal: {
    health: '健康度良好，逐日逐时图像识别显示闸瓦磨损均匀、制动面无裂纹与油污，磨损趋势平缓。',
    diagnosis: '未检测到闸瓦裂纹、过度磨损或异物附着，制动间隙处于正常范围。',
    prognosis: '按当前磨损速率，闸瓦剩余寿命充足，预计可稳定使用至下一保养周期。',
    maintain: '维持周期性图像巡检与制动间隙复核，按计划清洁制动面并记录磨损趋势。'
  },
  warn: {
    health: '健康度一般，部分时段图像识别到闸瓦边缘毛刺或轻度磨损，制动间隙接近上限。',
    diagnosis: '检测到闸瓦轻度磨损/边缘异常，制动间隙偏大，疑似早期劣化。',
    prognosis: '若不调整，磨损与间隙将进一步扩大，建议近期安排制动器保养。',
    maintain: '加密图像巡检，清洁制动面，调整制动间隙至规定范围，必要时更换闸瓦。'
  },
  danger: {
    health: '健康度差，近期图像检测到闸瓦裂纹、过度磨损或异物附着，闸瓦剩余厚度接近报警限值。',
    diagnosis: '识别到制动面裂纹/异物嵌入/闸瓦过度磨损，制动间隙超限，存在制动失效风险。',
    prognosis: '短期内有制动失效高风险，继续作业可能引发溜钩或冲顶事故。',
    maintain: '立即停机更换闸瓦并清除异物，重新调整制动间隙与制动力矩，确认合格前不得作业。'
  }
}
const BRAKE_SURFACE_DANGER = ['制动面可见裂纹', '异物嵌入制动面', '闸瓦过度磨损'] as const

interface BrakeShot {
  id: string; time: string; level: AssessmentLevel
  thickness: number; gap: number; surface: string
}
interface BrakeDay {
  date: string; level: AssessmentLevel
  thickness: number; gap: number
  shots: BrakeShot[]; assess: AssessText
}

const pad2 = (n: number) => String(n).padStart(2, '0')
function dateMinusDays(days: number): string {
  const dt = new Date()
  dt.setDate(dt.getDate() - days)
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}

const BRAKE_HOURS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'] as const

const brakeDays = computed<BrakeDay[]>(() => {
  const dev = props.device
  if (!dev) return []
  const seed = seedHash(`${dev.id}#brake`)
  const rnd = (n: number) => {
    let x = (seed + n * 2654435761) >>> 0
    x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13
    return (x >>> 0) % 1000 / 1000
  }
  const DAYS = 14
  const out: BrakeDay[] = []
  for (let d = 0; d < DAYS; d++) {
    const roll = rnd(d * 7 + 1)
    const level: AssessmentLevel = roll > 0.88 ? 'danger' : roll > 0.7 ? 'warn' : 'normal'
    const wear = level === 'danger' ? 6 : level === 'warn' ? 3 : 0
    const thickness = Math.round((18 - d * 0.05 - wear + rnd(d * 7 + 2) * 1.5) * 10) / 10
    const gap = Math.round((0.8 + (level === 'danger' ? 1.6 : level === 'warn' ? 0.7 : 0) + rnd(d * 7 + 3) * 0.4) * 10) / 10
    const shots: BrakeShot[] = BRAKE_HOURS.map((time, hh) => {
      const sr = rnd(d * 31 + hh * 5 + 4)
      let st: AssessmentLevel = level
      if (level === 'normal' && sr > 0.93) st = 'warn'
      if (level !== 'normal' && sr < 0.22) st = 'normal'
      const surface = st === 'danger'
        ? BRAKE_SURFACE_DANGER[Math.floor(sr * BRAKE_SURFACE_DANGER.length) % BRAKE_SURFACE_DANGER.length]
        : st === 'warn' ? '闸瓦轻度磨损 / 边缘毛刺' : '闸瓦完整、无裂纹与油污'
      const sThk = Math.round((thickness + (st === 'danger' ? -2 : st === 'warn' ? -1 : 0) + sr) * 10) / 10
      const sGap = Math.round((gap + (st === 'danger' ? 0.6 : 0) + sr * 0.3) * 10) / 10
      return { id: `brake-${d}-${hh}`, time, level: st, thickness: sThk, gap: sGap, surface }
    })
    out.push({ date: dateMinusDays(d), level, thickness, gap, shots, assess: BRAKE_ASSESS[level] })
  }
  return out
})

// 当日抓拍弹窗（制动器历史数据查看）
const brakeDayModal = ref<BrakeDay | null>(null)
function openBrakeDay(day: BrakeDay) { brakeDayModal.value = day }
function closeBrakeDay() { brakeDayModal.value = null }

const brakeLightbox = ref<{ day: string; shot: BrakeShot } | null>(null)
function openBrakeShot(day: BrakeDay, shot: BrakeShot) {
  brakeLightbox.value = { day: day.date, shot }
}
function closeBrakeShot() {
  brakeLightbox.value = null
}

/* ── 历史数据文件弹窗（减速机 / 行走车轮 共用：每日 1 个数据文件）── */
type HistMode = 'gearbox' | 'wheel'
interface HistFile { name: string; time: string; sizeMB: number; records: number; level: AssessmentLevel }
interface HistDay { date: string; file: HistFile }

const FILE_META: Record<HistMode, { prefix: string; ext: string; desc: string }> = {
  gearbox: { prefix: 'GEAR', ext: 'dat', desc: '减速机温度 / 声音 / 振动原始波形 · DAT · 采样率 25.6 kHz' },
  wheel: { prefix: 'WHEEL', ext: 'csv', desc: '车轮温声振一体化特征数据 · CSV · 采样率 10 Hz' }
}
const MODE_SALT: Record<HistMode, number> = { gearbox: 6400, wheel: 7700 }

function buildHistoryDays(mode: HistMode, idx: number, level: AssessmentLevel): HistDay[] {
  const baseSeed = seedHash(`${devId.value}-${mode}-${idx}`) + MODE_SALT[mode]
  const rnd = (n: number) => {
    let x = (baseSeed + n * 2654435761) >>> 0
    x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13
    return (x >>> 0) % 1000 / 1000
  }
  const dayCount = 14 + Math.floor(rnd(1) * 8) // 14~21 天
  const meta = FILE_META[mode]
  const days: HistDay[] = []
  for (let d = 0; d < dayCount; d++) {
    const date = dateMinusDays(d)
    const ymd = date.replace(/-/g, '')
    const hour = 6 + Math.floor(rnd(d * 7 + 2) * 4)
    const min = Math.floor(rnd(d * 7 + 3) * 12) * 5
    const time = `${pad2(hour)}:${pad2(min)}`
    const records = 1800 + Math.floor(rnd(d * 7 + 4) * 4600)
    const sizeMB = Math.round(((records / 1000) * (4 + rnd(d * 7 + 5) * 6) / 10) * 10) / 10 + 0.1
    const elevated = rnd(d * 7 + 6) < (level === 'danger' ? 0.34 : level === 'warn' ? 0.2 : 0.06)
    const fLevel: AssessmentLevel = elevated
      ? (level === 'danger' && rnd(d * 7 + 7) < 0.55 ? 'danger' : 'warn')
      : 'normal'
    days.push({
      date,
      file: { name: `${meta.prefix}_P${idx + 1}_${ymd}.${meta.ext}`, time, sizeMB: Math.round(sizeMB * 10) / 10, records, level: fLevel }
    })
  }
  return days
}

const historyModal = ref<{ title: string; location: string; mode: HistMode; days: HistDay[] } | null>(null)
function openHistory(mode: HistMode, idx: number, title: string, location: string, level: AssessmentLevel) {
  historyModal.value = { title, location, mode, days: buildHistoryDays(mode, idx, level) }
}
function closeHistory() { historyModal.value = null }
</script>

<style scoped>
.had-drawer {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.had-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  gap: 0;
}

.had-top-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 12px;
  background: rgba(248, 250, 252, 0.88);
  border-bottom: 1px solid var(--color-border-light);
}

.had-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.had-module-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
}

.had-module-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  border: none;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.16s, color 0.16s, box-shadow 0.16s;
}

.had-module-tab.active {
  background: #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.had-module-tab-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.had-module-tab.active .had-module-tab-title {
  color: var(--color-primary);
}

.had-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
  padding: 12px 16px 16px;
}

.had-panel {
  min-width: 0;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
  overflow: hidden;
}

.had-table-wrap {
  padding: 0 12px 12px;
}

.had-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: var(--radius-md);
}

/* ── 状态诊断通用表格容器 ── */
.had-assess-body {
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.had-assess-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.had-assess-table-wrap {
  flex: 1;
  padding: 12px;
  height: 100%;
  min-height: 0;
}

.had-stat {
  font-weight: 600;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.had-stat em {
  font-style: normal;
  font-weight: 500;
  color: var(--color-text-muted);
}

/* ── 制动器：闸瓦图像识别 ── */
.had-brake-date {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.had-brake-shot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px 6px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-bg-subtle);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
}

.had-brake-shot:hover {
  border-color: rgba(22, 119, 255, 0.4);
  box-shadow: 0 2px 10px rgba(22, 119, 255, 0.12);
  transform: translateY(-1px);
}

.had-brake-shot-img {
  position: relative;
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.18), rgba(148, 163, 184, 0.06));
  color: #94a3b8;
}

.had-brake-shot.is-warn .had-brake-shot-img {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(245, 158, 11, 0.06));
  color: #b45309;
}

.had-brake-shot.is-danger .had-brake-shot-img {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.24), rgba(239, 68, 68, 0.07));
  color: #b91c1c;
}

.had-brake-shot-badge {
  position: absolute;
  right: 4px;
  bottom: 4px;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  color: #fff;
  background: rgba(15, 23, 42, 0.55);
}

.had-brake-shot.is-warn .had-brake-shot-badge { background: rgba(180, 83, 9, 0.9); }
.had-brake-shot.is-danger .had-brake-shot-badge { background: rgba(185, 28, 28, 0.92); }

.had-brake-shot-time {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.had-brake-lightbox {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
}

.had-brake-lightbox-card {
  display: flex;
  gap: 16px;
  width: min(640px, 92vw);
  padding: 16px;
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3);
}

.had-brake-lightbox-img {
  position: relative;
  flex-shrink: 0;
  width: 260px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.06));
  color: #94a3b8;
  font-size: 13px;
}

.had-brake-lightbox-img.is-warn { background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(245, 158, 11, 0.06)); color: #b45309; }
.had-brake-lightbox-img.is-danger { background: linear-gradient(135deg, rgba(239, 68, 68, 0.24), rgba(239, 68, 68, 0.07)); color: #b91c1c; }

.had-brake-lightbox-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.had-brake-lightbox-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.had-brake-lightbox-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.had-brake-lightbox-rows > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-subtle);
  font-size: 13px;
}

.had-brake-lightbox-rows span { color: var(--color-text-muted); }
.had-brake-lightbox-rows strong { color: var(--color-text-primary); }

/* ── 历史数据查看入口按钮 ── */
.had-hist-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.had-hist-link:hover {
  text-decoration: underline;
}

/* ── 通用弹窗外壳 ── */
.had-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 2900;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
}

.had-modal-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 82vh;
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3);
  overflow: hidden;
}

.had-hist-card { max-width: 640px; }
.had-brakeday-card { max-width: 760px; }

.had-modal-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid var(--color-border-light);
}

.had-modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.had-modal-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.had-modal-loc {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.had-modal-close {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.had-modal-close:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
}

.had-modal-sub {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 14px;
  font-size: 11px;
  color: var(--color-text-muted);
  background: rgba(248, 250, 252, 0.7);
  border-bottom: 1px solid var(--color-border-light);
}

/* ── 历史数据文件清单 ── */
.had-hist-head,
.had-hist-row {
  display: grid;
  grid-template-columns: 120px 1fr 48px;
  gap: 12px;
  align-items: center;
  padding: 0 14px;
}

.had-hist-head {
  flex-shrink: 0;
  height: 34px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border-light);
}

.had-hist-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.had-hist-row {
  min-height: 52px;
  padding-top: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
  transition: background 0.15s;
}

.had-hist-row:hover { background: rgba(22, 119, 255, 0.03); }

.had-hist-date {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.had-hist-file {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.had-hist-file-icon { color: var(--color-primary); flex-shrink: 0; }

.had-hist-file-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.had-hist-fname {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-mono, ui-monospace, monospace);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.had-hist-fmeta {
  font-size: 11px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.ta-r { text-align: right; justify-self: end; }

.had-hist-dl {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.had-hist-dl:hover { background: var(--color-bg-subtle); color: var(--color-primary); }

/* ── 制动器当日抓拍弹窗网格 ── */
.had-brakeday-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  padding: 14px;
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(248, 250, 252, 0.6);
  --el-table-row-hover-bg-color: rgba(22, 119, 255, 0.04);
}

:deep(.el-table th.el-table__cell .cell),
:deep(.el-table .el-table__body .cell) {
  font-size: 13px;
}

@media (max-width: 1280px) {
  .had-module-tabs {
    grid-template-columns: 1fr;
  }
}
</style>

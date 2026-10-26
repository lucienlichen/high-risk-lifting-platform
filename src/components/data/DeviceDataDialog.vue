<template>
  <el-dialog
    v-model="visible"
    :title="`${device?.name ?? '设备'} · ${categoryLabel}`"
    width="76%"
    top="6vh"
    class="ddd-dialog"
    append-to-body
  >
    <div class="ddd-body">

      <!-- ── 设备监管基础数据：4 分组 / 35 字段 ── -->
      <template v-if="category === 'basic'">
        <div v-for="section in regSections" :key="section.title" class="section-card" style="margin-bottom:14px">
          <div class="section-card-header"><span class="section-card-title">{{ section.title }}</span></div>
          <div class="section-card-body">
            <div class="ddd-grid">
              <div v-for="f in section.fields" :key="f.label" :class="['ddd-item', { 'ddd-item--full': f.full }]">
                <span class="ddd-item-label">{{ f.label }}</span>
                <span class="ddd-item-value">{{ f.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ── 损伤/故障维修数据：故障维修记录 ── -->
      <template v-else-if="category === 'damage'">
        <div class="section-card">
          <div class="section-card-header">
            <span class="section-card-title">损伤 / 故障维修记录</span>
            <el-tag size="small" type="danger">{{ faultRecords.length }} 条</el-tag>
          </div>
          <el-table :data="faultRecords" style="width:100%">
            <el-table-column prop="date" label="发生时间" width="160" />
            <el-table-column prop="part" label="部位/部件" width="120" />
            <el-table-column prop="type" label="故障类型" width="120" />
            <el-table-column prop="desc" label="损伤/故障描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="duration" label="停机时长" width="100" align="center" />
            <el-table-column prop="resolution" label="维修措施" min-width="160" show-overflow-tooltip />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.resolved ? 'success' : 'danger'" size="small" effect="plain">
                  {{ row.resolved ? '已修复' : '处理中' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <!-- ── 健康监测数据：监测点位简表 ── -->
      <template v-else-if="category === 'health'">
        <div class="section-card">
          <div class="section-card-header">
            <span class="section-card-title">监测点位实时状态</span>
            <el-tag size="small" type="info">{{ healthRows.length }} 个测点</el-tag>
          </div>
          <el-table :data="healthRows" style="width:100%" :default-sort="{ prop: 'order', order: 'ascending' }">
            <el-table-column prop="group" label="监测分类" width="140" />
            <el-table-column prop="point" label="测点" min-width="200" show-overflow-tooltip />
            <el-table-column prop="value" label="当前值" min-width="220" show-overflow-tooltip />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="levelTagType(row.level)" size="small" effect="dark">{{ levelText(row.level) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <template v-else-if="category === 'supply' && supply">
        <div class="section-card">
          <div class="section-card-header">
            <span class="section-card-title">设备制造信息</span>
          </div>
          <div class="section-card-body">
            <div class="ddd-grid">
              <div v-for="item in supplyFields" :key="item.label" class="ddd-item">
                <span class="ddd-item-label">{{ item.label }}</span>
                <span class="ddd-item-value">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="section-card" style="margin-top:14px">
          <div class="section-card-header">
            <span class="section-card-title">技术资料</span>
            <el-tag size="small" type="info">{{ supply.docs.length }} 份</el-tag>
          </div>
          <el-table :data="supply.docs" style="width:100%">
            <el-table-column prop="name" label="资料名称" min-width="280" show-overflow-tooltip />
            <el-table-column prop="kind" label="资料类型" min-width="150" />
            <el-table-column prop="format" label="格式" width="80" align="center" />
            <el-table-column prop="date" label="归档日期" width="120" />
            <el-table-column label="文件大小" width="100" align="right">
              <template #default="{ row }">{{ row.sizeMB.toFixed(1) }} MB</template>
            </el-table-column>
          </el-table>
        </div>
      </template>
      <!-- ── 其余分类：演示占位 ── -->
      <template v-else>
        <div class="section-card">
          <div class="ddd-placeholder">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            <div class="ddd-placeholder-title">{{ categoryLabel }}</div>
            <div class="ddd-placeholder-sub">该分类数据将在正式版本中接入，演示版暂不展示</div>
          </div>
        </div>
      </template>

    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getRemoteMonitoringData, getSupplyForDevice } from '@/mock'
import type { Device } from '@/mock'

const props = defineProps<{
  modelValue: boolean
  device: Device | null
  category: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

type Level = 'normal' | 'warn' | 'danger'

const CATEGORY_LABELS: Record<string, string> = {
  point: '日常点巡检数据',
  damage: '损伤/故障维修数据',
  control: '安全监控数据',
  health: '健康监测数据',
  risk: '风险定量监测数据',
  inspect: '检验检测数据',
  basic: '设备监管基础数据',
  supply: '设备制造供给数据'
}
const categoryLabel = computed(() => CATEGORY_LABELS[props.category] ?? '数据')
const supply = computed(() => props.device ? getSupplyForDevice(props.device) : null)
const supplyFields = computed(() => supply.value ? [
  { label: '设备类型', value: supply.value.type },
  { label: '制造商', value: supply.value.manufacturer },
  { label: '规格型号', value: supply.value.model },
  { label: '额定起重量', value: `${supply.value.tonnage} t` },
  { label: '跨度 / 幅度', value: `${supply.value.span} m` },
  { label: '出厂编号', value: supply.value.factoryNo },
  { label: '出厂日期', value: supply.value.madeDate },
  { label: '投入时间', value: supply.value.commissionDate },
  { label: '使用地点', value: supply.value.user }
] : [])

function levelTagType(level: Level) {
  return level === 'danger' ? 'danger' : level === 'warn' ? 'warning' : 'success'
}
function levelText(level: Level) {
  return level === 'danger' ? '异常' : level === 'warn' ? '预警' : '正常'
}

function seedHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}

// ── 设备监管基础数据：4 分组 / 35 字段（口径对齐参考项目 v3）──
const regPad = (n: number, w = 3) => String(n).padStart(w, '0')
const regSections = computed(() => {
  const d = props.device
  if (!d) return []
  const idNum = (parseInt(d.id.replace(/\D/g, ''), 10) || 0) % 1000
  const runStateMap: Record<string, string> = { running: '运行中', standby: '备用', stopped: '停用', maintenance: '维保中' }
  return [
    { title: '设备基本情况', fields: [
      { label: '设备代码', value: `3010${regPad(2024000 + idNum, 7)}` },
      { label: '设备种类', value: '起重机械' },
      { label: '设备类别', value: '桥式起重机' },
      { label: '设备品种', value: '通用桥式起重机' },
      { label: '设备名称', value: d.name },
      { label: '设备型号', value: `QD${50 + (idNum % 50)}/${10 + (idNum % 10)}t-${28 + (idNum % 6)}.5m` },
      { label: '设备级别', value: 'A7' },
      { label: '主体结构型式', value: '正轨箱形梁' },
      { label: '固定资产值', value: `${380 + idNum * 12} 万元` }
    ] },
    { title: '设备使用登记情况', fields: [
      { label: '设备登记机关名称', value: '南京市市场监督管理局' },
      { label: '使用登记证编号', value: `起11苏A${regPad(idNum, 5)}(23)` },
      { label: '安全状况等级', value: '1级' },
      { label: '使用场所类别', value: '工业生产场所' },
      { label: '监管类别', value: '重点监控' },
      { label: '设备登记机关编号', value: `32010${regPad(idNum)}` },
      { label: '使用登记日期', value: '2023-11-15' },
      { label: '现场监督检查结论', value: '合格' },
      { label: '现场监督检查记录编号', value: `JL-${regPad(idNum, 6)}` }
    ] },
    { title: '设备使用情况', fields: [
      { label: '使用单位名称', value: d.subsidiary || d.group || '江苏中江重工集团有限公司' },
      { label: '使用单位组织机构代码', value: '91320100MA1N8XP9XK' },
      { label: '使用单位法定代表人（负责人）姓名', value: '王建国', full: true },
      { label: '使用单位性质', value: '有限责任公司（国有控股）' },
      { label: '使用单位所属行业', value: '重型装备制造' },
      { label: '产权单位名称', value: d.group || '南京港口集团有限公司' },
      { label: '产权单位组织机构代码', value: '91320100MA7L2K3B9P' },
      { label: '产权单位经济类型', value: '国有控股' },
      { label: '产权单位所属行业', value: '港口与物流' },
      { label: '运行状态', value: runStateMap[d.status] ?? '运行中' },
      { label: '设备使用地点', value: d.location, full: true },
      { label: '设备地理信息（经度）', value: '118.7969°E' },
      { label: '设备地理信息（纬度）', value: '32.0584°N' },
      { label: '设备地理信息（海拔高度）', value: '12 m' }
    ] },
    { title: '设备性能参数', fields: [
      { label: '额定起重量（起重力矩）', value: '主钩 240t / 副钩 60t（4800 t·m）', full: true },
      { label: '起升高度', value: '主钩 25m / 副钩 28m' },
      { label: '总功率', value: '1082 kW' }
    ] }
  ]
})

// ── 损伤/故障维修记录（按设备确定性生成）──
const FAULT_POOL = [
  { part: '制动器', type: '制动故障', desc: '左侧制动器制动力矩不足', resolution: '更换制动片并调整间隙' },
  { part: '电控系统', type: '电气故障', desc: '变频器过温保护动作', resolution: '清洁散热器，调整参数' },
  { part: '减速机', type: '机械故障', desc: '减速机异常振动', resolution: '更换轴承并补充润滑' },
  { part: '检测装置', type: '传感器故障', desc: '编码器信号丢失', resolution: '重新接线固定并标定' },
  { part: '电控系统', type: '电气故障', desc: '主接触器触点烧蚀', resolution: '更换接触器' },
  { part: '主梁', type: '结构损伤', desc: '主梁下翼缘焊缝微裂纹', resolution: '打磨补焊并复探' },
  { part: '钢丝绳', type: '损伤磨损', desc: '钢丝绳断丝超标', resolution: '更换钢丝绳' },
  { part: '大车车轮', type: '机械故障', desc: '车轮踏面磨损啃轨', resolution: '校正啃轨并更换车轮' }
] as const
const FAULT_DATES = ['2026-01-15 14:30', '2025-12-08 09:15', '2025-11-22 16:45', '2025-10-30 11:20', '2026-03-10 08:30', '2026-02-18 10:05']
const FAULT_DUR = ['2.5h', '1.0h', '4.0h', '0.5h', '—', '3.0h']

const faultRecords = computed(() => {
  const d = props.device
  if (!d) return []
  const seed = seedHash(d.id + '#fault')
  const n = 4 + (seed % 3) // 4~6 条
  return Array.from({ length: n }, (_, i) => {
    const p = FAULT_POOL[(seed + i * 7) % FAULT_POOL.length]
    const resolved = i !== 0 // 第一条作为处理中
    return {
      date: FAULT_DATES[i % FAULT_DATES.length],
      part: p.part,
      type: p.type,
      desc: p.desc,
      duration: resolved ? FAULT_DUR[i % FAULT_DUR.length] : '—',
      resolution: resolved ? p.resolution : '等待备件',
      resolved
    }
  })
})

// ── 健康监测数据：监测点位简表 ──
const healthRows = computed(() => {
  const data = props.device ? getRemoteMonitoringData(props.device) : null
  if (!data) return []
  const sections: { group: string; items: typeof data.stress }[] = [
    { group: '结构应力', items: data.stress },
    { group: '结构损伤', items: data.damage },
    { group: '减速机', items: data.gearbox },
    { group: '行走车轮', items: data.wheel }
  ]
  let order = 0
  return sections.flatMap(s =>
    s.items.map(it => ({
      order: order++,
      group: s.group,
      point: it.label.includes('·') ? it.label.split('·').slice(1).join('·') : it.label,
      value: it.value,
      level: it.status as Level
    }))
  )
})
</script>

<style scoped>
.ddd-body { max-height: 70vh; overflow-y: auto; padding-right: 4px; }

.ddd-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 20px;
}
.ddd-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: var(--color-border-light);
  border-radius: var(--radius-sm);
}
.ddd-item--full { grid-column: 1 / -1; }
.ddd-item-label { font-size: 11px; color: var(--color-text-muted); }
.ddd-item-value { font-size: 14px; color: var(--color-text-primary); font-weight: 500; }

.ddd-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 20px;
  color: var(--color-text-muted);
}
.ddd-placeholder-title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); }
.ddd-placeholder-sub { font-size: 13px; }
</style>

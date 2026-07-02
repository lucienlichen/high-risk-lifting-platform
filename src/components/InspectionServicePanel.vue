<template>
  <div class="insp-panel">
    <!-- 子服务页签 -->
    <div class="insp-tabs">
      <button
        v-for="t in subTabs"
        :key="t.id"
        class="insp-tab"
        :class="{ active: subType === t.id }"
        @click="subType = t.id"
      >{{ t.label }}</button>
    </div>

    <div class="insp-scroll">
      <div class="insp-card">
        <header class="insp-card-head">
          <el-icon class="insp-ai"><MagicStick /></el-icon>
          <h3 class="insp-card-title">{{ subMeta.label }} · 到期提醒</h3>
          <span class="insp-card-tag">共 {{ rows.length }} 台设备</span>
        </header>

        <el-table :data="rows" size="small" style="width:100%" height="100%" class="insp-table">
          <el-table-column prop="no" label="序号" width="64" />
          <el-table-column label="设备名称" min-width="150">
            <template #default="{ row }">
              <span class="insp-dev"><span class="insp-dot" :class="`insp-dot-${row.status}`"></span>{{ row.deviceName }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="`${cat}周期`" width="90">
            <template #default="{ row }">{{ row.cycleY }} 年</template>
          </el-table-column>
          <el-table-column :label="`历史${cat}报告`" width="120">
            <template #default="{ row }">
              <button class="insp-link" @click="openReports(row)">
                <el-icon><Search /></el-icon> 查看（{{ row.reports.length }} 份）
              </button>
            </template>
          </el-table-column>
          <el-table-column :label="`上次${cat}日期`" prop="lastDate" width="120" />
          <el-table-column :label="subType === 'inspection' ? '下次检验日期' : '预计下次检测时间'" width="140">
            <template #default="{ row }">
              <span class="insp-next" :class="`insp-text-${row.status}`">{{ row.nextDate }}</span>
            </template>
          </el-table-column>
          <el-table-column label="报警提醒" width="130">
            <template #default="{ row }">
              <el-tag :type="tagType(row.status)" size="small" effect="light">{{ statusLabel[row.status] }}</el-tag>
              <div class="insp-days" :class="`insp-text-${row.status}`">{{ daysLabel(row) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="建议" min-width="300">
            <template #default="{ row }">
              <span class="insp-advice">{{ row.advice }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 历史报告弹窗 -->
    <el-dialog v-model="reportVisible" width="640px" append-to-body :title="reportTitle">
      <div class="insp-rep-sub">
        <span>历次{{ cat }}报告（新→旧）</span>
        <span v-if="activeRow">共 {{ activeRow.reports.length }} 份</span>
      </div>
      <div v-if="activeRow" class="insp-rep-list">
        <div v-for="rep in activeRow.reports" :key="rep.id" class="insp-rep">
          <span class="insp-rep-date"><el-icon><Calendar /></el-icon>{{ rep.date }}</span>
          <div class="insp-rep-main">
            <el-icon class="insp-rep-file"><Document /></el-icon>
            <div class="insp-rep-info">
              <div class="insp-rep-name">{{ rep.name }}</div>
              <div class="insp-rep-meta">
                <span :class="rep.conclusion === '合格' ? 'insp-ok' : 'insp-warn'"><el-icon><CircleCheck /></el-icon>{{ rep.conclusion }}</span>
                <span>{{ rep.org }}</span>
                <span>{{ rep.sizeMB.toFixed(1) }} MB</span>
              </div>
            </div>
          </div>
          <button class="insp-dl" title="下载报告（演示）"><el-icon><Download /></el-icon></button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MagicStick, Search, Calendar, Document, CircleCheck, Download } from '@element-plus/icons-vue'
import { useSceneStore } from '@/stores/scene'
import { getDevices, getInspectionRows, type InspectSubType, type InspectStatus, type InspectRow, type SceneId } from '@/mock'

defineEmits<{ (e: 'close'): void }>()
const store = useSceneStore()

const scene = computed<SceneId>(() => {
  const fromDevice = store.currentDeviceId?.split('-')[0]
  return (fromDevice as SceneId) || store.currentScene
})
const devices = computed(() => getDevices(scene.value, 1, 9999).list.map((d) => ({ id: d.id, name: d.name })))

const subTabs: { id: InspectSubType; label: string }[] = [
  { id: 'inspection', label: '定期检验智能服务' },
  { id: 'detection', label: '检测智能服务' },
]
const subType = ref<InspectSubType>('inspection')
const subMeta = computed(() => subTabs.find((t) => t.id === subType.value)!)
const cat = computed(() => (subType.value === 'inspection' ? '检验' : '检测'))

const rows = computed<InspectRow[]>(() => getInspectionRows(devices.value, subType.value))

const statusLabel: Record<InspectStatus, string> = { overdue: '已逾期', urgent: '即将到期', warning: '临近到期', ok: '正常' }
const tagType = (s: InspectStatus) => (s === 'overdue' ? 'danger' : s === 'urgent' ? 'danger' : s === 'warning' ? 'warning' : 'success')
const daysLabel = (r: InspectRow) => (r.daysUntil < 0 ? `已逾期 ${-r.daysUntil} 天` : `剩余 ${r.daysUntil} 天`)

const reportVisible = ref(false)
const activeRow = ref<InspectRow | null>(null)
const reportTitle = computed(() => (activeRow.value ? `${activeRow.value.deviceName} · 历史${cat.value}报告` : '历史报告'))
function openReports(row: InspectRow) {
  activeRow.value = row
  reportVisible.value = true
}
</script>

<style scoped>
.insp-panel { position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; background: #f8fafc; }

.insp-tabs { flex-shrink: 0; display: flex; gap: 8px; padding: 10px 16px; background: var(--color-card-bg); border-bottom: 1px solid var(--color-border-light); }
.insp-tab { height: 34px; padding: 0 16px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-card-bg); color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.insp-tab:hover { color: var(--color-primary); border-color: var(--color-primary); }
.insp-tab.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

.insp-scroll { flex: 1; min-height: 0; padding: 16px; display: flex; }
.insp-card { flex: 1; min-height: 0; display: flex; flex-direction: column; background: var(--color-card-bg); border: 1px solid var(--color-card-border); border-radius: var(--radius-md); box-shadow: var(--color-card-shadow); overflow: hidden; }
.insp-card-head { flex-shrink: 0; height: 48px; padding: 0 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--color-border-light); }
.insp-ai { color: var(--color-primary); }
.insp-card-title { font-size: 15px; font-weight: 600; color: var(--color-text-primary); margin: 0; }
.insp-card-tag { display: inline-flex; align-items: center; height: 20px; padding: 0 8px; border-radius: 4px; font-size: 11px; background: #eef2f7; color: var(--color-text-muted); }
.insp-table { flex: 1; min-height: 0; }

.insp-dev { display: inline-flex; align-items: center; gap: 6px; font-weight: 500; color: var(--color-text-primary); }
.insp-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.insp-dot-overdue { background: var(--color-danger); }
.insp-dot-urgent { background: #f97316; }
.insp-dot-warning { background: var(--color-warning); }
.insp-dot-ok { background: var(--color-success); }
.insp-text-overdue { color: var(--color-danger); }
.insp-text-urgent { color: #ea580c; }
.insp-text-warning { color: var(--color-warning); }
.insp-text-ok { color: var(--color-success); }
.insp-next { font-weight: 600; }
.insp-days { font-size: 11px; margin-top: 2px; }
.insp-advice { font-size: 12px; color: var(--color-text-secondary); line-height: 1.5; }
.insp-link { display: inline-flex; align-items: center; gap: 4px; border: none; background: transparent; color: var(--color-primary); font-size: 12px; font-weight: 600; cursor: pointer; }
.insp-link:hover { text-decoration: underline; }

.insp-rep-sub { display: flex; justify-content: space-between; font-size: 11px; color: var(--color-text-muted); padding-bottom: 8px; border-bottom: 1px solid var(--color-border-light); margin-bottom: 8px; }
.insp-rep-list { display: flex; flex-direction: column; max-height: 60vh; overflow-y: auto; }
.insp-rep { flex-shrink: 0; display: grid; grid-template-columns: 110px 1fr 40px; gap: 12px; align-items: center; padding: 10px 4px; border-bottom: 1px solid var(--color-border-light); }
.insp-rep-date { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-text-secondary); }
.insp-rep-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.insp-rep-file { color: var(--color-danger); font-size: 18px; }
.insp-rep-info { min-width: 0; }
.insp-rep-name { font-size: 13px; font-weight: 500; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.insp-rep-meta { display: flex; gap: 10px; font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
.insp-rep-meta > span { display: inline-flex; align-items: center; gap: 2px; }
.insp-ok { color: var(--color-success); }
.insp-warn { color: var(--color-warning); }
.insp-dl { width: 28px; height: 28px; border: none; background: transparent; border-radius: var(--radius-sm); color: var(--color-text-muted); cursor: pointer; }
.insp-dl:hover { background: #eef2f7; color: var(--color-primary); }
</style>

<template>
  <div class="rep-panel">
    <div v-if="!device" class="rep-empty">
      <el-icon :size="40"><Tools /></el-icon>
      <p class="rep-empty-title">请选择设备</p>
      <p class="rep-empty-desc">选择设备后查看其损伤/故障维修记录与 AI 更换维保建议。</p>
    </div>

    <div v-else class="rep-scroll">
      <section v-for="g in groups" :key="g.key" class="rep-section">
        <header class="rep-head">
          <div class="rep-head-left">
            <span class="rep-bar"></span>
            <el-icon><Tools /></el-icon>
            <h3 class="rep-title">{{ g.name }}</h3>
            <span class="rep-count-tag">{{ g.records.length }} 条</span>
          </div>
          <button class="rep-regen" :disabled="generating[g.key]" @click="regenerate(g.key)">
            <el-icon :class="{ 'rep-spin': generating[g.key] }"><MagicStick /></el-icon>
            {{ generating[g.key] ? '生成中…' : '重新生成建议' }}
          </button>
        </header>

        <div class="rep-body">
          <!-- 左：历史维修记录 -->
          <div class="rep-records">
            <el-table :data="pagedRecords(g)" size="small" style="width:100%">
              <el-table-column prop="date" label="维修时间" width="110" />
              <el-table-column prop="damage" label="损伤 / 故障描述" min-width="160">
                <template #default="{ row }"><span class="rep-damage">{{ row.damage }}</span></template>
              </el-table-column>
              <el-table-column label="维修内容" min-width="220">
                <template #default="{ row }">
                  <span class="rep-content">{{ row.content }}</span>
                  <span class="rep-sub">· 停机 {{ row.downtime }}h · {{ row.handler }}</span>
                </template>
              </el-table-column>
            </el-table>
            <div class="rep-pager">
              <span class="rep-pager-info">共 {{ g.records.length }} 条 · 每页 {{ PAGE_SIZE }} 条</span>
              <el-pagination
                small
                layout="prev, pager, next"
                :total="g.records.length"
                :page-size="PAGE_SIZE"
                :current-page="pageOf(g.key)"
                @current-change="(p:number) => setPage(g.key, p)"
              />
            </div>
          </div>

          <!-- 右：AI 建议 -->
          <div class="rep-advice">
            <div class="rep-advice-head">
              <el-icon class="rep-ai-icon"><MagicStick /></el-icon>
              <span class="rep-advice-title">AI 更换 / 维保建议</span>
              <span class="rep-urgency" :class="`rep-urg-${toneOf(g.advice.urgency)}`">{{ g.advice.urgency }}紧迫度</span>
              <span class="rep-advice-ref">参考该组全部历史</span>
            </div>

            <div v-if="generating[g.key]" class="rep-generating">
              <el-icon class="rep-spin"><Loading /></el-icon>
              正在结合该分组全部历史维修记录生成建议…
            </div>
            <template v-else>
              <p class="rep-summary">{{ g.advice.summary }}</p>
              <div class="rep-advice-card">
                <div class="rep-advice-row">
                  <span class="rep-advice-label rep-danger"><el-icon><RefreshRight /></el-icon> 更换</span>
                  <span class="rep-advice-text">{{ g.advice.replace }}</span>
                </div>
                <div class="rep-advice-time" :class="{ 'rep-danger': g.advice.overdue }">
                  <el-icon><Clock /></el-icon>
                  建议更换时间：{{ g.advice.suggestTime }}
                </div>
                <div class="rep-advice-row">
                  <span class="rep-advice-label rep-success"><el-icon><CircleCheck /></el-icon> 维保</span>
                  <span class="rep-advice-text">{{ g.advice.maintain }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Tools, MagicStick, Loading, RefreshRight, Clock, CircleCheck } from '@element-plus/icons-vue'
import { getRepairGroups, type RepairGroup } from '@/mock'
import type { Device } from '@/mock'

const props = defineProps<{ device: Device | null }>()
defineEmits<{ (e: 'close'): void }>()

const PAGE_SIZE = 6
const groups = computed<RepairGroup[]>(() => (props.device ? getRepairGroups(props.device.id) : []))

const pageByGroup = ref<Record<string, number>>({})
const pageOf = (key: string) => pageByGroup.value[key] ?? 1
const setPage = (key: string, p: number) => { pageByGroup.value = { ...pageByGroup.value, [key]: p } }
const pagedRecords = (g: RepairGroup) => {
  const p = pageOf(g.key)
  return g.records.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE)
}

const toneOf = (u: '高' | '中' | '低') => (u === '高' ? 'high' : u === '中' ? 'mid' : 'low')

const generating = ref<Record<string, boolean>>({})
const timers: Record<string, ReturnType<typeof setTimeout>> = {}
const regenerate = (key: string) => {
  if (generating.value[key]) return
  generating.value = { ...generating.value, [key]: true }
  if (timers[key]) clearTimeout(timers[key])
  timers[key] = setTimeout(() => { generating.value = { ...generating.value, [key]: false } }, 700)
}

watch(() => props.device?.id, () => { pageByGroup.value = {}; generating.value = {} })
</script>

<style scoped>
.rep-panel {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}
.rep-scroll { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 16px; display: flex; flex-direction: column; gap: 16px; }

.rep-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--color-text-muted); }
.rep-empty-title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); }
.rep-empty-desc { font-size: 13px; }

.rep-section { flex-shrink: 0; background: var(--color-card-bg); border: 1px solid var(--color-card-border); border-radius: var(--radius-md); box-shadow: var(--color-card-shadow); overflow: hidden; }
.rep-head { height: 48px; padding: 0 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border-light); }
.rep-head-left { display: flex; align-items: center; gap: 8px; color: var(--color-text-secondary); }
.rep-bar { width: 4px; height: 16px; border-radius: 999px; background: var(--color-primary); }
.rep-title { font-size: 15px; font-weight: 600; color: var(--color-text-primary); margin: 0; }
.rep-count-tag { display: inline-flex; align-items: center; height: 22px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #eef2f7; color: var(--color-text-muted); }

.rep-regen { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 14px; border: none; border-radius: var(--radius-sm); background: var(--color-primary); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
.rep-regen:hover { opacity: 0.9; }
.rep-regen:disabled { opacity: 0.5; cursor: default; }
.rep-spin { animation: rep-rot 0.9s linear infinite; }
@keyframes rep-rot { to { transform: rotate(360deg); } }

.rep-body { display: flex; }
@media (max-width: 1100px) { .rep-body { flex-direction: column; } }
.rep-records { width: 56%; border-right: 1px solid var(--color-border-light); display: flex; flex-direction: column; }
@media (max-width: 1100px) { .rep-records { width: 100%; border-right: none; border-bottom: 1px solid var(--color-border-light); } }
.rep-damage { font-weight: 600; color: var(--color-text-primary); }
.rep-content { color: var(--color-text-secondary); }
.rep-sub { color: var(--color-text-muted); font-size: 12px; margin-left: 4px; }
.rep-pager { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 14px; border-top: 1px solid var(--color-border-light); }
.rep-pager-info { font-size: 12px; color: var(--color-text-muted); }

.rep-advice { flex: 1; padding: 14px 16px; background: rgba(245, 34, 45, 0.03); }
.rep-advice-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.rep-ai-icon { color: var(--color-primary); }
.rep-advice-title { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.rep-urgency { height: 20px; padding: 0 8px; display: inline-flex; align-items: center; border-radius: 4px; font-size: 11px; font-weight: 600; }
.rep-urg-high { background: var(--color-danger-bg); color: var(--color-danger); }
.rep-urg-mid { background: var(--color-warning-bg); color: var(--color-warning); }
.rep-urg-low { background: var(--color-primary-light); color: var(--color-primary); }
.rep-advice-ref { margin-left: auto; font-size: 11px; color: var(--color-text-muted); }

.rep-generating { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 24px; font-size: 13px; color: var(--color-text-secondary); }
.rep-summary { font-size: 12px; color: var(--color-text-secondary); margin: 0 0 10px; line-height: 1.6; }
.rep-advice-card { background: var(--color-card-bg); border: 1px solid var(--color-border-light); border-radius: var(--radius-sm); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.rep-advice-row { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }
.rep-advice-label { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; flex-shrink: 0; padding-top: 2px; }
.rep-danger { color: var(--color-danger); }
.rep-success { color: var(--color-success); }
.rep-advice-text { flex: 1; }
.rep-advice-time { display: flex; align-items: center; gap: 6px; margin-left: 38px; font-size: 12px; font-weight: 500; color: var(--color-text-secondary); }
</style>

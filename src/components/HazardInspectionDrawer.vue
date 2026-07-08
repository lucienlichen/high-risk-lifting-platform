<template>
  <div class="hzd-drawer">
    <div class="hzd-shell">
      <!-- Top bar -->
      <div class="hzd-top-bar">
        <div class="hzd-top-left">
          <el-icon class="hzd-top-icon"><WarnTriangleFilled /></el-icon>
          <span class="hzd-top-title">设备排查</span>
        </div>
        <div class="hzd-actions">
          <el-tag type="danger" effect="plain" round>隐患排查</el-tag>
          <el-button size="small" circle @click="emit('close')">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <div v-if="device" class="hzd-body">
        <!-- Left: history records -->
        <aside class="hzd-side">
          <div class="hzd-side-tools">
            <button class="hzd-tool-btn" :class="{ active: !selectedRecord }" @click="selectedRecord = null">
              <el-icon><Document /></el-icon>生成排查表单
            </button>
            <button class="hzd-tool-btn primary">
              <el-icon><Upload /></el-icon>上传并保存
            </button>
          </div>

          <div class="hzd-side-head">
            <span>历史记录</span>
            <span class="hzd-side-count">{{ records.length }}</span>
          </div>

          <div class="hzd-side-list">
            <template v-if="records.length === 0">
              <div class="hzd-side-empty">
                <el-icon><Clock /></el-icon>
                <span>暂无排查历史</span>
              </div>
            </template>
            <template v-else>
              <div v-for="group in groupedRecords" :key="group.year" class="hzd-year-group">
                <div class="hzd-year-label">{{ group.year }} 年度</div>
                <button
                  v-for="rec in group.records"
                  :key="rec.id"
                  class="hzd-rec"
                  :class="{ active: selectedRecord?.id === rec.id }"
                  @click="selectRecord(rec)"
                >
                  <span class="hzd-rec-date"><el-icon><Calendar /></el-icon>{{ rec.date }}</span>
                  <span class="hzd-rec-user"><el-icon><User /></el-icon>{{ rec.inspector }}</span>
                  <span class="hzd-rec-overview">
                    <template v-if="rec.majorCount > 0 || rec.normalCount > 0">
                      <span v-if="rec.majorCount > 0" class="hzd-pill major">重大{{ rec.majorCount }}</span>
                      <span v-if="rec.normalCount > 0" class="hzd-pill normal">一般{{ rec.normalCount }}</span>
                    </template>
                    <span v-else class="hzd-pill ok"><el-icon><CircleCheck /></el-icon>无</span>
                  </span>
                </button>
              </div>
            </template>
          </div>
        </aside>

        <!-- Right: blank form preview OR record detail -->
        <section class="hzd-main">
          <!-- Blank form preview -->
          <template v-if="!selectedRecord">
            <div class="hzd-form-head">
              <h2 class="hzd-form-title">{{ device.name }} - 起重机械隐患排查表</h2>
              <div class="hzd-form-meta">
                <span>使用单位：{{ device.group || '________________' }}</span>
                <span>设备代码：{{ device.code || '________________' }}</span>
              </div>
              <div class="hzd-form-meta">
                <span>排查人员：________________</span>
                <span>排查日期：____年__月__日</span>
              </div>
              <button class="hzd-template-btn">
                <el-icon><Download /></el-icon>下载模版
              </button>
            </div>

            <div class="hzd-form-body">
              <div class="hzd-sheet">
                <div class="hzd-sheet-head">一、重大事故隐患</div>
                <div class="hzd-sheet-row" v-for="(item, idx) in majorItems" :key="item.id">
                  <div class="hzd-sheet-no">{{ idx + 1 }}</div>
                  <div class="hzd-sheet-content">{{ item.content }}</div>
                  <div class="hzd-sheet-check">
                    <span>有</span><i class="hzd-box"></i>
                    <span>无</span><i class="hzd-box"></i>
                  </div>
                </div>
              </div>

              <div class="hzd-sheet">
                <div class="hzd-sheet-head">二、一般事故隐患</div>
                <div v-for="sub in generalSubGroups" :key="sub.title">
                  <div class="hzd-sheet-subhead">{{ sub.title }}</div>
                  <div class="hzd-sheet-row" v-for="(item, idx) in sub.items" :key="item.id">
                    <div class="hzd-sheet-no">{{ idx + 1 }}</div>
                    <div class="hzd-sheet-content">{{ item.content }}</div>
                    <div class="hzd-sheet-check">
                      <span>有</span><i class="hzd-box"></i>
                      <span>无</span><i class="hzd-box"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Record detail -->
          <template v-else>
            <div class="hzd-detail-stats">
              <div class="hzd-stat">
                <span class="hzd-stat-label">总项数</span>
                <span class="hzd-stat-value">{{ totalItems }}</span>
              </div>
              <div class="hzd-stat">
                <span class="hzd-stat-label" style="color: var(--color-danger);">重大事故隐患</span>
                <span class="hzd-stat-value" style="color: var(--color-danger);">{{ selectedRecord.majorCount }}</span>
              </div>
              <div class="hzd-stat">
                <span class="hzd-stat-label" style="color: var(--color-warning);">一般事故隐患</span>
                <span class="hzd-stat-value" style="color: var(--color-warning);">{{ selectedRecord.normalCount }}</span>
              </div>
            </div>

            <div class="hzd-detail-body">
              <!-- 重大事故隐患 -->
              <div class="hzd-group major">
                <button class="hzd-group-head" @click="toggle('major')">
                  <el-icon><component :is="collapsed.has('major') ? ArrowRight : ArrowDown" /></el-icon>
                  <span class="hzd-group-title">重大事故隐患</span>
                  <span class="hzd-group-count">（{{ majorItems.length }}项）</span>
                </button>
                <div v-show="!collapsed.has('major')" class="hzd-group-items">
                  <div v-for="item in majorItems" :key="item.id" class="hzd-item">
                    <div class="hzd-item-content">
                      <p>{{ item.content }}</p>
                      <p v-if="remarkOf(item.id)" class="hzd-item-remark">备注：{{ remarkOf(item.id) }}</p>
                    </div>
                    <span class="hzd-item-result" :style="{ color: resultColor(resultOf(item.id)) }">{{ resultOf(item.id) }}</span>
                  </div>
                </div>
              </div>

              <!-- 一般事故隐患 -->
              <div class="hzd-group normal">
                <button class="hzd-group-head" @click="toggle('general')">
                  <el-icon><component :is="collapsed.has('general') ? ArrowRight : ArrowDown" /></el-icon>
                  <span class="hzd-group-title">一般事故隐患</span>
                  <span class="hzd-group-count">（{{ generalCount }}项）</span>
                </button>
                <div v-show="!collapsed.has('general')" class="hzd-subgroups">
                  <div v-for="sub in generalSubGroups" :key="sub.title" class="hzd-subgroup">
                    <button class="hzd-subgroup-head" @click="toggle('sub-' + sub.title)">
                      <el-icon><component :is="collapsed.has('sub-' + sub.title) ? ArrowRight : ArrowDown" /></el-icon>
                      <span>{{ sub.title }}</span>
                      <span class="hzd-group-count">（{{ sub.items.length }}项）</span>
                    </button>
                    <div v-show="!collapsed.has('sub-' + sub.title)" class="hzd-group-items">
                      <div v-for="item in sub.items" :key="item.id" class="hzd-item">
                        <div class="hzd-item-content">
                          <p>{{ item.content }}</p>
                          <p v-if="remarkOf(item.id)" class="hzd-item-remark">备注：{{ remarkOf(item.id) }}</p>
                        </div>
                        <span class="hzd-item-result" :style="{ color: resultColor(resultOf(item.id)) }">{{ resultOf(item.id) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 整改建议 -->
              <div class="hzd-suggestion">
                <h4><el-icon><WarningFilled /></el-icon>整改建议</h4>
                <p>{{ selectedRecord.aiSuggestion }}</p>
              </div>
            </div>
          </template>
        </section>
      </div>

      <div v-else class="hzd-empty">
        <el-empty description="请先选择设备以开始隐患排查" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Close, WarnTriangleFilled, WarningFilled, Document, Upload, Download,
  Clock, Calendar, User, CircleCheck, ArrowRight, ArrowDown
} from '@element-plus/icons-vue'
import { getDeviceHazardRecords, majorItems, generalSubGroups } from '@/mock/hazardCheck'
import type { DeviceCheckRecord, CheckResult } from '@/mock/hazardCheck'
import { CHECK_ITEMS } from '@/mock/hazardCheck'
import type { Device } from '@/mock'

const props = defineProps<{
  device: Device | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const totalItems = CHECK_ITEMS.length
const generalCount = computed(() => totalItems - majorItems.length)

const records = computed<DeviceCheckRecord[]>(() =>
  props.device ? getDeviceHazardRecords(props.device) : []
)

const groupedRecords = computed(() => {
  const groups = new Map<number, DeviceCheckRecord[]>()
  for (const rec of records.value) {
    if (!groups.has(rec.year)) groups.set(rec.year, [])
    groups.get(rec.year)!.push(rec)
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, recs]) => ({ year, records: recs }))
})

const selectedRecord = ref<DeviceCheckRecord | null>(null)

// 切换设备时重置选中态
watch(() => props.device?.id, () => { selectedRecord.value = null })

function selectRecord(rec: DeviceCheckRecord) {
  selectedRecord.value = rec
}

function resultOf(itemId: number): CheckResult {
  return selectedRecord.value?.results[itemId]?.result ?? '无'
}

function remarkOf(itemId: number): string {
  return selectedRecord.value?.results[itemId]?.remark ?? ''
}

function resultColor(result: CheckResult) {
  return result === '有' ? 'var(--color-danger)' : 'var(--color-success)'
}

const collapsed = ref<Set<string>>(new Set())
function toggle(id: string) {
  const s = new Set(collapsed.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  collapsed.value = s
}
</script>

<style scoped>
.hzd-drawer {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.hzd-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.hzd-top-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 12px;
  background: rgba(248, 250, 252, 0.88);
  border-bottom: 1px solid var(--color-border-light);
}

.hzd-top-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hzd-top-icon {
  color: var(--color-danger);
  font-size: 18px;
}

.hzd-top-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.hzd-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hzd-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 14px;
  padding: 14px;
  overflow: hidden;
}

/* ── Left side ── */
.hzd-side {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
  overflow: hidden;
}

.hzd-side-tools {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--color-border-light);
}

.hzd-tool-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 6px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.hzd-tool-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.hzd-tool-btn.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.hzd-tool-btn.primary {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.hzd-tool-btn.primary:hover {
  background: var(--color-primary-hover);
}

.hzd-side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--color-border-light);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.hzd-side-count {
  padding: 0 7px;
  background: var(--color-border);
  color: var(--color-text-secondary);
  border-radius: 10px;
  font-size: 11px;
}

.hzd-side-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.hzd-side-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

.hzd-side-empty .el-icon {
  font-size: 32px;
  color: var(--color-border);
}

.hzd-year-label {
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-border-light);
}

.hzd-rec {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: none;
  border-left: 3px solid transparent;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-card-bg);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.hzd-rec:hover {
  background: var(--color-nav-hover-bg);
}

.hzd-rec.active {
  background: var(--color-primary-light);
  border-left-color: var(--color-primary);
}

.hzd-rec-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 92px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.hzd-rec-date .el-icon,
.hzd-rec-user .el-icon {
  color: var(--color-text-muted);
  font-size: 13px;
}

.hzd-rec-user {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 52px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.hzd-rec-overview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.hzd-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.hzd-pill.major {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.hzd-pill.normal {
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.hzd-pill.ok {
  color: var(--color-success);
  background: transparent;
}

/* ── Right main ── */
.hzd-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
  overflow: hidden;
}

/* Blank form */
.hzd-form-head {
  position: relative;
  flex-shrink: 0;
  padding: 22px 24px 16px;
  text-align: center;
  border-bottom: 1px solid var(--color-border-light);
}

.hzd-form-title {
  font-size: 19px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 14px;
}

.hzd-form-meta {
  display: flex;
  justify-content: space-between;
  max-width: 620px;
  margin: 6px auto 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.hzd-template-btn {
  position: absolute;
  top: 18px;
  right: 22px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.hzd-template-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.hzd-form-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hzd-sheet {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.hzd-sheet-head {
  padding: 9px 14px;
  background: var(--color-border-light);
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.hzd-sheet-subhead {
  padding: 6px 14px;
  background: var(--color-content-bg);
  border-bottom: 1px solid var(--color-border-light);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.hzd-sheet-row {
  display: flex;
  border-bottom: 1px solid var(--color-border-light);
}

.hzd-sheet-row:last-child {
  border-bottom: none;
}

.hzd-sheet-no {
  width: 48px;
  flex-shrink: 0;
  padding: 10px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
  border-right: 1px solid var(--color-border-light);
}

.hzd-sheet-content {
  flex: 1;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.hzd-sheet-check {
  width: 132px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-left: 1px solid var(--color-border-light);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.hzd-box {
  width: 15px;
  height: 15px;
  border: 1px solid var(--color-border);
  border-radius: 3px;
  display: inline-block;
}

/* Detail */
.hzd-detail-stats {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 14px;
  background: var(--color-content-bg);
  border-bottom: 1px solid var(--color-border-light);
}

.hzd-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px;
  background: var(--color-card-bg);
  border-radius: var(--radius-sm);
  box-shadow: var(--color-card-shadow);
}

.hzd-stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.hzd-stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.hzd-detail-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hzd-group {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.hzd-group.major { border-color: rgba(245, 34, 45, 0.3); }
.hzd-group.normal { border-color: rgba(250, 140, 22, 0.3); }

.hzd-group-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.hzd-group.major .hzd-group-head {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.hzd-group.normal .hzd-group-head {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.hzd-group-count {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.8;
}

.hzd-group-items {
  display: flex;
  flex-direction: column;
}

.hzd-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  background: var(--color-card-bg);
  border-top: 1px solid var(--color-border-light);
}

.hzd-item-content {
  flex: 1;
  min-width: 0;
}

.hzd-item-content p {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.hzd-item-remark {
  margin-top: 3px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.hzd-item-result {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 700;
}

.hzd-subgroups {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--color-card-bg);
}

.hzd-subgroup {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.hzd-subgroup-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: var(--color-content-bg);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.hzd-suggestion {
  padding: 14px;
  background: var(--color-content-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
}

.hzd-suggestion h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.hzd-suggestion h4 .el-icon {
  color: var(--color-warning);
}

.hzd-suggestion p {
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.hzd-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

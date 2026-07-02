<template>
  <div class="spc-panel">
    <!-- 未选设备 -->
    <div v-if="!board" class="spc-empty">
      <el-icon :size="40"><Search /></el-icon>
      <p class="spc-empty-title">请选择设备</p>
      <p class="spc-empty-desc">选择设备后查看其点巡检问题统计与文本分析。</p>
    </div>

    <div v-else class="spc-scroll">
      <!-- 概览统计卡 -->
      <div class="spc-stat-grid">
        <div class="spc-stat-card">
          <div class="spc-stat-label"><el-icon><Tickets /></el-icon> 已分析点巡检表</div>
          <div class="spc-stat-value">{{ board.formCount }}<span class="spc-stat-unit">份</span></div>
        </div>
        <div class="spc-stat-card">
          <div class="spc-stat-label"><el-icon><WarningFilled /></el-icon> 累计发现问题</div>
          <div class="spc-stat-value spc-danger">{{ board.totalProblems }}<span class="spc-stat-unit">项</span></div>
        </div>
        <div class="spc-stat-card">
          <div class="spc-stat-label"><el-icon><Files /></el-icon> 涉及部件</div>
          <div class="spc-stat-value">{{ board.involvedParts }}<span class="spc-stat-unit">/ {{ board.items.length }} 类</span></div>
        </div>
        <div class="spc-stat-card">
          <div class="spc-stat-label"><el-icon><PieChart /></el-icon> 高频部件</div>
          <div class="spc-stat-value spc-warning spc-stat-part" :title="board.topPart">{{ board.topPart }}</div>
        </div>
      </div>

      <!-- 巡检问题统计 -->
      <section class="spc-section">
        <header class="spc-section-head">
          <div class="spc-section-title"><span class="spc-bar"></span>巡检问题统计</div>
          <span class="spc-section-sub">按发现问题次数降序 · 来源 {{ board.formCount }} 份点巡检表</span>
        </header>
        <div class="spc-part-grid">
          <div v-for="(it, idx) in board.items" :key="it.key" class="spc-part-item">
            <span class="spc-rank" :class="{ 'spc-rank-top': idx < 3 }">{{ idx + 1 }}</span>
            <div class="spc-part-body">
              <div class="spc-part-row">
                <span class="spc-part-name">{{ it.name }}</span>
                <button
                  class="spc-count"
                  :class="[`spc-count-${levelOf(it.count)}`, { 'spc-count-clickable': it.count > 0 }]"
                  :disabled="it.count === 0"
                  :title="it.count > 0 ? '点击查看文本分析' : '本期未发现问题'"
                  @click="openText(it)"
                >{{ it.count }} 次</button>
              </div>
              <div class="spc-track">
                <div class="spc-track-fill" :class="`spc-fill-${levelOf(it.count)}`" :style="{ width: `${Math.round((it.count / board.maxCount) * 100)}%` }"></div>
              </div>
              <div class="spc-part-foot">
                <div class="spc-tags">
                  <template v-if="it.topProblems.length">
                    <span v-for="prob in it.topProblems" :key="prob" class="spc-tag">{{ prob }}</span>
                  </template>
                  <span v-else class="spc-none">本期未发现问题</span>
                </div>
                <button v-if="it.count > 0" class="spc-link" @click="openText(it)">
                  <el-icon><Document /></el-icon> 文本分析
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 文本分析弹窗：原始文本 → 结构化信息 -->
    <el-dialog
      v-model="textVisible"
      width="820px"
      append-to-body
      :title="analysisPart ? `${analysisPart.name} · 文本分析` : '文本分析'"
    >
      <div v-if="analysisPart" class="spc-modal-sub">
        原始巡检文本 → 结构化信息抽取 · 共 {{ analysisPart.records.length }} 条
      </div>
      <div v-if="analysisPart" class="spc-rec-list">
        <div v-for="rec in analysisPart.records" :key="rec.id" class="spc-rec">
          <div class="spc-rec-head">
            <span class="spc-rec-problem">{{ rec.problem }}</span>
            <span class="spc-rec-level" :class="`spc-count-${rec.level.tone}`">{{ rec.level.text }}风险</span>
            <span class="spc-rec-meta">{{ rec.date }} · {{ rec.source }}</span>
          </div>
          <div class="spc-rec-body">
            <div class="spc-raw">
              <div class="spc-raw-label"><el-icon><Document /></el-icon> 原始文本描述</div>
              <p class="spc-raw-text">{{ rec.rawText }}</p>
            </div>
            <el-icon class="spc-arrow"><Right /></el-icon>
            <div class="spc-struct">
              <div class="spc-struct-label"><el-icon><Files /></el-icon> 结构化信息</div>
              <dl class="spc-dl">
                <dt>部件分类</dt><dd>{{ analysisPart.name }}</dd>
                <dt>问题类型</dt><dd>{{ rec.problem }}</dd>
                <dt>部位</dt><dd>{{ rec.location }}</dd>
                <dt>量化指标</dt><dd>{{ rec.metric }}</dd>
                <dt>严重程度</dt><dd>{{ rec.level.text }}</dd>
                <dt>处理建议</dt><dd>{{ rec.action }}</dd>
                <dt>巡检人</dt><dd>{{ rec.inspector }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, Tickets, WarningFilled, Files, PieChart, Document, Right } from '@element-plus/icons-vue'
import { getSpotCheckBoard, type SpotCheckBoard, type SpotPartStat } from '@/mock'
import type { Device } from '@/mock'

const props = defineProps<{ device: Device | null }>()
defineEmits<{ (e: 'close'): void }>()

const board = computed<SpotCheckBoard | null>(() =>
  props.device ? getSpotCheckBoard(props.device.id) : null
)

const levelOf = (count: number): 'high' | 'mid' | 'low' | 'none' => {
  if (!board.value || count === 0) return 'none'
  const ratio = count / board.value.maxCount
  return ratio >= 0.66 ? 'high' : ratio >= 0.34 ? 'mid' : 'low'
}

const textVisible = ref(false)
const analysisPart = ref<SpotPartStat | null>(null)
function openText(part: SpotPartStat) {
  if (part.count === 0) return
  analysisPart.value = part
  textVisible.value = true
}
</script>

<style scoped>
.spc-panel {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.spc-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 空态 */
.spc-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-muted);
}
.spc-empty-title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); }
.spc-empty-desc { font-size: 13px; }

/* 概览卡 */
.spc-stat-grid {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.spc-stat-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
  padding: 14px 16px;
}
.spc-stat-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.spc-stat-value {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}
.spc-stat-unit { font-size: 13px; font-weight: 500; color: var(--color-text-muted); margin-left: 4px; }
.spc-stat-part { font-size: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spc-danger { color: var(--color-danger); }
.spc-warning { color: var(--color-warning); }

/* section */
.spc-section {
  flex-shrink: 0;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  box-shadow: var(--color-card-shadow);
  overflow: hidden;
}
.spc-section-head {
  height: 48px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-light);
}
.spc-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.spc-bar { width: 4px; height: 16px; border-radius: 999px; background: var(--color-primary); }
.spc-section-sub { font-size: 11px; color: var(--color-text-muted); }

.spc-part-grid {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 1180px) { .spc-part-grid, .spc-stat-grid { grid-template-columns: 1fr 1fr; } }

.spc-part-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  padding: 12px;
}
.spc-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  background: #eef2f7;
  color: var(--color-text-muted);
  flex-shrink: 0;
  margin-top: 2px;
}
.spc-rank-top { background: var(--color-primary); color: #fff; }
.spc-part-body { flex: 1; min-width: 0; }
.spc-part-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.spc-part-name { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); }

.spc-count {
  min-width: 44px;
  height: 24px;
  padding: 0 8px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: default;
}
.spc-count-clickable { cursor: pointer; }
.spc-count-clickable:hover { box-shadow: 0 0 0 2px rgba(22,119,255,0.25); }
.spc-count-high, .spc-fill-high { }
.spc-count-high { background: var(--color-danger-bg); color: var(--color-danger); }
.spc-count-mid { background: var(--color-warning-bg); color: var(--color-warning); }
.spc-count-low { background: var(--color-primary-light); color: var(--color-primary); }
.spc-count-none { background: #eef2f7; color: var(--color-text-muted); }

.spc-track { margin-top: 6px; height: 8px; border-radius: 999px; background: #eef2f7; overflow: hidden; }
.spc-track-fill { height: 100%; border-radius: 999px; transition: width 0.3s; }
.spc-fill-high { background: var(--color-danger); }
.spc-fill-mid { background: var(--color-warning); }
.spc-fill-low { background: var(--color-primary); }
.spc-fill-none { background: var(--color-border); }

.spc-part-foot { margin-top: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.spc-tags { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.spc-tag {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: #eef2f7;
  color: var(--color-text-muted);
}
.spc-none { font-size: 11px; color: var(--color-text-muted); }
.spc-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-primary);
  cursor: pointer;
  flex-shrink: 0;
}
.spc-link:hover { text-decoration: underline; }

/* 弹窗 */
.spc-modal-sub { font-size: 12px; color: var(--color-text-muted); margin-bottom: 12px; }
.spc-rec-list { display: flex; flex-direction: column; gap: 12px; max-height: 62vh; overflow-y: auto; }
.spc-rec { flex-shrink: 0; border: 1px solid var(--color-border-light); border-radius: var(--radius-sm); overflow: hidden; }
.spc-rec-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  background: #f1f5f9;
  border-bottom: 1px solid var(--color-border-light);
}
.spc-rec-problem { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.spc-rec-level { height: 20px; padding: 0 8px; display: inline-flex; align-items: center; border-radius: 4px; font-size: 11px; font-weight: 600; }
.spc-rec-meta { margin-left: auto; font-size: 11px; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }
.spc-rec-body {
  display: grid;
  grid-template-columns: 1fr auto 1.1fr;
  gap: 12px;
  align-items: stretch;
  padding: 14px;
}
.spc-raw, .spc-struct { border-radius: var(--radius-sm); padding: 12px; }
.spc-raw { background: #f8fafc; border: 1px solid var(--color-border-light); }
.spc-struct { background: rgba(22,119,255,0.05); border: 1px solid var(--color-primary-light); }
.spc-raw-label, .spc-struct-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; margin-bottom: 6px; }
.spc-raw-label { color: var(--color-text-muted); }
.spc-struct-label { color: var(--color-primary); }
.spc-raw-text { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }
.spc-arrow { align-self: center; color: var(--color-text-muted); }
.spc-dl { display: grid; grid-template-columns: 64px 1fr; gap: 4px 8px; font-size: 12px; margin: 0; }
.spc-dl dt { color: var(--color-text-muted); }
.spc-dl dd { color: var(--color-text-primary); margin: 0; }
@media (max-width: 720px) {
  .spc-rec-body { grid-template-columns: 1fr; }
  .spc-arrow { display: none; }
}
</style>

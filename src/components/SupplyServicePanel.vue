<template>
  <div class="sply-panel">
    <div class="sply-scroll">
      <!-- 检索栏 -->
      <div class="sply-search-card">
        <div class="sply-search-title">
          <el-icon class="sply-ai"><Van /></el-icon>
          <h3>制造商与设计文件检索</h3>
          <span>通过设备编号 / 名称 / 制造商 / 型号检索其制造信息与随附技术资料</span>
        </div>
        <el-input
          v-model="query"
          clearable
          placeholder="输入设备编号（如 QD-2019-0156）/ 设备名称 / 制造商 / 规格型号…"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <div class="sply-search-info">
          共 {{ registry.length }} 台在册设备，检索到 <span class="sply-hit">{{ results.length }}</span> 条结果
        </div>
      </div>

      <!-- 结果列表 -->
      <div class="sply-table-card">
        <el-table :data="results" size="small" style="width:100%" max-height="520" @row-click="openDetail">
          <el-table-column prop="code" label="设备编号" width="150">
            <template #default="{ row }"><span class="sply-code">{{ row.code }}</span></template>
          </el-table-column>
          <el-table-column prop="name" label="设备名称" min-width="160" />
          <el-table-column prop="type" label="设备类型" width="130" />
          <el-table-column prop="manufacturer" label="制造商" min-width="140" />
          <el-table-column prop="model" label="规格型号" width="130">
            <template #default="{ row }"><span class="sply-mono">{{ row.model }}</span></template>
          </el-table-column>
          <el-table-column prop="madeDate" label="出厂日期" width="120" />
          <el-table-column label="技术资料" width="120">
            <template #default="{ row }">
              <button class="sply-link" @click.stop="openDetail(row)">
                <el-icon><Search /></el-icon> 查看（{{ row.docs.length }} 份）
              </button>
            </template>
          </el-table-column>
          <template #empty>未检索到匹配的设备，请调整关键词</template>
        </el-table>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" width="640px" append-to-body :title="detail?.name || '制造信息'">
      <template v-if="detail">
        <div class="sply-detail-code"><el-icon><PriceTag /></el-icon>{{ detail.code }}</div>

        <div class="sply-sec-label">制造信息</div>
        <div class="sply-fields">
          <div v-for="f in detailFields" :key="f.label" class="sply-field">
            <div class="sply-field-label">{{ f.label }}</div>
            <div class="sply-field-value" :title="f.value">{{ f.value }}</div>
          </div>
        </div>

        <div class="sply-sec-label">随附技术资料（{{ detail.docs.length }} 份）</div>
        <div class="sply-docs">
          <div v-for="doc in detail.docs" :key="doc.id" class="sply-doc">
            <el-icon class="sply-doc-icon"><Document /></el-icon>
            <div class="sply-doc-info">
              <div class="sply-doc-kind">{{ doc.kind }}</div>
              <div class="sply-doc-meta">
                <span class="sply-fmt">{{ doc.format }}</span>
                <span>{{ doc.date }}</span>
                <span>{{ doc.sizeMB.toFixed(1) }} MB</span>
              </div>
            </div>
            <button class="sply-dl" title="下载资料（演示）"><el-icon><Download /></el-icon></button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Van, Search, Document, Download, PriceTag } from '@element-plus/icons-vue'
import { getSupplyRegistry, type SupplyReg } from '@/mock'

defineEmits<{ (e: 'close'): void }>()

const registry = getSupplyRegistry()
const query = ref('')
const results = computed<SupplyReg[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return registry
  return registry.filter((r) =>
    [r.code, r.name, r.manufacturer, r.model, r.factoryNo, r.type, r.user].some((v) => v.toLowerCase().includes(q))
  )
})

const detailVisible = ref(false)
const detail = ref<SupplyReg | null>(null)
function openDetail(row: SupplyReg) {
  detail.value = row
  detailVisible.value = true
}
const detailFields = computed(() => {
  const r = detail.value
  if (!r) return []
  return [
    { label: '制造商', value: r.manufacturer },
    { label: '规格型号', value: r.model },
    { label: '设备类型', value: r.type },
    { label: '额定起重量', value: `${r.tonnage} t` },
    { label: '跨度 / 幅度', value: `${r.span} m` },
    { label: '出厂编号', value: r.factoryNo },
    { label: '出厂日期', value: r.madeDate },
    { label: '投用日期', value: r.commissionDate },
    { label: '使用单位', value: r.user },
  ]
})
</script>

<style scoped>
.sply-panel { position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; background: #f8fafc; }
.sply-scroll { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 16px; display: flex; flex-direction: column; gap: 16px; }

.sply-search-card { flex-shrink: 0; background: var(--color-card-bg); border: 1px solid var(--color-card-border); border-radius: var(--radius-md); box-shadow: var(--color-card-shadow); padding: 16px; }
.sply-search-title { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.sply-ai { color: var(--color-primary); }
.sply-search-title h3 { font-size: 15px; font-weight: 600; color: var(--color-text-primary); margin: 0; }
.sply-search-title span { font-size: 11px; color: var(--color-text-muted); }
.sply-search-info { font-size: 11px; color: var(--color-text-muted); margin-top: 8px; }
.sply-hit { font-weight: 600; color: var(--color-text-secondary); }

.sply-table-card { flex-shrink: 0; background: var(--color-card-bg); border: 1px solid var(--color-card-border); border-radius: var(--radius-md); box-shadow: var(--color-card-shadow); overflow: hidden; }
.sply-table-card :deep(.el-table__row) { cursor: pointer; }
.sply-code { font-family: monospace; font-weight: 600; color: var(--color-primary); }
.sply-mono { font-family: monospace; color: var(--color-text-secondary); }
.sply-link { display: inline-flex; align-items: center; gap: 4px; border: none; background: transparent; color: var(--color-primary); font-size: 12px; font-weight: 600; cursor: pointer; }
.sply-link:hover { text-decoration: underline; }

.sply-detail-code { display: inline-flex; align-items: center; gap: 4px; font-family: monospace; font-size: 12px; color: var(--color-text-muted); margin-bottom: 12px; }
.sply-sec-label { font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin: 4px 0 8px; }
.sply-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
@media (max-width: 620px) { .sply-fields { grid-template-columns: repeat(2, 1fr); } }
.sply-field { border: 1px solid var(--color-border-light); background: #f8fafc; border-radius: var(--radius-sm); padding: 8px 10px; }
.sply-field-label { font-size: 11px; color: var(--color-text-muted); }
.sply-field-value { font-size: 13px; font-weight: 500; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sply-docs { border: 1px solid var(--color-border-light); border-radius: var(--radius-md); overflow: hidden; }
.sply-doc { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-top: 1px solid var(--color-border-light); }
.sply-doc:first-child { border-top: none; }
.sply-doc-icon { color: var(--color-primary); font-size: 18px; }
.sply-doc-info { flex: 1; min-width: 0; }
.sply-doc-kind { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
.sply-doc-meta { display: flex; gap: 10px; font-size: 11px; color: var(--color-text-muted); font-family: monospace; margin-top: 2px; }
.sply-fmt { padding: 0 4px; border-radius: 3px; background: #eef2f7; color: var(--color-text-muted); }
.sply-dl { width: 28px; height: 28px; border: none; background: transparent; border-radius: var(--radius-sm); color: var(--color-text-muted); cursor: pointer; }
.sply-dl:hover { background: #eef2f7; color: var(--color-primary); }
</style>

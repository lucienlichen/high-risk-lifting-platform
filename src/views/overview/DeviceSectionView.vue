<template>
  <div v-if="card" class="device-view-root">
    <DeviceStrip :code="card.code" :type="card.type || '—'" :tone="tone" :status-label="statusLabels[tone]" back-label="返回" @back="back" />
    <DeviceMenuBar :active="menu" :device-id="String(route.params.id || '')" />
    <div class="content-scrollable section-page">
      <template v-if="menu === 'safety'">
        <div class="section-tools">
          <label>工作循环
            <select v-model="cycle">
              <option value="0">第 8 次　09:15–09:23　16.0 t</option>
              <option value="1">第 7 次　08:42–08:49　12.0 t</option>
            </select>
          </label>
          <span>整机参数，不是点位数据。数值为演示参照。</span>
        </div>
        <div class="metric-grid">
          <article v-for="(item, index) in SAFETY_PARAMS" :key="item[0]">
            <span>{{ item[0] }}</span>
            <strong>{{ index === 0 && cycle === '1' ? '12.0' : item[1] }}<small>{{ item[2] }}</small></strong>
            <em>{{ item[3] }}</em>
          </article>
        </div>
        <h2>状态监控</h2>
        <ul class="state-list">
          <li v-for="item in SAFETY_STATES" :key="item[0]"><span>{{ item[0] }}</span><b :class="item[1]">{{ item[1] }}</b></li>
        </ul>
      </template>
      <template v-else-if="menu === 'risk'">
        <p class="section-note">概览排序分 <b>{{ score }}</b> 只用于设备列表降序，不由本矩阵计算，也不定义高/低风险等级。下列 15 项 × 4 级是旧口径条件，选中格是界面样例。</p>
        <div class="ov-table-wrap">
          <table class="ov-table risk-table">
            <thead><tr><th>序号</th><th>评估指标</th><th>1 级</th><th>2 级</th><th>3 级</th><th>4 级</th></tr></thead>
            <tbody>
              <tr v-for="(name, index) in RISK_NAMES" :key="name">
                <td>{{ index + 1 }}</td>
                <td>{{ name }}</td>
                <td v-for="(band, level) in RISK_BANDS[index]" :key="band" :class="{ chosen: levels[index] === level + 1 }">{{ band }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <template v-else-if="menu === 'basic'">
        <p class="section-note">单机四组模拟档案。没有照搬群体台账统计。</p>
        <section v-for="group in archive" :key="group.title">
          <h2>{{ group.title }}</h2>
          <dl>
            <template v-for="field in group.fields" :key="field[0]"><dt>{{ field[0] }}</dt><dd>{{ field[1] }}</dd></template>
          </dl>
        </section>
      </template>
      <template v-else>
        <p class="section-note">{{ menu === 'inspection' ? '检验检测' : '设备制造供给' }}分类已列出。旧平台文件没有确认绑定到本机，因此不把那些文件显示为本机资料。</p>
        <div class="file-grid">
          <article v-for="name in categories" :key="name">
            <header><b>{{ name }}</b><span>未绑定资料</span></header>
            <p>暂无明确绑定本机的{{ name }}。</p>
            <button type="button" @click="preview = preview === name ? '' : name">{{ preview === name ? '收起布局' : '查看分类布局' }}</button>
            <div v-if="preview === name" class="preview">
              <p>文件名称 / 类型 / 上传时间 / 关联设备</p>
              <strong>暂无可预览的本机文件</strong>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
  <p v-else class="ov-missing">没有这台设备。</p>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DeviceMenuBar from '@/components/overview/DeviceMenuBar.vue'
import DeviceStrip from '@/components/DeviceStrip.vue'
import { usePartsDevice } from '@/composables/usePartsDevice'
import { INSPECTION_CATEGORIES, RISK_BANDS, RISK_NAMES, SAFETY_PARAMS, SAFETY_STATES, SUPPLY_CATEGORIES, demoRiskLevels, demoRiskScore, type DeviceMenuKey } from '@/mock/deviceMenus'
import { statusLabels } from '@/mock/partsPoint'

const { card, query, route, router, tone } = usePartsDevice()
const cycle = ref('0')
const preview = ref('')
const menu = computed(() => {
  const key = String(route.params.key || '')
  return (['safety', 'risk', 'inspection', 'basic', 'supply'].includes(key) ? key : 'safety') as DeviceMenuKey
})
const score = computed(() => card.value ? demoRiskScore(card.value) : 0)
const levels = computed(() => demoRiskLevels(String(route.params.id || '')))
const categories = computed(() => menu.value === 'inspection' ? INSPECTION_CATEGORIES : SUPPLY_CATEGORIES)
const archive = computed(() => {
  const current = card.value
  return [
    ['设备基础信息', [['设备代码', current?.code || '—'], ['设备名称', current?.name || '—'], ['设备种类', '起重机械'], ['设备类别', current?.type || '桥式起重机'], ['设备型号', '模拟'], ['工作级别', '模拟'], ['主体结构型式', '模拟'], ['制造单位', '模拟'], ['制造日期', '模拟']]],
    ['设备使用登记情况', [['使用登记证编号', '模拟'], ['设备登记机关', '模拟'], ['使用登记日期', '模拟'], ['监管类别', '模拟'], ['现场监督检查结论', '资料待补充'], ['登记状态', '模拟']]],
    ['设备使用情况', [['使用单位', current?.enterprise || '—'], ['设备使用地点', current?.location || '—'], ['运行状态', '样例'], ['产权单位', '模拟'], ['组织机构代码', '未提供'], ['地理信息', '未提供']]],
    ['设备性能参数', [['额定起重量', current?.capacityText || '模拟'], ['跨度', current?.spanText || '模拟'], ['工作级别', current?.classText || '模拟']]]
  ].map(([title, fields]) => ({ title: String(title), fields: fields as [string, string][] }))
})
function back() {
  router.push({ name: 'overviewPlant', query: query.value })
}
</script>

<style scoped>
.section-page { padding: 16px 18px 28px; }
.section-note, .section-tools span { color: var(--color-text-secondary, #64748b); font-size: 13px; }
.section-tools { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.section-tools select, .section-tools { font-size: 13px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.metric-grid article { background: var(--color-card-bg, #fff); border: 1px solid var(--color-border, #e5e7eb); border-radius: 8px; padding: 12px; }
.metric-grid span, .metric-grid em { display: block; color: #64748b; font-size: 12px; font-style: normal; }
.metric-grid strong { display: block; margin: 6px 0; font-size: 20px; }
.metric-grid small { margin-left: 4px; font-size: 12px; font-weight: 400; color: #64748b; }
h2 { margin: 16px 0 8px; font-size: 16px; }
.state-list { list-style: none; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; padding: 0; }
.state-list li { display: flex; justify-content: space-between; gap: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; font-size: 13px; }
.state-list b { font-weight: 600; }
.state-list b.正常 { color: #15803d; }
.state-list b.异常 { color: #b45309; }
.state-list b.报警, .state-list b.闭合 { color: #b91c1c; }
.risk-table td.chosen { background: #e8f0fe; color: #0958d9; font-weight: 700; }
.file-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.file-grid article { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
.file-grid header { display: flex; justify-content: space-between; gap: 8px; }
.file-grid header span, .preview { color: #64748b; font-size: 12px; }
.file-grid button { margin-top: 8px; border: 1px solid #d1d5db; background: #fff; color: #1677ff; border-radius: 6px; height: 28px; padding: 0 10px; cursor: pointer; }
@media (max-width: 1280px) {
  .metric-grid, .state-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>

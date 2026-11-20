<template>
  <div v-if="card" class="device-view-root">
    <DeviceStrip :code="card.code" :type="card.type || '—'" :tone="tone" :status-label="statusLabels[tone]" back-label="返回" @back="back" />
    <DeviceMenuBar :active="menu" :device-id="String(route.params.id || '')" />
    <div class="content-scrollable section-page">
      <template v-if="menu === 'safety'">
        <div class="safety-3">
          <section class="safety-col">
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
              <button v-for="(item, index) in SAFETY_PARAMS" :key="item[0]" type="button" class="metric-btn" :class="{ on: safetyParam === index }" @click="pickSafety(index)">
                <span>{{ item[0] }}</span>
                <strong>{{ index === 0 && cycle === '1' ? '12.0' : item[1] }}<small>{{ item[2] }}</small></strong>
                <em>{{ item[3] }}</em>
              </button>
            </div>
            <h2>状态监控</h2>
            <ul class="state-list">
              <li v-for="item in SAFETY_STATES" :key="item[0]"><span>{{ item[0] }}</span><b :class="item[1]">{{ item[1] }}</b></li>
            </ul>
          </section>
          <section class="safety-col safety-model">
            <header>
              <b>整机模型</b>
              <span>模型示意 · 演示</span>
              <div class="spd-seg" aria-label="模型显示">
                <button type="button" :class="{ on: safetyMode === 'model' }" @click="safetyMode = 'model'">模型</button>
                <button type="button" :class="{ on: safetyMode === 'cloud' }" @click="safetyMode = 'cloud'">应力云图</button>
              </div>
            </header>
            <StructureCraneModel :mode="safetyMode" :point-id="safetyPoint" />
            <p>当前循环 {{ cycle === '1' ? '第 7 次 · 12.0 t' : '第 8 次 · 16.0 t' }} · 关注 {{ safetyPoint }}。云图随循环和参数切换，不是新的计算结果。</p>
          </section>
          <section class="safety-col">
            <h2>预警与分析</h2>
            <button type="button" class="svc-entry" @click="safetySvc = safetySvc === 'limit' ? '' : 'limit'">
              <b>超限与联锁预警</b>
              <span>对照 GB/T 28264 的演示条目</span>
            </button>
            <button type="button" class="svc-entry" @click="safetySvc = safetySvc === 'quant' ? '' : 'quant'">
              <b>安全监控定量分析</b>
              <span>当前循环与参数的联动说明</span>
            </button>
            <div v-if="safetySvc" class="svc-panel">
              <p v-if="safetySvc === 'limit'">演示：抗风防滑为报警，同一轨道运行机构为异常。不引用正式限值条文，也不把演示灯写成检验结论。</p>
              <p v-else>演示：第 {{ cycle === '1' ? '7' : '8' }} 次循环起重量 {{ cycle === '1' ? '12.0' : '16.0' }} t，模型关注点改为 {{ safetyPoint }}。定量分析不另设评分公式。</p>
            </div>
          </section>
        </div>
      </template>
      <template v-else-if="menu === 'risk'">
        <section class="risk-detail">
          <header class="risk-detail-bar">
            <b>风险定量监测</b>
            <span>本机 {{ card.code }} · {{ card.name }}</span>
            <em>演示界面，没有逐机评估日期</em>
          </header>
          <div class="risk-status">
            <div><small>所在位置</small><b>{{ card.location || '—' }}</b></div>
            <div><small>工作状态</small><b>{{ card.workLabel }}</b></div>
            <div><small>实时振动</small><b>未绑定本机监测</b></div>
            <div><small>列表示意分</small><b class="ov-risk-score" :class="band">{{ score }}</b></div>
          </div>
          <div class="risk-matrix-panel">
            <div class="risk-matrix-head">
              <b>风险评估指标</b><span>共 {{ RISK_NAMES.length }} 项</span>
              <div class="risk-legend"><i class="g1"></i>1级<i class="g2"></i>2级<i class="g3"></i>3级<i class="g4"></i>4级</div>
            </div>
            <div class="risk-matrix-wrap">
              <table class="risk-matrix">
                <thead>
                  <tr>
                    <th>序号</th><th>评估指标</th>
                    <th><i class="g1"></i>1级</th><th><i class="g2"></i>2级</th><th><i class="g3"></i>3级</th><th><i class="g4"></i>4级</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(name, index) in RISK_NAMES" :key="name">
                    <td><span class="risk-no">{{ index + 1 }}</span></td>
                    <td>{{ name }}</td>
                    <td v-for="(text, level) in RISK_BANDS[index]" :key="text">
                      <div class="risk-cell" :class="[{ on: levels[index] === level + 1 }, `g${level + 1}`]">
                        <span>{{ text }}</span>
                        <i v-if="levels[index] === level + 1"></i>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p class="section-note">选中格是本机演示样例，随设备变化。列表示意分 {{ score }} 只用于排序上色，不是 15 项等级之和，也不对应高/低风险等级。证据里出现过「综合评分 /80」和「低风险」，但没有给出分母和等级界限，这里不套用。</p>
        </section>
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
      <template v-else-if="menu === 'patrol'">
        <p class="section-note">日常点巡检在设备级，不进测点。下列是按本机编号生成的演示统计，不是已绑定的扫描件。</p>
        <div class="pair">
          <article>
            <h2>点巡检数据</h2>
            <p>演示表 {{ patrol.formCount }} 份 · 问题 {{ patrol.totalProblems }} 条 · 涉及 {{ patrol.involvedParts }} 个部位 · 最多 {{ patrol.topPart }}</p>
            <ul>
              <li v-for="item in patrol.items.slice(0, 4)" :key="item.key">{{ item.name }} · {{ item.count }} 条<span v-if="item.topProblems[0]"> · {{ item.topProblems[0] }}</span></li>
            </ul>
          </article>
          <article>
            <h2>对应服务</h2>
            <p><b>点巡检智能服务</b>：汇聚巡检记录，识别异常频次。演示。</p>
            <p><b>故障排查服务</b>：由点巡检问题转入设备、人员与环境排查。演示，不打开未绑定的扫描原件。</p>
          </article>
        </div>
      </template>
      <template v-else-if="menu === 'repair'">
        <p class="section-note">故障维修在设备级。记录和建议由本机编号稳定生成，标为演示，不冒充本机归档文件。</p>
        <div class="pair">
          <article>
            <h2>维修数据</h2>
            <ul>
              <li v-for="group in repairPreview" :key="group.key">{{ group.name }} · {{ group.records.length }} 条 · {{ group.advice.topDamage }}</li>
            </ul>
          </article>
          <article>
            <h2>维修智能服务</h2>
            <p v-for="group in repairPreview.slice(0, 3)" :key="group.key"><b>{{ group.name }}</b>：{{ group.advice.suggestTime }}。{{ group.advice.maintain }}</p>
          </article>
        </div>
      </template>
      <template v-else-if="menu === 'inspection' || menu === 'supply'">
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
import { computed, ref, watch } from 'vue'
import DeviceMenuBar from '@/components/overview/DeviceMenuBar.vue'
import DeviceStrip from '@/components/DeviceStrip.vue'
import StructureCraneModel from '@/components/pointScheme/StructureCraneModel.vue'
import { getRepairGroups, getSpotCheckBoard } from '@/mock/serviceData'
import type { ModelMode } from '@/mock/structurePointDetail'
import { usePartsDevice } from '@/composables/usePartsDevice'
import { INSPECTION_CATEGORIES, RISK_BANDS, RISK_NAMES, SAFETY_PARAMS, SAFETY_STATES, SUPPLY_CATEGORIES, demoRiskBand, demoRiskLevels, demoRiskScore, type DeviceMenuKey } from '@/mock/deviceMenus'
import { statusLabels } from '@/mock/partsPoint'

const { card, query, route, router, tone } = usePartsDevice()
const cycle = ref('0')
const safetyParam = ref(-1)
const safetyMode = ref<ModelMode>('model')
const safetyFocus = ref('')
const safetySvc = ref('')
const safetyPoint = computed(() => safetyFocus.value || (cycle.value === '1' ? 'ML-06' : 'ML-01'))
const patrol = computed(() => getSpotCheckBoard(String(route.params.id || '')))
const repairPreview = computed(() => getRepairGroups(String(route.params.id || '')).filter(group => group.records.length).slice(0, 4))
function pickSafety(index: number) {
  safetyParam.value = index
  const points = ['ML-01', 'ML-02', 'ML-06', 'ML-10', 'ML-04', 'ML-08', 'ML-03', 'ML-05', 'ML-07', 'ML-09', 'ML-11', 'ML-12']
  safetyFocus.value = points[index] || 'ML-01'
  safetyMode.value = index <= 6 ? 'cloud' : 'model'
}
watch(cycle, value => {
  safetyFocus.value = ''
  safetyParam.value = -1
  safetyMode.value = value === '1' ? 'cloud' : 'model'
})
const preview = ref('')
const menu = computed(() => {
  const key = String(route.params.key || '')
  return (['safety', 'risk', 'patrol', 'repair', 'inspection', 'basic', 'supply'].includes(key) ? key : 'safety') as DeviceMenuKey
})
const score = computed(() => card.value ? demoRiskScore(card.value) : 0)
const band = computed(() => demoRiskBand(score.value))
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
.safety-3 { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(280px, .9fr) minmax(220px, .7fr); gap: 12px; align-items: start; }
.safety-col { min-width: 0; }
.safety-model { background: #fff; border: 1px solid var(--color-border, #e5e7eb); border-radius: 8px; overflow: hidden; }
.safety-model header { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid #edf0f4; }
.safety-model header span, .safety-model p { color: #64748b; font-size: 12px; }
.safety-model .spd-canvas { height: 280px; }
.safety-model p { margin: 0; padding: 8px 10px 10px; }
.spd-seg { display: flex; margin-left: auto; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; }
.spd-seg button { height: 26px; padding: 0 8px; border: 0; background: #fff; font-size: 12px; cursor: pointer; }
.spd-seg button.on { background: var(--color-primary, #1677ff); color: #fff; }
.metric-btn { text-align: left; background: #fff; border: 1px solid var(--color-border, #e5e7eb); border-radius: 8px; padding: 12px; cursor: pointer; }
.metric-btn.on { border-color: var(--color-primary, #1677ff); }
.svc-entry, .svc-panel { display: block; width: 100%; text-align: left; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; }
.svc-entry b, .svc-entry span { display: block; }
.svc-entry span { margin-top: 4px; color: #64748b; font-size: 12px; }
.section-tools { flex-wrap: wrap; }
.section-tools select { width: 100%; max-width: 320px; }
.svc-panel { color: #64748b; font-size: 12px; }
.pair { display: grid; grid-template-columns: 1.2fr .8fr; gap: 12px; }
.pair article, .pair ul { background: #fff; }
.pair article { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; }
.pair ul { margin: 8px 0 0; padding-left: 18px; }
.metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
@media (max-width: 1100px) {
  .safety-3, .pair { grid-template-columns: 1fr; }
}
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
.risk-detail { display: flex; flex-direction: column; gap: 12px; }
.risk-detail-bar, .risk-status, .risk-matrix-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.risk-detail-bar { background: #fff; border: 1px solid var(--color-card-border, #e8edf3); border-radius: 10px; padding: 10px 14px; }
.risk-detail-bar em { margin-left: auto; font-style: normal; color: #64748b; font-size: 12px; }
.risk-status { background: #fff; border: 1px solid var(--color-card-border, #e8edf3); border-radius: 10px; padding: 12px 14px; }
.risk-status div { display: flex; flex-direction: column; gap: 2px; min-width: 120px; }
.risk-status small { color: #64748b; font-size: 12px; }
.risk-matrix-panel { background: #fff; border: 1px solid var(--color-card-border, #e8edf3); border-radius: 10px; overflow: hidden; }
.risk-matrix-head { padding: 12px 14px; border-bottom: 1px solid #f0f4f8; }
.risk-matrix-head span { color: var(--color-primary, #1677ff); background: var(--color-primary-light, #e8f0fe); border-radius: 10px; padding: 1px 8px; font-size: 12px; }
.risk-legend { margin-left: auto; display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; }
.risk-legend i, .risk-matrix th i, .risk-cell i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; }
.risk-legend .g1, .risk-matrix th .g1, .risk-cell.on.g1 i { background: var(--color-success); }
.risk-legend .g2, .risk-matrix th .g2, .risk-cell.on.g2 i { background: var(--color-info); }
.risk-legend .g3, .risk-matrix th .g3, .risk-cell.on.g3 i { background: var(--color-warning); }
.risk-legend .g4, .risk-matrix th .g4, .risk-cell.on.g4 i { background: var(--color-danger); }
.risk-matrix-wrap { overflow: auto; padding: 8px 12px 14px; }
.risk-matrix { width: 100%; border-collapse: separate; border-spacing: 0 6px; font-size: 13px; }
.risk-matrix th { text-align: left; font-size: 12px; color: #475569; font-weight: 600; padding: 4px 8px; }
.risk-matrix td { padding: 0 6px; vertical-align: middle; }
.risk-no { display: inline-flex; width: 22px; height: 22px; align-items: center; justify-content: center; border-radius: 6px; background: #f1f5f9; font-size: 12px; }
.risk-cell { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 36px; padding: 6px 10px; border: 1px solid transparent; border-radius: 6px; color: #334155; background: #f8fafc; }
.risk-cell.on.g1 { background: var(--color-success-bg); color: var(--color-success); border-color: var(--color-success); }
.risk-cell.on.g2 { background: var(--color-info-bg); color: var(--color-info); border-color: var(--color-info); }
.risk-cell.on.g3 { background: var(--color-warning-bg); color: var(--color-warning); border-color: var(--color-warning); }
.risk-cell.on.g4 { background: var(--color-danger-bg); color: var(--color-danger); border-color: var(--color-danger); }
.ov-risk-score.high { color: var(--color-danger); }
.ov-risk-score.mid { color: var(--color-warning); }
.ov-risk-score.low { color: var(--color-success); }
.file-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.file-grid article { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
.file-grid header { display: flex; justify-content: space-between; gap: 8px; }
.file-grid header span, .preview { color: #64748b; font-size: 12px; }
.file-grid button { margin-top: 8px; border: 1px solid #d1d5db; background: #fff; color: #1677ff; border-radius: 6px; height: 28px; padding: 0 10px; cursor: pointer; }
@media (max-width: 1280px) {
  .metric-grid, .state-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>

<template>
  <div class="spd">
    <p class="spd-note">
      本页为交互示意，数值均为<b>演示数据</b>，非实时监测。时刻按 <b>America/Araguaina（UTC-3）</b> 显示。健康评估：<b>D＜0.7 健康</b>，<b>0.7≤D＜1 亚健康</b>；<b>D＝1 及以上分级待核</b>。全局状态仍为「正常 / 异常 / 报警」，与损伤度分级分开。报警记录为独立事件，不由损伤度阈值生成。
    </p>
    <div class="spd-main">
      <aside class="spd-left">
        <section class="spd-card spd-table">
          <div class="spd-hd">
            <div class="spd-hd-top">
              <span class="spd-title">点位表</span>
              <span class="spd-meta">共 {{ summary.total }} 个 · 异常 {{ summary.warn }} · 报警 {{ summary.alarm }}</span>
            </div>
            <div class="spd-tools">
              <input v-model="query" type="search" placeholder="搜索编号或位置" aria-label="搜索点位">
              <label><input v-model="onlyBad" type="checkbox">仅看异常/报警</label>
            </div>
          </div>
          <div class="spd-colhd"><span>编号</span><span>位置</span><span>状态</span></div>
          <div class="spd-body">
            <p v-if="!groups.length" class="spd-empty">{{ onlyBad ? '当前没有异常或报警点位' : '没有匹配的点位' }}</p>
            <template v-for="group in groups" :key="group.beam">
              <div class="spd-grp">{{ group.beam }} <span>{{ group.rows.length }} 个</span></div>
              <button
                v-for="row in group.rows"
                :key="row.id"
                type="button"
                class="spd-row"
                :class="{ sel: row.id === active.id }"
                @click="pick(row.id)"
                @mouseenter="crane?.applyHover(row.id)"
                @mouseleave="crane?.applyHover(null)"
              >
                <span class="id">{{ row.id }}</span>
                <span class="loc">{{ row.loc }}</span>
                <span class="spd-status" :class="row.status">{{ statusName(row.status) }}</span>
              </button>
            </template>
          </div>
          <div class="spd-foot">
            <span>生成点已统一，不再区分来源</span>
            <button type="button" @click="openAlarms">查看报警记录（{{ alarms.length }}）</button>
          </div>
        </section>
      </aside>

      <section class="spd-mid">
        <section class="spd-card spd-model">
          <div class="spd-mid-hd">
            <span class="spd-title">结构模型</span>
            <span class="spd-badge">模型示意</span>
            <span class="sub">单双主梁桥机 · 非真实三维模型 · 非计算结果</span>
            <div class="spd-seg" aria-label="模型显示">
              <button type="button" :class="{ on: modelMode === 'model' }" @click="modelMode = 'model'">模型</button>
              <button type="button" :class="{ on: modelMode === 'cloud' }" @click="modelMode = 'cloud'">应力云图</button>
            </div>
          </div>
          <StructureCraneModel ref="crane" :mode="modelMode" :point-id="active.id" @select="pick" />
          <div class="spd-mid-ft">
            <div>当前点位 <span class="pn">{{ active.id }}</span>　{{ active.loc }}　状态 <span class="spd-status" :class="active.status">{{ statusName(active.status) }}</span></div>
            <div class="hint">点击模型点位或左侧表格可切换 · 点位颜色表示全局状态（正常 / 异常 / 报警）</div>
          </div>
        </section>
        <section class="spd-card spd-raw">
          <div class="spd-mid-hd">
            <span class="spd-title">当前点位监测数据</span>
            <span class="sub">只显示当前点位，三类同时展开</span>
          </div>
          <div class="spd-raw-query">
            <div class="spd-grain" role="group" aria-label="原始数据时间范围">
              <button type="button" :class="{ on: rawPreset === 'year' }" @click="applyRawPreset('year')">年度</button>
              <button type="button" :class="{ on: rawPreset === 'month' }" @click="applyRawPreset('month')">月度</button>
              <button type="button" :class="{ on: rawPreset === 'custom' }" @click="rawPreset = 'custom'">自定义</button>
              <span>已应用 {{ rawAppliedLabel }} · 演示数据</span>
            </div>
            <div v-if="rawPreset === 'custom'" class="spd-custom">
              <label>开始 <input v-model="rawDraftFrom" type="datetime-local" min="2026-01-01T00:00" max="2026-11-16T23:59"></label>
              <label>结束 <input v-model="rawDraftTo" type="datetime-local" min="2026-01-01T00:00" max="2026-11-16T23:59"></label>
              <button type="button" @click="applyRawQuery">查询</button>
              <span>{{ rawHint || (rawDraftFrom !== rawAppliedFrom || rawDraftTo !== rawAppliedTo ? '填写后点查询，曲线仍用上一已应用窗口' : '') }}</span>
            </div>
          </div>
          <div class="spd-raw-row">
            <article class="spd-raw-pane">
              <header>应力时程</header>
              <p v-if="!stressRaw.x.length" class="spd-empty">该窗口没有可展示的演示曲线。</p>
              <SchemeChart v-else class="spd-cg spd-raw-chart" :option="stressRawOption" />
            </article>
            <article class="spd-raw-pane">
              <header>声发射</header>
              <p v-if="!aeRaw.x.length" class="spd-empty">该窗口没有可展示的演示曲线。</p>
              <SchemeChart v-else class="spd-cg spd-raw-chart" :option="aeRawOption" />
            </article>
            <article class="spd-raw-pane">
              <header>柔性涡流</header>
              <p class="spd-empty">柔性涡流原始波形暂无本点绑定数据。判别结论仍为未发现裂纹。</p>
            </article>
          </div>
        </section>
      </section>

      <aside class="spd-right" aria-label="分析服务">
        <button
          v-for="card in cards"
          :key="card.id"
          type="button"
          class="spd-svc"
          :class="{ abn: card.abnormal, wait: card.pending }"
          @click="openService(card.id)"
        >
          <div class="top">
            <span class="name">{{ card.name }}</span>
            <span class="spd-status" :class="[card.badgeTone, card.badge.length > 8 ? 'is-long' : '']">{{ card.badge }}</span>
          </div>
          <div class="spd-kpis">
            <div v-for="kpi in card.kpis" :key="kpi.label" class="spd-kpi">
              <span class="lab">{{ kpi.label }}</span>
              <span class="val" :class="[kpi.small ? 'sm' : '', kpi.tone || '']">{{ kpi.value }}</span>
            </div>
          </div>
          <div v-if="card.bar != null" class="spd-dbar" title="对照 0.7 的阅读示意，不是报警线">
            <div class="spd-dbar-track">
              <div class="spd-dbar-fill" :style="{ width: card.bar + '%' }"></div>
              <div class="spd-dbar-mark"></div>
            </div>
            <div class="spd-dbar-labs"><span>0</span><span class="l7">0.7</span><span>1</span></div>
            <div class="spd-dbar-note">对照 0.7 的阅读示意，不是报警线</div>
          </div>
          <div v-if="card.note" class="spd-ex">{{ card.note }}</div>
          <div class="spd-concl">{{ card.conclusion }}</div>
          <div class="spd-go">查看详情</div>
        </button>
      </aside>
    </div>

    <div v-if="toast" class="spd-toast" role="status">{{ toast }}</div>

    <div v-if="drawer" class="spd-drawer-mask" @click.self="closeDrawer">
      <aside class="spd-drawer" role="dialog" aria-modal="true" :aria-labelledby="'spd-drawer-title'" @click.stop>
        <header class="spd-dhd">
          <div class="spd-dhd-copy">
            <strong id="spd-drawer-title">{{ serviceName(drawer) }}</strong>
            <span>{{ active.id }}　{{ active.loc }}　全局状态 {{ statusName(active.status) }}　·　演示数据</span>
          </div>
          <label>切点
            <select :value="active.id" aria-label="切换点位" @change="onPointChange">
              <option v-for="point in points" :key="point.id" :value="point.id">{{ point.id }}　{{ point.loc }}</option>
            </select>
          </label>
          <button ref="drawerClose" type="button" class="spd-x" title="关闭（Esc）" @click="closeDrawer">✕</button>
        </header>
        <div class="spd-drawer-body">
          <template v-if="drawer === 'health' || drawer === 'crack'">
            <p class="spd-scope">范围是当前选中点位。结构模型用页面中部的双梁示意，点位序号已标注，这里不再另做模型。跨点位和 A梁 / B梁 比较在结构整体表，不在本抽屉。</p>
            <div class="spd-grain" role="group" aria-label="时间范围">
              <button type="button" :class="{ on: grain === 'year' }" @click="setGrain('year')">年度</button>
              <button type="button" :class="{ on: grain === 'month' }" @click="setGrain('month')">月度</button>
              <button type="button" :class="{ on: grain === 'custom' }" @click="grain = 'custom'">自定义</button>
              <span>{{ grainLabel }}</span>
            </div>
            <div v-if="grain === 'custom'" class="spd-custom">
              <label>开始 <input v-model="customFrom" type="date" min="2026-01-01" max="2026-11-16"></label>
              <label>结束 <input v-model="customTo" type="date" min="2026-01-01" max="2026-11-16"></label>
              <button type="button" @click="applyCustom">查询</button>
              <span>{{ rangeHint }}</span>
            </div>
            <p v-if="!buckets.length" class="spd-empty">该窗口没有可展示的演示曲线。</p>
            <template v-else-if="drawer === 'health'">
              <div class="spd-conclbox">
                <div class="k">当前结论（演示）</div>
                <div class="v">D={{ active.D.toFixed(2) }}，{{ health.health }}</div>
                <div class="s">会议口径：D＜0.7 健康，0.7≤D＜1 亚健康，D≥1 分级待核。不采用算法 PPT 第3页旧五级表，也不把亚健康写成报警。健康状态不改变全局状态。</div>
              </div>
              <div class="spd-scrollx">
                <table class="spd-grid">
                  <thead>
                    <tr>
                      <th>来源</th><th>序号</th><th>名称</th><th>最大应力幅</th><th>最小应力幅</th><th>应力谱系数</th><th>已发生循环次数</th><th>窗口期末损伤度</th><th>当前损伤度 D</th><th>点位健康状态</th><th>部件</th><th>部件健康状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{{ health.source }}</td><td>{{ active.id }}</td><td>{{ active.loc }}</td>
                      <td>{{ health.stressMax }} MPa</td><td>{{ health.stressMin }} MPa</td><td>{{ health.spectrum }}</td>
                      <td>{{ health.cycles }}</td><td>{{ health.windowDamage }}</td><td>{{ health.damage }}</td>
                      <td><span class="spd-status" :class="health.healthTone">{{ health.health }}</span></td>
                      <td>{{ health.component }}</td>
                      <td><span class="spd-status" :class="health.componentTone">{{ health.componentHealth }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="spd-scope">应力谱系数是本点演示常数。来源列为「统一点」，因为当前演示点已不再区分实测与孪生。跨点比较在结构整体表，不在本抽屉。</p>
              <div class="spd-chart-grid">
                <article class="spd-chartblock">
                  <div class="spd-ctitle">载荷谱历程<span class="spd-demo">演示数据</span></div>
                  <div class="spd-cdesc">整机载荷历程，按所选粒度取区间最大载荷，单位 t。不是本点位独有测值。</div>
                  <SchemeChart class="spd-cg" :option="loadOption" />
                </article>
                <article class="spd-chartblock">
                  <div class="spd-ctitle">应力幅<span class="spd-demo">演示数据</span></div>
                  <div class="spd-cdesc">{{ grain === 'month' ? '月度逐日应力幅。' : '年度或自定义长窗口按月取最大值。' }} 单位 MPa。</div>
                  <SchemeChart class="spd-cg" :option="stressOption" />
                </article>
                <article class="spd-chartblock">
                  <div class="spd-ctitle">应力幅—循环次数分布<span class="spd-demo">演示数据</span></div>
                  <div class="spd-cdesc">横轴是应力幅（MPa），纵轴是落在该幅值的循环次数，不是按时间累积。</div>
                  <SchemeChart class="spd-cg" :option="distributionOption" />
                </article>
                <article class="spd-chartblock">
                  <div class="spd-ctitle">累积损伤度<span class="spd-demo">演示数据</span></div>
                  <div class="spd-cdesc">累积损伤度 D。0.7 只是阅读参考，不是报警线。</div>
                  <SchemeChart class="spd-cg" :option="damageOption" />
                </article>
              </div>
            </template>
            <template v-else>
              <div class="spd-conclbox">
                <div class="k">当前结论（演示）</div>
                <div class="v">剩余年限 {{ active.L.toFixed(1) }} 年，剩余损伤度 {{ crack.remainDamage }}</div>
                <div class="s">主结果仍是剩余年限。＜1 年红、＜2 年橙来自算法 PPT 第4页的示例配色，不表示全局报警。剩余年限不画成曲线。</div>
              </div>
              <div class="spd-scrollx">
                <table class="spd-grid">
                  <thead><tr><th>序号</th><th>名称</th><th>剩余损伤度</th><th>剩余循环次数</th><th>剩余年限</th></tr></thead>
                  <tbody>
                    <tr>
                      <td>{{ active.id }}</td><td>{{ active.loc }}</td><td>{{ crack.remainDamage }}</td><td>{{ crack.remainCycles }}</td>
                      <td :class="crack.yearTone">{{ crack.years }} 年</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="spd-scope">窗口期末剩余损伤度 {{ crack.windowRemainDamage }}。当前剩余年限和剩余损伤度与右侧卡片一致，不随窗口改写成另一套结果。曲线给出剩余循环次数，以及剩余损伤度的期末累积值。</p>
              <div class="spd-chart-grid">
                <article class="spd-chartblock">
                  <div class="spd-ctitle">剩余循环次数<span class="spd-demo">演示数据</span></div>
                  <div class="spd-cdesc">所选窗口内的剩余循环次数。</div>
                  <SchemeChart class="spd-cg" :option="remainCycleOption" />
                </article>
                <article class="spd-chartblock">
                  <div class="spd-ctitle">剩余损伤度<span class="spd-demo">演示数据</span></div>
                  <div class="spd-cdesc">年度、月度或自定义窗口的期末剩余损伤度，不是剩余年限曲线。</div>
                  <SchemeChart class="spd-cg" :option="remainDamageOption" />
                </article>
              </div>
            </template>
          </template>
          <template v-else-if="drawer === 'ae'">
            <div class="spd-conclbox">
              <div class="k">当前结论（演示）</div>
              <div class="v">{{ aeText }}</div>
              <div class="s">{{ aeSub }}</div>
            </div>
            <div class="spd-kpis spd-drawer-kpis">
              <div class="spd-kpi"><span class="lab">最近活性事件</span><span class="val sm">{{ aeLast }}</span></div>
              <div class="spd-kpi"><span class="lab">近 14 日事件</span><span class="val">{{ aeCount }} 次</span></div>
            </div>
            <div class="spd-eddy-note">
              <b>所附 PPT 未规定本服务的曲线</b>
              <span>算法 PPT 与中期汇报只说明光纤声发射用于焊缝裂纹监测，没有规定幅值、撞击或谱图。这里不补画声发射曲线，结论里也不写 40 dB。</span>
            </div>
          </template>
          <template v-else>
            <div class="spd-conclbox">
              <div class="k">当前结论（演示）</div>
              <div class="v">该位置未发现裂纹</div>
              <div class="s">本能力为柔性涡流阵列，用于判别裂纹长度与大小。依据：涡流监测数据（演示）。</div>
            </div>
            <div class="spd-kpis spd-drawer-kpis">
              <div class="spd-kpi"><span class="lab">监测方式</span><span class="val sm">柔性涡流阵列</span></div>
              <div class="spd-kpi"><span class="lab">判别结果</span><span class="val sm">未发现裂纹</span></div>
            </div>
            <div class="spd-eddy-note">
              <b>不给出裂纹长度或大小</b>
              <span>中期汇报第8、10页只说明柔性涡流阵列的布设位置，没有规定阻抗、相位或裂纹尺寸曲线。本抽屉不编造这些图，也不把结果写成待接入。</span>
            </div>
          </template>
        </div>
      </aside>
    </div>

    <div v-if="alarmOpen" class="spd-mask" @click.self="closeAlarms">
      <div class="spd-modal" role="dialog" aria-modal="true" aria-labelledby="spd-alarm-title" @click.stop>
        <div class="spd-mhd">
          <span id="spd-alarm-title" class="mt">报警记录</span>
          <span class="ms">独立于服务详情　·　演示数据　·　共 {{ alarms.length }} 条</span>
          <button ref="alarmClose" type="button" class="spd-x" title="关闭（Esc）" @click="closeAlarms">✕</button>
        </div>
        <div class="spd-banner" :class="alarmId ? 'alarm' : 'current'">
          <div v-if="selectedAlarm"><strong>正在回看报警记录 {{ selectedAlarm.id }}</strong>　时段 {{ fmtRange(alarmFrom, alarmTo) }}（{{ tz }}）　点位 {{ selectedAlarm.pid }}。这是历史证据，不是当前服务结果。</div>
          <div v-else><strong>报警记录</strong>　请选择一条声发射事件，查看该时段的演示证据。这些事件不由损伤度阈值生成，也不会写进服务抽屉。</div>
          <button v-if="alarmId" type="button" class="backnow" @click="returnCurrent">返回当前</button>
        </div>
        <div class="spd-mbody spd-alarm-body">
          <aside class="spd-mside">
            <div class="spd-alist">
              <button v-for="alarm in alarms" :key="alarm.id" type="button" class="spd-aitem" :class="{ on: alarm.id === alarmId }" @click="selectAlarm(alarm.id)">
                <div class="t"><span class="id">{{ alarm.id }}</span><span class="spd-status" :class="alarm.level">{{ statusName(alarm.level) }}</span></div>
                <div class="d">{{ alarm.title }}</div>
                <div class="m">{{ alarm.pid }}　{{ pointLoc(alarm.pid) }}　·　{{ fmtRange(alarm.from, alarm.to) }}（{{ tz }}）</div>
              </button>
            </div>
            <div v-if="selectedAlarm" class="spd-qbox">
              <div class="k">时间范围查询</div>
              <div class="spd-hint">只过滤本弹窗里的报警证据曲线和记录，不影响服务抽屉。</div>
              <div class="spd-qrow"><label for="alarm-from">开始</label><input id="alarm-from" v-model="alarmDraftFrom" type="datetime-local"></div>
              <div class="spd-qrow"><label for="alarm-to">结束</label><input id="alarm-to" v-model="alarmDraftTo" type="datetime-local"></div>
              <div class="spd-qact"><button type="button" @click="runAlarmQuery">查询</button></div>
              <div class="spd-hint">{{ alarmHint }}</div>
            </div>
          </aside>
          <div class="spd-mmain">
            <div v-if="!selectedAlarm" class="spd-eddy-note">
              <b>选择一条报警记录</b>
              <span>回看后可以看到该时段的声发射幅值演示证据。服务抽屉里没有报警记录入口。</span>
            </div>
            <template v-else-if="alarmPack.option">
              <article class="spd-chartblock">
                <div class="spd-ctitle">声发射幅值证据<span class="spd-demo">演示数据</span></div>
                <div class="spd-cdesc">{{ selectedAlarm.note }} 40 dB 只是示意阈值，不是规范，也不写入损伤活性诊断结论。</div>
                <SchemeChart class="spd-cg" :option="alarmPack.option" />
              </article>
              <div class="spd-rec">
                <div class="rh"><span>对应记录 · 按小时最大幅值</span><span>演示数据</span></div>
                <div class="scroll">
                  <table>
                    <thead><tr><th>时间（{{ tz }}）</th><th>项目</th><th>数值</th><th>说明</th></tr></thead>
                    <tbody>
                      <tr v-for="(row, index) in alarmPack.series.recs" :key="index" :class="{ hit: row.hit }">
                        <td>{{ fmtDT(row.t) }}</td><td>{{ row.item }}</td><td>{{ row.val }}</td><td>{{ recordNote(row) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
            <p v-else class="spd-empty">该时段没有可展示的证据曲线。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SchemeChart from '@/components/pointScheme/SchemeChart.vue'
import StructureCraneModel from '@/components/pointScheme/StructureCraneModel.vue'
import { alarmEvidence, barOption, categoryOption, recordNote } from '@/components/pointScheme/structureCharts'
import {
  ALARMS, SERVICE_FROM, SERVICE_TO, SERVICES, STRUCTURE_POINTS, TZ,
  CUR_FROM, CUR_TO, aeConclusion, aeSeries, amplitudeDistribution, crackTable, fmtDT, fmtRange, groupedPoints, healthTable, stressSeries,
  parseDT, pointSummary, serviceBuckets, serviceCards, statusName, structurePoint,
  type ServiceGrain, type SvcId, type ModelMode
} from '@/mock/structurePointDetail'

const props = defineProps<{ pointId: string }>()
const emit = defineEmits<{ select: [id: string] }>()

const crane = ref<{ applyHover: (id: string | null) => void } | null>(null)
const drawerClose = ref<HTMLButtonElement | null>(null)
const alarmClose = ref<HTMLButtonElement | null>(null)
const activeId = ref(props.pointId)
const query = ref('')
const onlyBad = ref(false)
const modelMode = ref<ModelMode>('model')
const drawer = ref<SvcId | null>(null)
const alarmOpen = ref(false)
const alarmId = ref<string | null>(null)
const alarmFrom = ref('')
const alarmTo = ref('')
const alarmDraftFrom = ref('')
const alarmDraftTo = ref('')
const alarmHint = ref('')
const grain = ref<ServiceGrain>('year')
const customFrom = ref(SERVICE_FROM)
const customTo = ref(SERVICE_TO)
const appliedFrom = ref(SERVICE_FROM)
const appliedTo = ref(SERVICE_TO)
const rangeHint = ref('')
const rawPreset = ref<'year' | 'month' | 'custom' | ''>('')
const rawDraftFrom = ref(CUR_FROM)
const rawDraftTo = ref(CUR_TO)
const rawAppliedFrom = ref(CUR_FROM)
const rawAppliedTo = ref(CUR_TO)
const rawHint = ref('')
const rawAppliedLabel = computed(() => fmtRange(rawAppliedFrom.value, rawAppliedTo.value))
const toast = ref('')
let toastTimer = 0

const points = STRUCTURE_POINTS
const alarms = ALARMS
const tz = TZ
const summary = pointSummary()
const active = computed(() => structurePoint(activeId.value))
const groups = computed(() => groupedPoints(query.value, onlyBad.value))
const cards = computed(() => serviceCards(active.value))
const selectedAlarm = computed(() => alarms.find(item => item.id === alarmId.value) || null)
const buckets = computed(() => serviceBuckets(active.value, grain.value, appliedFrom.value, appliedTo.value))
const labels = computed(() => buckets.value.map(item => item.label))
const health = computed(() => healthTable(active.value, buckets.value))
const crack = computed(() => crackTable(active.value, buckets.value))
const grainLabel = computed(() => grain.value === 'year' ? '缺省：2026-01-01 至 2026-11-16，按月' : grain.value === 'month' ? '2026-11-01 至 2026-11-16，按日' : `${appliedFrom.value} 至 ${appliedTo.value}`)
const loadOption = computed(() => categoryOption(labels.value, buckets.value.map(item => item.load), '#1677ff', '载荷', 't', 1))
const stressOption = computed(() => categoryOption(labels.value, buckets.value.map(item => item.stressMax), '#0f766e', '应力幅', 'MPa', 1))
const distribution = computed(() => amplitudeDistribution(active.value))
const distributionOption = computed(() => barOption(distribution.value.map(item => item.label), distribution.value.map(item => item.cycles), '应力幅 / MPa', '循环次数'))
function rawSeries(kind: 'stress' | 'ae') {
  const query = { view: 'current' as const, alarm: null, modal: kind === 'ae' ? 'ae' as const : 'health' as const }
  return kind === 'ae'
    ? aeSeries(active.value, rawAppliedFrom.value, rawAppliedTo.value, query)
    : stressSeries(active.value, rawAppliedFrom.value, rawAppliedTo.value, query)
}
function rawSeriesOption(kind: 'stress' | 'ae') {
  const series = rawSeries(kind)
  const step = Math.max(1, Math.floor(series.x.length / 48))
  const labels: string[] = []
  const values: number[] = []
  const span = (rawAppliedToMs() - rawAppliedFromMs()) > 36 * 3600 * 1000
  series.x.forEach((time, index) => {
    if (index % step) return
    const text = fmtDT(time, false)
    labels.push(span ? text.slice(5, 16) : text.slice(11, 16))
    values.push(series.y[index])
  })
  return categoryOption(labels, values, kind === 'ae' ? '#7c3aed' : '#1677ff', kind === 'ae' ? '幅值' : '应力', kind === 'ae' ? 'dB' : 'MPa', 1)
}
function rawAppliedFromMs() { return parseDT(rawAppliedFrom.value) }
function rawAppliedToMs() { return parseDT(rawAppliedTo.value) }
const stressRaw = computed(() => rawSeries('stress'))
const aeRaw = computed(() => rawSeries('ae'))
const stressRawOption = computed(() => rawSeriesOption('stress'))
const aeRawOption = computed(() => rawSeriesOption('ae'))
const damageOption = computed(() => categoryOption(labels.value, buckets.value.map(item => item.damage), '#7c3aed', '累积损伤度 D', '', 2, {
  min: 0,
  max: Math.max(0.85, ...buckets.value.map(item => item.damage)),
  mark: { value: 0.7, label: '0.7 阅读参考', color: '#6d28d9' }
}))
const remainCycleOption = computed(() => categoryOption(labels.value, buckets.value.map(item => item.remainCycles), '#0d9488', '剩余循环次数', '次', 0, { min: 0 }))
const remainDamageOption = computed(() => categoryOption(labels.value, buckets.value.map(item => item.remainDamage), '#7c3aed', '剩余损伤度', '', 2, { min: 0, max: 1 }))
const aeInfo = computed(() => aeConclusion(active.value))
const aeText = computed(() => aeInfo.value.text)
const aeLast = computed(() => aeInfo.value.lastLabel ? aeInfo.value.lastLabel.slice(5) : '无')
const aeCount = computed(() => aeInfo.value.count)
const aeSub = computed(() => active.value.aeActive
  ? '这是声发射活性的演示发现，只说明该点当前有活跃扩展迹象，并给出最近一次事件时间。不改损伤度，也不另设正式等级。'
  : '该句只描述当前声发射现象，不引用幅值门槛，也不把现象映射成损伤度或全局状态。')
const alarmPack = computed(() => selectedAlarm.value && alarmFrom.value && alarmTo.value
  ? alarmEvidence(structurePoint(selectedAlarm.value.pid), alarmFrom.value, alarmTo.value, selectedAlarm.value)
  : { series: { recs: [] }, option: null })

watch(() => props.pointId, id => {
  if (!id || id === activeId.value) return
  activeId.value = structurePoint(id).id
})
watch([alarmFrom, alarmTo], () => {
  alarmDraftFrom.value = alarmFrom.value
  alarmDraftTo.value = alarmTo.value
})
watch(drawer, value => { if (value) nextTick(() => drawerClose.value?.focus()) })
watch(alarmOpen, value => { if (value) nextTick(() => alarmClose.value?.focus()) })

function serviceName(id: SvcId) {
  return SERVICES.find(item => item.id === id)?.name || ''
}
function pointLoc(id: string) {
  return structurePoint(id).loc
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
    alarmHint.value = ''
    showToast('已切换点位，并退出报警回看')
  }
  activeId.value = id
  emit('select', id)
}
function onPointChange(event: Event) {
  pick((event.target as HTMLSelectElement).value)
}
function openService(id: SvcId) {
  drawer.value = id
}
function closeDrawer() {
  drawer.value = null
}
function openAlarms() {
  alarmOpen.value = true
}
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
function runAlarmQuery() {
  if (!alarmDraftFrom.value || !alarmDraftTo.value) {
    alarmHint.value = '请填写开始和结束时间'
    return
  }
  if (parseDT(alarmDraftFrom.value) >= parseDT(alarmDraftTo.value)) {
    alarmHint.value = '开始时间必须早于结束时间'
    return
  }
  if (parseDT(alarmDraftTo.value) - parseDT(alarmDraftFrom.value) > 16 * 86400000) {
    alarmHint.value = '证据曲线窗口最长 16 天'
    return
  }
  alarmFrom.value = alarmDraftFrom.value
  alarmTo.value = alarmDraftTo.value
  alarmHint.value = ''
}
function setGrain(next: ServiceGrain) {
  grain.value = next
  rangeHint.value = ''
}
function applyRawPreset(preset: 'year' | 'month') {
  rawPreset.value = preset
  rawHint.value = ''
  rawAppliedFrom.value = preset === 'year' ? `${SERVICE_FROM}T00:00` : '2026-11-01T00:00'
  rawAppliedTo.value = `${SERVICE_TO}T04:00`
  rawDraftFrom.value = rawAppliedFrom.value
  rawDraftTo.value = rawAppliedTo.value
}
function applyRawQuery() {
  if (!rawDraftFrom.value || !rawDraftTo.value) {
    rawHint.value = '请填写开始和结束时间'
    return
  }
  if (parseDT(rawDraftFrom.value) >= parseDT(rawDraftTo.value)) {
    rawHint.value = '开始时间必须早于结束时间'
    return
  }
  const coveredFrom = parseDT(`${SERVICE_FROM}T00:00`)
  const coveredTo = parseDT(`${SERVICE_TO}T23:59`)
  if (parseDT(rawDraftFrom.value) < coveredFrom || parseDT(rawDraftTo.value) > coveredTo) {
    rawHint.value = '演示曲线只覆盖 2026-01-01 至 2026-11-16'
    return
  }
  rawAppliedFrom.value = rawDraftFrom.value
  rawAppliedTo.value = rawDraftTo.value
  rawPreset.value = 'custom'
  rawHint.value = ''
}
function applyCustom() {
  if (customFrom.value < SERVICE_FROM || customTo.value > SERVICE_TO) {
    rangeHint.value = '演示曲线只覆盖 2026-01-01 至 2026-11-16'
    return
  }
  if (customFrom.value >= customTo.value) {
    rangeHint.value = '开始日期必须早于结束日期'
    return
  }
  appliedFrom.value = customFrom.value
  appliedTo.value = customTo.value
  grain.value = 'custom'
  rangeHint.value = ''
}
function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (alarmOpen.value) closeAlarms()
  else if (drawer.value) closeDrawer()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.clearTimeout(toastTimer)
})
</script>

<style src="@/styles/structure-point-detail.css"></style>

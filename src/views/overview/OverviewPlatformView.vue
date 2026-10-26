<template>
  <div class="ov-scroll">
    <div class="ov-page">
      <section>
        <h1 class="ov-title">冶金起重装备 · 平台总览</h1>
        <p class="ov-sub">本钢、永钢、沙钢三家示范企业 · 各企业账号仅可见本企业数据</p>
      </section>
      <section class="ov-kpis">
        <div class="ov-kpi">
          <span class="ov-kpi-label">在册设备</span>
          <strong>{{ total.toLocaleString('zh-CN') }}<span>台</span></strong>
          <span class="ov-bar"><i :style="{ width: onlinePct + '%' }"></i></span>
          <p>在线 {{ online.toLocaleString('zh-CN') }} 台 · {{ onlinePct }}%</p>
        </div>
        <div class="ov-kpi is-red">
          <span class="ov-kpi-label">红色预警</span>
          <strong>{{ red }}<span>台</span></strong>
          <p>{{ groupBits('red') }}</p>
        </div>
        <div class="ov-kpi is-yellow">
          <span class="ov-kpi-label">黄色报警</span>
          <strong>{{ yellow }}<span>台</span></strong>
          <p>{{ groupBits('yellow') }}</p>
        </div>
        <div class="ov-kpi">
          <span class="ov-kpi-label">预警平均响应时长</span>
          <strong>—<span></span></strong>
          <p>台账没有处置计时</p>
        </div>
      </section>
      <section class="ov-orgs">
        <article v-for="org in orgs" :key="org.enterprise" class="ov-org">
          <div class="ov-org-head">
            <h2>{{ org.title }}</h2>
            <span class="ov-tag">已在册</span>
          </div>
          <span class="ov-sub">{{ org.scope }}</span>
          <div class="ov-mini">
            <span class="is-red"><em>红色预警</em><b>{{ org.red }}</b></span>
            <span class="is-yellow"><em>黄色报警</em><b>{{ org.yellow }}</b></span>
            <span class="is-plain"><em>在线设备</em><b>{{ org.online }}</b></span>
          </div>
          <div class="ov-top">
            <p>风险最高的二级单位</p>
            <div v-for="unit in org.top" :key="unit.unit">
              <span>{{ unit.unit }}</span>
              <span><span class="r">{{ unit.red }}</span> 预警 · <span class="y">{{ unit.yellow }}</span> 报警</span>
            </div>
          </div>
          <a class="ov-enter" href="" @click.prevent="enter(org.enterprise)">进入企业态势</a>
        </article>
      </section>
      <section class="ov-block">
        <div class="ov-section-head">
          <h2>全平台红色预警</h2>
          <span class="ov-sub">按发生时间</span>
        </div>
        <div class="ov-table-wrap">
          <table class="ov-table">
            <thead>
              <tr>
                <th>企业 / 二级单位</th>
                <th>设备</th>
                <th>关联事故</th>
                <th>预警内容</th>
                <th>发生时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in reds" :key="row.id">
                <td>{{ row.org }}</td>
                <td>{{ row.name }} <span class="muted">{{ row.code }}</span></td>
                <td><span class="ov-pill">{{ row.scene || '—' }}</span></td>
                <td>{{ row.message }}</td>
                <td>{{ row.time }}</td>
                <td>—</td>
              </tr>
              <tr v-if="!reds.length">
                <td colspan="6">当前没有红色预警</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  enterpriseLabel,
  getOverviewCards,
  legalHint,
  primaryAlarm,
  rollupUnits,
  worstUnit,
  BENGANG,
  type OverviewCard
} from '@/mock/overviewDemo'

const router = useRouter()
const cards = getOverviewCards()

const total = cards.length
const online = cards.filter(card => card.online).length
const onlinePct = total ? Math.round(online / total * 100) : 0
const red = cards.filter(card => card.level === 'red').length
const yellow = cards.filter(card => card.level === 'yellow').length

const enterprises = [BENGANG, '江苏永钢集团有限公司', '沙钢']

function of(enterprise: string) {
  return cards.filter(card => card.enterprise === enterprise)
}

function groupBits(kind: 'red' | 'yellow') {
  return enterprises.map(enterprise => `${enterpriseLabel(enterprise)} ${of(enterprise).filter(card => card.level === kind).length}`).join(' · ')
}

const orgs = computed(() => enterprises.map(enterprise => {
  const list = of(enterprise)
  const units = rollupUnits(list).sort((a, b) => b.red - a.red || b.yellow - a.yellow || b.total - a.total)
  const sector = enterprise === BENGANG ? '板材板块' : ''
  return {
    enterprise,
    title: sector ? `${enterpriseLabel(enterprise)} · ${sector}` : enterpriseLabel(enterprise),
    scope: `${list.length} 台 · ${units.length} 个二级单位${legalHint(enterprise) && enterprise !== BENGANG ? ' · ' + legalHint(enterprise) : ''}`,
    red: list.filter(card => card.level === 'red').length,
    yellow: list.filter(card => card.level === 'yellow').length,
    online: list.filter(card => card.online).length,
    top: units.slice(0, 3)
  }
}))

const reds = computed(() => cards.filter(card => card.level === 'red').map(rowOf).sort((a, b) => a.time.localeCompare(b.time)))

function rowOf(card: OverviewCard) {
  const alarm = primaryAlarm(card)
  return {
    id: card.id,
    org: `${card.enterpriseLabel} · ${card.unit}`,
    name: card.name,
    code: card.code,
    scene: card.scene,
    message: card.message,
    time: alarm?.time || '—'
  }
}

function enter(enterprise: string) {
  router.push({ name: 'overviewPlant', query: { enterprise, unit: worstUnit(cards, enterprise) } })
}
</script>

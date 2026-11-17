import type { EChartsOption } from 'echarts'
import {
  CUR_TO, DEMO_AS_OF, aeSeries, damageSeries, fmtDT, lifeSeries, parseDT, remainCycles, stressSeries,
  type AlarmRecord, type DemoRecord, type DemoSeries, type ModalView, type SeriesQuery, type StructurePoint, type SvcId
} from '@/mock/structurePointDetail'

export interface EvidenceChart {
  key: string
  title: string
  desc: string
  option: EChartsOption
}

export interface EvidencePack {
  kind: 'charts' | 'list' | 'note' | 'redirect'
  charts: EvidenceChart[]
  recordsTitle: string
  records: DemoRecord[]
}

function tickLabel(ms: number, span: number) {
  const text = fmtDT(ms, false)
  if (span <= 12 * 3600 * 1000) return text.slice(11, 16)
  if (span <= 2 * 86400000) return `${text.slice(5, 10)} ${text.slice(11, 16)}`
  return text.slice(5, 10)
}

function lineOption(series: DemoSeries, color: string, query: SeriesQuery, extra?: { ymin?: number; ymax?: number; thresholds?: { v: number; label: string; color: string }[]; yfmt?: (value: number) => string }) {
  if (!series.x.length) return null
  const yminData = Math.min(...series.y)
  const ymaxData = Math.max(...series.y)
  const pad = (ymaxData - yminData) * 0.18 || 1
  let y0 = yminData - pad
  let y1 = ymaxData + pad
  if (series.th != null) {
    y0 = Math.min(y0, 0)
    y1 = Math.max(y1, series.th + 8)
  }
  if (extra?.ymin != null) y0 = extra.ymin
  if (extra?.ymax != null) y1 = extra.ymax
  const span = series.x[series.x.length - 1] - series.x[0]
  const alarm = query.view === 'alarm' ? query.alarm : null
  const option: EChartsOption = {
    animation: false,
    grid: { left: 48, right: 16, top: 22, bottom: 28 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const row = (Array.isArray(params) ? params[0] : params) as { value?: [number, number] }
        const value = row?.value
        if (!value) return ''
        return `${fmtDT(value[0])}<br/>${series.name} ${value[1]}${series.unit ? ` ${series.unit}` : ''}`
      }
    },
    xAxis: {
      type: 'time',
      min: series.x[0],
      max: series.x[series.x.length - 1],
      axisLabel: { color: '#6b7280', fontSize: 11, hideOverlap: true, formatter: (value: number) => tickLabel(value, span) },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      splitLine: { show: true, lineStyle: { color: '#f3f4f6' } }
    },
    yAxis: {
      type: 'value',
      min: y0,
      max: y1,
      axisLabel: { color: '#6b7280', fontSize: 11, formatter: (value: number) => extra?.yfmt ? extra.yfmt(value) : String(value) },
      splitLine: { lineStyle: { color: '#eef0f3' } }
    },
    series: [{
      type: 'line',
      name: series.name,
      data: series.x.map((time, index) => [time, series.y[index]]),
      showSymbol: false,
      smooth: 0.15,
      lineStyle: { width: 1.6, color },
      areaStyle: { color, opacity: 0.08 },
      markPoint: {
        symbol: 'circle',
        symbolSize: 8,
        label: { show: false },
        itemStyle: { color: '#fff', borderColor: color, borderWidth: 2 },
        data: [{ name: '当前', coord: [series.x[series.x.length - 1], series.y[series.y.length - 1]] }]
      },
      markLine: extra?.thresholds?.length ? {
        symbol: 'none',
        data: extra.thresholds.map(item => ({
          yAxis: item.v,
          label: { formatter: item.label, color: item.color, fontSize: 11, position: 'insideEndTop' },
          lineStyle: { type: 'dashed' as const, color: item.color, width: 1.5 }
        }))
      } : undefined,
      markArea: alarm ? {
        itemStyle: { color: 'rgba(255, 237, 213, 0.55)' },
        data: [[{ xAxis: parseDT(alarm.from) }, { xAxis: parseDT(alarm.to) }]]
      } : undefined
    }]
  }
  return option
}

function chart(key: string, title: string, desc: string, series: DemoSeries, color: string, query: SeriesQuery, extra?: Parameters<typeof lineOption>[3]): EvidenceChart | null {
  const option = lineOption(series, color, query, extra)
  if (!option) return null
  return { key, title, desc, option }
}

export function evidenceFor(svc: SvcId, point: StructurePoint, from: string, to: string, view: ModalView, alarm: AlarmRecord | null): EvidencePack {
  const query: SeriesQuery = { view, alarm, modal: svc }
  if (view === 'alarm' && !alarm) return { kind: 'list', charts: [], recordsTitle: '', records: [] }
  if (svc === 'eddy') return { kind: 'note', charts: [], recordsTitle: '', records: [] }
  if (view === 'alarm' && alarm && svc !== 'ae') return { kind: 'redirect', charts: [], recordsTitle: '', records: [] }
  if (svc === 'health') {
    const damage = damageSeries(point)
    const stress = stressSeries(point, from, to, query)
    const yMax = Math.max(...damage.y, 0.75)
    const yMin = Math.min(...damage.y) - 0.02
    return {
      kind: 'charts',
      charts: [
        chart('d', '损伤度 D 变化', `近 14 个演示日，截至 ${DEMO_AS_OF}。水平参考仅作阅读辅助，不是报警线。`, damage, '#7c3aed', query, {
          ymin: yMin, ymax: yMax, yfmt: value => value.toFixed(2),
          thresholds: [{ v: 0.7, label: '0.7 亚健康起点（示意）', color: '#6d28d9' }]
        }),
        chart('s', '对应应力数据', '查询范围内的应力时程，单位 MPa。', stress, '#1677ff', query, { yfmt: value => value.toFixed(0) })
      ].filter((item): item is EvidenceChart => !!item),
      recordsTitle: '对应数据记录 · 按小时应力峰值',
      records: stress.recs
    }
  }
  if (svc === 'crack') {
    const life = lifeSeries(point)
    const stress = stressSeries(point, from, to, query)
    return {
      kind: 'charts',
      charts: [
        chart('l', '剩余年限', '近 14 个演示日，单位：年。不绘制裂纹尺寸或扩展曲线。', life, '#0d9488', query, { yfmt: value => value.toFixed(2) }),
        chart('s2', '对应应力数据', '查询范围内的应力时程，单位 MPa。', stress, '#1677ff', query, { yfmt: value => value.toFixed(0) })
      ].filter((item): item is EvidenceChart => !!item),
      recordsTitle: '对应数据记录 · 剩余年限与剩余循环次数',
      records: life.recs.concat([{
        t: parseDT(CUR_TO),
        item: '剩余循环次数',
        val: `${remainCycles(point).toLocaleString('zh-CN')} 次`,
        extra: '演示数据，由剩余年限推算，仅弹窗展示'
      }])
    }
  }
  const acoustic = aeSeries(point, from, to, query)
  return {
    kind: 'charts',
    charts: [
      chart('a', '声发射幅值', `查询范围内的幅值时程。40 dB 为示意阈值，不是规范条文。${view === 'alarm' ? ' 橙色带为本次报警时段。' : ''}`, acoustic, '#7c3aed', query, {
        ymin: 0,
        ymax: Math.max(60, ...acoustic.y) + 4,
        yfmt: value => value.toFixed(0),
        thresholds: [{ v: 40, label: '示意阈值 40 dB', color: '#d97706' }]
      })
    ].filter((item): item is EvidenceChart => !!item),
    recordsTitle: '对应数据记录 · 按小时最大幅值',
    records: acoustic.recs
  }
}

export function categoryOption(labels: string[], values: number[], color: string, name: string, unit: string, digits = 1, extra?: { min?: number; max?: number; mark?: { value: number; label: string; color: string } }): EChartsOption {
  return {
    animation: false,
    grid: { left: 58, right: 16, top: 28, bottom: 32 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const row = (Array.isArray(params) ? params[0] : params) as { axisValue?: string; value?: number }
        if (!row || row.value == null) return ''
        return `${row.axisValue}<br/>${name} ${Number(row.value).toFixed(digits)}${unit ? ` ${unit}` : ''}`
      }
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#6b7280', fontSize: 11, hideOverlap: true },
      axisLine: { lineStyle: { color: '#d1d5db' } }
    },
    yAxis: {
      type: 'value',
      min: extra?.min,
      max: extra?.max,
      axisLabel: { color: '#6b7280', fontSize: 11 },
      splitLine: { lineStyle: { color: '#eef0f3' } },
      scale: extra?.min == null
    },
    series: [{
      type: 'line',
      name,
      data: values,
      showSymbol: values.length < 20,
      symbolSize: 6,
      smooth: 0.15,
      lineStyle: { width: 1.8, color },
      itemStyle: { color },
      areaStyle: { color, opacity: 0.08 },
      markLine: extra?.mark ? {
        symbol: 'none',
        data: [{
          yAxis: extra.mark.value,
          label: { formatter: extra.mark.label, color: extra.mark.color, fontSize: 11, position: 'insideEndTop' },
          lineStyle: { type: 'dashed' as const, color: extra.mark.color, width: 1.5 }
        }]
      } : undefined
    }]
  }
}

export function alarmEvidence(point: StructurePoint, from: string, to: string, alarm: AlarmRecord) {
  const query: SeriesQuery = { view: 'alarm', alarm, modal: 'ae' }
  const series = aeSeries(point, from, to, query)
  const option = lineOption(series, '#7c3aed', query, {
    ymin: 0,
    ymax: Math.max(60, ...series.y, 40) + 4,
    yfmt: value => value.toFixed(0),
    thresholds: [{ v: 40, label: '示意阈值 40 dB', color: '#d97706' }]
  })
  return { series, option }
}

export function recordNote(row: DemoRecord) {
  return row.extra || (row.hit ? '超过示意阈值 40 dB' : '')
}

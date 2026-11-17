import type { EChartsOption } from 'echarts'
import { FEATURES, type FeatureKey } from '@/mock/mechanismPointDetail'

export function xyOption(x: number[], y: number[], xName: string, yName: string, color: string): EChartsOption {
  return {
    animation: false,
    grid: { left: 54, right: 12, top: 28, bottom: 48 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'value',
      name: xName,
      nameLocation: 'middle',
      nameGap: 28,
      axisLabel: { fontSize: 10, color: '#6b7280' },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: yName,
      nameTextStyle: { fontSize: 10, color: '#6b7280' },
      axisLabel: { fontSize: 10, color: '#6b7280' },
      splitLine: { lineStyle: { color: '#eef0f3' } },
      scale: true
    },
    dataZoom: [{ type: 'slider', height: 14, bottom: 4 }, { type: 'inside' }],
    series: [{
      type: 'line',
      data: x.map((value, index) => [value, y[index]]),
      showSymbol: false,
      sampling: 'lttb',
      lineStyle: { width: 1.2, color }
    }]
  }
}

function niceTop(danger: number, peak: number) {
  const needed = Math.max(danger + Math.max(0.8, danger * 0.2), peak * 1.08)
  const step = needed > 10 ? 2 : 1
  return { max: Math.ceil((needed + 1e-6) / step) * step, interval: step }
}

function lineLabel(text: string, color: string, above: boolean) {
  return {
    formatter: text,
    position: (above ? 'insideStartTop' : 'insideStartBottom') as 'insideStartTop' | 'insideStartBottom',
    fontSize: 11,
    color,
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: [1, 4],
    distance: 2
  }
}

export function featureOption(labels: string[], values: number[], key: FeatureKey, withLines = true): EChartsOption {
  const spec = FEATURES[key]
  const peak = values.length ? Math.max(...values) : 0
  const axis = withLines ? niceTop(spec.danger, peak) : null
  const abnormalText = `异常 ${spec.abnormal}（示意）`
  const dangerText = `危险 ${spec.danger}（示意）`
  return {
    animation: false,
    grid: { left: 46, right: 16, top: 16, bottom: 28 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 10, color: '#6b7280', hideOverlap: true } },
    yAxis: {
      type: 'value',
      min: 0,
      max: axis?.max,
      interval: axis?.interval,
      name: spec.unit || '无量纲',
      nameTextStyle: { fontSize: 10, color: '#6b7280' },
      axisLabel: {
        fontSize: 11,
        color: '#6b7280',
        formatter: (value: number) => String(Math.round(value * 10) / 10)
      },
      splitLine: { lineStyle: { color: '#eef0f3' } }
    },
    series: [{
      type: 'line',
      data: values,
      showSymbol: false,
      lineStyle: { width: 1.6, color: '#1677ff' },
      markLine: withLines ? {
        symbol: 'none',
        data: [
          {
            yAxis: spec.abnormal,
            label: lineLabel(abnormalText, '#1d4ed8', true),
            lineStyle: { type: 'dashed', color: '#2563eb', width: 1.5 }
          },
          {
            yAxis: spec.danger,
            label: { ...lineLabel(dangerText, '#b91c1c', false), position: 'insideStartBottom' },
            lineStyle: { type: 'dashed', color: '#dc2626', width: 1.5 }
          }
        ]
      } : undefined
    }]
  }
}

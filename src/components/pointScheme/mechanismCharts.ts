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

export function featureOption(labels: string[], values: number[], key: FeatureKey, withLines = true): EChartsOption {
  const spec = FEATURES[key]
  const peak = values.length ? Math.max(...values) : 0
  return {
    animation: false,
    grid: { left: 48, right: 12, top: 28, bottom: 36 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 10, color: '#6b7280', hideOverlap: true } },
    yAxis: {
      type: 'value',
      min: 0,
      max: withLines ? Math.max(spec.danger * 1.15, peak * 1.1) : undefined,
      name: spec.unit || '无量纲',
      nameTextStyle: { fontSize: 10 },
      axisLabel: { fontSize: 10, color: '#6b7280' },
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
          { yAxis: spec.abnormal, label: { formatter: `异常 ${spec.abnormal}（示意）`, fontSize: 10, color: '#b45309' }, lineStyle: { type: 'dashed', color: '#2563eb' } },
          { yAxis: spec.danger, label: { formatter: `危险 ${spec.danger}（示意）`, fontSize: 10, color: '#b91c1c' }, lineStyle: { type: 'dashed', color: '#dc2626' } }
        ]
      } : undefined
    }]
  }
}

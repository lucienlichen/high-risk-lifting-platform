/**
 * 从沙钢脱敏设备清单生成 src/mock/shagangDevices.ts。
 *
 * 用法：node scripts/generate-shagang-devices.mjs
 * 输入：scripts/data/shagang-devices.csv（档案已去掉联系人）
 *
 * 二级单位：在去掉括号备注后，取「设备使用地点」从开头到首个
 * 「车间 / 项目 / 厂 / 库」（含该词）的前缀。无法匹配的归入「待归属」。
 * 明显变体：全角转半角、去空白、阿拉伯数字转中文数字、练钢→炼钢、板坏→板坯。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const csvPath = path.join(root, 'scripts/data/shagang-devices.csv')
const outPath = path.join(root, 'src/mock/shagangDevices.ts')

const MARKERS = ['车间', '项目', '厂', '库']
const LEGAL_ENTITY = '张家港华盛炼铁有限公司'
const GROUP_NAME = '沙钢'
const UNASSIGNED = '待归属'

function parseCSV(input) {
  const rows = []
  let row = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cur += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      row.push(cur)
      cur = ''
    } else if (ch === '\n') {
      row.push(cur)
      rows.push(row)
      row = []
      cur = ''
    } else if (ch !== '\r') {
      cur += ch
    }
  }
  if (cur.length || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows.filter(cells => cells.some(cell => cell.trim()))
}

function digitsToChinese(numStr) {
  const n = Number.parseInt(numStr, 10)
  if (!Number.isFinite(n) || n < 0 || n > 99) return numStr
  const digit = '零一二三四五六七八九'
  if (n < 10) return digit[n]
  if (n < 20) return `十${n % 10 ? digit[n % 10] : ''}`
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return `${digit[tens]}十${ones ? digit[ones] : ''}`
}

function stripParenthetical(text) {
  let current = text
  let previous = ''
  while (current !== previous) {
    previous = current
    current = current.replace(/（[^（）]*）/g, '').replace(/\([^()]*\)/g, '')
  }
  return current
}

export function parseSecondaryUnit(location) {
  const source = stripParenthetical(String(location || '').normalize('NFKC')).trim()
  let best = -1
  let bestLen = 0
  for (const marker of MARKERS) {
    const index = source.indexOf(marker)
    if (index >= 0 && (best < 0 || index < best || (index === best && marker.length > bestLen))) {
      best = index
      bestLen = marker.length
    }
  }
  if (best < 0) return UNASSIGNED
  let unit = source.slice(0, best + bestLen).replace(/\s+/g, '')
  unit = unit.replace(/练钢/g, '炼钢').replace(/板坏/g, '板坯')
  unit = unit.replace(/\d+/g, digitsToChinese)
  if (!unit || MARKERS.includes(unit)) return UNASSIGNED
  return unit
}

function param(name, value) {
  const text = String(value ?? '').trim()
  if (!text) return null
  return { name, value: text }
}

function buildRecord(row, index, columns) {
  const cell = (name) => (row[columns[name]] ?? '').trim()
  const archiveNo = cell('档案号')
  const location = cell('设备使用地点')
  const unit = parseSecondaryUnit(location)
  const capacity = cell('起重量（t）')
  const technicalParams = [
    param('档案号', archiveNo),
    param('出厂编号', cell('出厂编号')),
    param('规格型号', cell('规格型号')),
    param('起重量', capacity ? `${capacity}t` : ''),
    param('跨度', cell('跨度')),
    param('单位内部编号', cell('单位内部编号'))
  ].filter(Boolean)

  return {
    id: `metallurgy-sg-${archiveNo}`,
    source: 'SG-CSV',
    sourceIndex: index,
    scene: 'metallurgy',
    enterprise: GROUP_NAME,
    affiliatedUnit: unit,
    workArea: unit,
    name: cell('设备名称').replace(/\s+/g, '') || cell('设备品种'),
    code: archiveNo,
    type: cell('设备品种'),
    location,
    manufacturer: cell('原制造单位'),
    installDate: '',
    statusText: cell('设备状态') || '在用',
    technicalParams
  }
}

function main() {
  const text = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '')
  const rows = parseCSV(text)
  const header = rows[0].map(cell => cell.trim())
  const columns = Object.fromEntries(header.map((name, index) => [name, index]))
  const required = ['使用单位', '档案号', '设备品种', '规格型号', '出厂编号', '设备使用地点', '起重量（t）']
  for (const name of required) {
    if (columns[name] === undefined) throw new Error(`缺少列：${name}`)
  }

  const records = rows.slice(1).map((row, index) => buildRecord(row, index + 1, columns))
  const ids = new Set()
  for (const record of records) {
    if (!record.code) throw new Error(`第 ${record.sourceIndex} 行缺少档案号`)
    if (ids.has(record.id)) throw new Error(`档案号重复：${record.code}`)
    ids.add(record.id)
    if (record.technicalParams.some(item => /1[3-9]\d{9}/.test(item.value))) {
      throw new Error(`疑似电话号码：${record.code}`)
    }
  }

  const unitCounts = new Map()
  const typeCounts = new Map()
  for (const record of records) {
    unitCounts.set(record.affiliatedUnit, (unitCounts.get(record.affiliatedUnit) || 0) + 1)
    typeCounts.set(record.type, (typeCounts.get(record.type) || 0) + 1)
  }

  const banner = [
    '// 由 scripts/generate-shagang-devices.mjs 生成，请勿手改。',
    `// 来源：scripts/data/shagang-devices.csv；使用单位一律为${LEGAL_ENTITY}。`,
    `// 集团名用「${GROUP_NAME}」（与会议纪要一致）。二级单位由使用地点前缀解析，解析不到的归入「${UNASSIGNED}」。`,
    "import type { DemoDeviceRecord } from './demoDeviceRecords'",
    '',
    `export const SHAGANG_GROUP = ${JSON.stringify(GROUP_NAME)}`,
    `export const SHAGANG_LEGAL_ENTITY = ${JSON.stringify(LEGAL_ENTITY)}`,
    `export const SHAGANG_UNASSIGNED_UNIT = ${JSON.stringify(UNASSIGNED)}`,
    '',
    `export const shagangDeviceRecords: DemoDeviceRecord[] = ${JSON.stringify(records, null, 2)}`,
    ''
  ].join('\n')

  fs.writeFileSync(outPath, banner)
  const sorted = [...unitCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
  console.log(`devices ${records.length}`)
  console.log(`units ${sorted.length} (including ${UNASSIGNED})`)
  console.log(`unassigned ${unitCounts.get(UNASSIGNED) || 0}`)
  console.log('types', Object.fromEntries(typeCounts))
  console.log(sorted.map(([name, count]) => `${count}\t${name}`).join('\n'))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}

/**
 * 把永钢使用地点收成二级单位，写出 src/mock/yonggangUnitMap.json。
 *
 * 用法：node scripts/build-yonggang-units.mjs
 * 输入：src/mock/demoDeviceRecords.ts 里江苏永钢集团有限公司的 location。
 * 不改设备条数。规则按顺序匹配，先命中的为准。
 * 全角转半角，PC构建视为 PC构件，去掉吨位后缀。
 * 对不上厂名的碎片归入「未标明厂区」。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const recordsPath = path.join(root, 'src/mock/demoDeviceRecords.ts')
const outPath = path.join(root, 'src/mock/yonggangUnitMap.json')

/** @type {{ unit: string, test: RegExp }[]} */
const RULES = [
  { unit: '棒材四厂', test: /棒材四厂/ },
  { unit: '棒材三厂', test: /棒材三厂/ },
  { unit: '棒材五厂', test: /棒材五厂|棒五车间/ },
  { unit: '棒材二厂', test: /棒材二厂|棒材二分厂|棒二车间/ },
  { unit: '棒材厂', test: /棒材分厂/ },
  { unit: '大棒材厂', test: /大棒材|^[A-G]{2}跨/ },
  { unit: '线材六分厂', test: /线材六分厂/ },
  { unit: '线材五厂', test: /线材五厂|线五车间/ },
  { unit: '线材四厂', test: /线材四厂|线四车间/ },
  { unit: '线材三厂', test: /线材三厂|线材三车间|线材三分厂/ },
  { unit: '线材二厂', test: /线材二厂/ },
  { unit: '炼钢三厂', test: /炼钢三厂|三炼钢/ },
  { unit: '炼钢二厂', test: /炼钢二厂|二钢|二炼钢|2#炼钢|2号炼钢/ },
  { unit: '炼钢一厂', test: /炼钢一厂/ },
  { unit: '电炉分厂', test: /电炉/ },
  { unit: '炼钢厂', test: /炼钢/ },
  { unit: '炼铁一厂', test: /炼铁一厂/ },
  { unit: '炼铁三厂', test: /炼铁三厂/ },
  { unit: '炼铁动力车间', test: /炼铁动力/ },
  { unit: '高炉', test: /10#高炉|7#高炉|1080高炉|5#喷煤|大高炉/ },
  { unit: '烧结四厂', test: /烧结四厂/ },
  { unit: '烧结厂', test: /烧结|大烧结/ },
  { unit: '球团厂', test: /球团厂|造球车间/ },
  { unit: '高炉煤气发电', test: /高炉煤气/ },
  { unit: '废钢库', test: /废钢库/ },
  { unit: '物资库', test: /物资码头|物资库/ },
  { unit: '成品库', test: /^成品库/ },
  { unit: '原料场', test: /原料场|料场码头/ },
  { unit: '物流仓库', test: /物流仓库/ },
  { unit: '永成物流', test: /永成物流/ },
  { unit: 'PC构件', test: /永舟物流|PC构件/ },
  { unit: '建筑钢筋配送站', test: /建筑钢筋/ },
  { unit: '闷渣车间', test: /闷渣车间/ },
  { unit: '石灰厂', test: /石灰厂/ },
  { unit: '钢渣厂', test: /钢渣厂/ },
  { unit: '制氧厂', test: /制氧/ },
  { unit: '铸铁车间', test: /铸铁车间/ },
  { unit: '铸余渣车间', test: /铸余渣/ },
  { unit: '转底炉', test: /转底炉/ },
  { unit: '钢锭精整', test: /钢锭精整/ },
  { unit: '轧辊装配', test: /轧辊装配/ },
  { unit: '未标明厂区', test: /布袋除尘|NC2转运|^外场|^料跨|^料北跨|^主跨|^中跨|^车间|^加热炉跨|^连铸跨|^二车间|^生产车间|^A线|^B线/ }
]

export function normalizeYonggangLocation(location) {
  const raw = String(location || '')
    .trim()
    .normalize('NFKC')
    .replace(/PC构建/g, 'PC构件')
    .replace(/\s+/g, '')
    .replace(/\d+(?:\.\d+)?[Tt吨].*$/, '')
  if (!raw) return '未标明厂区'
  for (const rule of RULES) {
    if (rule.test.test(raw)) return rule.unit
  }
  return '未标明厂区'
}

function loadYonggang() {
  const text = fs.readFileSync(recordsPath, 'utf8')
  const records = JSON.parse(text.slice(text.indexOf('= [') + 2, text.lastIndexOf(']') + 1))
  return records.filter(record => record.enterprise === '江苏永钢集团有限公司' && record.scene === 'metallurgy')
}

function main() {
  const devices = loadYonggang()
  const map = {}
  const counts = new Map()
  for (const device of devices) {
    const source = device.location || device.workArea || ''
    const unit = normalizeYonggangLocation(source)
    map[source] = unit
    counts.set(unit, (counts.get(unit) || 0) + 1)
  }
  const sortedMap = Object.fromEntries(Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], 'zh-CN')))
  fs.writeFileSync(outPath, `${JSON.stringify(sortedMap, null, 2)}\n`)
  const units = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
  console.log(`devices ${devices.length}`)
  console.log(`locations ${Object.keys(sortedMap).length}`)
  console.log(`units ${units.length}`)
  console.log(units.map(([name, count]) => `${count}\t${name}`).join('\n'))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}

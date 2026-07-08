# 五个数据智能服务面板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将参考项目 `Intelligent_data_agent_LE` 的 5 个数据智能服务（点巡检 / 维修 / 检验 / 基础数据 / 供给）移植为本项目设备详情页可用的服务面板。

**Architecture:** 新建共享 mock 数据层 `src/mock/serviceData.ts`（确定性生成，复用参考 hash 算法），5 个面板组件放于 `src/components/`，在 `DeviceView.vue` 内容区按 `store.activeService` 渲染。参考用 Tailwind + lucide，本项目一律用 Element Plus + CSS token 重写。

**Tech Stack:** Vue 3 `<script setup>` + TypeScript + Element Plus + ECharts 5 + Pinia。路径别名 `@` → `src/`。

## Global Constraints

- **纯前端演示**：全部数据为前端确定性 mock，无后端/网络调用；下载、导出、重新生成等为占位交互，不产生真实副作用。
- **技术栈约束**：不引入 Tailwind / lucide-vue-next；图标用 Element Plus 图标（`@element-plus/icons-vue`）或内联 SVG；颜色/间距用 `src/styles/main.css` 的 CSS 变量 token，不硬编码 hex（面板背景 `#f8fafc` 沿用现有服务面板约定）。
- **面板根容器**：`position: absolute; inset: 0; z-index: 5; background: #f8fafc; display:flex; flex-direction:column;`（与现有服务面板一致，铺满内容区、位于服务菜单下方、无下弹动画）。
- **确定性**：同一设备 ID 每次渲染数据一致；复用参考 hash：`x=Math.imul(x^(x>>>16),2246822507); x=Math.imul(x^(x>>>13),3266489909); x^=x>>>16; return x>>>0`。
- **构建校验命令**：`npm run build`（即 `vue-tsc --noEmit && vite build`）必须通过。无单元测试框架，功能验证以类型检查 + 浏览器人工核对为准。
- **参考源**：`/Users/lucien/Programs/Intelligent_data_agent_LE/src/components/services/*.vue` 与 `src/constants/partStructure.ts`。执行每个组件任务前先通读对应参考文件。
- **prefixed scoped class** 前缀：点巡检 `spc-`、维修 `rep-`、检验 `insp-`、基础数据 `sup-`、供给 `sply-`。

---

## 文件结构

- Create `src/mock/serviceData.ts` — 共享工具 + `PART_CATEGORIES` + 5 个服务的类型与生成函数。
- Modify `src/mock/index.ts` — re-export `serviceData.ts` 的公开成员。
- Create `src/components/SpotCheckServicePanel.vue`（`point`，设备级）。
- Create `src/components/RepairServicePanel.vue`（`maintain`，设备级）。
- Create `src/components/InspectionServicePanel.vue`（`inspect`，全域）。
- Create `src/components/SupervisionServicePanel.vue`（`basicdata`，全域，含内部 ECharts 子组件）。
- Create `src/components/SupplyServicePanel.vue`（`supply`，全域）。
- Modify `src/views/device/DeviceView.vue` — 导入 5 组件、内容区新增渲染分支、`DRAWER_SERVICES` 增加 5 key、`PLACEHOLDER_SERVICES` 移除 5 key。

---

## Task 1: 共享 mock 数据基座

**Files:**
- Create: `src/mock/serviceData.ts`
- Modify: `src/mock/index.ts`（末尾 re-export 段）

**Interfaces:**
- Produces（后续任务消费）：
  - `hash(n: number): number`
  - `seedOf(id: string, salt: number): number`
  - `pad(n: number, w?: number): string`
  - `fmtDate(d: Date): string`（`YYYY-MM-DD`）
  - `dateMinusDays(days: number): string`
  - `addDays(base: Date | string, n: number): string`
  - `export interface PartCategory { key: string; name: string }`
  - `export const PART_CATEGORIES: PartCategory[]`（7 类：structure/mechanism/hydraulic/electric/safety/rigging/other，名称见 spec）

- [ ] **Step 1: 创建 `src/mock/serviceData.ts` 基座**

写入文件头注释、hash（见 Global Constraints 公式）、`seedOf`（`(id.split('').reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),5381)+salt)>>>0`）、`pad`/`fmtDate`/`dateMinusDays`/`addDays` 日期工具（参考 `DamageRepairDataService.vue:141-150`、`InspectionTestDataService.vue:21-24`），以及 `PART_CATEGORIES`（复刻 `partStructure.ts:15-23`，`safety` 名称用「安全防护装置」）。这些导出后续任务会用。

- [ ] **Step 2: 在 `src/mock/index.ts` re-export**

在文件末尾的 `export { ... }` 之外，新增一行：
```ts
export * from './serviceData'
```
（若与既有导出重名会在构建时报错，届时改为具名导出。）

- [ ] **Step 3: 构建校验**

Run: `npm run build`
Expected: 类型检查通过，无 `serviceData` 相关报错。

- [ ] **Step 4: Commit**

```bash
git add src/mock/serviceData.ts src/mock/index.ts
git commit -m "feat(mock): 数据智能服务共享 mock 基座（hash/日期工具/部件常量）"
```

---

## Task 2: 点巡检智能服务（设备级）

先通读参考 `SpotCheckDataService.vue`（仅移植其「概览卡 + 巡检问题统计 + 文本分析弹窗」部分，**跳过** `startAnalysis`/`getCategoryTree` 危险源部分 `SpotCheckDataService.vue:192-283` 与模板 `390-560`）。

**Files:**
- Modify: `src/mock/serviceData.ts`（新增点巡检生成器）
- Create: `src/components/SpotCheckServicePanel.vue`
- Modify: `src/views/device/DeviceView.vue`

**Interfaces:**
- Consumes: Task 1 的 `hash/pad/dateMinusDays/PART_CATEGORIES`。
- Produces:
  - `export interface SpotTextRecord { id:string; problem:string; location:string; level:{text:string;tone:'high'|'mid'|'low'}; metric:string; action:string; date:string; inspector:string; source:string; rawText:string }`
  - `export interface SpotPartStat { key:string; name:string; count:number; topProblems:string[]; records:SpotTextRecord[] }`
  - `export interface SpotCheckBoard { formCount:number; items:SpotPartStat[]; totalProblems:number; maxCount:number; involvedParts:number; topPart:string }`
  - `getSpotCheckBoard(deviceId: string): SpotCheckBoard`

- [ ] **Step 1: mock 生成器 `getSpotCheckBoard`**

在 `serviceData.ts` 新增：`PROBLEMS_BY_KEY`、`LOCS`、`INSPECTORS`、`LEVELS`（tone 用 `'high'|'mid'|'low'` 替代参考的 Tailwind class）、`metricOf`、`actionOf`（逐字移植 `SpotCheckDataService.vue:24-92`），以及 `getSpotCheckBoard`（移植 `board` computed 逻辑 `107-158`，`formCount` 固定取一个由设备种子决定的 6~14 之间的值代替上传文件数：`const formCount = 6 + (hash(base+999)%9)`）。追加计算 `involvedParts` 与 `topPart` 并纳入返回值。

- [ ] **Step 2: 创建 `SpotCheckServicePanel.vue`**

`props: { device: Device | null }`；`const board = computed(() => device.value ? getSpotCheckBoard(device.value.id) : null)`。模板（Element Plus 重构，`spc-` 前缀）：
1. 根容器（见 Global Constraints）+ 内部滚动区 `overflow:auto; padding:16px`。
2. 概览卡 ×4（已分析点巡检表/累计发现问题/涉及部件 `x/7 类`/高频部件）——用 `div` 卡片 + token 样式。
3. 「巡检问题统计」section：`v-for` board.items，每项：序号徽标、名称、次数徽标（点击 `openText(it)`）、占比条（宽度 `count/maxCount*100%`，色阶 high/mid/low 用 `--color-danger/--color-warning/--color-primary`）、topProblems 标签、「文本分析」按钮。
4. 文本分析弹窗：`el-dialog v-model="textVisible"`，标题含部件名与记录数；`v-for` `analysisPart.records`：卡片内左「原始文本描述」`rec.rawText` → 右「结构化信息」`el-descriptions` 或栅格（部件分类/问题类型/部位/量化指标/严重程度/处理建议/巡检人）。
5. `device` 为空时显示居中空提示「请选择设备」。

- [ ] **Step 3: 接线 DeviceView.vue**

- 顶部 `import SpotCheckServicePanel from '@/components/SpotCheckServicePanel.vue'`。
- 在 `.device-content-region` 内、其他服务面板旁新增：
```html
<SpotCheckServicePanel v-if="store.activeService === 'point'" :device="device" @close="store.setService(null)" />
```
- `DRAWER_SERVICES` 数组加入 `'point'`。
- `PLACEHOLDER_SERVICES` 删除 `point` 项。

- [ ] **Step 4: 构建 + 浏览器校验**

Run: `npm run build`；然后 dev 环境打开某设备详情 → 点「点巡检智能服务」。
Expected: 面板在服务菜单下方铺满、概览卡与统计条渲染、点击「文本分析」弹窗正常、切换设备数据变化、控制台无报错。

- [ ] **Step 5: Commit**

```bash
git add src/mock/serviceData.ts src/components/SpotCheckServicePanel.vue src/views/device/DeviceView.vue
git commit -m "feat: 点巡检智能服务面板（巡检问题统计+文本分析）"
```

---

## Task 3: 维修智能服务（设备级）

先通读参考 `DamageRepairDataService.vue`。

**Files:**
- Modify: `src/mock/serviceData.ts`
- Create: `src/components/RepairServicePanel.vue`
- Modify: `src/views/device/DeviceView.vue`

**Interfaces:**
- Consumes: Task 1 工具。
- Produces:
  - `export interface RepairRecord { id:string; date:string; damage:string; content:string; handler:string; downtime:number }`
  - `export interface RepairGroupAdvice { urgency:'高'|'中'|'低'; topDamage:string; kinds:number; summary:string; replace:string; suggestTime:string; overdue:boolean; maintain:string }`
  - `export interface RepairGroup { key:string; name:string; records:RepairRecord[]; advice:RepairGroupAdvice }`
  - `getRepairGroups(deviceId: string): RepairGroup[]`

- [ ] **Step 1: mock 生成器 `getRepairGroups`**

移植 `GROUPS`（9 组含 motor/reducer/brake 细分，`18-90`）、`ADVICE` 知识库（`93-130`）、`adviceOf`、`HANDLERS`、`urgencyOf`（`152-158`）、`buildGroupAdvice`（`220-253`）。`getRepairGroups(deviceId)` 移植 `groupData` computed（`164-187`），每组 12~22 条记录，并对每组调用 `buildGroupAdvice` 把 `advice` 内联进返回结构。日期用 Task 1 的 `dateMinusDays/addDays`；`todayStr = fmtDate(new Date())`。

- [ ] **Step 2: 创建 `RepairServicePanel.vue`**

`props:{ device }`；`const groups = computed(() => device.value ? getRepairGroups(device.value.id) : [])`。模板（`rep-` 前缀）：`v-for` group → section 卡片：
- header：部件名 + 记录数徽标 + 「重新生成建议」按钮（点击设 `generating[key]=true`，700ms 后复位，仅动效）。
- 左：`el-table` 记录（列：维修时间/损伤·故障描述/维修内容含停机与处理方），`el-pagination` 每页 6 条（用组内 `pageByGroup`）。
- 右：AI 建议区——紧迫度 `el-tag`（高红/中橙/低蓝）+ summary + 更换建议 + 建议更换时间（`overdue` 时红色）+ 维保建议；`generating` 时显示 spin 占位。
- `watch(() => device.value?.id, ...)` 重置分页与动效。

- [ ] **Step 3: 接线 DeviceView.vue**

import + `<RepairServicePanel v-if="store.activeService === 'maintain'" :device="device" @close="store.setService(null)" />`；`DRAWER_SERVICES` 加 `'maintain'`；`PLACEHOLDER_SERVICES` 删 `maintain`。

- [ ] **Step 4: 构建 + 浏览器校验**

Run: `npm run build`；浏览器点「维修智能服务」。
Expected: 9 组渲染、翻页可用、AI 建议区显示、「重新生成」有短暂动效、控制台无报错。

- [ ] **Step 5: Commit**

```bash
git add src/mock/serviceData.ts src/components/RepairServicePanel.vue src/views/device/DeviceView.vue
git commit -m "feat: 维修智能服务面板（历史维修记录+AI更换维保建议）"
```

---

## Task 4: 检验智能服务（全域）

先通读参考 `InspectionTestDataService.vue`。

**Files:**
- Modify: `src/mock/serviceData.ts`
- Create: `src/components/InspectionServicePanel.vue`
- Modify: `src/views/device/DeviceView.vue`

**Interfaces:**
- Consumes: Task 1 工具；`getDevices`、`Device`、`SceneId`（from `@/mock`）；`useSceneStore`。
- Produces:
  - `export type InspectSubType = 'inspection' | 'detection'`
  - `export type InspectStatus = 'overdue' | 'urgent' | 'warning' | 'ok'`
  - `export interface InspectReport { id:string; name:string; date:string; conclusion:string; org:string; sizeMB:number }`
  - `export interface InspectRow { no:number; deviceId:string; deviceName:string; cycleY:number; lastDate:string; nextDate:string; daysUntil:number; status:InspectStatus; advice:string; reports:InspectReport[] }`
  - `getInspectionRows(devices: {id:string;name:string}[], sub: InspectSubType): InspectRow[]`

- [ ] **Step 1: mock 生成器 `getInspectionRows`**

移植 `ORG`、`REPORT_LABEL`、`CONCLUSIONS`、`statusOf`、`adviceOf`、`buildReports`（`35-79`）与 `rows` computed 主体（`95-120`），改为纯函数 `getInspectionRows(devices, sub)`：入参设备列表（`{id,name}`）与子类型，内部 `today()` 用 `new Date()`。返回按 `daysUntil` 升序、带 `no`。

- [ ] **Step 2: 创建 `InspectionServicePanel.vue`**

`const store = useSceneStore()`；`const devices = computed(() => getDevices(store.currentScene as SceneId, 1, 9999).list)`（确认 `getDevices` 返回结构，按实际字段取列表）。`const subType = ref<InspectSubType>('inspection')`；`const rows = computed(() => getInspectionRows(devices.value.map(d=>({id:d.id,name:d.name})), subType.value))`。模板（`insp-` 前缀）：
- 顶部子页签 ×2（定期检验智能服务/检测智能服务）切换 `subType`。
- `el-table :data="rows"`：序号/设备名称（前置状态色点）/周期(年)/历史报告(链接「查看 N 份」→ 弹窗)/上次/下次(状态色)/报警提醒(`el-tag` 状态 + 剩余天数)/建议。列标题随 subType 切换检验↔检测措辞。
- 历史报告 `el-dialog`：列出 `reports`（新→旧），日期/文件名/结论/机构/大小 + 下载占位按钮。

- [ ] **Step 3: 接线 DeviceView.vue**

import + `<InspectionServicePanel v-if="store.activeService === 'inspect'" @close="store.setService(null)" />`（无需 device prop）；`DRAWER_SERVICES` 加 `'inspect'`；`PLACEHOLDER_SERVICES` 删 `inspect`。

- [ ] **Step 4: 构建 + 浏览器校验**

Run: `npm run build`；浏览器点「检验智能服务」。
Expected: 两个子页签切换、全设备到期表按剩余天数排序、状态标签配色正确、报告弹窗可开、控制台无报错。

- [ ] **Step 5: Commit**

```bash
git add src/mock/serviceData.ts src/components/InspectionServicePanel.vue src/views/device/DeviceView.vue
git commit -m "feat: 检验智能服务面板（检验/检测到期提醒+历史报告）"
```

---

## Task 5: 基础数据服务（全域，含图表）

先通读参考 `SupervisionDataService.vue` 与 `EChartCard.vue`。

**Files:**
- Modify: `src/mock/serviceData.ts`
- Create: `src/components/SupervisionServicePanel.vue`（含文件内 ECharts 子组件或内联渲染）
- Modify: `src/views/device/DeviceView.vue`

**Interfaces:**
- Consumes: Task 1 `hash`；`echarts`（`import * as echarts from 'echarts'`）。
- Produces:
  - `export type FleetStatus = '在用' | '停用' | '报废'`
  - `export interface FleetDev { code:string; type:string; year:number; level:string; manufacturer:string; status:FleetStatus }`
  - `export interface FleetSummary { total:number; inUse:number; paused:number; scrapped:number; avgAge:number }`
  - `getSupervisionFleet(): { fleet: FleetDev[]; list: FleetDev[]; summary: FleetSummary; byType: {name:string;value:number}[]; byLevel: {name:string;value:number}[]; byYear: {name:string;value:number}[] }`

- [ ] **Step 1: mock 生成器 `getSupervisionFleet`**

移植常量 `CRANE_TYPES/WORK_LEVELS/MANUFACTURERS/STATUS_POOL/FLEET_SIZE=60`、`fleet` 生成（`37-50`）、`summary`、`countByKey`/`orderedCount` 聚合（`63-88`）。返回 `fleet`、`list`（投用倒序）、`summary`、以及三个图表用聚合数组 `byType/byLevel/byYear`。`CURRENT_YEAR = new Date().getFullYear()`。

- [ ] **Step 2: 创建 `SupervisionServicePanel.vue`**

`const data = computed(() => getSupervisionFleet())`。模板（`sup-` 前缀）：概览卡 ×5（在册/在用/停用/报废/平均役龄）；3 个图表卡（类型饼、级别柱、年份柱）；在册设备列表 `el-table`（序号/编号/类型/投入时间/工作级别/制造商/使用状态 tag）。
图表实现：在本文件内定义一个轻量子组件（`defineComponent` 或独立 `<script>` 中的 `SupChart`）持有 `echarts.init` + `ResizeObserver`，`onBeforeUnmount` dispose，`option` 变化时 `setOption(opt,true)`——等价于参考 `EChartCard`。ECharts option 移植 `typeOption/levelOption/yearOption`（`104-140`），配色用参考 `PALETTE`。

- [ ] **Step 3: 接线 DeviceView.vue**

import + `<SupervisionServicePanel v-if="store.activeService === 'basicdata'" @close="store.setService(null)" />`；`DRAWER_SERVICES` 加 `'basicdata'`；`PLACEHOLDER_SERVICES` 删 `basicdata`。

- [ ] **Step 4: 构建 + 浏览器校验**

Run: `npm run build`；浏览器点「基础数据服务」。
Expected: 5 张概览卡、3 张 ECharts 正常渲染并随窗口自适应、在册列表 60 台、控制台无报错。切走服务再切回图表仍正常（dispose/init 正确）。

- [ ] **Step 5: Commit**

```bash
git add src/mock/serviceData.ts src/components/SupervisionServicePanel.vue src/views/device/DeviceView.vue
git commit -m "feat: 基础数据服务面板（在册设备宏观统计+图表+列表）"
```

---

## Task 6: 供给智能服务（全域）

先通读参考 `ManufacturingSupplyDataService.vue`。

**Files:**
- Modify: `src/mock/serviceData.ts`
- Create: `src/components/SupplyServicePanel.vue`
- Modify: `src/views/device/DeviceView.vue`

**Interfaces:**
- Consumes: Task 1 `hash/pad`。
- Produces:
  - `export interface SupplyDoc { id:string; name:string; kind:string; format:string; date:string; sizeMB:number }`
  - `export interface SupplyReg { id:string; code:string; name:string; type:string; manufacturer:string; model:string; factoryNo:string; madeDate:string; commissionDate:string; tonnage:number; span:number; user:string; docs:SupplyDoc[] }`
  - `getSupplyRegistry(): SupplyReg[]`

- [ ] **Step 1: mock 生成器 `getSupplyRegistry`**

移植 `TYPES/MANUFACTURERS/TONNAGES/SPANS/DOC_DEFS/USERS/REG_SIZE=24` 与 `registry` 生成（`59-100`），改为纯函数 `getSupplyRegistry()` 返回排序后的 24 条台账。

- [ ] **Step 2: 创建 `SupplyServicePanel.vue`**

`const registry = getSupplyRegistry()`（模块内确定性，直接常量即可）；`const query = ref('')`；`results` computed 按编号/名称/制造商/型号/类型/使用单位过滤。模板（`sply-` 前缀）：检索栏（`el-input` clearable + 结果计数）；结果 `el-table`（编号/名称/类型/制造商/规格型号/出厂日期/技术资料链接「查看 N 份」→ 详情弹窗；行点击也开详情）；空结果提示。详情 `el-dialog`：制造信息栅格（制造商/型号/类型/额定起重量/跨度/出厂编号/出厂日期/投用日期/使用单位）+ 随附技术资料列表（kind/format/date/size + 下载占位）。

- [ ] **Step 3: 接线 DeviceView.vue**

import + `<SupplyServicePanel v-if="store.activeService === 'supply'" @close="store.setService(null)" />`；`DRAWER_SERVICES` 加 `'supply'`；`PLACEHOLDER_SERVICES` 删 `supply`（此时 5 项全部移除，若 `PLACEHOLDER_SERVICES` 变空且不再被其他 key 使用，保留空对象即可，占位分支 `v-else-if="placeholderServiceMeta"` 自然不命中）。

- [ ] **Step 4: 构建 + 浏览器校验**

Run: `npm run build`；浏览器点「供给智能服务」。
Expected: 检索过滤生效、结果表 24 条、详情弹窗含制造信息与技术资料、控制台无报错。

- [ ] **Step 5: Commit**

```bash
git add src/mock/serviceData.ts src/components/SupplyServicePanel.vue src/views/device/DeviceView.vue
git commit -m "feat: 供给智能服务面板（制造台账检索+制造信息详情）"
```

---

## Task 7: 全量回归校验

**Files:** 无新增改动（如发现问题在对应文件修复）。

- [ ] **Step 1: 构建**

Run: `npm run build`
Expected: 通过，无类型错误、无未用导入告警。

- [ ] **Step 2: 逐服务浏览器回归**

依次打开 5 个服务，核对：均位于服务菜单下方不遮挡菜单；无下弹动画；切换设备（设备级两项）与切换场景（全域三项）数据随之更新；弹窗/翻页/检索/图表均可用；控制台无报错；`PLACEHOLDER_SERVICES` 中五项确无残留（点击不再出现「功能开发中」占位）。

- [ ] **Step 3: 一致性检查**

确认 5 个面板视觉一致（根容器、间距、卡片、表格风格统一），与既有服务面板（健康评估等）观感协调。

---

## Self-Review

- **Spec coverage:** spec 五个服务 → Task 2~6 逐一对应；共享 mock/接线/YAGNI（点巡检不含危险源、全域保持、直接 mock、无 Tailwind）均在 Global Constraints 与各任务体现；验证方式（build + 浏览器）见各任务 Step 4 与 Task 7。
- **Placeholder scan:** 无 TBD/TODO；每任务给出确切文件、函数签名、参考行号与验证命令。因是大型 UI 逐组件移植且参考源可读，组件内部逐行 markup 未全量粘贴——改为「精确指向参考行号 + 目标签名/结构/前缀/token 约束」，属该规模移植的合理取舍。
- **Type consistency:** 各任务 `Produces` 的类型名与生成函数签名统一（`getSpotCheckBoard`/`getRepairGroups`/`getInspectionRows`/`getSupervisionFleet`/`getSupplyRegistry`），DeviceView 接线的 key 与 ServiceMenu 一致（point/maintain/inspect/basicdata/supply）。

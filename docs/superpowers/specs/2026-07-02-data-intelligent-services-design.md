# 五个数据智能服务面板 · 设计方案

日期：2026-07-02
状态：已确认，待实现

> **范围界定：纯前端演示（frontend-only demo）。** 全部数据为前端确定性 mock，无任何后端/网络调用；
> 下载、导出、重新生成等交互均为演示占位，不产生真实副作用。

## 背景

设备详情页服务菜单中的「数据智能服务」组当前为占位（`PLACEHOLDER_SERVICES`）。参考项目
`/Users/lucien/Programs/Intelligent_data_agent_LE`（`emds-v2`）的「数据 AI 智能服务助手」已实现
五个基于不同生命周期数据的智能服务，本方案将其移植并按本项目风格重构为可用面板。

参考数据类型 → 本项目服务（`store.activeService` key）：

| 数据类型 | 服务名 | key | 参考组件 |
|---|---|---|---|
| 日常点巡检数据 | 点巡检智能服务 | `point` | `SpotCheckDataService.vue` |
| 损伤/故障维修数据 | 维修智能服务 | `maintain` | `DamageRepairDataService.vue` |
| 检验检测数据 | 检验智能服务 | `inspect` | `InspectionTestDataService.vue` |
| 设备监管基础数据 | 基础数据服务 | `basicdata` | `SupervisionDataService.vue` |
| 设备制造供给数据 | 供给智能服务 | `supply` | `ManufacturingSupplyDataService.vue` |

## 已确认的关键决策

1. **点巡检范围**：仅实现「巡检问题统计 + 文本分析」（基于点巡检数据）。**不复刻**参考中的
   「问题处理·危险源排查分析」——本项目已有独立的「问题处理」服务（`IssueHandlingDrawer`），避免重复。
2. **全域服务范围**：检验 / 基础数据 / 供给保持「全域」视角（面向多台设备 / 在册台账），
   与所选单台设备无关。
3. **数据来源**：直接按设备 ID 种子确定性生成 mock（复用参考 hash 算法），**不做上传门控、不做空状态**。
4. **技术栈**：参考用 Tailwind + lucide-vue-next；本项目用 Vue 3 `<script setup>` + Element Plus +
   CSS 自定义属性 token。5 个面板必须**用本项目风格重写**，不引入 Tailwind / lucide。

## 架构与集成

### 组件

新建 5 个面板组件于 `src/components/`，与现有服务面板（`HazardInspectionDrawer` 等）同构：

- 根容器 `position: absolute; inset: 0; z-index: 5; background: #f8fafc; display:flex; flex-direction:column`
  （与上一次改造后的服务面板一致，铺满内容区、位于服务菜单下方、无下弹动画）。
- 每个组件 prefixed scoped class（如 `spc-` / `rep-` / `insp-` / `sup-` / `sply-`）。
- 设备级面板通过 prop `:device="device"` 接收当前设备；全域面板通过 `useSceneStore()` 读取
  `currentScene` 并调用 `getDevices`（或自带合成台账）。
- 统一 `@close` 事件（部分面板顶栏可无关闭按钮，关闭由服务菜单切换驱动，保持与现有一致即可）。

组件清单：
- `SpotCheckServicePanel.vue`（`point`，设备级）
- `RepairServicePanel.vue`（`maintain`，设备级）
- `InspectionServicePanel.vue`（`inspect`，全域）
- `SupervisionServicePanel.vue`（`basicdata`，全域）
- `SupplyServicePanel.vue`（`supply`，全域）

### DeviceView.vue 接线

- 从 `PLACEHOLDER_SERVICES` 中移除 `point / maintain / inspect / basicdata / supply` 五项
  （该常量仅剩知识库等仍占位的服务，若清空则整体移除占位分支）。
- 将五个 key 加入 `DRAWER_SERVICES`，使占位空提示不再渲染于面板之下。
- 在内容区（`.device-content-region`）内新增 5 个 `v-if="store.activeService === '<key>'"` 渲染对应组件。

### Mock 数据层

新建 `src/mock/serviceData.ts`，集中放：

- `PART_CATEGORIES`：部件划分常量（复刻参考 7 类；维修服务另需将「机构」细分出电机/减速机/制动器共 9 组）。
- 确定性工具：`hash(n)`、`seedOf(id, salt)`、日期工具（`pad` / `fmtDate` / `dateMinusDays` / `addDays`）。
- 各服务的类型定义与生成函数：
  - `getSpotCheckBoard(deviceId)` → 概览统计 + 各部件问题统计 + 每条文本记录（原始文本 + 结构化字段）。
  - `getRepairGroups(deviceId)` → 9 组，每组 12~22 条历史维修记录 + 该组 AI 更换/维保建议。
  - `getInspectionRows(devices, subType)` → 每设备一行的到期提醒 + 历史报告列表。
  - `getSupervisionFleet()` → 合成 60 台在册设备 + 聚合统计。
  - `getSupplyRegistry()` → 合成 24 条制造台账 + 每条随附技术资料。
- 从 `src/mock/index.ts` re-export 上述公开函数与类型。

损伤/建议知识库、报警口径、检验周期等业务文案与参考对齐。

## 各面板内容规格

### 1. 点巡检智能服务（设备级）
- 概览统计卡 ×4：已分析点巡检表(份)、累计发现问题(项)、涉及部件(x/7 类)、高频部件。
- 「巡检问题统计」：按部件发现问题次数降序，每项含序号徽标、名称、次数徽标、占比条（色阶
  高/中/低）、Top 问题标签、「文本分析」入口。
- 文本分析弹窗（`el-dialog`）：列出该部件每条记录，左「原始巡检文本描述」→ 右「结构化信息」
  （部件分类/问题类型/部位/量化指标/严重程度/处理建议/巡检人）。
- **不含**危险源排查分析。

### 2. 维修智能服务（设备级）
- 按 9 个部件分组的卡片 section。每组顶栏：名称 + 记录数徽标 +「重新生成建议」按钮（短暂 spin 动效，
  结果不变）。
- 左侧：历史维修记录表（`el-table`），字段：维修时间 / 损伤·故障描述 / 维修内容（含停机时长、处理方）；
  `el-pagination` 每页 6 条。
- 右侧：AI 更换/维保建议 —— 紧迫度标签（高/中/低）+ 摘要 + 更换建议 + 建议更换时间（逾期标红）+ 维保建议。

### 3. 检验智能服务（全域）
- 顶部子页签 ×2：定期检验智能服务 / 检测智能服务。
- 到期提醒表（`el-table`），设备源 = `getDevices(currentScene)` 全量；列：序号 / 设备名称（状态点）/
  检验(检测)周期 / 历史报告(查看 N 份) / 上次日期 / 下次日期 / 报警提醒（已逾期/即将到期/临近到期/正常）/ 建议。
- 历史报告弹窗（`el-dialog`）：历次报告（新→旧），含结论、机构、大小、下载占位按钮。

### 4. 基础数据服务（全域）
- 概览卡 ×5：在册 / 在用 / 停用 / 报废 / 平均役龄。
- ECharts ×3：按起重机类型（饼）、按工作级别（柱）、按投用年份（柱）。用与 `DeviceView` 相同的
  直接 `echarts.init` 方式；封装一个内部小图表子组件（含 `ResizeObserver`、`onBeforeUnmount` dispose）。
- 在册设备列表（`el-table`）：序号 / 编号 / 类型 / 投入时间 / 工作级别 / 制造商 / 使用状态。
- 自带合成 60 台机队（复刻参考确定性生成，与场景设备解耦）。

### 5. 供给智能服务（全域）
- 检索栏（`el-input`，可清空）：按编号/名称/制造商/型号检索。
- 结果表（`el-table`）：编号 / 名称 / 类型 / 制造商 / 规格型号 / 出厂日期 / 技术资料(查看 N 份)；空结果提示。
- 详情弹窗（`el-dialog`）：制造信息栅格（制造商/型号/类型/额定起重量/跨度/出厂编号/出厂日期/投用日期/使用单位）
  + 随附技术资料列表（图纸/合格证/说明书/型式试验/监检证书等 + 下载占位）。
- 自带合成 24 条台账（复刻参考确定性生成）。

## 不做（YAGNI）

- 不做上传/采集车间、不做数据空状态门控。
- 点巡检不复刻危险源排查分析（已有「问题处理」服务）。
- 不引入 Tailwind / lucide-vue-next。
- 下载/导出为演示占位，不触发真实文件下载。

## 验证

- `npm run build`（`vue-tsc --noEmit && vite build`）类型检查通过。
- 浏览器逐个打开 5 个服务：面板位于服务菜单下方不遮挡、内容渲染正确、切换设备/场景数据随之更新、
  弹窗与翻页可用、控制台无报错。

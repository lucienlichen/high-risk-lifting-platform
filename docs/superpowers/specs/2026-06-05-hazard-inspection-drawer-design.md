# 设备排查（隐患排查）弹出页设计方案

- 日期：2026-06-05
- 范围：纯前端原型，参照 `/Users/lucien/Programs/Intelligent_data_agent_LE` 数据服务AI助手 → 日常点巡检 → 弹出的「设备排查页」（`HazardCheckService` → `HazardHistoryPanel`），实现当前项目「隐患排查」服务弹出页。确定性 mock，不接后端。

## 目标

将「隐患排查」服务从通用文本面板升级为与 `RiskMonitoringDrawer` / `CrackMonitoringDrawer` / `HealthAssessmentDrawer` 一致的全幅抽屉，复现参考项目「设备排查」两栏布局。

## 设计决策

- 形式：全幅抽屉（`activeService === 'hazard'` 打开）。
- 历史记录：确定性生成 1–2 条/设备，详情/统计/整改建议均有数据。
- 操作按钮（生成表单 / 上传 / 下载模版）：视觉占位，不接真实上传下载。

## 新增文件

### `src/mock/hazardCheck.ts`
- `CHECK_ITEMS`：移植参考项目 64 项隐患排查清单，每项 `{ id, category, project, content }`。
  - 5 项「重大事故隐患」（id ≤ 5）+ 59 项「一般事故隐患」（按 `project` 分组）。
- `getDeviceHazardRecords(device)`：用与 `mock/index.ts` 一致的 `mkRng`（基于 `device.id` 字符和种子）确定性生成 1–2 条记录：
  - 字段：`id / year / date / inspector / results(各项 有/无 + 备注) / majorCount / normalCount / aiSuggestion`。
  - 概率：重大隐患极低概率命中「有」，一般隐患低概率命中「有」；同一设备结果稳定。
- 分组工具：`majorItems`（id≤5）、`generalGroups`（一般按 `project` 分组）。
- 整改建议：依据 major/normal 数量套用固定话术（移植参考项目 `generateAISuggestion`）。

### `src/components/HazardInspectionDrawer.vue`
全幅抽屉外壳与 `RiskMonitoringDrawer` 一致。标题「设备排查」（红色盾形警示图标）。两栏：

- **左栏（约 300px）**：
  - 顶部按钮「生成排查表单」「上传并保存」（视觉占位）。
  - 「历史记录」标题 + 数量徽标。
  - 按年度分组的记录列表，每条：日期 + 检查人 + 隐患概览标签（重大N 红 / 一般N 橙 / 无 绿）；点击切换右栏，选中态高亮。
- **右栏**：
  - 未选记录 → 空白排查表：标题「{设备名} - 起重机械隐患排查表」；使用单位（`group`）/设备代码（`code`）/排查人员___/排查日期___；「下载模版」按钮（视觉占位）；「一、重大事故隐患」编号清单（有/无 勾选框）；「二、一般事故隐患」按项目分组清单。
  - 选中记录 → 统计卡（总项数 / 重大事故隐患 / 一般事故隐患）+ 可折叠「重大事故隐患」「一般事故隐患（含项目子组）」，每项：内容 + 有/无 结果（颜色编码）+ 备注；底部「整改建议」框。

## 改动文件

### `src/views/device/DeviceView.vue`
- 挂载 `<HazardInspectionDrawer v-if="store.activeService === 'hazard'" :device="device" @close="store.setService(null)" />`。
- 将 `hazard` 从通用 `service-content-panel` 渲染条件中排除。

## 色彩映射（沿用 `src/styles/main.css` CSS 变量）

| 语义 | 颜色 |
| --- | --- |
| 重大事故隐患 | `--color-danger` / `--color-danger-bg` |
| 一般事故隐患 | `--color-warning` / `--color-warning-bg` |
| 无隐患 / 合格 | `--color-success` / `--color-success-bg` |

## 不做（YAGNI）

不接后端、不真实上传/下载、不做整改流程编辑、不做多设备汇总概览。

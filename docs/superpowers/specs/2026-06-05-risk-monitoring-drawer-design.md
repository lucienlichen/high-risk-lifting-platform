# 风险监测弹出页设计方案

- 日期：2026-06-05
- 范围：纯前端原型，参照 `/Users/lucien/Programs/Intelligent_data_agent_LE` 的「风险定量监测数据」实现当前项目「风险监测」服务的弹出页。确定性 mock，不接后端。

## 目标

将「风险监测」服务从通用文本面板升级为与 `CrackMonitoringDrawer` / `HealthAssessmentDrawer` 一致的全幅抽屉弹出页，展示当前设备的风险定量评估。

## 设计决策

- 内容范围：顶部状态栏 + 15 项风险评估矩阵 + 综合评分/风险等级汇总。
- 仅当前设备，不做多设备排序表。
- 数据确定性生成（基于 `device.id` 种子），不随机刷新、不轮询。

## 新增文件

### `src/mock/riskAssessment.ts`
- 移植参考项目 `lib/riskData.ts` 的 15 项指标 schema：每项含 `id`、`name`、`options`（4 档，每档 `grade` + `description`）。
- `getDeviceRiskAssessment(device)`：用与 `mock/index.ts` 一致的 `mkRng` 确定性种子（基于 `device.id` 字符和）为每项选定一档，返回：
  - `indicators`：每项命中的 `grade` + `description`
  - `comprehensiveScore`：15 项 grade 求和（15–60）
  - `riskLevel`：≤25 低风险 / ≤35 一般风险 / ≤45 较大风险 / >45 重大风险
- 不导出随机函数；纯确定性。

### `src/components/RiskMonitoringDrawer.vue`
抽屉外壳与 `CrackMonitoringDrawer` 一致（顶栏 + 关闭按钮）。内容三块：

1. **顶部状态栏**：
   - 所在位置：`device.location`
   - 工作状态：`device.status` → 运行中 / 停机 / 维保中 / 待机，带状态色点
   - 实时振动：确定性数值 + `mm/s`
   - 右侧：「数据更新：刚刚」
2. **风险评估指标矩阵**：
   - 表头：「风险评估指标」+「共 15 项」徽标 + 右侧 1–4 级色点图例
   - 矩阵列：`序号 / 评估指标 / 1级 / 2级 / 3级 / 4级`
   - 每个等级单元格显示该档描述；命中档高亮（描边 + 底色 + 右上角圆点）
3. **底部汇总条**：综合评分 + 风险等级徽标（色彩编码）

## 改动文件

### `src/views/device/DeviceView.vue`
- 挂载 `<RiskMonitoringDrawer v-if="store.activeService === 'risk'" :device="device" @close="store.setService(null)" />`。
- 将 `risk` 从通用 `service-content-panel` 渲染条件中排除（与 remote/health/crack 并列），避免重复渲染。

## 色彩映射（沿用 `src/styles/main.css` CSS 变量）

| 等级 | 主色 | 底色 |
| --- | --- | --- |
| 1级 | `--color-success` | `--color-success-bg` |
| 2级 | `--color-info` | `--color-info-bg` |
| 3级 | `--color-warning` | `--color-warning-bg` |
| 4级 | `--color-danger` | `--color-danger-bg` |

风险等级徽标：低风险→success，一般风险→info，较大风险→warning，重大风险→danger。

## 不做（YAGNI）

不接后端、不做多设备风险排序表、不做「数据智能采集」流水线/日历/AI 处理面板、振动值不轮询。

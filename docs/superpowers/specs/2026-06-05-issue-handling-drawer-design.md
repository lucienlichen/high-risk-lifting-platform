# 问题处理助手（危险源排查）弹出页设计方案

- 日期：2026-06-05
- 范围：纯前端原型，参照 `/Users/lucien/Programs/RuoYi-xiaozhi-master` 的「问题处理AI助手」页面（`clda-ui/src/views/intellect/hazard-source/index.vue`，service `typical_issue_ai`），实现当前项目「问题处理」服务弹出页。代表性 mock，不接后端。

## 目标

将「问题处理」服务从通用文本面板升级为与其它服务一致的全幅抽屉，复现参考项目危险源排查页：顶部三大类 Tab → 左侧子分类树 → 右侧危险源清单 → AI 分步分析。

## 设计决策

- 形式：全幅抽屉（`activeService === 'issue'` 打开）。
- 数据：代表性子集（完整分类树 + 部分叶分类真实条目 + 原因/事件字典），其余叶分类空清单。
- 保留 AI 分步揭示动画（纯 setTimeout）。

## 新增文件

### `src/mock/hazardSource.ts`
- **分类树**（移植自 `tb_hazard_category`）：3 大类（设备/人员/环境危险源）+ 子分类 + 叶分类，含 `id / parentId / name / code`，组织成 `getCategoryTree()` 返回的两级（顶级 → children → children）。
- **危险源条目**（移植自 `tb_hazard_item`）：为代表性叶分类（主要受力结构 111、钢丝绳 126、制动器 135、起重机司机 21、作业环境 32）提供真实条目 `{ id, categoryId, itemNo, description, causeCodes[], eventCodes[] }`，其余叶分类空清单。
- **原因字典 `CAUSE_DICT`**（移植自 `tb_hazard_cause_dict`）：`code → { stage, description }`，阶段含 设计阶段 / 制造安装阶段 / 使用阶段。
- **事件字典 `EVENT_DICT`**（移植自 `tb_hazard_event_dict`）：`code → { name, icon }`，6a–6q，`icon` 映射为 Element Plus 图标名。
- 查询函数：`getCategoryTree()`、`getItems(categoryId)`、`getCauses(codes)`（含 stage 分组友好结构）、`getEvents(codes)`。纯静态查表。

### `src/components/IssueHandlingDrawer.vue`
全幅抽屉外壳与 `RiskMonitoringDrawer` 一致。标题「问题处理」（ChatLineSquare 图标）。结构：

- **顶部 Tab**：三大类切换；切换重置选中子类与分析态。
- **左侧侧栏（约 240px）**：子分类导航树，`code` + 名称；有子项的可展开/折叠（ArrowRight/ArrowDown），叶节点点击加载清单，选中高亮。
- **右侧主区**：
  - 未选叶分类 → 空状态「请从左侧选择危险源分类进行排查」。
  - 选中叶分类（无分析目标）→ 危险源清单：标题「{分类名} — 危险源清单」+ 条目数徽标；条目卡片 `{itemNo}) 描述 →`，点击进入分析；空数据提示「暂无危险源数据」。
  - 选中条目 → AI 分步分析：「返回列表」；加载条「正在分析危险源…」→「分析完成」(CircleCheck)；
    - ① 危险源描述（Search 图标）
    - ② 产生原因（WarningFilled）：按 stage 分组，stage 标签 + 项数 + 各 `code` + 描述；无原因时提示
    - ③ 可能导致的危险事件（Bell）：事件标签（图标 + 名称）
  - 分步通过 `analysisStep` + setTimeout 渐次揭示，带过渡动画。

## 改动文件

### `src/views/device/DeviceView.vue`
- 挂载 `<IssueHandlingDrawer v-if="store.activeService === 'issue'" :device="device" @close="store.setService(null)" />`。
- 将 `issue` 从通用 `service-content-panel` 渲染条件中排除。

## 色彩映射（沿用 `src/styles/main.css` CSS 变量）

| 语义 | 颜色 |
| --- | --- |
| 阶段/强调/编号 | `--color-warning` / `--color-warning-bg` |
| 危险事件标签 | `--color-danger` / `--color-danger-bg` |
| 分析完成/成功 | `--color-success` / `--color-success-bg` |
| 主操作/选中 | `--color-primary` / `--color-primary-light` |

## 不做（YAGNI）

不接后端、不做管理端增删改、不移植全量危险源台账、设备入参仅用于占位不驱动数据。

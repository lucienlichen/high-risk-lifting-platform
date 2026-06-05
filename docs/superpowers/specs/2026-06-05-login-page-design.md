# 登录页设计方案

- 日期：2026-06-05
- 范围：纯前端原型，仅完成页面与基础跳转交互，不接后端、不填非必要 mock 数据

## 目标

为「高风险起重装备智能运维与事故防控云服务平台」增加一个与现有整体风格融合的登录页，并加入登录态守卫与退出登录。

## 设计决策

- 布局：居中卡片，满屏深蓝渐变背景。
- 登录交互：任意非空账号/密码即可登录，不校验具体值。
- 鉴权：加入路由守卫与退出登录，登录态持久化到 `localStorage`。

## 改动清单

| 文件 | 改动 |
| --- | --- |
| `src/views/login/LoginView.vue` | 新增登录页（居中卡片 + 深蓝渐变背景） |
| `src/stores/auth.ts` | 新增 Pinia store：`isLoggedIn`、`username`，持久化到 `localStorage` |
| `src/router/index.ts` | 新增独立全屏 `/login` 路由（不在 MainLayout 内）+ 全局 `beforeEach` 守卫 |
| `src/layouts/MainLayout.vue` | 顶栏用户区加下拉「退出登录」 |

## 登录页布局（居中卡片）

- 满屏背景：`linear-gradient(135deg, var(--color-header-bg) 0%, var(--color-header-bg2) 100%)`，叠加淡蓝径向光晕与细网格点缀，纯 CSS 实现，无图片资源。
- 居中白色卡片，使用 `--radius-lg`、`--color-card-shadow`：
  - 顶部：复用 MainLayout 的起重机 SVG logo 标记 + 平台标题。
  - 表单：`el-form` + `el-input`（账号 / 密码，密码可见切换），账号图标 `User`，密码图标 `Lock`。
  - 主按钮：`el-button type="primary"` 全宽「登 录」，带短暂 loading。
  - 底部：版权小字。
- 全部颜色使用 `src/styles/main.css` 中的 CSS 变量，不硬编码 hex。

## 交互流

- 账号/密码任一为空 → `el-form` 校验提示，不跳转。
- 均非空 → 写入 auth store（`isLoggedIn=true`、`username`）→ `router.push('/scene/metallurgy')`。
- 守卫：未登录访问任意内页 → 重定向 `/login`；已登录访问 `/login` → 重定向首页。
- 顶栏「退出登录」→ 清 store 与 `localStorage` → 回 `/login`。

## 鉴权状态（auth store）

- state：`isLoggedIn: boolean`、`username: string`。
- 初始化时从 `localStorage` 读取。
- actions：`login(username)`、`logout()`，均同步写/清 `localStorage`。

## 不做（YAGNI）

不接后端、不存 token、不做记住密码 / 验证码 / 找回密码、不生成用户 mock 数据。

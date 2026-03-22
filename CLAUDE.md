# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

高风险起重装备智能运维与事故防控云服务平台 — A frontend demo prototype for an industrial IoT lifting equipment intelligent operation & accident prevention cloud platform. **All work is frontend-only.**

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Type-check + build (vue-tsc --noEmit && vite build)
npm run preview   # Preview production build
```

No test runner is configured.

## Stack

- Vue 3 (Composition API + `<script setup>`)
- TypeScript
- Vite
- Vue Router 4
- Pinia
- Element Plus (Chinese locale, all icons registered globally)
- ECharts 5
- Path alias: `@` → `src/`

## Architecture

### Routing & Layout

All routes are children of `MainLayout` (the persistent shell). The layout is a fixed 3-tier structure:
- **Top bar** (60px): branding, clock, user controls
- **Left scene nav** (108px): switches between the 4 operational scenes
- **Content area**: `<router-view />` + bottom `<ServiceMenu />`

Routes: `/home` → HomeView, `/scene/:id` → SceneView, `/device/:id` → DeviceView.

### State (Pinia — `src/stores/scene.ts`)

Single store tracking `currentScene`, `currentDeviceId`, and `activeService`. Scene navigation updates `currentScene`; clicking a device sets `currentDeviceId`; the ServiceMenu reads both to enable/disable service buttons and sets `activeService`.

### Data Flow

All data comes from `src/mock/index.ts` — deterministic pseudo-random generation keyed on device IDs, no network calls. Mock functions: `getDevices`, `getSceneStats`, `getDeviceById`, `getDeviceRunData`, `getDeviceAlarms`, `getTopRiskDevices`, `getRecentAlarmDevices`.

### Design System

All design tokens are CSS custom properties defined in `src/styles/main.css`. Key tokens:
- Header: `--color-header-bg: #0a1f3c`
- Primary: `--color-primary: #1677ff`
- Status colors: `--color-success/warning/danger/info`
- Layout: `--header-height: 60px`, `--nav-width: 108px`

Use CSS variables for all colors and spacing — do not hardcode hex values in components.

### 4 Operational Scenes

`metallurgy` (冶金), `port` (港口), `construction` (建筑工地), `shipbuilding` (船舶制造) — each has its own device types and mock data pool.

### Service Panel

`ServiceMenu` (bottom bar) has 7 services in 2 groups: **智能运维服务** (remote, health, crack, fault) and **事故防控服务** (risk, hazard, issue). Services are disabled until a device is selected. When active, `DeviceView` renders a service-specific panel alongside device detail tabs.

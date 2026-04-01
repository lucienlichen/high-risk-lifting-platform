<template>
  <div v-if="monitoringData" class="dmw-root">
    <div v-if="!props.sectionOnly && !props.hideOpList" class="dmw-refresh-bar">
      <span class="dmw-refresh-label">监测数据刷新</span>
      <span class="dmw-refresh-time">{{ monitoringData.lastRefresh }}</span>
    </div>

    <div :class="['dmw-main-split', { 'dmw-main-split--section-only': props.sectionOnly || props.hideOpList }]">
      <!-- ── 左侧：作业列表（sectionOnly / hideOpList 模式下隐藏） ── -->
      <div v-if="!props.sectionOnly && !props.hideOpList" class="dmw-op-list-pane">
        <div class="dmw-op-list-header">
          <el-date-picker
            v-model="opDate"
            type="date"
            size="small"
            :clearable="false"
            placeholder="选择日期"
          />
          <span class="dmw-op-list-count">{{ operationList.length }} 次吊重</span>
        </div>
        <div class="dmw-op-list-body">
          <div
            class="dmw-op-row"
            :class="{ 'dmw-op-row--active': selectedOpId === 'all' }"
            @click="selectedOpId = 'all'"
          >
            <span class="dmw-op-row-seq">—</span>
            <div class="dmw-op-row-mid">
              <span class="dmw-op-row-load">全天连续</span>
              <span class="dmw-op-row-dur">24h 完整趋势</span>
            </div>
          </div>
          <div
            v-for="(op, idx) in operationList"
            :key="op.id"
            class="dmw-op-row"
            :class="{ 'dmw-op-row--active': selectedOpId === op.id }"
            :title="`${String(op.startHour).padStart(2,'0')}:00 – ${String(op.endHour).padStart(2,'0')}:${String(op.endMinute).padStart(2,'0')}`"
            @click="selectedOpId = op.id"
          >
            <span class="dmw-op-row-seq">{{ idx + 1 }}</span>
            <div class="dmw-op-row-mid">
              <span class="dmw-op-row-load">{{ op.load }}</span>
              <span class="dmw-op-row-dur">{{ op.duration }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 右侧：监测数据 ── -->
      <div class="dmw-right-pane">
        <nav v-if="!props.sectionOnly" class="remote-section-tabs" aria-label="监测分类">
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            :title="item.label"
            :class="['remote-section-tab', { active: activeSection === item.id }]"
            @click="activeSection = item.id"
          >
            {{ item.tabLabel }}
          </button>
        </nav>

    <!-- ── 电控系统监控（GB/T 28264-2017 起重机械安全监控管理系统 14 项参数） ── -->
    <div v-if="activeSection === 'electric' && runningStateData" class="dmw-rs-board">

      <div class="dmw-rs-body">
        <div class="section-card dmw-rs-card dmw-rs-card--wide">
          <div class="section-card-header">
            <span class="section-card-title">参数监控</span>
            <span class="dmw-rs-card-sub">GB/T 28264—2017</span>
          </div>
          <div class="section-card-body dmw-rs-params-grid dmw-rs-params-grid--dense">
            <div :class="['dmw-rs-param', runningStateData.momentPct > 100 ? 'dmw-rs-param--danger' : runningStateData.momentPct > 85 ? 'dmw-rs-param--warning' : '']">
              <span class="dmw-rs-param-label">起重量</span>
              <span class="dmw-rs-param-value">{{ runningStateData.liftWeight }}<em> t</em></span>
              <span class="dmw-rs-param-sub">额定 {{ runningStateData.ratedWeight }} t</span>
            </div>
            <div :class="['dmw-rs-param', runningStateData.momentPct > 100 ? 'dmw-rs-param--danger' : runningStateData.momentPct > 85 ? 'dmw-rs-param--warning' : '']">
              <span class="dmw-rs-param-label">起重力矩</span>
              <span class="dmw-rs-param-value">{{ runningStateData.momentPct }}<em> %</em></span>
              <span class="dmw-rs-param-sub">相对额定力矩</span>
            </div>
            <div class="dmw-rs-param">
              <span class="dmw-rs-param-label">起升高度 / 下降深度</span>
              <span class="dmw-rs-param-value">{{ runningStateData.liftHeight }}<em> m</em><span class="dmw-rs-param-slash">/</span>{{ runningStateData.lowerDepth }}<em> m</em></span>
              <span class="dmw-rs-param-sub">额定起升 {{ runningStateData.ratedHeight }} m</span>
            </div>
            <div class="dmw-rs-param">
              <span class="dmw-rs-param-label">运行行程</span>
              <span class="dmw-rs-param-value">大{{ runningStateData.bridgePos }}<em>m</em> · 小{{ runningStateData.trolleyPos }}<em>m</em></span>
              <span class="dmw-rs-param-sub">行程 {{ runningStateData.bridgeTravel }} / {{ runningStateData.trolleyTravel }} m</span>
            </div>
            <div :class="['dmw-rs-param', runningStateData.amplitudeApplicable ? (runningStateData.amplitude > runningStateData.amplitudeLimit ? 'dmw-rs-param--danger' : '') : 'dmw-rs-param--na']">
              <span class="dmw-rs-param-label">幅度</span>
              <template v-if="runningStateData.amplitudeApplicable">
                <span class="dmw-rs-param-value">{{ runningStateData.amplitude }}<em> m</em></span>
                <span class="dmw-rs-param-sub">限值 {{ runningStateData.amplitudeLimit }} m</span>
              </template>
              <template v-else>
                <span class="dmw-rs-param-value dmw-rs-param-na">—</span>
                <span class="dmw-rs-param-sub">无幅变机构</span>
              </template>
            </div>
            <div :class="['dmw-rs-param', runningStateData.bridgeSkew > runningStateData.skewLimit ? 'dmw-rs-param--danger' : runningStateData.bridgeSkew > runningStateData.skewLimit * 0.7 ? 'dmw-rs-param--warning' : '']">
              <span class="dmw-rs-param-label">大车运行偏斜</span>
              <span class="dmw-rs-param-value">{{ runningStateData.bridgeSkew }}<em> mm</em></span>
              <span class="dmw-rs-param-sub">限值 {{ runningStateData.skewLimit }} mm</span>
            </div>
            <div :class="['dmw-rs-param', runningStateData.windSpeed > runningStateData.windLimit ? 'dmw-rs-param--danger' : runningStateData.windSpeed > runningStateData.windLimit * 0.75 ? 'dmw-rs-param--warning' : '']">
              <span class="dmw-rs-param-label">风速</span>
              <span class="dmw-rs-param-value">{{ runningStateData.windSpeed }}<em> m/s</em></span>
              <span class="dmw-rs-param-sub">限值 {{ runningStateData.windLimit }} m/s</span>
            </div>
            <div :class="['dmw-rs-param', runningStateData.rotationApplicable ? '' : 'dmw-rs-param--na']">
              <span class="dmw-rs-param-label">回转角度</span>
              <template v-if="runningStateData.rotationApplicable">
                <span class="dmw-rs-param-value">{{ runningStateData.rotationAngle }}<em> °</em></span>
                <span class="dmw-rs-param-sub">相对零位</span>
              </template>
              <template v-else>
                <span class="dmw-rs-param-value dmw-rs-param-na">—</span>
                <span class="dmw-rs-param-sub">无回转机构</span>
              </template>
            </div>
            <div class="dmw-rs-param">
              <span class="dmw-rs-param-label">操作指令</span>
              <span class="dmw-rs-param-value dmw-rs-param-value--text">{{ runningStateData.opMode }}</span>
              <span class="dmw-rs-param-sub">起升:{{ runningStateData.hoistCmd }} | 大车:{{ runningStateData.bridgeCmd }} | 小车:{{ runningStateData.trolleyCmd }}</span>
            </div>
            <div class="dmw-rs-param">
              <span class="dmw-rs-param-label">工作时间</span>
              <span class="dmw-rs-param-value">{{ runningStateData.workTimeMinutes }}<em> min</em></span>
              <span class="dmw-rs-param-sub">当班累计</span>
            </div>
            <div class="dmw-rs-param">
              <span class="dmw-rs-param-label">累计工作时间</span>
              <span class="dmw-rs-param-value">{{ runningStateData.cumWorkHours }}<em> h</em></span>
              <span class="dmw-rs-param-sub">整机累计</span>
            </div>
            <div class="dmw-rs-param">
              <span class="dmw-rs-param-label">工作循环</span>
              <span class="dmw-rs-param-value">{{ runningStateData.cumCycles }}<em> 次</em></span>
              <span class="dmw-rs-param-sub">本日 {{ runningStateData.cyclesToday }} 次</span>
            </div>
          </div>
        </div>

        <div class="section-card dmw-rs-card dmw-rs-card--wide">
          <div class="section-card-header">
            <span class="section-card-title">状态监控</span>
          </div>
          <div class="section-card-body dmw-rs-combo-body">
            <div class="dmw-rs-status-grid">
              <div class="dmw-rs-status-item">
                <div class="dmw-rs-status-row">
                  <span class="dmw-rs-status-label">起升机构制动器的开闭</span>
                  <span class="dmw-rs-status-value">
                    <span :class="['dmw-rs-op-dot', runningStateData.brakeStatusOk ? 'dmw-rs-op-dot--ok' : 'dmw-rs-op-dot--bad']" />
                    <span :class="['dmw-rs-op-value', runningStateData.brakeStatusOk ? '' : 'dmw-rs-op-value--bad']">{{ runningStateData.brakeStatusOk ? '闭合' : '打开' }}</span>
                  </span>
                </div>
              </div>
              <div class="dmw-rs-status-item">
                <div class="dmw-rs-status-row">
                  <span class="dmw-rs-status-label">抗风防滑</span>
                  <span class="dmw-rs-status-value">
                    <span :class="['dmw-rs-op-dot', runningStateData.windproofOk ? 'dmw-rs-op-dot--ok' : 'dmw-rs-op-dot--bad']" />
                    <span :class="['dmw-rs-op-value', runningStateData.windproofOk ? '' : 'dmw-rs-op-value--bad']">{{ runningStateData.windproofOk ? '正常' : '报警' }}</span>
                  </span>
                </div>
              </div>
              <div class="dmw-rs-status-item">
                <div class="dmw-rs-status-row">
                  <span class="dmw-rs-status-label">联锁保护</span>
                  <span class="dmw-rs-status-value">
                    <span :class="['dmw-rs-op-dot', runningStateData.interlockOk ? 'dmw-rs-op-dot--ok' : 'dmw-rs-op-dot--bad']" />
                    <span :class="['dmw-rs-op-value', runningStateData.interlockOk ? '' : 'dmw-rs-op-value--bad']">{{ runningStateData.interlockOk ? '正常' : '故障' }}</span>
                  </span>
                </div>
              </div>
              <div class="dmw-rs-status-item">
                <div class="dmw-rs-status-row">
                  <span class="dmw-rs-status-label">门限位</span>
                  <span class="dmw-rs-status-value">
                    <span :class="['dmw-rs-op-dot', runningStateData.doorLimitOk ? 'dmw-rs-op-dot--ok' : 'dmw-rs-op-dot--bad']" />
                    <span :class="['dmw-rs-op-value', runningStateData.doorLimitOk ? '' : 'dmw-rs-op-value--bad']">{{ runningStateData.doorLimitOk ? '正常' : '异常' }}</span>
                  </span>
                </div>
              </div>
              <div class="dmw-rs-status-item">
                <div class="dmw-rs-status-row">
                  <span class="dmw-rs-status-label">机构之间的运行联锁</span>
                  <span class="dmw-rs-status-value">
                    <span :class="['dmw-rs-op-dot', runningStateData.mechanismInterlockOk ? 'dmw-rs-op-dot--ok' : 'dmw-rs-op-dot--bad']" />
                    <span :class="['dmw-rs-op-value', runningStateData.mechanismInterlockOk ? '' : 'dmw-rs-op-value--bad']">{{ runningStateData.mechanismInterlockOk ? '正常' : '故障' }}</span>
                  </span>
                </div>
              </div>
              <div class="dmw-rs-status-item">
                <div class="dmw-rs-status-row">
                  <span class="dmw-rs-status-label">同一或不同一轨道运行机构安全信号</span>
                  <span class="dmw-rs-status-value">
                    <span :class="['dmw-rs-op-dot', runningStateData.railSafetyOk ? 'dmw-rs-op-dot--ok' : 'dmw-rs-op-dot--bad']" />
                    <span :class="['dmw-rs-op-value', runningStateData.railSafetyOk ? '' : 'dmw-rs-op-value--bad']">{{ runningStateData.railSafetyOk ? '正常' : '异常' }}</span>
                  </span>
                </div>
              </div>
              <div class="dmw-rs-status-item">
                <div class="dmw-rs-status-row">
                  <span class="dmw-rs-status-label">供电电缆卷筒</span>
                  <span class="dmw-rs-status-value">
                    <span :class="['dmw-rs-op-dot', runningStateData.cableReelOk ? 'dmw-rs-op-dot--ok' : 'dmw-rs-op-dot--bad']" />
                    <span :class="['dmw-rs-op-value', runningStateData.cableReelOk ? '' : 'dmw-rs-op-value--bad']">{{ runningStateData.cableReelOk ? '正常' : '异常' }}</span>
                  </span>
                </div>
              </div>
              <div class="dmw-rs-status-item">
                <div class="dmw-rs-status-row">
                  <span class="dmw-rs-status-label">超速保护</span>
                  <span class="dmw-rs-status-value">
                    <span :class="['dmw-rs-op-dot', runningStateData.overspeedOk ? 'dmw-rs-op-dot--ok' : 'dmw-rs-op-dot--bad']" />
                    <span :class="['dmw-rs-op-value', runningStateData.overspeedOk ? '' : 'dmw-rs-op-value--bad']">{{ runningStateData.overspeedOk ? '正常' : '报警' }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div><!-- /dmw-rs-body -->
    </div>

    <!-- ── 结构应力监测：两大列，每列含标题 + 点位/图表 ── -->
    <div v-else-if="activeSection === 'stress'" class="dmw-stress-full-layout">
      <section class="dmw-monitor-column">
        <div class="dmw-monitor-column-head">
          <span class="dmw-monitor-column-title">结构关键位置应力实时监测</span>
          <span class="dmw-monitor-column-subtitle">实测测点与 24h 应变趋势</span>
        </div>
        <div class="dmw-monitor-column-body">
          <div class="dmw-monitor-panel dmw-monitor-panel--points">
            <div class="dmw-stress-col-table-scroll">
              <el-table
                ref="pointsTableRef"
                :data="unifiedTableRows"
                row-key="key"
                size="small"
                class="dmw-points-table"
                highlight-current-row
                empty-text="暂无测点"
                @row-click="onPointsRowClick"
              >
                <el-table-column prop="pointLabel" label="测点编号" width="90" align="center" />
                <el-table-column prop="position" label="测点位置" min-width="110" show-overflow-tooltip />
              </el-table>
            </div>
          </div>

          <div class="dmw-monitor-panel dmw-monitor-panel--chart">
            <div class="dmw-stress-chart-area">
              <template v-if="selectedMetric && selectedMetric.item.history.kind === 'trend'">
                <div class="dmw-stress-chart-header">
                  <span class="dmw-stress-chart-title">应变监测数据（24h）</span>
                  <span class="dmw-stress-chart-unit">单位：με</span>
                </div>
                <div ref="sectionChartRef" class="dmw-stress-chart"></div>
              </template>
              <div v-else class="dmw-stress-chart-empty">← 选择测点查看 24h 趋势</div>
            </div>
          </div>
        </div>
      </section>

      <section class="dmw-monitor-column dmw-monitor-column--accent">
        <div class="dmw-monitor-column-head">
          <span class="dmw-monitor-column-title">结构其他位置数字孪生监测数据</span>
          <span class="dmw-monitor-column-subtitle">增强测点与 24h 推演趋势</span>
        </div>
        <div class="dmw-monitor-column-body">
          <div class="dmw-monitor-panel dmw-monitor-panel--points">
            <div class="dmw-stress-col-table-scroll">
              <el-table
                :data="stressTwinMetrics"
                row-key="code"
                size="small"
                class="dmw-points-table dmw-twin-points-table"
                highlight-current-row
                empty-text="暂无孪生测点"
                @row-click="onTwinRowClick"
              >
                <el-table-column prop="code" label="测点编号" width="90" align="center" />
                <el-table-column prop="position" label="测点位置" min-width="110" show-overflow-tooltip />
              </el-table>
            </div>
          </div>

          <div class="dmw-monitor-panel dmw-monitor-panel--chart">
            <div class="dmw-stress-chart-area dmw-stress-chart-area--twin">
              <template v-if="selectedTwinKey && selectedTwinMetric">
                <div class="dmw-stress-chart-header dmw-stress-chart-header--twin">
                  <span class="dmw-stress-chart-title">孪生推演数据（24h）</span>
                  <span class="dmw-stress-chart-unit dmw-stress-chart-unit--twin">单位：με</span>
                </div>
                <div ref="twinChartRef" class="dmw-stress-chart"></div>
              </template>
              <div v-else class="dmw-stress-chart-empty">← 选择孪生测点查看推演趋势</div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ── 结构损伤监测：两大列，每列含标题 + 点位/图表 ── -->
    <div v-else-if="activeSection === 'damage'" class="dmw-stress-full-layout">
      <section class="dmw-monitor-column">
        <div class="dmw-monitor-column-head">
          <span class="dmw-monitor-column-title">光纤声发射损伤监测</span>
          <span class="dmw-monitor-column-subtitle">损伤测点与应变/声发射趋势</span>
        </div>
        <div class="dmw-monitor-column-body">
          <div class="dmw-monitor-panel dmw-monitor-panel--points">
            <div class="dmw-stress-col-table-scroll">
              <el-table
                ref="pointsTableRef"
                :data="unifiedTableRows"
                row-key="key"
                size="small"
                class="dmw-points-table"
                highlight-current-row
                empty-text="暂无测点"
                @row-click="onPointsRowClick"
              >
                <el-table-column prop="pointLabel" label="测点编号" width="90" align="center" />
                <el-table-column prop="position" label="测点位置" min-width="120" show-overflow-tooltip />
              </el-table>
            </div>
          </div>

          <div class="dmw-monitor-panel dmw-monitor-panel--chart">
            <div class="dmw-stress-chart-area">
              <template v-if="selectedMetric && selectedMetric.item.history.kind === 'dualTrend'">
                <div class="dmw-damage-dual-stack">
                  <div class="dmw-damage-dual-block">
                    <div class="dmw-damage-chart-header">
                      <span class="dmw-damage-chart-title">应变监测数据（24h）</span>
                      <span class="dmw-damage-chart-curr">当前值：{{ damageCurrentStrain }}</span>
                    </div>
                    <div ref="damageStrainChartRef" class="dmw-damage-chart"></div>
                  </div>
                  <div class="dmw-damage-dual-block">
                    <div class="dmw-damage-chart-header">
                      <span class="dmw-damage-chart-title">声发射监测数据（24h）</span>
                      <span class="dmw-damage-chart-curr">当前值：{{ damageCurrentAcoustic }}</span>
                    </div>
                    <div ref="damageAeChartRef" class="dmw-damage-chart"></div>
                  </div>
                </div>
              </template>
              <div v-else class="dmw-damage-chart-empty">请在左侧选择测点查看趋势</div>
            </div>
          </div>
        </div>
      </section>

      <section class="dmw-monitor-column dmw-monitor-column--accent">
        <div class="dmw-monitor-column-head">
          <span class="dmw-monitor-column-title">柔性涡流裂纹监测</span>
          <span class="dmw-monitor-column-subtitle">裂纹测点与图表接入预留</span>
        </div>
        <div class="dmw-monitor-column-body">
          <div class="dmw-monitor-panel dmw-monitor-panel--points">
            <div class="dmw-stress-col-table-scroll">
              <el-table
                :data="crackPointRows"
                row-key="key"
                size="small"
                class="dmw-points-table"
                empty-text="暂无测点"
              >
                <el-table-column prop="pointLabel" label="测点编号" width="90" align="center" />
                <el-table-column prop="position" label="测点位置" min-width="120" show-overflow-tooltip />
              </el-table>
            </div>
          </div>

          <div class="dmw-monitor-panel dmw-monitor-panel--chart">
            <div class="dmw-stress-chart-area">
              <div class="dmw-damage-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.45">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>裂纹监测数据 · 接入中</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ── 制动器失效监测：右侧逐小时照片（日期跟随左侧作业列表日期选择器） ── -->
    <div v-else-if="activeSection === 'brake'" class="dmw-brake-layout dmw-brake-layout--no-cal">
      <div class="dmw-brake-photos-pane">
        <div class="dmw-brake-photos-grid">
          <div v-for="photo in brakePhotoList" :key="photo.id" class="dmw-brake-photo-card">
            <div class="dmw-brake-photo-img">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.4">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <div class="dmw-brake-photo-time">{{ photo.time }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 其他 Tab：左侧测点表 + 右侧详情/图表 ── -->
    <div
      v-else
      class="remote-workspace"
    >
      <aside
        v-if="activeSection !== 'brake'"
        class="dmw-unified-aside"
        aria-label="监测数据与图表列表"
      >
        <div v-if="activeSection !== 'gearbox' && activeSection !== 'wheel'" class="dmw-table-toolbar">
          <span class="dmw-table-toolbar-title">监测数据</span>
          <span class="dmw-table-toolbar-hint">点击行查看历史趋势或明细</span>
        </div>
        <el-table
          ref="pointsTableRef"
          :data="unifiedTableRows"
          row-key="key"
          size="small"
          class="dmw-points-table"
          highlight-current-row
          empty-text="暂无测点"
          @row-click="onPointsRowClick"
        >
          <el-table-column prop="pointLabel" label="测点编号" width="92" align="center" show-overflow-tooltip />
          <el-table-column prop="position" label="测点位置" min-width="130" show-overflow-tooltip />
        </el-table>
      </aside>

      <div class="remote-detail">
        <div v-if="selectedMetric" class="section-card remote-detail-card">
          <div
            v-if="selectedMetric.item.history.kind !== 'tripleTrend'"
            class="section-card-header remote-detail-header"
          >
            <div>
              <span class="section-card-title">{{ selectedMetric.item.label }}</span>
              <div class="remote-detail-meta">
                <span class="remote-detail-current">
                  当前值 <strong>{{ selectedMetric.item.value }}</strong>
                </span>
                <el-tag size="small" :type="historyKindTagType" effect="plain">
                  {{ detailHistoryTagText }}
                </el-tag>
              </div>
            </div>
          </div>
          <div
            v-else-if="activeSection !== 'gearbox' && activeSection !== 'wheel'"
            class="section-card-header remote-detail-header remote-detail-header--center"
          >
            <span class="section-card-title">监测图表</span>
          </div>
          <div class="section-card-body remote-detail-body">
            <template v-if="selectedMetric.item.history.kind === 'trend'">
              <div ref="sectionChartRef" class="remote-chart"></div>
            </template>
            <template v-else-if="selectedMetric.item.history.kind === 'dualTrend'">
              <div class="dmw-dual-chart-stack">
                <div class="dmw-dual-chart-block">
                  <div class="dmw-dual-chart-title">应变值（24h）</div>
                  <div ref="damageStrainChartRef" class="remote-chart remote-chart--dual"></div>
                </div>
                <div class="dmw-dual-chart-block">
                  <div class="dmw-dual-chart-title">声发射（24h）</div>
                  <div ref="damageAeChartRef" class="remote-chart remote-chart--dual"></div>
                </div>
              </div>
            </template>
            <template v-else-if="selectedMetric.item.history.kind === 'tripleTrend'">
              <div class="dmw-triple-chart-stack">
                <div class="dmw-triple-chart-block">
                  <div class="dmw-damage-chart-header dmw-triple-chart-header">
                    <span class="dmw-damage-chart-title">温度数据（24h）</span>
                    <span class="dmw-damage-chart-curr">当前值：{{ tripleCurrentTemp }}</span>
                  </div>
                  <div ref="gearboxTempChartRef" class="remote-chart remote-chart--triple"></div>
                </div>
                <div class="dmw-triple-chart-block">
                  <div class="dmw-damage-chart-header dmw-triple-chart-header">
                    <span class="dmw-damage-chart-title">声音数据（24h）</span>
                    <span class="dmw-damage-chart-curr">当前值：{{ tripleCurrentSound }}</span>
                  </div>
                  <div ref="gearboxSoundChartRef" class="remote-chart remote-chart--triple"></div>
                </div>
                <div class="dmw-triple-chart-block">
                  <div class="dmw-damage-chart-header dmw-triple-chart-header">
                    <span class="dmw-damage-chart-title">振动数据（24h）</span>
                    <span class="dmw-damage-chart-curr">当前值：{{ tripleCurrentVibration }}</span>
                  </div>
                  <div ref="gearboxVibrationChartRef" class="remote-chart remote-chart--triple"></div>
                </div>
              </div>
            </template>
            <template v-else-if="selectedMetric.item.history.kind === 'list'">
              <el-table
                :data="selectedMetric.item.history.rows"
                stripe
                size="small"
                class="remote-history-table"
                max-height="240"
              >
                <el-table-column prop="time" label="时刻" width="88" />
                <el-table-column prop="value" label="采样值" min-width="120" />
              </el-table>
            </template>
            <template v-else-if="selectedMetric.item.history.kind === 'placeholder'">
              <div class="dmw-placeholder-panel">
                <div class="dmw-placeholder-visual" aria-hidden="true">
                  <svg class="dmw-placeholder-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M3 17l4-4 3 3 5-6 6 7" />
                  </svg>
                  <span class="dmw-placeholder-title">视觉监测 · 演示占位</span>
                </div>
                <p class="dmw-placeholder-caption">{{ selectedMetric.item.history.caption }}</p>
              </div>
            </template>
          </div>
        </div>
        <div v-else class="remote-detail-empty">
          {{
            activeSection === 'brake'
              ? '暂无监测内容'
              : '请在左侧表格中选择一行查看历史数据'
          }}
        </div>
      </div>
    </div>
      </div><!-- /dmw-right-pane -->
    </div><!-- /dmw-main-split -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { TableInstance } from 'element-plus'
import { getRemoteMonitoringData, getOperationList } from '@/mock'
import type {
  Device,
  ElectricBoardData,
  RemoteSectionId,
  RemoteStatusItem,
  RemoteTrendHistory,
  OperationRecord
} from '@/mock'

const props = defineProps<{
  device: Device | null
  /** 嵌入抽屉时使用：仅显示右侧监测内容，隐藏左侧作业列表和 section tabs */
  sectionOnly?: boolean
  /** sectionOnly 模式下由父组件受控的当前分类 */
  modelSection?: RemoteSectionId
  /** 隐藏左侧作业列表，但保留 section tabs（用于内联嵌入页面时） */
  hideOpList?: boolean
  /** hideOpList 模式下由父组件受控的选中作业 id */
  modelOpId?: string
  /** hideOpList 模式下由父组件受控的日期 */
  modelOpDate?: Date
}>()

const emit = defineEmits<{
  (e: 'update:modelSection', val: RemoteSectionId): void
  (e: 'update:modelOpId', val: string): void
}>()

const _activeSection = ref<RemoteSectionId>('electric')
const activeSection = computed({
  get: () => (props.sectionOnly && props.modelSection) ? props.modelSection : _activeSection.value,
  set: (val: RemoteSectionId) => {
    if (props.sectionOnly) {
      emit('update:modelSection', val)
    } else {
      _activeSection.value = val
    }
  }
})
const selectedMetricKey = ref('')

/** 作业关联过滤 — 支持父组件受控 (hideOpList 模式) */
const _opDate = ref(new Date())
const opDate = computed({
  get: () => (props.hideOpList && props.modelOpDate) ? props.modelOpDate : _opDate.value,
  set: (val: Date) => { _opDate.value = val }
})

const _selectedOpId = ref('all')
const selectedOpId = computed({
  get: () => (props.hideOpList && props.modelOpId !== undefined) ? props.modelOpId : _selectedOpId.value,
  set: (val: string) => {
    if (props.hideOpList) {
      emit('update:modelOpId', val)
    } else {
      _selectedOpId.value = val
    }
  }
})

const operationList = computed((): OperationRecord[] =>
  getOperationList(props.device?.id ?? '', opDate.value)
)
const activeOp = computed((): OperationRecord | null =>
  operationList.value.find(o => o.id === selectedOpId.value) ?? null
)

/** 当有作业选中时，将趋势数据切片到作业时间窗口 */
function sliceTrend(h: RemoteTrendHistory): RemoteTrendHistory {
  const op = activeOp.value
  if (!op) return h
  const s = op.startHour
  const e = Math.min(op.endHour + 1, h.times.length)
  return { ...h, times: h.times.slice(s, e), values: h.values.slice(s, e) }
}
const sectionChartRef = ref<HTMLElement>()
const twinChartRef = ref<HTMLElement>()
const damageStrainChartRef = ref<HTMLElement>()
const damageAeChartRef = ref<HTMLElement>()
const gearboxTempChartRef = ref<HTMLElement>()
const gearboxSoundChartRef = ref<HTMLElement>()
const gearboxVibrationChartRef = ref<HTMLElement>()
const pointsTableRef = ref<TableInstance>()
let sectionChart: echarts.ECharts | null = null
let twinChart: echarts.ECharts | null = null
let damageStrainChart: echarts.ECharts | null = null
let damageAeChart: echarts.ECharts | null = null
let gearboxTempChart: echarts.ECharts | null = null
let gearboxSoundChart: echarts.ECharts | null = null
let gearboxVibrationChart: echarts.ECharts | null = null

/** 结构应力孪生侧：当前选中的测点 code */
const selectedTwinKey = ref('')

const navItems: { id: RemoteSectionId; label: string; tabLabel: string }[] = [
  { id: 'electric',label: '电控系统监控',                          tabLabel: '电控系统监控' },
  { id: 'stress',  label: '结构应力监测（6 测点·应变）',           tabLabel: '结构应力监测' },
  { id: 'damage',  label: '结构损伤监测（6 测点·应变+声发射）',    tabLabel: '结构损伤监测' },
  { id: 'gearbox', label: '减速机状态监测（2 测点·温度/声音/振动）',tabLabel: '减速机状态监测' },
  { id: 'brake',   label: '制动器状态监测（占位）',                tabLabel: '制动器状态监测' },
  { id: 'wheel',   label: '行走车轮状态监测（8 测点·温度/声音/振动）', tabLabel: '行走车轮状态监测' }
]

const monitoringData = computed(() => getRemoteMonitoringData(props.device))

const electricBoard = computed((): ElectricBoardData | null => {
  const d = monitoringData.value
  if (!d?.electricBoard?.currents?.length) return null
  return d.electricBoard
})

/** GB/T 28264-2017 起重机械安全监控管理系统 — 14 项监控参数确定性 mock 数据 */
const runningStateData = computed(() => {
  const dev = props.device
  if (!dev) return null

  // 确定性 LCG 随机数，以设备 ID 为种子
  let _s = dev.id.split('').reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 5381)
  const rng = (min: number, max: number, salt = 0) => {
    _s = ((_s + salt * 1013904223) * 1664525 + 1013904223) >>> 0
    return min + (_s % (max - min + 1))
  }
  const rngF = (min: number, max: number, decimals = 1, salt = 0) =>
    parseFloat((min + (rng(0, 1000, salt) / 1000) * (max - min)).toFixed(decimals))

  const ratedWeight  = [16, 20, 25, 32, 50][rng(0, 4, 1)]
  const liftWeight   = rngF(0.5, ratedWeight * 0.85, 1, 2)
  const momentPct    = Math.round((liftWeight / ratedWeight) * 100 + rng(-8, 8, 3))
  const ratedHeight  = [16, 20, 24, 32][rng(0, 3, 4)]
  const liftHeight   = rngF(0.5, ratedHeight * 0.9, 1, 5)
  const bridgeTravel = [60, 80, 120][rng(0, 2, 6)] * 10
  const bridgePos    = rngF(2, bridgeTravel - 2, 1, 7)
  const trolleyTravel = [160, 200, 260][rng(0, 2, 8)] * 10 / 10
  const trolleyPos   = rngF(1, trolleyTravel - 1, 1, 9)
  const windSpeed    = rngF(0.2, 9.5, 1, 10)
  const bridgeSkew   = rngF(0.1, 12.0, 2, 11)
  const lowerDepth   = rngF(0.1, Math.min(liftHeight * 0.35, 8), 2, 12)
  const levelTilt    = rngF(0.02, 0.45, 2, 13)
  const levelLimit   = 0.5

  /** 桥门式等无幅变/回转/支腿时标准项仍占位展示 */
  const amplitudeApplicable = false
  const rotationApplicable = false
  const outriggerApplicable = false

  const opModes   = ['手动操作', '半自动操控', '远程操控']
  const hoistCmds = ['待机', '空载上升', '负载上升', '负载下降', '点动调整']
  const bridgeCmds = ['停止', '前进', '后退']
  const trolleyCmds = ['停止', '左行', '右行']

  const mainPowerOk = rng(0, 9, 34) > 0
  const ctrlPowerOk = rng(0, 9, 35) > 0

  const windLimit = 10.8
  const skewLimit = 10
  const mp = Math.min(momentPct, 110)

  return {
    // 1～4
    liftWeight,
    ratedWeight,
    momentPct: mp,
    liftHeight,
    lowerDepth,
    ratedHeight,
    bridgePos,
    bridgeTravel,
    trolleyPos,
    trolleyTravel,

    // 5 幅度（本演示按桥式装备：不适用，模板显示「—」）
    amplitudeApplicable,
    amplitude: rngF(5, 35, 1, 14),
    amplitudeLimit: 40,

    // 6～8
    bridgeSkew,
    skewLimit,
    levelTilt,
    levelLimit,
    windSpeed,
    windLimit,

    // 9 回转角度
    rotationApplicable,
    rotationAngle: rngF(-180, 180, 1, 15),

    // 10 操作指令
    opMode: opModes[rng(0, 2, 30)],
    hoistCmd: hoistCmds[rng(0, 4, 31)],
    bridgeCmd: bridgeCmds[rng(0, 2, 32)],
    trolleyCmd: trolleyCmds[rng(0, 2, 33)],
    mainPowerOk,
    ctrlPowerOk,

    // 11 支腿垂直度
    outriggerApplicable,
    outriggerVerticality: rngF(0.1, 1.2, 2, 16),
    outriggerLimit: 2,

    // 12～14
    workTimeMinutes: rng(15, 420, 40),
    cumWorkHours: rng(300, 8000, 41),
    cyclesToday: rng(2, 28, 42),
    cumCycles: rng(150, 5000, 43),

    brakeStatusOk: rng(0, 9, 44) > 1,
    windproofOk: rng(0, 9, 45) > 0,
    interlockOk: rng(0, 9, 46) > 0,
    doorLimitOk: rng(0, 9, 47) > 0,
    mechanismInterlockOk: rng(0, 9, 48) > 0,
    railSafetyOk: rng(0, 9, 49) > 0,
    cableReelOk: rng(0, 9, 50) > 0,
    overspeedOk: rng(0, 9, 51) > 1,
  }
})

type MetricRow = { key: string; item: RemoteStatusItem }

function isCompletePayload(
  d: ReturnType<typeof getRemoteMonitoringData>
): d is NonNullable<typeof d> {
  return !!(
    d &&
    d.stress?.length === 6 &&
    d.damage?.length === 6 &&
    d.gearbox?.length === 2 &&
    d.wheel?.length === 8 &&
    d.brake?.length >= 1 &&
    d.rope?.length >= 1 &&
    d.electricBoard?.currents?.length === 10 &&
    d.electricBoard.running.length > 0 &&
    d.electricBoard.limits.length > 0
  )
}

/** 测点位置：取 label 中 · 之后片段，否则用分组标题 */
function pointPositionFromLabel(label: string, groupTitle: string): string {
  const sep = /[·・•]/.exec(label)
  if (sep && sep.index != null && sep.index > 0) {
    return label.slice(sep.index + sep[0].length).trim()
  }
  return groupTitle
}

const metricGroups = computed(() => {
  const d = monitoringData.value
  if (!isCompletePayload(d)) return [] as { title: string; metrics: MetricRow[] }[]
  switch (activeSection.value) {
    case 'stress':
      return [{ title: '结构应力（应变）', metrics: d.stress.map((item, i) => ({ key: `stress:${i}`, item })) }]
    case 'damage':
      return [{ title: '结构损伤（应变·声发射）', metrics: d.damage.map((item, i) => ({ key: `damage:${i}`, item })) }]
    case 'gearbox':
      return [
        {
          title: '减速机（温度·声音·振动）',
          metrics: d.gearbox.map((item, i) => ({ key: `gearbox:${i}`, item }))
        }
      ]
    case 'brake':
      return [{ title: '制动器失效', metrics: d.brake.map((item, i) => ({ key: `brake:${i}`, item })) }]
    case 'wheel':
      return [{ title: '行走车轮（温度·声音·振动）', metrics: d.wheel.map((item, i) => ({ key: `wheel:${i}`, item })) }]
    case 'electric':
      return []
    case 'rope':
      return [{ title: '钢丝绳损伤', metrics: d.rope.map((item, i) => ({ key: `rope:${i}`, item })) }]
    default:
      return []
  }
})

const selectedMetric = computed(() => {
  for (const g of metricGroups.value) {
    const m = g.metrics.find(x => x.key === selectedMetricKey.value)
    if (m) return m
  }
  return null
})

const unifiedTableRows = computed(() => {
  const rows: { key: string; pointLabel: string; position: string }[] = []
  let seq = 0
  const section = activeSection.value
  for (const g of metricGroups.value) {
    for (const m of g.metrics) {
      seq++
      let pointLabel: string
      if (section === 'stress') pointLabel = String(seq)
      else if (section === 'wheel') pointLabel = `${seq}#车轮`
      else pointLabel = `${seq}#`
      rows.push({
        key: m.key,
        pointLabel,
        position: pointPositionFromLabel(m.item.label, g.title)
      })
    }
  }
  return rows
})

/** 制动器失效监测：每小时照片列表（日期跟随 opDate） */
type BrakePhoto = { id: string; time: string }

const brakePhotoList = computed((): BrakePhoto[] => {
  const d = opDate.value
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return Array.from({ length: 24 }, (_, h) => {
    const hh = String(h).padStart(2, '0')
    return { id: `brake-${y}${mo}${da}-${hh}`, time: `${hh}:00` }
  })
})

/** 柔性涡流裂纹实测点位（结构损伤下半区，6 个固定位置）*/
const CRACK_POSITIONS: readonly string[] = [
  '主梁跨中 · 焊缝区',
  '主梁端部 · 腹板',
  '支腿根部 · 连接板',
  '端梁下翼缘',
  '小车轨道 · 焊趾',
  '吊具连接销 · 孔边'
]

const crackPointRows = computed(() => {
  if (activeSection.value !== 'damage') return []
  return CRACK_POSITIONS.map((position, i) => ({
    key: `crack:${i}`,
    pointLabel: `${i + 1}#`,
    position
  }))
})

/** 结构损伤：各趋势图当前值（取最后一个采样点） */
const damageCurrentStrain = computed(() => {
  const h = selectedMetric.value?.item.history
  if (h?.kind !== 'dualTrend') return '--'
  const v = h.strain.values.at(-1) ?? '--'
  return `${v} ${h.strain.valueLabel}`
})

const damageCurrentAcoustic = computed(() => {
  const h = selectedMetric.value?.item.history
  if (h?.kind !== 'dualTrend') return '--'
  const v = h.acoustic.values.at(-1) ?? '--'
  return `${v} ${h.acoustic.valueLabel}`
})

/** 结构应力 Tab：孪生测点编号 7–20，与左侧实测 1–6 分列展示 */
const STRESS_TWIN_POSITIONS: readonly string[] = [
  '主梁跨中区·孪生',
  '主梁支座区·孪生',
  '支腿顶部节点·孪生',
  '端梁腹板·孪生',
  '下翼缘监测·孪生',
  '加强筋焊缝·孪生',
  '小车轨道梁·孪生',
  '刚性腿连接·孪生',
  '柔性腿连接·孪生',
  '主梁上翼缘·孪生',
  '主梁下翼缘·孪生',
  '端梁连接板·孪生',
  '支腿与主梁·孪生',
  '大车轨道侧·孪生'
]

/** 确定性哈希，用于孪生趋势生成 */
function twinSeedHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}

const HOURS_24_CONST = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

type TwinMetricItem = {
  code: string
  position: string
  currentValue: string
  history: RemoteTrendHistory
}

/** 结构应力孪生增强测点：编号 7–20，含确定性 24h 应变趋势 */
const stressTwinMetrics = computed((): TwinMetricItem[] => {
  if (!props.device) return []
  const dSeed = twinSeedHash(String(props.device.id))
  return STRESS_TWIN_POSITIONS.map((position, i) => {
    const code = String(7 + i)
    const base = 68 + i * 3.5 + (dSeed % 20) / 3
    const amp = 7 + i % 7
    const salt = twinSeedHash(`dt-${i}-${position}`)
    const values = HOURS_24_CONST.map((_, hi) => {
      const phase = (hi + (dSeed ^ salt) % 11) / 3.8
      const v = base + amp * Math.sin(phase) + ((dSeed + hi) % 5) / 3
      return Math.round(v * 10) / 10
    })
    return {
      code,
      position,
      currentValue: `${Math.round(base + (dSeed % 8))} με`,
      history: { kind: 'trend' as const, times: HOURS_24_CONST, values, valueLabel: 'με' }
    }
  })
})

function onPointsRowClick(row: (typeof unifiedTableRows.value)[0]) {
  selectMetric(row.key)
}

const selectedTwinMetric = computed(() =>
  stressTwinMetrics.value.find(x => x.code === selectedTwinKey.value) ?? null
)

/** 温声振三图当前值（减速机 & 行走车轮共用） */
const tripleCurrentTemp = computed(() => {
  const h = selectedMetric.value?.item.history
  if (h?.kind !== 'tripleTrend') return '--'
  const v = h.temperature.values.at(-1) ?? '--'
  return `${v} ${h.temperature.valueLabel ?? ''}`
})
const tripleCurrentSound = computed(() => {
  const h = selectedMetric.value?.item.history
  if (h?.kind !== 'tripleTrend') return '--'
  const v = h.sound.values.at(-1) ?? '--'
  return `${v} ${h.sound.valueLabel ?? ''}`
})
const tripleCurrentVibration = computed(() => {
  const h = selectedMetric.value?.item.history
  if (h?.kind !== 'tripleTrend') return '--'
  const v = h.vibration.values.at(-1) ?? '--'
  return `${v} ${h.vibration.valueLabel ?? ''}`
})

function onTwinRowClick(row: TwinMetricItem) {
  selectedTwinKey.value = row.code
}

function syncPointsTableCurrentRow() {
  nextTick(() => {
    const t = pointsTableRef.value
    const row = unifiedTableRows.value.find(r => r.key === selectedMetricKey.value)
    if (t && row) t.setCurrentRow(row)
    else if (t) t.setCurrentRow(undefined)
  })
}

const historyKindTagType = computed(() => {
  const k = selectedMetric.value?.item.history.kind
  if (k === 'trend' || k === 'dualTrend' || k === 'tripleTrend') return 'primary'
  if (k === 'placeholder') return 'warning'
  return 'info'
})

const detailHistoryTagText = computed(() => {
  const k = selectedMetric.value?.item.history.kind
  if (k === 'trend') return '24h 数值趋势'
  if (k === 'dualTrend') return '24h 应变 / 声发射'
  if (k === 'tripleTrend') return '24h 温度 / 声音 / 振动'
  if (k === 'list') return '24h 状态采样'
  if (k === 'placeholder') return '监测方案待定'
  return ''
})

function selectMetric(key: string) {
  selectedMetricKey.value = key
}

function pickDefaultMetricKey(): string {
  const g = metricGroups.value[0]
  return g?.metrics[0]?.key ?? ''
}

function disposeSectionChart() {
  sectionChart?.dispose()
  sectionChart = null
}

function disposeDamageDualCharts() {
  damageStrainChart?.dispose()
  damageStrainChart = null
  damageAeChart?.dispose()
  damageAeChart = null
}

function disposeGearboxTripleCharts() {
  gearboxTempChart?.dispose(); gearboxTempChart = null
  gearboxSoundChart?.dispose(); gearboxSoundChart = null
  gearboxVibrationChart?.dispose(); gearboxVibrationChart = null
}

function disposeAllCharts() {
  disposeSectionChart()
  disposeDamageDualCharts()
  disposeGearboxTripleCharts()
  twinChart?.dispose(); twinChart = null
}

function trendLineOption(
  seriesName: string,
  h: RemoteTrendHistory,
  lineColor: string,
  areaTopRgba: string
): echarts.EChartsOption {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 12, top: 12, bottom: 26 },
    xAxis: {
      type: 'category',
      data: h.times,
      axisLine: { lineStyle: { color: '#e8edf3' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: h.valueLabel,
      nameTextStyle: { color: '#94a3b8', fontSize: 10 },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f0f4f8' } }
    },
    series: [
      {
        name: seriesName,
        type: 'line',
        data: h.values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: lineColor, width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: areaTopRgba },
              { offset: 1, color: `${lineColor}00` }
            ]
          }
        }
      }
    ]
  }
}

function renderSectionChart() {
  if (!sectionChartRef.value || !selectedMetric.value) return
  const h = selectedMetric.value.item.history
  if (h.kind !== 'trend') return
  sectionChart = echarts.init(sectionChartRef.value)
  sectionChart.setOption(
    trendLineOption(
      selectedMetric.value.item.label,
      sliceTrend(h),
      '#1677ff',
      'rgba(22,119,255,0.18)'
    )
  )
}

function renderDamageDualCharts() {
  const elStrain = damageStrainChartRef.value
  const elAe = damageAeChartRef.value
  const m = selectedMetric.value
  if (!elStrain || !elAe || !m) return
  const h = m.item.history
  if (h.kind !== 'dualTrend') return
  damageStrainChart = echarts.init(elStrain)
  damageStrainChart.setOption(
    trendLineOption(`${m.item.label} · 应变`, sliceTrend(h.strain), '#1677ff', 'rgba(22,119,255,0.18)')
  )
  damageAeChart = echarts.init(elAe)
  damageAeChart.setOption(
    trendLineOption(`${m.item.label} · 声发射`, sliceTrend(h.acoustic), '#d97706', 'rgba(217,119,6,0.2)')
  )
}

function renderTwinChart() {
  const el = twinChartRef.value
  if (!el) return
  const m = stressTwinMetrics.value.find(x => x.code === selectedTwinKey.value)
  if (!m) return
  twinChart?.dispose()
  twinChart = echarts.init(el)
  twinChart.setOption(
    trendLineOption(`孪生·${m.position}`, sliceTrend(m.history), '#7c3aed', 'rgba(124,58,237,0.18)')
  )
}

function renderGearboxTripleCharts() {
  const elT = gearboxTempChartRef.value
  const elS = gearboxSoundChartRef.value
  const elV = gearboxVibrationChartRef.value
  const m = selectedMetric.value
  if (!elT || !elS || !elV || !m) return
  const h = m.item.history
  if (h.kind !== 'tripleTrend') return
  const base = m.item.label
  gearboxTempChart = echarts.init(elT)
  gearboxTempChart.setOption(
    trendLineOption(`${base} · 温度`, sliceTrend(h.temperature), '#1677ff', 'rgba(22,119,255,0.18)')
  )
  gearboxSoundChart = echarts.init(elS)
  gearboxSoundChart.setOption(
    trendLineOption(`${base} · 声音`, sliceTrend(h.sound), '#7c3aed', 'rgba(124,58,237,0.18)')
  )
  gearboxVibrationChart = echarts.init(elV)
  gearboxVibrationChart.setOption(
    trendLineOption(`${base} · 振动`, sliceTrend(h.vibration), '#059669', 'rgba(5,150,105,0.18)')
  )
}

watch([metricGroups, () => props.device?.id], () => {
  const keys = new Set<string>()
  for (const g of metricGroups.value) for (const m of g.metrics) keys.add(m.key)
  if (!keys.has(selectedMetricKey.value)) {
    selectedMetricKey.value = pickDefaultMetricKey()
  }
  syncPointsTableCurrentRow()
})

watch(activeSection, () => {
  selectedMetricKey.value = pickDefaultMetricKey()
  selectedTwinKey.value = ''
  syncPointsTableCurrentRow()
})

watch(() => props.device?.id, () => {
  selectedOpId.value = 'all'
  opDate.value = new Date()
})

watch(selectedOpId, () => {
  nextTick(() => {
    disposeAllCharts()
    const kind = selectedMetric.value?.item.history.kind
    if (kind === 'trend') {
      renderSectionChart()
      window.setTimeout(() => sectionChart?.resize(), 50)
    } else if (kind === 'dualTrend') {
      renderDamageDualCharts()
      window.setTimeout(() => { damageStrainChart?.resize(); damageAeChart?.resize() }, 50)
    } else if (kind === 'tripleTrend') {
      renderGearboxTripleCharts()
      window.setTimeout(() => {
        gearboxTempChart?.resize()
        gearboxSoundChart?.resize()
        gearboxVibrationChart?.resize()
      }, 50)
    }
    if (selectedTwinKey.value) {
      renderTwinChart()
      window.setTimeout(() => twinChart?.resize(), 50)
    }
  })
})

watch([selectedMetricKey, unifiedTableRows], syncPointsTableCurrentRow)

watch(selectedTwinKey, () => {
  nextTick(() => {
    renderTwinChart()
    window.setTimeout(() => twinChart?.resize(), 50)
  })
})

watch([selectedMetric, monitoringData], () => {
  nextTick(() => {
    disposeAllCharts()
    const kind = selectedMetric.value?.item.history.kind
    if (kind === 'trend') {
      renderSectionChart()
      window.setTimeout(() => sectionChart?.resize(), 50)
    } else if (kind === 'dualTrend') {
      renderDamageDualCharts()
      window.setTimeout(() => {
        damageStrainChart?.resize()
        damageAeChart?.resize()
      }, 50)
    } else if (kind === 'tripleTrend') {
      renderGearboxTripleCharts()
      window.setTimeout(() => {
        gearboxTempChart?.resize()
        gearboxSoundChart?.resize()
        gearboxVibrationChart?.resize()
      }, 50)
    }
  })
})

onMounted(() => {
  selectedMetricKey.value = pickDefaultMetricKey()
  syncPointsTableCurrentRow()
})

onUnmounted(() => {
  disposeAllCharts()
})
</script>

<style scoped>
.dmw-root {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md);
  background: var(--color-card-bg);
  box-shadow: var(--color-card-shadow);
  overflow: hidden;
}

.dmw-refresh-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 13px;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(22, 119, 255, 0.04);
}

/* ── 主分栏：左侧作业列表 + 右侧监测内容 ── */
.dmw-main-split {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

/* sectionOnly 模式：右侧撑满全宽 */
.dmw-main-split--section-only .dmw-right-pane {
  flex: 1;
}

.dmw-right-pane {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 左侧：吊重作业列表面板 ── */
.dmw-op-list-pane {
  width: 158px;
  flex-shrink: 0;
  /* 加强分割线，区分作业表与右侧监测内容 */
  border-right: 2px solid var(--color-border-light);
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.04);
  background: rgba(248, 250, 252, 0.85);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dmw-op-list-header {
  flex-shrink: 0;
  padding: 6px 8px 4px;
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 3px;
  background: rgba(22, 119, 255, 0.04);
  /* 确保日期选择器下拉不被遮挡 */
  overflow: visible;
  z-index: 10;
  position: relative;
}

/* 日期选择器撑满左栏宽度 */
.dmw-op-list-header :deep(.el-date-editor) {
  width: 100% !important;
}

.dmw-op-list-header :deep(.el-input__wrapper) {
  min-height: 28px;
  padding: 0 8px;
}

.dmw-op-list-header :deep(.el-input__inner) {
  font-size: 12px;
}

.dmw-op-list-count {
  font-size: 10px;
  color: var(--color-text-muted);
  padding-left: 2px;
  line-height: 1.2;
}

.dmw-op-list-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin: 6px;
  padding: 2px 0;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-card-bg);
}

.dmw-op-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.12s, border-color 0.12s;
}

.dmw-op-row:hover {
  background: rgba(22, 119, 255, 0.06);
}

.dmw-op-row--active {
  background: rgba(22, 119, 255, 0.1);
  border-left-color: var(--color-primary);
}

.dmw-op-row-seq {
  flex-shrink: 0;
  width: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.dmw-op-row--active .dmw-op-row-seq {
  color: var(--color-primary);
}

.dmw-op-row-mid {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.dmw-op-row-load {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dmw-op-row-dur {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}


.dmw-refresh-label {
  font-weight: 600;
  color: var(--color-text-muted);
}

.dmw-refresh-time {
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

/* ════════════════════════════════════════════════════════
   电控系统监控 — GB/T 28264-2017 监控参数仪表盘
   ════════════════════════════════════════════════════════ */
.dmw-rs-board {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-card-bg);
}

/* ── 主体区（压缩间距，减少纵向滚动） ── */
.dmw-rs-body {
  flex: 1;
  min-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dmw-rs-card .section-card-header {
  padding: 6px 10px;
  min-height: 0;
}

.dmw-rs-card .section-card-body {
  padding: 6px 8px 8px;
}

/* ── 上方两列 ── */
.dmw-rs-top-row {
  display: grid;
  grid-template-columns: minmax(360px, 1.6fr) minmax(200px, 1fr);
  gap: 14px;
  align-items: start;
}

.dmw-rs-card {
  margin: 0;
  border: 1px solid var(--color-card-border);
  box-shadow: var(--color-card-shadow);
}

.dmw-rs-card--wide { width: 100%; }

.dmw-rs-card-sub {
  font-size: 10px;
  color: var(--color-text-muted);
  margin-left: 6px;
}

/* ── 测量参数：5 列 × 2 行（9 项） ── */
.dmw-rs-params-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 12px;
}

.dmw-rs-params-grid--dense {
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 4px 6px;
}

@media (max-width: 1400px) {
  .dmw-rs-params-grid--dense {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .dmw-rs-params-grid--dense {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .dmw-rs-params-grid--dense {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.dmw-rs-param--na {
  border-left-color: var(--color-border);
  background: color-mix(in srgb, var(--color-text-muted) 6%, transparent);
}

.dmw-rs-param-na {
  color: var(--color-text-muted);
  font-weight: 600;
}

.dmw-rs-param-slash {
  margin: 0 2px;
  font-weight: 400;
  color: var(--color-text-muted);
  font-size: 11px;
}

.dmw-rs-param {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 6px;
  min-height: 0;
  background: var(--color-border-light);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-border);
  transition: border-color 0.2s;
}

.dmw-rs-stat-hint {
  font-size: 10px;
  color: var(--color-text-muted);
  margin-top: 1px;
  line-height: 1.2;
}

.dmw-rs-param--warning { border-left-color: var(--color-warning); background: color-mix(in srgb, var(--color-warning) 8%, transparent); }
.dmw-rs-param--danger  { border-left-color: var(--color-danger);  background: color-mix(in srgb, var(--color-danger)  8%, transparent); }

.dmw-rs-param-label {
  font-size: 10px;
  color: var(--color-text-muted);
  line-height: 1.2;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dmw-rs-param-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}

.dmw-rs-param--warning .dmw-rs-param-value { color: var(--color-warning); }
.dmw-rs-param--danger  .dmw-rs-param-value { color: var(--color-danger);  }

.dmw-rs-param-value em {
  font-style: normal;
  font-size: 10px;
  font-weight: 400;
  color: var(--color-text-muted);
  margin-left: 1px;
}

.dmw-rs-param-value--text {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}

.dmw-rs-param-sub {
  font-size: 10px;
  color: var(--color-text-muted);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 卡片 B：限位保护 ── */
.dmw-rs-limits-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dmw-rs-lim-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.dmw-rs-lim-row--warn   { background: color-mix(in srgb, var(--color-warning) 8%, transparent); }
.dmw-rs-lim-row--danger { background: color-mix(in srgb, var(--color-danger)  8%, transparent); }

.dmw-rs-lim-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dmw-rs-lim-dot--ok     { background: var(--color-success); box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-success) 22%, transparent); }
.dmw-rs-lim-dot--warn   { background: var(--color-warning); box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-warning) 22%, transparent); }
.dmw-rs-lim-dot--danger { background: var(--color-danger);  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-danger)  22%, transparent); }

.dmw-rs-lim-label {
  flex: 1;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.dmw-rs-lim-status {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.dmw-rs-lim-row--warn   .dmw-rs-lim-status { color: var(--color-warning); }
.dmw-rs-lim-row--danger .dmw-rs-lim-status { color: var(--color-danger);  }

/* ── 底部合并区：操作指令 | 支腿 | 时间循环 ── */
.dmw-rs-combo-body {
  padding-top: 6px !important;
}

.dmw-rs-status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px 10px;
}

@media (max-width: 1200px) {
  .dmw-rs-status-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 900px) {
  .dmw-rs-status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .dmw-rs-status-grid {
    grid-template-columns: 1fr;
  }
}

.dmw-rs-status-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  background: var(--color-bg-subtle);
  border-radius: 4px;
  border: 1px solid var(--color-border-light);
}

.dmw-rs-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.dmw-rs-status-label {
  font-size: 14px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.dmw-rs-status-value {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.dmw-rs-combo-grid {
  display: grid;
  grid-template-columns: minmax(200px, 1.4fr) auto minmax(100px, 0.45fr) auto minmax(160px, 0.95fr);
  align-items: stretch;
  gap: 0;
  min-width: 0;
}

@media (max-width: 1100px) {
  .dmw-rs-combo-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .dmw-rs-combo-vsep {
    display: none;
  }
}

.dmw-rs-combo-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.dmw-rs-combo-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: none;
  letter-spacing: 0;
  line-height: 1.2;
}

.dmw-rs-combo-vsep {
  width: 1px;
  margin: 0 10px;
  background: var(--color-border-light);
  align-self: stretch;
  min-height: 52px;
}

.dmw-rs-combo-leg-inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
  flex: 1;
  min-height: 44px;
}

.dmw-rs-combo-leg-value {
  font-size: 16px;
}

.dmw-rs-ops-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
}

.dmw-rs-ops-row--compact {
  row-gap: 2px;
}

.dmw-rs-ops-row--compact .dmw-rs-op-sep {
  height: 28px;
  margin: 0 8px;
}

.dmw-rs-ops-row--compact .dmw-rs-op-item {
  padding: 2px 6px;
  min-width: 0;
  gap: 1px;
}

.dmw-rs-ops-row--compact .dmw-rs-op-label {
  font-size: 10px;
}

.dmw-rs-ops-row--compact .dmw-rs-op-value {
  font-size: 12px;
}

.dmw-rs-op-sep {
  width: 1px;
  height: 36px;
  background: var(--color-border-light);
  flex-shrink: 0;
  margin: 0 16px;
}

.dmw-rs-op-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px 14px;
  min-width: 80px;
}

.dmw-rs-op-label {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.dmw-rs-op-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.dmw-rs-op-value--mode   { color: var(--color-primary); }
.dmw-rs-op-value--active { color: var(--color-success); }
.dmw-rs-op-value--bad    { color: var(--color-danger);  }

.dmw-rs-op-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 5px;
  flex-shrink: 0;
}
.dmw-rs-op-dot--ok  { background: var(--color-success); }
.dmw-rs-op-dot--bad { background: var(--color-danger);  }

.dmw-rs-stats-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
}

.dmw-rs-stats-row--compact {
  align-items: flex-start;
  flex: 1;
}

.dmw-rs-stats-row--compact .dmw-rs-stat-sep {
  height: 40px;
  margin: 0 10px;
}

.dmw-rs-stats-row--compact .dmw-rs-stat {
  min-width: 0;
  flex: 1;
  gap: 1px;
}

.dmw-rs-stats-row--compact .dmw-rs-stat-label {
  font-size: 10px;
}

.dmw-rs-stats-row--compact .dmw-rs-stat-value {
  font-size: 17px;
}

.dmw-rs-stats-row--compact .dmw-rs-stat-value em {
  font-size: 11px;
}

.dmw-rs-stat-sep {
  width: 1px;
  height: 36px;
  background: var(--color-border-light);
  flex-shrink: 0;
  margin: 0 24px;
}

.dmw-rs-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 120px;
}

.dmw-rs-stat-label {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.dmw-rs-stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.dmw-rs-stat-value em {
  font-style: normal;
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-muted);
  margin-left: 2px;
}

/* ════════════════════════════════════════════════════════ */

.dmw-electric-board {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 16px 16px;
  background: var(--color-card-bg);
}

.dmw-ec-intro {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.dmw-ec-layout {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dmw-ec-top {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(280px, 1.15fr);
  gap: 14px;
  align-items: start;
}

@media (max-width: 960px) {
  .dmw-ec-top {
    grid-template-columns: 1fr;
  }
}

.dmw-ec-card {
  margin: 0;
  border: 1px solid var(--color-card-border);
  box-shadow: var(--color-card-shadow);
}

.dmw-ec-card--wide {
  width: 100%;
}

.dmw-ec-running-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 14px;
}

@media (max-width: 720px) {
  .dmw-ec-running-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dmw-ec-kv {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: var(--color-border-light);
  border-radius: var(--radius-sm);
}

.dmw-ec-kv-label {
  font-size: 11px;
  color: var(--color-text-muted);
}

.dmw-ec-kv-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.dmw-ec-gears-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 12px !important;
}

.dmw-ec-gear-block {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-light);
}

.dmw-ec-gear-block:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.dmw-ec-gear-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.dmw-ec-gear-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dmw-ec-gear-num {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.dmw-ec-gear-num strong {
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
}

.dmw-ec-gear-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
}

.dmw-ec-slot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
}

.dmw-ec-slot--on {
  color: var(--color-primary);
  border-color: rgba(22, 119, 255, 0.45);
  background: rgba(22, 119, 255, 0.06);
  font-weight: 600;
}

.dmw-ec-slot-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border);
  flex-shrink: 0;
}

.dmw-ec-slot--on .dmw-ec-slot-dot {
  background: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}

.dmw-ec-current-body {
  padding-top: 8px !important;
}

.dmw-ec-current-table {
  width: 100%;
}

.dmw-ec-limits {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
}

.dmw-ec-limit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.dmw-ec-limit--bad {
  color: var(--color-danger);
}

.dmw-ec-limit-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dmw-ec-limit-dot--ok {
  background: var(--color-success);
}

.dmw-ec-limit-dot--bad {
  background: var(--color-danger);
}

.dmw-placeholder-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: 16px;
}

.dmw-placeholder-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 32px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-border-light);
  color: var(--color-text-muted);
}

.dmw-placeholder-icon {
  opacity: 0.65;
}

.dmw-placeholder-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.dmw-placeholder-caption {
  margin: 0;
  max-width: 420px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-text-secondary);
  text-align: center;
}

.remote-section-tabs {
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  gap: 4px;
  padding: 0 16px;
  background: var(--color-card-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow-x: auto;
}

.remote-section-tabs::-webkit-scrollbar {
  height: 0;
}

.remote-section-tab {
  flex-shrink: 0;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  white-space: nowrap;
}

.remote-section-tab:hover {
  color: var(--color-primary);
  background: rgba(22, 119, 255, 0.04);
}

.remote-section-tab.active {
  color: var(--color-primary);
  font-weight: 600;
  border-bottom-color: var(--color-primary);
  background: rgba(22, 119, 255, 0.06);
}

.remote-workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  /* 无数字孪生：左侧随内容变窄，右侧图表区更大 */
  grid-template-columns: fit-content(310px) minmax(220px, 1fr);
  gap: 0;
  min-width: 0;
}

.remote-workspace--brake-only {
  grid-template-columns: 1fr;
}

.dmw-unified-aside {
  border-right: 1px solid var(--color-border-light);
  padding: 0 0 10px;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: rgba(248, 250, 252, 0.65);
  display: flex;
  flex-direction: column;
}

/* ── 结构应力/损伤监测：两大列，每列含标题 + 点位/图表 ── */
.dmw-stress-full-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  min-width: 0;
  overflow: hidden;
}

.dmw-monitor-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md, 8px);
  background: var(--color-card-bg);
}

.dmw-monitor-column--accent {
  background: color-mix(in srgb, var(--color-primary) 2%, var(--color-card-bg));
}

.dmw-monitor-column-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(248, 250, 252, 0.85);
}

.dmw-monitor-column-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  flex: 1;
  text-align: center;
}

.dmw-monitor-column-subtitle {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
  text-align: center;
}

.dmw-monitor-column-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
  overflow: hidden;
}

.dmw-monitor-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dmw-monitor-panel--points {
  background: rgba(248, 250, 252, 0.75);
  border-right: 1px solid var(--color-border-light);
}

.dmw-monitor-panel--chart {
  background: transparent;
}

.dmw-monitor-panel-title {
  flex-shrink: 0;
  padding: 10px 14px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-align: center;
}

/* 测点表滚动容器 */
.dmw-stress-col-table-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.dmw-stress-chart-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 10px 10px 12px 12px;
}

.dmw-stress-chart-area--twin {
  padding-left: 10px;
}

.dmw-stress-chart {
  flex: 1;
  width: 100%;
  min-height: 120px;
  max-height: 260px;
}

.dmw-stress-chart-header {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 0 2px 6px;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 6px;
}

.dmw-stress-chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.dmw-stress-chart-unit {
  font-size: 11px;
  color: var(--color-primary);
  background: rgba(22, 119, 255, 0.08);
  border-radius: 3px;
  padding: 1px 6px;
  white-space: nowrap;
}

.dmw-stress-chart-unit--twin {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.1);
}

/* ── 制动器失效监测：日历 + 照片网格 ── */
.dmw-brake-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: fit-content(310px) minmax(300px, 1fr);
  overflow: hidden;
}

/* 移除日历后，照片区直接全宽 */
.dmw-brake-layout--no-cal {
  grid-template-columns: 1fr;
}

.dmw-brake-cal-pane {
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  overflow: auto;
  background: rgba(248, 250, 252, 0.65);
  min-width: 0;
}

.dmw-brake-calendar {
  flex-shrink: 0;
}

/* 缩小日历内边距以适配侧栏 */
.dmw-brake-calendar :deep(.el-calendar__header) {
  padding: 8px 10px;
}
.dmw-brake-calendar :deep(.el-calendar__body) {
  padding: 4px 8px 8px;
}
.dmw-brake-calendar :deep(.el-calendar-table td) {
  padding: 2px 0;
}
.dmw-brake-calendar :deep(.el-calendar-day) {
  height: 30px;
  line-height: 30px;
  font-size: 12px;
  padding: 0;
}

.dmw-brake-photos-pane {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dmw-brake-photos-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 12px 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
  align-content: start;
}

.dmw-brake-photo-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-card-bg);
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.dmw-brake-photo-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.dmw-brake-photo-img {
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, #edf0f5 0%, #dde2ea 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.dmw-brake-photo-time {
  padding: 4px 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-align: center;
  font-variant-numeric: tabular-nums;
  background: rgba(248, 250, 252, 0.9);
  border-top: 1px solid var(--color-border-light);
}

@media (max-width: 800px) {
  .dmw-brake-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  .dmw-brake-cal-pane {
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
  }
}

/* ── 结构损伤监测：上下两分区布局 ── */
.dmw-damage-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dmw-damage-section {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: fit-content(255px) minmax(180px, 1fr);
  overflow: hidden;
}

.dmw-damage-section--lower {
  border-top: 2px solid var(--color-border-light);
  background: rgba(248, 250, 252, 0.35);
}

.dmw-damage-aside {
  border-right: 1px solid var(--color-border-light);
  padding: 0 0 8px;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: rgba(248, 250, 252, 0.65);
  display: flex;
  flex-direction: column;
}

.dmw-damage-chart-area {
  min-width: 0;
  min-height: 0;
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 双趋势图横排 */
.dmw-damage-dual-stack {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.dmw-damage-dual-block {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dmw-damage-chart-header {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 0 2px 5px;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 6px;
}

.dmw-damage-chart-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.dmw-damage-chart-curr {
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.dmw-damage-chart {
  flex: 1;
  width: 100%;
  min-height: 100px;
  max-height: 260px;
}

.dmw-damage-chart-empty {
  margin: auto;
  font-size: 13px;
  color: var(--color-text-muted);
}

/* 下半占位区 */
.dmw-damage-placeholder {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: 13px;
  border: 1px dashed var(--color-border-light);
  border-radius: var(--radius-md, 6px);
  margin: 4px;
}

.dmw-stress-chart-empty {
  margin: auto;
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 24px 6px;
  line-height: 1.6;
}

/* 窄屏降级：2×2 网格（实测一行 / 孪生一行） */
@media (max-width: 1000px) {
  .dmw-stress-full-layout {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .dmw-monitor-column-body {
    grid-template-columns: 1fr;
  }

  .dmw-monitor-panel--points {
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
  }
}

.dmw-table-toolbar {
  flex-shrink: 0;
  padding: 8px 8px 5px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.dmw-table-toolbar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  width: 100%;
  text-align: center;
}

.dmw-table-toolbar-hint {
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: center;
}

.dmw-points-table {
  width: 100%;
}

.dmw-twin-points-table :deep(.el-table__body tr) {
  cursor: pointer;
}

.dmw-points-table :deep(.el-table__body tr) {
  cursor: pointer;
}

.dmw-points-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

/* 单行展示，过长省略；悬停见 Element Plus tooltip */
.dmw-points-table :deep(.el-table .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.35;
  padding-top: 5px;
  padding-bottom: 5px;
}

.dmw-points-table :deep(.el-table th .cell) {
  white-space: nowrap;
}

.dmw-points-table :deep(.el-table__body .el-table__cell) {
  vertical-align: middle;
}

.remote-detail {
  min-width: 0;
  min-height: 0;
  padding: 10px 10px 12px;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.remote-detail-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin: 0;
  overflow: hidden;
}

.remote-detail-header {
  flex-shrink: 0;
  align-items: flex-start;
}

.remote-detail-header--center {
  align-items: center;
  justify-content: center;
}

.remote-detail-header--center .section-card-title {
  text-align: center;
}

.remote-detail-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.remote-detail-current {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.remote-detail-current strong {
  color: var(--color-primary);
  font-size: 14px;
  margin-left: 4px;
}

.remote-detail-body {
  flex: 1;
  min-height: 0;
  padding: 8px 10px 10px !important;
  display: flex;
  flex-direction: column;
}

.remote-chart {
  width: 100%;
  flex: 1;
  min-height: clamp(180px, 32vh, 300px);
}

.dmw-dual-chart-stack {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 10px;
}

.dmw-dual-chart-block {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dmw-dual-chart-title {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 0 2px 6px;
}

.remote-chart--dual {
  min-height: clamp(160px, 26vh, 280px);
  max-height: 300px;
}

.dmw-triple-chart-stack {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 8px;
}

.dmw-triple-chart-block {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dmw-triple-chart-header {
  min-height: 33px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 2px;
}

.remote-chart--triple {
  min-height: clamp(130px, 20vh, 220px);
  max-height: 260px;
}

.remote-history-table {
  width: 100%;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.remote-history-table :deep(.el-table__header-wrapper) {
  border-bottom: 1px solid var(--color-border-light);
}

.remote-history-table :deep(.el-table__body-wrapper) {
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}

.remote-detail-empty {
  margin: auto;
  font-size: 13px;
  color: var(--color-text-muted);
}

@media (max-width: 1100px) {
  .remote-workspace {
    grid-template-columns: fit-content(220px) minmax(180px, 1fr);
  }

  .remote-workspace--stress {
    grid-template-columns: fit-content(440px) minmax(180px, 1fr);
  }

  .remote-workspace--brake-only {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1000px) {
  .dmw-triple-chart-stack {
    flex-direction: column;
  }

  .remote-chart--triple {
    max-height: 220px;
  }
}

@media (max-width: 900px) {
  .dmw-dual-chart-stack {
    flex-direction: column;
  }

  .remote-chart--dual {
    max-height: 240px;
  }
}
</style>

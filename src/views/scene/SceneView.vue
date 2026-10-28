<template>
  <div class="content-scrollable scene-content-scroll">
    <!-- Scene Header -->
    <div v-if="isHistoryList && !isSpecialHistoryService" class="scene-header scene-header--compact">
      <div class="scene-header-left"></div>
      <div style="display:flex;gap:10px;align-items:center">
        <div class="view-toggle">
          <button :class="['view-toggle-btn', { active: viewMode === 'card' }]" @click="viewMode='card'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            卡片
          </button>
          <button :class="['view-toggle-btn', { active: viewMode === 'list' }]" @click="viewMode='list'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
            列表
          </button>
        </div>
      </div>
    </div>

    <BasicDataOverview v-if="activeServiceKey === 'basicdata'" :devices="filteredDevices" />

    <!-- 搜索：居左对齐 -->
    <div v-if="usesDeviceScope" class="filter-bar">
      <div class="filter-bar-right" style="flex: 1; justify-content: flex-start;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        <el-input v-model="filters.name" placeholder="设备名称" size="small" clearable style="width:160px" />
        <el-select v-model="filters.status" placeholder="设备运行状态" size="small" clearable style="width:120px">
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-select v-model="filters.type" placeholder="设备类型" size="small" clearable style="width:160px">
          <el-option v-for="t in deviceTypes" :key="t" :label="t" :value="t" />
        </el-select>
        <el-button size="small" type="primary" @click="applyFilter">
          <el-icon class="el-icon--left"><Search /></el-icon>查询
        </el-button>
        <el-button size="small" @click="resetFilter">重置</el-button>
        <span class="filter-bar-total">共 {{ filteredTotal }} 条记录</span>
      </div>
    </div>

    <!-- 列表 + 分页：同一卡片容器 -->
    <div v-if="isHistoryList && isSpecialHistoryService" class="scene-list-container">
      <div class="data-table-wrap">
        <el-table :data="specialRows" style="width:100%">
          <el-table-column label="序号" width="64" align="center" fixed="left"><template #default="{ $index }">{{ (currentPage - 1) * pageSize + $index + 1 }}</template></el-table-column>
          <el-table-column prop="code" label="设备编号" width="180" fixed="left" />
          <el-table-column prop="name" label="设备名称" width="190" fixed="left" show-overflow-tooltip />
          <el-table-column prop="location" label="使用地点" min-width="180" show-overflow-tooltip />
          <template v-if="activeServiceKey === 'maintain'"><el-table-column prop="repairCount" label="维修次数" width="100" align="center" /><el-table-column prop="frequentPart" label="高频维修部件" width="150" /><el-table-column prop="repairAdvice" label="维修建议" min-width="260" show-overflow-tooltip /></template>
          <template v-else-if="activeServiceKey === 'basicdata'"><el-table-column prop="installDate" label="投入时间" width="130" /><el-table-column prop="workLevel" label="工作级别" width="100" /><el-table-column prop="manufacturer" label="制造商" min-width="170" /><el-table-column prop="statusLabel" label="使用状态" width="100" /></template>
          <template v-else>
            <el-table-column prop="manufacturer" label="制造商" min-width="170" />
            <el-table-column prop="model" label="规格型号" width="140" />
            <el-table-column prop="madeDate" label="出厂日期" width="130" />
            <el-table-column label="技术资料" width="120" align="center">
              <template #default="{ row }">
                <button type="button" class="table-link-button" @click.stop="openData(row.device, 'supply')">
                  查看（{{ row.docCount }}份）
                </button>
              </template>
            </el-table-column>
          </template>
          <el-table-column label="操作" width="124" fixed="right" align="center"><template #default="{ row }"><el-button type="primary" link @click.stop="handleDeviceClick(row.device.id)">查看详情</el-button></template></el-table-column>
        </el-table>
      </div>
      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>
    <div v-else-if="isHistoryList" class="scene-list-container">
      <template v-if="viewMode === 'card'">
        <div class="device-grid">
          <div
            v-for="device in pagedDevices"
            :key="device.id"
            class="device-card"
            @click="handleDeviceClick(device.id)"
          >
            <div class="device-card-header">
              <div>
                <div class="device-card-name">{{ device.name }}</div>
                <div class="device-card-code">{{ device.code }}</div>
              </div>
            </div>
            <div class="device-card-body">
              <div class="device-card-row">
                <span class="device-card-row-label">设备类型</span>
                <span>{{ device.type }}</span>
              </div>
              <div class="device-card-row">
                <span class="device-card-row-label">投用日期</span>
                <span>{{ device.installDate }}</span>
              </div>
              <div class="device-card-row device-card-row--tech">
                <span class="device-card-row-label">技术参数前6项</span>
                <span class="device-card-tech">{{ formatTechParams(device.technicalParams) }}</span>
              </div>
              <div class="device-card-row">
                <span class="device-card-row-label">设备运行状态</span>
                <span :class="`badge badge-${device.status}`">
                  <span class="badge-dot"></span>{{ statusLabels[device.status] }}
                </span>
              </div>
              <div class="device-card-row">
                <span class="device-card-row-label">已运行时长(h)</span>
                <span>{{ device.operatingHours.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="data-table-wrap">
          <el-table
            :data="pagedDevices"
            style="width:100%"
            @row-click="(row: any) => handleDeviceClick(row.id)"
          >
            <el-table-column label="序号" width="64" align="center" fixed="left">
              <template #default="{ $index }">
                {{ (currentPage - 1) * pageSize + $index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="code" label="设备编号" width="120" fixed="left" />
            <el-table-column prop="name" label="设备名称" width="190" fixed="left" show-overflow-tooltip />
            <el-table-column prop="location" label="使用地点" min-width="150" show-overflow-tooltip />
            <el-table-column
              v-for="col in dataColumns"
              :key="col.key"
              :label="col.label"
              min-width="120"
              align="center"
            >
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click.stop="openData(row, col.key)">
                  <el-icon class="el-icon--left"><View /></el-icon>查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else-if="isRemoteList" class="scene-list-container">
      <div class="data-table-wrap">
        <el-table
          :data="pagedSafetyRows"
          style="width:100%"
          @row-click="(row: SafetyMonitorRow) => handleDeviceClick(row.device.id)"
        >
          <el-table-column label="序号" width="64" align="center" fixed="left">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="code" label="设备编号" width="180" fixed="left" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" width="190" fixed="left" show-overflow-tooltip />
          <el-table-column prop="location" label="使用地点" width="220" show-overflow-tooltip />
          <el-table-column label="作业状态" width="112" align="center">
            <template #default="{ row }">
              <el-tag :type="row.working ? 'success' : 'info'" size="small" effect="light">
                {{ row.working ? '作业中' : '未作业' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="监控系统状态" width="132" align="center">
            <template #default="{ row }">
              <el-tag :type="row.monitorNormal ? 'success' : 'danger'" size="small" effect="light">
                {{ row.monitorNormal ? '正常' : '异常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="预警状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.warning ? 'danger' : 'success'" size="small" effect="light">
                {{ row.warning ? '报警' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="latestAlarmTime" label="最新报警时间" min-width="150" show-overflow-tooltip />
          <el-table-column label="报警次数" width="96" align="center">
            <template #default="{ row }">
              <span :class="['remote-count', { warn: row.alarmCount > 0 }]">{{ row.alarmCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.device.id)">
                查看安全监控
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else-if="isHealthMonitorList" class="scene-list-container">
      <div class="data-table-wrap">
        <el-table
          :data="pagedHealthRows"
          style="width:100%"
          @row-click="(row: HealthMonitorRow) => handleDeviceClick(row.device.id)"
        >
          <el-table-column label="序号" width="64" align="center" fixed="left">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="code" label="设备编号" width="180" fixed="left" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" width="190" fixed="left" show-overflow-tooltip />
          <el-table-column prop="location" label="使用地点" width="220" show-overflow-tooltip />
          <el-table-column label="作业状态" width="112" align="center">
            <template #default="{ row }">
              <el-tag :type="row.working ? 'success' : 'info'" size="small" effect="light">
                {{ row.working ? '作业中' : '未作业' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="健康监测" width="112" align="center">
            <template #default="{ row }"><el-tag :type="row.monitoring === '监测中' ? 'success' : 'info'" size="small">{{ row.monitoring }}</el-tag></template>
          </el-table-column>
          <el-table-column label="金属结构监测状态" width="150" align="center">
            <template #default="{ row }">
              <el-tag :type="monitorStatusTagType(row.structureMonitorStatus)" size="small" effect="light">
                {{ row.structureMonitorStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="电控系统状态" width="132" align="center">
            <template #default="{ row }">
              <el-tag :type="monitorStatusTagType(row.electricStatus)" size="small" effect="light">
                {{ row.electricStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="减速机监测状态" width="134" align="center">
            <template #default="{ row }">
              <el-tag :type="monitorStatusTagType(row.gearboxMonitorStatus)" size="small" effect="light">
                {{ row.gearboxMonitorStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="制动器监测状态" width="134" align="center">
            <template #default="{ row }">
              <el-tag :type="monitorStatusTagType(row.brakeMonitorStatus)" size="small" effect="light">
                {{ row.brakeMonitorStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="车轮监测状态" width="122" align="center">
            <template #default="{ row }">
              <el-tag :type="monitorStatusTagType(row.wheelMonitorStatus)" size="small" effect="light">
                {{ row.wheelMonitorStatus }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="124" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.device.id)">
                查看健康监测
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else-if="isPointList" class="scene-list-container">
      <div class="data-table-wrap">
        <el-table
          :data="pagedPointRows"
          style="width:100%"
          @row-click="(row: PointInspectionRow) => handleDeviceClick(row.device.id)"
        >
          <el-table-column label="序号" width="64" align="center" fixed="left">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="code" label="设备编号" width="180" fixed="left" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" width="190" fixed="left" show-overflow-tooltip />
          <el-table-column prop="location" label="使用地点" width="220" show-overflow-tooltip />
          <el-table-column label="昨日点巡检" width="120" align="center">
            <template #default="{ row }"><el-tag :type="row.yesterdayDone ? 'success' : 'info'" size="small">{{ row.yesterdayDone ? '开展' : '未开展' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="点巡检存在问题" min-width="190" show-overflow-tooltip>
            <template #default="{ row }">
              <span :class="['point-problem-text', { warn: row.todayProblems > 0 }]">{{ row.problemSummary }}</span>
            </template>
          </el-table-column>
          <el-table-column label="点巡检问题处理" width="140" align="center">
            <template #default="{ row }">
              <el-tag :type="pointHandlingTagType(row.handlingStatus)" size="small" effect="light">
                {{ pointHandlingLabels[row.handlingStatus] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="124" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.device.id)">
                查看点巡检
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else-if="isTroubleshootList" class="scene-list-container">
      <div class="data-table-wrap">
        <el-table
          :data="pagedTroubleshootRows"
          style="width:100%"
          @row-click="(row: TroubleshootRegionRow) => handleDeviceClick(row.device.id)"
        >
          <el-table-column label="序号" width="64" align="center" fixed="left">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="code" label="设备编号" width="180" fixed="left" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" width="190" fixed="left" show-overflow-tooltip />
          <el-table-column prop="location" label="使用地点" min-width="210" show-overflow-tooltip />
          <el-table-column label="已分析点巡检表" width="142" align="center">
            <template #default="{ row }"><el-tag type="primary" size="small" effect="light">{{ row.formCount }} 份</el-tag></template>
          </el-table-column>
          <el-table-column label="累计发现问题" width="132" align="center">
            <template #default="{ row }"><el-tag type="danger" size="small" effect="light">{{ row.totalProblems }} 项</el-tag></template>
          </el-table-column>
          <el-table-column label="涉及部件" width="112" align="center">
            <template #default="{ row }">{{ row.involvedParts }} / {{ row.partCount }} 类</template>
          </el-table-column>
          <el-table-column prop="topPart" label="高频部件" width="126" align="center">
            <template #default="{ row }"><el-tag type="warning" size="small" effect="plain">{{ row.topPart }}</el-tag></template>
          </el-table-column>
          <el-table-column label="排查状态" width="106" align="center">
            <template #default><el-tag type="warning" size="small" effect="light">待分析</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="132" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.device.id)">
                进入故障排查
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else-if="isInspectList" class="scene-list-container">
      <div class="data-table-wrap">
        <el-table
          :data="pagedInspectRows"
          style="width:100%"
          @row-click="(row: InspectRegionRow) => handleDeviceClick(row.device.id)"
        >
          <el-table-column label="序号" width="64" align="center" fixed="left">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="code" label="设备编号" width="180" fixed="left" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" width="190" fixed="left" show-overflow-tooltip />
          <el-table-column prop="location" label="使用地点" width="220" show-overflow-tooltip />
          <el-table-column prop="cycle" label="检验周期" width="100" align="center" />
          <el-table-column prop="lastDate" label="上一次检验时间" min-width="142" align="center" />
          <el-table-column prop="nextDate" label="下一次检验时间" min-width="142" align="center" />
          <el-table-column label="报警" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="inspectionAlarmTagType(row.status)" size="small" effect="light">
                {{ row.alarmLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="124" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.device.id)">
                查看检验
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else-if="isHealthAssessmentList" class="scene-list-container">
      <div class="data-table-wrap">
        <el-table
          :data="pagedHealthAssessmentRows"
          style="width:100%"
          @row-click="(row: HealthAssessmentRegionRow) => handleDeviceClick(row.device.id)"
        >
          <el-table-column label="序号" width="64" align="center" fixed="left">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="code" label="设备编号" width="180" fixed="left" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" width="190" fixed="left" show-overflow-tooltip />
          <el-table-column prop="location" label="使用地点" width="220" show-overflow-tooltip />
          <el-table-column label="金属结构健康状态" width="150" align="center">
            <template #default="{ row }">
              <el-tag :type="assessmentLevelTagType(row.structureLevel)" size="small" effect="light">
                {{ assessmentLevelText(row.structureLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-for="item in [
            ['gearboxLevel', '减速机健康状态'],
            ['brakeLevel', '制动器健康状态'],
            ['electricLevel', '电控系统健康状态'],
            ['wheelLevel', '车轮健康状态']
          ]" :key="item[0]" :prop="item[0]" :label="item[1]" width="140" align="center">
            <template #default="{ row }"><el-tag :type="assessmentLevelTagType(row[item[0] as keyof HealthAssessmentRegionRow] as AssessmentLevel)" size="small">{{ assessmentLevelText(row[item[0] as keyof HealthAssessmentRegionRow] as AssessmentLevel) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="124" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.device.id)">
                查看健康评估
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else-if="isCrackList" class="scene-list-container">
      <div class="data-table-wrap">
        <el-table
          :data="pagedCrackRows"
          style="width:100%"
          @row-click="(row: CrackRegionRow) => handleDeviceClick(row.device.id)"
        >
          <el-table-column label="序号" width="64" align="center" fixed="left">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="code" label="设备编号" width="180" fixed="left" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" width="190" fixed="left" show-overflow-tooltip />
          <el-table-column prop="location" label="使用地点" width="220" show-overflow-tooltip />
          <el-table-column prop="crackTime" label="最短裂纹萌生寿命" min-width="170" align="center" />
          <el-table-column prop="crackPoint" label="对应点位" min-width="140" show-overflow-tooltip />
          <el-table-column label="操作" width="124" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.device.id)">
                查看裂纹预测
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else-if="isFaultList" class="scene-list-container">
      <div class="data-table-wrap">
        <el-table
          :data="pagedFaultRows"
          style="width:100%"
          @row-click="(row: FaultRegionRow) => handleDeviceClick(row.device.id)"
        >
          <el-table-column label="序号" width="64" align="center" fixed="left">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="code" label="设备编号" width="180" fixed="left" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" width="190" fixed="left" show-overflow-tooltip />
          <el-table-column prop="location" label="使用地点" width="220" show-overflow-tooltip />
          <el-table-column label="减速机故障" width="120" align="center"><template #default="{ row }"><el-tag :type="row.gearboxStatus === '有故障' ? 'danger' : 'success'" size="small">{{ row.gearboxStatus }}</el-tag></template></el-table-column>
          <el-table-column label="制动器故障" width="120" align="center"><template #default="{ row }"><el-tag :type="row.brakeStatus === '有故障' ? 'danger' : 'success'" size="small">{{ row.brakeStatus }}</el-tag></template></el-table-column>
          <el-table-column label="车轮故障" width="120" align="center"><template #default="{ row }"><el-tag :type="row.wheelStatus === '有故障' ? 'danger' : 'success'" size="small">{{ row.wheelStatus }}</el-tag></template></el-table-column>
          <el-table-column prop="lastRefresh" label="诊断更新时间" min-width="150" show-overflow-tooltip />
          <el-table-column label="操作" width="124" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.device.id)">
                查看故障诊断
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else-if="isRiskList" class="scene-list-container">
      <div class="data-table-wrap">
        <el-table
          :data="pagedRiskRows"
          style="width:100%"
          @row-click="(row: RiskRegionRow) => handleDeviceClick(row.device.id)"
        >
          <el-table-column prop="rank" label="风险排名" width="88" align="center" fixed="left">
            <template #default="{ row }">
              <span class="risk-rank-no">{{ row.rank }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="code" label="设备编号" width="180" fixed="left" show-overflow-tooltip />
          <el-table-column prop="name" label="设备名称" width="190" fixed="left" show-overflow-tooltip />
          <el-table-column prop="location" label="使用地点" width="220" show-overflow-tooltip />
          <el-table-column prop="score" label="风险评估值" width="112" align="center">
            <template #default="{ row }">
              <span class="risk-score">{{ row.score }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="keyIndicators" label="主要风险指标" min-width="230" show-overflow-tooltip />
          <el-table-column label="操作" width="128" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="handleDeviceClick(row.device.id)">
                查看风险评估
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="scene-list-container-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredTotal"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <div v-else class="service-list-pending">
      <div class="service-list-pending-icon">
        <component v-if="activeServiceMeta" :is="activeServiceMeta.icon" />
      </div>
      <div class="service-list-pending-body">
        <div class="service-list-pending-title">{{ activeServiceMeta?.label ?? '服务列表' }}</div>
        <div class="service-list-pending-desc">
          {{ activeServiceMeta?.summary ?? '该服务列表内容待确认。' }}
        </div>
        <div class="service-list-pending-note">列表字段与记录口径待确认后接入。</div>
      </div>
    </div>

    <div style="height:16px"></div>

    <!-- 数据查看弹窗 -->
    <DeviceDataDialog v-model="dataDialog.visible" :device="dataDialog.device" :category="dataDialog.category" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { View } from '@element-plus/icons-vue'
import { useSceneStore } from '@/stores/scene'
import { getDevices, getDeviceMonitoringPoints, getRemoteMonitoringData, getSpotCheckBoard, getInspectionRows, hash, seedOf, getRepairGroups, getSupplyForDevice } from '@/mock'
import { getFaultTroubleshootingBoard } from '@/mock/faultTroubleshooting'
import { getDeviceRiskAssessment } from '@/mock/riskAssessment'
import type { Device, InspectStatus, RemoteTrendHistory, SceneId } from '@/mock'
import BasicDataOverview from '@/components/data/BasicDataOverview.vue'
import DeviceDataDialog from '@/components/data/DeviceDataDialog.vue'
import { flatServices, type ServiceKey } from '@/components/serviceCatalog'

// 8 类数据列（每类一个「查看」按钮 → 弹窗）
const dataColumns = [
  { key: 'point',   label: '日常点巡检数据' },
  { key: 'damage',  label: '损伤/故障维修数据' },
  { key: 'control', label: '安全监控数据' },
  { key: 'health',  label: '健康监测数据' },
  { key: 'risk',    label: '风险定量监测数据' },
  { key: 'inspect', label: '检验检测数据' },
  { key: 'basic',   label: '设备监管基础数据' },
  { key: 'supply',  label: '设备制造供给数据' }
]

const dataDialog = reactive<{ visible: boolean; device: Device | null; category: string }>({
  visible: false, device: null, category: 'basic'
})
function openData(device: Device, category: string) {
  dataDialog.device = device
  dataDialog.category = category
  dataDialog.visible = true
}

const router = useRouter()
const route  = useRoute()
const store  = useSceneStore()

const viewMode   = ref<'card' | 'list'>('list')
const filters    = ref({ name: '', status: '', type: '', group: '', affiliatedUnit: '', subsidiary: '' })
const allDevices = ref<Device[]>([])
const currentPage = ref(1)
const pageSize    = ref(20)

const sceneId   = computed(() => (route.params.id as SceneId) || store.currentScene)
const activeServiceKey = computed(() => store.activeService as ServiceKey | null)
const activeServiceMeta = computed(() =>
  activeServiceKey.value ? flatServices.find(s => s.key === activeServiceKey.value) : null
)
const DATA_HISTORY_SERVICES: ServiceKey[] = ['maintain', 'basicdata', 'supply']
const isRemoteList = computed(() => activeServiceKey.value === 'remote')
const isHealthMonitorList = computed(() => activeServiceKey.value === 'healthMonitor')
const isPointList = computed(() => activeServiceKey.value === 'point')
const isTroubleshootList = computed(() => activeServiceKey.value === 'troubleshoot')
const isInspectList = computed(() => activeServiceKey.value === 'inspect')
const isHealthAssessmentList = computed(() => activeServiceKey.value === 'health')
const isCrackList = computed(() => activeServiceKey.value === 'crack')
const isFaultList = computed(() => activeServiceKey.value === 'fault')
const isRiskList = computed(() => activeServiceKey.value === 'risk')
const isSpecialHistoryService = computed(() => ['maintain', 'basicdata', 'supply'].includes(activeServiceKey.value ?? ''))
const specialRows = computed(() => pagedDevices.value.map(device => {
  if (activeServiceKey.value === 'maintain') {
    const groups = getRepairGroups(device.id)
    const top = [...groups].sort((a, b) => b.records.length - a.records.length)[0]
    const urgencyRank = { 高: 3, 中: 2, 低: 1 }
    const urgent = [...groups].sort((a, b) =>
      urgencyRank[b.advice.urgency] - urgencyRank[a.advice.urgency] ||
      b.records.length - a.records.length
    )[0]

    return {
      device,
      code: device.code,
      name: device.name,
      location: device.location,
      repairCount: groups.reduce((total, group) => total + group.records.length, 0),
      frequentPart: top?.name ?? '—',
      repairAdvice: urgent?.advice.maintain ?? '—'
    }
  }

  const workLevel = device.technicalParams?.find(p => p.name === '工作级别')?.value ?? '—'
  if (activeServiceKey.value === 'basicdata') {
    return {
      device,
      code: device.code,
      name: device.name,
      location: device.location,
      installDate: device.installDate || '—',
      workLevel,
      manufacturer: device.manufacturer || '—',
      statusLabel: statusLabels[device.status] ?? device.status
    }
  }

  const supply = getSupplyForDevice(device)
  return {
    device,
    code: device.code,
    name: device.name,
    location: device.location,
    manufacturer: supply.manufacturer,
    model: supply.model,
    madeDate: supply.madeDate,
    docCount: supply.docs.length
  }
}))
const isHistoryList = computed(() =>
  !activeServiceKey.value || (DATA_HISTORY_SERVICES.includes(activeServiceKey.value) && !isHealthMonitorList.value)
)
const usesDeviceScope = computed(() =>
  isHistoryList.value ||
  isRemoteList.value ||
  isHealthMonitorList.value ||
  isPointList.value ||
  isTroubleshootList.value ||
  isInspectList.value ||
  isHealthAssessmentList.value ||
  isCrackList.value ||
  isFaultList.value ||
  isRiskList.value
)
watch(isRemoteList, (val) => {
  if (val) viewMode.value = 'list'
}, { immediate: true })
watch(isHealthMonitorList, (val) => {
  if (val) viewMode.value = 'list'
}, { immediate: true })
watch(isPointList, (val) => {
  if (val) viewMode.value = 'list'
}, { immediate: true })
watch(isTroubleshootList, (val) => {
  if (val) viewMode.value = 'list'
}, { immediate: true })
watch(isInspectList, (val) => {
  if (val) viewMode.value = 'list'
}, { immediate: true })
watch(isHealthAssessmentList, (val) => {
  if (val) viewMode.value = 'list'
}, { immediate: true })
watch(isCrackList, (val) => {
  if (val) viewMode.value = 'list'
}, { immediate: true })
watch(isFaultList, (val) => {
  if (val) viewMode.value = 'list'
}, { immediate: true })
watch(isRiskList, (val) => {
  if (val) viewMode.value = 'list'
}, { immediate: true })

const statusLabels: Record<string, string> = { running:'运行中', standby:'待机', stopped:'停机', maintenance:'维修中' }
const statusOptions = ['running','standby','stopped','maintenance'].map(v => ({ value:v, label:statusLabels[v] }))
/** 技术参数前6项列名（与 mock 中顺序一致） */
const techParamColumnNames = ['额定起重量', '跨度', '起升高度', '工作级别', '起升速度', '运行速度']

const deviceTypes = computed(() => [...new Set(allDevices.value.map(d => d.type))])

const filteredDevices = computed(() =>
  allDevices.value.filter(d => {
    if (filters.value.group      && d.group      !== filters.value.group)      return false
    if (filters.value.affiliatedUnit && d.affiliatedUnit !== filters.value.affiliatedUnit) return false
    if (filters.value.subsidiary && d.subsidiary !== filters.value.subsidiary) return false
    if (filters.value.name       && !d.name.includes(filters.value.name))       return false
    if (filters.value.status     && d.status    !== filters.value.status)       return false
    if (filters.value.type       && d.type      !== filters.value.type)       return false
    return true
  })
)
const filteredTotal = computed(() => filteredDevices.value.length)

const pagedDevices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredDevices.value.slice(start, start + pageSize.value)
})

type RemoteAlarmLevel = 'normal' | 'warning' | 'danger' | 'offline'
interface RemoteMonitorRow {
  device: Device
  code: string
  name: string
  type: string
  location: string
  online: boolean
  pointTotal: number
  abnormalCount: number
  offlineCount: number
  alarmLevel: RemoteAlarmLevel
  latestAlarmTime: string
  lastRefresh: string
}
interface SafetyMonitorRow {
  device: Device
  code: string
  name: string
  type: string
  location: string
  working: boolean
  monitorNormal: boolean
  warning: boolean
  latestAlarmTime: string
  alarmCount: number
}
type HealthState = '健康' | '亚健康'
interface HealthMonitorRow {
  device: Device
  code: string
  name: string
  type: string
  location: string
  working: boolean
  monitoring: '监测中' | '未监测'
  structureMonitorStatus: '正常' | '异常'
  electricStatus: '正常' | '异常'
  gearboxMonitorStatus: '正常' | '异常'
  brakeMonitorStatus: '正常' | '异常'
  wheelMonitorStatus: '正常' | '异常'
}
type PointInspectionStatus = 'done' | 'partial' | 'pending'
type PointHandlingStatus = 'none' | 'processing' | 'closed' | 'overdue'
interface PointInspectionRow {
  device: Device
  code: string
  name: string
  type: string
  location: string
  plannedCount: number
  completedCount: number
  todayProblems: number
  totalProblems: number
  topPart: string
  topProblem: string
  inspector: string
  latestTime: string
  status: PointInspectionStatus
  inspectionTime: string
  problemSummary: string
  handlingStatus: PointHandlingStatus
  yesterdayDone: boolean
}
interface TroubleshootRegionRow {
  device: Device
  code: string
  name: string
  location: string
  formCount: number
  totalProblems: number
  involvedParts: number
  partCount: number
  topPart: string
}
interface InspectRegionRow {
  device: Device
  code: string
  name: string
  type: string
  location: string
  cycle: string
  lastDate: string
  nextDate: string
  status: InspectStatus
  alarmLabel: string
}
type AssessmentLevel = 'normal' | 'warn' | 'danger'
interface StructureAssessmentPoint {
  structureObject: string
  pointName: string
  damageValue: number
  level: AssessmentLevel
  workTimeHours: number
}
interface HealthAssessmentRegionRow {
  device: Device
  code: string
  name: string
  type: string
  location: string
  structureLevel: AssessmentLevel
  electricLevel: AssessmentLevel
  gearboxLevel: AssessmentLevel
  brakeLevel: AssessmentLevel
  wheelLevel: AssessmentLevel
}
interface CrackRegionRow {
  device: Device
  code: string
  name: string
  type: string
  location: string
  crackPoint: string
  crackTime: string
}
type FaultModuleKey = 'gearbox' | 'wheel' | 'brake'
interface FaultRegionRow {
  device: Device
  code: string
  name: string
  type: string
  location: string
  level: AssessmentLevel
  gearboxStatus: '有故障' | '无故障'
  brakeStatus: '有故障' | '无故障'
  wheelStatus: '有故障' | '无故障'
  abnormalModuleCount: number
  dangerModuleCount: number
  dominantPart: string
  diagnosis: string
  prognosis: string
  maintain: string
  lastRefresh: string
}
interface RiskRegionRow {
  device: Device
  code: string
  name: string
  type: string
  location: string
  score: number
  grade4Count: number
  keyIndicators: string
  rank: number
}

const remoteAlarmLabels: Record<RemoteAlarmLevel, string> = {
  normal: '正常',
  warning: '预警',
  danger: '报警',
  offline: '离线'
}
const pointStatusLabels: Record<PointInspectionStatus, string> = {
  done: '已完成',
  partial: '部分完成',
  pending: '未完成'
}
const pointHandlingLabels: Record<PointHandlingStatus, string> = {
  none: '无问题',
  processing: '处理中',
  closed: '已处理',
  overdue: '待处理'
}

function remoteAlarmTagType(level: RemoteAlarmLevel) {
  const map: Record<RemoteAlarmLevel, 'success' | 'warning' | 'danger' | 'info'> = {
    normal: 'success',
    warning: 'warning',
    danger: 'danger',
    offline: 'info'
  }
  return map[level]
}

function pointStatusTagType(status: PointInspectionStatus) {
  const map: Record<PointInspectionStatus, 'success' | 'warning' | 'danger'> = {
    done: 'success',
    partial: 'warning',
    pending: 'danger'
  }
  return map[status]
}

function pointHandlingTagType(status: PointHandlingStatus) {
  const map: Record<PointHandlingStatus, 'success' | 'warning' | 'danger' | 'info'> = {
    none: 'success',
    processing: 'warning',
    closed: 'success',
    overdue: 'danger'
  }
  return map[status]
}

function healthStateTagType(state: HealthState) {
  return state === '健康' ? 'success' : 'warning'
}

function monitorStatusTagType(status: '正常' | '异常') {
  return status === '正常' ? 'success' : 'danger'
}

function assessmentLevelTagType(level: AssessmentLevel) {
  if (level === 'danger') return 'danger'
  if (level === 'warn') return 'warning'
  return 'success'
}

function assessmentLevelText(level: AssessmentLevel) {
  if (level === 'danger') return '异常'
  if (level === 'warn') return '亚健康'
  return '健康'
}

function faultLevelText(level: AssessmentLevel) {
  if (level === 'danger') return '高风险'
  if (level === 'warn') return '亚健康'
  return '健康'
}

function inspectionAlarmTagType(status: InspectStatus) {
  const map: Record<InspectStatus, 'success' | 'warning' | 'danger'> = {
    overdue: 'danger',
    urgent: 'danger',
    warning: 'warning',
    ok: 'success'
  }
  return map[status]
}

function stableMinuteOffset(id: string) {
  return id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 28
}

function formatRefreshTime(device: Device) {
  const d = new Date()
  d.setMinutes(d.getMinutes() - stableMinuteOffset(device.id))
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function buildRemoteRow(device: Device): RemoteMonitorRow {
  const points = getDeviceMonitoringPoints(device.id)
  const abnormalCount = points.filter(point => point.status === 'abnormal').length
  const offlineCount = points.filter(point => point.status === 'offline').length
  const alarmLevel: RemoteAlarmLevel =
    !device.online ? 'offline' :
    abnormalCount >= 2 || device.riskLevel === 'high' ? 'danger' :
    abnormalCount > 0 || offlineCount > 0 || device.riskLevel === 'medium' ? 'warning' :
    'normal'

  return {
    device,
    code: device.code,
    name: device.name,
    type: device.type,
    location: device.location,
    online: device.online,
    pointTotal: points.length,
    abnormalCount,
    offlineCount,
    alarmLevel,
    latestAlarmTime: device.latestAlarmTime ?? '—',
    lastRefresh: device.online ? formatRefreshTime(device) : '—'
  }
}

const pagedRemoteRows = computed(() =>
  pagedDevices.value.map(device => buildRemoteRow(device))
)

function maxCurrentText(device: Device) {
  const board = getRemoteMonitoringData(device)?.electricBoard
  const values = board?.currents.flatMap(row => [row.phaseA, row.phaseB, row.phaseC])
    .map(value => Number.parseFloat(value))
    .filter(value => Number.isFinite(value)) ?? []
  const max = values.length ? Math.max(...values) : 0
  return max ? `${max} A` : '—'
}

function buildSafetyRow(device: Device): SafetyMonitorRow {
  const board = getRemoteMonitoringData(device)?.electricBoard
  const limitAbnormalCount = board?.limits.filter(item => !item.ok).length ?? 0
  const seed = seedOf(device.id, 3101)
  const runningAlarmCount = board?.running.filter(item => item.status !== 'normal').length ?? 0
  const currentAlarmCount = board?.currents.filter(row =>
    [row.phaseA, row.phaseB, row.phaseC].some(value => Number.parseFloat(value) >= 200)
  ).length ?? 0
  const alarmCount = limitAbnormalCount + runningAlarmCount + currentAlarmCount
  const working = device.status === 'running' && device.online && hash(seed + 13) % 100 < 82
  const monitorNormal = device.online && alarmCount < 2
  const warning = alarmCount > 0 || device.riskLevel === 'high'

  return {
    device,
    code: device.code,
    name: device.name,
    type: device.type,
    location: device.location,
    working,
    monitorNormal,
    warning,
    latestAlarmTime: warning ? device.latestAlarmTime ?? formatRefreshTime(device) : '—',
    alarmCount
  }
}

function isHealthPointName(name: string) {
  return !name.includes('电控') && !name.includes('三相电流')
}

function buildHealthRow(device: Device): HealthMonitorRow {
  const data = getRemoteMonitoringData(device)
  const seed = seedOf(device.id, 3201)
  const moduleAvailable = (items: unknown[] | undefined) => Array.isArray(items) && items.length > 0
  const moduleStatus = (items: unknown[] | undefined, salt: number): '正常' | '异常' =>
    !device.online || !moduleAvailable(items) ? '异常' : hash(seed + salt) % 100 < 8 ? '异常' : '正常'
  const structureAvailable = moduleAvailable(data?.stress) || moduleAvailable(data?.damage) || moduleAvailable(data?.rope)

  return {
    device,
    code: device.code,
    name: device.name,
    type: device.type,
    location: device.location,
    working: device.status === 'running' && device.online && hash(seed + 17) % 100 < 80,
    monitoring: device.online ? '监测中' : '未监测',
    structureMonitorStatus: !device.online || !structureAvailable ? '异常' : hash(seed + 31) % 100 < 8 ? '异常' : '正常',
    electricStatus: !device.online || !data?.electricBoard || hash(seed + 37) % 100 < 8 ? '异常' : '正常',
    gearboxMonitorStatus: moduleStatus(data?.gearbox, 41),
    brakeMonitorStatus: moduleStatus(data?.brake, 43),
    wheelMonitorStatus: moduleStatus(data?.wheel, 47)
  }
}

const pagedSafetyRows = computed(() =>
  pagedDevices.value.map(device => buildSafetyRow(device))
)

const pagedHealthRows = computed(() =>
  pagedDevices.value.map(device => buildHealthRow(device))
)

function buildPointRow(device: Device): PointInspectionRow {
  const board = getSpotCheckBoard(device.id)
  const seed = seedOf(device.id, 2407)
  const plannedCount = 1 + (hash(seed + 11) % 3)
  const completionRoll = hash(seed + 23) % 100
  const completedCount = completionRoll < 78
    ? plannedCount
    : completionRoll < 92
      ? Math.max(1, plannedCount - 1)
      : 0
  const status: PointInspectionStatus =
    completedCount >= plannedCount ? 'done' :
    completedCount > 0 ? 'partial' :
    'pending'
  const todayProblems = completedCount === 0
    ? 0
    : Math.min(board.totalProblems, hash(seed + 37) % 7)
  const topItem = board.items.find(item => item.count > 0) ?? board.items[0]
  const topProblem = todayProblems > 0
    ? topItem?.topProblems[0]?.replace('×', ' x ') ?? '现场复查问题'
    : '当日未发现问题'
  const hour = 8 + (hash(seed + 41) % 10)
  const minute = hash(seed + 43) % 60
  const inspectors = ['张工', '李工', '王工', '赵工']
  const handlingStatus: PointHandlingStatus = todayProblems === 0
    ? 'none'
    : status === 'pending'
      ? 'overdue'
      : hash(seed + 53) % 100 < 58
        ? 'closed'
        : 'processing'
  const inspectionTime = completedCount > 0
    ? `今日 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    : '今日未巡检'
  return {
    device,
    code: device.code,
    name: device.name,
    type: device.type,
    location: device.location,
    plannedCount,
    completedCount,
    todayProblems,
    totalProblems: board.totalProblems,
    topPart: todayProblems > 0 ? board.topPart : '—',
    topProblem,
    inspector: completedCount > 0 ? inspectors[hash(seed + 47) % inspectors.length] : '—',
    latestTime: completedCount > 0 ? inspectionTime : '—',
    status,
    yesterdayDone: completedCount > 0,
    problemSummary: todayProblems > 0 ? `${topProblem}，共 ${todayProblems} 项` : '未发现问题',
    handlingStatus
  }
}

const pointRows = computed(() =>
  filteredDevices.value.map(device => buildPointRow(device))
)

const pagedPointRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return pointRows.value.slice(start, start + pageSize.value)
})

const troubleshootRows = computed<TroubleshootRegionRow[]>(() =>
  filteredDevices.value.map(device => {
    const board = getFaultTroubleshootingBoard(device.id)
    return {
      device,
      code: device.code,
      name: device.name,
      location: device.location,
      formCount: board.formCount,
      totalProblems: board.totalProblems,
      involvedParts: board.involvedParts,
      partCount: board.items.length,
      topPart: board.topPart
    }
  })
)

const pagedTroubleshootRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return troubleshootRows.value.slice(start, start + pageSize.value)
})

const pointSummary = computed(() => {
  const rows = pointRows.value
  return rows.reduce(
    (acc, row) => ({
      planned: acc.planned + row.plannedCount,
      completed: acc.completed + row.completedCount,
      problems: acc.problems + row.todayProblems
    }),
    { planned: 0, completed: 0, problems: 0 }
  )
})

function buildInspectRegionRows(): InspectRegionRow[] {
  const deviceMap = new Map(filteredDevices.value.map(device => [device.id, device]))
  return getInspectionRows(filteredDevices.value.map(device => ({ id: device.id, name: device.name })), 'inspection')
    .map(row => {
      const device = deviceMap.get(row.deviceId)
      if (!device) return null
      return {
        device,
        code: device.code,
        name: device.name,
        type: device.type,
        location: device.location,
        cycle: `${row.cycleY} 年`,
        lastDate: row.lastDate,
        nextDate: row.nextDate,
        status: row.status,
        alarmLabel: row.status === 'overdue'
          ? `已逾期 ${Math.abs(row.daysUntil)} 天`
          : row.daysUntil <= 30
            ? `已报警，剩余 ${row.daysUntil} 天`
            : '未报警'
      }
    })
    .filter((row): row is InspectRegionRow => Boolean(row))
}

const inspectRows = computed(() => buildInspectRegionRows())

const pagedInspectRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return inspectRows.value.slice(start, start + pageSize.value)
})

const inspectSummary = computed(() => ({
  alerts: inspectRows.value.filter(row => row.status === 'overdue' || row.status === 'urgent').length
}))

const STRUCTURE_TWIN_POSITIONS: readonly string[] = [
  '主梁跨中区',
  '主梁支座区',
  '支腿顶部节点',
  '端梁腹板',
  '下翼缘监测',
  '加强筋焊缝',
  '小车轨道梁',
  '刚性腿连接',
  '柔性腿连接',
  '主梁上翼缘',
  '主梁下翼缘',
  '端梁连接板',
  '支腿与主梁',
  '大车轨道侧'
]
const STRUCTURE_HOURS_24 = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function assessmentHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h) || 1
}

function positionFromMonitorLabel(label: string) {
  const left = label.includes('·') ? label.split('·')[1] : label
  return left.replace(/（\d+#）/g, '').trim()
}

function structureObjectOf(position: string) {
  if (position.includes('主梁') || position.includes('翼缘')) return '主梁'
  if (position.includes('端梁')) return '端梁'
  if (position.includes('腿')) return '支腿'
  if (position.includes('车')) return '运行机构'
  if (position.includes('加强筋') || position.includes('连接板')) return '附属结构'
  return '其他结构'
}

function damageLevelOf(value: number): AssessmentLevel {
  if (value >= 0.85) return 'danger'
  if (value >= 0.7) return 'warn'
  return 'normal'
}

function computeTwinTrendMetrics(deviceId: string): { position: string; history: RemoteTrendHistory }[] {
  const dSeed = assessmentHash(String(deviceId))
  return STRUCTURE_TWIN_POSITIONS.map((position, i) => {
    const base = 68 + i * 3.5 + (dSeed % 20) / 3
    const amp = 7 + i % 7
    const salt = assessmentHash(`dt-${i}-${position}`)
    const values = STRUCTURE_HOURS_24.map((_, hi) => {
      const phase = (hi + (dSeed ^ salt) % 11) / 3.8
      const v = base + amp * Math.sin(phase) + ((dSeed + hi) % 5) / 3
      return Math.round(v * 10) / 10
    })
    return {
      position,
      history: { kind: 'trend' as const, times: STRUCTURE_HOURS_24, values, valueLabel: 'με' }
    }
  })
}

function buildStructureAssessmentPoints(device: Device): StructureAssessmentPoint[] {
  const data = getRemoteMonitoringData(device)
  const stressRows = (data?.stress ?? []).filter(item => item.history.kind === 'trend') as Array<{
    label: string
    status: 'normal' | 'warn' | 'danger'
    history: RemoteTrendHistory
  }>
  const measuredPeaks = stressRows.map(item => Math.max(...item.history.values))
  const measuredAmplitudes = stressRows.map(item => Math.max(...item.history.values) - Math.min(...item.history.values))
  const maxMeasuredPeak = Math.max(...measuredPeaks, 1)
  const maxMeasuredAmplitude = Math.max(...measuredAmplitudes, 1)

  const measured = stressRows.map(item => {
    const values = item.history.values
    const current = values[values.length - 1] ?? 0
    const first = values[0] ?? current
    const peak = Math.max(...values)
    const valley = Math.min(...values)
    const amplitude = peak - valley
    const trendStrength = Math.abs(current - first)
    const statusWeight = item.status === 'danger' ? 1 : item.status === 'warn' ? 0.72 : 0.4
    const damageValue = clamp(
      peak / maxMeasuredPeak * 0.42 +
      amplitude / maxMeasuredAmplitude * 0.28 +
      trendStrength / maxMeasuredPeak * 0.12 +
      statusWeight * 0.18,
      0.12,
      0.96
    )
    const position = positionFromMonitorLabel(item.label)
    return {
      structureObject: structureObjectOf(position),
      pointName: item.label,
      damageValue,
      level: damageLevelOf(damageValue),
      workTimeHours: Math.floor(damageValue * 48000)
    }
  })

  const twinMetrics = computeTwinTrendMetrics(device.id)
  const allTwinValues = twinMetrics.flatMap(item => item.history.values)
  const maxTwinVal = Math.max(...allTwinValues, 1)
  const twin = twinMetrics.map(item => {
    const values = item.history.values
    const peak = Math.max(...values)
    const valley = Math.min(...values)
    const amplitude = peak - valley
    const damageValue = clamp(peak / maxTwinVal * 0.42 + amplitude / maxTwinVal * 0.28 + 0.38, 0.12, 0.96)
    return {
      structureObject: structureObjectOf(item.position),
      pointName: item.position,
      damageValue,
      level: damageLevelOf(damageValue),
      workTimeHours: Math.floor(damageValue * 48000)
    }
  })

  return [...measured, ...twin]
}

function worstAssessmentLevel(levels: AssessmentLevel[]) {
  if (levels.includes('danger')) return 'danger'
  if (levels.includes('warn')) return 'warn'
  return 'normal'
}

function formatPredictedCrackTime(damageValue: number, workTimeHours: number) {
  if (damageValue >= 1) return '已萌生'
  if (damageValue <= 0) return '大于10年'
  const remainingHours = (workTimeHours * (1 - damageValue)) / damageValue
  if (remainingHours <= 24) return '24小时内'
  const remainingDays = Math.floor(remainingHours / 24)
  if (remainingDays <= 30) return `约 ${remainingDays} 天`
  const remainingMonths = Math.floor(remainingDays / 30)
  if (remainingMonths <= 12) return `约 ${remainingMonths} 个月`
  const remainingYears = (remainingDays / 365).toFixed(1)
  return Number.parseFloat(remainingYears) > 10 ? '大于10年' : `约 ${remainingYears} 年`
}

function crackTimeRank(label: string) {
  if (label === '已萌生') return 0
  if (label === '24小时内') return 1
  const match = label.match(/约\s*([\d.]+)\s*(天|个月|年)/)
  if (!match) return 99999
  const value = Number.parseFloat(match[1])
  const unit = match[2]
  if (unit === '天') return value
  if (unit === '个月') return value * 30
  return value * 365
}

function buildHealthAssessmentRow(device: Device): HealthAssessmentRegionRow {
  const points = buildStructureAssessmentPoints(device)
  const levels = points.map(point => point.level)
  const structureLevel = worstAssessmentLevel(levels)
  const data = getRemoteMonitoringData(device)

  return {
    device,
    code: device.code,
    name: device.name,
    type: device.type,
    location: device.location,
    structureLevel,
    electricLevel: worstAssessmentLevel((data?.electricBoard?.limits ?? []).map(item => item.ok ? 'normal' : 'danger')),
    gearboxLevel: worstAssessmentLevel((data?.gearbox ?? []).map(item => item.status as AssessmentLevel)),
    brakeLevel: worstAssessmentLevel((data?.brake ?? []).map(item => item.status as AssessmentLevel)),
    wheelLevel: worstAssessmentLevel((data?.wheel ?? []).map(item => item.status as AssessmentLevel)),
  }
}

const healthAssessmentRows = computed(() =>
  filteredDevices.value.map(device => buildHealthAssessmentRow(device))
)

const pagedHealthAssessmentRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return healthAssessmentRows.value.slice(start, start + pageSize.value)
})

function buildCrackRow(device: Device): CrackRegionRow {
  const points = buildStructureAssessmentPoints(device)
  const crackCandidates = points.map(point => ({ point, time: formatPredictedCrackTime(point.damageValue, point.workTimeHours) }))
    .sort((a, b) => crackTimeRank(a.time) - crackTimeRank(b.time))

  return {
    device,
    code: device.code,
    name: device.name,
    type: device.type,
    location: device.location,
    crackPoint: crackCandidates[0]?.point.pointName ?? '—',
    crackTime: crackCandidates[0]?.time ?? '—'
  }
}

const crackRows = computed(() =>
  filteredDevices.value.map(device => buildCrackRow(device))
)

const pagedCrackRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return crackRows.value.slice(start, start + pageSize.value)
})

const FAULT_MODULE_LABELS: Record<FaultModuleKey, string> = {
  gearbox: '减速机',
  wheel: '行走车轮',
  brake: '制动器'
}

const FAULT_DIAGNOSIS_TEXT: Record<FaultModuleKey, Record<AssessmentLevel, { diagnosis: string; prognosis: string; maintain: string }>> = {
  gearbox: {
    normal: {
      diagnosis: '减速机温度、声级与振动均处于正常区间，未见齿轮啮合冲击或轴承故障特征。',
      prognosis: '按当前趋势短期内无明显故障风险，可稳定运行至下一保养周期。',
      maintain: '维持周期性测温、声级与振动监测，按计划做好油液检测与趋势归档。'
    },
    warn: {
      diagnosis: '疑似润滑不足或齿面/轴承早期磨损，温度、声级或振动出现阶段性偏高。',
      prognosis: '若工况维持，劣化将缓慢发展，建议在 1-2 个保养周期内安排复核。',
      maintain: '加密监测频次，检查润滑油位与油质，复核联轴器对中，必要时更换润滑油并复查轴承。'
    },
    danger: {
      diagnosis: '存在齿轮断齿、轴承损坏或严重缺油的高风险特征，振动与温升明显异常。',
      prognosis: '短期内有突发失效风险，继续运行可能造成停机或二次损坏。',
      maintain: '立即停机检查减速机内部齿轮与轴承，更换损坏件与润滑油，确认合格前不得投运。'
    }
  },
  wheel: {
    normal: {
      diagnosis: '行走车轮温度、噪声与振动平稳，未见啃轨、踏面剥离或轴承异响特征。',
      prognosis: '按当前趋势短期内无异常风险，可稳定运行至下一保养周期。',
      maintain: '维持周期性温声振监测，定期复核车轮踏面、轮缘磨损量与轨道间隙。'
    },
    warn: {
      diagnosis: '疑似车轮啃轨、踏面磨损不均或轴承早期故障，振动与噪声间歇性升高。',
      prognosis: '若不干预，磨损与冲击将逐步加剧，建议近期安排检查与调整。',
      maintain: '检查轮缘磨损与轨道直线度，调整大车跨度与车轮对中，必要时更换轴承。'
    },
    danger: {
      diagnosis: '存在严重啃轨、踏面剥离或轴承损坏的高风险特征，温升与冲击明显异常。',
      prognosis: '短期内有卡轨或轴承抱死风险，继续运行可能损伤轨道与车体结构。',
      maintain: '立即停机检查车轮、轴承与轨道，校正啃轨并更换损坏车轮或轴承。'
    }
  },
  brake: {
    normal: {
      diagnosis: '制动器图像识别未见闸瓦裂纹、过度磨损或异物附着，制动间隙处于正常范围。',
      prognosis: '按当前磨损速率，闸瓦剩余寿命充足，可稳定使用至下一保养周期。',
      maintain: '维持周期性图像巡检与制动间隙复核，按计划清洁制动面并记录磨损趋势。'
    },
    warn: {
      diagnosis: '检测到闸瓦轻度磨损或边缘异常，制动间隙偏大，疑似早期劣化。',
      prognosis: '若不调整，磨损与间隙将进一步扩大，建议近期安排制动器保养。',
      maintain: '加密图像巡检，清洁制动面，调整制动间隙至规定范围，必要时更换闸瓦。'
    },
    danger: {
      diagnosis: '识别到制动面裂纹、异物嵌入或闸瓦过度磨损，制动间隙超限，存在制动失效风险。',
      prognosis: '短期内有制动失效高风险，继续作业可能引发溜钩或冲顶事故。',
      maintain: '立即停机更换闸瓦并清除异物，重新调整制动间隙与制动力矩，确认合格前不得作业。'
    }
  }
}

function faultPriority(level: AssessmentLevel) {
  if (level === 'danger') return 3
  if (level === 'warn') return 2
  return 1
}

function moduleWorstLevel(items: { status: 'normal' | 'warn' | 'danger' }[] = []): AssessmentLevel {
  return worstAssessmentLevel(items.map(item => item.status as AssessmentLevel))
}

function buildFaultRow(device: Device): FaultRegionRow {
  const data = getRemoteMonitoringData(device)
  const moduleLevels: Array<{ key: FaultModuleKey; level: AssessmentLevel; count: number }> = [
    { key: 'gearbox', level: moduleWorstLevel(data?.gearbox), count: data?.gearbox.filter(item => item.status !== 'normal').length ?? 0 },
    { key: 'wheel', level: moduleWorstLevel(data?.wheel), count: data?.wheel.filter(item => item.status !== 'normal').length ?? 0 },
    { key: 'brake', level: moduleWorstLevel(data?.brake), count: data?.brake.filter(item => item.status !== 'normal').length ?? 0 }
  ]
  const level = worstAssessmentLevel(moduleLevels.map(item => item.level))
  const abnormalModules = moduleLevels.filter(item => item.level !== 'normal')
  const dangerModules = moduleLevels.filter(item => item.level === 'danger')
  const dominant = [...moduleLevels].sort((a, b) =>
    faultPriority(b.level) - faultPriority(a.level) ||
    b.count - a.count
  )[0]
  const text = FAULT_DIAGNOSIS_TEXT[dominant.key][dominant.level]

  return {
    device,
    code: device.code,
    name: device.name,
    type: device.type,
    location: device.location,
    level,
    abnormalModuleCount: abnormalModules.length,
    dangerModuleCount: dangerModules.length,
    dominantPart: level === 'normal'
      ? '整机机构运行平稳'
      : `${FAULT_MODULE_LABELS[dominant.key]}${dominant.count > 0 ? `（异常 ${dominant.count} 项）` : ''}`,
    diagnosis: text.diagnosis,
    prognosis: text.prognosis,
    maintain: text.maintain,
    lastRefresh: data?.lastRefresh ?? '—'
    ,gearboxStatus: moduleLevels[0].level === 'normal' ? '无故障' : '有故障'
    ,brakeStatus: moduleLevels[2].level === 'normal' ? '无故障' : '有故障'
    ,wheelStatus: moduleLevels[1].level === 'normal' ? '无故障' : '有故障'
  }
}

const faultRows = computed<FaultRegionRow[]>(() =>
  filteredDevices.value
    .map(device => buildFaultRow(device))
    .sort((a, b) =>
      faultPriority(b.level) - faultPriority(a.level) ||
      b.dangerModuleCount - a.dangerModuleCount ||
      b.abnormalModuleCount - a.abnormalModuleCount ||
      a.code.localeCompare(b.code, 'zh-CN')
    )
)

const pagedFaultRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return faultRows.value.slice(start, start + pageSize.value)
})

const faultSummary = computed(() => ({
  dangerCount: faultRows.value.filter(row => row.level === 'danger').length,
  attentionCount: faultRows.value.filter(row => row.level !== 'normal').length
}))

function buildRiskRow(device: Device): Omit<RiskRegionRow, 'rank'> {
  const assessment = getDeviceRiskAssessment(device)
  const grade4Indicators = assessment.indicators.filter(item => item.grade === 4)
  const keyIndicators = (grade4Indicators.length ? grade4Indicators : [...assessment.indicators].sort((a, b) => b.grade - a.grade).slice(0, 3))
    .map(item => item.name)
    .join('、')

  return {
    device,
    code: device.code,
    name: device.name,
    type: device.type,
    location: device.location,
    score: assessment.comprehensiveScore,
    grade4Count: grade4Indicators.length,
    keyIndicators
  }
}

const riskRows = computed<RiskRegionRow[]>(() =>
  filteredDevices.value
    .map(device => buildRiskRow(device))
    .sort((a, b) =>
      b.score - a.score ||
      b.grade4Count - a.grade4Count ||
      a.code.localeCompare(b.code, 'zh-CN')
    )
    .map((row, index) => ({ ...row, rank: index + 1 }))
)

const pagedRiskRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return riskRows.value.slice(start, start + pageSize.value)
})

// Reset to page 1 when filters or scene change
watch(filteredDevices, () => { currentPage.value = 1 })

function formatTechParams(params: { name: string; value: string }[] | undefined): string {
  if (!params?.length) return '—'
  return params.map(p => `${p.name}: ${p.value}`).join('；')
}

function applyFilter() { /* reactive computed handles filtering */ }
function resetFilter()  {
  filters.value = {
    ...filters.value,
    name: '',
    status: '',
    type: ''
  }
}

function applyRouteQueryFilters() {
  const group = typeof route.query.group === 'string' ? route.query.group : ''
  const affiliatedUnit = typeof route.query.affiliatedUnit === 'string' ? route.query.affiliatedUnit : ''
  const subsidiary = typeof route.query.subsidiary === 'string' ? route.query.subsidiary : ''
  filters.value = {
    ...filters.value,
    group,
    affiliatedUnit,
    subsidiary
  }
}

function handleDeviceClick(id: string) {
  store.setDevice(id, !!store.activeService)
  router.push(`/device/${id}`)
}

function loadData() {
  const sid = sceneId.value
  store.setScene(sid)
  const res = getDevices(sid, 1, 9999)
  allDevices.value = res.list
  applyRouteQueryFilters()
}

onMounted(loadData)
watch(() => route.params.id, loadData)
watch(() => route.query, applyRouteQueryFilters)
</script>

<style scoped>
.scene-content-scroll.route-content {
  display: block;
  min-height: 0;
}

.scene-header-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 12px;
}

.scene-header--compact {
  justify-content: flex-end;
  margin-bottom: 12px;
}

.scene-header-badge {
  font-size: 16px;
  font-weight: 700;
  border-radius: var(--radius-full);
  padding: 0 16px;
  height: 28px;
}

.filter-tags-section {
  margin-bottom: 16px;
  padding: 14px 16px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md, 8px);
}
.filter-tags-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
}
.filter-tags-row + .filter-tags-row {
  margin-top: 10px;
}
.filter-tags-label {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  width: 56px;
}
.filter-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.filter-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-content-bg);
  border: 1px solid var(--color-border-light);
  border-radius: 100px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s, border-color 0.2s;
}
.filter-tag:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: rgba(22, 119, 255, 0.06);
}
.filter-tag.active {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.tech-params-cell {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.device-card-row--tech .device-card-tech {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 0;
  background: var(--color-card-bg);
  border: 1px solid var(--color-border-light);
  border-bottom: none;
  border-radius: var(--radius-md, 8px) var(--radius-md, 8px) 0 0;
}

.filter-bar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.filter-bar-total {
  font-size: 12px;
  color: var(--color-text-muted);
}
.scene-list-container {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
}
.filter-bar + .scene-list-container {
  border-top-color: var(--color-border-light);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
.risk-rank-no,
.risk-score {
  font-weight: 800;
  color: var(--color-text-primary);
}
.fault-count {
  font-weight: 800;
  color: var(--color-success);
}
.fault-count.warn {
  color: var(--color-warning);
}
.fault-count.danger {
  color: var(--color-danger);
}
.point-progress {
  font-size: 13px;
  color: var(--color-text-primary);
}
.point-problem-text {
  font-weight: 600;
  color: var(--color-text-secondary);
}
.point-problem-text.warn {
  color: #b45309;
}
.scene-list-container .data-table-wrap {
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
.scene-list-container .device-grid {
  padding: 16px;
}
.scene-list-container-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-light);
}
.remote-count {
  font-weight: 700;
  color: var(--color-success);
}
.remote-count.warn {
  color: var(--color-warning);
}
.remote-count.offline {
  color: var(--color-danger);
}
.table-link-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  cursor: pointer;
}
.table-link-button:hover,
.table-link-button:focus-visible {
  color: var(--color-primary-dark, var(--color-primary));
  text-decoration: underline;
}
.service-list-pending {
  min-height: 240px;
  padding: 28px 30px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--color-card-shadow);
  display: flex;
  align-items: flex-start;
  gap: 18px;
}
.service-list-pending-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  background: rgba(22, 119, 255, 0.08);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.service-list-pending-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 680px;
}
.service-list-pending-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
}
.service-list-pending-desc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}
.service-list-pending-note {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>

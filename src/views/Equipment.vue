<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Icon from '../components/Icon.vue';
import Panel from '../components/Panel.vue';
import MetricCard from '../components/MetricCard.vue';
import StatusBadge from '../components/StatusBadge.vue';
import WorkshopMap from '../components/WorkshopMap.vue';
import MachineArt from '../components/MachineArt.vue';
import MiniChart from '../components/MiniChart.vue';
import { state } from '../stores/platform';
const route = useRoute();
const selected = ref(String(route.query.device || 'CNC-03')),
  filter = ref(''),
  trend = ref('完好率');
watch(
  () => route.query.device,
  (id) => {
    if (id) selected.value = String(id);
  },
);
const device = computed(
  () => state.devices.find((d) => d.id === selected.value) || state.devices[0]!,
);
const events = computed(() => state.orders.filter((o) => o.status !== '已关闭'));
const counts = computed(() => ({
  total: state.devices.length,
  running: state.devices.filter((d) => d.status === '运行中').length,
  idle: state.devices.filter((d) => d.status === '待机').length,
  fault: state.devices.filter((d) => d.status === '故障停机').length,
}));
const plans = [
  { device: 'LAT-01', name: '数控车床', type: '定期保养', date: '2026-10-25', left: '3天' },
  {
    device: 'CNC-02',
    name: '立式加工中心',
    type: '更换刀库润滑油',
    date: '2026-10-28',
    left: '6天',
  },
  { device: 'UT-01', name: '循环冷却泵', type: '定期保养', date: '2026-10-30', left: '8天' },
  { device: 'CNC-05', name: '龙门加工中心', type: '精度检测', date: '2026-11-04', left: '13天' },
];
</script>
<template>
  <div class="page-heading">
    <div>
      <div class="flex gap-12">
        <h1>车间设备数字孪生</h1>
        <span class="live-indicator"><i class="device-dot running" />设备状态概览</span>
      </div>
      <p>可视车间全貌，及时响应设备异常。</p>
    </div>
    <div class="heading-actions">
      <RouterLink to="/assets" class="btn"><Icon name="database" :size="14" />设备台账</RouterLink
      ><RouterLink :to="'/repair?device=' + device.id" class="btn primary"
        ><Icon name="scan" :size="15" />安灯报修</RouterLink
      >
    </div>
  </div>
  <div class="equipment-layout">
    <div class="stack">
      <div class="metrics-grid equipment-metrics">
        <MetricCard
          label="设备总数"
          :value="counts.total"
          unit="台"
          icon="factory"
          hint="当前台账设备"
        /><MetricCard
          label="运行中"
          :value="counts.running"
          unit="台"
          icon="play"
          tone="green"
          hint="设备正常作业"
        /><MetricCard
          label="待机"
          :value="counts.idle"
          unit="台"
          icon="pause"
          tone="orange"
          hint="等待生产任务"
        /><MetricCard
          label="故障停机"
          :value="counts.fault"
          unit="台"
          icon="alert"
          tone="red"
          hint="请关注安灯事件"
        />
      </div>
      <Panel title="车间平面图" subtitle="机加工车间"
        ><template #actions
          ><select v-model="filter" class="map-filter" aria-label="筛选地图设备状态">
            <option value="">全部状态</option>
            <option>运行中</option>
            <option>待机</option>
            <option>故障停机</option>
            <option>离线</option>
          </select></template
        >
        <div class="legend equipment-legend">
          <span><i class="device-dot running" />运行中</span
          ><span><i class="device-dot idle" />待机</span
          ><span><i class="device-dot fault" />故障停机</span
          ><span><i class="device-dot offline" />离线</span>
        </div>
        <WorkshopMap :selected="device.id" :filter="filter" @select="(id) => (selected = id)" />
        <div class="map-caption">
          <span><Icon name="info" :size="11" />点击设备查看右侧详情 · 设备图形可后续替换</span
          ><span>当前数据：本地演示</span>
        </div></Panel
      >
      <div class="equipment-bottom">
        <Panel title="设备健康趋势"
          ><template #actions
            ><select v-model="trend" class="map-filter" aria-label="趋势指标">
              <option>完好率</option>
              <option>平均振动</option>
              <option>平均温度</option>
            </select></template
          ><MiniChart
            kind="line"
            :values="
              trend === '完好率'
                ? [81, 84, 89, 86, 90, 90, 94]
                : trend === '平均温度'
                  ? [42, 45, 48, 43, 46, 44, 45]
                  : [2.1, 2.5, 1.8, 2.3, 1.9, 2.2, 1.8]
            "
            :height="170"
            :unit="trend === '完好率' ? '%' : trend === '平均温度' ? '℃' : 'mm/s'" /></Panel
        ><Panel title="近期维保计划" flush
          ><template #actions
            ><RouterLink to="/assets" class="text-button"
              >设备台账 <Icon name="right" :size="12" /></RouterLink
          ></template>
          <div class="table-wrap">
            <table class="table-compact">
              <thead>
                <tr>
                  <th>设备</th>
                  <th>保养类型</th>
                  <th>计划日期</th>
                  <th>剩余</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in plans" :key="p.device">
                  <td>
                    <button class="text-button" @click="selected = p.device">{{ p.device }}</button>
                  </td>
                  <td>{{ p.type }}</td>
                  <td>{{ p.date.slice(5) }}</td>
                  <td>{{ p.left }}</td>
                </tr>
              </tbody>
            </table>
          </div></Panel
        >
      </div>
    </div>
    <div class="stack">
      <Panel title="设备详情" :subtitle="device.id"
        ><template #actions><StatusBadge :value="device.status" dot /></template>
        <div class="equipment-hero">
          <MachineArt :kind="device.kind" :active="device.status === '故障停机'" />
          <div>
            <strong>{{ device.id }}</strong>
            <p>{{ device.name }}</p>
            <small><Icon name="pin" :size="11" />{{ device.zone }}</small>
          </div>
        </div>
        <div class="device-meta-list">
          <span
            >设备编码 <strong>SB-{{ device.id }}</strong></span
          ><span
            >投用日期 <strong>{{ device.commissioned }}</strong></span
          >
        </div>
        <div class="sensor-grid">
          <div :class="{ danger: device.temperature > 65 }">
            <Icon name="temperature" :size="20" /><span
              >主轴温度<strong
                >{{ device.status === '离线' ? '—' : device.temperature }}<small> ℃</small></strong
              ></span
            >
          </div>
          <div :class="{ danger: device.vibration > 4 }">
            <Icon name="activity" :size="20" /><span
              >振动值<strong
                >{{ device.status === '离线' ? '—' : device.vibration }}<small> mm/s</small></strong
              ></span
            >
          </div>
        </div>
        <div class="device-current-task">
          <span><Icon name="file" :size="14" />当前加工任务</span>
          <p>{{ device.task }}</p>
          <div class="progress-display">
            <div class="progress"><span :style="{ width: device.progress + '%' }" /></div>
            {{ device.progress }}%
          </div>
        </div>
        <div class="device-trend-label">近 24 小时温度趋势（℃）</div>
        <MiniChart
          kind="line"
          :values="
            device.status === '离线'
              ? [0, 0, 0, 0, 0, 0, 0]
              : [
                  device.temperature * 0.7,
                  device.temperature * 0.8,
                  device.temperature * 0.75,
                  device.temperature * 0.9,
                  device.temperature * 0.85,
                  device.temperature * 0.94,
                  device.temperature,
                ]
          "
          :labels="['14:00', '18:00', '22:00', '02:00', '06:00', '10:00', '14:00']"
          :height="125"
          unit="℃"
          :color="device.status === '故障停机' ? '#f1767f' : '#348ffa'"
        />
        <div class="flex gap-8 mt-16">
          <RouterLink
            :to="'/assets?device=' + device.id"
            class="btn outline-blue small"
            style="flex: 1"
            ><Icon name="database" :size="13" />设备档案</RouterLink
          ><RouterLink :to="'/repair?device=' + device.id" class="btn danger small" style="flex: 1"
            ><Icon name="wrench" :size="13" />发起报修</RouterLink
          >
        </div></Panel
      ><Panel title="安灯事件" flush
        ><template #actions
          ><RouterLink to="/orders" class="text-button"
            >更多 <Icon name="right" :size="12" /></RouterLink
        ></template>
        <div class="table-wrap">
          <table class="table-compact">
            <thead>
              <tr>
                <th>时间</th>
                <th>设备 / 事件</th>
                <th>等级</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in events.slice(0, 5)" :key="o.id">
                <td>{{ o.reported.slice(11) }}</td>
                <td>
                  <RouterLink class="text-button" :to="'/orders?id=' + o.id">{{
                    o.device
                  }}</RouterLink>
                  <div style="font-size: 10px; color: #95a3b7; margin-top: 4px">{{ o.fault }}</div>
                </td>
                <td><StatusBadge :value="o.urgency" /></td>
              </tr>
            </tbody>
          </table></div
      ></Panel>
      <div class="data-source-footer">
        <Icon name="database" :size="17" />
        <div>
          <strong>设备数据 / 人工录入</strong>
          <p>已预留 IoT 数据对接位置，当前为演示值。</p>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.live-indicator {
  font-size: 10px;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8a9db3;
}
.equipment-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 322px;
  gap: 18px;
}
.equipment-metrics {
  gap: 12px;
  margin: 0;
}
.equipment-metrics :deep(.metric-card) {
  padding: 12px 14px;
}
.equipment-metrics :deep(.metric-value) {
  font-size: 27px;
}
.equipment-metrics :deep(.metric-head) {
  font-size: 10px;
}
.equipment-metrics :deep(.metric-icon) {
  width: 27px;
  height: 27px;
}
.equipment-metrics :deep(.metric-icon svg) {
  width: 18px;
}
.equipment-bottom {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 16px;
}
.map-filter {
  font-size: 10px;
  padding: 5px 8px;
  color: #8c9fb8;
  border-color: #e7edf5;
}
.equipment-legend {
  justify-content: flex-end;
  margin: 1px 0 12px;
}
.equipment-layout :deep(.workshop-map) {
  min-height: 370px;
}
.equipment-layout :deep(.zone-count) {
  display: none;
}
.equipment-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 17px;
}
.equipment-hero .machine-art {
  width: 135px;
  background: #f4f8fc;
  border: 1px solid #e9f0f7;
  border-radius: 6px;
  max-height: none;
  flex-shrink: 0;
}
.equipment-hero strong {
  font-size: 19px;
  font-weight: 600;
}
.equipment-hero p {
  font-size: 11px;
  color: #8c9eb5;
  margin: 7px 0 10px;
}
.equipment-hero small {
  display: flex;
  gap: 4px;
  align-items: center;
  color: #9baec4;
  font-size: 10px;
}
.device-meta-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 10px;
  border-top: 1px solid #f0f3f7;
  padding: 12px 0 16px;
  color: #a0aec0;
}
.device-meta-list > span {
  display: flex;
  justify-content: space-between;
}
.device-meta-list strong {
  font-size: 10px;
  font-weight: 400;
  color: #7a90ad;
}
.sensor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.sensor-grid > div {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 9px;
  border: 1px solid #e6eff9;
  border-radius: 5px;
  background: #f9fbff;
  color: #7c9ec9;
}
.sensor-grid > div.danger {
  background: #fffafa;
  color: #ec7480;
  border-color: #fae5e8;
}
.sensor-grid span {
  font-size: 9px;
  color: #99a9bf;
}
.sensor-grid strong {
  font-size: 22px;
  display: block;
  margin-top: 6px;
  font-weight: 600;
  color: #5b8dcc;
}
.sensor-grid .danger strong {
  color: #ee6c78;
}
.sensor-grid small {
  font-size: 9px;
  font-weight: 400;
}
.device-current-task {
  padding: 15px 12px;
  background: #f7faff;
  border: 1px solid #e6eff9;
  border-radius: 5px;
  margin: 13px 0 18px;
}
.device-current-task > span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  color: #9aacc4;
}
.device-current-task p {
  font-size: 11px;
  margin: 9px 0 12px;
  color: #6782a5;
}
.device-trend-label {
  font-size: 10px;
  color: #7e94b0;
  margin-bottom: 5px;
}
.data-source-footer {
  display: flex;
  gap: 11px;
  padding: 0 9px;
  color: #7898bd;
}
.data-source-footer strong {
  font-size: 10px;
  font-weight: 500;
}
.data-source-footer p {
  font-size: 9px;
  line-height: 1.8;
  color: #a0afc1;
  margin-top: 4px;
}
@media (min-width: 1700px) {
  .equipment-layout {
    grid-template-columns: minmax(0, 1fr) 365px;
  }
  .equipment-layout :deep(.workshop-map) {
    min-height: 450px;
  }
}
@media (max-width: 1200px) {
  .equipment-layout {
    grid-template-columns: 1fr;
  }
  .equipment-layout > .stack:last-child {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
  .equipment-layout :deep(.workshop-map) {
    min-height: 400px;
  }
  .equipment-metrics :deep(.metric-head) {
    font-size: 11px;
  }
}
@media (max-width: 760px) {
  .equipment-layout > .stack:last-child,
  .equipment-bottom {
    display: flex;
    flex-direction: column;
  }
  .equipment-layout :deep(.workshop-map) {
    min-height: 285px;
  }
  .equipment-layout :deep(.machine-caption) {
    font-size: 6px;
  }
  .live-indicator {
    display: none;
  }
  .equipment-bottom > .panel {
    width: 100%;
  }
}
</style>

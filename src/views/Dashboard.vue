<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import Icon from '../components/Icon.vue';
import Panel from '../components/Panel.vue';
import MetricCard from '../components/MetricCard.vue';
import StatusBadge from '../components/StatusBadge.vue';
import WorkshopMap from '../components/WorkshopMap.vue';
import MiniChart from '../components/MiniChart.vue';
import { state, toast, now } from '../stores/platform';
const router = useRouter();
const operating = computed(
  () =>
    Math.round(
      (state.devices.filter((d) => d.status === '运行中').length / state.devices.length) * 1000,
    ) / 10,
);
const pending = computed(() => state.notices.filter((n) => n.status !== '已完成').length);
const orderCount = computed(() => state.orders.filter((o) => o.status === '待受理').length);
const checked = ref<boolean[]>([false, false, false, false]);
const todos = [
  {
    title: '跟进 CNC-03 主轴改造执行进度',
    time: '今天 16:00',
    tag: '技术',
    path: '/notices/JSZD-2026-0081',
  },
  {
    title: '确认 LAT-03 刀具更换计划',
    time: '今天 17:00',
    tag: '设备',
    path: '/equipment?device=LAT-03',
  },
  { title: '处理本班人员考勤异常', time: '今天 18:00', tag: '考勤', path: '/attendance' },
  { title: '完成早班生产交接记录', time: '今天 15:00', tag: '生产', path: '/handover' },
];
const quickLinks = [
  { label: '通知单检索', icon: 'search', path: '/notices' },
  { label: '考勤管理', icon: 'calendar', path: '/attendance' },
  { label: '安灯报修', icon: 'scan', path: '/repair?device=CNC-03' },
  { label: '交接班', icon: 'handover', path: '/handover' },
];
const updated = ref(now());
</script>
<template>
  <div class="page-heading">
    <div>
      <h1>
        工作台<span class="welcome-dot">/</span
        ><span class="welcome-name">{{ state.settings.owner }}，工作顺利</span>
      </h1>
      <p>聚焦车间动态，让每一项工作都有序推进。</p>
    </div>
    <div class="heading-actions">
      <span class="heading-note"><i class="device-dot running" />车间综合运行概览</span
      ><button
        class="btn"
        @click="
          updated = now();
          toast('已刷新当前本地演示数据');
        "
      >
        <Icon name="refresh" :size="14" />刷新数据
      </button>
    </div>
  </div>
  <div class="metrics-grid">
    <MetricCard
      label="待跟踪技术通知单"
      :value="pending"
      unit="条"
      icon="file"
      trend="4 条"
      :trend-up="true"
      hint="较昨日新增"
    /><MetricCard
      label="今日出勤人数"
      value="86"
      unit="/ 92 人"
      icon="users"
      tone="green"
      hint="今日出勤率 93.5%"
    /><MetricCard
      label="设备运行率"
      :value="operating + '%'"
      icon="cog"
      tone="orange"
      hint="运行中 / 台账设备"
      ><span class="metric-inline"
        >{{ state.devices.filter((d) => d.status === '运行中').length }} /
        {{ state.devices.length }} 台</span
      ></MetricCard
    ><MetricCard
      label="待受理安灯工单"
      :value="orderCount"
      unit="条"
      icon="bell"
      tone="red"
      hint="需要及时响应"
      ><RouterLink to="/orders" class="metric-arrow"><Icon name="external" :size="14" /></RouterLink
    ></MetricCard>
  </div>
  <div class="dashboard-grid">
    <div class="dashboard-primary">
      <Panel title="车间设备状态总览" subtitle="机加工车间"
        ><template #actions
          ><div class="legend">
            <span><i class="device-dot running" />运行</span
            ><span><i class="device-dot idle" />待机</span
            ><span><i class="device-dot fault" />故障</span
            ><span><i class="device-dot offline" />离线</span>
          </div>
          <RouterLink class="text-button" to="/equipment"
            ><Icon name="maximize" :size="13" /></RouterLink></template
        ><WorkshopMap
          compact
          @select="(id) => router.push({ path: '/equipment', query: { device: id } })"
        />
        <div class="map-caption">
          <span><Icon name="info" :size="11" />点击设备查看运行详情</span
          ><span>{{ updated }} · 演示示意图</span>
        </div></Panel
      ><Panel title="最新技术通知单" flush
        ><template #actions
          ><RouterLink class="text-button" to="/notices"
            >全部通知单 <Icon name="right" :size="13" /></RouterLink
        ></template>
        <div class="table-wrap">
          <table class="table-compact">
            <thead>
              <tr>
                <th>通知单编号 / 标题</th>
                <th>关联设备</th>
                <th>优先级</th>
                <th>状态</th>
                <th>截止日期</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in state.notices.slice(0, 5)" :key="n.id">
                <td>
                  <RouterLink :to="'/notices/' + n.id" class="notice-title-link">{{
                    n.title
                  }}</RouterLink>
                  <div class="table-id small-id">{{ n.id }}</div>
                </td>
                <td>{{ n.device }}</td>
                <td><StatusBadge :value="n.priority" /></td>
                <td><StatusBadge :value="n.status" dot /></td>
                <td>{{ n.deadline.slice(5, 10) }}</td>
                <td>
                  <RouterLink :to="'/notices/' + n.id" class="text-button"
                    ><Icon name="right" :size="15"
                  /></RouterLink>
                </td>
              </tr>
            </tbody>
          </table></div
      ></Panel>
    </div>
    <div class="dashboard-secondary">
      <Panel title="实时告警"
        ><template #actions
          ><RouterLink to="/orders" class="text-button"
            >更多 <Icon name="right" :size="12" /></RouterLink></template
        ><button
          v-for="(o, i) in state.orders.filter((o) => o.status !== '已关闭').slice(0, 4)"
          :key="o.id"
          class="alert-row alert-link"
          @click="router.push({ path: '/orders', query: { id: o.id } })"
        >
          <span class="alert-symbol" :class="{ warning: o.urgency === '一般' }"
            ><Icon :name="o.urgency === '一般' ? 'alert' : 'activity'" :size="13" /></span
          ><span class="alert-row-main"
            ><strong>{{ o.device }} · {{ o.fault }}</strong>
            <p>
              {{ i === 0 ? '设备状态异常，请及时关注' : o.description.slice(0, 19) + '…' }}
            </p></span
          ><time>{{ o.reported.slice(11) }}</time>
        </button></Panel
      ><Panel title="我的待办"
        ><template #actions
          ><span>{{ checked.filter(Boolean).length }} / {{ todos.length }} 已完成</span></template
        >
        <div v-for="(item, i) in todos" :key="item.title" class="todo-row">
          <input
            v-model="checked[i]"
            type="checkbox"
            class="todo-checkbox"
            :aria-label="'完成' + item.title"
          />
          <div>
            <RouterLink :to="item.path"
              ><p>{{ item.title }}</p></RouterLink
            >
            <div class="todo-meta">
              <StatusBadge :value="item.tag" /><small>{{ item.time }}</small>
            </div>
          </div>
        </div></Panel
      ><Panel title="快捷入口"
        ><div class="quick-links">
          <RouterLink v-for="q in quickLinks" :key="q.path" :to="q.path" class="quick-link"
            ><Icon :name="q.icon" :size="19" /><span>{{ q.label }}</span></RouterLink
          >
        </div></Panel
      >
    </div>
  </div>
  <div class="dashboard-bottom">
    <Panel title="近 7 天考勤趋势"
      ><template #actions
        ><span class="chart-legend"
          ><span><i />出勤人数</span></span
        ><RouterLink to="/attendance" class="text-button"
          >查看详情 <Icon name="right" :size="12" /></RouterLink></template
      ><MiniChart :height="169" /></Panel
    ><Panel title="生产协同动态"
      ><template #actions><span>最近更新</span></template>
      <div class="activity-feed">
        <div
          v-for="(a, i) in [
            {
              name: '设备维修班',
              text: 'CNC-03 主轴维修已进入备件更换阶段',
              time: '10 分钟前',
              icon: 'wrench',
            },
            {
              name: '机加一班',
              text: '已完成早班交接内容填写，待提交确认',
              time: '28 分钟前',
              icon: 'handover',
            },
            {
              name: '技术管理',
              text: '同步新增 3 条技术通知单，等待班组接收',
              time: '1 小时前',
              icon: 'file',
            },
          ]"
          :key="i"
          class="feed-item"
        >
          <span class="feed-icon"><Icon :name="a.icon" :size="15" /></span>
          <div>
            <strong>{{ a.name }}</strong>
            <p>{{ a.text }}</p>
          </div>
          <time>{{ a.time }}</time>
        </div>
      </div></Panel
    >
  </div>
</template>
<style scoped>
.welcome-dot {
  color: #d9e1ed;
  margin: 0 13px;
  font-size: 19px;
  font-weight: 400;
}
.welcome-name {
  font-size: 17px;
  font-weight: 450;
  color: #647a96;
}
.metric-inline {
  margin-left: auto;
  color: #7993b3;
  font-size: 10px;
}
.metric-arrow {
  margin-left: auto;
}
.small-id {
  font-size: 9px;
  margin-top: 5px;
}
.notice-title-link {
  color: #4e6889;
  font-weight: 450;
  font-size: 11px;
}
.notice-title-link:hover {
  color: var(--blue);
}
.alert-link {
  width: 100%;
  background: transparent;
  border-left: 0;
  border-right: 0;
  border-top: 0;
  text-align: left;
  cursor: pointer;
}
.alert-link:hover {
  background: #fafcff;
}
.todo-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 5px;
}
.todo-meta .badge {
  font-size: 8px;
  padding: 1px 5px;
}
.feed-item {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f3f7;
}
.feed-item:last-child {
  border: 0;
}
.feed-icon {
  width: 29px;
  height: 29px;
  background: #f0f6ff;
  display: grid;
  place-items: center;
  color: #6a9bd9;
  border-radius: 7px;
  flex-shrink: 0;
}
.feed-item strong {
  font-size: 11px;
  font-weight: 500;
  color: #647b97;
}
.feed-item p {
  font-size: 10px;
  color: #9aa8bb;
  margin-top: 5px;
  line-height: 1.7;
}
.feed-item time {
  font-size: 9px;
  color: #a6b1c1;
  margin-left: auto;
  white-space: nowrap;
}
@media (max-width: 760px) {
  .welcome-name {
    font-size: 13px;
  }
  .welcome-dot {
    margin: 0 8px;
  }
  .feed-item p {
    font-size: 9px;
  }
}
</style>

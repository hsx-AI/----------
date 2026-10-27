<script setup lang="ts">
import { computed, ref } from 'vue';
import Icon from '../components/Icon.vue';
import Panel from '../components/Panel.vue';
import MetricCard from '../components/MetricCard.vue';
import StatusBadge from '../components/StatusBadge.vue';
import MiniChart from '../components/MiniChart.vue';
import { state, downloadCsv, toast } from '../stores/platform';
import { teams } from '../data/seed';
const period = ref('2026-10'),
  team = ref('');
const notices = computed(() =>
  state.notices.filter(
    (n) => n.issued.startsWith(period.value) && (!team.value || n.team === team.value),
  ),
);
const orders = computed(() => state.orders.filter((o) => o.reported.startsWith(period.value)));
const summaries = computed(() =>
  teams
    .filter((t) => !team.value || team.value === t)
    .map((t) => ({
      team: t,
      total: notices.value.filter((n) => n.team === t).length,
      done: notices.value.filter((n) => n.team === t && n.status === '已完成').length,
      progress: Math.round(
        notices.value.filter((n) => n.team === t).reduce((s, n) => s + n.progress, 0) /
          Math.max(1, notices.value.filter((n) => n.team === t).length),
      ),
      issues: state.issues.filter((i) => i.team === t && i.date.startsWith(period.value)).length,
      handover: state.handovers.filter((h) => h.team === t && h.date.startsWith(period.value))
        .length,
    })),
);
const reportCards = computed(() => [
  {
    label: '本期技术通知单',
    value: notices.value.length,
    icon: 'file',
    hint: '按下发时间统计',
    tone: 'blue',
  },
  {
    label: '通知单完成率',
    value: notices.value.length
      ? Math.round(
          (notices.value.filter((n) => n.status === '已完成').length / notices.value.length) * 100,
        ) + '%'
      : '—',
    icon: 'clipboard',
    hint: '已完成 / 本期下发',
    tone: 'green',
  },
  {
    label: '本期安灯报修',
    value: orders.value.length,
    icon: 'bell',
    hint: '全车间 · 按报修时间统计',
    tone: 'orange',
  },
  {
    label: '工单关闭率',
    value: orders.value.length
      ? Math.round(
          (orders.value.filter((o) => o.status === '已关闭').length / orders.value.length) * 100,
        ) + '%'
      : '—',
    icon: 'checks',
    hint: '全车间 · 已关闭 / 本期报修',
    tone: 'blue',
  },
]);
function exportReport() {
  downloadCsv(
    `${period.value}-班组综合报表.csv`,
    ['班组', '技术通知单', '已完成', '平均进度', '考勤异常', '交接记录'],
    summaries.value.map((s) => [s.team, s.total, s.done, s.progress + '%', s.issues, s.handover]),
  );
  toast('班组综合报表已导出');
}
</script>
<template>
  <div class="page-heading">
    <div>
      <h1>统计报表</h1>
      <p>汇集核心业务数据，让管理决策有据可依。</p>
    </div>
    <div class="heading-actions">
      <input v-model="period" type="month" aria-label="报表月份" /><select
        v-model="team"
        aria-label="报表班组"
      >
        <option value="">全部班组</option>
        <option v-for="t in teams" :key="t">{{ t }}</option></select
      ><button class="btn primary" @click="exportReport">
        <Icon name="download" :size="14" />导出报表
      </button>
    </div>
  </div>
  <div class="report-period-note">
    <Icon name="info" :size="14" />统计范围：{{ period || '未选择月份' }} · {{ team || '全部班组'
    }}<span>安灯指标按全车间统计 · 本地演示数据</span>
  </div>
  <div class="metrics-grid">
    <MetricCard
      v-for="c in reportCards"
      :key="c.label"
      :label="c.label"
      :value="c.value"
      :icon="c.icon"
      :hint="c.hint"
      :tone="c.tone"
    />
  </div>
  <div class="reports-grid">
    <Panel title="技术通知单类型分布"
      ><div class="horizontal-bars">
        <div
          v-for="(t, i) in ['设备维修', '故障处理', '计划检修', '工艺改进', '技术改进']"
          :key="t"
        >
          <label>{{ t }}</label>
          <div>
            <span
              :style="{
                width:
                  (notices.length
                    ? (notices.filter((n) => n.type === t).length / notices.length) * 100
                    : 0) + '%',
                background: ['#3c8ff5', '#f08b91', '#68b9eb', '#a387db', '#39c2a1'][i],
              }"
            />
          </div>
          <strong>{{ notices.filter((n) => n.type === t).length }}</strong>
        </div>
      </div></Panel
    ><Panel title="工单处理状态分布"
      ><div class="horizontal-bars">
        <div v-for="(s, i) in ['待受理', '已受理', '维修中', '待验收', '已关闭']" :key="s">
          <label>{{ s }}</label>
          <div>
            <span
              :style="{
                width:
                  (orders.length
                    ? (orders.filter((o) => o.status === s).length / orders.length) * 100
                    : 0) + '%',
                background: ['#f18b97', '#8cb2e8', '#f1bc69', '#65b6f1', '#40c29f'][i],
              }"
            />
          </div>
          <strong>{{ orders.filter((o) => o.status === s).length }}</strong>
        </div>
      </div></Panel
    >
  </div>
  <Panel title="班组综合统计" :subtitle="period" flush
    ><template #actions><span>通知单 · 考勤异常 · 交接记录</span></template>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>责任班组</th>
            <th>技术通知单</th>
            <th>已完成</th>
            <th>平均执行进度</th>
            <th>考勤异常</th>
            <th>交接记录</th>
            <th>综合状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in summaries" :key="s.team">
            <td>
              <span class="team-cell"><Icon name="users" :size="16" />{{ s.team }}</span>
            </td>
            <td>{{ s.total }} 条</td>
            <td>{{ s.done }} 条</td>
            <td>
              <div class="progress-display">
                <div class="progress"><span :style="{ width: s.progress + '%' }" /></div>
                {{ s.progress }}%
              </div>
            </td>
            <td>{{ s.issues }} 条</td>
            <td>{{ s.handover }} 条</td>
            <td>
              <StatusBadge
                :value="s.total === 0 ? '无记录' : s.progress === 100 ? '已完成' : '跟踪中'"
              />
            </td>
          </tr>
        </tbody>
      </table></div
  ></Panel>
  <div class="reports-bottom">
    <Panel title="设备状态分布"
      ><div class="device-state-summary">
        <div v-for="s in ['运行中', '待机', '故障停机', '离线']" :key="s">
          <strong>{{ state.devices.filter((d) => d.status === s).length }}</strong
          ><StatusBadge :value="s" dot /><span
            >占比
            {{
              Math.round(
                (state.devices.filter((d) => d.status === s).length / state.devices.length) * 100,
              )
            }}%</span
          >
        </div>
      </div></Panel
    ><Panel title="考勤趋势示例"
      ><template #actions><span>固定演示 · 2026 年 10 月 16–22 日</span></template
      ><MiniChart :height="150" kind="line" color="#29bc9e"
    /></Panel>
  </div>
  <div class="report-data-note">
    报表汇总会随本地通知单、工单和交接操作更新。设备状态为当前快照，考勤趋势为固定演示序列。
  </div>
</template>
<style scoped>
.report-period-note {
  font-size: 10px;
  color: #8ea2bd;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 15px;
  margin-bottom: 17px;
  border: 1px solid #e4edf9;
  background: #f2f7ff;
  border-radius: 6px;
}
.report-period-note > span {
  margin-left: auto;
  font-size: 9px;
  color: #a7b6cb;
}
.reports-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}
.horizontal-bars {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 15px 7px 15px 0;
}
.horizontal-bars > div {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 11px;
}
.horizontal-bars label {
  min-width: 65px;
  color: #8b9eb8;
}
.horizontal-bars > div > div {
  flex: 1;
  height: 9px;
  background: #f0f4f9;
  border-radius: 3px;
  overflow: hidden;
}
.horizontal-bars > div > div > span {
  height: 100%;
  display: block;
  border-radius: 3px;
  min-width: 0;
  transition: width 0.3s;
}
.horizontal-bars strong {
  min-width: 18px;
  color: #6984a6;
  font-size: 12px;
  font-weight: 500;
}
.team-cell {
  display: flex;
  gap: 9px;
  align-items: center;
  color: #6c87a8;
}
.team-cell svg {
  color: #8eadd3;
}
.reports-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 18px;
}
.device-state-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  padding: 23px 0;
}
.device-state-summary > div {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 13px;
  border-right: 1px solid #edf2f8;
}
.device-state-summary > div:last-child {
  border: 0;
}
.device-state-summary strong {
  font-size: 29px;
  color: #6686b0;
  font-weight: 500;
}
.device-state-summary > div > span:last-child {
  font-size: 9px;
  color: #a5b3c7;
}
.report-data-note {
  text-align: center;
  font-size: 10px;
  color: #a3b2c6;
  padding: 20px 10px;
  line-height: 1.8;
}
@media (max-width: 1000px) {
  .reports-grid,
  .reports-bottom {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .report-period-note {
    flex-wrap: wrap;
    line-height: 1.8;
  }
  .report-period-note > span {
    margin-left: 21px;
    width: 100%;
  }
  .device-state-summary {
    gap: 7px;
  }
  .device-state-summary strong {
    font-size: 26px;
  }
}
</style>

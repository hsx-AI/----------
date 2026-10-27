<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import Icon from '../components/Icon.vue';
import Panel from '../components/Panel.vue';
import MetricCard from '../components/MetricCard.vue';
import StatusBadge from '../components/StatusBadge.vue';
import Modal from '../components/Modal.vue';
import MiniChart from '../components/MiniChart.vue';
import { state, toast, downloadCsv, now } from '../stores/platform';
import { teams, TODAY } from '../data/seed';
const month = ref('2026-10'),
  team = ref(''),
  issueQuery = ref(''),
  issueType = ref(''),
  issueStatus = ref(''),
  modal = ref(''),
  error = ref('');
const dateParts = computed(() => month.value.split('-').map(Number));
const days = computed(() =>
  new Date(dateParts.value[0] || 2026, dateParts.value[1] || 10, 0).getDate(),
);
const activeTeams = computed(() => (team.value ? [team.value] : teams));
const week = (day: number) =>
  ['日', '一', '二', '三', '四', '五', '六'][
    new Date(dateParts.value[0]!, dateParts.value[1]! - 1, day).getDay()
  ];
const shiftCode = (t: string, day: number) =>
  state.schedules[`${month.value}/${t}/${day}`] ||
  [
    '早',
    '早',
    '早',
    '早',
    '早',
    '休',
    '休',
    '中',
    '中',
    '中',
    '中',
    '中',
    '休',
    '休',
    '夜',
    '夜',
    '夜',
    '夜',
    '夜',
    '休',
    '休',
  ][(day - 1 + teams.indexOf(t) * 7) % 21]!;
const tone = (s: string) => ({ 早: 'early', 中: 'middle', 夜: 'night', 休: 'rest' })[s] || 'rest';
const issues = computed(() =>
  state.issues.filter(
    (i) =>
      i.date.startsWith(month.value) &&
      (!team.value || i.team === team.value) &&
      (!issueQuery.value || `${i.name} ${i.employee}`.includes(issueQuery.value)) &&
      (!issueType.value || i.type === issueType.value) &&
      (!issueStatus.value || i.status === issueStatus.value),
  ),
);
const application = reactive({
  name: '',
  team: teams[0]!,
  type: '事假',
  start: TODAY + 'T08:00',
  end: TODAY + 'T17:00',
  reason: '',
});
const editSchedule = reactive({ team: teams[0]!, day: 22, shift: '早' });
const issueId = ref<number | null>(null),
  decision = ref('已通过'),
  decisionNote = ref('');
function openApplication(type: string) {
  modal.value = type;
  error.value = '';
  application.reason = '';
  application.name = '';
}
function submitApplication() {
  if (
    !application.name.trim() ||
    !application.reason.trim() ||
    !application.start ||
    !application.end
  ) {
    error.value = '请填写姓名、时间与申请原因';
    return;
  }
  if (application.start > application.end) {
    error.value = '结束时间不能早于开始时间';
    return;
  }
  state.applications.unshift({
    id: `SQ-${Date.now()}`,
    kind: modal.value,
    ...application,
    status: '待审批',
    created: now(),
  });
  modal.value = '';
  toast('申请已保存至本地演示申请列表');
}
function handleIssue(id: number) {
  issueId.value = id;
  decisionNote.value = '';
  decision.value = '已通过';
  error.value = '';
  modal.value = '异常处理';
}
function saveDecision() {
  if (!decisionNote.value.trim()) {
    error.value = '请填写处理说明';
    return;
  }
  const issue = state.issues.find((i) => i.id === issueId.value);
  if (issue) {
    issue.status = decision.value;
    issue.note = decisionNote.value;
  }
  modal.value = '';
  toast('考勤异常处理结果已保存');
}
function editShift(t: string, d: number) {
  Object.assign(editSchedule, { team: t, day: d, shift: shiftCode(t, d) });
  modal.value = '排班调整';
}
function saveShift() {
  state.schedules[`${month.value}/${editSchedule.team}/${editSchedule.day}`] = editSchedule.shift;
  modal.value = '';
  toast('排班已保存至本地');
}
function exportData() {
  downloadCsv(
    '考勤异常记录.csv',
    [
      '姓名',
      '工号',
      '班组',
      '日期',
      '班次',
      '上班打卡',
      '下班打卡',
      '异常类型',
      '审核状态',
      '处理说明',
    ],
    issues.value.map((i) => [
      i.name,
      i.employee,
      i.team,
      i.date,
      i.shift,
      i.clockIn,
      i.clockOut,
      i.type,
      i.status,
      i.note,
    ]),
  );
  toast('当前筛选的异常记录已导出');
}
</script>
<template>
  <div class="page-heading">
    <div>
      <h1>考勤管理</h1>
      <p>人员出勤一目了然，班组排班有序协同。</p>
    </div>
    <div class="heading-actions">
      <input
        v-model="month"
        type="month"
        aria-label="考勤月份"
        min="2020-01"
        max="2035-12"
      /><select v-model="team" aria-label="考勤班组">
        <option value="">全部班组</option>
        <option v-for="t in teams" :key="t">{{ t }}</option></select
      ><button class="btn" @click="exportData"><Icon name="download" :size="14" />导出记录</button>
    </div>
  </div>
  <div class="metrics-grid">
    <MetricCard
      label="今日应到"
      value="92"
      unit="人"
      icon="users"
      hint="当前演示人员基数"
    /><MetricCard
      label="今日实到"
      value="86"
      unit="人"
      icon="clipboard"
      tone="green"
      hint="今日出勤率 93.5%"
    /><MetricCard
      label="今日请假"
      value="4"
      unit="人"
      icon="clock"
      tone="orange"
      hint="事假 2 · 病假 1 · 调休 1"
    /><MetricCard
      label="异常待处理"
      :value="state.issues.filter((i) => i.status === '待处理').length"
      unit="条"
      icon="alert"
      tone="red"
      hint="请及时核实处理"
    />
  </div>
  <div class="section-grid">
    <div class="stack">
      <Panel title="本月排班与出勤情况" :subtitle="month.replace('-', '年') + '月'" flush
        ><template #actions
          ><div class="schedule-legend">
            <span v-for="s in ['早', '中', '夜', '休']" :key="s"
              ><i :class="tone(s)" />{{ s === '休' ? '休息' : s + '班' }}</span
            >
          </div></template
        >
        <div class="schedule-scroll">
          <table class="schedule-table">
            <thead>
              <tr>
                <th class="schedule-team">班组 / 日期</th>
                <th v-for="d in days" :key="d" :class="{ today: month === '2026-10' && d === 22 }">
                  <strong>{{ d }}</strong
                  ><small>{{ week(d) }}</small>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in activeTeams" :key="t">
                <td class="schedule-team">
                  <strong>{{ t }}</strong
                  ><small>{{ [24, 24, 24, 20][teams.indexOf(t)] }} 人</small>
                </td>
                <td v-for="d in days" :key="d" :class="{ today: month === '2026-10' && d === 22 }">
                  <button
                    :class="['shift-cell', tone(shiftCode(t, d))]"
                    :aria-label="`${t} ${month}-${d} ${shiftCode(t, d)}班，点击调整`"
                    @click="editShift(t, d)"
                  >
                    {{ shiftCode(t, d) }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="schedule-footnote">
          <Icon
            name="info"
            :size="12"
          />点击班次可调整排班。当前为演示轮班，分厂考勤制度待核对配置。
        </div></Panel
      ><Panel title="考勤异常处理" flush
        ><template #actions
          ><span>{{ issues.length }} 条记录</span></template
        >
        <div class="issue-filters">
          <select v-model="issueType" aria-label="异常类型">
            <option value="">全部异常类型</option>
            <option v-for="t in ['缺卡（下班）', '未打卡', '迟到', '早退']" :key="t">
              {{ t }}
            </option></select
          ><select v-model="issueStatus" aria-label="审核状态">
            <option value="">全部审核状态</option>
            <option>待处理</option>
            <option>已通过</option>
            <option>已驳回</option>
          </select>
          <div class="search-input">
            <Icon name="search" :size="13" /><input
              v-model="issueQuery"
              placeholder="搜索姓名或工号"
              aria-label="搜索考勤异常人员"
            />
          </div>
        </div>
        <div class="table-wrap">
          <table class="table-compact">
            <thead>
              <tr>
                <th>姓名 / 工号</th>
                <th>班组</th>
                <th>日期 / 班次</th>
                <th>上班打卡</th>
                <th>下班打卡</th>
                <th>异常类型</th>
                <th>审核状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in issues" :key="i.id">
                <td>
                  <span class="table-title">{{ i.name }}</span>
                  <div class="table-id" style="margin-top: 5px; font-size: 9px">
                    {{ i.employee }}
                  </div>
                </td>
                <td>{{ i.team }}</td>
                <td>
                  {{ i.date.slice(5) }} <small class="muted">{{ i.shift }}</small>
                </td>
                <td>{{ i.clockIn }}</td>
                <td>{{ i.clockOut }}</td>
                <td>{{ i.type }}</td>
                <td><StatusBadge :value="i.status" /></td>
                <td>
                  <button
                    class="text-button"
                    @click="
                      i.status === '待处理'
                        ? handleIssue(i.id)
                        : ((issueId = i.id), (modal = '异常详情'))
                    "
                  >
                    {{ i.status === '待处理' ? '处理' : '查看' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="!issues.length" class="empty-state">
            <Icon name="clipboard" :size="30" />
            <p>该月份和筛选条件下暂无异常记录</p>
          </div>
        </div></Panel
      ><Panel v-if="state.applications.length" title="本地申请记录" flush
        ><div class="table-wrap">
          <table class="table-compact">
            <thead>
              <tr>
                <th>申请人</th>
                <th>申请类型</th>
                <th>起止时间</th>
                <th>原因</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in state.applications" :key="a.id">
                <td>{{ a.name }}</td>
                <td>{{ a.kind }}</td>
                <td>{{ a.start.replace('T', ' ') }}<br />{{ a.end.replace('T', ' ') }}</td>
                <td style="white-space: normal; max-width: 200px">{{ a.reason }}</td>
                <td><StatusBadge :value="a.status" /></td>
              </tr>
            </tbody>
          </table></div
      ></Panel>
    </div>
    <div class="stack">
      <Panel title="今日出勤"
        ><template #actions><span>10 月 22 日</span></template>
        <div class="donut-content">
          <div class="donut">
            <div class="donut-center"><strong>92</strong><small>应到人数</small></div>
          </div>
          <div class="donut-legend">
            <div><i class="square-dot" /><span>实到</span><strong>86</strong></div>
            <div><i class="square-dot orange" /><span>请假</span><strong>4</strong></div>
            <div><i class="square-dot red" /><span>未到</span><strong>2</strong></div>
          </div>
        </div>
        <div class="attendance-rate">
          <span>今日出勤率</span><strong>93.5<span>%</span></strong>
        </div></Panel
      ><Panel title="快捷操作"
        ><div class="attendance-quick">
          <button @click="openApplication('请假申请')">
            <span><Icon name="calendar" :size="17" /></span>请假申请<Icon
              name="right"
              :size="13"
            /></button
          ><button @click="openApplication('补卡申请')">
            <span class="cyan"><Icon name="users" :size="17" /></span>补卡申请<Icon
              name="right"
              :size="13"
            /></button
          ><button @click="editShift(teams[0]!, 22)">
            <span class="green"><Icon name="clipboard" :size="17" /></span>排班调整<Icon
              name="right"
              :size="13"
            /></button
          ><RouterLink to="/reports"
            ><span class="purple"><Icon name="chart" :size="17" /></span>考勤统计<Icon
              name="right"
              :size="13"
          /></RouterLink></div></Panel
      ><Panel title="近 7 日出勤趋势"
        ><template #actions
          ><span class="chart-legend"
            ><span><i />实到人数</span></span
          ></template
        ><MiniChart :height="160" kind="line" color="#1cc19b"
      /></Panel>
      <div class="attendance-rule-note">
        <Icon name="shield" :size="18" />
        <p>排班、请假与补卡均为本地演示。待核对分厂制度后配置班次、工时与审核规则。</p>
      </div>
    </div>
  </div>
  <Modal :open="['请假申请', '补卡申请'].includes(modal)" :title="modal" @close="modal = ''"
    ><p class="form-note">申请仅在当前浏览器保存，不发送至真实审批系统。</p>
    <p v-if="error" class="form-error">{{ error }}</p>
    <div class="form-grid">
      <div class="form-field">
        <label class="required">申请人</label
        ><input
          v-model="application.name"
          maxlength="20"
          placeholder="请输入姓名"
          aria-label="申请人姓名"
        />
      </div>
      <div class="form-field">
        <label>所属班组</label
        ><select v-model="application.team" aria-label="申请人班组">
          <option v-for="t in teams" :key="t">{{ t }}</option>
        </select>
      </div>
      <div v-if="modal === '请假申请'" class="form-field full">
        <label>请假类型</label
        ><select v-model="application.type" aria-label="请假类型">
          <option>事假</option>
          <option>病假</option>
          <option>调休</option>
          <option>年假</option>
        </select>
      </div>
      <div class="form-field">
        <label class="required">开始时间</label
        ><input v-model="application.start" type="datetime-local" aria-label="申请开始时间" />
      </div>
      <div class="form-field">
        <label class="required">结束时间</label
        ><input v-model="application.end" type="datetime-local" aria-label="申请结束时间" />
      </div>
      <div class="form-field full">
        <label class="required">申请原因</label
        ><textarea
          v-model="application.reason"
          rows="3"
          maxlength="300"
          placeholder="请说明申请原因…"
          aria-label="申请原因"
        />
      </div>
    </div>
    <template #footer
      ><button class="btn" @click="modal = ''">取消</button
      ><button class="btn primary" @click="submitApplication">保存本地申请</button></template
    ></Modal
  ><Modal :open="modal === '排班调整'" title="调整班组排班" @close="modal = ''"
    ><div class="form-grid">
      <div class="form-field">
        <label>班组</label
        ><select v-model="editSchedule.team" aria-label="调整排班班组">
          <option v-for="t in teams" :key="t">{{ t }}</option>
        </select>
      </div>
      <div class="form-field">
        <label>日期（{{ month }}）</label
        ><select v-model="editSchedule.day" aria-label="调整排班日期">
          <option v-for="d in days" :key="d" :value="d">{{ d }} 日</option>
        </select>
      </div>
      <div class="form-field full">
        <label>班次</label
        ><select v-model="editSchedule.shift" aria-label="调整排班班次">
          <option value="早">早班 07:00 — 15:00</option>
          <option value="中">中班 15:00 — 23:00</option>
          <option value="夜">夜班 23:00 — 次日 07:00</option>
          <option value="休">休息</option>
        </select>
      </div>
    </div>
    <template #footer
      ><button class="btn" @click="modal = ''">取消</button
      ><button class="btn primary" @click="saveShift">保存排班</button></template
    ></Modal
  ><Modal :open="modal === '异常处理'" title="考勤异常处理" @close="modal = ''"
    ><div class="form-note">
      {{ state.issues.find((i) => i.id === issueId)?.name }} ·
      {{ state.issues.find((i) => i.id === issueId)?.type }}
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>
    <div class="form-field mb-16">
      <label>处理结果</label
      ><select v-model="decision" aria-label="异常处理结果">
        <option>已通过</option>
        <option>已驳回</option>
      </select>
    </div>
    <div class="form-field">
      <label class="required">处理说明</label
      ><textarea
        v-model="decisionNote"
        rows="3"
        maxlength="300"
        placeholder="填写核实情况及处理依据…"
        aria-label="异常处理说明"
      />
    </div>
    <template #footer
      ><button class="btn" @click="modal = ''">取消</button
      ><button class="btn primary" @click="saveDecision">保存处理结果</button></template
    ></Modal
  ><Modal :open="modal === '异常详情'" title="考勤异常详情" @close="modal = ''"
    ><div class="content-text">
      姓名：{{ state.issues.find((i) => i.id === issueId)?.name }}<br />日期：{{
        state.issues.find((i) => i.id === issueId)?.date
      }}<br />异常：{{ state.issues.find((i) => i.id === issueId)?.type }}<br />结果：{{
        state.issues.find((i) => i.id === issueId)?.status
      }}<br />处理说明：{{ state.issues.find((i) => i.id === issueId)?.note || '无' }}
    </div></Modal
  >
</template>
<style scoped>
.schedule-scroll {
  overflow-x: auto;
  scrollbar-width: thin;
}
.schedule-table {
  width: 100%;
  table-layout: fixed;
  min-width: 850px;
  font-size: 10px;
  text-align: center;
}
.schedule-table th {
  padding: 12px 0 10px;
  border-right: 1px solid #edf1f6;
  font-size: 10px;
}
.schedule-table th strong {
  font-size: 10px;
  font-weight: 500;
  color: #7288a4;
}
.schedule-table th small {
  display: block;
  margin-top: 7px;
  font-size: 8px;
  color: #a8b4c4;
}
.schedule-table td {
  padding: 18px 1px;
  border-right: 1px solid #f2f5f9;
}
.schedule-table .schedule-team {
  position: sticky;
  left: 0;
  z-index: 2;
  width: 100px;
  text-align: left;
  padding-left: 15px;
  background: white;
  border-right: 1px solid #e7edf5;
}
.schedule-table th.schedule-team {
  background: #f7f9fc;
}
.schedule-team strong {
  font-size: 11px;
  font-weight: 500;
  color: #4e6a8d;
}
.schedule-team small {
  display: block;
  margin-top: 7px;
  color: #a0acc0;
  font-size: 9px;
}
.schedule-table .today {
  background: #edf6ff;
}
.schedule-table th.today strong {
  color: #2185fa;
}
.shift-cell {
  border: 0;
  width: 100%;
  height: 29px;
  max-width: 23px;
  border-radius: 3px;
  font-size: 9px;
  color: #fff;
  padding: 0;
}
.early {
  background: #3a93fb;
}
.middle {
  background: #21c9a3;
}
.night {
  background: #f5b145;
}
.rest {
  background: #c1cbd7;
}
.shift-cell:hover {
  filter: brightness(1.1);
  outline: 2px solid #c1dbfc;
}
.schedule-legend {
  display: flex;
  gap: 12px;
  font-size: 9px;
  color: #8d9eb6;
}
.schedule-legend span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.schedule-legend i {
  width: 7px;
  height: 7px;
  border-radius: 2px;
}
.schedule-footnote {
  font-size: 9px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #a2aec0;
  padding: 13px 16px;
  border-top: 1px solid #f0f3f7;
}
.issue-filters {
  display: flex;
  gap: 8px;
  padding: 0 16px 13px;
  flex-wrap: wrap;
}
.issue-filters select,
.issue-filters input {
  padding: 6px 8px;
  font-size: 10px;
}
.issue-filters .search-input {
  margin-left: auto;
  max-width: 180px;
}
.issue-filters .search-input input {
  padding-left: 29px;
}
.attendance-rate {
  border-top: 1px solid #f0f3f7;
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #8e9db0;
  font-size: 11px;
}
.attendance-rate strong {
  font-size: 25px;
  color: #1fbf95;
  font-weight: 600;
}
.attendance-rate strong span {
  font-size: 12px;
}
.attendance-quick {
  display: flex;
  flex-direction: column;
}
.attendance-quick > button,
.attendance-quick > a {
  display: flex;
  align-items: center;
  gap: 11px;
  background: none;
  border: 0;
  border-bottom: 1px solid #f0f3f7;
  padding: 10px 0;
  font-size: 11px;
  color: #657f9f;
  text-align: left;
}
.attendance-quick > :last-child {
  border: 0;
}
.attendance-quick > button > svg,
.attendance-quick > a > svg {
  margin-left: auto;
  color: #acb9c9;
}
.attendance-quick span {
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  background: #edf5ff;
  color: #4d91e9;
  border-radius: 6px;
}
.attendance-quick span.cyan {
  background: #e8f9fd;
  color: #37b6d2;
}
.attendance-quick span.green {
  background: #e9f9f1;
  color: #35b98e;
}
.attendance-quick span.purple {
  background: #f4efff;
  color: #9a76d6;
}
.attendance-rule-note {
  padding: 14px;
  display: flex;
  gap: 10px;
  color: #91a3ba;
  font-size: 10px;
  line-height: 1.9;
}
.attendance-rule-note > svg {
  flex-shrink: 0;
  color: #82a5d0;
}
@media (max-width: 760px) {
  .issue-filters {
    padding: 0 13px 13px;
  }
  .issue-filters .search-input {
    max-width: 100%;
    width: 100%;
  }
  .schedule-legend {
    gap: 8px;
  }
  .schedule-table {
    min-width: 900px;
  }
}
</style>

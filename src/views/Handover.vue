<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import Panel from '../components/Panel.vue';
import Icon from '../components/Icon.vue';
import MetricCard from '../components/MetricCard.vue';
import StatusBadge from '../components/StatusBadge.vue';
import Modal from '../components/Modal.vue';
import { state, toast, now } from '../stores/platform';
import { teams, TODAY } from '../data/seed';
import type { Handover } from '../data/seed';
const selectedId = ref(state.handovers[0]?.id || ''),
  date = ref(''),
  team = ref(''),
  modal = ref(''),
  error = ref('');
const todayCount = computed(() => state.handovers.filter((h) => h.date === TODAY).length);
const current = computed(() => state.handovers.find((h) => h.id === selectedId.value));
const draft = reactive<Handover>(structuredClone({ ...state.handovers[0]! }));
const histories = computed(() =>
  state.handovers.filter(
    (h) => (!date.value || h.date === date.value) && (!team.value || h.team === team.value),
  ),
);
const editable = computed(() => current.value?.status === '草稿');
const schema = [
  {
    key: 'production' as const,
    title: '生产任务进展',
    icon: 'file',
    hint: '填写当前加工进展、完成数量及需接续的生产任务…',
  },
  {
    key: 'equipment' as const,
    title: '设备运行与异常',
    icon: 'cog',
    hint: '填写设备状态、异常情况与关联报修单…',
  },
  {
    key: 'safety' as const,
    title: '安全注意事项',
    icon: 'shield',
    hint: '记录当班安全风险、现场注意事项…',
  },
  {
    key: 'todo' as const,
    title: '待办事项',
    icon: 'clipboard',
    hint: '列出下一班需继续跟进的事项…',
  },
];
const newForm = reactive({ team: teams[0]!, shift: '早班', from: '', to: '' });
function select(h: Handover) {
  selectedId.value = h.id;
  Object.assign(draft, structuredClone({ ...h }));
}
function save() {
  if (!current.value || !editable.value) return;
  Object.assign(current.value, { ...draft, time: now().slice(11) });
  toast('交接记录草稿已保存');
}
function submit() {
  if (!current.value) return;
  if (!draft.from.trim() || !draft.to.trim() || schema.some((s) => !draft[s.key].trim())) {
    toast('请填写交接人员和全部四项交接内容', 'error');
    return;
  }
  Object.assign(current.value, { ...draft, status: '待确认', time: now().slice(11) });
  draft.status = '待确认';
  toast('交接记录已提交，等待接班确认（本地演示）');
}
function confirmStep() {
  if (!current.value) return;
  const next = current.value.status === '待确认' ? '待复核' : '已完成';
  current.value.status = next;
  draft.status = next;
  toast(next === '待复核' ? '接班已确认，等待班组长复核' : '班组长复核完成，交接记录已归档');
}
function create() {
  error.value = '';
  if (!newForm.from.trim() || !newForm.to.trim()) {
    error.value = '请填写交班人和接班人';
    return;
  }
  if (newForm.from.trim() === newForm.to.trim()) {
    error.value = '交班人和接班人不能相同';
    return;
  }
  const h: Handover = {
    id: `JJ-${Date.now()}`,
    date: TODAY,
    ...newForm,
    production: '',
    equipment: '',
    safety: '',
    todo: '',
    status: '草稿',
    time: now().slice(11),
  };
  state.handovers.unshift(h);
  select(h);
  modal.value = '';
  toast('新交接记录已创建');
}
</script>
<template>
  <div class="page-heading">
    <div>
      <h1>交接班管理</h1>
      <p>落实交接责任，保障生产连续与设备安全。</p>
    </div>
    <div class="heading-actions">
      <input v-model="date" type="date" aria-label="历史交接日期" /><select
        v-model="team"
        aria-label="历史交接班组"
      >
        <option value="">全部班组</option>
        <option v-for="t in teams" :key="t">{{ t }}</option></select
      ><button
        class="btn primary"
        @click="
          modal = '新建交接记录';
          error = '';
        "
      >
        <Icon name="plus" :size="15" />新建交接记录
      </button>
    </div>
  </div>
  <div class="metrics-grid">
    <MetricCard
      label="今日交接"
      :value="todayCount"
      unit="条"
      icon="orders"
      hint="当前已创建交接记录"
    /><MetricCard
      label="待确认 / 待复核"
      :value="state.handovers.filter((h) => ['待确认', '待复核'].includes(h.status)).length"
      unit="条"
      icon="clock"
      tone="orange"
      hint="请及时完成交接确认"
    /><MetricCard
      label="设备异常"
      :value="state.devices.filter((d) => d.status === '故障停机').length"
      unit="台"
      icon="alert"
      tone="red"
      hint="需要重点交接关注"
    /><MetricCard
      label="已完成交接"
      :value="state.handovers.filter((h) => h.status === '已完成').length"
      unit="条"
      icon="checks"
      tone="green"
      hint="交接记录已归档"
    />
  </div>
  <div class="detail-layout">
    <div class="detail-column">
      <Panel v-if="current" title="当前交接班记录"
        ><template #actions><StatusBadge :value="current.status" /></template>
        <div class="handover-meta">
          <div>
            <label>班组</label><strong>{{ current.team }}</strong>
          </div>
          <div>
            <label>班次</label
            ><strong
              >{{ current.shift
              }}<small>{{
                { 早班: '07:00—15:00', 中班: '15:00—23:00', 夜班: '23:00—次日07:00' }[current.shift]
              }}</small></strong
            >
          </div>
          <div>
            <label>日期</label><strong>{{ current.date }}</strong>
          </div>
          <div>
            <label>交班人</label><span><Icon name="user" :size="12" />{{ current.from }}</span>
          </div>
          <div>
            <label>接班人</label><span><Icon name="user" :size="12" />{{ current.to }}</span>
          </div>
          <div>
            <label>记录时间</label><span>{{ current.time }}</span>
          </div>
        </div>
        <div class="handover-fields">
          <div v-for="field in schema" :key="field.key" class="handover-field">
            <label
              ><span><Icon :name="field.icon" :size="19" /></span>{{ field.title }}</label
            >
            <div class="handover-textarea">
              <textarea
                v-model="draft[field.key]"
                :readonly="!editable"
                rows="3"
                maxlength="500"
                :placeholder="field.hint"
                :aria-label="field.title"
              /><small>{{ draft[field.key].length }} / 500</small>
            </div>
          </div>
        </div>
        <div class="handover-actions">
          <span class="form-hint">{{
            editable ? '填写后保存草稿或提交交班' : '当前记录已提交，内容锁定'
          }}</span
          ><template v-if="editable"
            ><button class="btn outline-blue" @click="save">
              <Icon name="save" :size="14" />保存草稿</button
            ><button class="btn primary" @click="submit">
              <Icon name="send" :size="14" />提交交班
            </button></template
          ><button
            v-if="['待确认', '待复核'].includes(current.status)"
            class="btn primary"
            @click="confirmStep"
          >
            <Icon name="check" :size="14" />{{
              current.status === '待确认' ? '接班确认' : '班组长复核'
            }}</button
          ><StatusBadge v-if="current.status === '已完成'" value="已完成" /></div></Panel
      ><Panel title="历史交接记录" flush
        ><template #actions
          ><button
            v-if="date || team"
            class="text-button"
            @click="
              date = '';
              team = '';
            "
          >
            清空筛选</button
          ><span>{{ histories.length }} 条记录</span></template
        >
        <div class="table-wrap">
          <table class="table-compact">
            <thead>
              <tr>
                <th>日期</th>
                <th>班组</th>
                <th>班次</th>
                <th>交班人</th>
                <th>接班人</th>
                <th>时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in histories" :key="h.id" :class="{ selected: h.id === selectedId }">
                <td>{{ h.date }}</td>
                <td>{{ h.team }}</td>
                <td>{{ h.shift }}</td>
                <td>{{ h.from }}</td>
                <td>{{ h.to }}</td>
                <td>{{ h.time }}</td>
                <td><StatusBadge :value="h.status" /></td>
                <td><button class="text-button" @click="select(h)">查看</button></td>
              </tr>
            </tbody>
          </table>
          <div v-if="!histories.length" class="empty-state">
            <Icon name="handover" :size="30" />
            <p>没有符合筛选条件的交接记录</p>
          </div>
        </div></Panel
      >
    </div>
    <div class="detail-column">
      <Panel title="交接流程"
        ><div class="handover-workflow">
          <div
            v-for="(s, i) in [
              { title: '交班提交', desc: '交班人填写本班工作与异常情况' },
              { title: '接班确认', desc: '接班人核对现场状态与待办任务' },
              { title: '班组长复核', desc: '复核交接内容，完成记录归档' },
            ]"
            :key="s.title"
            :class="{
              active:
                i <= ['草稿', '待确认', '待复核', '已完成'].indexOf(current?.status || '草稿') - 1,
            }"
          >
            <span>{{ i + 1 }}</span>
            <div>
              <strong>{{ s.title }}</strong>
              <p>{{ s.desc }}</p>
            </div>
            <Icon
              v-if="i < ['草稿', '待确认', '待复核', '已完成'].indexOf(current?.status || '草稿')"
              name="check"
              :size="15"
            />
          </div></div></Panel
      ><Panel title="设备异常情况"
        ><div
          v-for="d in state.devices.filter((d) => d.status === '故障停机')"
          :key="d.id"
          class="handover-device"
        >
          <span class="handover-device-icon"><Icon name="factory" :size="21" /></span>
          <div>
            <strong>{{ d.id }} · {{ d.name }}</strong>
            <p><i class="device-dot fault" />{{ d.task }}</p>
          </div>
          <RouterLink :to="'/equipment?device=' + d.id" class="text-button"
            ><Icon name="right" :size="14"
          /></RouterLink></div></Panel
      ><Panel title="需重点交接事项"
        ><div
          v-for="o in state.orders.filter((o) => o.status !== '已关闭').slice(0, 4)"
          :key="o.id"
          class="handover-todo"
        >
          <span class="handover-todo-dot" />
          <div>
            <RouterLink :to="'/orders?id=' + o.id">{{ o.device }} · {{ o.fault }}</RouterLink
            ><small
              >{{ o.id }} <span>维修人：{{ o.assignee || '待分派' }}</span></small
            >
          </div>
          <StatusBadge :value="o.urgency" /></div
      ></Panel>
      <div class="handover-tip">
        <Icon name="shield" :size="22" />
        <h3>交清情况，接明责任</h3>
        <p>
          请重点交接生产进度、设备异常和现场安全风险。当前确认与复核为本地演示，后续可接入人员身份及审批权限。
        </p>
      </div>
    </div>
  </div>
  <Modal :open="modal === '新建交接记录'" title="新建交接记录" @close="modal = ''"
    ><p class="form-note">创建 {{ TODAY }} 的交接草稿，填写后可提交。</p>
    <p v-if="error" class="form-error">{{ error }}</p>
    <div class="form-grid">
      <div class="form-field">
        <label>班组</label
        ><select v-model="newForm.team" aria-label="新交接班组">
          <option v-for="t in teams" :key="t">{{ t }}</option>
        </select>
      </div>
      <div class="form-field">
        <label>班次</label
        ><select v-model="newForm.shift" aria-label="新交接班次">
          <option>早班</option>
          <option>中班</option>
          <option>夜班</option>
        </select>
      </div>
      <div class="form-field">
        <label class="required">交班人</label
        ><input
          v-model="newForm.from"
          maxlength="20"
          placeholder="请输入交班人姓名"
          aria-label="交班人"
        />
      </div>
      <div class="form-field">
        <label class="required">接班人</label
        ><input
          v-model="newForm.to"
          maxlength="20"
          placeholder="请输入接班人姓名"
          aria-label="接班人"
        />
      </div>
    </div>
    <template #footer
      ><button class="btn" @click="modal = ''">取消</button
      ><button class="btn primary" @click="create">创建交接记录</button></template
    ></Modal
  >
</template>
<style scoped>
.handover-meta {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  gap: 17px 12px;
  padding: 16px 12px;
  background: #f8fbff;
  border: 1px solid #e8eff8;
  border-radius: 6px;
  margin-bottom: 23px;
}
.handover-meta > div {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.handover-meta label {
  color: #a0afc3;
  font-size: 10px;
  min-width: 30px;
}
.handover-meta strong {
  font-size: 11px;
  font-weight: 500;
  color: #647e9f;
}
.handover-meta strong small {
  display: block;
  font-size: 8px;
  font-weight: 400;
  color: #a1b0c5;
  margin-top: 4px;
}
.handover-meta span {
  font-size: 10px;
  color: #738baa;
  display: flex;
  align-items: center;
  gap: 5px;
}
.handover-meta span svg {
  color: #79aae9;
}
.handover-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.handover-field {
  display: flex;
  align-items: flex-start;
  gap: 17px;
}
.handover-field > label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 115px;
  font-size: 11px;
  font-weight: 500;
  color: #5c7699;
  padding-top: 13px;
}
.handover-field > label > span {
  width: 27px;
  height: 29px;
  display: grid;
  place-items: center;
  color: #51a0f9;
  background: #eff6ff;
  border-radius: 5px;
}
.handover-textarea {
  position: relative;
  flex: 1;
  min-width: 0;
}
.handover-textarea textarea {
  padding: 10px 12px 24px;
  font-size: 11px;
  line-height: 1.9;
  border-color: #e2eaf4;
  display: block;
  background: #fefeff;
  min-height: 96px;
}
.handover-textarea textarea:read-only {
  background: #f9fbfe;
  resize: none;
  color: #7c91af;
}
.handover-textarea small {
  position: absolute;
  bottom: 8px;
  right: 11px;
  font-size: 8px;
  color: #a4b2c7;
}
.handover-actions {
  display: flex;
  gap: 9px;
  align-items: center;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #edf2f8;
  flex-wrap: wrap;
}
.handover-actions > .form-hint {
  margin-right: auto;
  font-size: 9px;
}
.handover-actions .btn {
  font-size: 11px;
}
.handover-workflow > div {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f3f7;
}
.handover-workflow > div:last-child {
  border: 0;
}
.handover-workflow > div > span {
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  background: #edf2f8;
  color: #a0b1c7;
  border-radius: 50%;
  font-size: 11px;
  flex-shrink: 0;
}
.handover-workflow > div.active > span {
  background: #e9f8f0;
  color: #22b68b;
}
.handover-workflow strong {
  font-size: 11px;
  font-weight: 500;
  color: #6e88a9;
}
.handover-workflow p {
  font-size: 9px;
  color: #a5b2c5;
  margin-top: 6px;
}
.handover-workflow > div > svg {
  margin-left: auto;
  color: #36ba92;
}
.handover-device {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 0;
  border-bottom: 1px solid #eef3f8;
}
.handover-device:last-child {
  border: 0;
}
.handover-device-icon {
  width: 37px;
  height: 37px;
  display: grid;
  place-items: center;
  color: #809cbe;
  background: #f1f6fc;
  border-radius: 7px;
  flex-shrink: 0;
}
.handover-device strong {
  font-size: 10px;
  font-weight: 500;
  color: #6a83a2;
}
.handover-device p {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 9px;
  color: #a2b0c4;
  margin-top: 7px;
}
.handover-device > a {
  margin-left: auto;
}
.handover-todo {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f4f8;
}
.handover-todo:last-child {
  border: 0;
}
.handover-todo-dot {
  border: 1px solid #b9cde6;
  border-radius: 3px;
  width: 9px;
  height: 9px;
  flex-shrink: 0;
  margin-top: 4px;
}
.handover-todo > div {
  flex: 1;
  min-width: 0;
}
.handover-todo a {
  font-size: 10px;
  color: #718bae;
}
.handover-todo small {
  display: block;
  font-size: 8px;
  color: #acbacd;
  margin-top: 7px;
}
.handover-todo small span {
  margin-left: 7px;
}
.handover-todo .badge {
  font-size: 8px;
}
.handover-tip {
  padding: 22px 20px;
  border: 1px solid #e2edf9;
  background: linear-gradient(145deg, #edf5ff, #f9fbff);
  border-radius: 8px;
  color: #83a8d6;
}
.handover-tip h3 {
  font-size: 13px;
  font-weight: 500;
  color: #7191b9;
  margin: 12px 0 9px;
}
.handover-tip p {
  font-size: 10px;
  line-height: 2;
  color: #92a7c4;
}
@media (max-width: 760px) {
  .handover-field {
    flex-direction: column;
    gap: 8px;
  }
  .handover-field > label {
    padding: 0;
    font-size: 11px;
  }
  .handover-textarea {
    width: 100%;
  }
  .handover-meta {
    grid-template-columns: 1fr 1fr;
    gap: 18px 10px;
  }
  .handover-meta > div {
    gap: 8px;
  }
  .handover-actions > .form-hint {
    width: 100%;
    margin-bottom: 3px;
  }
}
</style>

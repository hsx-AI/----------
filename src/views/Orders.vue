<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Panel from '../components/Panel.vue';
import Icon from '../components/Icon.vue';
import MetricCard from '../components/MetricCard.vue';
import StatusBadge from '../components/StatusBadge.vue';
import Modal from '../components/Modal.vue';
import { state, toast, orderLog, downloadCsv } from '../stores/platform';
const route = useRoute(),
  selected = ref(String(route.query.id || 'AD-20261022-003')),
  modal = ref(''),
  error = ref(''),
  assignee = ref('张师傅'),
  record = ref(''),
  nextStatus = ref('维修中');
const blank = () => ({ q: '', device: '', status: '', urgency: '' });
const filter = reactive(blank()),
  applied = ref(blank());
const orders = computed(() =>
  state.orders.filter(
    (o) =>
      (!applied.value.q || `${o.id} ${o.fault}`.includes(applied.value.q)) &&
      (!applied.value.device || o.device === applied.value.device) &&
      (!applied.value.status || o.status === applied.value.status) &&
      (!applied.value.urgency || o.urgency === applied.value.urgency),
  ),
);
watch(
  () => route.query.id,
  (id) => {
    if (id) selected.value = String(id);
  },
);
const order = computed(() => state.orders.find((o) => o.id === selected.value));
const device = computed(() => state.devices.find((d) => d.id === order.value?.device));
const steps = ['已报修', '已受理', '维修中', '待验收', '已关闭'];
const current = computed(() => Math.max(0, steps.indexOf(order.value?.status || '已报修')));
function search() {
  applied.value = { ...filter };
}
function reset() {
  Object.assign(filter, blank());
  search();
}
function claim() {
  const o = order.value;
  if (!o || o.status !== '待受理') return;
  o.status = '已受理';
  o.assignee = '张师傅';
  orderLog(o, '张师傅已接单，等待开始维修。');
  toast('已在本地接单');
}
function openModal(type: string) {
  modal.value = type;
  error.value = '';
  record.value = '';
  assignee.value = order.value?.assignee || '张师傅';
  nextStatus.value =
    order.value?.status === '已受理'
      ? '维修中'
      : order.value?.status === '维修中'
        ? '待验收'
        : '已关闭';
}
function assign() {
  if (!order.value) return;
  order.value.assignee = assignee.value;
  if (order.value.status === '待受理') order.value.status = '已受理';
  orderLog(order.value, `已派工给 ${assignee.value}，等待现场处理。`);
  modal.value = '';
  toast('维修人员已分派');
}
function saveProgress() {
  const o = order.value;
  if (!o) return;
  if (!record.value.trim()) {
    error.value = '请填写维修记录或验收说明';
    return;
  }
  o.status = nextStatus.value;
  orderLog(o, `${nextStatus.value}：${record.value.trim()}`);
  if (
    nextStatus.value === '已关闭' &&
    device.value &&
    !state.orders.some(
      (other) => other.id !== o.id && other.device === o.device && other.status !== '已关闭',
    )
  )
    device.value.status = '运行中';
  modal.value = '';
  toast(nextStatus.value === '已关闭' ? '验收完成，工单已关闭' : '维修进度已更新');
}
function exportData() {
  downloadCsv(
    '安灯工单.csv',
    ['工单编号', '设备', '故障', '紧急程度', '报修时间', '维修人员', '状态'],
    orders.value.map((o) => [o.id, o.device, o.fault, o.urgency, o.reported, o.assignee, o.status]),
  );
  toast('工单列表已导出');
}
</script>
<template>
  <div class="page-heading">
    <div>
      <h1>安灯工单处置</h1>
      <p>快速响应现场异常，跟踪维修处理全过程。</p>
    </div>
    <div class="heading-actions">
      <button class="btn" @click="exportData"><Icon name="download" :size="14" />导出工单</button
      ><RouterLink to="/repair?device=CNC-03" class="btn primary"
        ><Icon name="plus" :size="15" />发起报修</RouterLink
      >
    </div>
  </div>
  <div class="metrics-grid">
    <MetricCard
      label="待受理"
      :value="state.orders.filter((o) => o.status === '待受理').length"
      unit="条"
      icon="orders"
      tone="red"
      hint="等待维修人员接单"
    /><MetricCard
      label="已受理 / 维修中"
      :value="state.orders.filter((o) => ['已受理', '维修中'].includes(o.status)).length"
      unit="条"
      icon="wrench"
      tone="orange"
      hint="正在安排现场处理"
    /><MetricCard
      label="待验收"
      :value="state.orders.filter((o) => o.status === '待验收').length"
      unit="条"
      icon="clock"
      hint="等待现场验收确认"
    /><MetricCard
      label="已关闭"
      :value="state.orders.filter((o) => o.status === '已关闭').length"
      unit="条"
      icon="checks"
      tone="green"
      hint="本地全部已完成工单"
    />
  </div>
  <div class="orders-layout" :class="{ 'detail-closed': !order }">
    <div class="stack">
      <form class="toolbar order-toolbar" @submit.prevent="search">
        <div class="filter-grid">
          <div class="filter-field grow">
            <label>工单检索</label>
            <div class="search-input">
              <Icon name="search" :size="14" /><input
                v-model="filter.q"
                placeholder="工单编号、故障关键词"
                aria-label="工单关键词"
              />
            </div>
          </div>
          <div class="filter-field">
            <label>设备</label
            ><select v-model="filter.device" aria-label="工单设备">
              <option value="">全部设备</option>
              <option v-for="d in state.devices" :key="d.id">{{ d.id }}</option>
            </select>
          </div>
          <div class="filter-field">
            <label>状态</label
            ><select v-model="filter.status" aria-label="工单状态">
              <option value="">全部状态</option>
              <option v-for="s in ['待受理', '已受理', '维修中', '待验收', '已关闭']" :key="s">
                {{ s }}
              </option>
            </select>
          </div>
          <div class="filter-field">
            <label>紧急程度</label
            ><select v-model="filter.urgency" aria-label="工单紧急程度">
              <option value="">全部等级</option>
              <option>一般</option>
              <option>紧急</option>
              <option>停机</option>
            </select>
          </div>
          <div class="filter-actions">
            <button class="btn primary" type="submit">查询</button
            ><button class="btn" type="button" @click="reset">重置</button>
          </div>
        </div>
      </form>
      <section class="panel">
        <div class="table-panel-top">
          <span class="table-panel-title"
            >安灯工单列表 <small>共 {{ orders.length }} 条</small></span
          ><span class="form-hint">点击工单查看详情</span>
        </div>
        <div class="table-wrap">
          <table class="table-compact">
            <thead>
              <tr>
                <th>工单编号 / 报修时间</th>
                <th>设备 / 故障</th>
                <th>等级</th>
                <th>维修人员</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in orders" :key="o.id" :class="{ selected: selected === o.id }">
                <td>
                  <button class="order-id" @click="selected = o.id">{{ o.id }}</button>
                  <div class="table-id" style="font-size: 9px; margin-top: 6px">
                    {{ o.reported }}
                  </div>
                </td>
                <td>
                  <strong class="table-title" style="font-size: 11px">{{ o.device }}</strong>
                  <div style="font-size: 10px; margin-top: 6px; color: #8e9fb5">{{ o.fault }}</div>
                </td>
                <td><StatusBadge :value="o.urgency" /></td>
                <td>{{ o.assignee || '待分派' }}</td>
                <td><StatusBadge :value="o.status" dot /></td>
                <td>
                  <button class="text-button" @click="selected = o.id">
                    查看 <Icon name="right" :size="11" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="!orders.length" class="empty-state">
            <Icon name="orders" :size="34" />
            <p>没有符合条件的安灯工单</p>
            <button class="btn small" @click="reset">清空筛选</button>
          </div>
        </div>
        <div class="pagination">
          <span>共 {{ orders.length }} 条记录</span><span>演示工单全部展示</span>
        </div>
      </section>
    </div>
    <Panel v-if="order" title="工单详情"
      ><template #actions
        ><button class="icon-button" aria-label="关闭工单详情" @click="selected = ''">
          <Icon name="close" :size="17" /></button
      ></template>
      <div class="order-detail-header">
        <strong>{{ order.id }}</strong
        ><StatusBadge :value="order.status" />
      </div>
      <div class="order-detail-meta">
        <span
          >报修设备 <strong>{{ order.device }} · {{ device?.name }}</strong></span
        ><span
          >故障类型 <strong>{{ order.category }} / {{ order.fault }}</strong></span
        ><span>紧急程度 <StatusBadge :value="order.urgency" /></span
        ><span
          >报修时间 <strong>{{ order.reported }}</strong></span
        ><span
          >报修人员 <strong>{{ order.reporter }} · {{ order.phone }}</strong></span
        >
      </div>
      <div class="steps order-steps">
        <div
          v-for="(s, i) in steps"
          :key="s"
          class="step"
          :class="{ done: i < current, current: i === current }"
        >
          <span class="step-circle"
            ><Icon v-if="i < current" name="check" :size="12" /><template v-else>{{
              i + 1
            }}</template></span
          ><strong>{{ s }}</strong>
        </div>
      </div>
      <h3 class="order-section-title">故障描述</h3>
      <div class="info-box">{{ order.description }}</div>
      <div v-if="order.photos?.length" class="order-photos">
        <img v-for="(p, i) in order.photos" :key="i" :src="p" :alt="'报修现场照片' + (i + 1)" />
      </div>
      <h3 class="order-section-title">维修人员</h3>
      <div class="assigned-person">
        <span class="avatar"><Icon name="user" :size="18" /></span>
        <div>
          <strong>{{ order.assignee || '尚未分派' }}</strong>
          <p>{{ order.assignee ? '设备维修班 · 当前处理人' : '请接单或分派维修人员' }}</p>
        </div>
        <Icon name="wrench" :size="17" />
      </div>
      <h3 class="order-section-title">维修日志</h3>
      <div class="timeline">
        <div v-for="(l, i) in order.logs" :key="i" class="timeline-row">
          <time>{{ l.time }}</time>
          <p>{{ l.text }}</p>
        </div>
      </div>
      <div class="order-detail-actions">
        <button v-if="order.status === '待受理'" class="btn primary" @click="claim">
          <Icon name="check" :size="14" />接单</button
        ><button
          v-if="!['已关闭', '待验收'].includes(order.status)"
          class="btn outline-blue"
          @click="openModal('派工')"
        >
          <Icon name="users" :size="14" />派工</button
        ><button
          v-if="['已受理', '维修中', '待验收'].includes(order.status)"
          class="btn primary"
          @click="openModal('更新进度')"
        >
          <Icon name="clipboard" :size="14" />{{
            order.status === '待验收' ? '验收确认' : '更新进度'
          }}
        </button>
        <div v-if="order.status === '已关闭'" class="closed-order">
          <Icon name="success" :size="17" />工单已完成现场验收
        </div>
      </div>
      <p class="form-hint mt-16">当前操作仅更新浏览器演示数据。</p></Panel
    >
  </div>
  <Modal :open="modal === '派工'" title="分派维修人员" @close="modal = ''"
    ><div class="form-note">工单 {{ order?.id }} · {{ order?.device }}</div>
    <div class="form-field">
      <label>选择维修人员</label
      ><select v-model="assignee" aria-label="分派维修人员">
        <option v-for="a in ['张师傅', '李师傅', '王师傅', '陈师傅', '赵师傅', '周师傅']" :key="a">
          {{ a }}
        </option>
      </select>
    </div>
    <template #footer
      ><button class="btn" @click="modal = ''">取消</button
      ><button class="btn primary" @click="assign">确认派工</button></template
    ></Modal
  ><Modal
    :open="modal === '更新进度'"
    :title="order?.status === '待验收' ? '设备维修验收' : '更新维修进度'"
    @close="modal = ''"
    ><div class="form-note">
      {{ order?.device }} ·
      {{ order?.fault }}。验收通过且同设备无其他未关闭工单时，设备状态将恢复为运行中。
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>
    <div class="form-field mb-16">
      <label>更新工单状态</label
      ><select v-model="nextStatus" aria-label="更新工单状态">
        <option v-if="order?.status === '已受理'" value="维修中">开始维修</option>
        <option v-if="order?.status === '维修中'" value="维修中">维修中 · 添加记录</option>
        <option v-if="order?.status === '维修中'" value="待验收">维修完成 · 提交验收</option>
        <option v-if="order?.status === '待验收'" value="已关闭">验收通过 · 关闭工单</option>
        <option v-if="order?.status === '待验收'" value="维修中">验收未通过 · 退回维修</option>
      </select>
    </div>
    <div class="form-field">
      <label class="required">{{ order?.status === '待验收' ? '验收说明' : '维修记录' }}</label
      ><textarea
        v-model="record"
        maxlength="500"
        rows="4"
        placeholder="请填写处理过程、试运行结果或验收意见…"
        aria-label="维修或验收说明"
      />
    </div>
    <template #footer
      ><button class="btn" @click="modal = ''">取消</button
      ><button class="btn primary" @click="saveProgress">保存进度</button></template
    ></Modal
  >
</template>
<style scoped>
.orders-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: start;
}
.orders-layout.detail-closed {
  grid-template-columns: 1fr;
}
.order-toolbar {
  margin: 0;
  padding: 15px;
}
.order-toolbar .filter-grid {
  gap: 9px;
}
.order-toolbar .filter-field {
  min-width: 95px;
}
.order-toolbar .filter-field.grow {
  min-width: 170px;
}
.order-toolbar input,
.order-toolbar select {
  font-size: 10px;
  padding-top: 8px;
  padding-bottom: 8px;
}
.order-toolbar label {
  font-size: 10px;
}
.order-toolbar .btn {
  padding-left: 10px;
  padding-right: 10px;
  font-size: 11px;
}
.order-id {
  background: none;
  border: 0;
  padding: 0;
  font-size: 11px;
  color: #567598;
  font-weight: 500;
}
.order-id:hover {
  color: var(--blue);
}
.order-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0 17px;
}
.order-detail-header > strong {
  font-size: 16px;
  letter-spacing: 0.1px;
}
.order-detail-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 10px;
  color: #9aabc1;
}
.order-detail-meta > span {
  display: flex;
  align-items: center;
  gap: 12px;
}
.order-detail-meta strong {
  color: #6983a4;
  font-weight: 400;
  font-size: 11px;
}
.order-steps {
  padding: 25px 0 14px;
}
.order-steps .step-circle {
  width: 25px;
  height: 25px;
  font-size: 10px;
}
.order-steps .step:before {
  top: 12px;
  height: 2px;
}
.order-steps .step strong {
  font-size: 9px;
}
.order-section-title {
  font-size: 12px;
  font-weight: 500;
  border-left: 2px solid #4a9bfc;
  padding-left: 8px;
  margin: 21px 0 13px;
}
.assigned-person {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fbff;
  border: 1px solid #e9f0f8;
  border-radius: 5px;
  padding: 11px;
}
.assigned-person .avatar {
  width: 31px;
  height: 31px;
}
.assigned-person strong {
  font-size: 11px;
  font-weight: 500;
  color: #6f88a8;
}
.assigned-person p {
  font-size: 9px;
  color: #9bacc2;
  margin-top: 5px;
}
.assigned-person > svg {
  margin-left: auto;
  color: #afc2d9;
}
.order-detail-actions {
  display: flex;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid #edf2f8;
  margin-top: 19px;
}
.order-detail-actions .btn {
  flex: 1;
  font-size: 11px;
  padding: 9px 10px;
}
.closed-order {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 11px;
  color: #2aaf89;
  background: #edf9f4;
  border-radius: 5px;
  padding: 11px;
  width: 100%;
}
.order-photos {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.order-photos img {
  width: 75px;
  height: 65px;
  object-fit: cover;
  border-radius: 5px;
}
@media (min-width: 1700px) {
  .orders-layout {
    grid-template-columns: minmax(0, 1fr) 410px;
  }
}
@media (max-width: 1200px) {
  .orders-layout {
    grid-template-columns: 1fr;
  }
  .orders-layout > .panel {
    width: 100%;
  }
}
@media (max-width: 760px) {
  .order-toolbar .filter-field {
    min-width: 130px;
  }
  .order-toolbar .filter-field.grow {
    min-width: 100%;
  }
  .order-detail-meta {
    gap: 13px;
  }
  .order-detail-meta strong {
    font-size: 10px;
  }
}
</style>

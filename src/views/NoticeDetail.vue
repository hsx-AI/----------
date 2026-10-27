<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import Panel from '../components/Panel.vue';
import Icon from '../components/Icon.vue';
import StatusBadge from '../components/StatusBadge.vue';
import MachineArt from '../components/MachineArt.vue';
import Modal from '../components/Modal.vue';
import { state, toast, now, downloadCsv } from '../stores/platform';
const route = useRoute();
const notice = computed(() => state.notices.find((n) => n.id === route.params.id));
const device = computed(() => state.devices.find((d) => d.id === notice.value?.device));
const note = ref(''),
  editTask = ref(-1),
  taskProgress = ref(0),
  source = ref(false);
const currentStep = computed(() =>
  notice.value?.status === '已完成' ? 5 : notice.value?.status === '待接收' ? 0 : 3,
);
function comment() {
  if (!note.value.trim()) return;
  notice.value?.logs.unshift({
    time: now(),
    author: state.settings.owner,
    text: note.value.trim(),
  });
  note.value = '';
  toast('跟踪记录已保存至本地');
}
function remind() {
  notice.value?.logs.unshift({
    time: now(),
    author: state.settings.owner,
    text: '添加本地催办标记，请线下联系责任班组确认进度。',
  });
  toast('已记录本地催办标记，未发送外部消息');
}
function accept() {
  if (!notice.value) return;
  notice.value.status = '处理中';
  notice.value.logs.unshift({
    time: now(),
    author: state.settings.owner,
    text: '在本地跟踪中确认接收，开始执行任务。',
  });
  toast('已在本地确认接收');
}
function updateTask() {
  const n = notice.value;
  if (!n || editTask.value < 0) return;
  n.tasks[editTask.value]!.progress = Number(taskProgress.value);
  n.progress = Math.round(n.tasks.reduce((sum, t) => sum + t.progress, 0) / n.tasks.length);
  n.status = n.progress === 100 ? '已完成' : '处理中';
  n.logs.unshift({
    time: now(),
    author: state.settings.owner,
    text: `更新任务「${n.tasks[editTask.value]!.title}」进度至 ${taskProgress.value}%`,
  });
  editTask.value = -1;
  toast('本地执行进度已更新');
}
function exportDetail() {
  const n = notice.value;
  if (!n) return;
  downloadCsv(
    n.id + '.csv',
    ['任务内容', '责任人', '完成进度', '计划完成时间'],
    n.tasks.map((t) => [t.title, t.owner, t.progress + '%', t.due]),
  );
  toast('已导出任务清单');
}
</script>
<template>
  <template v-if="notice"
    ><div class="page-heading">
      <div>
        <div class="flex gap-12">
          <h1>{{ notice.title }}</h1>
          <StatusBadge :value="notice.priority" />
        </div>
        <p>{{ notice.id }} <span style="margin: 0 7px">·</span> 技术通知单执行跟踪</p>
      </div>
      <div class="heading-actions">
        <button class="btn" @click="notice.followed = !notice.followed">
          <Icon name="star" :size="15" />{{ notice.followed ? '已关注' : '关注' }}</button
        ><button class="btn primary" @click="notice.status === '待接收' ? accept() : remind()">
          <Icon :name="notice.status === '待接收' ? 'check' : 'send'" :size="15" />{{
            notice.status === '待接收' ? '确认接收' : '添加催办标记'
          }}</button
        ><button class="btn" @click="exportDetail"><Icon name="download" :size="14" />导出</button
        ><RouterLink class="btn" to="/notices"><Icon name="back" :size="14" />返回列表</RouterLink>
      </div>
    </div>
    <div class="panel detail-meta">
      <div><label>来源系统</label><strong class="text-blue">X5（只读同步）</strong></div>
      <div>
        <label>下发时间</label><strong>{{ notice.issued }}</strong>
      </div>
      <div>
        <label>截止时间</label><strong>{{ notice.deadline }}</strong>
      </div>
      <div>
        <label>责任班组</label><strong>{{ notice.team }}</strong>
      </div>
      <div>
        <label>关联设备</label><strong>{{ notice.device }}</strong>
      </div>
      <div><label>当前状态</label><StatusBadge :value="notice.status" dot /></div>
    </div>
    <div class="detail-layout">
      <div class="detail-column">
        <Panel title="执行进度"
          ><template #actions
            ><span>总体完成 {{ notice.progress }}%</span></template
          >
          <div class="steps">
            <div
              v-for="(s, i) in ['已下发', '已接收', '已分派', '执行中', '待验收', '已完成']"
              :key="s"
              class="step"
              :class="{ done: i < currentStep, current: i === currentStep }"
            >
              <span class="step-circle"
                ><Icon v-if="i < currentStep" name="check" :size="16" /><template v-else>{{
                  i + 1
                }}</template></span
              ><strong>{{ s }}</strong
              ><small>{{ i <= currentStep ? notice.issued.slice(5, 10) : '等待处理' }}</small>
            </div>
          </div></Panel
        ><Panel title="工作任务清单" :subtitle="notice.tasks.length + ' 项'" flush
          ><div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>任务内容</th>
                  <th>责任人</th>
                  <th>完成进度</th>
                  <th>计划完成</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(t, i) in notice.tasks" :key="i">
                  <td
                    style="max-width: 240px; white-space: normal; font-size: 11px; line-height: 1.7"
                  >
                    {{ t.title }}
                  </td>
                  <td>
                    <span class="tiny-avatar">{{ t.owner.slice(0, 1) }}</span
                    >{{ t.owner }}
                  </td>
                  <td>
                    <div class="progress-display">
                      <div class="progress" :class="{ green: t.progress === 100 }">
                        <span :style="{ width: t.progress + '%' }" />
                      </div>
                      {{ t.progress }}%
                    </div>
                  </td>
                  <td>{{ t.due.slice(5) }}</td>
                  <td>
                    <button
                      class="text-button"
                      @click="
                        editTask = i;
                        taskProgress = t.progress;
                      "
                    >
                      更新
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div></Panel
        ><Panel title="通知单主要内容"
          ><template #actions
            ><button class="text-button" @click="source = true">
              查看源信息 <Icon name="right" :size="12" /></button
          ></template>
          <p class="content-text">
            为保障{{ device?.name || notice.device }}运行稳定性，现组织实施“{{
              notice.title
            }}”。请相关班组按照技术要求组织实施，完成现场技术交底、安全确认及过程记录，在规定时间内完成任务并组织验收。
          </p>
          <div class="info-box">
            <strong>执行要求</strong><br />1. 实施前完成安全风险辨识与作业条件确认。<br />2.
            严格按照确认的技术方案执行，关键工序保留检查记录。<br />3.
            完成后进行运行验证，及时反馈执行结果。
          </div></Panel
        ><Panel title="补充跟踪记录">
          <textarea
            v-model="note"
            rows="3"
            maxlength="500"
            placeholder="记录当前执行情况、现场问题或需要协同的事项…"
            aria-label="跟踪记录"
          />
          <div class="flex space-between mt-16">
            <span class="form-hint">仅保存到当前浏览器，不回写 X5</span
            ><button class="btn primary small" :disabled="!note.trim()" @click="comment">
              <Icon name="plus" :size="13" />添加记录
            </button>
          </div></Panel
        >
      </div>
      <div class="detail-column">
        <Panel title="截止提醒"
          ><div class="deadline-card">
            <span class="deadline-icon"><Icon name="clock" :size="25" /></span>
            <div>
              <strong>{{ notice.deadline.slice(0, 10) }}</strong>
              <p>计划完成时间 {{ notice.deadline.slice(11) }}</p>
            </div>
          </div>
          <div class="notice-source">
            <Icon name="info" :size="13" />{{
              notice.status === '已完成'
                ? '本通知单本地跟踪任务已完成。'
                : '请定期更新本地执行进度，确保按期完成。'
            }}
          </div></Panel
        ><Panel v-if="device" title="关联设备信息"
          ><div class="associated-device">
            <MachineArt :kind="device.kind" :active="device.status === '故障停机'" />
            <div>
              <strong>{{ device.id }}</strong>
              <p>{{ device.name }}</p>
              <StatusBadge :value="device.status" dot />
            </div>
          </div>
          <RouterLink :to="'/equipment?device=' + device.id" class="text-button"
            >查看设备运行信息 <Icon name="right" :size="13" /></RouterLink></Panel
        ><Panel title="讨论与操作日志"
          ><template #actions
            ><span>{{ notice.logs.length }} 条记录</span></template
          >
          <div class="timeline">
            <div v-for="(l, i) in notice.logs" :key="i" class="timeline-row">
              <time>{{ l.time }}</time
              ><strong>{{ l.author }}</strong>
              <p>{{ l.text }}</p>
            </div>
          </div></Panel
        ><Panel title="源系统附件"
          ><div class="attachment-placeholder">
            <span class="attachment-icon"><Icon name="attachment" :size="24" /></span>
            <div>
              <strong>技术方案及原始附件</strong>
              <p>接入 X5 后展示可用的附件信息</p>
            </div>
          </div>
          <div class="form-hint">当前演示未提供真实附件。导出按钮可下载本地任务清单。</div></Panel
        >
      </div>
    </div>
    <Modal :open="editTask >= 0" title="更新本地任务进度" @close="editTask = -1"
      ><p class="form-note">仅更新平台本地跟踪信息，不修改 X5 原始通知单。</p>
      <div v-if="editTask >= 0" class="form-field">
        <label>{{ notice.tasks[editTask]?.title }}</label>
        <div class="flex gap-12">
          <input
            v-model="taskProgress"
            type="range"
            min="0"
            max="100"
            step="5"
            class="w-full"
            aria-label="任务完成进度"
          /><strong class="text-blue">{{ taskProgress }}%</strong>
        </div>
      </div>
      <template #footer
        ><button class="btn" @click="editTask = -1">取消</button
        ><button class="btn primary" @click="updateTask">保存进度</button></template
      ></Modal
    ><Modal :open="source" title="X5 源信息预览" @close="source = false"
      ><div class="form-note">当前展示为模拟源信息。真实接口接入后此处提供原文及来源链接。</div>
      <div class="content-text">
        通知单编号：{{ notice.id }}<br />标题：{{ notice.title }}<br />下发时间：{{ notice.issued
        }}<br />责任班组：{{ notice.team }}<br />执行截止：{{ notice.deadline }}
      </div></Modal
    ></template
  >
  <div v-else class="panel empty-state">
    <Icon name="file" :size="40" />
    <p>未找到该技术通知单</p>
    <RouterLink to="/notices" class="btn primary">返回通知单列表</RouterLink>
  </div>
</template>
<style scoped>
.tiny-avatar {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #eaf2ff;
  color: #679de4;
  font-size: 10px;
  margin-right: 6px;
}
.deadline-card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 14px 0 19px;
}
.deadline-icon {
  padding: 12px;
  background: #fff4f4;
  color: #f2707d;
  border-radius: 9px;
}
.deadline-card strong {
  font-size: 23px;
  color: #ef6574;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.deadline-card p {
  font-size: 11px;
  color: #a3aec0;
  margin-top: 8px;
}
.associated-device {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 5px 0 16px;
}
.associated-device .machine-art {
  width: 118px;
  flex-shrink: 0;
  background: #f7faff;
  border-radius: 6px;
}
.associated-device strong {
  font-size: 15px;
}
.associated-device p {
  font-size: 11px;
  color: #8c9eb5;
  margin: 7px 0 10px;
}
.attachment-placeholder {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 0 18px;
}
.attachment-icon {
  color: #7ca4d4;
  background: #f0f6fd;
  display: grid;
  place-items: center;
  padding: 10px;
  border-radius: 7px;
}
.attachment-placeholder strong {
  font-size: 11px;
  font-weight: 500;
  color: #6e86a3;
}
.attachment-placeholder p {
  font-size: 10px;
  color: #a0aec0;
  margin-top: 7px;
}
</style>

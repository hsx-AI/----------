<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Icon from '../components/Icon.vue';
import StatusBadge from '../components/StatusBadge.vue';
import MetricCard from '../components/MetricCard.vue';
import { state, downloadCsv, toast } from '../stores/platform';
import { teams } from '../data/seed';
const route = useRoute();
const blank = () => ({
  q: String(route.query.q || ''),
  status: '',
  type: '',
  team: '',
  device: '',
  start: '',
  end: '',
});
const filter = reactive(blank()),
  applied = ref(blank()),
  tab = ref('all'),
  page = ref(1),
  size = ref(10);
const filtered = computed(() =>
  state.notices.filter((n) => {
    const f = applied.value;
    return (
      (!f.q || `${n.id} ${n.title} ${n.device}`.toLowerCase().includes(f.q.toLowerCase())) &&
      (!f.status || n.status === f.status) &&
      (!f.type || n.type === f.type) &&
      (!f.team || n.team === f.team) &&
      (!f.device || n.device === f.device) &&
      (!f.start || n.issued.slice(0, 10) >= f.start) &&
      (!f.end || n.issued.slice(0, 10) <= f.end) &&
      (tab.value !== 'followed' || n.followed) &&
      (tab.value !== 'pending' || n.status !== '已完成')
    );
  }),
);
watch(
  () => route.query.q,
  (q) => {
    filter.q = String(q || '');
    tab.value = 'all';
    search();
  },
);
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / size.value)));
const rows = computed(() =>
  filtered.value.slice((page.value - 1) * size.value, page.value * size.value),
);
function search() {
  if (filter.start && filter.end && filter.start > filter.end) {
    toast('开始日期不能晚于结束日期', 'error');
    return;
  }
  applied.value = { ...filter };
  page.value = 1;
}
function reset() {
  Object.assign(filter, { q: '', status: '', type: '', team: '', device: '', start: '', end: '' });
  search();
}
function exportData() {
  downloadCsv(
    '技术通知单.csv',
    ['通知单编号', '标题', '类型', '设备', '责任班组', '下发时间', '截止时间', '状态', '进度'],
    filtered.value.map((n) => [
      n.id,
      n.title,
      n.type,
      n.device,
      n.team,
      n.issued,
      n.deadline,
      n.status,
      n.progress + '%',
    ]),
  );
  toast('已导出当前筛选结果');
}
</script>
<template>
  <div class="page-heading">
    <div>
      <h1>技术通知单</h1>
      <p>统一检索技术要求，透明跟踪执行进度。</p>
    </div>
    <div class="heading-actions">
      <span class="heading-note"><Icon name="database" :size="12" />X5 信息只读 · 演示数据</span
      ><button class="btn" @click="exportData"><Icon name="download" :size="15" />导出列表</button>
    </div>
  </div>
  <div class="metrics-grid">
    <MetricCard
      label="通知单总数"
      :value="state.notices.length"
      unit="条"
      icon="file"
      hint="已同步至平台的通知单"
    /><MetricCard
      label="待接收"
      :value="state.notices.filter((n) => n.status === '待接收').length"
      unit="条"
      icon="clock"
      tone="orange"
      hint="等待责任班组确认"
    /><MetricCard
      label="处理中"
      :value="state.notices.filter((n) => n.status === '处理中').length"
      unit="条"
      icon="cog"
      tone="green"
      hint="正在跟踪执行"
    /><MetricCard
      label="即将到期"
      :value="state.notices.filter((n) => n.status === '即将到期').length"
      unit="条"
      icon="alert"
      tone="red"
      hint="请关注截止时间"
    />
  </div>
  <form class="toolbar" @submit.prevent="search">
    <div class="filter-grid">
      <div class="filter-field grow">
        <label>关键词检索</label>
        <div class="search-input">
          <Icon name="search" :size="16" /><input
            v-model.trim="filter.q"
            placeholder="搜索编号、标题、设备或关键词"
            aria-label="通知单关键词"
          />
        </div>
      </div>
      <div class="filter-field">
        <label for="notice-status">通知单状态</label
        ><select id="notice-status" v-model="filter.status">
          <option value="">全部状态</option>
          <option>待接收</option>
          <option>处理中</option>
          <option>即将到期</option>
          <option>已完成</option>
        </select>
      </div>
      <div class="filter-field">
        <label for="notice-type">通知单类型</label
        ><select id="notice-type" v-model="filter.type">
          <option value="">全部类型</option>
          <option
            v-for="t in ['设备维修', '故障处理', '计划检修', '工艺改进', '技术改进']"
            :key="t"
          >
            {{ t }}
          </option>
        </select>
      </div>
      <div class="filter-field">
        <label for="notice-team">责任班组</label
        ><select id="notice-team" v-model="filter.team">
          <option value="">全部班组</option>
          <option v-for="t in teams" :key="t">{{ t }}</option>
        </select>
      </div>
      <div class="filter-field">
        <label for="notice-device">关联设备</label
        ><select id="notice-device" v-model="filter.device">
          <option value="">全部设备</option>
          <option v-for="d in state.devices" :key="d.id">{{ d.id }}</option>
        </select>
      </div>
    </div>
    <div class="notice-filter-bottom">
      <span class="filter-date-label">下发日期</span
      ><input v-model="filter.start" type="date" aria-label="下发开始日期" /><span class="muted"
        >—</span
      ><input v-model="filter.end" type="date" aria-label="下发结束日期" />
      <div class="filter-actions">
        <button type="submit" class="btn primary"><Icon name="search" :size="14" />查询</button
        ><button type="button" class="btn" @click="reset">
          <Icon name="refresh" :size="14" />重置
        </button>
      </div>
    </div>
  </form>
  <section class="panel">
    <div class="table-panel-top">
      <div class="table-tabs">
        <button
          :class="{ active: tab === 'all' }"
          @click="
            tab = 'all';
            page = 1;
          "
        >
          全部通知单 <small>{{ state.notices.length }}</small></button
        ><button
          :class="{ active: tab === 'pending' }"
          @click="
            tab = 'pending';
            page = 1;
          "
        >
          待跟踪</button
        ><button
          :class="{ active: tab === 'followed' }"
          @click="
            tab = 'followed';
            page = 1;
          "
        >
          我的关注 <small>{{ state.notices.filter((n) => n.followed).length }}</small>
        </button>
      </div>
      <span class="muted" style="font-size: 10px"
        >共检索到 <b class="text-blue">{{ filtered.length }}</b> 条结果</span
      >
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width: 28px"></th>
            <th>通知单编号 / 标题</th>
            <th>类型</th>
            <th>关联设备</th>
            <th>责任班组</th>
            <th>执行进度</th>
            <th>截止时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in rows" :key="n.id">
            <td style="padding-right: 0">
              <button
                class="follow-button"
                :class="{ followed: n.followed }"
                :aria-label="(n.followed ? '取消关注' : '关注') + n.title"
                @click="n.followed = !n.followed"
              >
                <Icon name="star" :size="14" />
              </button>
            </td>
            <td>
              <RouterLink :to="'/notices/' + n.id" class="table-title notice-link">{{
                n.title
              }}</RouterLink>
              <div class="table-id" style="margin-top: 6px">{{ n.id }}</div>
            </td>
            <td><StatusBadge :value="n.type" /></td>
            <td>{{ n.device }}</td>
            <td>{{ n.team }}</td>
            <td>
              <div class="progress-display">
                <div class="progress" :class="{ green: n.progress === 100 }">
                  <span :style="{ width: n.progress + '%' }" />
                </div>
                {{ n.progress }}%
              </div>
            </td>
            <td>{{ n.deadline.slice(5, 10) }} <small class="muted">18:00</small></td>
            <td><StatusBadge :value="n.status" dot /></td>
            <td>
              <RouterLink class="text-button" :to="'/notices/' + n.id"
                >查看详情 <Icon name="right" :size="12"
              /></RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!rows.length" class="empty-state">
        <Icon name="search" :size="34" />
        <p>没有找到符合条件的通知单</p>
        <button class="btn small" @click="reset">清空筛选条件</button>
      </div>
    </div>
    <div class="pagination">
      <span>共 {{ filtered.length }} 条记录</span>
      <div class="page-buttons">
        <select v-model="size" aria-label="每页条数" @change="page = 1">
          <option :value="5">5 条 / 页</option>
          <option :value="10">10 条 / 页</option>
          <option :value="20">20 条 / 页</option></select
        ><button :disabled="page === 1" aria-label="上一页" @click="page--">
          <Icon name="left" :size="14" /></button
        ><button v-for="p in pages" :key="p" :class="{ active: page === p }" @click="page = p">
          {{ p }}</button
        ><button :disabled="page === pages" aria-label="下一页" @click="page++">
          <Icon name="right" :size="14" />
        </button>
      </div>
    </div>
  </section>
  <div class="notice-source-note">
    <Icon name="shield" :size="13" />技术通知单源信息来自
    X5，本平台用于查询与本地执行跟踪；当前未连接真实系统。
  </div>
</template>
<style scoped>
.notice-filter-bottom {
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid #f0f3f7;
  margin-top: 16px;
  padding-top: 14px;
}
.notice-filter-bottom input {
  padding: 7px 9px;
  font-size: 11px;
  color: #7e91ac;
}
.notice-filter-bottom .filter-actions {
  margin-left: auto;
}
.filter-date-label {
  font-size: 11px;
  color: #8b9bb0;
  margin-right: 3px;
}
.table-tabs small {
  background: #edf4ff;
  color: #6095d8;
  padding: 1px 5px;
  font-size: 9px;
  border-radius: 3px;
  margin-left: 3px;
}
.follow-button {
  border: 0;
  background: none;
  color: #d2dce8;
  padding: 3px;
  display: flex;
}
.follow-button.followed {
  color: #efb347;
}
.follow-button.followed :deep(svg) {
  fill: #fff3ce;
}
.notice-link {
  font-size: 12px;
}
.notice-link:hover {
  color: var(--blue);
}
.notice-source-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 10px;
  color: #a0adbf;
  padding: 17px 5px;
  line-height: 1.8;
}
@media (max-width: 760px) {
  .notice-filter-bottom {
    flex-wrap: wrap;
    gap: 8px;
  }
  .notice-filter-bottom input {
    max-width: 130px;
  }
  .filter-date-label {
    width: 100%;
  }
  .notice-filter-bottom .filter-actions {
    margin-left: 0;
    width: 100%;
    margin-top: 4px;
  }
  .notice-source-note {
    font-size: 9px;
    align-items: flex-start;
  }
}
</style>

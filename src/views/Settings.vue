<script setup lang="ts">
import { reactive, ref } from 'vue';
import Panel from '../components/Panel.vue';
import Icon from '../components/Icon.vue';
import StatusBadge from '../components/StatusBadge.vue';
import Modal from '../components/Modal.vue';
import { state, toast, resetDemo } from '../stores/platform';
import { teams } from '../data/seed';
const draft = reactive({ ...state.settings }),
  resetOpen = ref(false),
  tab = ref('general');
function save() {
  if (!draft.company.trim() || !draft.owner.trim()) {
    toast('请填写分厂名称与当前用户姓名', 'error');
    return;
  }
  Object.assign(state.settings, { ...draft });
  toast('平台演示设置已保存');
}
function reset() {
  resetDemo();
  Object.assign(draft, state.settings);
  resetOpen.value = false;
}
</script>
<template>
  <div class="page-heading">
    <div>
      <h1>基础设置</h1>
      <p>统一维护平台基础信息，准备后续业务系统对接。</p>
    </div>
    <span class="heading-note"><Icon name="shield" :size="13" />本地演示配置</span>
  </div>
  <div class="settings-layout">
    <nav class="settings-nav">
      <button
        v-for="s in [
          { id: 'general', label: '平台设置', icon: 'settings' },
          { id: 'teams', label: '班组与班次', icon: 'users' },
          { id: 'integrations', label: '系统对接', icon: 'database' },
          { id: 'demo', label: '演示数据', icon: 'sliders' },
        ]"
        :key="s.id"
        :class="{ active: tab === s.id }"
        @click="tab = s.id"
      >
        <Icon :name="s.icon" :size="17" />{{ s.label }}<Icon name="right" :size="13" />
      </button>
    </nav>
    <div class="stack">
      <Panel v-if="tab === 'general'" title="平台基本信息"
        ><div class="settings-form">
          <div class="form-field">
            <label class="required">分厂名称</label
            ><input v-model="draft.company" maxlength="30" aria-label="分厂名称" />
          </div>
          <div class="form-field">
            <label class="required">当前演示用户</label
            ><input v-model="draft.owner" maxlength="20" aria-label="演示用户姓名" />
          </div>
          <div class="settings-switch-row">
            <div>
              <strong>紧凑表格</strong>
              <p>减小表格行高，适合高密度业务数据查看</p>
            </div>
            <button
              class="switch"
              :class="{ on: draft.compact }"
              role="switch"
              :aria-checked="draft.compact"
              aria-label="紧凑表格"
              @click="draft.compact = !draft.compact"
            >
              <span />
            </button>
          </div>
          <div>
            <button class="btn primary" @click="save">
              <Icon name="save" :size="14" />保存设置
            </button>
          </div>
        </div></Panel
      ><template v-if="tab === 'teams'"
        ><Panel title="班组信息" flush
          ><div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>班组名称</th>
                  <th>演示人员数</th>
                  <th>业务范围</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(t, i) in teams" :key="t">
                  <td>{{ t }}</td>
                  <td>{{ [24, 24, 24, 20][i] }} 人</td>
                  <td>{{ i === 3 ? '设备维护与安灯处置' : '机加工生产与交接' }}</td>
                  <td><StatusBadge value="正常" /></td>
                </tr>
              </tbody>
            </table></div></Panel
        ><Panel title="演示班次"
          ><div class="shift-definitions">
            <div
              v-for="s in [
                { name: '早班', time: '07:00 — 15:00', color: '#3994f8' },
                { name: '中班', time: '15:00 — 23:00', color: '#29c5a0' },
                { name: '夜班', time: '23:00 — 次日 07:00', color: '#f2b451' },
              ]"
              :key="s.name"
            >
              <span :style="{ background: s.color }" /><strong>{{ s.name }}</strong>
              <p>{{ s.time }}</p>
            </div>
          </div>
          <div class="form-note mt-16">
            具体工时、迟到阈值、加班、假期与审批规则尚未配置，需以分厂制度和 gy_oa_system
            实际业务为准。
          </div></Panel
        ></template
      ><Panel v-if="tab === 'integrations'" title="系统对接准备"
        ><div
          v-for="s in [
            {
              name: 'X5 OA 系统',
              desc: '技术通知单只读同步、源文查看、附件映射。',
              icon: 'file',
              fields: '待确定：接口或授权数据通道、字段、更新频率、可见范围。',
            },
            {
              name: '考勤数据源',
              desc: '人员基础档案、打卡明细、排班与审批结果。',
              icon: 'calendar',
              fields: '待确定：gy_oa_system 数据结构、班组规则与工时计算方式。',
            },
            {
              name: '公司 IoT 平台',
              desc: '设备在线状态、传感器指标、设备异常事件。',
              icon: 'activity',
              fields: '待确定：设备编号映射、指标单位、更新时间与事件推送方式。',
            },
          ]"
          :key="s.name"
          class="integration-item"
        >
          <span><Icon :name="s.icon" :size="23" /></span>
          <div>
            <strong>{{ s.name }}</strong>
            <p>{{ s.desc }}</p>
            <small>{{ s.fields }}</small>
          </div>
          <StatusBadge value="未接入" />
        </div>
        <div class="form-note mt-16">
          本轮为纯前端工程，接口请求、密钥和定时同步任务均未启用。
        </div></Panel
      ><Panel v-if="tab === 'demo'" title="演示数据管理"
        ><div class="demo-info">
          <span class="demo-database-icon"><Icon name="database" :size="29" /></span>
          <h3>数据保存在当前浏览器</h3>
          <p>
            查询关注、执行进度、安灯工单、考勤申请和交接记录均使用本地存储。刷新页面后保留；更换设备、浏览器或清理站点数据后不会共享。
          </p>
          <div class="demo-counts">
            <span
              >设备 <b>{{ state.devices.length }}</b></span
            ><span
              >通知单 <b>{{ state.notices.length }}</b></span
            ><span
              >安灯工单 <b>{{ state.orders.length }}</b></span
            ><span
              >交接记录 <b>{{ state.handovers.length }}</b></span
            >
          </div>
          <button class="btn danger" @click="resetOpen = true">
            <Icon name="refresh" :size="14" />恢复初始演示数据
          </button>
        </div></Panel
      >
      <div class="settings-version">
        <span class="brand-mark"><Icon name="zap" :size="18" /></span
        ><span>水电分厂综合管理平台 <small>V0.1.0 · Vue 3 前端原型</small></span>
      </div>
    </div>
  </div>
  <Modal :open="resetOpen" title="恢复初始演示数据" @close="resetOpen = false"
    ><div class="form-note">
      这会清除当前浏览器新增的报修、申请、交接记录及修改的业务状态，并恢复预设示例。原始效果图和工程文件不受影响。
    </div>
    <p class="content-text">确认恢复后，当前浏览器内的演示修改无法撤销。</p>
    <template #footer
      ><button class="btn" @click="resetOpen = false">保留当前数据</button
      ><button class="btn danger" @click="reset">确认恢复</button></template
    ></Modal
  >
</template>
<style scoped>
.settings-layout {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  max-width: 1160px;
}
.settings-nav {
  padding: 10px;
  background: white;
  border: 1px solid #e5ecf6;
  border-radius: 9px;
}
.settings-nav button {
  display: flex;
  align-items: center;
  gap: 11px;
  background: transparent;
  border: 0;
  border-radius: 5px;
  width: 100%;
  padding: 15px 12px;
  font-size: 12px;
  color: #899db7;
  margin-bottom: 4px;
}
.settings-nav button.active {
  background: #eef5ff;
  color: #3887eb;
}
.settings-nav button > svg:last-child {
  margin-left: auto;
}
.settings-form {
  max-width: 580px;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 23px;
}
.settings-switch-row {
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}
.settings-switch-row strong {
  font-size: 12px;
  font-weight: 500;
  color: #6883a6;
}
.settings-switch-row p {
  font-size: 10px;
  color: #a0b0c6;
  margin-top: 7px;
}
.switch {
  width: 35px;
  height: 20px;
  border: 0;
  background: #d2ddea;
  border-radius: 12px;
  padding: 3px;
  flex-shrink: 0;
}
.switch > span {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}
.switch.on {
  background: #3489fa;
}
.switch.on > span {
  transform: translateX(15px);
}
.shift-definitions {
  display: flex;
  gap: 20px;
  padding: 12px 0;
}
.shift-definitions > div {
  flex: 1;
  background: #f8fbff;
  border: 1px solid #e8eff8;
  border-radius: 7px;
  padding: 20px 15px;
}
.shift-definitions span {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 8px;
}
.shift-definitions strong {
  font-size: 12px;
  font-weight: 500;
  color: #6583a8;
}
.shift-definitions p {
  font-size: 11px;
  color: #97aac4;
  margin-top: 14px;
}
.integration-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 25px 0;
  border-bottom: 1px solid #edf2f8;
}
.integration-item > span:first-child {
  padding: 13px;
  border-radius: 9px;
  background: #edf5ff;
  color: #7da6d9;
  display: grid;
  place-items: center;
}
.integration-item > div {
  flex: 1;
  min-width: 0;
}
.integration-item strong {
  font-size: 14px;
  font-weight: 500;
  color: #5e7da3;
}
.integration-item p {
  font-size: 11px;
  color: #93a7c2;
  margin-top: 9px;
  line-height: 1.8;
}
.integration-item small {
  display: block;
  font-size: 10px;
  color: #a7b7cd;
  margin-top: 7px;
  line-height: 1.8;
}
.demo-info {
  padding: 15px 5px 20px;
}
.demo-database-icon {
  display: inline-grid;
  place-items: center;
  width: 59px;
  height: 59px;
  background: #eef5ff;
  border-radius: 12px;
  color: #6d9fdc;
}
.demo-info h3 {
  font-size: 16px;
  font-weight: 500;
  color: #6682a6;
  margin: 22px 0 12px;
}
.demo-info > p {
  font-size: 12px;
  line-height: 2.1;
  color: #96a9c2;
  max-width: 600px;
}
.demo-counts {
  display: flex;
  gap: 25px;
  padding: 22px 0 28px;
  font-size: 11px;
  color: #98aac3;
  flex-wrap: wrap;
}
.demo-counts b {
  color: #678dbd;
  font-size: 15px;
  margin-left: 6px;
  font-weight: 500;
}
.settings-version {
  padding: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: #99acc6;
}
.settings-version .brand-mark {
  width: 28px;
  height: 29px;
  opacity: 0.6;
}
.settings-version small {
  display: block;
  font-size: 9px;
  color: #b0bfd2;
  margin-top: 5px;
}
@media (max-width: 760px) {
  .settings-layout {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  .settings-nav {
    display: flex;
    padding: 6px;
  }
  .settings-nav button {
    font-size: 10px;
    padding: 11px 7px;
    margin: 0;
    gap: 5px;
    justify-content: center;
  }
  .settings-nav button > svg:last-child {
    display: none;
  }
  .settings-nav button > svg:first-child {
    width: 14px;
  }
  .shift-definitions {
    flex-direction: column;
    gap: 11px;
  }
  .shift-definitions > div {
    padding: 17px;
  }
  .shift-definitions p {
    margin-top: 9px;
  }
  .integration-item {
    gap: 10px;
  }
  .integration-item > span:first-child {
    padding: 10px;
  }
  .integration-item .badge {
    font-size: 9px;
  }
  .integration-item strong {
    font-size: 12px;
  }
}
</style>

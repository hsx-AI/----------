<script setup lang="ts">
import { computed, ref } from 'vue';
import QRCode from 'qrcode';
import Icon from '../components/Icon.vue';
import Panel from '../components/Panel.vue';
import StatusBadge from '../components/StatusBadge.vue';
import MachineArt from '../components/MachineArt.vue';
import Modal from '../components/Modal.vue';
import { state, downloadCsv, toast } from '../stores/platform';
import { useRoute } from 'vue-router';
const route = useRoute(),
  q = ref(String(route.query.device || '')),
  zone = ref(''),
  status = ref(''),
  qrDevice = ref(''),
  qrUrl = ref(''),
  qrImage = ref(''),
  qrError = ref('');
const rows = computed(() =>
  state.devices.filter(
    (d) =>
      (!q.value || `${d.id} ${d.name}`.toLowerCase().includes(q.value.toLowerCase())) &&
      (!zone.value || d.zone === zone.value) &&
      (!status.value || d.status === status.value),
  ),
);
async function showQr(id: string) {
  qrDevice.value = id;
  qrError.value = '';
  qrImage.value = '';
  qrUrl.value = `${window.location.origin}${window.location.pathname}#/repair?device=${encodeURIComponent(id)}`;
  try {
    qrImage.value = await QRCode.toDataURL(qrUrl.value, {
      width: 280,
      margin: 2,
      color: { dark: '#173b69', light: '#ffffff' },
    });
  } catch {
    qrError.value = '二维码生成失败，请使用下方设备报修链接';
  }
}
function downloadQr() {
  if (!qrImage.value) return;
  const a = document.createElement('a');
  a.href = qrImage.value;
  a.download = `设备报修二维码-${qrDevice.value}.png`;
  a.click();
}
function exportData() {
  downloadCsv(
    '设备台账.csv',
    ['设备编码', '名称', '区域', '运行状态', '投用日期'],
    rows.value.map((d) => [d.id, d.name, d.zone, d.status, d.commissioned]),
  );
  toast('设备台账已导出');
}
</script>
<template>
  <div class="page-heading">
    <div>
      <h1>设备台账</h1>
      <p>管理设备基础信息，为每一台设备建立数字档案。</p>
    </div>
    <div class="heading-actions">
      <RouterLink to="/equipment" class="btn"
        ><Icon name="factory" :size="14" />数字孪生看板</RouterLink
      ><button class="btn primary" @click="exportData">
        <Icon name="download" :size="14" />导出台账
      </button>
    </div>
  </div>
  <div class="asset-summary">
    <div>
      <span class="asset-summary-icon"><Icon name="database" :size="24" /></span>
      <div>
        <strong>{{ state.devices.length }}<small>台设备已建档</small></strong>
        <p>设备身份清晰，现场报修有据可查。</p>
      </div>
    </div>
    <div class="asset-summary-stats">
      <span v-for="s in ['运行中', '待机', '故障停机', '离线']" :key="s"
        ><strong>{{ state.devices.filter((d) => d.status === s).length }}</strong
        ><StatusBadge :value="s" dot
      /></span>
    </div>
  </div>
  <div class="toolbar">
    <div class="filter-grid">
      <div class="filter-field grow">
        <label>设备检索</label>
        <div class="search-input">
          <Icon name="search" :size="16" /><input
            v-model="q"
            placeholder="设备编码或名称"
            aria-label="设备台账关键词"
          />
        </div>
      </div>
      <div class="filter-field">
        <label>所属区域</label
        ><select v-model="zone" aria-label="台账设备区域">
          <option value="">全部区域</option>
          <option v-for="z in ['加工中心区', '车床加工区', '起重吊装区', '公用设备区']" :key="z">
            {{ z }}
          </option>
        </select>
      </div>
      <div class="filter-field">
        <label>设备状态</label
        ><select v-model="status" aria-label="台账设备状态">
          <option value="">全部状态</option>
          <option v-for="s in ['运行中', '待机', '故障停机', '离线']" :key="s">{{ s }}</option>
        </select>
      </div>
      <button
        class="btn"
        @click="
          q = '';
          zone = '';
          status = '';
        "
      >
        <Icon name="refresh" :size="14" />重置
      </button>
    </div>
  </div>
  <Panel title="设备档案列表" :subtitle="rows.length + ' 台'" flush
    ><div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>设备名称 / 编码</th>
            <th>所属区域</th>
            <th>投用日期</th>
            <th>运行状态</th>
            <th>关联工单</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in rows" :key="d.id">
            <td>
              <div class="asset-name-cell">
                <MachineArt :kind="d.kind" :active="d.status === '故障停机'" />
                <div>
                  <strong>{{ d.name }}</strong>
                  <p>SB-{{ d.id }}</p>
                </div>
              </div>
            </td>
            <td>{{ d.zone }}</td>
            <td>{{ d.commissioned }}</td>
            <td><StatusBadge :value="d.status" dot /></td>
            <td>
              {{ state.orders.filter((o) => o.device === d.id && o.status !== '已关闭').length }}
              条未关闭
            </td>
            <td>
              <div class="flex gap-12">
                <RouterLink :to="'/equipment?device=' + d.id" class="text-button"
                  >查看设备</RouterLink
                ><button class="text-button" @click="showQr(d.id)">
                  <Icon name="scan" :size="13" />报修二维码
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!rows.length" class="empty-state">
        <Icon name="database" :size="34" />
        <p>未找到符合条件的设备</p>
      </div>
    </div></Panel
  ><Modal :open="!!qrDevice" :title="qrDevice + ' · 设备报修二维码'" @close="qrDevice = ''"
    ><div class="qr-preview">
      <img v-if="qrImage" :src="qrImage" :alt="qrDevice + '报修二维码'" />
      <p v-else class="muted">{{ qrError || '正在生成二维码…' }}</p>
      <strong>{{ state.devices.find((d) => d.id === qrDevice)?.name }}</strong
      ><span>扫描后进入设备安灯报修页面</span>
    </div>
    <div class="form-note">
      二维码使用当前访问地址。手机需与电脑处于同一网络，并通过电脑的局域网地址访问平台后生成二维码；localhost
      地址只适用于本机。
    </div>
    <label class="form-hint">设备报修链接</label><a class="qr-link" :href="qrUrl">{{ qrUrl }}</a
    ><template #footer
      ><button class="btn" @click="qrDevice = ''">关闭</button
      ><button class="btn primary" :disabled="!qrImage" @click="downloadQr">
        <Icon name="download" :size="14" />下载二维码
      </button></template
    ></Modal
  >
</template>
<style scoped>
.asset-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: linear-gradient(105deg, #edf5ff, #f9fcff);
  border: 1px solid #dfebfa;
  padding: 26px;
  border-radius: 9px;
  margin-bottom: 20px;
}
.asset-summary > div:first-child {
  display: flex;
  gap: 17px;
  align-items: center;
}
.asset-summary-icon {
  width: 54px;
  height: 54px;
  background: #e0edff;
  color: #448ce7;
  display: grid;
  place-items: center;
  border-radius: 12px;
}
.asset-summary strong {
  font-size: 29px;
  font-weight: 600;
  color: #376ba9;
}
.asset-summary strong small {
  font-size: 13px;
  font-weight: 400;
  margin-left: 10px;
  color: #7996bb;
}
.asset-summary p {
  font-size: 10px;
  color: #9cb0c9;
  margin-top: 9px;
}
.asset-summary-stats {
  display: flex;
  gap: 30px;
}
.asset-summary-stats > span {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}
.asset-summary-stats strong {
  font-size: 24px;
  font-weight: 500;
}
.asset-name-cell {
  display: flex;
  gap: 13px;
  align-items: center;
}
.asset-name-cell .machine-art {
  width: 73px;
  background: #f6f9fc;
  border: 1px solid #edf1f7;
  border-radius: 5px;
}
.asset-name-cell strong {
  font-size: 12px;
  font-weight: 500;
}
.asset-name-cell p {
  font-size: 10px;
  color: #a0afc3;
  margin-top: 7px;
}
.qr-preview {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 15px 21px;
  gap: 11px;
}
.qr-preview img {
  width: 220px;
  height: 220px;
}
.qr-preview strong {
  font-size: 14px;
  color: #57789e;
  font-weight: 500;
}
.qr-preview span {
  font-size: 11px;
  color: #9cadc3;
}
.qr-link {
  font-size: 10px;
  display: block;
  word-break: break-all;
  border: 1px solid #e7eff9;
  background: #fafcff;
  border-radius: 5px;
  padding: 11px;
  margin-top: 8px;
  line-height: 1.8;
}
@media (max-width: 760px) {
  .asset-summary {
    flex-direction: column;
    align-items: flex-start;
    padding: 19px;
  }
  .asset-summary-stats {
    width: 100%;
    justify-content: space-around;
    gap: 8px;
    border-top: 1px solid #dfeaf9;
    padding-top: 16px;
  }
  .asset-summary-stats strong {
    font-size: 21px;
  }
  .asset-summary strong {
    font-size: 26px;
  }
  .asset-summary strong small {
    font-size: 12px;
  }
  .asset-name-cell .machine-art {
    width: 60px;
  }
}
</style>

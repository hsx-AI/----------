<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Icon from '../components/Icon.vue';
import MachineArt from '../components/MachineArt.vue';
import StatusBadge from '../components/StatusBadge.vue';
import { state, toast, nextOrderId, now } from '../stores/platform';
const route = useRoute(),
  router = useRouter();
const selectedDevice = ref(String(route.query.device || 'CNC-03'));
const device = computed(() => state.devices.find((d) => d.id === selectedDevice.value));
const form = reactive({
  category: '电气',
  description: '',
  urgency: '一般',
  reporter: '',
  phone: '',
});
const fileInput = ref<HTMLInputElement>(),
  photos = ref<string[]>([]),
  loadingPhotos = ref(false),
  submitting = ref(false),
  error = ref(''),
  success = ref('');
async function readPhotos(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files || []);
  if (files.length + photos.value.length > 3) {
    error.value = '最多上传 3 张现场照片';
    return;
  }
  loadingPhotos.value = true;
  error.value = '';
  try {
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        error.value = '只支持 JPG、PNG、WebP 图片';
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        error.value = '单张图片不能超过 5MB';
        continue;
      }
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        });
        const ratio = Math.min(1, 1000 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw Error('图片处理失败');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        photos.value.push(canvas.toDataURL('image/jpeg', 0.72));
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  } catch {
    error.value = '图片读取失败，请更换图片重试';
  } finally {
    loadingPhotos.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}
function submit() {
  error.value = '';
  if (!device.value) {
    error.value = '设备编号无效，请先选择设备';
    return;
  }
  if (form.description.trim().length < 5) {
    error.value = '请填写至少 5 个字的故障描述';
    return;
  }
  if (!form.reporter.trim()) {
    error.value = '请填写报修人姓名';
    return;
  }
  if (!/^1\d{10}$/.test(form.phone.trim())) {
    error.value = '请填写 11 位手机号码';
    return;
  }
  if (loadingPhotos.value) return;
  submitting.value = true;
  const id = nextOrderId();
  state.orders.unshift({
    id,
    device: device.value.id,
    fault: form.description.trim().slice(0, 16),
    category: form.category,
    urgency: form.urgency,
    description: form.description.trim(),
    reported: now(),
    reporter: form.reporter.trim(),
    phone: form.phone.trim(),
    status: '待受理',
    assignee: '',
    photos: [...photos.value],
    logs: [
      {
        time: now(),
        text: `${form.reporter.trim()}提交安灯报修，故障类型：${form.category}，等级：${form.urgency}。`,
      },
    ],
  });
  if (form.urgency === '停机') device.value.status = '故障停机';
  success.value = id;
  submitting.value = false;
  toast('本地安灯报修已提交');
}
onBeforeUnmount(() => {
  photos.value = [];
});
</script>
<template>
  <div class="repair-page">
    <div class="repair-topbar">
      <RouterLink to="/equipment" class="repair-brand"
        ><span class="brand-mark"><Icon name="zap" :size="20" /></span>水电分厂<span
          >现场服务</span
        ></RouterLink
      ><span class="repair-demo"><i class="device-dot idle" />前端演示</span>
    </div>
    <div class="repair-container">
      <div class="repair-heading">
        <button class="icon-button" aria-label="返回设备管理" @click="router.push('/equipment')">
          <Icon name="back" :size="23" />
        </button>
        <h1>扫码安灯报修</h1>
        <span class="repair-step">设备 · 故障 · 提交</span>
      </div>
      <template v-if="!success"
        ><div class="repair-subheading">
          <Icon name="shield" :size="14" />快速上报现场异常，让问题及时得到响应。
        </div>
        <section class="repair-device-card">
          <MachineArt v-if="device" :kind="device.kind" :active="device.status === '故障停机'" />
          <div class="repair-device-name">
            <select v-model="selectedDevice" aria-label="选择报修设备">
              <option v-if="!device" :value="selectedDevice">未知设备，请重新选择</option>
              <option v-for="d in state.devices" :key="d.id" :value="d.id">
                {{ d.id }} · {{ d.name }}
              </option>
            </select>
            <p v-if="device"><Icon name="pin" :size="13" />{{ device.zone }}</p>
          </div>
          <div v-if="device" class="repair-device-status">
            <span><Icon name="success" :size="12" />设备已识别</span
            ><StatusBadge :value="device.status" dot />
          </div>
        </section>
        <form @submit.prevent="submit">
          <section class="repair-section">
            <div class="repair-section-heading">
              <h2><Icon name="list" :size="19" />故障类型</h2>
              <span>选择主要故障类型</span>
            </div>
            <div class="fault-types">
              <button
                v-for="c in [
                  { name: '电气', icon: 'zap' },
                  { name: '机械', icon: 'cog' },
                  { name: '液压', icon: 'droplet' },
                  { name: '其他', icon: 'more' },
                ]"
                :key="c.name"
                type="button"
                :class="{ selected: form.category === c.name }"
                @click="form.category = c.name"
              >
                <Icon :name="c.icon" :size="24" /><strong>{{ c.name }}</strong
                ><i v-if="form.category === c.name"><Icon name="check" :size="9" /></i>
              </button>
            </div>
          </section>
          <section class="repair-section">
            <div class="repair-section-heading">
              <h2><Icon name="file" :size="19" />故障描述 <em>*</em></h2>
              <span>描述现象、时间及相关信息</span>
            </div>
            <div class="description-field">
              <textarea
                v-model="form.description"
                rows="4"
                maxlength="200"
                placeholder="例如：启动后主轴无反应，控制面板报错 E100，约 10:30 发生…"
                aria-label="故障描述"
              /><span>{{ form.description.length }} / 200</span>
            </div>
          </section>
          <section class="repair-section">
            <div class="repair-section-heading">
              <h2><Icon name="bell" :size="19" />紧急程度</h2>
              <span>根据现场情况选择</span>
            </div>
            <div class="urgency-options">
              <button
                v-for="u in [
                  { name: '一般', desc: '不影响生产', sub: '可按计划处理', icon: 'clock' },
                  { name: '紧急', desc: '影响生产', sub: '请尽快处理', icon: 'alert' },
                  { name: '停机', desc: '已无法生产', sub: '需立即处理', icon: 'bell' },
                ]"
                :key="u.name"
                type="button"
                :class="[
                  { selected: form.urgency === u.name },
                  u.name === '停机' ? 'danger' : u.name === '紧急' ? 'warning' : '',
                ]"
                @click="form.urgency = u.name"
              >
                <Icon :name="u.icon" :size="23" />
                <div>
                  <strong>{{ u.name }}</strong>
                  <p>{{ u.desc }}<br />{{ u.sub }}</p>
                </div>
              </button>
            </div>
          </section>
          <section class="repair-section">
            <div class="repair-section-heading">
              <h2><Icon name="camera" :size="19" />现场照片</h2>
              <span>选填 · 最多 3 张</span>
            </div>
            <div class="photo-uploads">
              <div v-for="(p, i) in photos" :key="i" class="uploaded-photo">
                <img :src="p" :alt="'现场照片 ' + (i + 1)" /><button
                  type="button"
                  :aria-label="'移除照片' + (i + 1)"
                  @click="photos.splice(i, 1)"
                >
                  <Icon name="close" :size="13" />
                </button>
              </div>
              <button
                v-if="photos.length < 3"
                class="upload-photo-button"
                type="button"
                :disabled="loadingPhotos"
                @click="fileInput?.click()"
              >
                <Icon name="camera" :size="25" /><span>{{
                  loadingPhotos ? '正在处理…' : '上传现场照片'
                }}</span
                ><small>JPG / PNG / WebP，单张 ≤ 5MB</small></button
              ><input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                @change="readPhotos"
              />
            </div>
          </section>
          <section class="repair-section">
            <div class="repair-section-heading">
              <h2><Icon name="user" :size="19" />报修人信息</h2>
            </div>
            <div class="form-grid">
              <div class="form-field">
                <label class="required">报修人</label
                ><input
                  v-model="form.reporter"
                  placeholder="请输入姓名"
                  maxlength="20"
                  aria-label="报修人"
                  autocomplete="name"
                />
              </div>
              <div class="form-field">
                <label class="required">联系方式</label
                ><input
                  v-model="form.phone"
                  type="tel"
                  placeholder="请输入 11 位手机号码"
                  maxlength="11"
                  aria-label="联系方式"
                  autocomplete="tel"
                />
              </div>
            </div>
          </section>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button type="submit" class="repair-submit" :disabled="submitting || loadingPhotos">
            <Icon name="send" :size="18" />{{ submitting ? '正在提交…' : '提交安灯报修' }}
          </button>
          <div class="repair-bottom-note">
            <Icon name="info" :size="12" />本次提交仅生成本地演示工单，不发送真实通知。
          </div>
        </form></template
      >
      <section v-else class="repair-success">
        <span class="repair-success-icon"><Icon name="checks" :size="40" /></span>
        <h2>报修已提交</h2>
        <p>已生成本地安灯工单，可在工单管理中继续处理。</p>
        <div class="success-order-id">
          <span>工单编号</span><strong>{{ success }}</strong>
        </div>
        <div class="flex gap-12">
          <RouterLink :to="'/orders?id=' + success" class="btn primary"
            >查看工单 <Icon name="right" :size="14" /></RouterLink
          ><RouterLink to="/equipment" class="btn">返回设备看板</RouterLink>
        </div>
      </section>
    </div>
    <footer class="repair-footer">水电分厂综合管理平台 · 设备安灯现场服务</footer>
  </div>
</template>
<style scoped>
.repair-page {
  min-height: 100vh;
  background: radial-gradient(ellipse at 50% 15%, #eaf3ff88 0, transparent 70%), #f5f8fc;
}
.repair-topbar {
  height: 63px;
  background: #fff;
  border-bottom: 1px solid #e6edf6;
  padding: 0 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.repair-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #28496f;
}
.repair-brand > span:last-child {
  font-weight: 400;
  font-size: 11px;
  color: #96a7bf;
  border-left: 1px solid #e5ebf4;
  margin-left: 6px;
  padding-left: 16px;
}
.repair-brand .brand-mark {
  width: 29px;
  height: 30px;
  border-radius: 7px;
}
.repair-demo {
  font-size: 10px;
  color: #99a9bf;
  display: flex;
  gap: 6px;
  align-items: center;
}
.repair-container {
  max-width: 690px;
  padding: 30px 24px 20px;
  margin: 0 auto;
}
.repair-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}
.repair-heading h1 {
  font-size: 25px;
}
.repair-heading .icon-button {
  margin-left: -5px;
}
.repair-step {
  margin-left: auto;
  font-size: 10px;
  color: #a2b2c8;
}
.repair-subheading {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 23px;
  color: #8ca1bc;
  font-size: 11px;
  padding-left: 45px;
}
.repair-device-card {
  display: flex;
  align-items: center;
  gap: 17px;
  border: 1px solid #dfebf9;
  border-radius: 10px;
  padding: 20px;
  background: #fff;
  margin-bottom: 16px;
}
.repair-device-card .machine-art {
  width: 116px;
  max-height: 90px;
  flex-shrink: 0;
}
.repair-device-name {
  flex: 1;
  min-width: 0;
}
.repair-device-name select {
  font-size: 14px;
  font-weight: 600;
  color: #2b4b70;
  width: 100%;
  padding: 6px;
  border-color: transparent;
  margin-left: -6px;
}
.repair-device-name select:hover {
  border-color: #dae7f7;
}
.repair-device-name p {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #99abc1;
  font-size: 11px;
  margin-top: 9px;
}
.repair-device-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 17px;
}
.repair-device-status > span:first-child {
  color: #1fbb91;
  font-size: 10px;
  display: flex;
  gap: 5px;
  align-items: center;
  white-space: nowrap;
}
.repair-section {
  background: #fff;
  border: 1px solid #e4ecf6;
  border-radius: 9px;
  padding: 21px;
  margin-bottom: 15px;
}
.repair-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  gap: 10px;
}
.repair-section-heading h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}
.repair-section-heading h2 > svg {
  color: #328cf8;
}
.repair-section-heading h2 em {
  font-style: normal;
  color: #ef7580;
  font-size: 11px;
}
.repair-section-heading > span {
  font-size: 10px;
  color: #a5b2c4;
}
.fault-types {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.fault-types button {
  border: 1px solid #e0e7f1;
  background: #fff;
  color: #a0afc3;
  border-radius: 7px;
  padding: 16px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
}
.fault-types button strong {
  font-size: 12px;
  font-weight: 500;
  color: #6d83a0;
}
.fault-types button.selected {
  border-color: #61aaff;
  background: #f1f8ff;
  color: #2989f9;
}
.fault-types button.selected strong {
  color: #3487ea;
}
.fault-types button i {
  position: absolute;
  bottom: -1px;
  right: -1px;
  background: #3a94fa;
  border-radius: 6px 0 5px 0;
  padding: 2px 2px 2px 4px;
  color: #fff;
  display: flex;
}
.description-field {
  position: relative;
}
.description-field textarea {
  border-color: #e3eaf4;
  padding: 12px;
  font-size: 12px;
  line-height: 1.9;
  min-height: 115px;
  padding-bottom: 26px;
  display: block;
}
.description-field > span {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 10px;
  color: #a9b5c7;
}
.urgency-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 11px;
}
.urgency-options button {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 11px;
  border: 1px solid #e1e9f3;
  background: white;
  border-radius: 7px;
  text-align: left;
  color: #a3b2c6;
}
.urgency-options button > svg {
  margin-top: 2px;
  flex-shrink: 0;
}
.urgency-options strong {
  font-size: 13px;
  color: #6c83a1;
  font-weight: 500;
}
.urgency-options p {
  font-size: 10px;
  line-height: 1.8;
  margin-top: 8px;
  color: #a6b3c6;
}
.urgency-options button.selected {
  border-color: #83b7fb;
  background: #f5faff;
  color: #438de9;
}
.urgency-options button.selected strong {
  color: #438de9;
}
.urgency-options button.warning.selected {
  border-color: #efbf6c;
  background: #fffaf0;
  color: #e9a32d;
}
.urgency-options button.warning.selected strong {
  color: #d89d36;
}
.urgency-options button.danger.selected {
  border-color: #f29ca5;
  background: #fff7f8;
  color: #ee6a79;
}
.urgency-options button.danger.selected strong {
  color: #e65b6c;
}
.photo-uploads {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.upload-photo-button {
  padding: 19px 12px;
  background: #fbfdff;
  border: 1px dashed #bdcfe5;
  border-radius: 7px;
  color: #66a1ea;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 9px;
  min-width: 178px;
}
.upload-photo-button span {
  font-size: 11px;
  color: #8da7c7;
}
.upload-photo-button small {
  font-size: 8px;
  color: #a9b8cc;
}
.uploaded-photo {
  width: 115px;
  height: 112px;
  position: relative;
}
.uploaded-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 7px;
}
.uploaded-photo button {
  position: absolute;
  right: 4px;
  top: 4px;
  border: 0;
  background: #233b5ea8;
  display: grid;
  place-items: center;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  color: white;
}
.repair-submit {
  width: 100%;
  border: 0;
  padding: 16px;
  background: linear-gradient(105deg, #1686ff, #2070ee);
  color: #fff;
  border-radius: 7px;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 5px 15px #1677ff20;
}
.repair-submit:hover {
  filter: brightness(1.04);
}
.repair-bottom-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 15px 0;
  font-size: 10px;
  color: #9cadc4;
}
.repair-footer {
  text-align: center;
  padding: 13px 10px 25px;
  color: #b6c3d5;
  font-size: 9px;
}
.repair-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 65px 20px;
  background: #fff;
  border: 1px solid #e0ebf8;
  border-radius: 12px;
  margin-top: 32px;
  gap: 20px;
  text-align: center;
}
.repair-success-icon {
  width: 84px;
  height: 84px;
  display: grid;
  place-items: center;
  background: #eaf9f2;
  border-radius: 50%;
  color: #25bb92;
}
.repair-success h2 {
  font-size: 25px;
}
.repair-success p {
  font-size: 12px;
  color: #98a9c1;
  line-height: 1.8;
}
.success-order-id {
  padding: 19px 30px;
  background: #f7faff;
  border: 1px solid #e4edf9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 5px;
}
.success-order-id span {
  font-size: 10px;
  color: #a2b3cb;
}
.success-order-id strong {
  font-size: 18px;
  font-weight: 500;
  color: #5c83b3;
}
@media (max-width: 600px) {
  .repair-topbar {
    height: 55px;
    padding: 0 16px;
  }
  .repair-brand {
    font-size: 13px;
  }
  .repair-brand > span:last-child {
    font-size: 9px;
    padding-left: 10px;
    margin-left: 1px;
  }
  .repair-container {
    padding: 23px 14px 10px;
  }
  .repair-heading {
    gap: 8px;
  }
  .repair-heading h1 {
    font-size: 22px;
  }
  .repair-step {
    font-size: 9px;
  }
  .repair-subheading {
    font-size: 10px;
    padding-left: 34px;
    margin-bottom: 20px;
  }
  .repair-device-card {
    padding: 17px 12px;
    gap: 8px;
    flex-wrap: wrap;
  }
  .repair-device-card .machine-art {
    width: 90px;
  }
  .repair-device-name select {
    font-size: 12px;
  }
  .repair-device-status {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f0f4f9;
    padding-top: 12px;
    width: 100%;
  }
  .repair-section {
    padding: 18px 15px;
  }
  .repair-section-heading > span {
    font-size: 9px;
  }
  .repair-section-heading h2 {
    font-size: 13px;
    gap: 6px;
  }
  .fault-types {
    gap: 8px;
  }
  .fault-types button {
    padding: 14px 5px;
  }
  .urgency-options {
    gap: 8px;
  }
  .urgency-options button {
    gap: 7px;
    padding: 13px 7px;
    flex-direction: column;
  }
  .urgency-options button > svg {
    width: 20px;
  }
  .urgency-options strong {
    font-size: 12px;
  }
  .urgency-options p {
    font-size: 9px;
    margin-top: 6px;
  }
  .repair-section .form-grid {
    grid-template-columns: 1fr;
  }
  .repair-bottom-note {
    font-size: 9px;
    line-height: 1.8;
  }
  .upload-photo-button {
    min-width: 148px;
  }
  .repair-success {
    padding: 45px 18px;
  }
  .repair-success p {
    font-size: 11px;
  }
}
</style>

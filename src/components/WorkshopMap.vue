<script setup lang="ts">
import { computed } from 'vue';
import { state } from '../stores/platform';
import MachineArt from './MachineArt.vue';
withDefaults(defineProps<{ selected?: string; compact?: boolean; filter?: string }>(), {
  filter: '',
});
const emit = defineEmits<{ select: [id: string] }>();
const zones = computed(() =>
  ['加工中心区', '车床加工区', '起重吊装区', '公用设备区'].map((name) => ({
    name,
    devices: state.devices.filter((d) => d.zone === name),
  })),
);
</script>
<template>
  <div class="workshop-map" :class="{ compact }">
    <div class="map-left-rooms"><span>办公区</span><span>工具间</span><span>原材料区</span></div>
    <div class="workshop-floor">
      <div
        v-for="(zone, index) in zones"
        :key="zone.name"
        class="floor-zone"
        :class="['zone-' + index]"
      >
        <div class="zone-label">
          <span class="zone-number">0{{ index + 1 }}</span
          >{{ zone.name }}<span class="zone-count">{{ zone.devices.length }} 台设备</span>
        </div>
        <div class="zone-machines">
          <button
            v-for="d in zone.devices"
            :key="d.id"
            class="map-machine"
            :class="{
              selected: selected === d.id,
              fault: d.status === '故障停机',
              dimmed: filter && filter !== d.status,
            }"
            :aria-label="`${d.id} ${d.name} ${d.status}`"
            @click="emit('select', d.id)"
          >
            <MachineArt :kind="d.kind" :active="d.status === '故障停机'" /><span
              class="machine-caption"
              ><i
                class="device-dot"
                :class="{
                  running: d.status === '运行中',
                  idle: d.status === '待机',
                  fault: d.status === '故障停机',
                  offline: d.status === '离线',
                }"
              />{{ d.id }}</span
            >
          </button>
        </div>
      </div>
      <div class="map-aisle"><span>车 间 主 通 道</span><span>→</span></div>
    </div>
    <div class="map-right-rooms"><span>成品区</span><span>出入口 →</span></div>
  </div>
</template>

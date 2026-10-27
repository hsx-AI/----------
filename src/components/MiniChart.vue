<script setup lang="ts">
import { computed, useId } from 'vue';
const props = withDefaults(
  defineProps<{
    values?: number[];
    labels?: string[];
    kind?: 'bar' | 'line';
    color?: string;
    height?: number;
    unit?: string;
  }>(),
  {
    values: () => [88, 90, 87, 85, 89, 91, 86],
    labels: () => ['10-16', '10-17', '10-18', '10-19', '10-20', '10-21', '10-22'],
    kind: 'bar',
    color: '#2587f9',
    height: 170,
    unit: '人',
  },
);
const chartId = useId();
const max = computed(() => {
  const highest = Math.max(...props.values, 0);
  if (highest === 0) return 100;
  const targetStep = (highest * 1.15) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  return Math.ceil(targetStep / magnitude) * magnitude * 4;
});
const point = (v: number, i: number) =>
  `${46 + i * (446 / Math.max(props.values.length - 1, 1))},${149 - (v / max.value) * 118}`;
const points = computed(() => props.values.map(point).join(' '));
</script>
<template>
  <div class="chart-wrap">
    <svg
      viewBox="0 0 530 190"
      :style="{ height: height + 'px' }"
      role="img"
      :aria-label="`${kind === 'bar' ? '柱状' : '折线'}图：${labels.map((l, i) => l + ' ' + values[i] + unit).join('，')}`"
    >
      <defs>
        <linearGradient :id="chartId + '-bar'" x1="0" y1="0" x2="0" y2="1">
          <stop :stop-color="color" />
          <stop offset="1" :stop-color="color" stop-opacity=".65" />
        </linearGradient>
        <linearGradient :id="chartId + '-area'" x1="0" y1="0" x2="0" y2="1">
          <stop :stop-color="color" stop-opacity=".18" />
          <stop offset="1" :stop-color="color" stop-opacity=".015" />
        </linearGradient>
      </defs>
      <text x="12" y="16" class="chart-label">{{ unit }}</text>
      <g v-for="i in 5" :key="i">
        <line
          x1="36"
          :y1="149 - (i - 1) * 29.5"
          x2="509"
          :y2="149 - (i - 1) * 29.5"
          stroke="#e9eef5"
          stroke-dasharray="3 3"
        />
        <text x="27" :y="153 - (i - 1) * 29.5" text-anchor="end" class="chart-label">
          {{ Number((((i - 1) * max) / 4).toFixed(1)) }}
        </text>
      </g>
      <template v-if="kind === 'bar'">
        <g v-for="(v, i) in values" :key="i">
          <rect
            :x="48 + i * (446 / values.length)"
            :y="149 - (v / max) * 118"
            :width="Math.min(33, (446 / values.length) * 0.55)"
            :height="(v / max) * 118"
            rx="3"
            :fill="`url(#${chartId}-bar)`"
          />
          <text
            :x="48 + i * (446 / values.length) + Math.min(33, (446 / values.length) * 0.55) / 2"
            :y="140 - (v / max) * 118"
            text-anchor="middle"
            class="chart-value"
          >
            {{ v }}
          </text>
          <text
            :x="48 + i * (446 / values.length) + Math.min(33, (446 / values.length) * 0.55) / 2"
            y="176"
            text-anchor="middle"
            class="chart-label"
          >
            {{ labels[i] }}
          </text>
        </g>
      </template>
      <template v-else>
        <polygon :points="`46,149 ${points} 492,149`" :fill="`url(#${chartId}-area)`" />
        <polyline :points="points" fill="none" :stroke="color" stroke-width="2.5" />
        <g v-for="(v, i) in values" :key="i">
          <circle
            :cx="46 + i * (446 / Math.max(values.length - 1, 1))"
            :cy="149 - (v / max) * 118"
            r="3.5"
            fill="white"
            :stroke="color"
            stroke-width="2"
          />
          <text
            :x="46 + i * (446 / Math.max(values.length - 1, 1))"
            y="176"
            text-anchor="middle"
            class="chart-label"
          >
            {{ labels[i] }}
          </text>
        </g>
      </template>
    </svg>
  </div>
</template>

<script setup lang="ts">
import Icon from './Icon.vue';
withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    unit?: string;
    icon: string;
    tone?: string;
    trend?: string;
    trendUp?: boolean;
    trendDirection?: 'up' | 'down';
    hint?: string;
  }>(),
  { tone: 'blue' },
);
</script>
<template>
  <div class="metric-card" :class="tone">
    <div class="metric-head">
      <span>{{ label }}</span
      ><span class="metric-icon"><Icon :name="icon" :size="22" /></span>
    </div>
    <div class="metric-value">
      {{ value }}<span class="metric-unit">{{ unit }}</span>
    </div>
    <div class="metric-bottom">
      <span v-if="trend" class="trend" :class="{ negative: trendUp }"
        ><Icon :name="trendDirection === 'up' || trendUp ? 'up' : 'arrowdown'" :size="12" />{{
          trend
        }}</span
      ><span>{{ hint || '较昨日' }}</span
      ><slot />
    </div>
  </div>
</template>

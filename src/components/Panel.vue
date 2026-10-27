<script setup lang="ts">
defineProps<{ title?: string; subtitle?: string; flush?: boolean }>();
</script>
<template>
  <section class="panel">
    <header v-if="title" class="panel-heading">
      <div class="panel-title">
        {{ title }}<span v-if="subtitle" class="panel-subtitle">{{ subtitle }}</span>
      </div>
      <div class="panel-tools"><slot name="actions" /></div>
    </header>
    <div :class="['panel-body', { flush: flush }]"><slot /></div>
  </section>
</template>

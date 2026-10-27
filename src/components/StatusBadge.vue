<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ value: string; dot?: boolean }>();
const tone = computed(() => {
  if (['运行中', '已完成', '已关闭', '已通过', '正常', '已确认', '技术改进'].includes(props.value))
    return 'green';
  if (
    ['故障停机', '高', '紧急', '停机', '即将到期', '已驳回', '未打卡', '待受理'].includes(
      props.value,
    )
  )
    return 'red';
  if (
    ['待接收', '待处理', '维修中', '待确认', '待复核', '中', '一般', '草稿'].includes(props.value)
  )
    return 'orange';
  if (['工艺改进'].includes(props.value)) return 'purple';
  if (['离线', '未开始'].includes(props.value)) return 'gray';
  return 'blue';
});
</script>
<template>
  <span class="badge" :class="tone"><i v-if="dot" class="status-dot" />{{ value }}</span>
</template>

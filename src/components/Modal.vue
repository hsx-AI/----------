<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import Icon from './Icon.vue';
const props = defineProps<{ open: boolean; title: string; wide?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLElement>();
let previous: HTMLElement | null = null;
function keydown(e: KeyboardEvent) {
  if (!props.open) return;
  if (e.key === 'Escape') emit('close');
  if (e.key === 'Tab') {
    const els = Array.from(
      dialog.value?.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href]') || [],
    ).filter((el) => !el.hasAttribute('disabled'));
    if (!els.length) {
      e.preventDefault();
      return;
    }
    const first = els[0],
      last = els.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
}
watch(
  () => props.open,
  async (open) => {
    if (open) {
      previous = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', keydown);
      await nextTick();
      dialog.value?.focus();
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', keydown);
      previous?.focus();
    }
  },
);
onBeforeUnmount(() => {
  document.body.style.overflow = '';
  document.removeEventListener('keydown', keydown);
});
</script>
<template>
  <Teleport to="body"
    ><Transition name="modal"
      ><div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <section
          ref="dialog"
          class="modal-dialog"
          :class="{ wide }"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
        >
          <header>
            <h2>{{ title }}</h2>
            <button class="icon-button" aria-label="关闭弹窗" @click="emit('close')">
              <Icon name="close" />
            </button>
          </header>
          <div class="modal-content"><slot /></div>
          <footer v-if="$slots.footer"><slot name="footer" /></footer>
        </section></div></Transition
  ></Teleport>
</template>

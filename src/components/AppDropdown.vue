<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

type DropdownValue = string | number;

type DropdownOption = {
  value: DropdownValue;
  label: string;
};

const props = defineProps<{
  modelValue: DropdownValue;
  options: DropdownOption[];
  label?: string;
  disabled?: boolean;
  menuClass?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: DropdownValue];
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const selectedOption = computed(() => {
  return props.options.find((option) => option.value === props.modelValue) ?? props.options[0] ?? null;
});

function choose(value: DropdownValue) {
  emit('update:modelValue', value);
  open.value = false;
}

function toggle() {
  if (!props.disabled) {
    open.value = !open.value;
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (root.value?.contains(event.target as Node)) {
    return;
  }
  open.value = false;
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <div ref="root" class="relative block">
    <span v-if="label" class="editorial-label">{{ label }}</span>
    <button
      type="button"
      class="motion-press flex min-h-[50px] w-full items-center justify-between gap-3 rounded-md border bg-[#20201f] px-4 py-3 text-left text-white outline-none hover:border-dc-yellow/35 focus:border-dc-yellow focus:shadow-[0_0_0_3px_rgba(249,225,94,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
      :class="[
        label ? 'mt-2' : '',
        open ? 'border-dc-yellow shadow-[0_0_0_3px_rgba(249,225,94,0.12)]' : 'border-dc-yellow/10',
      ]"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click.stop="toggle"
    >
      <span class="min-w-0 truncate">{{ selectedOption?.label }}</span>
      <span class="motion-icon grid size-6 shrink-0 place-items-center rounded-full border border-dc-yellow/15 text-dc-yellow" :class="open ? 'rotate-180' : ''">
        <svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
          <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>

    <div
      v-if="open"
      class="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-lg border border-dc-yellow/20 bg-[#11110f] shadow-[0_22px_80px_rgba(0,0,0,0.48)]"
      :class="menuClass"
    >
      <div class="max-h-72 overflow-y-auto p-1.5" role="listbox">
        <button
          v-for="option in options"
          :key="`${option.value}`"
          type="button"
          class="motion-colors flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm"
          :class="modelValue === option.value ? 'bg-dc-yellow text-dc-dark' : 'text-dc-gray-light hover:bg-dc-yellow/[0.08] hover:text-white'"
          role="option"
          :aria-selected="modelValue === option.value"
          @click="choose(option.value)"
        >
          <span class="grid size-4 shrink-0 place-items-center">
            <svg v-if="modelValue === option.value" viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
              <path d="M4 10.5l4 4L16 5.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="truncate font-semibold">{{ option.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

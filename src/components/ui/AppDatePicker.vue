<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

let datePickerInstanceCount = 0;
let activeDatePickerId: string | null = null;

const props = withDefaults(defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}>(), {
  label: '',
  placeholder: 'dd / mm / yyyy',
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const placement = ref<'bottom' | 'top'>('bottom');
const datePickerId = `app-date-picker-${++datePickerInstanceCount}`;

function parseDate(value: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const selectedDate = computed(() => parseDate(props.modelValue));
const displayValue = computed(() => {
  if (!selectedDate.value) return props.placeholder;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(selectedDate.value);
});

const monthCursor = ref<Date>(selectedDate.value ?? new Date());

watch(selectedDate, (value) => {
  if (value) {
    monthCursor.value = new Date(value.getFullYear(), value.getMonth(), 1);
  }
}, { immediate: true });

const monthLabel = computed(() => new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
}).format(monthCursor.value));

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const calendarDays = computed(() => {
  const year = monthCursor.value.getFullYear();
  const month = monthCursor.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - startOffset + 1;

    if (dayNumber <= 0) {
      const date = new Date(year, month - 1, daysInPreviousMonth + dayNumber);
      return { date, currentMonth: false };
    }

    if (dayNumber > daysInMonth) {
      const date = new Date(year, month + 1, dayNumber - daysInMonth);
      return { date, currentMonth: false };
    }

    const date = new Date(year, month, dayNumber);
    return { date, currentMonth: true };
  });
});

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function chooseDate(date: Date) {
  emit('update:modelValue', toDateValue(date));
  monthCursor.value = new Date(date.getFullYear(), date.getMonth(), 1);
  closePicker();
}

function clearDate() {
  emit('update:modelValue', '');
  closePicker();
}

function previousMonth() {
  monthCursor.value = new Date(monthCursor.value.getFullYear(), monthCursor.value.getMonth() - 1, 1);
}

function nextMonth() {
  monthCursor.value = new Date(monthCursor.value.getFullYear(), monthCursor.value.getMonth() + 1, 1);
}

function closePicker() {
  open.value = false;
  if (activeDatePickerId === datePickerId) {
    activeDatePickerId = null;
  }
}

function togglePicker() {
  if (open.value) {
    closePicker();
  } else {
    document.dispatchEvent(new CustomEvent('app-date-picker:open', { detail: { id: datePickerId } }));
    activeDatePickerId = datePickerId;
    open.value = true;
  }
}

function updatePlacement() {
  if (!root.value || !open.value) return;
  const rect = root.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const menuHeight = 360;
  const spacing = 8;
  const spaceBelow = viewportHeight - rect.bottom - spacing;
  const spaceAbove = rect.top - spacing;
  placement.value = spaceBelow < menuHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
}

function handleDocumentClick(event: MouseEvent) {
  if (root.value?.contains(event.target as Node)) return;
  closePicker();
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (root.value?.contains(event.target as Node)) return;
  closePicker();
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') closePicker();
}

function handlePickerOpen(event: Event) {
  const detail = (event as CustomEvent<{ id?: string }>).detail;
  if (detail?.id !== datePickerId) {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown, true);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleEscape);
  document.addEventListener('app-date-picker:open', handlePickerOpen as EventListener);
  window.addEventListener('resize', updatePlacement);
  window.addEventListener('scroll', updatePlacement, true);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true);
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleEscape);
  document.removeEventListener('app-date-picker:open', handlePickerOpen as EventListener);
  window.removeEventListener('resize', updatePlacement);
  window.removeEventListener('scroll', updatePlacement, true);
  if (activeDatePickerId === datePickerId) {
    activeDatePickerId = null;
  }
});

watch(open, async (isOpen) => {
  if (isOpen) {
    if (selectedDate.value) {
      monthCursor.value = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1);
    }
    await nextTick();
    updatePlacement();
  } else {
    placement.value = 'bottom';
  }
});
</script>

<template>
  <div ref="root" class="relative block" :class="open ? 'z-[80]' : 'z-auto'">
    <label v-if="label" class="editorial-label">
      {{ label }}
      <span v-if="required" class="ml-1 text-red-600">*</span>
    </label>
    <button
      type="button"
      class="motion-press flex min-h-[52px] w-full items-center justify-between gap-3 rounded-md border-2 bg-dc-paper px-4 py-3 text-left outline-none"
      :class="open ? 'border-dc-pink shadow-[0_0_0_3px_rgba(232,17,127,0.14)]' : 'border-dc-ink hover:bg-dc-paper-warm'"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click.stop="togglePicker"
    >
      <span class="min-w-0 truncate" :class="selectedDate ? 'font-semibold text-dc-ink' : 'text-dc-gray-light'">
        {{ displayValue }}
      </span>
      <span class="grid size-8 shrink-0 place-items-center rounded-md border border-dc-ink text-dc-ink">
        <svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
          <path d="M5.5 3.5v2M14.5 3.5v2M4 7.5h12M6 2.75h8a1.75 1.75 0 0 1 1.75 1.75v10.5A1.75 1.75 0 0 1 14 16.75H6A1.75 1.75 0 0 1 4.25 15V4.5A1.75 1.75 0 0 1 6 2.75Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </button>

    <Transition name="dropdown-menu" :duration="{ enter: 180, leave: 0 }">
      <div
        v-if="open"
        class="absolute z-50 mt-2 w-[19rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border-2 border-dc-ink bg-dc-paper shadow-[3px_3px_0_#111111]"
        :class="placement === 'top' ? 'bottom-[calc(100%+0.5rem)] mt-0' : 'top-[calc(100%+0.5rem)]'"
        role="dialog"
        aria-label="Choose date"
      >
        <div class="border-b border-dc-border bg-dc-paper-warm px-3 py-3">
          <div class="flex items-center justify-between gap-2">
            <button type="button" class="motion-press grid size-8 place-items-center rounded-md border border-dc-ink bg-dc-paper text-dc-ink hover:bg-dc-yellow" aria-label="Previous month" @click="previousMonth">
              <svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
                <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <p class="font-mono text-xs font-bold uppercase tracking-[0.18em] text-dc-ink">{{ monthLabel }}</p>
            <button type="button" class="motion-press grid size-8 place-items-center rounded-md border border-dc-ink bg-dc-paper text-dc-ink hover:bg-dc-yellow" aria-label="Next month" @click="nextMonth">
              <svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
                <path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div class="p-3">
          <div class="mb-2 grid grid-cols-7 gap-1">
            <span v-for="weekday in weekdayLabels" :key="weekday" class="grid h-8 place-items-center font-mono text-[10px] font-bold uppercase tracking-wide text-dc-gray">
              {{ weekday }}
            </span>
          </div>

          <div class="grid grid-cols-7 gap-1">
            <button
              v-for="day in calendarDays"
              :key="toDateValue(day.date)"
              type="button"
              class="motion-press grid h-10 place-items-center rounded-md border text-sm font-semibold"
              :class="[
                isSameDay(day.date, selectedDate)
                  ? 'border-dc-ink bg-dc-yellow text-dc-ink shadow-[2px_2px_0_#111111]'
                  : day.currentMonth
                    ? 'border-transparent bg-transparent text-dc-ink hover:border-dc-ink hover:bg-dc-paper-warm'
                    : 'border-transparent bg-transparent text-dc-gray-light hover:border-dc-border hover:bg-dc-paper-warm',
                isSameDay(day.date, new Date()) && !isSameDay(day.date, selectedDate) ? 'border-dc-border' : '',
              ]"
              @click="chooseDate(day.date)"
            >
              {{ day.date.getDate() }}
            </button>
          </div>

          <div class="mt-3 flex items-center justify-between border-t border-dc-border pt-3">
            <button type="button" class="font-mono text-[11px] font-bold uppercase tracking-wide text-dc-gray hover:text-dc-ink" @click="clearDate">
              Clear
            </button>
            <button type="button" class="font-mono text-[11px] font-bold uppercase tracking-wide text-dc-pink hover:text-dc-ink" @click="chooseDate(new Date())">
              Today
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AppDropdown from '@/src/components/AppDropdown.vue';
import type { Event, Talk } from '@/types';

interface OverviewResponse {
  events: Event[];
  talks: Talk[];
}

const overview = ref<OverviewResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const selectedYear = ref<number | null>(null);
const query = ref('');
const selectedTopic = ref('');
const selectedSpeaker = ref('');

const completedEvents = computed(() => {
  return [...(overview.value?.events ?? [])]
    .filter((event) => event.status === 'completed')
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
});

const years = computed(() => {
  return [...new Set(completedEvents.value.map((event) => new Date(event.event_date).getFullYear()))].sort((a, b) => b - a);
});

const activeYear = computed(() => selectedYear.value ?? years.value[0] ?? new Date().getFullYear());
const publishedTalks = computed(() => (overview.value?.talks ?? []).filter((talk) => talk.status === 'published'));

const topics = computed(() => {
  return [...new Set(publishedTalks.value.map((talk) => talk.topic).filter(Boolean))].sort((a, b) => a.localeCompare(b));
});

const speakers = computed(() => {
  return [...new Set(publishedTalks.value.map((talk) => talk.speaker_name).filter(Boolean))].sort((a, b) => a.localeCompare(b));
});

const selectedYearEvents = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();

  return completedEvents.value
    .filter((event) => new Date(event.event_date).getFullYear() === activeYear.value)
    .filter((event) => {
      const talks = publishedTalksFor(event.id);
      const matchesTopic = !selectedTopic.value || talks.some((talk) => talk.topic === selectedTopic.value);
      const matchesSpeaker = !selectedSpeaker.value || talks.some((talk) => talk.speaker_name === selectedSpeaker.value);

      if (!matchesTopic || !matchesSpeaker) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        event.name,
        event.description,
        ...talks.flatMap((talk) => [talk.title, talk.abstract ?? '', talk.speaker_name, talk.topic ?? '']),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
});

const hasActiveFilters = computed(() => query.value.trim() !== '' || selectedTopic.value !== '' || selectedSpeaker.value !== '');
const selectedYearTalkCount = computed(() => {
  return selectedYearEvents.value.reduce((total, event) => total + publishedTalksFor(event.id).length, 0);
});
const topicOptions = computed(() => [
  { value: '', label: 'All topics' },
  ...topics.value.map((topic) => ({ value: topic, label: topic })),
]);
const speakerOptions = computed(() => [
  { value: '', label: 'All speakers' },
  ...speakers.value.map((speaker) => ({ value: speaker, label: speaker })),
]);

function publishedTalksFor(eventId: string): Talk[] {
  return publishedTalks.value.filter((talk) => talk.event_id === eventId);
}

function tagsFor(eventId: string): string[] {
  const counts = new Map<string, number>();
  for (const talk of publishedTalksFor(eventId)) {
    if (talk.topic) {
      counts.set(talk.topic, (counts.get(talk.topic) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([topic]) => topic)
    .slice(0, 4);
}

function yearEventCount(year: number) {
  return completedEvents.value.filter((event) => new Date(event.event_date).getFullYear() === year).length;
}

function talksPreviewFor(eventId: string): Talk[] {
  return publishedTalksFor(eventId).slice(0, 3);
}

function eventDateParts(value: string) {
  const date = new Date(value);
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.getDate(),
    year: date.getFullYear(),
  };
}

function clearFilters() {
  query.value = '';
  selectedTopic.value = '';
  selectedSpeaker.value = '';
}

onMounted(async () => {
  try {
    const response = await fetch('/api/overview');
    if (!response.ok) {
      throw new Error(`Archive request failed: ${response.status}`);
    }
    overview.value = await response.json();
    selectedYear.value = years.value[0] ?? null;
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to load archive';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="editorial-page">
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div class="mb-8 rounded-lg border border-dc-yellow/10 bg-[#11110f] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.24)] sm:p-7 lg:mb-10">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="editorial-eyebrow">community memory</p>
            <h1 class="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">Archive</h1>
            <p class="mt-3 max-w-3xl text-base leading-7 text-dc-gray-light">
              Find the talks, speakers, topics, and slide decks that keep the community useful after event night.
            </p>
          </div>
          <div v-if="completedEvents.length > 0" class="grid grid-cols-3 gap-3 sm:min-w-[360px]">
            <div class="rounded-md border border-dc-yellow/10 bg-dc-yellow/[0.04] p-3">
              <div class="font-mono text-xl font-bold text-white">{{ completedEvents.length }}</div>
              <div class="mt-1 font-mono text-[10px] uppercase tracking-wider text-dc-gray-light">events</div>
            </div>
            <div class="rounded-md border border-dc-yellow/10 bg-dc-yellow/[0.04] p-3">
              <div class="font-mono text-xl font-bold text-white">{{ publishedTalks.length }}</div>
              <div class="mt-1 font-mono text-[10px] uppercase tracking-wider text-dc-gray-light">talks</div>
            </div>
            <div class="rounded-md border border-dc-yellow/10 bg-dc-yellow/[0.04] p-3">
              <div class="font-mono text-xl font-bold text-white">{{ years.length }}</div>
              <div class="mt-1 font-mono text-[10px] uppercase tracking-wider text-dc-gray-light">years</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="editorial-panel p-12 text-center font-mono text-dc-gray">
        Loading archive...
      </div>
      <div v-else-if="error" class="border-2 border-red-500/60 bg-red-950/30 p-12 text-center font-mono text-red-100">
        {{ error }}
      </div>
      <div v-else-if="completedEvents.length === 0" class="editorial-panel p-12 text-center">
        <p class="font-mono text-dc-gray">No completed events yet. Check back soon.</p>
      </div>

      <div v-else class="flex flex-col gap-10 lg:flex-row lg:gap-14">
        <aside class="lg:sticky lg:top-24 lg:w-64 lg:self-start">
          <div class="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 lg:hidden">
            <button
              v-for="year in years"
              :key="year"
              class="motion-press shrink-0 rounded-md px-5 py-3 font-mono text-sm font-bold"
              :class="activeYear === year ? 'bg-dc-yellow text-dc-dark' : 'border border-dc-yellow/15 bg-[#151512] text-dc-gray-light hover:border-dc-yellow/35 hover:text-white'"
              @click="selectedYear = year"
            >
              {{ year }}
            </button>
          </div>

          <nav class="hidden rounded-lg border border-dc-yellow/10 bg-[#11110f] p-3 lg:block">
            <div class="mb-3 px-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-dc-yellow/60">
              Years
            </div>
            <ul class="space-y-1">
              <li v-for="year in years" :key="year">
                <button
                  class="motion-press group w-full rounded-md px-3 py-3 text-left"
                  :class="activeYear === year ? 'bg-dc-yellow text-dc-dark shadow-[0_10px_35px_rgba(249,225,94,0.14)]' : 'text-dc-gray-light hover:bg-dc-yellow/[0.05] hover:text-white'"
                  @click="selectedYear = year"
                >
                  <div class="flex items-baseline justify-between gap-3">
                    <span class="font-mono text-lg font-bold tracking-tight">{{ year }}</span>
                    <span class="font-mono text-[11px]" :class="activeYear === year ? 'text-dc-dark/70' : 'text-dc-gray'">
                      {{ yearEventCount(year) }}
                    </span>
                  </div>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <main class="min-w-0 flex-1">
          <header class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-dc-yellow/70">Selected year</p>
              <h2 class="mt-1 text-4xl font-black leading-none tracking-tight text-white sm:text-5xl">
                {{ activeYear }}
              </h2>
            </div>
            <div class="flex gap-2 font-mono text-xs uppercase tracking-wide text-dc-gray-light">
              <span class="rounded-md border border-dc-yellow/10 bg-[#151512] px-3 py-2">{{ selectedYearEvents.length }} events</span>
              <span class="rounded-md border border-dc-yellow/10 bg-[#151512] px-3 py-2">{{ selectedYearTalkCount }} talks</span>
            </div>
          </header>

          <section class="mb-6 grid gap-3 rounded-lg border border-dc-yellow/10 bg-[#11110f] p-3 md:grid-cols-[1fr_180px_220px_auto] md:items-end">
            <label class="block">
              <span class="editorial-label">Search</span>
              <input
                v-model="query"
                class="editorial-input mt-2"
                type="search"
                placeholder="Search event, talk, speaker, topic"
              >
            </label>

            <AppDropdown
              v-model="selectedTopic"
              label="Topic"
              :options="topicOptions"
              menu-class="md:min-w-72"
            />

            <AppDropdown
              v-model="selectedSpeaker"
              label="Speaker"
              :options="speakerOptions"
              menu-class="md:min-w-80"
            />

            <button
              class="editorial-secondary-action justify-center px-4 py-3 disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              :disabled="!hasActiveFilters"
              @click="clearFilters"
            >
              Clear
            </button>
          </section>

          <div v-if="selectedYearEvents.length === 0" class="editorial-panel p-8">
            <h3 class="text-2xl font-black tracking-tight text-white">No archive matches</h3>
            <p class="mt-2 text-dc-gray-light">Try a broader topic, speaker, or search term.</p>
          </div>

          <div class="grid gap-4">
            <RouterLink
              v-for="event in selectedYearEvents"
              :key="event.id"
              :to="`/archive/${event.id}`"
              class="motion-surface motion-lift group block rounded-lg border border-dc-yellow/10 bg-[#141412] p-4 hover:border-dc-yellow/30 hover:bg-[#191916] hover:shadow-[0_20px_70px_rgba(0,0,0,0.28)] sm:p-5"
            >
              <article class="grid gap-5 lg:grid-cols-[116px_1fr]">
                <div class="flex items-center gap-3 lg:block">
                  <time class="flex size-[76px] shrink-0 flex-col items-center justify-center rounded-md border border-dc-yellow/20 bg-dc-yellow/[0.06] text-center">
                    <span class="font-mono text-[11px] font-bold uppercase tracking-wider text-dc-yellow">{{ eventDateParts(event.event_date).month }}</span>
                    <span class="font-mono text-3xl font-bold leading-none text-white">{{ eventDateParts(event.event_date).day }}</span>
                  </time>
                  <div class="font-mono text-xs uppercase tracking-wide text-dc-gray-light lg:mt-3">
                    {{ publishedTalksFor(event.id).length }} talks
                  </div>
                </div>

                <div class="min-w-0">
                  <h3 class="motion-colors text-2xl font-black tracking-tight text-white group-hover:text-dc-yellow sm:text-3xl">
                    {{ event.name }}
                  </h3>
                  <p class="mt-2 max-w-3xl text-sm leading-6 text-dc-gray-light sm:text-base">
                    {{ event.description }}
                  </p>

                  <div class="mt-5 flex flex-wrap gap-2">
                    <span
                      v-for="tag in tagsFor(event.id)"
                      :key="tag"
                      class="rounded-full border border-dc-yellow/10 bg-dc-yellow/[0.05] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-dc-yellow/90"
                    >
                      {{ tag }}
                    </span>
                    <span v-if="publishedTalksFor(event.id).length === 0" class="font-mono text-xs uppercase tracking-wider text-dc-gray">
                      No published talks
                    </span>
                  </div>

                  <div v-if="talksPreviewFor(event.id).length > 0" class="mt-5 grid gap-2">
                    <div
                      v-for="talk in talksPreviewFor(event.id)"
                      :key="talk.id"
                      class="rounded-md border border-dc-yellow/[0.07] bg-[#0f0f0d] px-3 py-3 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
                    >
                      <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-white">{{ talk.title }}</p>
                        <p class="mt-1 truncate text-xs text-dc-gray-light">{{ talk.speaker_name }}</p>
                      </div>
                      <span class="mt-2 inline-block font-mono text-[10px] font-bold uppercase tracking-wider text-dc-yellow/80 sm:mt-0">
                        {{ talk.topic }}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </RouterLink>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

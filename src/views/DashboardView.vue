<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Event, LeaderboardEntry, Talk } from '@/types';

interface OverviewResponse {
  events: Event[];
  talks: Talk[];
  leaderboard: LeaderboardEntry[];
}

const overview = ref<OverviewResponse | null>(null);
const error = ref<string | null>(null);
const loading = ref(true);

const nextEvent = computed(() => {
  const events = overview.value?.events ?? [];
  return [...events]
    .filter((event) => new Date(event.event_date).getTime() >= Date.now())
    .sort((a, b) => a.event_date.localeCompare(b.event_date))[0] ?? events[0] ?? null;
});

const acceptedTalks = computed(() => {
  return (overview.value?.talks ?? []).filter((talk) => ['accepted', 'slides_received', 'published'].includes(talk.status));
});

onMounted(async () => {
  try {
    const response = await fetch('/api/overview');
    if (!response.ok) {
      throw new Error(`Overview request failed: ${response.status}`);
    }
    overview.value = await response.json();
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to load project overview';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1.2fr_0.8fr]">
    <div class="space-y-8">
      <div class="border-l-4 border-dc-yellow pl-5">
        <p class="font-mono text-sm uppercase tracking-[0.3em] text-dc-gray-light">Migration spine</p>
        <h1 class="mt-3 max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
          Vue, Vite, Bun and one same-origin app server.
        </h1>
        <p class="mt-5 max-w-2xl text-lg leading-8 text-dc-gray-light">
          The new shell is wired to the existing mock data so we can migrate page-by-page without losing the conference workflow.
        </p>
      </div>

      <div v-if="loading" class="border border-dc-dark-3 bg-dc-dark-1 p-6 font-mono text-dc-gray-light">
        Loading project data...
      </div>
      <div v-else-if="error" class="border border-red-500/60 bg-red-950/30 p-6 font-mono text-red-200">
        {{ error }}
      </div>
      <div v-else class="grid gap-4 sm:grid-cols-3">
        <article class="border border-dc-dark-3 bg-dc-dark-1 p-5">
          <p class="font-mono text-xs uppercase text-dc-gray-light">Events</p>
          <p class="mt-3 text-4xl font-black text-dc-yellow">{{ overview?.events.length ?? 0 }}</p>
        </article>
        <article class="border border-dc-dark-3 bg-dc-dark-1 p-5">
          <p class="font-mono text-xs uppercase text-dc-gray-light">Accepted Talks</p>
          <p class="mt-3 text-4xl font-black text-dc-yellow">{{ acceptedTalks.length }}</p>
        </article>
        <article class="border border-dc-dark-3 bg-dc-dark-1 p-5">
          <p class="font-mono text-xs uppercase text-dc-gray-light">Leaderboard</p>
          <p class="mt-3 text-4xl font-black text-dc-yellow">{{ overview?.leaderboard.length ?? 0 }}</p>
        </article>
      </div>

      <article v-if="nextEvent" class="border border-dc-yellow/50 bg-dc-dark-1 p-6 shadow-glow-sm">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-dc-yellow">Next event</p>
        <h2 class="mt-3 text-3xl font-black">{{ nextEvent.name }}</h2>
        <p class="mt-3 max-w-2xl text-dc-gray-light">{{ nextEvent.description }}</p>
        <div class="mt-5 flex flex-wrap gap-3 font-mono text-xs uppercase">
          <span class="border border-dc-dark-3 px-3 py-2 text-dc-gray-light">{{ nextEvent.event_date }}</span>
          <span class="border border-dc-yellow/50 px-3 py-2 text-dc-yellow">{{ nextEvent.status }}</span>
        </div>
      </article>
    </div>

    <aside class="space-y-4">
      <div class="border border-dc-dark-3 bg-dc-dark-1 p-5">
        <h2 class="font-mono text-sm uppercase tracking-[0.25em] text-dc-yellow">Migration map</h2>
        <ul class="mt-5 space-y-4 text-sm leading-6 text-dc-gray-light">
          <li><strong class="text-white">src/</strong> now owns the Vue app shell.</li>
          <li><strong class="text-white">server/</strong> owns Hono API routes and Bun production serving.</li>
          <li><strong class="text-white">lib/</strong> and <strong class="text-white">data/</strong> stay shared while pages move over.</li>
        </ul>
      </div>

      <div class="border border-dc-dark-3 bg-dc-dark-1 p-5">
        <h2 class="font-mono text-sm uppercase tracking-[0.25em] text-dc-yellow">Top players</h2>
        <ol class="mt-5 space-y-3">
          <li
            v-for="entry in overview?.leaderboard.slice(0, 5)"
            :key="entry.user_id"
            class="flex items-center justify-between border-b border-dc-dark-3 pb-3 text-sm"
          >
            <span class="text-white">{{ entry.rank }}. {{ entry.nickname }}</span>
            <span class="font-mono text-dc-yellow">{{ entry.total_score }}</span>
          </li>
        </ol>
      </div>
    </aside>
  </section>
</template>

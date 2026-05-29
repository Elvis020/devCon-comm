<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Event, EventStatus } from '@/types';

const route = useRoute();
const event = ref<Event | null>(null);
const loading = ref(true);
const statusFlow: EventStatus[] = ['draft', 'cfp_open', 'cfp_closed', 'upcoming', 'live', 'completed'];

async function fetchEvent() {
  const response = await fetch(`/api/events/${route.params.eventId}`);
  if (response.ok) event.value = await response.json();
  loading.value = false;
}

async function updateStatus(status: EventStatus) {
  const response = await fetch(`/api/events/${route.params.eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (response.ok) await fetchEvent();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

onMounted(fetchEvent);
</script>

<template>
  <div class="min-h-screen bg-dc-dark">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <RouterLink to="/admin/events" class="mb-6 inline-flex items-center gap-2 font-mono text-dc-yellow hover:text-dc-yellow-glow">
        <span>&larr;</span> BACK TO EVENTS
      </RouterLink>

      <div v-if="loading" class="py-12 text-center font-mono text-white">LOADING...</div>
      <div v-else-if="!event" class="py-12 text-center font-mono text-dc-gray">EVENT NOT FOUND</div>

      <template v-else>
        <h1 class="mb-2 font-mono text-3xl font-bold text-white">{{ event.name }}</h1>
        <p class="mb-6 font-mono text-dc-gray-light"><span class="text-dc-yellow">@</span> {{ formatDate(event.event_date) }}</p>
        <p v-if="event.description" class="mb-8 text-white/80">{{ event.description }}</p>

        <section class="relative mb-8 overflow-hidden border-2 border-dc-dark-3 bg-dc-dark-1 p-6">
          <div class="absolute right-0 top-0 size-16 border-b-2 border-l-2 border-dc-yellow/20" />
          <h2 class="mb-4 flex items-center gap-3 font-mono text-xl font-bold text-white"><span class="text-dc-yellow">$</span> EVENT_STATUS</h2>
          <div class="mb-4 flex flex-wrap gap-2">
            <button
              v-for="status in statusFlow"
              :key="status"
              class="px-4 py-2 font-mono text-sm font-bold uppercase transition-all"
              :class="event.status === status ? 'bg-dc-yellow text-dc-dark shadow-glow' : 'border-2 border-dc-dark-3 bg-dc-dark-2 text-white hover:border-dc-yellow/50'"
              @click="updateStatus(status)"
            >
              {{ status.replace('_', ' ') }}
            </button>
          </div>
          <p class="font-mono text-sm text-dc-gray">CURRENT: <span class="font-bold uppercase text-dc-yellow">{{ event.status.replace('_', ' ') }}</span></p>
        </section>

        <h2 class="mb-4 flex items-center gap-3 font-mono text-xl font-bold text-white"><span class="text-dc-yellow">&gt;</span> QUICK_ACTIONS</h2>
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RouterLink :to="`/admin/events/${event.id}/talks`" class="group relative block overflow-hidden border-2 border-dc-dark-3 bg-dc-dark-1 p-6 transition-all hover:border-dc-yellow/50">
            <div class="absolute right-0 top-0 size-12 border-b-2 border-l-2 border-dc-yellow/10 transition-colors group-hover:border-dc-yellow/30" />
            <h3 class="mb-2 font-mono text-lg font-bold text-white transition-colors group-hover:text-dc-yellow">MANAGE TALKS</h3>
            <p class="text-sm text-dc-gray-light">Review CFP submissions and manage talks</p>
          </RouterLink>
          <RouterLink :to="`/admin/events/${event.id}/speakers`" class="group relative block overflow-hidden border-2 border-dc-dark-3 bg-dc-dark-1 p-6 transition-all hover:border-dc-yellow/50">
            <div class="absolute right-0 top-0 size-12 border-b-2 border-l-2 border-dc-yellow/10 transition-colors group-hover:border-dc-yellow/30" />
            <h3 class="mb-2 font-mono text-lg font-bold text-white transition-colors group-hover:text-dc-yellow">MANAGE SPEAKERS</h3>
            <p class="text-sm text-dc-gray-light">Manage approved speaker list for CFP</p>
          </RouterLink>
          <RouterLink :to="`/admin/events/${event.id}/quiz`" class="group relative block overflow-hidden border-2 border-dc-dark-3 bg-dc-dark-1 p-6 transition-all hover:border-dc-yellow/50">
            <div class="absolute right-0 top-0 size-12 border-b-2 border-l-2 border-dc-yellow/10 transition-colors group-hover:border-dc-yellow/30" />
            <h3 class="mb-2 font-mono text-lg font-bold text-white transition-colors group-hover:text-dc-yellow">MANAGE QUIZ</h3>
            <p class="text-sm text-dc-gray-light">Create and run the live quiz for this event</p>
          </RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>

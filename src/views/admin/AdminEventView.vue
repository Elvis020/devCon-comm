<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Event, EventStatus } from '@/types';
import AdminEventTabs from '@/src/components/AdminEventTabs.vue';

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
  <div class="editorial-page">
    <div class="editorial-wrap">
      <RouterLink to="/admin/events" class="mb-6 inline-flex items-center gap-2 font-mono text-dc-yellow hover:text-dc-yellow-glow">
        <span>&larr;</span> BACK TO EVENTS
      </RouterLink>

      <div v-if="loading" class="py-12 text-center font-mono text-white">LOADING...</div>
      <div v-else-if="!event" class="py-12 text-center font-mono text-dc-gray">EVENT NOT FOUND</div>

      <template v-else>
        <div class="editorial-header">
          <p class="editorial-eyebrow">event control</p>
          <h1 class="editorial-title">{{ event.name }}</h1>
          <p class="editorial-subtitle">{{ formatDate(event.event_date) }}</p>
        </div>
        <AdminEventTabs :event-id="event.id" />
        <p v-if="event.description" class="mb-8 text-white/80">{{ event.description }}</p>

        <section class="editorial-panel mb-10 p-6 sm:p-7">
          <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="editorial-eyebrow mb-2">status</p>
              <h2 class="text-2xl font-black tracking-tight text-white">Event Status</h2>
            </div>
            <p class="font-mono text-xs uppercase tracking-wide text-dc-gray">
              Current: <span class="font-bold text-dc-yellow">{{ event.status.replace('_', ' ') }}</span>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="status in statusFlow"
              :key="status"
              class="rounded-md px-4 py-2 font-mono text-sm font-bold uppercase transition-all"
              :class="event.status === status ? 'bg-dc-yellow text-dc-dark shadow-[0_12px_30px_rgba(249,225,94,0.18)]' : 'border border-dc-yellow/10 bg-dc-yellow/[0.03] text-dc-gray-light hover:border-dc-yellow/35 hover:bg-dc-yellow/[0.06] hover:text-white'"
              @click="updateStatus(status)"
            >
              {{ status.replace('_', ' ') }}
            </button>
          </div>
        </section>

        <h2 class="mb-4 text-2xl font-black tracking-tight text-white">Quick Actions</h2>
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RouterLink :to="`/admin/events/${event.id}/talks`" class="editorial-panel group block p-6 transition-all hover:-translate-y-0.5 hover:border-dc-yellow/30 hover:bg-[#191917]">
            <h3 class="mb-2 text-lg font-black tracking-tight text-white transition-colors group-hover:text-dc-yellow">Manage Talks</h3>
            <p class="text-sm text-dc-gray-light">Review CFP submissions and manage talks</p>
          </RouterLink>
          <RouterLink :to="`/admin/events/${event.id}/speakers`" class="editorial-panel group block p-6 transition-all hover:-translate-y-0.5 hover:border-dc-yellow/30 hover:bg-[#191917]">
            <h3 class="mb-2 text-lg font-black tracking-tight text-white transition-colors group-hover:text-dc-yellow">Manage Speakers</h3>
            <p class="text-sm text-dc-gray-light">Manage approved speaker list for CFP</p>
          </RouterLink>
          <RouterLink :to="`/admin/events/${event.id}/quiz`" class="editorial-panel group block p-6 transition-all hover:-translate-y-0.5 hover:border-dc-yellow/30 hover:bg-[#191917]">
            <h3 class="mb-2 text-lg font-black tracking-tight text-white transition-colors group-hover:text-dc-yellow">Manage Quiz</h3>
            <p class="text-sm text-dc-gray-light">Create and run the live quiz for this event</p>
          </RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>

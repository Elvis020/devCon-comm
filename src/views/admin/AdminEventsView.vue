<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Event } from '@/types';

const route = useRoute();
const router = useRouter();
const events = ref<Event[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const form = reactive({ name: '', description: '', event_date: '' });

const creating = computed(() => route.path.endsWith('/new'));

async function fetchEvents() {
  const response = await fetch('/api/events');
  if (response.ok) {
    events.value = (await response.json()).sort((a: Event, b: Event) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  }
  loading.value = false;
}

async function createNewEvent() {
  saving.value = true;
  error.value = null;
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });

  if (response.ok) {
    const event = await response.json();
    await router.push(`/admin/events/${event.id}`);
  } else {
    const data = await response.json();
    error.value = data.error || 'Failed to create event';
  }
  saving.value = false;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function statusClass(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-dc-dark-2 text-dc-gray border-dc-dark-3',
    cfp_open: 'bg-blue-900/30 text-blue-400 border-blue-400/30',
    cfp_closed: 'bg-yellow-900/30 text-dc-yellow border-dc-yellow/30',
    upcoming: 'bg-green-900/30 text-green-400 border-green-400/30',
    live: 'bg-purple-900/30 text-purple-400 border-purple-400/30',
    completed: 'bg-dc-dark-2 text-white border-dc-dark-3',
  };
  return colors[status] ?? colors.draft;
}

onMounted(fetchEvents);
</script>

<template>
  <div class="min-h-screen bg-dc-dark">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <template v-if="creating">
        <h1 class="mb-6 flex items-center gap-3 font-mono text-3xl font-bold text-white">
          <span class="text-dc-yellow">$</span> CREATE_NEW_EVENT
        </h1>
        <form class="relative space-y-5 overflow-hidden border-2 border-dc-dark-3 bg-dc-dark-1 p-6" @submit.prevent="createNewEvent">
          <div class="absolute right-0 top-0 size-16 border-b-2 border-l-2 border-dc-yellow/20" />
          <div v-if="error" class="border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-200">{{ error }}</div>
          <div>
            <label class="mb-2 block font-mono text-xs font-bold uppercase text-dc-yellow">Name</label>
            <input v-model="form.name" required class="w-full border-2 border-dc-dark-3 bg-dc-dark-2 px-4 py-3 font-mono text-white outline-none focus:border-dc-yellow" />
          </div>
          <div>
            <label class="mb-2 block font-mono text-xs font-bold uppercase text-dc-yellow">Date</label>
            <input v-model="form.event_date" required type="date" class="w-full border-2 border-dc-dark-3 bg-dc-dark-2 px-4 py-3 font-mono text-white outline-none focus:border-dc-yellow" />
          </div>
          <div>
            <label class="mb-2 block font-mono text-xs font-bold uppercase text-dc-yellow">Description</label>
            <textarea v-model="form.description" rows="4" class="w-full border-2 border-dc-dark-3 bg-dc-dark-2 px-4 py-3 font-mono text-white outline-none focus:border-dc-yellow" />
          </div>
          <div class="flex gap-3">
            <button type="submit" :disabled="saving" class="bg-dc-yellow px-6 py-3 font-mono font-bold uppercase tracking-wide text-dc-dark hover:shadow-glow disabled:opacity-60">{{ saving ? 'CREATING...' : 'CREATE EVENT' }}</button>
            <RouterLink to="/admin/events" class="border-2 border-dc-dark-3 px-6 py-3 font-mono font-bold uppercase tracking-wide text-white">CANCEL</RouterLink>
          </div>
        </form>
      </template>

      <template v-else>
        <div class="mb-6 flex items-center justify-between">
          <h1 class="flex items-center gap-3 font-mono text-3xl font-bold text-white">
            <span class="text-dc-yellow">$</span> EVENT_MANAGEMENT
          </h1>
          <RouterLink to="/admin/events/new" class="bg-dc-yellow px-6 py-3 font-mono font-bold uppercase tracking-wide text-dc-dark transition-shadow hover:shadow-glow">CREATE EVENT</RouterLink>
        </div>

        <div v-if="loading" class="py-12 text-center font-mono text-white">LOADING...</div>
        <div v-else class="border-2 border-dc-dark-3 bg-dc-dark-1">
          <div class="grid grid-cols-12 gap-4 border-b-2 border-dc-dark-3 bg-dc-dark-2 px-6 py-4">
            <div class="col-span-4 font-mono text-xs font-bold uppercase text-dc-yellow">Event</div>
            <div class="col-span-3 font-mono text-xs font-bold uppercase text-dc-yellow">Date</div>
            <div class="col-span-3 font-mono text-xs font-bold uppercase text-dc-yellow">Status</div>
            <div class="col-span-2 text-right font-mono text-xs font-bold uppercase text-dc-yellow">Actions</div>
          </div>
          <div class="divide-y-2 divide-dc-dark-3">
            <div v-for="event in events" :key="event.id" class="grid grid-cols-12 gap-4 px-6 py-4 transition-colors hover:bg-dc-dark-2">
              <div class="col-span-4">
                <div class="font-mono font-medium text-white">{{ event.name }}</div>
                <div v-if="event.description" class="mt-1 line-clamp-1 text-sm text-dc-gray-light">{{ event.description }}</div>
              </div>
              <div class="col-span-3 flex items-center font-mono text-sm text-white"><span class="text-dc-yellow">@</span>&nbsp;{{ formatDate(event.event_date) }}</div>
              <div class="col-span-3 flex items-center">
                <span class="border px-2 py-1 font-mono text-xs font-bold uppercase" :class="statusClass(event.status)">{{ event.status.replace('_', ' ') }}</span>
              </div>
              <div class="col-span-2 flex items-center justify-end">
                <RouterLink :to="`/admin/events/${event.id}`" class="font-mono text-sm font-bold uppercase text-dc-yellow hover:text-dc-yellow-glow">MANAGE &rarr;</RouterLink>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Event, EventSpeaker } from '@/types';

const route = useRoute();
const event = ref<Event | null>(null);
const speakers = ref<EventSpeaker[]>([]);
const loading = ref(true);
const adding = ref(false);
const error = ref<string | null>(null);
const form = reactive({ email: '', name: '' });

async function fetchAll() {
  const [eventResponse, speakersResponse] = await Promise.all([
    fetch(`/api/events/${route.params.eventId}`),
    fetch(`/api/events/${route.params.eventId}/speakers`),
  ]);
  if (eventResponse.ok) event.value = await eventResponse.json();
  if (speakersResponse.ok) speakers.value = await speakersResponse.json();
  loading.value = false;
}

async function addNewSpeaker() {
  adding.value = true;
  error.value = null;
  const response = await fetch(`/api/events/${route.params.eventId}/speakers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  if (response.ok) {
    form.email = '';
    form.name = '';
    await fetchAll();
  } else {
    const data = await response.json();
    error.value = data.error || 'Failed to add speaker';
  }
  adding.value = false;
}

async function removeExistingSpeaker(speakerId: string) {
  const response = await fetch(`/api/events/${route.params.eventId}/speakers/${speakerId}`, { method: 'DELETE' });
  if (response.ok) await fetchAll();
}

onMounted(fetchAll);
</script>

<template>
  <div class="min-h-screen bg-dc-dark">
    <div class="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <RouterLink :to="`/admin/events/${route.params.eventId}`" class="mb-6 inline-flex items-center gap-2 font-mono text-dc-yellow hover:text-dc-yellow-glow">
        <span>&larr;</span> BACK TO EVENT
      </RouterLink>

      <div v-if="loading" class="py-12 text-center font-mono text-white">LOADING...</div>
      <template v-else>
        <h1 class="mb-2 font-mono text-3xl font-bold text-white">MANAGE SPEAKERS</h1>
        <p class="mb-8 font-mono text-dc-gray-light">{{ event?.name }}</p>

        <section class="relative mb-8 overflow-hidden border-2 border-dc-dark-3 bg-dc-dark-1 p-6">
          <div class="absolute right-0 top-0 size-16 border-b-2 border-l-2 border-dc-yellow/20" />
          <h2 class="mb-4 flex items-center gap-3 font-mono text-xl font-bold text-white"><span class="text-dc-yellow">+</span> ADD_SPEAKER</h2>
          <div v-if="error" class="mb-4 border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-200">{{ error }}</div>
          <form class="space-y-4" @submit.prevent="addNewSpeaker">
            <input v-model="form.email" required type="email" placeholder="speaker@example.com" class="w-full border-2 border-dc-dark-3 bg-dc-dark-2 px-4 py-2 font-mono text-white outline-none focus:border-dc-yellow" />
            <input v-model="form.name" required placeholder="Speaker Name" class="w-full border-2 border-dc-dark-3 bg-dc-dark-2 px-4 py-2 font-mono text-white outline-none focus:border-dc-yellow" />
            <button type="submit" :disabled="adding" class="bg-dc-yellow px-6 py-2 font-mono font-bold uppercase text-dc-dark transition-all hover:shadow-glow disabled:opacity-50">{{ adding ? 'ADDING...' : 'ADD SPEAKER' }}</button>
          </form>
        </section>

        <section class="relative overflow-hidden border-2 border-dc-dark-3 bg-dc-dark-1 p-6">
          <div class="absolute right-0 top-0 size-16 border-b-2 border-l-2 border-dc-yellow/20" />
          <h2 class="mb-4 flex items-center gap-3 font-mono text-xl font-bold text-white"><span class="text-dc-yellow">#</span> APPROVED_SPEAKERS <span class="text-sm text-dc-gray">({{ speakers.length }})</span></h2>
          <p v-if="speakers.length === 0" class="py-8 text-center font-mono text-dc-gray-light">NO SPEAKERS ADDED YET</p>
          <div v-else class="space-y-3">
            <div v-for="speaker in speakers" :key="speaker.id" class="group flex items-center justify-between border-2 border-dc-dark-3 bg-dc-dark-2 p-4 transition-colors hover:border-dc-yellow/30">
              <div>
                <p class="font-mono font-bold text-white">{{ speaker.name }}</p>
                <p class="font-mono text-sm text-dc-gray-light">{{ speaker.email }}</p>
              </div>
              <button class="border-2 border-red-700 bg-red-900/50 px-4 py-2 font-mono text-sm uppercase text-red-200 transition-all hover:border-red-500 hover:bg-red-900" @click="removeExistingSpeaker(speaker.id)">REMOVE</button>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

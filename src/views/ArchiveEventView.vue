<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Event, Talk } from '@/types';

const route = useRoute();
const event = ref<Event | null>(null);
const talks = ref<Talk[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const publishedTalks = computed(() => talks.value.filter((talk) => talk.status === 'published'));

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function slidesUrl(talk: Talk): string | null {
  if (talk.slides_type === 'file' && talk.storage_path) {
    return talk.storage_path;
  }
  if (talk.slides_type === 'url' && talk.slides_url) {
    return talk.slides_url;
  }
  return null;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

onMounted(async () => {
  try {
    const eventId = String(route.params.eventId);
    const [eventResponse, talksResponse] = await Promise.all([
      fetch(`/api/events/${eventId}`),
      fetch(`/api/events/${eventId}/talks`),
    ]);

    if (!eventResponse.ok) {
      throw new Error('Event not found');
    }
    if (!talksResponse.ok) {
      throw new Error('Unable to load event talks');
    }

    event.value = await eventResponse.json();
    talks.value = await talksResponse.json();
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to load event';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-dc-dark">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <RouterLink to="/archive" class="mb-8 inline-flex items-center gap-2 font-mono text-dc-yellow transition-colors hover:text-dc-yellow-glow">
        <span>&larr;</span> BACK TO ARCHIVE
      </RouterLink>

      <div v-if="loading" class="border-2 border-dc-dark-3 bg-dc-dark-1 p-12 text-center font-mono text-dc-gray">
        Loading event...
      </div>
      <div v-else-if="error || !event" class="flex min-h-[50vh] items-center justify-center p-4">
        <div class="text-center">
          <p class="font-mono text-white">EVENT NOT FOUND</p>
          <RouterLink to="/archive" class="mt-6 inline-block font-mono text-dc-yellow hover:text-dc-yellow-glow">
            BACK TO ARCHIVE
          </RouterLink>
        </div>
      </div>

      <template v-else>
        <div class="mb-12">
          <h1 class="mb-2 font-mono text-4xl font-bold text-white sm:text-5xl">
            {{ event.name }}
          </h1>
          <p class="mb-4 font-mono text-dc-gray-light">
            <span class="text-dc-yellow">@</span> {{ formatDate(event.event_date) }}
          </p>
          <p v-if="event.description" class="max-w-3xl text-lg text-white/80">
            {{ event.description }}
          </p>
        </div>

        <div class="mb-6">
          <h2 class="flex items-center gap-3 font-mono text-2xl font-bold text-white">
            <span class="text-dc-yellow">$</span> PRESENTATIONS
            <span class="text-lg text-dc-gray">({{ publishedTalks.length }})</span>
          </h2>
        </div>

        <div v-if="publishedTalks.length === 0" class="border-2 border-dc-dark-3 bg-dc-dark-1 p-12 text-center">
          <p class="font-mono text-dc-gray">No presentations published yet</p>
        </div>

        <div v-else class="space-y-6">
          <article
            v-for="talk in publishedTalks"
            :key="talk.id"
            class="group overflow-hidden border-2 border-dc-dark-3 bg-dc-dark-1 transition-colors hover:border-dc-yellow/30"
          >
            <div class="border-b-2 border-dc-dark-3 p-6 pb-5">
              <h3 class="mb-4 text-balance font-mono text-xl font-bold leading-tight text-white">
                {{ talk.title }}
              </h3>

              <div class="flex items-center gap-4">
                <div class="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-dc-yellow/40 bg-dc-dark-2 font-mono font-bold text-dc-yellow">
                  {{ initials(talk.speaker_name) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-mono text-sm font-bold text-dc-yellow">
                    {{ talk.speaker_name }}
                  </p>
                  <p v-if="talk.bio" class="mt-1 truncate font-mono text-xs text-white/50">
                    {{ talk.bio }}
                  </p>
                </div>
              </div>
            </div>

            <div v-if="talk.abstract" class="border-b-2 border-dc-dark-3 p-6">
              <p class="text-pretty text-sm leading-relaxed text-white/80">
                {{ talk.abstract }}
              </p>
            </div>

            <div v-if="slidesUrl(talk)" class="bg-dc-dark-2/30 p-6">
              <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <a
                  :href="slidesUrl(talk) ?? undefined"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex flex-1 items-center justify-center gap-2 bg-dc-yellow px-6 py-3 font-mono font-bold uppercase tracking-wide text-dc-dark transition-shadow hover:shadow-glow"
                >
                  <span>View Slides</span>
                  <span>&rarr;</span>
                </a>
                <div class="flex items-center justify-center gap-2 border-2 border-green-400/20 bg-green-900/10 px-4 py-2">
                  <span class="font-mono text-sm text-green-400">OK</span>
                  <span class="font-mono text-xs uppercase tracking-wide text-green-400">Available</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>

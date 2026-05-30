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
  <div class="editorial-page">
    <div class="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <RouterLink to="/archive" class="motion-colors mb-10 inline-flex items-center gap-2 font-mono text-sm text-dc-yellow hover:text-dc-yellow-glow">
        <span>&larr;</span> BACK TO ARCHIVE
      </RouterLink>

      <div v-if="loading" class="editorial-panel p-12 text-center font-mono text-dc-gray">
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
        <header class="mb-14 border-b border-dc-yellow/10 pb-10">
          <p class="editorial-eyebrow">archive issue</p>
          <h1 class="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            {{ event.name }}
          </h1>
          <p class="mt-4 font-mono text-sm uppercase tracking-wide text-dc-gray-light">
            {{ formatDate(event.event_date) }}
          </p>
          <p v-if="event.description" class="mt-6 max-w-3xl text-lg leading-8 text-dc-gray-light">
            {{ event.description }}
          </p>
        </header>

        <div class="mb-5 flex items-end justify-between gap-4">
          <div>
            <p class="editorial-eyebrow mb-2">presentations</p>
            <h2 class="text-2xl font-black tracking-tight text-white">
              Published Talks
            </h2>
          </div>
          <span class="font-mono text-sm text-dc-gray-light">{{ publishedTalks.length }} total</span>
        </div>

        <div v-if="publishedTalks.length === 0" class="editorial-panel p-12 text-center">
          <p class="font-mono text-dc-gray">No presentations published yet</p>
        </div>

        <div v-else class="divide-y divide-dc-yellow/10 border-y border-dc-yellow/10">
          <article
            v-for="talk in publishedTalks"
            :key="talk.id"
            class="py-7"
          >
            <div class="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p class="mb-2 font-mono text-xs uppercase tracking-wide text-dc-gray">
                  {{ talk.topic || 'General' }}
                </p>
                <h3 class="text-2xl font-black tracking-tight text-white">
                  {{ talk.title }}
                </h3>
                <p class="mt-2 text-sm text-dc-gray-light">
                  {{ talk.speaker_name }}<span v-if="talk.bio">, {{ talk.bio }}</span>
                </p>
                <p v-if="talk.abstract" class="mt-5 max-w-3xl text-base leading-7 text-dc-gray-light">
                  {{ talk.abstract }}
                </p>
              </div>

              <a
                v-if="slidesUrl(talk)"
                :href="slidesUrl(talk) ?? undefined"
                target="_blank"
                rel="noopener noreferrer"
                class="motion-press inline-flex rounded-md border border-dc-yellow/20 bg-dc-yellow/[0.03] px-4 py-2 font-mono text-sm font-bold uppercase tracking-wide text-dc-yellow hover:border-dc-yellow/50 hover:bg-dc-yellow/10"
              >
                Slides &rarr;
              </a>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>

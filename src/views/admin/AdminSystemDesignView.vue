<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { adminPath } from '@/src/admin-routes';
import type { Event as CommunityEvent, PublicMeetupScheduleItem } from '@/types';

const route = useRoute();
const event = ref<CommunityEvent | null>(null);
const loading = ref(true);
const error = ref('');

const systemDesignSessions = computed(() => (event.value?.schedule ?? [])
  .filter((item): item is PublicMeetupScheduleItem => item.type === 'system_design'));

const overviewPath = computed(() => adminPath(`events/${route.params.eventId}`));

async function fetchEvent() {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`/api/events/${route.params.eventId}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error ?? 'Unable to load event');
    }

    event.value = payload;
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to load event';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchEvent);
</script>

<template>
  <div class="editorial-page">
    <div class="editorial-wrap">
      <section class="editorial-header">
        <p class="editorial-eyebrow">monthly session</p>
        <h1 class="editorial-title">System Design</h1>
        <p class="editorial-subtitle max-w-3xl">
          Track the monthly architecture scenario, facilitator, and discussion slot alongside quiz, feedback, attendance, and talks.
        </p>
      </section>

      <p v-if="error" class="mb-5 rounded-md border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {{ error }}
      </p>

      <section v-if="loading" class="skeleton-panel p-6">
        <div class="skeleton-line skeleton-line--title" />
        <div class="skeleton-line mt-4 w-2/3" />
        <div class="skeleton-line mt-3 w-1/2" />
      </section>

      <section v-else-if="systemDesignSessions.length === 0" class="editorial-panel p-6 sm:p-8">
        <p class="editorial-eyebrow">no scenario yet</p>
        <h2 class="mt-2 text-3xl font-black tracking-tight text-dc-ink">Add it to the program outline.</h2>
        <p class="mt-3 max-w-2xl text-base leading-7 text-dc-gray">
          Create a program row with type <strong class="text-dc-ink">System design</strong>. Use the title for the scenario and the lead field for the expert or facilitator.
        </p>
        <RouterLink :to="overviewPath" class="editorial-action mt-6">
          Edit Program Outline
        </RouterLink>
      </section>

      <section v-else class="grid gap-5">
        <article
          v-for="session in systemDesignSessions"
          :key="`${session.time}-${session.title}`"
          class="editorial-panel p-6 sm:p-8"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="editorial-eyebrow">scenario</p>
              <h2 class="mt-2 text-3xl font-black tracking-tight text-dc-ink">{{ session.title }}</h2>
              <p v-if="session.lead" class="mt-3 text-base font-semibold leading-7 text-dc-gray">
                Led by <span class="text-dc-ink">{{ session.lead }}</span>
              </p>
            </div>
            <span class="inline-flex w-fit rounded-md border-2 border-dc-border bg-dc-yellow px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-dc-ink">
              {{ session.time }}
            </span>
          </div>

          <div v-if="session.resources.length > 0" class="mt-6 flex flex-wrap gap-3">
            <a
              v-for="resource in session.resources"
              :key="resource.url"
              :href="resource.url"
              target="_blank"
              rel="noreferrer"
              class="editorial-secondary-action"
            >
              {{ resource.title }}
            </a>
          </div>
        </article>

        <RouterLink :to="overviewPath" class="editorial-secondary-action w-fit">
          Edit Program Outline
        </RouterLink>
      </section>
    </div>
  </div>
</template>

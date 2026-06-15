<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { adminPath, isAdminPath } from '@/src/admin-routes';

const route = useRoute();

const missingPath = computed(() => route.fullPath);
const isOrganizerPath = computed(() => isAdminPath(route.path));

const primaryLink = computed(() => (isOrganizerPath.value ? adminPath('events') : '/'));
const primaryLabel = computed(() => (isOrganizerPath.value ? 'Organizer Console' : 'Back Home'));
const eyebrow = computed(() => (isOrganizerPath.value ? 'organizer route' : 'community route'));
const title = computed(() => (isOrganizerPath.value ? 'This organizer page is not available.' : 'We could not find that page.'));
const description = computed(() => (isOrganizerPath.value
  ? 'The address does not match an event, attendance, feedback, quiz, speaker, or talk management screen.'
  : 'The address does not match a community page, talk archive, speaker link, feedback form, or quiz room.'));
const secondaryLinks = computed(() => {
  if (isOrganizerPath.value) {
    return [
      { href: adminPath('attendance'), label: 'Attendance Hub', detail: 'Check Luma imports and post-event readouts.' },
      { href: adminPath('feedback'), label: 'Feedback Hub', detail: 'Review event feedback windows and responses.' },
      { href: adminPath('events/new'), label: 'Create Event', detail: 'Start a new monthly event record.' },
    ];
  }

  return [
    { href: '/archive', label: 'Archive', detail: 'Published talks and slide decks.' },
    { href: '/events', label: 'Events', detail: 'Upcoming community sessions.' },
    { href: '/play', label: 'Live Quiz', detail: 'Join a quiz when a host opens one.' },
  ];
});
</script>

<template>
  <div class="editorial-page">
    <section class="editorial-wrap flex min-h-[calc(100vh-6rem)] items-center py-10 lg:py-14">
      <div class="w-full">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div class="min-w-0">
            <p class="editorial-eyebrow">{{ eyebrow }}</p>
            <div class="mt-4 flex flex-col gap-5 border-b-2 border-dc-ink pb-7 sm:flex-row sm:items-end sm:justify-between">
              <h1 class="max-w-4xl text-5xl font-black leading-none tracking-tight text-dc-ink sm:text-6xl lg:text-7xl">
                {{ title }}
              </h1>
              <span class="shrink-0 font-mono text-6xl font-black leading-none text-dc-pink sm:text-7xl">404</span>
            </div>
            <p class="mt-6 max-w-2xl text-lg leading-8 text-dc-gray">
              {{ description }}
            </p>

            <div class="mt-6 max-w-3xl rounded-md border-2 border-dc-ink bg-dc-paper px-4 py-3 font-mono text-xs font-bold uppercase tracking-wide text-dc-gray shadow-[2px_2px_0_#111111]">
              <span class="text-dc-pink">Requested</span>
              <span class="mx-2 text-dc-border">/</span>
              <span class="break-all text-dc-ink">{{ missingPath }}</span>
            </div>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <RouterLink :to="primaryLink" class="editorial-action">
                {{ primaryLabel }}
              </RouterLink>
              <RouterLink v-if="!isOrganizerPath" to="/archive" class="editorial-secondary-action">
                Browse Archive
              </RouterLink>
              <RouterLink v-if="isOrganizerPath" :to="adminPath('events')" class="editorial-secondary-action">
                View Events
              </RouterLink>
            </div>
          </div>

          <aside class="overflow-hidden rounded-lg border-2 border-dc-ink bg-dc-paper shadow-[3px_3px_0_#111111]">
            <div class="border-b-2 border-dc-ink bg-dc-yellow px-5 py-4">
              <p class="font-mono text-xs font-black uppercase tracking-[0.22em] text-dc-ink">Try instead</p>
            </div>
            <div class="divide-y divide-dc-border">
              <RouterLink
                v-for="link in secondaryLinks"
                :key="link.href"
                :to="link.href"
                class="group grid grid-cols-[minmax(0,1fr)_1rem] gap-4 px-5 py-5 hover:bg-dc-paper-warm"
              >
                <span class="min-w-0">
                  <span class="block font-mono text-sm font-black uppercase tracking-wide text-dc-ink group-hover:text-dc-pink">{{ link.label }}</span>
                  <span class="mt-2 block text-sm leading-6 text-dc-gray">{{ link.detail }}</span>
                </span>
                <span class="font-mono text-sm font-black text-dc-yellow transition-transform duration-150 ease-[var(--motion-fast)] group-hover:translate-x-0.5">→</span>
              </RouterLink>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>

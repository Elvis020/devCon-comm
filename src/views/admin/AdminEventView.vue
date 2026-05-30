<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppDropdown from '@/src/components/AppDropdown.vue';
import type { Event as CommunityEvent, EventSpeaker, EventStatus, QuizSession, Talk } from '@/types';
import { adminPath } from '@/src/admin-routes';

const route = useRoute();
const event = ref<CommunityEvent | null>(null);
const talks = ref<Talk[]>([]);
const speakers = ref<EventSpeaker[]>([]);
const quizSessions = ref<QuizSession[]>([]);
const loading = ref(true);
const statusFlow: EventStatus[] = ['draft', 'cfp_open', 'cfp_closed', 'upcoming', 'live', 'completed'];

const pendingTalks = computed(() => talks.value.filter((talk) => talk.status === 'submitted').length);
const acceptedTalks = computed(() => talks.value.filter((talk) => talk.status === 'accepted' || talk.status === 'slides_received').length);
const publishedTalks = computed(() => talks.value.filter((talk) => talk.status === 'published').length);
const activeQuiz = computed(() => quizSessions.value.find((session) => session.status === 'waiting' || session.status === 'active') ?? null);
const currentQuiz = computed(() => activeQuiz.value ?? quizSessions.value[0] ?? null);
const statusOptions = computed(() => statusFlow.map((status) => ({ value: status, label: formatStatus(status).toUpperCase() })));
const programRows = computed(() => {
  if (!event.value) return [];

  return [
    {
      href: adminPath(`events/${event.value.id}/talks`),
      label: 'Talk pipeline',
      value: talks.value.length,
      detail: `${pendingTalks.value} pending, ${acceptedTalks.value} accepted, ${publishedTalks.value} published`,
      note: pendingTalks.value > 0 ? 'Needs review' : 'No submissions waiting',
    },
    {
      href: adminPath(`events/${event.value.id}/speakers`),
      label: 'Speaker access',
      value: speakers.value.length,
      detail: 'Approved people for submissions and slide updates',
      note: speakers.value.length > 0 ? 'Invite list ready' : 'No speakers approved',
    },
    {
      href: adminPath(`events/${event.value.id}/quiz`),
      label: 'Community quiz',
      value: quizSessions.value.length,
      detail: currentQuiz.value ? `${formatStatus(currentQuiz.value.status)} session, code ${currentQuiz.value.join_code}` : 'No quiz created for this event',
      note: activeQuiz.value ? 'Live controls available' : 'Builder available',
    },
  ];
});
const actionRows = computed(() => {
  if (!event.value) return [];

  const rows = [
    {
      href: adminPath(`events/${event.value.id}/talks`),
      label: 'Review talk pipeline',
      detail: 'Accept, reject, publish, and follow up for slides.',
    },
    {
      href: adminPath(`events/${event.value.id}/speakers`),
      label: 'Manage speaker access',
      detail: 'Keep the invite list aligned with the program.',
    },
    {
      href: adminPath(`events/${event.value.id}/quiz`),
      label: 'Prepare community quiz',
      detail: 'Upload a paper, review questions, and open the lobby.',
    },
  ];

  if (activeQuiz.value) {
    rows.push({
      href: adminPath(`events/${event.value.id}/quiz/live`),
      label: 'Host live quiz',
      detail: 'Run the active session and monitor players.',
    });
  }

  return rows;
});

async function fetchOverview() {
  const eventId = route.params.eventId;
  const [eventResponse, talksResponse, speakersResponse, quizResponse] = await Promise.all([
    fetch(`/api/events/${eventId}`),
    fetch(`/api/events/${eventId}/talks`),
    fetch(`/api/events/${eventId}/speakers`),
    fetch(`/api/quiz/sessions?eventId=${eventId}`),
  ]);

  if (eventResponse.ok) event.value = await eventResponse.json();
  if (talksResponse.ok) talks.value = await talksResponse.json();
  if (speakersResponse.ok) speakers.value = await speakersResponse.json();
  if (quizResponse.ok) quizSessions.value = await quizResponse.json();
  loading.value = false;
}

async function updateStatus(status: EventStatus) {
  if (event.value?.status === status) return;

  const response = await fetch(`/api/events/${route.params.eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (response.ok) event.value = await response.json();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatStatus(status: EventStatus | QuizSession['status']): string {
  return status.replace('_', ' ');
}

onMounted(fetchOverview);
</script>

<template>
  <div class="editorial-page">
    <div class="editorial-wrap">
      <div v-if="loading" class="py-12 text-center font-mono text-white">LOADING...</div>
      <div v-else-if="!event" class="py-12 text-center font-mono text-dc-gray">EVENT NOT FOUND</div>

      <template v-else>
        <div class="mb-8 flex flex-col gap-6 border-b border-dc-yellow/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="editorial-eyebrow">event control</p>
            <h1 class="text-4xl font-black tracking-tight text-white sm:text-5xl">{{ event.name }}</h1>
            <p v-if="event.description" class="mt-4 max-w-3xl text-base leading-7 text-dc-gray-light">{{ event.description }}</p>
          </div>
          <div class="w-full max-w-sm rounded-lg border border-dc-yellow/10 bg-[#151514]/70 p-4 lg:w-80">
            <div class="mb-4 flex items-center justify-between gap-3 font-mono text-xs uppercase tracking-wide">
              <span class="text-dc-gray">Date</span>
              <span class="text-dc-gray-light">{{ formatDate(event.event_date) }}</span>
            </div>
            <AppDropdown
              :model-value="event.status"
              label="Status"
              :options="statusOptions"
              @update:model-value="updateStatus($event as EventStatus)"
            />
          </div>
        </div>

        <section class="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
          <div>
            <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="editorial-eyebrow">program pulse</p>
                <h2 class="mt-2 text-2xl font-black tracking-tight text-white">Where this event stands</h2>
              </div>
              <p class="max-w-sm text-sm leading-6 text-dc-gray-light">A quick read on the work still moving before the community session.</p>
            </div>

            <div class="divide-y divide-dc-yellow/10 border-y border-dc-yellow/10">
              <RouterLink
                v-for="row in programRows"
                :key="row.label"
                :to="row.href"
                class="motion-colors group grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center hover:bg-dc-yellow/[0.025]"
              >
                <span class="min-w-0">
                  <span class="block text-lg font-black tracking-tight text-white group-hover:text-dc-yellow">{{ row.label }}</span>
                  <span class="mt-1 block text-sm leading-6 text-dc-gray-light">{{ row.detail }}</span>
                </span>
                <span class="flex items-baseline gap-3 sm:justify-end">
                  <span class="text-4xl font-black tracking-tight text-white">{{ row.value }}</span>
                  <span class="font-mono text-[11px] font-bold uppercase tracking-wide text-dc-gray">{{ row.note }}</span>
                </span>
              </RouterLink>
            </div>
          </div>

          <aside class="rounded-lg border border-dc-yellow/10 bg-[#151514]/70 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
            <p class="editorial-eyebrow">next actions</p>
            <div class="mt-5 space-y-1">
              <RouterLink
                v-for="(action, index) in actionRows"
                :key="action.label"
                :to="action.href"
                class="motion-colors group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-3 rounded-md px-2 py-3 hover:bg-dc-yellow/[0.04]"
              >
                <span class="font-mono text-xs font-bold text-dc-yellow/70">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="min-w-0">
                  <span class="block text-base font-black tracking-tight text-white group-hover:text-dc-yellow">{{ action.label }}</span>
                  <span class="mt-1 block text-sm leading-5 text-dc-gray-light">{{ action.detail }}</span>
                </span>
                <span class="font-mono text-dc-yellow">→</span>
              </RouterLink>
            </div>
          </aside>
        </section>
      </template>
    </div>
  </div>
</template>

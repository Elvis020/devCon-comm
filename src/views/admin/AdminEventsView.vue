<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ConfirmDialog from '@/src/components/ui/ConfirmDialog.vue';
import AdminEventsPageSkeleton from '@/src/components/ui/page-skeletons/AdminEventsPageSkeleton.vue';
import { deleteEventById, fetchEvents, importLumaEventUrl, previewLumaEventUrl, queryKeys, type LumaPreviewResponse } from '@/src/lib/api';
import { notify } from '@/src/lib/notify';
import type { Event as CommunityEvent, EventStatus } from '@/types';
import { adminPath } from '@/src/admin-routes';

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const eventsQuery = useQuery({
  queryKey: queryKeys.events,
  queryFn: fetchEvents,
});
const lumaPreviewing = ref(false);
const lumaImporting = ref(false);
const lumaError = ref<string | null>(null);
const lumaEventUrl = ref('');
const lumaPreview = ref<LumaPreviewResponse | null>(null);
const lumaPreviewUrl = ref('');
const eventPendingDelete = ref<CommunityEvent | null>(null);
const deletePending = ref(false);
const page = ref(1);
const pageSize = 6;
const lifecycleStages: Array<{
  status: EventStatus;
  label: string;
  description: string;
  organizerMove: string;
  actionLabel: string;
}> = [
  {
    status: 'draft',
    label: 'Draft',
    description: 'Create the month and rough event shape.',
    organizerMove: 'Set date, description, and internal plan.',
    actionLabel: 'Set up',
  },
  {
    status: 'cfp_open',
    label: 'Submissions open',
    description: 'Speakers can submit talk ideas.',
    organizerMove: 'Share the speaker submission link and invite speakers.',
    actionLabel: 'Promote',
  },
  {
    status: 'cfp_closed',
    label: 'Submissions closed',
    description: 'New talk ideas are no longer accepted.',
    organizerMove: 'Review talks and decide the program.',
    actionLabel: 'Review talks',
  },
  {
    status: 'upcoming',
    label: 'Program set',
    description: 'Talks, speakers, and event basics are mostly ready.',
    organizerMove: 'Confirm speakers, quiz, venue, and comms.',
    actionLabel: 'Prepare',
  },
  {
    status: 'live',
    label: 'Live',
    description: 'The event is happening now.',
    organizerMove: 'Run the room and host live activities.',
    actionLabel: 'Run event',
  },
  {
    status: 'completed',
    label: 'Completed',
    description: 'The meetup has happened.',
    organizerMove: 'Review attendance and collect feedback.',
    actionLabel: 'Review',
  },
];

const creating = computed(() => route.path.endsWith('/new'));
const events = computed(() => [...(eventsQuery.data.value ?? [])].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()));
const loading = computed(() => eventsQuery.isPending.value);
const eventsError = computed(() => eventsQuery.error.value?.message ?? null);
const pageCount = computed(() => Math.max(1, Math.ceil(events.value.length / pageSize)));
const paginatedEvents = computed(() => events.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const pageStart = computed(() => (events.value.length === 0 ? 0 : (page.value - 1) * pageSize + 1));
const pageEnd = computed(() => Math.min(events.value.length, page.value * pageSize));

async function handleLumaPreview() {
  const url = lumaEventUrl.value.trim();
  if (!url) {
    lumaError.value = 'Paste a public Luma event URL first.';
    return;
  }

  lumaPreviewing.value = true;
  lumaError.value = null;
  lumaPreview.value = null;

  try {
    lumaPreview.value = await previewLumaEventUrl(url);
    lumaPreviewUrl.value = url;
  } catch (previewError) {
    lumaError.value = previewError instanceof Error ? previewError.message : 'Unable to preview Luma event.';
    notify.error(lumaError.value);
  } finally {
    lumaPreviewing.value = false;
  }
}

async function confirmLumaImport() {
  const url = lumaPreviewUrl.value || lumaEventUrl.value.trim();
  if (!url) return;

  lumaImporting.value = true;
  lumaError.value = null;

  try {
    const payload = await importLumaEventUrl(url);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.events }),
      queryClient.invalidateQueries({ queryKey: queryKeys.overview }),
    ]);
    notify.success(payload.already_imported ? 'Luma event was already imported.' : 'Imported Luma event.');
    lumaEventUrl.value = '';
    lumaPreviewUrl.value = '';
    lumaPreview.value = null;
    await router.push(adminPath(`events/${payload.event.id}`));
  } catch (importError) {
    lumaError.value = importError instanceof Error ? importError.message : 'Unable to import Luma event.';
    notify.error(lumaError.value);
  } finally {
    lumaImporting.value = false;
  }
}

function clearLumaPreview() {
  lumaPreview.value = null;
  lumaPreviewUrl.value = '';
}

async function openExistingLumaEvent() {
  if (!lumaPreview.value?.existing_event) return;
  await router.push(adminPath(`events/${lumaPreview.value.existing_event.id}`));
}

function requestDeleteEvent(event: CommunityEvent) {
  eventPendingDelete.value = event;
}

function cancelDeleteEvent() {
  if (deletePending.value) return;
  eventPendingDelete.value = null;
}

async function confirmDeleteEvent() {
  if (!eventPendingDelete.value) return;

  const event = eventPendingDelete.value;
  deletePending.value = true;

  try {
    await deleteEventById(event.id);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.events }),
      queryClient.invalidateQueries({ queryKey: queryKeys.overview }),
    ]);
    notify.success('Event removed.');
    eventPendingDelete.value = null;
    if (page.value > pageCount.value) page.value = pageCount.value;
  } catch (error) {
    notify.error(error instanceof Error ? error.message : 'Unable to remove event.');
  } finally {
    deletePending.value = false;
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatEventMonth(value: string): string {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(value));
}

function isQuarterlyEvent(event: CommunityEvent): boolean {
  return /quarterly/i.test(event.name);
}

function eventKindLabel(event: CommunityEvent): string {
  return isQuarterlyEvent(event) ? 'Quarterly' : 'Monthly';
}

function statusMeta(status: string) {
  return lifecycleStages.find((stage) => stage.status === status) ?? lifecycleStages[0];
}

function lifecycleIndex(status: string): number {
  const index = lifecycleStages.findIndex((stage) => stage.status === status);
  return index === -1 ? 0 : index;
}

function statusActionLabel(status: string): string {
  return statusMeta(status).actionLabel;
}

function statusActionPath(event: CommunityEvent): string {
  const subsectionByStatus: Record<EventStatus, string> = {
    draft: 'speakers',
    cfp_open: 'speakers',
    cfp_closed: 'talks',
    upcoming: 'quiz',
    live: 'quiz/live',
    completed: 'attendance',
  };

  return adminPath(`events/${event.id}/${subsectionByStatus[event.status]}`);
}

function goToPage(nextPage: number) {
  page.value = Math.min(pageCount.value, Math.max(1, nextPage));
}
</script>

<template>
  <div class="editorial-page">
    <div class="editorial-wrap">
      <template v-if="creating">
        <div class="editorial-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="editorial-eyebrow">organizer</p>
            <h1 class="editorial-title">Create New Event</h1>
            <p class="editorial-subtitle">Import from Luma now, or keep the manual form shape visible while it is being finished.</p>
          </div>
        </div>

        <section class="editorial-panel mb-6 overflow-hidden">
          <div class="border-b-2 border-dc-ink bg-dc-paper-warm px-5 py-4">
            <p class="editorial-eyebrow">active path</p>
            <h2 class="mt-1 text-2xl font-black tracking-tight text-dc-ink">Import from Luma Event</h2>
            <p class="mt-1 max-w-2xl text-sm leading-6 text-dc-gray">Paste the public Luma event URL and we will pull in the event shell from the details Luma exposes.</p>
          </div>
          <form class="space-y-4 p-5" @submit.prevent="handleLumaPreview">
            <div v-if="lumaError" class="rounded-md border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ lumaError }}</div>
            <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <label class="editorial-label">Public Luma event URL</label>
                <input
                  v-model="lumaEventUrl"
                  type="url"
                  required
                  class="editorial-input font-mono"
                  placeholder="https://luma.com/..."
                  :disabled="lumaPreviewing || lumaImporting"
                />
              </div>
              <button type="submit" class="editorial-action min-h-[54px] justify-center disabled:cursor-not-allowed disabled:opacity-60" :disabled="lumaPreviewing || lumaImporting">
                {{ lumaPreviewing ? 'PREVIEWING...' : 'PREVIEW EVENT' }}
              </button>
            </div>
            <p class="text-sm leading-6 text-dc-gray">Preview the title, date, location, cover, description, and registration link before adding it to the event list.</p>

            <section v-if="lumaPreview" class="rounded-md border border-dc-border bg-dc-paper-warm p-4">
              <p class="editorial-eyebrow mb-2">preview</p>
              <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div class="min-w-0">
                  <h3 class="text-2xl font-black leading-tight text-dc-ink">{{ lumaPreview.preview.name }}</h3>
                  <p class="mt-2 font-mono text-sm font-bold uppercase text-dc-gray">{{ formatDate(lumaPreview.preview.event_date) }}</p>
                  <p class="mt-2 text-sm leading-6 text-dc-gray">{{ lumaPreview.preview.location?.label ?? lumaPreview.preview.location?.name ?? 'Location not provided' }}</p>
                  <p v-if="lumaPreview.preview.description" class="mt-3 line-clamp-3 text-sm leading-6 text-dc-gray">{{ lumaPreview.preview.description }}</p>
                  <a
                    v-if="lumaPreview.preview.registration_url"
                    :href="lumaPreview.preview.registration_url"
                    target="_blank"
                    rel="noreferrer"
                    class="mt-3 inline-flex font-mono text-xs font-bold uppercase text-dc-pink underline decoration-dc-yellow decoration-2 underline-offset-4"
                  >
                    View Luma page
                  </a>
                  <p v-if="lumaPreview.already_imported" class="mt-3 text-sm font-semibold text-dc-gray">This Luma event already exists in the event list.</p>
                </div>
                <div class="flex flex-col gap-2 sm:flex-row lg:flex-col">
                  <button
                    v-if="lumaPreview.already_imported"
                    type="button"
                    class="editorial-action min-h-12 justify-center"
                    @click="openExistingLumaEvent"
                  >
                    OPEN EVENT
                  </button>
                  <button
                    v-else
                    type="button"
                    class="editorial-action min-h-12 justify-center disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="lumaImporting"
                    @click="confirmLumaImport"
                  >
                    {{ lumaImporting ? 'IMPORTING...' : 'IMPORT EVENT' }}
                  </button>
                  <button
                    type="button"
                    class="rounded-md border-2 border-dc-ink bg-white px-4 py-3 font-mono text-xs font-bold uppercase tracking-wide text-dc-ink"
                    :disabled="lumaImporting"
                    @click="clearLumaPreview"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </section>
          </form>
        </section>

        <section class="editorial-panel relative overflow-hidden p-5 sm:p-6">
          <div class="absolute -left-12 top-7 z-10 w-48 -rotate-45 border-y-2 border-dc-ink bg-dc-yellow py-1 text-center font-mono text-[11px] font-black uppercase tracking-wide text-dc-ink shadow-[0_2px_0_#111111]">
            Coming soon
          </div>
          <div class="pl-16 sm:pl-20">
            <p class="editorial-eyebrow">manual path</p>
            <h2 class="mt-1 text-2xl font-black tracking-tight text-dc-ink">Event Form</h2>
            <p class="mt-1 text-sm leading-6 text-dc-gray">This manual setup flow is visible for shape and review, but disabled while Luma import is the supported event creation path.</p>
          </div>
          <div class="mt-5 grid gap-3 opacity-50 md:grid-cols-4">
            <div class="md:col-span-2">
              <label class="editorial-label">Name <span class="text-red-600">*</span></label>
              <div class="h-12 rounded-md border-2 border-dc-ink bg-white" />
            </div>
            <div>
              <label class="editorial-label">Date <span class="text-red-600">*</span></label>
              <div class="h-12 rounded-md border-2 border-dc-ink bg-white" />
            </div>
            <div>
              <label class="editorial-label">Location</label>
              <div class="h-12 rounded-md border-2 border-dc-ink bg-white" />
            </div>
            <div class="md:col-span-3">
              <label class="editorial-label">Description</label>
              <div class="h-12 rounded-md border-2 border-dc-ink bg-white" />
            </div>
            <div class="flex items-end">
              <button type="button" disabled class="editorial-action min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">CREATE EVENT</button>
            </div>
          </div>
        </section>
      </template>

      <template v-else>
        <div class="editorial-header flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="editorial-eyebrow">organizer</p>
            <h1 class="editorial-title">Event Management</h1>
            <p class="editorial-subtitle">Create events, move them through the program lifecycle, and jump into talk, speaker, or quiz operations.</p>
          </div>
          <RouterLink :to="adminPath('events/new')" class="editorial-action shrink-0 self-start sm:self-auto">CREATE EVENT</RouterLink>
        </div>

        <AdminEventsPageSkeleton v-if="loading" />
        <div v-else-if="eventsError" class="rounded-md border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ eventsError }}</div>
        <template v-else>
          <section class="mb-6 overflow-hidden rounded-lg border border-dc-border bg-dc-paper shadow-[0_1px_0_rgba(17,17,17,0.08)]">
            <div class="border-b border-dc-border bg-dc-paper-warm px-5 py-4">
              <p class="editorial-eyebrow mb-1">monthly event lifecycle</p>
              <h2 class="text-2xl font-black tracking-tight text-dc-ink">From idea to post-event readout</h2>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-dc-gray">Use this as the status key. Event rows only show where each month is and the action to take.</p>
            </div>
            <div class="grid gap-2 px-5 py-4 md:grid-cols-3 xl:grid-cols-6">
              <div
                v-for="(stage, index) in lifecycleStages"
                :key="stage.status"
                class="rounded-md border border-dc-border bg-white px-3 py-3"
              >
                <p class="font-mono text-[10px] font-bold uppercase tracking-wide text-dc-gray">Step {{ index + 1 }}</p>
                <p class="mt-1 font-mono text-[11px] font-bold uppercase tracking-wide text-dc-pink">{{ stage.label }}</p>
              </div>
            </div>
            <div class="border-t border-dc-border bg-dc-paper-warm px-5 py-3">
              <p class="text-sm leading-6 text-dc-gray">
                <span class="font-bold text-dc-ink">Speaker submissions</span> are the talk ideas people send in for the month. After submissions close, organizers review talks, decide the program, then move the event to program set.
              </p>
            </div>
          </section>

        <div class="ops-panel overflow-hidden">
          <div class="overflow-x-auto">
            <div class="min-w-[760px]">
              <div class="ops-panel-header event-list-grid">
                <div class="ops-label">Event</div>
                <div class="ops-label">Date</div>
                <div class="ops-label">Status</div>
                <div class="ops-label text-right">Actions</div>
              </div>
              <div>
                <div v-for="event in paginatedEvents" :key="event.id" class="ops-row event-list-grid min-h-[64px]">
                  <div class="flex min-w-0 items-center">
                    <div class="min-w-0">
                      <div class="flex min-w-0 flex-wrap items-center gap-2">
                        <div class="event-list-title">{{ formatEventMonth(event.event_date) }}</div>
                        <span
                          class="rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide"
                          :class="isQuarterlyEvent(event) ? 'border-dc-pink text-dc-pink' : 'border-dc-border text-dc-gray'"
                        >
                          {{ eventKindLabel(event) }}
                        </span>
                      </div>
                      <div class="event-list-meta">{{ event.name }}</div>
                    </div>
                  </div>
                  <div class="event-list-date">{{ formatDate(event.event_date) }}</div>
                  <div class="event-list-status">
                    <div class="event-list-dots" :aria-label="`Step ${lifecycleIndex(event.status) + 1} of ${lifecycleStages.length}`">
                      <span
                        v-for="(_, index) in lifecycleStages"
                        :key="index"
                        class="event-list-dot"
                        :class="{
                          'event-list-dot--done': index < lifecycleIndex(event.status),
                          'event-list-dot--current': index === lifecycleIndex(event.status),
                        }"
                      />
                    </div>
                    <span class="event-list-status-label">{{ statusMeta(event.status).label }}</span>
                  </div>
                  <div class="flex items-center justify-end gap-4">
                    <RouterLink :to="statusActionPath(event)" class="font-mono text-sm font-bold uppercase text-dc-ink underline decoration-dc-yellow decoration-2 underline-offset-4 hover:text-dc-pink">{{ statusActionLabel(event.status) }} &rarr;</RouterLink>
                    <button
                      type="button"
                      class="font-mono text-xs font-bold uppercase text-dc-gray hover:text-red-600"
                      @click="requestDeleteEvent(event)"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="pagination-footer">
            <p class="pagination-summary">
              Showing {{ pageStart }}-{{ pageEnd }} of {{ events.length }}
            </p>
            <div class="pagination-controls">
              <button
                class="pagination-button"
                :disabled="page === 1"
                @click="goToPage(page - 1)"
              >
                <span aria-hidden="true">‹</span>
                Prev
              </button>
              <span class="pagination-count" aria-live="polite">
                Page {{ page }} of {{ pageCount }}
              </span>
              <button
                class="pagination-button"
                :disabled="page === pageCount"
                @click="goToPage(page + 1)"
              >
                Next
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </div>
        </template>
      </template>
    </div>
    <ConfirmDialog
      :open="Boolean(eventPendingDelete)"
      title="Remove event?"
      :message="eventPendingDelete ? `This removes ${formatEventMonth(eventPendingDelete.event_date)} from the organizer event list for now.` : ''"
      confirm-label="Remove event"
      cancel-label="Keep event"
      danger
      :busy="deletePending"
      @cancel="cancelDeleteEvent"
      @confirm="confirmDeleteEvent"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { adminPath } from '@/src/admin-routes';
import { notify } from '@/src/lib/notify';
import type { Event as CommunityEvent, PublicMeetupScheduleItem } from '@/types';

type SystemDesignDraft = {
  time: string;
  title: string;
  lead: string;
  description: string;
  promptTitle: string;
  promptUrl: string;
};

const route = useRoute();
const event = ref<CommunityEvent | null>(null);
const drafts = ref<SystemDesignDraft[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const saveError = ref('');

const overviewPath = computed(() => adminPath(`events/${route.params.eventId}`));
const systemDesignSessions = computed(() => (event.value?.schedule ?? [])
  .filter((item): item is PublicMeetupScheduleItem => item.type === 'system_design'));

function draftFromSession(session?: PublicMeetupScheduleItem): SystemDesignDraft {
  const promptResource = session?.resources?.[0];

  return {
    time: session?.time ?? 'TBD',
    title: session?.title ?? '',
    lead: session?.lead ?? '',
    description: session?.description ?? '',
    promptTitle: promptResource?.title ?? 'View scenario prompt',
    promptUrl: promptResource?.url ?? '',
  };
}

function syncDrafts() {
  drafts.value = systemDesignSessions.value.length > 0
    ? systemDesignSessions.value.map(draftFromSession)
    : [draftFromSession()];
}

function normalizeDrafts(): PublicMeetupScheduleItem[] {
  return drafts.value.flatMap((draft) => {
    const title = draft.title.trim();
    const promptUrl = draft.promptUrl.trim();
    const promptTitle = draft.promptTitle.trim() || 'View scenario prompt';

    if (!title && !promptUrl && !draft.description.trim()) return [];
    if (!title) {
      throw new Error('Add a scenario title before saving.');
    }
    if (promptUrl && !URL.canParse(promptUrl)) {
      throw new Error('Use a valid URL for the system design prompt.');
    }

    return [{
      time: draft.time.trim() || 'TBD',
      title,
      type: 'system_design',
      lead: draft.lead.trim() || null,
      description: draft.description.trim() || null,
      resources: promptUrl ? [{ title: promptTitle, url: promptUrl }] : [],
    }];
  });
}

function mergeSystemDesignSchedule(items: PublicMeetupScheduleItem[]): PublicMeetupScheduleItem[] {
  const sourceSchedule = event.value?.schedule ?? [];
  const nextItems = [...items];
  const merged = sourceSchedule.flatMap((item) => {
    if (item.type !== 'system_design') return [item];
    const replacement = nextItems.shift();
    return replacement ? [replacement] : [];
  });

  return [...merged, ...nextItems];
}

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
    syncDrafts();
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to load event';
  } finally {
    loading.value = false;
  }
}

function addDraft() {
  drafts.value.push(draftFromSession());
}

function removeDraft(index: number) {
  drafts.value.splice(index, 1);
  if (drafts.value.length === 0) {
    drafts.value.push(draftFromSession());
  }
}

async function saveSystemDesign() {
  if (!event.value || saving.value) return;

  let systemDesignItems: PublicMeetupScheduleItem[];
  try {
    systemDesignItems = normalizeDrafts();
  } catch (caught) {
    saveError.value = caught instanceof Error ? caught.message : 'Check the system design details.';
    return;
  }

  saving.value = true;
  saveError.value = '';

  try {
    const response = await fetch(`/api/events/${route.params.eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule: mergeSystemDesignSchedule(systemDesignItems) }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error ?? 'Unable to save system design notes');
    }

    event.value = payload;
    syncDrafts();
    notify.success(systemDesignItems.length > 0 ? 'System design notes saved' : 'System design section cleared');
  } catch (caught) {
    saveError.value = caught instanceof Error ? caught.message : 'Unable to save system design notes';
    notify.error(saveError.value);
  } finally {
    saving.value = false;
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
          Keep the monthly architecture scenario public-ready. Add the prompt link and a short recap so people who missed the room can still follow the discussion.
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

      <form v-else class="grid gap-5" @submit.prevent="saveSystemDesign">
        <article
          v-for="(draft, index) in drafts"
          :key="index"
          class="editorial-panel p-6 sm:p-8"
        >
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="editorial-eyebrow">scenario {{ index + 1 }}</p>
              <h2 class="mt-2 text-2xl font-black tracking-tight text-dc-ink">Monthly system design artifact</h2>
            </div>
            <button
              v-if="drafts.length > 1"
              type="button"
              class="font-mono text-xs font-bold uppercase tracking-wide text-red-600 hover:text-red-700"
              :disabled="saving"
              @click="removeDraft(index)"
            >
              Remove
            </button>
          </div>

          <div class="grid gap-4 lg:grid-cols-[10rem_minmax(0,1fr)_18rem]">
            <label>
              <span class="editorial-label">Time</span>
              <input v-model="draft.time" class="editorial-input mt-2" placeholder="TBD" />
            </label>
            <label>
              <span class="editorial-label">Scenario title</span>
              <input v-model="draft.title" class="editorial-input mt-2" placeholder="Design a resilient ticketing queue" />
            </label>
            <label>
              <span class="editorial-label">Expert / facilitator</span>
              <input v-model="draft.lead" class="editorial-input mt-2" placeholder="Optional" />
            </label>
          </div>

          <div class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <label>
              <span class="editorial-label">Prompt label</span>
              <input v-model="draft.promptTitle" class="editorial-input mt-2" placeholder="View scenario prompt" />
            </label>
            <label>
              <span class="editorial-label">Prompt URL</span>
              <input v-model="draft.promptUrl" class="editorial-input mt-2" placeholder="https://..." />
            </label>
          </div>

          <label class="mt-4 block">
            <span class="editorial-label">Public recap notes</span>
            <textarea
              v-model="draft.description"
              class="editorial-textarea mt-2 min-h-[9rem]"
              placeholder="What was discussed? What tradeoffs did the room explore? What should someone who missed the session know?"
            />
          </label>
        </article>

        <p v-if="saveError" class="rounded-md border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {{ saveError }}
        </p>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="submit" class="editorial-action" :disabled="saving">
            {{ saving ? 'SAVING...' : 'SAVE SYSTEM DESIGN' }}
          </button>
          <button type="button" class="editorial-secondary-action" :disabled="saving" @click="addDraft">
            Add Scenario
          </button>
          <RouterLink :to="overviewPath" class="font-mono text-xs font-bold uppercase tracking-wide text-dc-gray hover:text-dc-ink">
            Edit full program outline
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

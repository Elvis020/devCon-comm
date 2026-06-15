<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppDropdown from '@/src/components/AppDropdown.vue';
import type { FeedbackKind } from '@/types/supabase';

const route = useRoute();
const name = ref('');
const submitAnonymously = ref(false);
const feedbackType = ref<FeedbackKind>('confusing');
const message = ref('');
const feedbackTextarea = ref<HTMLTextAreaElement | null>(null);
const open = ref(false);
const submitting = ref(false);
const submitted = ref(false);
const error = ref<string | null>(null);
const FEEDBACK_MAX_LENGTH = 4000;
const FEEDBACK_TEXTAREA_MAX_HEIGHT = 160;

const feedbackTypeOptions: { value: FeedbackKind; label: string }[] = [
  { value: 'confusing', label: 'Confusing' },
  { value: 'bug', label: 'Bug' },
  { value: 'suggestion', label: 'Suggestion' },
];

const testerName = computed(() => {
  return submitAnonymously.value ? 'Anonymous' : name.value.trim();
});

const canSubmit = computed(() => {
  return testerName.value.length > 0 && message.value.trim().length > 0 && !submitting.value;
});
const feedbackLengthLabel = computed(() => `${message.value.length}/${FEEDBACK_MAX_LENGTH}`);

function toggleOpen() {
  open.value = !open.value;
  submitted.value = false;
  error.value = null;
  if (open.value) {
    void nextTick(syncFeedbackTextareaHeight);
  }
}

function syncFeedbackTextareaHeight() {
  const element = feedbackTextarea.value;
  if (!element) return;

  element.style.height = 'auto';
  const nextHeight = Math.min(element.scrollHeight, FEEDBACK_TEXTAREA_MAX_HEIGHT);
  element.style.height = `${nextHeight}px`;
  element.style.overflowY = element.scrollHeight > FEEDBACK_TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
}

async function submitFeedback() {
  if (!canSubmit.value) {
    return;
  }

  submitting.value = true;
  error.value = null;
  submitted.value = false;

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tester_id: null,
        tester_name: testerName.value,
        type: feedbackType.value,
        message: message.value.trim(),
        page_path: route.fullPath,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? 'Unable to send feedback');
    }

    submitted.value = true;
    message.value = '';
    feedbackType.value = 'confusing';
    name.value = '';
    submitAnonymously.value = false;
    void nextTick(syncFeedbackTextareaHeight);
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Unable to send feedback';
  }

  submitting.value = false;
}

watch(submitAnonymously, (isAnonymous) => {
  if (isAnonymous) {
    name.value = '';
  }
});

watch(message, () => {
  void nextTick(syncFeedbackTextareaHeight);
});
</script>

<template>
  <div class="feedback-bot" :class="{ 'feedback-bot--open': open }">
    <Transition name="feedback-panel">
      <section v-if="open" class="feedback-bot-panel" aria-label="Send feedback">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-dc-yellow">field notes</p>
            <h2 class="mt-2 text-xl font-black tracking-tight text-white">Tell me what felt off.</h2>
          </div>
          <button class="feedback-bot-icon-button" type="button" aria-label="Close feedback" @click="toggleOpen">
            <span aria-hidden="true">x</span>
          </button>
        </div>

        <form class="feedback-bot-form" @submit.prevent="submitFeedback">
          <div class="feedback-bot-form-body space-y-4">
            <div class="space-y-3">
              <label class="block">
                <span class="editorial-label">Your name</span>
                <input
                  v-model="name"
                  class="feedback-bot-field mt-2"
                  type="text"
                  placeholder="Type your name"
                  :disabled="submitAnonymously || submitting"
                >
              </label>

              <label class="feedback-bot-check">
                <input
                  v-model="submitAnonymously"
                  type="checkbox"
                  :disabled="submitting"
                >
                <span>Send anonymously</span>
              </label>
            </div>

            <AppDropdown
              v-model="feedbackType"
              label="Kind"
              :options="feedbackTypeOptions"
              :disabled="submitting"
            />

            <label class="block">
              <span class="editorial-label">Feedback</span>
              <textarea
                ref="feedbackTextarea"
                v-model="message"
                class="feedback-bot-field feedback-bot-textarea"
                :maxlength="FEEDBACK_MAX_LENGTH"
                placeholder="What happened? What should be clearer?"
                aria-describedby="feedback-bot-count"
                :disabled="submitting"
              />
              <span id="feedback-bot-count" class="feedback-bot-textarea-meta">
                {{ feedbackLengthLabel }}
              </span>
            </label>

            <p class="font-mono text-[11px] uppercase tracking-wide text-dc-gray">
              Page: <span class="feedback-bot-route break-all">{{ route.fullPath }}</span>
            </p>

            <div v-if="error" class="rounded-md border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-100">
              {{ error }}
            </div>
            <div v-if="submitted" class="rounded-md border border-dc-yellow/25 bg-dc-yellow/[0.07] p-3 text-sm text-dc-yellow">
              Feedback sent. Thank you.
            </div>
          </div>

          <div class="feedback-bot-actions">
            <button type="submit" class="editorial-action w-full" :disabled="!canSubmit">
              {{ submitting ? 'Sending...' : 'Send feedback' }}
            </button>
          </div>
        </form>
      </section>
    </Transition>

    <button v-if="!open" class="feedback-bot-runner" type="button" :aria-expanded="open" aria-label="Open feedback bot" @click="toggleOpen">
      <span class="feedback-bot-bubble">Got feedback?</span>
      <span class="feedback-bot-body" aria-hidden="true">
        <span class="feedback-bot-face">
          <span />
          <span />
        </span>
      </span>
    </button>
  </div>
</template>

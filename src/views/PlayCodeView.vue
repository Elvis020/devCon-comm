<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getDeviceId } from '@/src/device';
import type { QuizStateResponse } from '@/types';

const route = useRoute();
const sessionId = ref<string | null>(null);
const userId = ref<string | null>(null);
const state = ref<QuizStateResponse | null>(null);
const nickname = ref(localStorage.getItem('quiz-nickname') ?? '');
const nicknameInput = ref('');
const joinError = ref<string | null>(null);
const joining = ref(true);
const showNicknamePrompt = ref(false);
const selectedAnswer = ref<number | null>(null);
const submitting = ref(false);
const now = ref(Date.now());

let pollTimer: number | undefined;
let clockTimer: number | undefined;

const remaining = computed(() => {
  if (!state.value?.question_started_at || !state.value.current_question) return state.value?.current_question?.time_limit_seconds ?? 20;
  const elapsed = Math.floor((now.value - new Date(state.value.question_started_at).getTime()) / 1000);
  return Math.max(0, state.value.current_question.time_limit_seconds - elapsed);
});

const progress = computed(() => {
  const limit = state.value?.current_question?.time_limit_seconds ?? 20;
  return (remaining.value / limit) * 100;
});

async function joinQuiz(name: string) {
  joining.value = true;
  joinError.value = null;

  const response = await fetch('/api/quiz/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      join_code: String(route.params.code).toUpperCase(),
      nickname: name,
      device_id: getDeviceId(),
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    joinError.value = data.error || 'Invalid quiz code or quiz not available';
    joining.value = false;
    return;
  }

  const data = await response.json();
  sessionId.value = data.session_id;
  userId.value = data.user_id;
  joining.value = false;
  await pollState();
  pollTimer = window.setInterval(pollState, 1500);
}

function submitNickname() {
  const name = nicknameInput.value.trim();
  if (!name) return;
  localStorage.setItem('quiz-nickname', name);
  nickname.value = name;
  showNicknamePrompt.value = false;
  void joinQuiz(name);
}

async function pollState() {
  if (!sessionId.value || !userId.value) return;

  const response = await fetch(`/api/quiz/state?sessionId=${sessionId.value}&userId=${userId.value}`);
  if (response.ok) {
    state.value = await response.json();
    return;
  }

  if (response.status === 404) {
    joinError.value = 'Session ended';
  }
}

async function submitAnswer(answerIndex: number) {
  if (!sessionId.value || !userId.value || submitting.value || state.value?.player_result) return;
  submitting.value = true;
  selectedAnswer.value = answerIndex;

  await fetch('/api/quiz/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId.value,
      user_id: userId.value,
      answer_index: answerIndex,
    }),
  });

  submitting.value = false;
  await pollState();
}

onMounted(async () => {
  clockTimer = window.setInterval(() => {
    now.value = Date.now();
  }, 250);

  const activeResponse = await fetch('/api/quiz/active');
  const active = await activeResponse.json();
  if (!active.has_active_quiz) {
    joinError.value = 'No active quiz available';
    joining.value = false;
    return;
  }

  if (!nickname.value) {
    showNicknamePrompt.value = true;
    joining.value = false;
    return;
  }

  await joinQuiz(nickname.value);
});

onUnmounted(() => {
  if (pollTimer) window.clearInterval(pollTimer);
  if (clockTimer) window.clearInterval(clockTimer);
});
</script>

<template>
  <div class="min-h-screen bg-dc-dark">
    <div v-if="showNicknamePrompt" class="flex min-h-screen items-center justify-center px-4">
      <form class="w-full max-w-md border-4 border-dc-yellow bg-dc-dark-1 p-8 shadow-glow sm:p-12" @submit.prevent="submitNickname">
        <div class="mb-8 text-center">
          <h1 class="mb-2 text-3xl font-black text-white sm:text-4xl">Welcome to the <span class="text-dc-yellow">Quiz</span></h1>
          <p class="text-dc-gray-light">Enter your nickname to join</p>
        </div>
        <label class="mb-2 block text-sm font-bold uppercase tracking-wide text-dc-yellow">Your Nickname</label>
        <input v-model="nicknameInput" required maxlength="20" autofocus class="mb-6 w-full border-2 border-dc-dark-3 bg-dc-dark-2 px-4 py-4 text-xl text-white outline-none focus:border-dc-yellow" />
        <button type="submit" class="w-full bg-dc-yellow py-4 text-lg font-bold uppercase tracking-wide text-dc-dark hover:shadow-glow">Join Quiz</button>
      </form>
    </div>

    <div v-else-if="joinError" class="flex h-full min-h-screen items-center justify-center px-4">
      <div class="max-w-2xl text-center">
        <h1 class="mb-8 select-none text-9xl font-black leading-none text-dc-yellow/20 sm:text-[12rem]">404</h1>
        <h2 class="mb-4 text-3xl font-black text-white sm:text-4xl">Quiz Not <span class="text-dc-yellow">Found</span></h2>
        <p class="mb-8 text-lg text-dc-gray-light">{{ joinError }}</p>
        <RouterLink to="/play" class="inline-block bg-dc-yellow px-8 py-4 font-bold uppercase tracking-wide text-dc-dark transition-all hover:shadow-glow">Try Another Code</RouterLink>
      </div>
    </div>

    <div v-else-if="joining || !state" class="flex min-h-screen items-center justify-center p-4">
      <div class="text-center">
        <div class="mb-4 inline-block size-20 animate-spin rounded-full border-4 border-dc-yellow border-t-transparent" />
        <p class="text-xl text-white">{{ joining ? 'Joining quiz...' : 'Connecting...' }}</p>
      </div>
    </div>

    <div v-else-if="state.session.status === 'waiting' || state.session.status === 'draft'" class="flex min-h-screen items-center justify-center p-6">
      <div class="w-full max-w-sm text-center">
        <div class="relative mb-12">
          <div class="mx-auto flex size-40 animate-pulse-glow items-center justify-center border-4 border-dc-yellow bg-dc-dark-1 shadow-glow">
            <span class="font-mono text-6xl text-dc-yellow">...</span>
          </div>
        </div>
        <h1 class="mb-8 font-mono text-5xl font-bold text-white">WAITING...</h1>
        <div class="mb-8 inline-block border-4 border-dc-yellow bg-dc-dark-1 px-8 py-6">
          <div class="mb-2 font-mono text-sm uppercase tracking-wider text-dc-gray">Players Connected</div>
          <div class="font-mono text-6xl font-bold tabular-nums text-dc-yellow">{{ state.participants_count }}</div>
        </div>
        <p class="font-mono text-dc-gray-light">Waiting for host to start</p>
      </div>
    </div>

    <div v-else-if="state.session.status === 'finished'" class="flex min-h-screen items-center justify-center p-4 py-12">
      <div class="w-full max-w-lg">
        <div class="mb-8 text-center">
          <div class="mb-8 inline-block bg-dc-yellow px-6 py-3 font-mono text-sm font-bold uppercase tracking-wide text-dc-dark">Quiz Complete</div>
          <div class="mb-6 border-4 border-dc-dark-3 bg-dc-dark-1 p-10">
            <div class="mb-3 font-mono text-sm font-bold uppercase tracking-wider text-dc-gray">Final Score</div>
            <div class="font-mono text-6xl font-bold tabular-nums text-white">
              {{ state.leaderboard.find((entry) => entry.user_id === userId)?.total_score ?? 0 }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="state.session.question_phase === 'scoreboard'" class="flex min-h-screen items-center justify-center p-6">
      <div class="w-full max-w-lg">
        <div class="mb-8 text-center">
          <div class="mb-6 inline-block bg-dc-yellow px-6 py-3 font-mono text-sm font-bold uppercase tracking-wide text-dc-dark">Scoreboard</div>
          <h2 class="mb-2 font-mono text-3xl font-bold text-white">RANKINGS</h2>
          <p class="font-mono text-sm text-dc-gray">After Question {{ state.session.current_question_index + 1 }}</p>
        </div>
        <div class="mb-6 border-4 border-dc-yellow/30 bg-dc-dark-1">
          <div class="divide-y-2 divide-dc-dark-3">
            <div v-for="(player, index) in state.leaderboard.slice(0, 5)" :key="player.user_id" class="flex items-center justify-between px-6 py-5" :class="player.user_id === userId ? 'bg-dc-yellow text-dc-dark shadow-glow' : 'bg-dc-dark-1 text-white'">
              <div class="flex items-center gap-4">
                <span class="min-w-12 font-mono text-3xl font-bold tabular-nums">#{{ index + 1 }}</span>
                <span class="font-mono text-lg font-bold">{{ player.nickname }}</span>
              </div>
              <span class="font-mono text-2xl font-bold tabular-nums">{{ player.total_score }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="state.session.question_phase === 'revealing' && state.player_result" class="flex min-h-screen items-center justify-center p-6" :class="state.player_result.is_correct ? 'bg-green-600' : 'bg-red-600'">
      <div class="w-full max-w-lg text-center">
        <div class="mb-6 text-9xl">{{ state.player_result.is_correct ? '✓' : '✗' }}</div>
        <h1 class="mb-8 font-mono text-6xl font-bold text-white">{{ state.player_result.is_correct ? 'CORRECT!' : 'INCORRECT' }}</h1>
        <div v-if="state.player_result.is_correct" class="inline-block bg-white px-12 py-6 text-green-600">
          <div class="mb-2 font-mono text-sm font-bold uppercase tracking-wide">Points Earned</div>
          <div class="font-mono text-7xl font-bold tabular-nums">+{{ state.player_result.points_awarded }}</div>
        </div>
      </div>
    </div>

    <div v-else class="flex min-h-screen flex-col bg-dc-dark">
      <div class="h-4 border-b-4 border-dc-dark-2 bg-dc-dark-3">
        <div class="h-full transition-all duration-100" :class="progress > 50 ? 'bg-dc-yellow' : progress > 20 ? 'bg-orange-500' : 'bg-red-500'" :style="{ width: `${progress}%` }" />
      </div>

      <div class="flex flex-1 flex-col justify-center p-4 pb-6">
        <div class="mb-8 text-center">
          <div class="mb-6 inline-block border-2 border-dc-yellow/30 bg-dc-dark-2 px-4 py-2 font-mono text-xs uppercase tracking-wide text-dc-gray">
            Question {{ state.session.current_question_index + 1 }}
          </div>
          <div class="font-mono text-9xl font-bold tabular-nums text-dc-yellow">{{ remaining }}</div>
          <div class="mt-2 font-mono text-sm uppercase tracking-wider text-dc-gray">Seconds Remaining</div>
        </div>

        <div v-if="state.player_result" class="mb-8 text-center">
          <div class="inline-block bg-dc-yellow px-8 py-5 font-mono text-2xl font-bold text-dc-dark shadow-glow">ANSWER LOCKED IN</div>
          <div class="mt-4 font-mono text-sm text-dc-gray">{{ state.answers_count }} / {{ state.participants_count }} players answered</div>
        </div>

        <div class="mx-auto grid w-full max-w-2xl grid-cols-2 gap-4">
          <button
            v-for="(label, index) in ['A', 'B', 'C', 'D']"
            :key="label"
            class="flex aspect-square min-h-[140px] items-center justify-center font-mono text-6xl font-bold text-white shadow-xl transition-all duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
            :class="[index === 0 ? 'bg-quiz-red' : index === 1 ? 'bg-quiz-blue' : index === 2 ? 'bg-quiz-yellow' : 'bg-quiz-green', selectedAnswer === index ? 'scale-95 ring-8 ring-white' : '']"
            :disabled="Boolean(state.player_result) || submitting || !state.current_question || index >= state.current_question.options.length"
            @click="submitAnswer(index)"
          >
            {{ label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

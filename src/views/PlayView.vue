<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getDeviceId } from '@/src/device';

const router = useRouter();
const joinCode = ref('');
const nickname = ref('');
const joining = ref(false);
const error = ref<string | null>(null);
const quizAvailable = ref<boolean | null>(null);

onMounted(async () => {
  try {
    const response = await fetch('/api/quiz/active');
    const data = await response.json();
    quizAvailable.value = Boolean(data.available);
  } catch {
    quizAvailable.value = false;
  }
});

async function joinQuiz() {
  joining.value = true;
  error.value = null;

  try {
    const code = joinCode.value.toUpperCase();
    const response = await fetch('/api/quiz/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        join_code: code,
        nickname: nickname.value,
        device_id: getDeviceId(),
      }),
    });

    if (response.ok) {
      localStorage.setItem('quiz-nickname', nickname.value);
      await router.push(`/play/${code}`);
    } else {
      const data = await response.json();
      error.value = data.error || 'Failed to join quiz';
    }
  } catch {
    error.value = 'Connection error. Please try again.';
  } finally {
    joining.value = false;
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-dc-dark px-4">
    <div
      class="absolute inset-0 opacity-20"
      style="
        background-image:
          linear-gradient(rgba(249, 225, 94, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(249, 225, 94, 0.1) 1px, transparent 1px);
        background-size: 50px 50px;
      "
    />

    <div v-if="quizAvailable === null" class="relative text-center">
      <div class="motion-spinner mb-4 inline-block size-16 rounded-full border-4 border-dc-yellow border-t-transparent" />
      <p class="text-lg text-white">Loading...</p>
    </div>

    <div v-else-if="!quizAvailable" class="relative max-w-2xl text-center">
      <h1 class="mb-8 select-none text-9xl font-black leading-none text-dc-yellow/20 sm:text-[12rem]">404</h1>
      <h2 class="mb-4 text-3xl font-black text-white sm:text-4xl">Page Not <span class="text-dc-yellow">Found</span></h2>
      <p class="mb-2 text-lg text-dc-gray-light">This page is only available when there's an active quiz session.</p>
      <p class="mb-8 text-sm text-dc-gray">The host hasn't started a quiz yet. Come back when the game is live.</p>
      <RouterLink to="/" class="motion-press inline-block bg-dc-yellow px-8 py-4 font-bold uppercase tracking-wide text-dc-dark hover:shadow-glow">
        Back to Home
      </RouterLink>
    </div>

    <div v-else class="relative w-full max-w-md">
      <div class="absolute -left-4 -top-4 size-20 border-l-4 border-t-4 border-dc-yellow/50" />
      <div class="absolute -right-4 -top-4 size-20 border-r-4 border-t-4 border-dc-yellow/50" />
      <div class="absolute -bottom-4 -left-4 size-20 border-b-4 border-l-4 border-dc-yellow/50" />
      <div class="absolute -bottom-4 -right-4 size-20 border-b-4 border-r-4 border-dc-yellow/50" />

      <div class="border-2 border-dc-yellow bg-dc-dark-1 p-8 shadow-glow sm:p-12">
        <div class="mb-8 text-center">
          <div class="mb-4 inline-block bg-dc-yellow px-3 py-1 font-mono text-xs font-bold text-dc-dark">QUIZ ENTRY POINT</div>
          <h1 class="mb-2 font-mono text-3xl font-bold text-white sm:text-4xl">JOIN <span class="text-dc-yellow">QUIZ</span></h1>
          <p class="font-mono text-sm text-dc-gray">Enter the code displayed on screen</p>
        </div>

        <form class="space-y-6" @submit.prevent="joinQuiz">
          <div>
            <label class="mb-2 block font-mono text-xs font-bold uppercase text-dc-yellow">Quiz Code</label>
            <input v-model="joinCode" required maxlength="6" placeholder="ABC123" class="motion-colors w-full border-2 border-dc-dark-3 bg-dc-dark-2 px-4 py-4 text-center font-mono text-3xl font-bold uppercase tracking-widest text-white outline-none focus:border-dc-yellow" @input="joinCode = joinCode.toUpperCase()" />
          </div>
          <div>
            <label class="mb-2 block font-mono text-xs font-bold uppercase text-dc-yellow">Your Nickname</label>
            <input v-model="nickname" required maxlength="20" placeholder="QuizMaster" class="motion-colors w-full border-2 border-dc-dark-3 bg-dc-dark-2 px-4 py-3 font-mono text-white outline-none focus:border-dc-yellow" />
          </div>
          <div v-if="error" class="border-2 border-red-500 bg-red-900/30 p-4">
            <p class="font-mono text-sm text-red-400">{{ error }}</p>
          </div>
          <button type="submit" :disabled="joining || !joinCode || !nickname" class="motion-press group relative w-full overflow-hidden bg-dc-yellow py-4 font-mono text-lg font-bold uppercase tracking-wide text-dc-dark hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50">
            {{ joining ? 'JOINING...' : 'ENTER QUIZ' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

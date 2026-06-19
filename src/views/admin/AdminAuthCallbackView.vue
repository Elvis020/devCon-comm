<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminPath } from '@/src/admin-routes';
import { fetchAdminSession } from '@/src/lib/api';

const route = useRoute();
const router = useRouter();
const error = ref<string | null>(null);
const loading = ref(true);
const redirectTo = computed(() => String(route.query.next ?? route.query.redirect ?? adminPath('events')));

async function redirectToLogin(message?: string) {
  const query: Record<string, string> = {
    redirect: redirectTo.value,
  };

  if (message) {
    query.error = message;
  }

  await router.replace({
    path: adminPath('login'),
    query,
  });
}

onMounted(async () => {
  try {
    const session = await fetchAdminSession();
    if (session.authenticated) {
      await router.replace(redirectTo.value);
      return;
    }
  } catch {
    // Fall through to the login page when the hosted API/session check is unreachable.
  }

  loading.value = false;
  error.value = 'Organizer sign-in now uses Google. Return to the sign-in page and continue with your approved account.';
});
</script>

<template>
  <div class="editorial-page">
    <div class="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4 py-12">
      <div class="editorial-panel w-full max-w-md p-8 text-center sm:p-10">
        <p class="editorial-eyebrow">organizer access</p>
        <h1 class="mt-3 text-4xl font-black tracking-tight text-dc-ink">
          {{ loading ? 'Checking Session' : 'Use Google Sign-In' }}
        </h1>
        <p class="mt-3 text-sm leading-6 text-dc-gray">
          {{
            loading
              ? 'We are checking whether your organizer session is already active.'
              : error
          }}
        </p>

        <button
          v-if="!loading"
          type="button"
          class="editorial-action mt-6 w-full justify-center"
          @click="redirectToLogin()"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  </div>
</template>

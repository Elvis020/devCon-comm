<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminPath } from '@/src/admin-routes';
import { clearAdminLoginCooldown, readAdminAuthResponsePayload } from '@/src/lib/admin-auth-client';
import { fetchAdminSession } from '@/src/lib/api';

const route = useRoute();
const router = useRouter();
const error = ref<string | null>(null);
const loading = ref(true);
const redirectTo = computed(() => String(route.query.next ?? route.query.redirect ?? adminPath('events')));

function clearAuthHash() {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

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
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const hashError = hashParams.get('error_description') || hashParams.get('error');
  const accessToken = hashParams.get('access_token');

  if (hashError) {
    clearAuthHash();
    await redirectToLogin(hashError);
    return;
  }

  if (accessToken) {
    try {
      const response = await fetch('/api/auth/admin/exchange', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      });

      clearAuthHash();

      if (!response.ok) {
        const { message } = await readAdminAuthResponsePayload(response);
        await redirectToLogin(message);
        return;
      }

      clearAdminLoginCooldown();
      await router.replace(redirectTo.value);
      return;
    } catch {
      clearAuthHash();
      await redirectToLogin('Unable to finish sign in. Please request a new link.');
      return;
    }
  }

  try {
    const session = await fetchAdminSession();
    if (session.authenticated) {
      clearAdminLoginCooldown();
      await router.replace(redirectTo.value);
      return;
    }
  } catch {
    // Fall through to the login page when the hosted API/session check is unreachable.
  }

  loading.value = false;
  error.value = 'Organizer sign-in link is missing or expired. Please request a new link.';
});
</script>

<template>
  <div class="editorial-page">
    <div class="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4 py-12">
      <div class="editorial-panel w-full max-w-md p-8 text-center sm:p-10">
        <p class="editorial-eyebrow">organizer access</p>
        <h1 class="mt-3 text-4xl font-black tracking-tight text-dc-ink">
          {{ loading ? 'Finishing Sign-In' : 'Sign-In Link Expired' }}
        </h1>
        <p class="mt-3 text-sm leading-6 text-dc-gray">
          {{
            loading
              ? 'We are verifying your organizer link and opening the console.'
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

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { adminPath, isAdminPath } from './admin-routes';

interface NavLink {
  href: string;
  label: string;
  accent?: boolean;
}

interface AdminEventSummary {
  id: string;
  event_date: string;
  status: string;
}

interface AdminQuizSessionSummary {
  event_id: string;
  status: string;
}

const route = useRoute();
const router = useRouter();
const quizAvailable = ref(false);
const defaultAdminEventId = ref<string | null>(null);
const activeAdminEventIds = ref<Set<string>>(new Set());
let quizAvailabilityInterval: number | undefined;

const publicLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/archive', label: 'Archive' },
  { href: '/leaderboard', label: 'Leaderboard' },
];

const speakerLinks: NavLink[] = [
  { href: '/my-talks', label: 'My Talks' },
];

const playLinks: NavLink[] = [
  { href: '/play', label: 'Play', accent: true },
];

const adminLinks: NavLink[] = [
  { href: adminPath('events'), label: 'Events' },
];

const isAdminRoute = computed(() => isAdminPath(route.path));
const adminEventId = computed(() => {
  const value = route.params.eventId;
  if (Array.isArray(value)) return value[0];
  return value || defaultAdminEventId.value;
});
const adminEventLinks = computed<NavLink[]>(() => {
  if (!adminEventId.value) return [];

  const links: NavLink[] = [
    { href: adminPath(`events/${adminEventId.value}`), label: 'Overview' },
    { href: adminPath(`events/${adminEventId.value}/talks`), label: 'Talks' },
    { href: adminPath(`events/${adminEventId.value}/speakers`), label: 'Speakers' },
    { href: adminPath(`events/${adminEventId.value}/quiz`), label: 'Quiz' },
  ];

  if (activeAdminEventIds.value.has(adminEventId.value)) {
    links.push({ href: adminPath(`events/${adminEventId.value}/quiz/live`), label: 'Live' });
  }

  return links;
});
const primaryLinks = computed(() => (isAdminRoute.value ? adminLinks : publicLinks));
const visiblePlayLinks = computed(() => (quizAvailable.value ? playLinks : []));
const navGroups = computed(() => {
  if (isAdminRoute.value) {
    return [
      primaryLinks.value,
      adminEventLinks.value,
    ].filter((group) => group.length > 0);
  }

  return [
    primaryLinks.value,
    speakerLinks,
    visiblePlayLinks.value,
  ].filter((group) => group.length > 0);
});
const modeSwitchLink = computed(() => (isAdminRoute.value ? '/' : adminPath('events')));
const modeSwitchLabel = computed(() => (isAdminRoute.value ? 'Community' : 'Organizer'));
const activeNavHref = computed(() => {
  return navGroups.value
    .flat()
    .filter((link) => {
      if (link.href === '/') return route.path === '/';
      return route.path === link.href || route.path.startsWith(`${link.href}/`);
    })
    .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
});

function isActive(href: string) {
  return activeNavHref.value === href;
}

function linkClass(link: NavLink) {
  if (isActive(link.href)) {
    return link.accent
      ? 'border-dc-yellow/55 text-dc-yellow'
      : 'text-white after:scale-x-100 after:bg-dc-yellow';
  }

  if (link.accent) {
    return 'border-dc-yellow/20 text-dc-yellow hover:border-dc-yellow/45 hover:text-dc-yellow-glow';
  }

  return 'text-dc-gray-light after:scale-x-0 after:bg-dc-yellow/70 hover:text-white hover:after:scale-x-100';
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  await router.push('/');
}

async function refreshQuizAvailability() {
  try {
    const response = await fetch('/api/quiz/active');
    if (!response.ok) {
      quizAvailable.value = false;
      return;
    }

    const data = await response.json();
    quizAvailable.value = Boolean(data.available || data.has_active_quiz);
  } catch {
    quizAvailable.value = false;
  }
}

async function refreshDefaultAdminEvent() {
  if (!isAdminRoute.value || route.path === adminPath('login')) {
    defaultAdminEventId.value = null;
    activeAdminEventIds.value = new Set();
    return;
  }

  try {
    const [eventsResponse, sessionsResponse] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/quiz/sessions'),
    ]);
    if (!eventsResponse.ok) return;

    const events = (await eventsResponse.json()) as AdminEventSummary[];
    const sessions = sessionsResponse.ok ? await sessionsResponse.json() as AdminQuizSessionSummary[] : [];
    activeAdminEventIds.value = new Set(
      sessions
        .filter((session) => session.status === 'waiting' || session.status === 'active')
        .map((session) => session.event_id),
    );
    const sortedEvents = [...events].sort((a, b) => {
      const priority: Record<string, number> = {
        live: 0,
        upcoming: 1,
        cfp_open: 2,
        cfp_closed: 3,
        draft: 4,
        completed: 5,
      };
      const priorityDelta = (priority[a.status] ?? 99) - (priority[b.status] ?? 99);
      if (priorityDelta !== 0) return priorityDelta;
      return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
    });

    defaultAdminEventId.value = sortedEvents[0]?.id ?? null;
  } catch {
    defaultAdminEventId.value = null;
  }
}

onMounted(() => {
  void refreshQuizAvailability();
  void refreshDefaultAdminEvent();
  quizAvailabilityInterval = window.setInterval(() => {
    void refreshQuizAvailability();
  }, 15000);
});

watch(() => route.path, () => {
  void refreshDefaultAdminEvent();
});

onUnmounted(() => {
  if (quizAvailabilityInterval !== undefined) {
    window.clearInterval(quizAvailabilityInterval);
  }
});
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-dc-dark text-white">
    <header class="sticky top-0 z-50 border-b border-dc-yellow/10 bg-[#090908]/96 backdrop-blur-md">
      <div class="grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-8 lg:px-8">
        <RouterLink to="/" class="group flex min-h-9 items-center font-mono text-xl font-bold tracking-tight sm:text-2xl">
          <span class="text-white">DEV</span>
          <span class="mx-1 text-dc-yellow">::</span>
          <span class="text-white">CON</span>
          <span class="motion-colors text-dc-gray group-hover:text-dc-yellow">[]</span>
        </RouterLink>

        <div class="flex items-center justify-end gap-3 lg:order-3">
          <span class="hidden h-8 w-px rounded-full bg-dc-yellow/20 sm:block" />
          <RouterLink
            :to="modeSwitchLink"
            class="motion-press rounded-md border border-dc-yellow/20 bg-dc-yellow/[0.035] px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-dc-yellow hover:border-dc-yellow/45 hover:text-dc-yellow-glow"
          >
            {{ modeSwitchLabel }}
          </RouterLink>
          <button
            v-if="isAdminRoute && route.path !== adminPath('login')"
            class="motion-press rounded-md border border-dc-yellow/25 bg-[#11110f] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-dc-gray-light shadow-[inset_0_1px_0_rgba(249,225,94,0.05)] hover:border-dc-yellow/45 hover:text-white"
            @click="logout"
          >
            Sign Out
          </button>
        </div>

        <nav class="col-span-2 flex min-w-0 items-center gap-4 overflow-x-auto font-mono text-[11px] font-semibold uppercase tracking-wide sm:gap-6 sm:text-xs lg:order-2 lg:col-span-1">
          <template v-for="(group, groupIndex) in navGroups" :key="groupIndex">
            <RouterLink
              v-for="link in group"
              :key="link.href"
              :to="link.href"
              class="motion-colors relative shrink-0 py-1.5 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:transition-transform after:duration-150 after:ease-[var(--motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dc-yellow/35"
              :class="[link.accent ? 'rounded-md border px-2.5 after:hidden sm:px-3' : '', linkClass(link)]"
            >
              {{ link.label }}
            </RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto overflow-x-hidden">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

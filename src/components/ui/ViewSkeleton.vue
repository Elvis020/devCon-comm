<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'cards' | 'dashboard' | 'detail' | 'event-overview' | 'form' | 'leaderboard' | 'ledger' | 'play' | 'quiz' | 'table';
  rows?: number;
}>(), {
  variant: 'cards',
  rows: 4,
});
</script>

<template>
  <div class="view-skeleton" :class="{ 'view-skeleton--dark': variant === 'play' }" aria-busy="true" aria-label="Loading content">
    <template v-if="variant === 'dashboard'">
      <section class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div class="skeleton-chip mb-7" />
          <div class="skeleton-line skeleton-line--hero" />
          <div class="skeleton-line skeleton-line--hero-short mt-3" />
          <div class="mt-8 max-w-2xl space-y-3">
            <div class="skeleton-line" />
            <div class="skeleton-line skeleton-line--two-thirds" />
          </div>
          <div class="mt-8 flex flex-wrap gap-3">
            <div class="skeleton-button" />
            <div class="skeleton-button skeleton-button--secondary" />
          </div>
        </div>
        <div class="skeleton-media" />
      </section>
    </template>

    <template v-else>
      <header v-if="variant !== 'table'" class="skeleton-header">
        <div>
          <div class="skeleton-eyebrow" />
          <div class="skeleton-title" />
          <div class="mt-4 max-w-2xl space-y-3">
            <div class="skeleton-line" />
            <div class="skeleton-line skeleton-line--two-thirds" />
          </div>
        </div>
        <div v-if="variant === 'event-overview' || variant === 'ledger' || variant === 'form'" class="skeleton-summary-card" />
      </header>

      <section v-if="variant === 'play'" class="relative mx-auto w-full max-w-md">
        <div class="skeleton-play-corner skeleton-play-corner--tl" />
        <div class="skeleton-play-corner skeleton-play-corner--tr" />
        <div class="skeleton-play-corner skeleton-play-corner--bl" />
        <div class="skeleton-play-corner skeleton-play-corner--br" />
        <div class="skeleton-play-panel">
          <div class="mx-auto mb-8 h-6 w-36 rounded bg-dc-yellow/35" />
          <div class="mx-auto h-10 w-56 rounded bg-white/15" />
          <div class="mx-auto mt-4 h-4 w-64 rounded bg-white/10" />
          <div class="mt-10 space-y-6">
            <div class="h-16 rounded border-2 border-dc-yellow/25 bg-white/10" />
            <div class="h-14 rounded border-2 border-dc-yellow/25 bg-white/10" />
            <div class="h-14 rounded bg-dc-yellow/45" />
          </div>
        </div>
      </section>

      <section v-else-if="variant === 'event-overview'" class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.46fr)] xl:items-start">
        <div>
          <div class="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] sm:items-end">
            <div class="space-y-3">
              <div class="skeleton-eyebrow" />
              <div class="skeleton-line skeleton-line--heading" />
            </div>
            <div class="space-y-2">
              <div class="skeleton-line" />
              <div class="skeleton-line skeleton-line--two-thirds" />
            </div>
          </div>
          <div class="skeleton-panel overflow-hidden">
            <div v-for="item in 5" :key="item" class="skeleton-row skeleton-row--program">
              <div class="space-y-3">
                <div class="skeleton-line skeleton-line--half" />
                <div class="skeleton-line skeleton-line--two-thirds" />
              </div>
              <div class="skeleton-number-pair" />
            </div>
          </div>
        </div>
        <aside class="skeleton-panel overflow-hidden xl:mt-20">
          <div class="skeleton-panel-header" />
          <div v-for="item in 5" :key="item" class="skeleton-row skeleton-row--action">
            <div class="skeleton-dot" />
            <div class="flex-1 space-y-3">
              <div class="skeleton-line skeleton-line--half" />
              <div class="skeleton-line" />
            </div>
          </div>
        </aside>
      </section>

      <section v-else-if="variant === 'ledger'" class="space-y-6">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div v-for="item in 4" :key="item" class="skeleton-stat-card" />
        </div>
        <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div class="skeleton-table" :style="{ '--skeleton-rows': String(Math.max(rows, 5)) }" />
          <aside class="space-y-4">
            <div v-for="item in 3" :key="item" class="skeleton-side-card" />
          </aside>
        </div>
      </section>

      <section v-else-if="variant === 'quiz'" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div class="space-y-6">
          <div class="skeleton-form-card skeleton-form-card--tall" />
          <div class="skeleton-panel overflow-hidden">
            <div class="skeleton-panel-header" />
            <div v-for="item in Math.max(rows, 3)" :key="item" class="skeleton-row skeleton-row--question">
              <div class="skeleton-line skeleton-line--two-thirds" />
              <div class="mt-4 grid gap-3 sm:grid-cols-4">
                <div v-for="option in 4" :key="option" class="skeleton-option" />
              </div>
            </div>
          </div>
        </div>
        <aside class="space-y-4">
          <div class="skeleton-side-card skeleton-side-card--qr" />
          <div class="skeleton-side-card" />
        </aside>
      </section>

      <section v-else-if="variant === 'form'" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div class="space-y-5">
          <div class="skeleton-form-card" />
          <div v-for="item in Math.max(rows, 3)" :key="item" class="skeleton-form-card skeleton-form-card--compact" />
        </div>
        <aside class="space-y-4">
          <div class="skeleton-side-card" />
          <div class="skeleton-side-card" />
        </aside>
      </section>

      <section v-else-if="variant === 'leaderboard'" class="skeleton-panel overflow-hidden">
        <div class="h-14 bg-dc-yellow" />
        <div v-for="item in Math.max(rows, 6)" :key="item" class="skeleton-row skeleton-row--leaderboard">
          <div class="skeleton-rank" />
          <div class="skeleton-avatar" />
          <div class="flex-1 space-y-3">
            <div class="skeleton-line skeleton-line--half" />
            <div class="skeleton-line skeleton-line--third" />
          </div>
          <div class="skeleton-score" />
        </div>
      </section>

      <section v-else-if="variant === 'table'" class="skeleton-table" :style="{ '--skeleton-rows': String(Math.max(rows, 4)) }" />

      <section v-else-if="variant === 'detail'" class="space-y-7">
        <div class="skeleton-panel p-6 sm:p-8">
          <div class="skeleton-eyebrow" />
          <div class="skeleton-title mt-5" />
          <div class="skeleton-line skeleton-line--third mt-5" />
          <div class="mt-7 space-y-3">
            <div class="skeleton-line" />
            <div class="skeleton-line skeleton-line--two-thirds" />
          </div>
        </div>
        <div class="skeleton-panel overflow-hidden">
          <div v-for="item in Math.max(rows, 3)" :key="item" class="skeleton-row skeleton-row--article">
            <div class="space-y-3">
              <div class="skeleton-line skeleton-line--third" />
              <div class="skeleton-line skeleton-line--two-thirds" />
              <div class="skeleton-line" />
            </div>
            <div class="skeleton-button skeleton-button--secondary" />
          </div>
        </div>
      </section>

      <section v-else class="grid gap-5 md:grid-cols-2">
        <article v-for="item in Math.max(rows, 4)" :key="item" class="skeleton-card">
          <div class="skeleton-card-media" />
          <div class="space-y-4 p-5">
            <div class="skeleton-line skeleton-line--third" />
            <div class="skeleton-line skeleton-line--two-thirds" />
            <div class="skeleton-line" />
            <div class="skeleton-button skeleton-button--secondary" />
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

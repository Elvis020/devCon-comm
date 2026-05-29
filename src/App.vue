<template>
  <div class="min-h-screen bg-dc-dark text-white">
    <header class="border-b border-dc-dark-3 bg-dc-dark/95">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <RouterLink to="/" class="font-mono text-xl font-black tracking-wide text-dc-yellow">
          DevCon-Comm
        </RouterLink>
        <nav class="hidden items-center gap-5 font-mono text-sm text-dc-gray-light sm:flex">
          <RouterLink to="/" class="transition hover:text-dc-yellow">Overview</RouterLink>
          <RouterLink to="/admin/events" class="transition hover:text-dc-yellow">Admin</RouterLink>
          <RouterLink to="/play" class="transition hover:text-dc-yellow">Play</RouterLink>
          <RouterLink to="/archive" class="transition hover:text-dc-yellow">Archive</RouterLink>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

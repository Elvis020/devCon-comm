<template>
  <div class="flex h-screen flex-col overflow-hidden bg-dc-dark text-white">
    <header class="sticky top-0 z-50 border-b-2 border-dc-yellow bg-dc-dark/95 backdrop-blur-sm">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="group flex items-center font-sans text-xl font-bold">
          <span class="text-white">DEV</span>
          <span class="text-dc-yellow">::</span>
          <span class="text-white">CON</span>
          <span class="text-dc-gray transition-colors group-hover:text-dc-yellow">[]</span>
        </RouterLink>
        <nav class="hidden items-center gap-1 font-sans text-sm font-bold uppercase tracking-wide md:flex">
          <RouterLink to="/" class="px-4 py-2 text-dc-yellow transition-colors">Home</RouterLink>
          <RouterLink to="/archive" class="px-4 py-2 text-dc-gray-light transition-colors hover:text-dc-yellow">Archive</RouterLink>
          <RouterLink to="/my-talks" class="px-4 py-2 text-dc-gray-light transition-colors hover:text-dc-yellow">My Talks</RouterLink>
          <RouterLink to="/leaderboard" class="px-4 py-2 text-dc-gray-light transition-colors hover:text-dc-yellow">Leaderboard</RouterLink>
        </nav>
      </div>
    </header>

    <main class="flex-1 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>

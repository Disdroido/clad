<script setup lang="ts">
const route = useRoute()

const HIDDEN_NAV_ROUTES = new Set(['/', '/login', '/signup'])

const showNav = computed(() => !HIDDEN_NAV_ROUTES.has(route.path))

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

const navItems = [
  { label: 'Wardrobe', to: '/wardrobe', icon: '👔' },
  { label: 'Outfits', to: '/outfits', icon: '✨' },
  { label: 'Settings', to: '/settings', icon: '⚙️' },
] as const
</script>

<template>
  <div class="min-h-screen bg-brand-50">
    <!-- Desktop sidebar -->
    <aside
      v-if="showNav"
      class="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-brand-200 bg-white md:flex md:flex-col"
    >
      <div class="flex h-14 items-center border-b border-brand-100 px-6">
        <NuxtLink to="/wardrobe" class="text-lg font-bold text-brand-700">Clad</NuxtLink>
      </div>
      <nav class="flex-1 space-y-1 p-3">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition"
          :class="isActive(item.to)
            ? 'bg-brand-100 text-brand-700'
            : 'text-brand-500 hover:bg-brand-50 hover:text-brand-700'"
        >
          <span class="text-lg leading-none" aria-hidden="true">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
      </nav>
    </aside>

    <main
      class="mx-auto max-w-6xl px-4 py-6 md:px-8"
      :class="[
        showNav ? 'pb-24 md:pb-6' : '',
        showNav ? 'md:ml-56' : '',
      ]"
    >
      <slot />
    </main>
    <BottomNav v-if="showNav" />
  </div>
</template>

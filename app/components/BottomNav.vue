<script setup lang="ts">
const route = useRoute()

const navItems = [
  { label: 'Wardrobe', to: '/wardrobe', icon: '👔' },
  { label: 'Outfits', to: '/outfits', icon: '✨' },
  { label: 'What I Wore', to: '/outfits/wear-history', icon: '📅' },
  { label: 'Settings', to: '/settings', icon: '⚙️' },
] as const

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-50 border-t border-brand-200 bg-white/95 backdrop-blur-md md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom, 0px)"
  >
    <div class="mx-auto flex max-w-lg items-stretch justify-around">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-1 flex-col items-center gap-1 px-2 py-3 text-xs transition-colors"
        :class="isActive(item.to)
          ? 'text-brand-700 font-medium'
          : 'text-brand-400 hover:text-brand-600'"
      >
        <span class="text-xl leading-none" aria-hidden="true">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

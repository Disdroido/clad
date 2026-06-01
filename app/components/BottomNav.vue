<script setup lang="ts">
const route = useRoute()
const showMore = ref(false)

const primaryItems = [
  { label: 'Wardrobe', to: '/wardrobe', icon: '👔' },
  { label: 'Outfits', to: '/outfits', icon: '✨' },
  { label: 'Calendar', to: '/calendar', icon: '📅' },
  { label: 'Trips', to: '/trips', icon: '✈️' },
  { label: 'Discover', to: '/discover', icon: '🌍' },
] as const

const secondaryItems = [
  { label: 'Inspiration', to: '/inspiration', icon: '💡' },
  { label: 'What I Wore', to: '/outfits/wear-history', icon: '📅' },
  { label: 'Insights', to: '/insights', icon: '📊' },
  { label: 'Settings', to: '/settings', icon: '⚙️' },
] as const

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function isSecondaryActive() {
  return secondaryItems.some(item => isActive(item.to))
}

watch(() => route.path, () => {
  showMore.value = false
})
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-50 border-t border-brand-200 bg-white/95 backdrop-blur-md md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom, 0px)"
  >
    <div class="mx-auto flex max-w-lg items-stretch justify-around">
      <NuxtLink
        v-for="item in primaryItems"
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
      <button
        @click="showMore = !showMore"
        class="flex flex-1 flex-col items-center gap-1 px-2 py-3 text-xs transition-colors"
        :class="isSecondaryActive()
          ? 'text-brand-700 font-medium'
          : showMore
            ? 'text-brand-700 font-medium'
            : 'text-brand-400 hover:text-brand-600'"
      >
        <span class="text-xl leading-none" aria-hidden="true">⋯</span>
        <span>More</span>
      </button>
    </div>

    <Teleport to="body">
      <Transition name="slide-up">
        <div
          v-if="showMore"
          class="fixed inset-0 z-[60] flex flex-col justify-end"
        >
          <div class="absolute inset-0 bg-black/30" @click="showMore = false" />
          <div
            class="panel relative rounded-t-2xl bg-white shadow-xl p-4 max-h-[60vh] overflow-y-auto"
            :style="{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 1rem)` }"
          >
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-semibold text-brand-700">More</span>
              <button
                @click="showMore = false"
                class="rounded-full p-1 text-brand-400 hover:bg-brand-50 transition"
              >
                <span class="text-lg leading-none">✕</span>
              </button>
            </div>
            <div class="space-y-1">
              <NuxtLink
                v-for="item in secondaryItems"
                :key="item.to"
                :to="item.to"
                @click="showMore = false"
                class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition"
                :class="isActive(item.to)
                  ? 'bg-brand-100 text-brand-700'
                  : 'text-brand-500 hover:bg-brand-50 hover:text-brand-700'"
              >
                <span class="text-lg" aria-hidden="true">{{ item.icon }}</span>
                {{ item.label }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </nav>
</template>

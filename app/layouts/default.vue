<script setup lang="ts">
const route = useRoute()

const HIDDEN_NAV_ROUTES = new Set(['/', '/login', '/signup'])

const showBottomNav = computed(() => !HIDDEN_NAV_ROUTES.has(route.path))
</script>

<template>
  <div class="min-h-screen bg-brand-50">
    <main
      class="mx-auto max-w-5xl px-4 py-6"
      :class="showBottomNav ? 'pb-24 md:pb-6' : ''"
    >
      <slot />
    </main>
    <BottomNav v-if="showBottomNav" />
  </div>
</template>

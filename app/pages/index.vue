<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Clad — Your AI Wardrobe Assistant'
})
</script>

<template>
  <div class="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-6 text-center">
    <h1 class="text-4xl font-bold text-brand-950 md:text-6xl">
      Clad
    </h1>
    <p class="max-w-lg text-lg text-brand-700">
      Snap photos of your clothes. Let AI organize them.
      Get outfit suggestions tailored to your style.
    </p>
    <div class="flex gap-4">
      <NuxtLink
        to="/signup"
        class="rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700 transition"
      >
        Get Started
      </NuxtLink>
      <NuxtLink
        to="/login"
        class="rounded-lg border border-brand-300 px-6 py-3 text-brand-700 hover:bg-brand-100 transition"
      >
        Sign In
      </NuxtLink>
    </div>
  </div>
</template>

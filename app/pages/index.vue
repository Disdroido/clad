<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Clad — Your AI Wardrobe Assistant'
})
</script>

<template>
  <div class="flex flex-col gap-24 pb-24">
    <section class="flex flex-col items-center gap-6 pt-16 text-center">
      <div class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-100/50 px-4 py-1.5 text-sm text-brand-600">
        <span class="text-base">✨</span>
        AI-Powered Wardrobe
      </div>
      <h1 class="max-w-3xl text-4xl font-bold text-brand-950 md:text-6xl leading-tight">
        Stop staring at a full closet<br>
        <span class="text-brand-500">with nothing to wear</span>
      </h1>
      <p class="max-w-lg text-lg text-brand-600">
        Snap your clothes, let AI organize them, and get outfit suggestions
        tailored to your style and the weather.
      </p>
      <div class="flex gap-4">
        <NuxtLink
          to="/signup"
          class="rounded-xl bg-brand-600 px-8 py-3.5 font-medium text-white shadow-lg shadow-brand-200 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-300 hover:-translate-y-0.5 transition-all"
        >
          Get Started Free
        </NuxtLink>
        <NuxtLink
          to="/login"
          class="rounded-xl border border-brand-200 bg-white px-8 py-3.5 font-medium text-brand-700 shadow-sm hover:bg-brand-50 hover:border-brand-300 transition-all"
        >
          Sign In
        </NuxtLink>
      </div>
      <p class="text-sm text-brand-400">
        No credit card required ✦ Free forever
      </p>
    </section>

    <section class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div class="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-xl">
          📸
        </div>
        <h3 class="mb-2 font-semibold text-brand-900">Snap & Go</h3>
        <p class="text-sm leading-relaxed text-brand-600">
          Take photos of your clothes. AI auto-tags everything — color, category, season. No manual work.
        </p>
      </div>
      <div class="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-xl">
          🤖
        </div>
        <h3 class="mb-2 font-semibold text-brand-900">Smart Suggestions</h3>
        <p class="text-sm leading-relaxed text-brand-600">
          Get outfit recommendations based on your style, the weather, and what actually matches.
        </p>
      </div>
      <div class="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-xl">
          👔
        </div>
        <h3 class="mb-2 font-semibold text-brand-900">Virtual Closet</h3>
        <p class="text-sm leading-relaxed text-brand-600">
          Everything organized, searchable, and ready to mix & match. Build outfits in seconds.
        </p>
      </div>
    </section>

    <section class="text-center">
      <div class="inline-flex items-center gap-2 rounded-2xl border border-brand-100 bg-white px-8 py-4 shadow-sm">
        <span class="text-lg">🔥</span>
        <p class="text-sm text-brand-600">
          <strong class="text-brand-800">1,200+</strong> people stopped wearing the same 3 outfits on repeat
        </p>
      </div>
    </section>
  </div>
</template>

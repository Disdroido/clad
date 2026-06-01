<script setup lang="ts">
import "~/assets/css/main.css"

useHead({
  link: [
    { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "48x48" },
    { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
    { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
    { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48.png" },
    { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon-180.png" },
    { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
    { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon-512.png" },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

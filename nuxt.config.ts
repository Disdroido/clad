// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: true },

  devServer: {
    host: '0.0.0.0',
  },

  modules: [],

  // CSS is imported in app.vue and processed by @tailwindcss/vite plugin

  vite: {
    server: {
      allowedHosts: 'all',
    },
    css: {
      preprocessorOptions: {},
    },
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ],
      // Better Auth ships dual CJS/ESM with createRequire calls that break
      // when Vite tries to pre-bundle. Excluding fixes ESM/CJS interop.
      exclude: ['better-auth', 'better-auth/vue'],
    },
  },

  nitro: {
    // ES module worker format — required for nodejs_compat (node:buffer, etc.).
    // The legacy `cloudflare` preset uses service-worker syntax and fails
    // validation with Better Auth / Drizzle deps.
    preset: 'cloudflare-module',
    compatibilityDate: '2025-09-01',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  runtimeConfig: {
    // Server-only (never exposed to client)
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    neonDatabaseUrl: process.env.NEON_DATABASE_URL,
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2ApiToken: process.env.R2_API_TOKEN,
    r2BucketName: process.env.R2_BUCKET_NAME,
    r2PublicUrl: process.env.R2_PUBLIC_URL,
    authSecret: process.env.AUTH_SECRET,
    weatherApiKey: process.env.WEATHER_API_KEY,
    // Public (exposed to client)
    public: {
      appUrl: process.env.PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },
})

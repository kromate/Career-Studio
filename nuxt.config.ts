import { fileURLToPath, URL } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: false },
  experimental: {
    appManifest: false,
  },
  ssr: true,
  css: ['@/assets/css/main.css'],
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
  dir: {
    assets: 'src/assets',
    layouts: 'src/layouts',
    middleware: 'src/middleware',
    pages: 'src/pages',
    plugins: 'src/plugins',
  },
  imports: {
    dirs: ['src/composables'],
  },
  components: [
    {
      path: '~/src/components',
      pathPrefix: false,
    },
  ],
  devServer: {
    port: 3030,
  },
  app: {
    head: {
      title: 'Career Studio by Goalmatic - Build a stronger job search',
      meta: [
        {
          name: 'description',
          content: 'Get a stable resume score, understand every finding, and build a stronger job-specific resume.',
        },
        { name: 'theme-color', content: '#601ded' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || '',
      goalmaticOtpUrl: process.env.NUXT_PUBLIC_GOALMATIC_OTP_URL || '',
      goalmaticAppUrl: process.env.NUXT_PUBLIC_GOALMATIC_APP_URL || 'https://goalmatic.io',
      appMode: process.env.NUXT_PUBLIC_APP_MODE || 'local',
    },
  },
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['pdfjs-dist'],
    },
  },
  nitro: {
    compressPublicAssets: true,
  },
})

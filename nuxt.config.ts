import { fileURLToPath, URL } from 'node:url'

const firebaseAuthPopupHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
}

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: false },
  experimental: {
    appManifest: false,
  },
  ssr: true,
  routeRules: {
    '/open-source': { redirect: 'https://github.com/kromate/Career-Studio' },
    '/login': { ssr: false, headers: firebaseAuthPopupHeaders },
    '/signup': { ssr: false, headers: firebaseAuthPopupHeaders },
    '/app': { ssr: false },
    '/app/**': { ssr: false },
  },
  css: ['@/assets/css/main.css', '@/assets/css/auth-pages.css'],
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
      title: 'Career Studio by Goalmatic - Move your career forward',
      meta: [
        {
          name: 'description',
          content: 'Open-source career tools for resume improvement, interview practice, mentorship, company and pay insights, job search, and career exploration.',
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
      firebaseApiKey: process.env.VITE_FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.VITE_FIREBASE_APP_ID || '',
      goalmaticAppUrl: process.env.VITE_GOALMATIC_APP_URL || 'https://goalmatic.io',
      appMode: process.env.VITE_APP_MODE || 'local',
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

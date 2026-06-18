import { fileURLToPath, URL } from 'node:url'

const firebaseAuthPopupHeaders = {
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
  'Cross-Origin-Opener-Policy': 'unsafe-none',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

const siteUrl = 'https://careerstudio.goalmatic.io'
const siteName = 'Career Studio by Goalmatic'
const siteTitle = 'Career Studio — Your complete career workspace'
const siteDescription = 'Find jobs, tailor resumes, draft cover letters, prepare for interviews, and track applications in one career workspace.'
const ogImageUrl = `${siteUrl}/og-image.png`
const ogImageAlt = 'Career Studio preview showing a connected workspace for jobs, resumes, cover letters, interviews, and applications.'
const themeBootstrapScript = `(() => {
  try {
    const storedPreference = window.localStorage.getItem('career-studio:theme:v1')
    const preference = ['light', 'dark', 'system'].includes(storedPreference || '') ? storedPreference : 'system'
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const theme = preference === 'system' ? systemTheme : preference
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.colorScheme = theme

    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (themeColor) themeColor.setAttribute('content', theme === 'dark' ? '#171521' : '#601ded')
  } catch {}
})()`

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
      htmlAttrs: {
        lang: 'en',
      },
      title: siteTitle,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: siteDescription,
        },
        { name: 'robots', content: 'index, follow' },
        { name: 'application-name', content: siteName },
        { name: 'theme-color', content: '#601ded' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: siteName },
        { property: 'og:url', content: siteUrl },
        { property: 'og:title', content: siteTitle },
        { property: 'og:description', content: siteDescription },
        { property: 'og:image', content: ogImageUrl },
        { property: 'og:image:secure_url', content: ogImageUrl },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: ogImageAlt },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: siteTitle },
        { name: 'twitter:description', content: siteDescription },
        { name: 'twitter:image', content: ogImageUrl },
        { name: 'twitter:image:alt', content: ogImageAlt },
      ],
      script: [
        {
          key: 'theme-bootstrap',
          tagPosition: 'head',
          tagPriority: 'critical',
          innerHTML: themeBootstrapScript,
        },
      ],
      link: [
        { rel: 'canonical', href: siteUrl },
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

import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    status: 'ok',
    service: 'career-studio',
    version: process.env.npm_package_version || '0.1.0',
    checkedAt: new Date().toISOString(),
    mode: config.public.appMode,
    checks: {
      tabstackConfigured: Boolean(config.tabstackApiKey),
      geminiImportAssistConfigured: Boolean(config.geminiApiKey),
      firebasePublicConfigPresent: Boolean(config.public.firebaseApiKey && config.public.firebaseProjectId),
    },
  }
})
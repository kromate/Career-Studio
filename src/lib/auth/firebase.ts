import type { UserProfile } from '@/types'

interface FirebasePublicConfig {
  firebaseApiKey: string
  firebaseAuthDomain: string
  firebaseProjectId: string
  firebaseStorageBucket: string
  firebaseMessagingSenderId: string
  firebaseAppId: string
  googleClientId?: string
}

interface GoogleTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void
}

interface GoogleIdentityApi {
  accounts: {
    oauth2: {
      initTokenClient: (options: {
        client_id: string
        scope: string
        callback: (response: GoogleTokenResponse) => void
        error_callback: (error: { message?: string; type?: string }) => void
      }) => GoogleTokenClient
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityApi
  }
}

let googleIdentityScript: Promise<void> | undefined

export function hasFirebaseConfig(config: FirebasePublicConfig): boolean {
  return Boolean(
    config.firebaseApiKey
    && config.firebaseAuthDomain
    && config.firebaseProjectId
    && config.firebaseAppId,
  )
}

export function hasGoogleSignInConfig(config: FirebasePublicConfig): boolean {
  return hasFirebaseConfig(config) && Boolean(config.googleClientId)
}

function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts.oauth2) return Promise.resolve()
  if (googleIdentityScript) return googleIdentityScript

  googleIdentityScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    )
    const script = existing || document.createElement('script')
    const handleLoad = () => resolve()
    const handleError = () => reject(new Error('Google sign-in could not be loaded.'))

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
    if (!existing) {
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })

  return googleIdentityScript
}

async function requestGoogleAccessToken(clientId: string): Promise<string> {
  await loadGoogleIdentityServices()
  if (!window.google?.accounts.oauth2) {
    throw new Error('Google sign-in is unavailable in this browser.')
  }

  return await new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error('Google sign-in timed out. Please try again.')),
      120_000,
    )
    const resolveToken = (accessToken: string) => {
      window.clearTimeout(timeout)
      resolve(accessToken)
    }
    const rejectToken = (error: Error) => {
      window.clearTimeout(timeout)
      reject(error)
    }
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          rejectToken(new Error(response.error_description || response.error || 'Google sign-in was not completed.'))
          return
        }
        resolveToken(response.access_token)
      },
      error_callback: error => rejectToken(new Error(
        error.message || error.type || 'Google sign-in was interrupted.',
      )),
    })
    client.requestAccessToken({ prompt: 'select_account' })
  })
}

export async function signInWithGoalmaticGoogle(
  config: FirebasePublicConfig,
): Promise<UserProfile> {
  if (!hasFirebaseConfig(config)) {
    throw new Error('Firebase is not configured for this environment.')
  }

  const [{ initializeApp, getApp, getApps }, authModule] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ])
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: config.firebaseApiKey,
        authDomain: config.firebaseAuthDomain,
        projectId: config.firebaseProjectId,
        storageBucket: config.firebaseStorageBucket,
        messagingSenderId: config.firebaseMessagingSenderId,
        appId: config.firebaseAppId,
      })
  const auth = authModule.getAuth(app)
  await authModule.setPersistence(auth, authModule.browserLocalPersistence)
  if (!config.googleClientId) {
    throw new Error('Google Identity Services is not configured for this environment.')
  }

  const accessToken = await requestGoogleAccessToken(config.googleClientId)
  const googleCredential = authModule.GoogleAuthProvider.credential(null, accessToken)
  const credential = await authModule.signInWithCredential(auth, googleCredential)
  const user = credential.user

  return {
    id: user.uid,
    accountId: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Goalmatic user',
    email: user.email || '',
    avatarUrl: user.photoURL || undefined,
    authProvider: 'google',
  }
}

export async function signOutFirebase(): Promise<void> {
  const [{ getApps }, authModule] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ])
  if (!getApps().length) return
  await authModule.signOut(authModule.getAuth(getApps()[0]))
}

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

interface EmailOtpResponse {
  code: number
  message?: string
  msg?: string
  customToken?: string
  accountId?: string
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

async function getFirebaseClient(config: FirebasePublicConfig) {
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

  return { app, auth, authModule }
}

async function callGoalmaticAuthFunction(
  config: FirebasePublicConfig,
  functionName: string,
  payload: Record<string, string>,
): Promise<EmailOtpResponse> {
  const { app } = await getFirebaseClient(config)
  const functionsModule = await import('firebase/functions')
  const functions = functionsModule.getFunctions(app, 'us-central1')
  const callable = functionsModule.httpsCallable<Record<string, string>, EmailOtpResponse>(
    functions,
    functionName,
  )
  const response = await callable(payload)
  return response.data
}

function emailOtpError(response: EmailOtpResponse, fallback: string): Error {
  return new Error(response.message || response.msg || fallback)
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
  const { auth, authModule } = await getFirebaseClient(config)
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

export async function sendGoalmaticEmailOtp(
  config: FirebasePublicConfig,
  email: string,
): Promise<string> {
  const response = await callGoalmaticAuthFunction(
    config,
    'sendEmailOTPForLogin',
    { email: email.trim().toLowerCase() },
  )
  if (response.code !== 200) {
    throw emailOtpError(response, 'The sign-in code could not be sent.')
  }
  return response.message || 'A six-digit sign-in code was sent to your email.'
}

export async function verifyGoalmaticEmailOtp(
  config: FirebasePublicConfig,
  email: string,
  otp: string,
): Promise<UserProfile> {
  const normalizedEmail = email.trim().toLowerCase()
  const response = await callGoalmaticAuthFunction(
    config,
    'verifyEmailOTPAndLogin',
    { email: normalizedEmail, otp },
  )
  if (response.code !== 200 || !response.customToken) {
    throw emailOtpError(response, 'The sign-in code is invalid or expired.')
  }

  const { auth, authModule } = await getFirebaseClient(config)
  const credential = await authModule.signInWithCustomToken(auth, response.customToken)
  const user = credential.user

  return {
    id: user.uid,
    accountId: user.uid,
    name: user.displayName || normalizedEmail.split('@')[0]?.replace(/[._-]/g, ' ') || 'Goalmatic user',
    email: user.email || normalizedEmail,
    avatarUrl: user.photoURL || undefined,
    authProvider: 'email',
  }
}

export async function sendGoalmaticSignupOtp(
  config: FirebasePublicConfig,
  email: string,
): Promise<string> {
  const response = await callGoalmaticAuthFunction(
    config,
    'sendEmailOTPForSignup',
    { email: email.trim().toLowerCase() },
  )
  if (response.code !== 200) {
    throw emailOtpError(response, 'The verification code could not be sent.')
  }
  return response.message || 'A six-digit verification code was sent to your email.'
}

export async function verifyGoalmaticSignupOtp(
  config: FirebasePublicConfig,
  details: {
    email: string
    otp: string
    fullName: string
    referralCode?: string
  },
): Promise<UserProfile> {
  const normalizedEmail = details.email.trim().toLowerCase()
  const payload: Record<string, string> = {
    email: normalizedEmail,
    otp: details.otp,
    fullName: details.fullName.trim(),
  }
  if (details.referralCode) payload.referralCode = details.referralCode.toUpperCase()

  const response = await callGoalmaticAuthFunction(
    config,
    'verifyEmailOTPAndCreateAccount',
    payload,
  )
  if (response.code !== 200 || !response.customToken) {
    throw emailOtpError(response, 'The verification code is invalid or expired.')
  }

  const { auth, authModule } = await getFirebaseClient(config)
  const credential = await authModule.signInWithCustomToken(auth, response.customToken)
  const user = credential.user

  return {
    id: user.uid,
    accountId: response.accountId || user.uid,
    name: user.displayName || details.fullName.trim(),
    email: user.email || normalizedEmail,
    avatarUrl: user.photoURL || undefined,
    authProvider: 'email',
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

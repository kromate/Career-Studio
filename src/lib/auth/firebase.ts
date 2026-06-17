import type { UserProfile } from '@/types'

interface FirebasePublicConfig {
  firebaseApiKey: string
  firebaseAuthDomain: string
  firebaseProjectId: string
  firebaseStorageBucket: string
  firebaseMessagingSenderId: string
  firebaseAppId: string
}

interface EmailOtpResponse {
  code: number
  message?: string
  msg?: string
  customToken?: string
  accountId?: string
}

interface FirebaseUserLike {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

function formatAuthFunctionError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error('Authentication is temporarily unavailable. Please try again shortly.')
  }

  const firebaseError = error as Error & { code?: string; details?: unknown }
  const code = firebaseError.code?.toLowerCase() || ''
  const message = firebaseError.message.trim()
  const isInfrastructureFailure = (
    code === 'functions/internal'
    || code === 'functions/unavailable'
    || code === 'internal'
    || code === 'unavailable'
    || message.toLowerCase() === 'internal'
  )

  if (isInfrastructureFailure) {
    return new Error('Goalmatic email sign-in is temporarily unavailable. Please try again in a moment or use Google.')
  }

  return error
}

export function hasFirebaseConfig(config: FirebasePublicConfig): boolean {
  return Boolean(
    config.firebaseApiKey
    && config.firebaseAuthDomain
    && config.firebaseProjectId
    && config.firebaseAppId,
  )
}

export function hasGoogleSignInConfig(config: FirebasePublicConfig): boolean {
  return hasFirebaseConfig(config)
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
  try {
    const response = await callable(payload)
    return response.data
  } catch (error) {
    throw formatAuthFunctionError(error)
  }
}

function emailOtpError(response: EmailOtpResponse, fallback: string): Error {
  return new Error(response.message || response.msg || fallback)
}

function googleUserProfile(user: FirebaseUserLike): UserProfile {
  return {
    id: user.uid,
    accountId: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Goalmatic user',
    email: user.email || '',
    avatarUrl: user.photoURL || undefined,
    authProvider: 'google',
  }
}

export async function signInWithGoalmaticGoogle(
  config: FirebasePublicConfig,
): Promise<UserProfile> {
  const { auth, authModule } = await getFirebaseClient(config)
  const provider = new authModule.GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const credential = await authModule.signInWithPopup(auth, provider)
  return googleUserProfile(credential.user)
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

import type { UserProfile } from '@/types'

interface FirebasePublicConfig {
  firebaseApiKey: string
  firebaseAuthDomain: string
  firebaseProjectId: string
  firebaseStorageBucket: string
  firebaseMessagingSenderId: string
  firebaseAppId: string
}

export function hasFirebaseConfig(config: FirebasePublicConfig): boolean {
  return Boolean(
    config.firebaseApiKey
    && config.firebaseAuthDomain
    && config.firebaseProjectId
    && config.firebaseAppId,
  )
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
  const provider = new authModule.GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const credential = await authModule.signInWithPopup(auth, provider)
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

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported, logEvent, setUserId, setUserProperties, type Analytics } from 'firebase/analytics'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

const firebaseRegion = 'us-central1'

export const firebaseDatabaseName = (import.meta.env.VITE_FIREBASE_DATABASE_ID as string | undefined) || 'career-studio'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: firebaseAuthDomain(
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
        import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    ),
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
}

function firebaseAuthDomain(authDomain: string, projectId: string): string {
    if (projectId === 'goalmatics' && authDomain === 'www.goalmatic.io') {
        return 'goalmatics.firebaseapp.com'
    }

    return authDomain
}

export function hasFirebaseWebConfig(): boolean {
    return Boolean(
        firebaseConfig.apiKey
        && firebaseConfig.authDomain
        && firebaseConfig.projectId
        && firebaseConfig.appId,
    )
}

export const useFirebase = (): FirebaseApp => {
    if (getApps().length === 0) {
        return initializeApp(firebaseConfig)
    }

    return getApp()
}

const firestoreByDatabase = new Map<string, Firestore>()

export const useFirestore = (databaseName = firebaseDatabaseName): Firestore => {
    const cached = firestoreByDatabase.get(databaseName)
    if (cached) return cached

    const firestore = getFirestore(useFirebase(), databaseName)
    firestoreByDatabase.set(databaseName, firestore)
    return firestore
}

export const auth = getAuth(useFirebase())
try {
    auth.useDeviceLanguage()
} catch { }
try {
    if (typeof navigator !== 'undefined' && navigator.language) auth.languageCode = navigator.language
} catch { }

export const db: Firestore = useFirestore(firebaseDatabaseName)
export const storage = getStorage(useFirebase())
export const functions = getFunctions(useFirebase(), firebaseRegion)

const shouldUseEmulators = import.meta.env.DEV && import.meta.env.VITE_FIREBASE_USE_EMULATORS === 'true'

declare global {
    // eslint-disable-next-line no-var
    var __careerStudioFirebaseEmulatorsConnected: boolean | undefined
}

if (shouldUseEmulators && !globalThis.__careerStudioFirebaseEmulatorsConnected) {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, 'localhost', 8181)
    connectFunctionsEmulator(functions, 'localhost', 5001)
    connectStorageEmulator(storage, 'localhost', 9199)
    globalThis.__careerStudioFirebaseEmulatorsConnected = true
}

let analytics: Analytics | null = null
const isLocalhost = typeof window !== 'undefined'
    && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

if (typeof window !== 'undefined' && !isLocalhost && firebaseConfig.measurementId) {
    isSupported()
        .then((supported) => {
            if (supported) analytics = getAnalytics(useFirebase())
        })
        .catch(() => { })
}

export { analytics }

export const logFirebaseEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
    if (analytics) logEvent(analytics, eventName, eventParams)
}

export const setFirebaseUserId = (userId: string | null) => {
    if (analytics) setUserId(analytics, userId)
}

export const setFirebaseUserProperties = (properties: Record<string, string>) => {
    if (analytics) setUserProperties(analytics, properties)
}
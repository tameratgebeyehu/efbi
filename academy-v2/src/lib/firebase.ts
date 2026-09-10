import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
}

const requiredValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
]

export const firebaseConfigured = requiredValues.every(Boolean)

type FirebaseAuthModule = typeof import('firebase/auth')
type FirestoreModule = typeof import('firebase/firestore')

export type FirebaseServices = {
  app: FirebaseApp
  auth: Auth
  authSdk: FirebaseAuthModule
}

export type FirebaseFirestoreServices = FirebaseServices & {
  db: Firestore
  firestoreSdk: FirestoreModule
}

let servicesPromise: Promise<FirebaseServices | null> | null = null
let firestorePromise: Promise<FirebaseFirestoreServices | null> | null = null

async function configureAppCheck(app: FirebaseApp, useEmulators: boolean) {
  const siteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY?.trim()
  if (!siteKey || useEmulators || typeof window === 'undefined') return

  const globalState = globalThis as typeof globalThis & {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string
    __efbiAppCheckInitialized?: boolean
  }

  if (globalState.__efbiAppCheckInitialized) return

  const debugToken = import.meta.env.DEV
    ? import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN?.trim()
    : ''

  if (debugToken) {
    globalState.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken === 'true' ? true : debugToken
  }

  const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import('firebase/app-check')
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  })
  globalState.__efbiAppCheckInitialized = true
}

export function getFirebaseServices() {
  if (!firebaseConfigured) return Promise.resolve(null)
  if (servicesPromise) return servicesPromise

  servicesPromise = (async () => {
    const appSdk = await import('firebase/app')
    const app = appSdk.getApps()[0] ?? appSdk.initializeApp(firebaseConfig)
    const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

    await configureAppCheck(app, useEmulators)

    const authSdk = await import('firebase/auth')
    const auth = authSdk.getAuth(app)
    const emulatorKey = '__efbiAuthEmulatorConnected'
    const globalState = globalThis as typeof globalThis & Record<string, boolean | undefined>

    if (useEmulators && !globalState[emulatorKey]) {
      authSdk.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
      globalState[emulatorKey] = true
    }

    return { app, auth, authSdk }
  })()

  return servicesPromise
}

export function getFirebaseFirestore() {
  if (!firebaseConfigured) return Promise.resolve(null)
  if (firestorePromise) return firestorePromise

  firestorePromise = (async () => {
    const services = await getFirebaseServices()
    if (!services) return null

    const firestoreSdk = await import('firebase/firestore')
    const db = firestoreSdk.getFirestore(services.app)
    const emulatorKey = '__efbiFirestoreEmulatorConnected'
    const globalState = globalThis as typeof globalThis & Record<string, boolean | undefined>

    if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && !globalState[emulatorKey]) {
      firestoreSdk.connectFirestoreEmulator(db, '127.0.0.1', 8080)
      globalState[emulatorKey] = true
    }

    return { ...services, db, firestoreSdk }
  })()

  return firestorePromise
}

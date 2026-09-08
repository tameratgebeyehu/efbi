import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'

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

let firebaseApp: FirebaseApp | null = null
let firebaseAuth: Auth | null = null
let firestore: Firestore | null = null

if (firebaseConfigured) {
  firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig)
  firebaseAuth = getAuth(firebaseApp)
  firestore = getFirestore(firebaseApp)

  const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
  const emulatorKey = '__efbiFirebaseEmulatorsConnected'
  const globalState = globalThis as typeof globalThis & Record<string, boolean | undefined>

  if (useEmulators && !globalState[emulatorKey]) {
    connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
    globalState[emulatorKey] = true
  }

  const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY?.trim()
  if (appCheckSiteKey && !useEmulators && typeof window !== 'undefined') {
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  }
}

export { firebaseApp, firebaseAuth, firestore }

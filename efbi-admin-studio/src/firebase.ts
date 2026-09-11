import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
}

export const firebaseConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean)

type AuthSdk = typeof import('firebase/auth')

export type AdminFirebase = {
  app: FirebaseApp
  auth: Auth
  authSdk: AuthSdk
}

let servicesPromise: Promise<AdminFirebase | null> | null = null

async function configureAppCheck(app: FirebaseApp) {
  const siteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY?.trim()
  if (!siteKey || typeof window === 'undefined') return

  const globalState = globalThis as typeof globalThis & {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string
    __efbiAdminAppCheckInitialized?: boolean
  }
  if (globalState.__efbiAdminAppCheckInitialized) return

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
  globalState.__efbiAdminAppCheckInitialized = true
}

export function getAdminFirebase() {
  if (!firebaseConfigured) return Promise.resolve(null)
  if (servicesPromise) return servicesPromise

  servicesPromise = (async () => {
    const appSdk = await import('firebase/app')
    const existing = appSdk.getApps().find((candidate) => candidate.name === 'efbi-admin-studio')
    const app = existing ?? appSdk.initializeApp(firebaseConfig, 'efbi-admin-studio')
    await configureAppCheck(app)

    const authSdk = await import('firebase/auth')
    const auth = authSdk.getAuth(app)
    await authSdk.setPersistence(auth, authSdk.browserSessionPersistence)
    return { app, auth, authSdk }
  })()

  return servicesPromise
}

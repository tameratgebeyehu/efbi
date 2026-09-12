import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const publicPreview = mode === 'public-preview'
  const previewDefinitions = publicPreview ? {
    'import.meta.env.VITE_SITE_MODE': JSON.stringify('public-preview'),
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(''),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(''),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(''),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(''),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(''),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(''),
    'import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY': JSON.stringify(''),
    'import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN': JSON.stringify(''),
    'import.meta.env.VITE_USE_FIREBASE_EMULATORS': JSON.stringify('false'),
  } : undefined

  return {
    cacheDir: '.vite-cache',
    plugins: [react()],
    envPrefix: publicPreview ? 'EFBI_PUBLIC_PREVIEW_' : 'VITE_',
    define: previewDefinitions,
    envDir: publicPreview ? 'preview-env' : undefined,
  }
})

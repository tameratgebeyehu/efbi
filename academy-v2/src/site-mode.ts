export type SiteMode = 'local-testing' | 'public-preview' | 'enrollment-open'

const supportedModes = new Set<SiteMode>(['local-testing', 'public-preview', 'enrollment-open'])

function resolveSiteMode(): SiteMode {
  const requested = import.meta.env.VITE_SITE_MODE?.trim() as SiteMode | undefined
  if (requested && supportedModes.has(requested)) return requested
  return import.meta.env.DEV ? 'local-testing' : 'public-preview'
}

export const siteMode = resolveSiteMode()
export const publicPreview = siteMode === 'public-preview'
export const accountAccessEnabled = siteMode !== 'public-preview'
export const learnerEnrollmentEnabled = siteMode === 'enrollment-open'
export const ownerSetupEnabled = siteMode === 'local-testing'

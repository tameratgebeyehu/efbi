export type RegistrationAgeBand = '' | 'under-12' | '12-15' | '16-plus'

export const selfRegistrationAgeBand = '16-plus' as const
export const privacyNoticeVersion = 'efbi-self-registration-privacy-v1'
export const learnerSafetyVersion = 'efbi-learner-safety-v1'

export type SelfRegistration = {
  displayName: string
  email: string
  password: string
  ageBand: typeof selfRegistrationAgeBand
  privacyAccepted: boolean
  learnerSafetyAccepted: boolean
}

export function validSelfRegistration(registration: SelfRegistration) {
  return registration.ageBand === selfRegistrationAgeBand
    && registration.privacyAccepted
    && registration.learnerSafetyAccepted
}

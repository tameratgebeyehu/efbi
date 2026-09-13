import { Link } from 'react-router-dom'
import { PageHero } from './components'
import { DeletionRequestPanel } from './deletion-request'
import { useAuth } from './auth-context'
import { Icon } from './icons'
import { accountAccessEnabled } from './site-mode'
import './privacy.css'

const privacyEmail = 'efbi.academy@gmail.com'

function emailRoute(subject: string, opening: string) {
  return `mailto:${privacyEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${opening}\n\nPlease send this message from the email used for your EFBI account. Do not include your password, government ID, health details, or another person's private information.`)}`
}

const supportRoutes = [
  {
    icon: 'book' as const,
    title: 'Get a copy',
    description: 'Ask what learner information EFBI has about your account.',
    label: 'Request my data',
    href: emailRoute('EFBI data access request', 'I would like a copy of the learner information connected to my EFBI account.'),
  },
  {
    icon: 'check' as const,
    title: 'Correct information',
    description: 'Tell EFBI if your account name or another saved detail is wrong.',
    label: 'Request a correction',
    href: emailRoute('EFBI information correction request', 'I would like EFBI to correct information connected to my learner account. The information that needs attention is:'),
  },
  {
    icon: 'x' as const,
    title: 'Withdraw and close',
    description: 'If you no longer want EFBI to use your learning data, request account deletion below.',
    label: 'Manage deletion',
    to: '#deletion',
  },
  {
    icon: 'shield' as const,
    title: 'Report a safety concern',
    description: 'Tell EFBI about unsafe content, contact, behavior, or accidental sharing of private information.',
    label: 'Email a safety concern',
    href: emailRoute('EFBI learner safety concern', 'I would like to report a learner-safety concern. A short, non-sensitive description is:'),
  },
]

export function PrivacyPage() {
  const { user, loading, profileLoading, profileReady } = useAuth()
  const accountReady = Boolean(user && profileReady)

  return <>
    <PageHero eyebrow="Privacy & support" title="Your information. Your choices." description="See what EFBI saves, why it is needed, and how to ask for help." className="page-hero--privacy" />

    <section className="section shell privacy-summary">
      <div>
        <p className="eyebrow-label">The short version</p>
        <h2>EFBI keeps learner data limited.</h2>
        <p>For a learner account, EFBI uses your name, sign-in email, course progress, work you choose to submit, review results, and certificate records. This helps the platform save learning, review projects, issue requested certificates, protect accounts, and answer support requests.</p>
        <p>EFBI does not ask for a birth date, phone number, home address, government ID, health details, or payment information during registration. EFBI does not sell learner information.</p>
      </div>
      <aside>
        <Icon name="shield" />
        <strong>Who can see it?</strong>
        <p>Your learning records are private to your account and authorized EFBI operators. A certificate shows only the public name, course, issue date, credential ID, and status that are needed for verification.</p>
      </aside>
    </section>

    <section className="section privacy-actions-section">
      <div className="shell">
        <div className="privacy-heading">
          <div><p className="eyebrow-label">Ask EFBI</p><h2>Choose the help you need.</h2></div>
          <p>Requests go to the official EFBI privacy address. You will never be asked for your password.</p>
        </div>
        <div className="privacy-action-grid">
          {supportRoutes.map((route) => <article key={route.title}>
            <span><Icon name={route.icon} /></span>
            <h3>{route.title}</h3>
            <p>{route.description}</p>
            {'href' in route
              ? <a href={route.href}>{route.label}<Icon name="arrow" /></a>
              : <a href={route.to}>{route.label}<Icon name="arrow" /></a>}
          </article>)}
        </div>
      </div>
    </section>

    <section className="section shell privacy-details">
      <article><p className="eyebrow-label">Registration record</p><h2>Clear, versioned acknowledgements.</h2><p>Self-registering learners confirm a privacy summary and a learner-safety statement separately. The profile records the versions accepted so EFBI can identify exactly what was shown.</p><dl><div><dt>Privacy summary</dt><dd>Version 1</dd></div><div><dt>Safety statement</dt><dd>Version 1</dd></div></dl></article>
      <article><p className="eyebrow-label">Age boundary</p><h2>Different paths protect younger learners.</h2><p>Children under 12 cannot create accounts. Ages 12–15 remain closed until the guardian-supported authorization and safeguarding route is reviewed. Learners aged 16 or older may self-register only when enrollment is open.</p><Link to="/join">See registration paths</Link></article>
    </section>

    <section className="section shell privacy-account" id="deletion">
      <div className="privacy-account__heading">
        <p className="eyebrow-label">Your account</p>
        <h2>Manage deletion safely.</h2>
      {!loading && !user && <p>{accountAccessEnabled ? 'Sign in to view or start the protected deletion process for your learner account.' : 'Account controls are closed while EFBI is in read-only preview.'}</p>}
      </div>
      {(loading || profileLoading) && <div className="privacy-account-state" role="status">Checking your account…</div>}
      {!loading && !profileLoading && !user && accountAccessEnabled && <Link className="button button--primary" to="/signin?returnTo=%2Fprivacy%23deletion">Sign in to continue</Link>}
      {!loading && !profileLoading && user && !accountReady && <div className="privacy-account-state privacy-account-state--warning"><Icon name="shield" /><p>This sign-in has no approved learner profile. Email <a href={emailRoute('EFBI account help', 'I signed in but my learner profile is not available.')}>{privacyEmail}</a> for help.</p></div>}
      {accountReady && user && <DeletionRequestPanel uid={user.uid} />}
    </section>

    <section className="section shell privacy-safety-note">
      <Icon name="shield" />
      <div><strong>Need urgent help?</strong><p>EFBI email is not an emergency service. If someone is in immediate danger, contact a trusted adult or the appropriate local emergency service. Do not send passwords or identity documents to EFBI.</p></div>
    </section>
  </>
}

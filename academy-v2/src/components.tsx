import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Program } from './data'
import { Icon } from './icons'

export function SectionHeading({ eyebrow, title, description, light = false }: { eyebrow: string; title: string; description?: string; light?: boolean }) {
  return (
    <div className={light ? 'section-heading section-heading--light' : 'section-heading'}>
      <p className="eyebrow-label">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  )
}

function ProgramIcon({ slug }: { slug: string }) {
  const icons: Record<string, ReactNode> = {
    'artificial-intelligence': <Icon name="brain" />,
    'ai-assisted-app-development': <Icon name="spark" />,
    'web-development': <Icon name="code" />,
    'programming-foundations': <Icon name="book" />,
    'entrepreneurship': <Icon name="spark" />,
    'leadership-development': <Icon name="compass" />,
    'career-readiness': <Icon name="users" />,
  }

  if (slug === 'mobile-app-development') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
        <path d="M10 5h4M11 18.5h2" />
      </svg>
    )
  }

  return icons[slug] ?? <Icon name="book" />
}

export function ProgramCard({ program, featured = false }: { program: Program; featured?: boolean }) {
  return (
    <article className={featured ? `program-card program-card--featured accent-${program.accent}` : `program-card accent-${program.accent}`}>
      <div className="program-card-top">
        <span className="program-icon" aria-hidden="true"><ProgramIcon slug={program.slug} /></span>
        <span className="program-level">{program.level}</span>
      </div>
      <div>
        <h3>{program.title}</h3>
        <p>{program.description}</p>
      </div>
      <div className="program-card-footer">
        <span>{program.duration}</span>
        <Link to={`/programs/${program.slug}`} aria-label={`Explore ${program.title}`}>Explore <Icon name="arrow" /></Link>
      </div>
    </article>
  )
}

export function PageHero({ eyebrow, title, description, children, className = '' }: { eyebrow: string; title: string; description: string; children?: ReactNode; className?: string }) {
  return (
    <section className={`page-hero ${className}`.trim()}>
      <div className="shell page-hero-inner">
        <div>
          <p className="eyebrow-label">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children && <div className="page-hero-aside">{children}</div>}
      </div>
    </section>
  )
}

export function RebuildNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'rebuild-notice rebuild-notice--compact' : 'rebuild-notice'} role="status">
      <span className="pulse" aria-hidden="true" />
      <div>
        <strong>Read-only academy preview</strong>
        <p>Explore the courses while student enrollment remains closed.</p>
      </div>
    </div>
  )
}

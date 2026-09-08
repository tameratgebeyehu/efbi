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

export function ProgramCard({ program, featured = false }: { program: Program; featured?: boolean }) {
  return (
    <article className={featured ? `program-card program-card--featured accent-${program.accent}` : `program-card accent-${program.accent}`}>
      <div className="program-card-top">
        <span className="program-monogram" aria-hidden="true">{program.shortTitle}</span>
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

export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return (
    <section className="page-hero">
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
      <div><strong>Secure rebuild in progress</strong><p>Student accounts and live submissions stay paused until the new system passes testing.</p></div>
    </div>
  )
}

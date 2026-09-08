import { useState } from 'react'
import './App.css'

const curriculum = [
  {
    number: '01',
    title: 'Understanding artificial intelligence',
    detail: 'Learn what AI is, where it appears in daily life, and how to evaluate its limits.',
  },
  {
    number: '02',
    title: 'Prompting with purpose',
    detail: 'Practice asking clear questions, checking results, and improving weak answers.',
  },
  {
    number: '03',
    title: 'Responsible use',
    detail: 'Explore privacy, misinformation, bias, and when human judgment must lead.',
  },
  {
    number: '04',
    title: 'Build an Ethiopian solution',
    detail: 'Turn a local challenge into a small, documented project you can share.',
  },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [curriculumOpen, setCurriculumOpen] = useState(false)

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="national-accent" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="EFBI Academy home">
          <img src="/efbi-icon.png" width="42" height="42" alt="" />
          <span>
            <strong>EFBI</strong>
            <small>Academy</small>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="menu-toggle-lines" aria-hidden="true" />
          <span className="sr-only">Toggle navigation</span>
        </button>

        <nav
          id="primary-navigation"
          className={menuOpen ? 'primary-navigation is-open' : 'primary-navigation'}
          aria-label="Primary navigation"
        >
          <a href="#courses" onClick={() => setMenuOpen(false)}>Courses</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#standards" onClick={() => setMenuOpen(false)}>Our standards</a>
        </nav>

        <div className="header-actions">
          <span className="status-chip"><i aria-hidden="true" /> Rebuilding securely</span>
          <button className="access-button" type="button" disabled>Student access paused</button>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <div className="eyebrow">
              <span>Free learning</span>
              <span>Ethiopian students</span>
              <span>Practical projects</span>
            </div>

            <p className="rebuild-note">
              <span aria-hidden="true">●</span>
              EFBI Academy v2 is under construction
            </p>

            <h1>Build digital skills.<br /><em>Shape what comes next.</em></h1>
            <p className="hero-intro">
              Short, practical courses that help Ethiopian students understand new technology,
              create meaningful work, and show what they can do.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#courses">
                Explore the pilot course
                <span aria-hidden="true">↘</span>
              </a>
              <a className="text-link" href="#how-it-works">See how learning works</a>
            </div>

            <dl className="promise-list" aria-label="EFBI Academy commitments">
              <div>
                <dt>100%</dt>
                <dd>Free to learn</dd>
              </div>
              <div>
                <dt>4</dt>
                <dd>Focused lessons</dd>
              </div>
              <div>
                <dt>1</dt>
                <dd>Portfolio project</dd>
              </div>
            </dl>
          </div>

          <aside className="course-spotlight" aria-labelledby="spotlight-title">
            <div className="card-topline">
              <span className="course-number">COURSE 01</span>
              <span className="pilot-label">Pilot curriculum</span>
            </div>
            <div className="course-symbol" aria-hidden="true">
              <span>AI</span>
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
            </div>
            <p className="course-kicker">Technology · Beginner</p>
            <h2 id="spotlight-title">AI Foundations for Ethiopia</h2>
            <p className="course-summary">
              Understand AI, use it responsibly, and design a small solution for a challenge
              in your school or community.
            </p>
            <ul className="course-meta" aria-label="Course details">
              <li><strong>4</strong> lessons</li>
              <li><strong>Self-paced</strong> format</li>
              <li><strong>Free</strong> access</li>
            </ul>
            <button
              className="curriculum-button"
              type="button"
              aria-expanded={curriculumOpen}
              aria-controls="course-curriculum"
              onClick={() => setCurriculumOpen((open) => !open)}
            >
              {curriculumOpen ? 'Hide curriculum' : 'Preview curriculum'}
              <span aria-hidden="true">{curriculumOpen ? '−' : '+'}</span>
            </button>
          </aside>
        </section>

        <section className="course-section" id="courses" aria-labelledby="courses-title">
          <div className="section-heading">
            <div>
              <p className="section-index">01 / LEARNING</p>
              <h2 id="courses-title">One course, rebuilt properly.</h2>
            </div>
            <p>
              We are starting with a focused pilot instead of publishing unfinished courses.
              Each lesson will include clear outcomes, notes, a knowledge check, and a practical task.
            </p>
          </div>

          <div
            id="course-curriculum"
            className={curriculumOpen ? 'curriculum-grid is-open' : 'curriculum-grid'}
          >
            {curriculum.map((module) => (
              <article className="module-card" key={module.number}>
                <span>{module.number}</span>
                <h3>{module.title}</h3>
                <p>{module.detail}</p>
              </article>
            ))}
          </div>
          {!curriculumOpen && (
            <button className="mobile-curriculum-button" type="button" onClick={() => setCurriculumOpen(true)}>
              Show the four-lesson curriculum
            </button>
          )}
        </section>

        <section className="learning-path" id="how-it-works" aria-labelledby="path-title">
          <div className="path-intro">
            <p className="section-index light">02 / THE STUDENT PATH</p>
            <h2 id="path-title">Clear progress.<br />No false promises.</h2>
            <p>
              Accounts will reopen only after authentication, progress tracking, and certificate
              approval have been tested end to end.
            </p>
          </div>

          <ol className="path-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Create and verify your account</h3>
                <p>Your password stays with the authentication provider—not in our database.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Learn and build</h3>
                <p>Complete lessons, knowledge checks, and one practical portfolio project.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Earn a verified certificate</h3>
                <p>EFBI reviews completion before issuing a publicly verifiable credential.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="standards-section" id="standards" aria-labelledby="standards-title">
          <div>
            <p className="section-index">03 / OUR STANDARD</p>
            <h2 id="standards-title">Built for trust, access, and useful learning.</h2>
          </div>
          <div className="standards-grid">
            <article>
              <span aria-hidden="true">A</span>
              <h3>Accessible by design</h3>
              <p>Mobile-first pages, readable lessons, captions, transcripts, and low-bandwidth choices.</p>
            </article>
            <article>
              <span aria-hidden="true">P</span>
              <h3>Private by default</h3>
              <p>Students control their profiles. Personal learning records are never public.</p>
            </article>
            <article>
              <span aria-hidden="true">E</span>
              <h3>Evidence over numbers</h3>
              <p>We publish verified outcomes and student work—not invented impact statistics.</p>
            </article>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#top">
          <img src="/efbi-icon.png" width="38" height="38" alt="" />
          <span><strong>EFBI</strong><small>Academy</small></span>
        </a>
        <p>Ethiopian Future Builders Initiative · Free learning for young builders.</p>
        <p>Platform rebuild in progress.</p>
      </footer>
    </div>
  )
}

export default App

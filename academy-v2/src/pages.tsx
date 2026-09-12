import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageHero, ProgramCard, RebuildNotice, SectionHeading } from './components'
import { blogPosts, buildPillars, curriculum, methodology, programs, values } from './data'
import { Icon } from './icons'
import { CourseAccessButton } from './auth'

import { learnerEnrollmentEnabled } from './site-mode'
export function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="shell home-hero-grid">
          <div className="home-hero-copy">
            <div className="hero-kicker"><span /> EFBI Academy <i /> Built for Ethiopian learners</div>
            <h1>Learn. Build.<br /><em>Lead.</em></h1>
            <p className="hero-lede">Free, practical courses that help young Ethiopians build useful skills and turn ideas into real projects.</p>
            <div className="button-row">
              <Link className="button button--primary" to="/programs">Explore programs <Icon name="arrow" /></Link>
              <Link className="button button--outline" to={learnerEnrollmentEnabled ? '/join' : '/courses'}>{learnerEnrollmentEnabled ? 'Join Academy' : 'Preview courses'}</Link>
            </div>
            <div className="hero-trust-row">
              <span><Icon name="check" /> Free to learn</span>
              <span><Icon name="check" /> Project-based</span>
              <span><Icon name="check" /> Made in Ethiopia</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-frame">
              <img src="/hero-students-learning.webp" alt="Students learning and building a technology project together" width="1024" height="768" />
              <div className="image-caption"><span>The EFBI approach</span><strong>Learn it. Use it. Share it.</strong></div>
            </div>
            <div className="hero-side-card hero-side-card--top"><span>01</span><p>Learn</p></div>
            <div className="hero-side-card hero-side-card--bottom"><span>04</span><p>Lead</p></div>
          </div>
        </div>
      </section>

      <section className="statement-band">
        <div className="shell statement-grid">
          <p>About EFBI</p>
          <h2>We help Ethiopian students learn technology, build practical projects, and grow as leaders.</h2>
          <Link to="/about">Our story <Icon name="arrow" /></Link>
        </div>
      </section>

      <section className="section shell" aria-labelledby="programs-heading">
        <div className="heading-with-action">
          <SectionHeading eyebrow="Our programs" title="Choose what you want to build" description="Start with one path. Learn by doing." />
          <Link className="text-arrow" to="/programs">See all programs <Icon name="arrow" /></Link>
        </div>
        <div className="program-grid program-grid--home">
          {programs.slice(0, 4).map((program) => <ProgramCard key={program.slug} program={program} />)}
        </div>
      </section>

      <section className="section methodology-section">
        <div className="shell">
          <SectionHeading light eyebrow="How learning works" title="From skills to solutions" description="Four simple steps take you from a new idea to work you can share." />
          <ol className="methodology-grid">
            {methodology.map((stage) => (
              <li key={stage.number}>
                <span>{stage.number}</span>
                <div className="stage-icon"><Icon name={stage.title === 'Learn' ? 'book' : stage.title === 'Practice' ? 'code' : stage.title === 'Build' ? 'spark' : 'compass'} /></div>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section shell building-section">
        <div className="building-intro">
          <SectionHeading eyebrow="Behind the academy" title="Building EFBI" description="Five parts are coming together to create a better learning experience." />
          <RebuildNotice compact />
        </div>
        <div className="build-list">
          {buildPillars.map((pillar) => (
            <article key={pillar.number}>
              <span>{pillar.number}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
              <Icon name="arrow" />
            </article>
          ))}
        </div>
      </section>

      <section className="section values-section">
        <div className="shell">
          <SectionHeading eyebrow="What matters to us" title="Our core values" description="These values guide how we teach, build, and work with students." />
          <div className="values-grid">
            {values.map((value) => <article key={value.number}><span>{value.number}</span><h3>{value.title}</h3><p>{value.description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="section shell founder-strip">
        <div className="founder-strip-image">
          <img src="/tamerat-gebeyehu.webp" alt="Tamerat Gebeyehu, founder of EFBI Academy" width="900" height="900" />
        </div>
        <div className="founder-strip-copy">
          <p className="eyebrow-label">Founder & lead builder</p>
          <h2>Meet Tamerat.</h2>
          <p>Tamerat started EFBI to give Ethiopian students a practical place to learn, build, and grow.</p>
          <blockquote>“I want students to build useful skills and believe in what they can create.”</blockquote>
          <Link className="text-arrow" to="/about#leadership">Read the EFBI story <Icon name="arrow" /></Link>
        </div>
      </section>

      <section className="cta-section">
        <div className="shell cta-inner">
          <div><p className="eyebrow-label">Start exploring</p><h2>Learn something.<br />Build something.</h2></div>
          <div><p>See what EFBI is preparing. Enrollment will reopen when the student platform is ready.</p><div className="button-row"><Link className="button button--light" to="/courses">Browse courses</Link><Link className="button button--line-light" to="/contact">Contact EFBI</Link></div></div>
        </div>
      </section>
    </>
  )
}

export function ProgramsPage() {
  return (
    <>
      <PageHero eyebrow="Programs" title="Choose what you want to learn." description="Pick a path, practice the skills, and build something you can show." className="page-hero--programs">
        <div className="page-stat"><strong>8</strong><span>learning paths</span></div>
      </PageHero>
      <section className="section shell"><div className="program-grid">{programs.map((program) => <ProgramCard key={program.slug} program={program} />)}</div></section>
      <section className="outcome-band"><div className="shell"><SectionHeading light eyebrow="What you will do" title="Learn it. Practice it. Build it." /><div className="outcome-grid"><article><strong>01</strong><h3>Understand</h3><p>Learn the idea in clear language.</p></article><article><strong>02</strong><h3>Practice</h3><p>Use it in guided exercises.</p></article><article><strong>03</strong><h3>Build</h3><p>Create work you can share.</p></article></div></div></section>
    </>
  )
}

export function ProgramDetailPage() {
  const { slug } = useParams()
  const program = programs.find((item) => item.slug === slug)
  if (!program) return <Navigate to="/programs" replace />
  return (
    <>
      <PageHero eyebrow={`${program.level} · ${program.duration}`} title={program.title} description={program.description}>
        <span className="detail-program-icon"><Icon name="book" /></span>
      </PageHero>
      <section className="section shell detail-layout">
        <div>
          <p className="eyebrow-label">Your goal</p><h2>What you’ll build toward</h2><p className="large-copy">{program.outcome}</p>
          <div className="detail-points"><div><Icon name="book" /><span><strong>Short lessons</strong>Clear notes and examples.</span></div><div><Icon name="code" /><span><strong>Real practice</strong>Small tasks that build confidence.</span></div><div><Icon name="spark" /><span><strong>A finished project</strong>Work you can explain and share.</span></div></div>
        </div>
        <aside className="enrollment-card"><span className="status-tag">In development</span><h2>Enrollment is not open yet.</h2><p>We’re finishing the lessons and testing the student platform first.</p><Link className="button button--primary" to="/contact">Ask about this program</Link></aside>
      </section>
    </>
  )
}

export function CoursesPage() {
  return (
    <>
      <PageHero eyebrow="Courses" title="Courses built for doing." description="Learn in short steps, practice each idea, and finish with a project." className="page-hero--courses"><RebuildNotice compact /></PageHero>
      <section className="section shell">
        <article className="course-feature-card">
          <div className="course-cover">
            <div className="cover-top"><span>EFBI / COURSE 01</span><span>PILOT</span></div>
            <div className="cover-main"><small>Artificial Intelligence</small><strong>AI Foundations<br />for Ethiopia</strong><p>Understand · Question · Build</p></div>
            <div className="cover-grid" aria-hidden="true">{Array.from({ length: 12 }).map((_, index) => <i key={index} />)}</div>
          </div>
          <div className="course-feature-copy">
            <div className="course-tags"><span>Beginner</span><span>4 lessons</span><span>Self-paced</span></div>
            <h2>AI Foundations for Ethiopia</h2>
            <p>Learn what AI can do, use it responsibly, and design a small solution for your school or community.</p>
            <ul><li><Icon name="check" /> Video and written lessons</li><li><Icon name="check" /> Privacy and responsible AI</li><li><Icon name="check" /> One practical project</li><li><Icon name="check" /> Quick knowledge checks</li></ul>
            <Link className="button button--primary" to="/courses/ai-foundations">View course <Icon name="arrow" /></Link>
          </div>
        </article>
        <div className="catalog-heading"><div><p className="eyebrow-label">Coming next</p><h2>More courses are on the way</h2></div><p>We’ll open each course after its lessons and learning tools are ready.</p></div>
        <div className="course-roadmap">{programs.slice(1).map((program, index) => <article key={program.slug}><span>{String(index + 2).padStart(2, '0')}</span><div><h3>{program.title}</h3><p>{program.description}</p></div><small>{program.level}</small></article>)}</div>
      </section>
    </>
  )
}

export function CourseDetailPage() {
  return (
    <>
      <PageHero eyebrow="Pilot course · Beginner" title="AI Foundations for Ethiopia" description="Four short lessons that help you understand AI and use it responsibly." className="page-hero--course-detail"><div className="page-stat"><strong>4</strong><span>lessons</span></div></PageHero>
      <section className="section shell course-detail-grid">
        <div>
          <SectionHeading eyebrow="Course outline" title="A clear path from idea to project" description="Each lesson ends with one practical step." />
          <ol className="curriculum-list">{curriculum.map((item) => <li key={item.number}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div><Icon name="chevron" /></li>)}</ol>
          <div className="video-note"><Icon name="play" /><div><strong>All four lessons are ready</strong><p>Verified learners can complete the pilot learning path and save 100% progress. Video slots activate when EFBI publishes each recording.</p></div></div>
        </div>
        <aside className="course-sidebar"><div className="mini-cover"><span>EFBI / 01</span><strong>AI<br />FOUNDATIONS</strong><small>FOR ETHIOPIA</small></div><h2>Course status</h2><p>The four-lesson pilot is complete in the development academy.</p><div className="progress-label"><span>Learning path</span><strong>Complete</strong></div><div className="progress-track"><i /></div><CourseAccessButton /></aside>
      </section>
    </>
  )
}

export function CertificationPage() {
  return (
    <>
      <PageHero eyebrow="Certificates" title="A certificate you earn." description="Finish the lessons, complete a reviewed assessment, and submit your project." className="page-hero--certification"><Icon className="page-hero-icon" name="shield" /></PageHero>
      <section className="section shell certification-grid">
        <div>
          <SectionHeading eyebrow="How it works" title="Complete the course. Show your work." />
          <ol className="requirement-list"><li><span>01</span><div><h3>Finish every lesson</h3><p>Your progress is saved in your account.</p></div></li><li><span>02</span><div><h3>Complete the final assessment</h3><p>This reviewed assessment is separate from the practice questions inside lessons.</p></div></li><li><span>03</span><div><h3>Submit your project</h3><p>Use what you learned in a practical task.</p></div></li><li><span>04</span><div><h3>Receive approval</h3><p>EFBI reviews your work before issuing the certificate.</p></div></li></ol>
        </div>
        <div className="certificate-mock" aria-label="Sample EFBI certificate">
          <div className="certificate-accent" aria-hidden="true"><i /><i /><i /></div>
          <div className="certificate-top"><img src="/efbi-icon.png" alt="" /><span>EFBI ACADEMY</span></div>
          <p>Certificate of completion</p>
          <small>Presented to</small><h2>Learner Name</h2>
          <small>for completing</small><h3>AI Foundations for Ethiopia</h3>
          <div className="certificate-details"><span><small>Issued</small>Month 2026</span><span><small>Credential ID</small>EFBI-XXXX</span></div>
          <div className="certificate-signature"><strong>Tamerat Gebeyehu</strong><span>Founder & Director</span></div>
          <div className="certificate-seal"><Icon name="shield" /></div>
          <em>Sample design · not a valid certificate</em>
        </div>
      </section>
      <section className="registry-callout"><div className="shell"><div><p className="eyebrow-label">Easy to verify</p><h2>Every certificate has its own record.</h2><p>Anyone can check the credential ID. Private learning data stays private.</p></div><Link className="button button--light" to="/verify">Verify a certificate <Icon name="arrow" /></Link></div></section>
    </>
  )
}

export function BlogPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => blogPosts.slice(1).filter((post) => `${post.title} ${post.category} ${post.excerpt}`.toLowerCase().includes(query.toLowerCase())), [query])
  const featured = blogPosts[0]
  return (
    <>
      <PageHero eyebrow="EFBI blog" title="Ideas for learning and building." description="Simple guides, project lessons, and scholarship advice." className="page-hero--blog" />
      <section className="section shell">
        <article className="featured-post"><div className="featured-post-art"><span>FEATURED / 01</span><strong>Build work<br />you can show.</strong><Icon name="spark" /></div><div><span className="article-tag">{featured.category}</span><p className="article-status">{featured.status}</p><h2>{featured.title}</h2><p>{featured.excerpt}</p><button className="text-arrow" disabled>Coming soon <Icon name="arrow" /></button></div></article>
        <div className="blog-toolbar"><div><p className="eyebrow-label">More from EFBI</p><h2>Latest articles</h2></div><label className="search-field"><span className="sr-only">Search articles</span><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles" /></label></div>
        <div className="blog-grid blog-grid--refined">{filtered.map((post, index) => <article key={post.title}><div className={`post-number post-number--${index + 2}`}>{String(index + 2).padStart(2, '0')}</div><span className="article-tag">{post.category}</span><h3>{post.title}</h3><p>{post.excerpt}</p><small>{post.status}</small></article>)}</div>
      </section>
    </>
  )
}

export function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About EFBI" title="Built in Ethiopia, for Ethiopian learners." description="EFBI helps young people learn practical skills, build useful projects, and grow as leaders." className="page-hero--about" />
      <section className="section shell mission-vision-grid"><article><span>Mission</span><h2>Make practical learning easier to reach.</h2><p>Give Ethiopian students useful technology skills, guidance, and room to build.</p></article><article><span>Vision</span><h2>Grow a community of young builders.</h2><p>Students who use technology to solve local problems and create new opportunities.</p></article></section>
      <section className="section values-section"><div className="shell"><SectionHeading eyebrow="What guides us" title="Six values we work by" /><div className="values-grid">{values.map((value) => <article key={value.number}><span>{value.number}</span><h3>{value.title}</h3><p>{value.description}</p></article>)}</div></div></section>
      <section className="section shell leadership-full" id="leadership"><div className="founder-image-wrap"><img src="/tamerat-gebeyehu.webp" alt="Tamerat Gebeyehu, founder of EFBI Academy" /><span>Founder & Lead Builder</span></div><div><p className="eyebrow-label">Leadership</p><h2>Tamerat Gebeyehu</h2><p className="large-copy">Tamerat started EFBI and leads its courses, content, design, and platform development.</p><p>EFBI began with one builder, but its future is collaborative. Students, educators, mentors, and partners will all have a part in shaping it.</p><div className="founder-tags"><span>Strategy</span><span>Curriculum</span><span>Content</span><span>Platform</span></div></div></section>
    </>
  )
}

export function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact EFBI" title="Let’s talk." description="Ask about courses, mentoring, partnerships, or the platform." className="page-hero--contact" />
      <section className="section shell contact-grid">
        <div><SectionHeading eyebrow="Get in touch" title="Choose what works for you" description="Our contact form is being rebuilt, so reach us directly." /><div className="contact-cards"><a href="mailto:efbi.academy@gmail.com"><Icon name="mail" /><span><small>Email</small><strong>efbi.academy@gmail.com</strong></span><Icon name="external" /></a><a href="tel:+251725520306"><Icon name="phone" /><span><small>Phone</small><strong>+251 725 520 306</strong></span><Icon name="external" /></a><a href="https://t.me/EFBI_Academy" target="_blank" rel="noreferrer"><Icon name="send" /><span><small>Telegram</small><strong>@EFBI_Academy</strong></span><Icon name="external" /></a><a href="https://t.me/+HhBFWhYdfChhYTlk" target="_blank" rel="noreferrer"><Icon name="users" /><span><small>Community</small><strong>Join the student group</strong></span><Icon name="external" /></a></div></div>
        <aside className="contact-side contact-side--refined"><div className="contact-side-mark"><span><Icon name="users" /></span><div><small>EFBI Academy</small><strong>Addis Ababa, Ethiopia</strong></div></div><h2>Want to build with us?</h2><p>We’d like to hear from educators, mentors, community leaders, and partners who care about practical learning.</p><a className="button button--primary" href="mailto:efbi.academy@gmail.com?subject=EFBI%20Collaboration">Propose a collaboration</a></aside>
      </section>
    </>
  )
}

export function JoinPage() { return <AccessPage kind="join" /> }
export function SignInPage() { return <AccessPage kind="signin" /> }

function AccessPage({ kind }: { kind: 'join' | 'signin' }) {
  const joining = kind === 'join'
  return <section className="access-page"><div className="access-panel"><Link className="brand-alone" to="/"><img src="/efbi-icon.png" alt="" /> EFBI Academy</Link><p className="eyebrow-label">{joining ? 'Join EFBI' : 'Student portal'}</p><h1>{joining ? 'Enrollment will reopen soon.' : 'Sign-in is paused for now.'}</h1><p>{joining ? 'We’re finishing the new student platform before accepting applications.' : 'We’re replacing the old sign-in system with a safer one.'}</p><RebuildNotice /><div className="access-actions"><Link className="button button--primary" to="/courses">Explore courses</Link><Link className="button button--outline" to="/contact">Contact EFBI</Link></div></div></section>
}

export function NotFoundPage() {
  return <section className="not-found shell"><span>404</span><h1>We couldn’t find that page.</h1><p>The address may have changed during the rebuild.</p><Link className="button button--primary" to="/">Return home</Link></section>
}

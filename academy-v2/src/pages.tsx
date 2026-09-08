import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageHero, ProgramCard, RebuildNotice, SectionHeading } from './components'
import { blogPosts, buildPillars, curriculum, methodology, programs, values } from './data'
import { Icon } from './icons'

export function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="shell home-hero-grid">
          <div className="home-hero-copy">
            <div className="hero-kicker"><span /> EFBI Academy <i /> Empowering Ethiopian youth</div>
            <h1>Learn. Build.<br /><em>Lead.</em></h1>
            <p className="hero-lede">Practical AI, software engineering, entrepreneurship, and leadership programs for Ethiopia's next generation of builders.</p>
            <div className="button-row">
              <Link className="button button--primary" to="/programs">Explore programs <Icon name="arrow" /></Link>
              <Link className="button button--outline" to="/join">Join Academy</Link>
            </div>
            <div className="hero-trust-row">
              <span><Icon name="check" /> 100% free learning</span>
              <span><Icon name="check" /> Practical projects</span>
              <span><Icon name="check" /> Built in Ethiopia</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-frame">
              <img src="/hero-students-learning.webp" alt="Students collaborating on digital skills and technology projects" width="1024" height="768" />
              <div className="image-caption"><span>EFBI learning model</span><strong>Skills that become useful work.</strong></div>
            </div>
            <div className="hero-side-card hero-side-card--top"><span>01</span><p>Learn the idea</p></div>
            <div className="hero-side-card hero-side-card--bottom"><span>04</span><p>Lead with it</p></div>
          </div>
        </div>
      </section>

      <section className="statement-band">
        <div className="shell statement-grid">
          <p>Who we are</p>
          <h2>A youth-led initiative helping Ethiopian students turn curiosity into practical skill, credible work, and community impact.</h2>
          <Link to="/about">Discover EFBI <Icon name="arrow" /></Link>
        </div>
      </section>

      <section className="section shell" aria-labelledby="programs-heading">
        <div className="heading-with-action">
          <SectionHeading
            eyebrow="Our programs"
            title="Future-ready learning pathways"
            description="Eight connected pathways bridge classroom theory and the skills needed to build, communicate, and lead."
          />
          <Link className="text-arrow" to="/programs">View all programs <Icon name="arrow" /></Link>
        </div>
        <div className="program-grid program-grid--home">
          {programs.slice(0, 4).map((program) => <ProgramCard key={program.slug} program={program} />)}
        </div>
      </section>

      <section className="section methodology-section">
        <div className="shell">
          <SectionHeading
            light
            eyebrow="Learning methodology"
            title="From skills to solutions"
            description="A four-stage framework designed to move ambitious learners from understanding to useful action."
          />
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
          <SectionHeading
            eyebrow="Work in progress"
            title="Building EFBI"
            description="EFBI is not only a course catalogue. These five connected workstreams are being developed into a trustworthy learning ecosystem."
          />
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
          <SectionHeading eyebrow="What guides us" title="Our core values" description="The standard for what EFBI teaches, builds, publishes, and promises." />
          <div className="values-grid">
            {values.map((value) => (
              <article key={value.number}>
                <span>{value.number}</span>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell leadership-preview">
        <div className="founder-image-wrap">
          <img src="/tamerat-gebeyehu.webp" alt="Tamerat Gebeyehu, founder and lead builder of EFBI Academy" width="900" height="900" />
          <span>Founder-led · Community-designed</span>
        </div>
        <div className="founder-copy">
          <p className="eyebrow-label">Leadership & vision</p>
          <h2>Built by one founder.<br />Designed for a community.</h2>
          <p>EFBI began as a founder-led initiative to make practical technology education more accessible to Ethiopian youth—and to build it transparently, one tested layer at a time.</p>
          <blockquote>“My goal is to help students move from watching technology change the world to building solutions that shape their own communities.”</blockquote>
          <div className="founder-byline"><strong>Tamerat Gebeyehu</strong><span>Founder & Lead Builder</span></div>
          <Link className="text-arrow" to="/about#leadership">Read the EFBI story <Icon name="arrow" /></Link>
        </div>
      </section>

      <section className="cta-section">
        <div className="shell cta-inner">
          <div><p className="eyebrow-label">Your next step</p><h2>Bring your curiosity.<br />Build something useful.</h2></div>
          <div><p>Explore the learning pathways now. Enrollment will reopen after the secure student platform is ready.</p><div className="button-row"><Link className="button button--light" to="/courses">Browse courses</Link><Link className="button button--line-light" to="/contact">Contact EFBI</Link></div></div>
        </div>
      </section>
    </>
  )
}

export function ProgramsPage() {
  return (
    <>
      <PageHero eyebrow="Explore EFBI" title="Programs built around useful outcomes." description="Choose a pathway that connects technical skill, real practice, and the confidence to create work you can explain and improve.">
        <div className="page-stat"><strong>8</strong><span>learning pathways</span></div>
      </PageHero>
      <section className="section shell">
        <div className="program-grid">{programs.map((program) => <ProgramCard key={program.slug} program={program} />)}</div>
      </section>
      <section className="outcome-band"><div className="shell"><SectionHeading light eyebrow="The EFBI difference" title="Every pathway moves toward evidence." /><div className="outcome-grid"><article><strong>01</strong><h3>Clear understanding</h3><p>Know the concept, its purpose, and its limits.</p></article><article><strong>02</strong><h3>Practical application</h3><p>Use the skill through exercises and guided work.</p></article><article><strong>03</strong><h3>Portfolio evidence</h3><p>Create something you can demonstrate and discuss.</p></article></div></div></section>
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
        <div className={`detail-monogram accent-${program.accent}`}>{program.shortTitle}</div>
      </PageHero>
      <section className="section shell detail-layout">
        <div>
          <p className="eyebrow-label">Learning outcome</p><h2>What you will work toward</h2><p className="large-copy">{program.outcome}</p>
          <div className="detail-points"><div><Icon name="book" /><span><strong>Structured lessons</strong>Clear explanations, notes, and guided examples.</span></div><div><Icon name="code" /><span><strong>Applied practice</strong>Tasks that turn knowledge into repeatable skill.</span></div><div><Icon name="spark" /><span><strong>Evidence of work</strong>A project or deliverable you can present honestly.</span></div></div>
        </div>
        <aside className="enrollment-card"><span className="status-tag">Curriculum in development</span><h2>Enrollment is not open yet.</h2><p>We are validating course content, learner safety, account security, and progress tracking before accepting students.</p><Link className="button button--primary" to="/contact">Ask about this program</Link></aside>
      </section>
    </>
  )
}

export function CoursesPage() {
  return (
    <>
      <PageHero eyebrow="Course catalogue" title="Learn in focused, practical steps." description="The public catalogue shows what EFBI is preparing. Only tested and complete courses will open for enrollment.">
        <RebuildNotice compact />
      </PageHero>
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
            <p>Understand artificial intelligence, use it responsibly, and design a small solution for a challenge in your school or community.</p>
            <ul><li><Icon name="check" /> Plain-language video and written lessons</li><li><Icon name="check" /> Responsible AI and privacy foundations</li><li><Icon name="check" /> One practical Ethiopian-context project</li><li><Icon name="check" /> Knowledge checks and reflection</li></ul>
            <Link className="button button--primary" to="/courses/ai-foundations">View course details <Icon name="arrow" /></Link>
          </div>
        </article>

        <div className="catalog-heading"><div><p className="eyebrow-label">Curriculum roadmap</p><h2>More courses being prepared</h2></div><p>These pathways are planned, not yet open for enrollment.</p></div>
        <div className="course-roadmap">{programs.slice(1).map((program, index) => <article key={program.slug}><span>{String(index + 2).padStart(2, '0')}</span><div><h3>{program.title}</h3><p>{program.description}</p></div><small>{program.level}</small></article>)}</div>
      </section>
    </>
  )
}

export function CourseDetailPage() {
  return (
    <>
      <PageHero eyebrow="Pilot course · Beginner" title="AI Foundations for Ethiopia" description="A four-lesson introduction to understanding, questioning, and responsibly using artificial intelligence.">
        <div className="page-stat"><strong>4</strong><span>focused lessons</span></div>
      </PageHero>
      <section className="section shell course-detail-grid">
        <div>
          <SectionHeading eyebrow="Course curriculum" title="A small course with a clear finish line" description="Every lesson includes an outcome, explanation, knowledge check, and practical step." />
          <ol className="curriculum-list">{curriculum.map((item) => <li key={item.number}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div><Icon name="chevron" /></li>)}</ol>
        </div>
        <aside className="course-sidebar"><div className="mini-cover"><span>EFBI / 01</span><strong>AI<br />FOUNDATIONS</strong><small>FOR ETHIOPIA</small></div><h2>Course status</h2><p>Content, assessments, progress tracking, and student privacy controls are being tested.</p><div className="progress-label"><span>Preparation</span><strong>In progress</strong></div><div className="progress-track"><i /></div><Link className="button button--primary" to="/join">Join the interest list</Link></aside>
      </section>
    </>
  )
}

export function CertificationPage() {
  return (
    <>
      <PageHero eyebrow="EFBI credentials" title="Certificates backed by completed work." description="EFBI certificates are designed to represent verified learning, practical evidence, and a clear course record—not attendance alone.">
        <Icon className="page-hero-icon" name="shield" />
      </PageHero>
      <section className="section shell certification-grid">
        <div>
          <SectionHeading eyebrow="Completion standard" title="What a learner must complete" />
          <ol className="requirement-list"><li><span>01</span><div><h3>Complete every lesson</h3><p>Progress must be recorded through the authenticated learning portal.</p></div></li><li><span>02</span><div><h3>Pass knowledge checks</h3><p>Course-specific assessments confirm the core ideas were understood.</p></div></li><li><span>03</span><div><h3>Submit practical evidence</h3><p>A project or deliverable demonstrates that learning can be applied.</p></div></li><li><span>04</span><div><h3>Receive final approval</h3><p>EFBI reviews completion before issuing a unique credential.</p></div></li></ol>
        </div>
        <div className="certificate-mock" aria-label="Illustrative certificate design preview"><div className="certificate-top"><img src="/efbi-icon.png" alt="" /><span>ETHIOPIAN FUTURE BUILDERS INITIATIVE</span></div><p>Certificate of completion</p><h2>Learner Name</h2><small>has completed the requirements for</small><h3>Course Title</h3><div className="certificate-lines"><span>Issue date</span><span>EFBI-ID-XXXX</span></div><div className="certificate-seal"><Icon name="shield" /></div><em>Design preview · not a valid credential</em></div>
      </section>
      <section className="registry-callout"><div className="shell"><div><p className="eyebrow-label">Public trust</p><h2>A credential anyone can check.</h2><p>Each issued certificate will have a unique public record while private student learning data remains protected.</p></div><Link className="button button--light" to="/verify">Open verification <Icon name="arrow" /></Link></div></section>
    </>
  )
}

export function VerifyPage() {
  return (
    <>
      <PageHero eyebrow="Credential registry" title="Verify an EFBI certificate." description="This public page will allow schools, universities, employers, and learners to confirm an issued EFBI credential." />
      <section className="section shell verify-layout">
        <div className="verify-card">
          <div className="verify-icon"><Icon name="shield" /></div>
          <h2>Verification is temporarily paused.</h2>
          <p>The previous test registry has been retired. Verification will reopen after the secure certificate database and approval workflow are complete.</p>
          <label htmlFor="certificate-id">Certificate ID</label>
          <div className="verify-form"><input id="certificate-id" type="text" placeholder="Example: EFBI-2026-0001" disabled /><button className="button button--primary" type="button" disabled>Verify</button></div>
          <small>No real certificates have been issued through the rebuilt system yet.</small>
        </div>
        <aside className="verification-info"><p className="eyebrow-label">What the future record will show</p><ul><li><Icon name="check" /><span><strong>Credential status</strong>Valid, replaced, or revoked.</span></li><li><Icon name="check" /><span><strong>Learner and course</strong>Only the public identity fields needed for verification.</span></li><li><Icon name="check" /><span><strong>Issue details</strong>Unique identifier and official issue date.</span></li></ul></aside>
      </section>
    </>
  )
}

export function BlogPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => blogPosts.filter((post) => `${post.title} ${post.category} ${post.excerpt}`.toLowerCase().includes(query.toLowerCase())), [query])
  return (
    <>
      <PageHero eyebrow="Ideas & guidance" title="Technology & learning blog." description="Useful explanations, building notes, scholarship guidance, and honest updates from the EFBI journey." />
      <section className="section shell">
        <article className="featured-post"><div className="featured-post-art"><span>FIELD NOTE / 001</span><strong>Ideas become credible<br />when the work is visible.</strong><Icon name="spark" /></div><div><span className="article-tag">Scholarships</span><p className="article-status">Editorial draft</p><h2>How a Strong Project Portfolio Can Support Scholarship Applications</h2><p>A practical guide to documenting initiative, community impact, technical growth, and honest evidence in your application story.</p><button className="text-arrow" disabled>Article coming soon <Icon name="arrow" /></button></div></article>
        <div className="blog-toolbar"><div><p className="eyebrow-label">From the EFBI desk</p><h2>All field notes</h2></div><label className="search-field"><span className="sr-only">Search articles</span><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search field notes" /></label></div>
        <div className="blog-grid">{filtered.map((post, index) => <article key={post.title}><div className={`post-number post-number--${index + 1}`}>{String(index + 1).padStart(2, '0')}</div><span className="article-tag">{post.category}</span><h3>{post.title}</h3><p>{post.excerpt}</p><small>{post.status}</small></article>)}</div>
      </section>
    </>
  )
}

export function AboutPage() {
  return (
    <>
      <PageHero eyebrow="Who we are" title="A practical learning initiative, built in Ethiopia." description="EFBI Academy helps young people build technology skills, leadership capacity, and useful evidence of what they can create." />
      <section className="section shell mission-vision-grid"><article><span>Mission</span><h2>Expand access to practical learning.</h2><p>Give Ethiopian youth access to technology training, mentorship, and leadership development that prepares them to solve real problems.</p></article><article><span>Vision</span><h2>Grow a community of builders.</h2><p>A thriving community of young Ethiopian builders driving local digital transformation and shaping globally relevant innovation.</p></article></section>
      <section className="section values-section"><div className="shell"><SectionHeading eyebrow="Our foundation" title="Six values, one shared standard" /><div className="values-grid">{values.map((value) => <article key={value.number}><span>{value.number}</span><h3>{value.title}</h3><p>{value.description}</p></article>)}</div></div></section>
      <section className="section shell leadership-full" id="leadership"><div className="founder-image-wrap"><img src="/tamerat-gebeyehu.webp" alt="Tamerat Gebeyehu, founder and lead builder of EFBI Academy" /><span>Founder & Lead Builder</span></div><div><p className="eyebrow-label">Leadership & vision</p><h2>Tamerat Gebeyehu</h2><p className="large-copy">Tamerat founded EFBI Academy and currently leads its strategy, curriculum design, media production, identity, and platform development.</p><p>The initiative is intentionally transparent about being founder-led at this stage. Its long-term direction is collaborative: educators, mentors, partners, and students will help shape a stronger learning community as the academy grows.</p><div className="founder-tags"><span>Strategy</span><span>Curriculum</span><span>Content & video</span><span>Platform development</span></div></div></section>
    </>
  )
}

export function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact EFBI" title="Questions, ideas, or a way to help?" description="Reach out about learning, mentorship, partnerships, content, or the platform rebuild." />
      <section className="section shell contact-grid">
        <div><SectionHeading eyebrow="Direct contact" title="Choose the easiest channel" description="The secure contact form is still being rebuilt, so use one of the direct channels below." /><div className="contact-cards"><a href="mailto:efbi.academy@gmail.com"><Icon name="mail" /><span><small>Email</small><strong>efbi.academy@gmail.com</strong></span><Icon name="external" /></a><a href="tel:+251725520306"><Icon name="phone" /><span><small>Phone</small><strong>+251 725 520 306</strong></span><Icon name="external" /></a><a href="https://t.me/EFBI_Academy" target="_blank" rel="noreferrer"><Icon name="send" /><span><small>Telegram channel</small><strong>@EFBI_Academy</strong></span><Icon name="external" /></a><a href="https://t.me/+HhBFWhYdfChhYTlk" target="_blank" rel="noreferrer"><Icon name="users" /><span><small>Student community</small><strong>Join the EFBI group</strong></span><Icon name="external" /></a></div></div>
        <aside className="contact-side"><div className="contact-map"><Icon name="map" /><div><small>EFBI Academy</small><strong>Addis Ababa, Ethiopia</strong></div></div><h2>Interested in contributing?</h2><p>EFBI welcomes conversations with educators, mentors, student community leaders, sponsors, and guest instructors who share its learning and safety standards.</p><a className="button button--primary" href="mailto:efbi.academy@gmail.com?subject=EFBI%20Collaboration">Propose a collaboration</a></aside>
      </section>
    </>
  )
}

export function JoinPage() {
  return <AccessPage kind="join" />
}

export function SignInPage() {
  return <AccessPage kind="signin" />
}

function AccessPage({ kind }: { kind: 'join' | 'signin' }) {
  const joining = kind === 'join'
  return (
    <section className="access-page"><div className="access-panel"><Link className="brand-alone" to="/"><img src="/efbi-icon.png" alt="" /> EFBI Academy</Link><p className="eyebrow-label">{joining ? 'Join the academy' : 'Student portal'}</p><h1>{joining ? 'Enrollment will reopen safely.' : 'Sign-in is temporarily paused.'}</h1><p>{joining ? 'We are rebuilding registration, consent, authentication, and learner records before accepting applications.' : 'The previous sign-in system has been retired while secure authentication and progress tracking are implemented.'}</p><RebuildNotice /><div className="access-actions"><Link className="button button--primary" to="/courses">Explore courses</Link><Link className="button button--outline" to="/contact">Contact EFBI</Link></div></div></section>
  )
}

export function NotFoundPage() {
  return <section className="not-found shell"><span>404</span><h1>This page is not part of the pathway.</h1><p>The address may have changed during the EFBI rebuild.</p><Link className="button button--primary" to="/">Return home</Link></section>
}

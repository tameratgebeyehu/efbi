import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageHero, ProgramCard, RebuildNotice, SectionHeading } from './components'
import { blogPosts as plannedBlogPosts, buildPillars, methodology, programs as fallbackPrograms, values } from './data'
import { Icon } from './icons'
import { CourseAccessButton } from './auth'
import { useAuth } from './auth-context'
import { getFallbackCatalog, loadActiveCourseSummaries, loadCourseCatalog, type ActiveCourseSummary, type CourseCatalog } from './lib/catalog'
import { loadPublishedPrograms } from './lib/programs'
import { loadPublishedPost, loadPublishedPosts, type PublicBlogPost } from './lib/blog'

import { learnerEnrollmentEnabled } from './site-mode'

function useProgramCatalog() {
  const [programs, setPrograms] = useState(fallbackPrograms)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    void loadPublishedPrograms().then((next) => { if (active) { setPrograms(next); setLoading(false) } })
    return () => { active = false }
  }, [])
  return { programs, loading }
}

export function HomePage() {
  const { programs } = useProgramCatalog()
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
  const { programs } = useProgramCatalog()
  return (
    <>
      <PageHero eyebrow="Programs" title="Choose what you want to learn." description="Pick a path, practice the skills, and build something you can show." className="page-hero--programs">
        <div className="page-stat"><strong>{programs.length}</strong><span>learning paths</span></div>
      </PageHero>
      <section className="section shell"><div className="program-grid">{programs.map((program) => <ProgramCard key={program.slug} program={program} />)}</div></section>
      <section className="outcome-band"><div className="shell"><SectionHeading light eyebrow="What you will do" title="Learn it. Practice it. Build it." /><div className="outcome-grid"><article><strong>01</strong><h3>Understand</h3><p>Learn the idea in clear language.</p></article><article><strong>02</strong><h3>Practice</h3><p>Use it in guided exercises.</p></article><article><strong>03</strong><h3>Build</h3><p>Create work you can share.</p></article></div></div></section>
    </>
  )
}

export function ProgramDetailPage() {
  const { slug } = useParams()
  const { programs, loading } = useProgramCatalog()
  const program = programs.find((item) => item.slug === slug)
  if (!program && loading) return <main className="section shell" aria-live="polite">Loading program…</main>
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
  const { user } = useAuth()
  const { programs } = useProgramCatalog()
  const [activeCourses, setActiveCourses] = useState<ActiveCourseSummary[]>([])
  const [catalogReady, setCatalogReady] = useState(false)
  const verified = user?.emailVerified === true

  useEffect(() => {
    if (!user?.emailVerified) return undefined
    let active = true
    void loadActiveCourseSummaries().then((courses) => {
      if (!active) return
      setActiveCourses(courses)
      setCatalogReady(true)
    })
    return () => { active = false }
  }, [user])

  const additionalCourses = activeCourses.filter((course) => course.courseId !== 'ai-foundations')

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
        {verified && <section className="learner-catalog" aria-labelledby="active-courses-title">
          <div className="catalog-heading"><div><p className="eyebrow-label">Your course catalog</p><h2 id="active-courses-title">Active EFBI courses</h2></div><p>Only reviewed versions activated by EFBI appear here.</p></div>
          {!catalogReady && <p className="catalog-loading" role="status">Checking active courses…</p>}
          {catalogReady && additionalCourses.length === 0 && <div className="catalog-empty"><Icon name="book" /><div><strong>AI Foundations is the active pilot.</strong><p>More courses will appear here after EFBI reviews and activates their complete lesson sets.</p></div></div>}
          {additionalCourses.length > 0 && <div className="active-course-grid">{additionalCourses.map((course) => <article key={course.courseId}><div className="active-course-number">V{course.courseVersion}</div><div className="course-tags"><span>{course.level}</span><span>{course.lessonCount} lessons</span><span>{course.assessmentType === 'project' ? 'Reviewed project certificate' : 'Learning only · no certificate'}</span></div><h3>{course.courseTitle}</h3><p>{course.courseDescription}</p><Link className="button button--outline" to={`/courses/${course.courseId}`}>View course <Icon name="arrow" /></Link></article>)}</div>}
        </section>}
        <div className="catalog-heading"><div><p className="eyebrow-label">Coming next</p><h2>More courses are on the way</h2></div><p>We’ll open each course after its lessons and learning tools are ready.</p></div>
        <div className="course-roadmap">{programs.slice(1).map((program, index) => <article key={program.slug}><span>{String(index + 2).padStart(2, '0')}</span><div><h3>{program.title}</h3><p>{program.description}</p></div><small>{program.level}</small></article>)}</div>
      </section>
    </>
  )
}

export function CourseDetailPage() {
  const { courseId } = useParams()
  const { user, loading } = useAuth()
  const fallback = courseId ? getFallbackCatalog(courseId) : null
  const [resolved, setResolved] = useState<{ courseId: string; catalog: CourseCatalog | null } | null>(null)
  const verified = user?.emailVerified === true

  useEffect(() => {
    if (!verified || !courseId) return undefined
    let active = true
    void loadCourseCatalog(courseId).then((catalog) => {
      if (active) setResolved({ courseId, catalog })
    })
    return () => { active = false }
  }, [courseId, verified])

  if (!courseId) return <Navigate to="/courses" replace />
  if ((loading && !fallback) || (verified && resolved?.courseId !== courseId)) {
    return <section className="section shell course-loading"><p className="eyebrow-label">Course catalog</p><h1>Opening the course…</h1><p>Checking the active version and its reviewed lessons.</p></section>
  }

  const catalog = verified ? resolved?.catalog ?? null : fallback
  if (!catalog) return <Navigate to="/courses" replace />
  const versionLabel = catalog.courseVersion ? `Version ${catalog.courseVersion}` : 'Pilot course'
  const assessmentLabel = catalog.assessmentType === 'project' ? 'Reviewed project certificate' : 'Learning only · no certificate'
  return (
    <>
      <PageHero eyebrow={`${versionLabel} · ${catalog.level}`} title={catalog.courseTitle} description={catalog.courseDescription} className="page-hero--course-detail"><div className="page-stat"><strong>{catalog.lessons.length}</strong><span>lessons</span></div></PageHero>
      <section className="section shell course-detail-grid">
        <div>
          <SectionHeading eyebrow="Course outline" title={catalog.assessmentType === 'project' ? 'A clear path from lessons to a project' : 'A focused learning path'} description={catalog.assessmentType === 'project' ? 'Finish the lessons, then show what you built in one reviewed project.' : 'Finish each lesson and use the practice activities to check your understanding.'} />
          <ol className="curriculum-list">{catalog.lessons.map((item) => <li key={item.slug}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div><Icon name="chevron" /></li>)}</ol>
          <div className="video-note"><Icon name="play" /><div><strong>All {catalog.lessons.length} lessons are ready</strong><p>Verified learners can complete this version and save their progress. Videos load only when the learner chooses to connect to YouTube.</p></div></div>
        </div>
        <aside className="course-sidebar"><div className="mini-cover"><span>EFBI / {versionLabel.toUpperCase()}</span><strong>{catalog.courseTitle.toUpperCase()}</strong><small>{assessmentLabel.toUpperCase()}</small></div><h2>Course status</h2><p>{catalog.statusMessage}</p><div className="progress-label"><span>Learning path</span><strong>Available</strong></div><div className="progress-track"><i /></div><CourseAccessButton courseId={courseId} /></aside>
      </section>
    </>
  )
}

export function CertificationPage() {
  return (
    <>
      <PageHero eyebrow="Certificates" title="A certificate you earn." description="Certificates are available only for courses marked as a reviewed project pathway." className="page-hero--certification"><Icon className="page-hero-icon" name="shield" /></PageHero>
      <section className="section shell certification-grid">
        <div>
          <SectionHeading eyebrow="How it works" title="Complete the course. Show your work." />
          <ol className="requirement-list"><li><span>01</span><div><h3>Finish every lesson</h3><p>Your progress is saved in your account.</p></div></li><li><span>02</span><div><h3>Submit your final project</h3><p>Show how you used the course in a practical task.</p></div></li><li><span>03</span><div><h3>Pass human review</h3><p>An assigned reviewer checks the project with the fixed EFBI rubric. One revision may be requested.</p></div></li><li><span>04</span><div><h3>Request your certificate</h3><p>Choose the public name, then an administrator checks and issues the verifiable credential.</p></div></li></ol>
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
  const [posts, setPosts] = useState<PublicBlogPost[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let active = true
    void loadPublishedPosts().then((next) => { if (active) { setPosts(next); setLoaded(true) } })
    return () => { active = false }
  }, [])
  const normalizedQuery = query.trim().toLowerCase()
  const featured = normalizedQuery ? undefined : posts.find((post) => post.featured) ?? posts[0]
  const filtered = useMemo(() => posts.filter((post) => post.postId !== featured?.postId && `${post.title} ${post.category} ${post.excerpt}`.toLowerCase().includes(normalizedQuery)), [featured?.postId, normalizedQuery, posts])
  const plannedFeatured = plannedBlogPosts[0]
  return (
    <>
      <PageHero eyebrow="EFBI blog" title="Ideas for learning and building." description="Simple guides, project lessons, and scholarship advice." className="page-hero--blog" />
      <section className="section shell">
        {!loaded && <p className="catalog-loading" role="status">Loading articles…</p>}
        {loaded && featured && <article className={`featured-post featured-post--${featured.tone}`}><div className="featured-post-art"><span>FEATURED / {String(featured.version).padStart(2, '0')}</span><strong>{featured.title}</strong><Icon name="spark" /></div><div><span className="article-tag">{featured.category}</span><p className="article-status">{featured.readingMinutes} min read</p><h2>{featured.title}</h2><p>{featured.excerpt}</p><Link className="text-arrow" to={`/blog/${featured.postId}`}>Read article <Icon name="arrow" /></Link></div></article>}
        {loaded && posts.length === 0 && !normalizedQuery && <article className="featured-post"><div className="featured-post-art"><span>FROM THE EFBI DESK</span><strong>Useful ideas are on the way.</strong><Icon name="spark" /></div><div><span className="article-tag">{plannedFeatured.category}</span><p className="article-status">Editorial preview</p><h2>{plannedFeatured.title}</h2><p>{plannedFeatured.excerpt}</p><button className="text-arrow" disabled>Coming soon <Icon name="arrow" /></button></div></article>}
        <div className="blog-toolbar"><div><p className="eyebrow-label">More from EFBI</p><h2>Latest articles</h2></div><label className="search-field"><span className="sr-only">Search articles</span><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles" /></label></div>
        {loaded && posts.length > 0 && filtered.length === 0 && <p className="blog-empty">{query ? 'No published article matches that search.' : 'More published articles will appear here.'}</p>}
        {loaded && posts.length > 0 && <div className="blog-grid blog-grid--refined">{filtered.map((post, index) => <article key={post.postId}><div className={`post-number post-number--${index + 2}`}>{String(index + 2).padStart(2, '0')}</div><span className="article-tag">{post.category}</span><h3>{post.title}</h3><p>{post.excerpt}</p><small>{post.readingMinutes} min read</small><Link className="text-arrow" to={`/blog/${post.postId}`}>Read article <Icon name="arrow" /></Link></article>)}</div>}
        {loaded && posts.length === 0 && <div className="blog-grid blog-grid--refined">{plannedBlogPosts.slice(1).filter((post) => `${post.title} ${post.category} ${post.excerpt}`.toLowerCase().includes(query.toLowerCase())).map((post, index) => <article key={post.title}><div className={`post-number post-number--${index + 2}`}>{String(index + 2).padStart(2, '0')}</div><span className="article-tag">{post.category}</span><h3>{post.title}</h3><p>{post.excerpt}</p><small>{post.status}</small></article>)}</div>}
      </section>
    </>
  )
}

function ArticleBody({ body }: { body: string }) {
  return <div className="article-body">{body.split(/\n{2,}/).map((block, index) => {
    const text = block.trim()
    if (!text) return null
    if (text.startsWith('### ')) return <h3 key={index}>{text.slice(4)}</h3>
    if (text.startsWith('## ')) return <h2 key={index}>{text.slice(3)}</h2>
    const lines = text.split('\n')
    if (lines.every((line) => line.startsWith('- '))) return <ul key={index}>{lines.map((line, lineIndex) => <li key={`${index}-${lineIndex}`}>{line.slice(2)}</li>)}</ul>
    return <p key={index}>{text}</p>
  })}</div>
}

export function BlogArticlePage() {
  const { postId } = useParams()
  const [resolved, setResolved] = useState<{ id: string; post: PublicBlogPost | null } | null>(null)
  useEffect(() => {
    if (!postId) return undefined
    let active = true
    void loadPublishedPost(postId).then((post) => { if (active) setResolved({ id: postId, post }) })
    return () => { active = false }
  }, [postId])
  if (!postId) return <Navigate to="/blog" replace />
  if (!resolved || resolved.id !== postId) return <main className="section shell" aria-live="polite">Loading article…</main>
  if (!resolved.post) return <Navigate to="/blog" replace />
  const post = resolved.post
  return <>
    <PageHero eyebrow={`${post.category} · ${post.readingMinutes} min read`} title={post.title} description={post.excerpt} className="page-hero--blog" />
    <article className="section shell article-page"><div className="article-byline"><span>By {post.authorName}</span><span>{post.publishedAt ? post.publishedAt.toLocaleDateString() : 'Published by EFBI'}</span><span>Release {post.version}</span></div><ArticleBody body={post.bodyMarkdown} /><footer><Link className="button button--outline" to="/blog">Back to the EFBI blog</Link></footer></article>
  </>
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
        <div><SectionHeading eyebrow="Get in touch" title="Choose what works for you" description="Our contact form is being rebuilt, so reach us directly." /><div className="contact-cards"><a href="mailto:efbi.academy@gmail.com"><Icon name="mail" /><span><small>Email</small><strong>efbi.academy@gmail.com</strong></span><Icon name="external" /></a><a href="tel:+251725520306"><Icon name="phone" /><span><small>Phone</small><strong>+251 725 520 306</strong></span><Icon name="external" /></a><a href="https://t.me/EFBI_Academy" target="_blank" rel="noreferrer"><Icon name="send" /><span><small>Telegram</small><strong>@EFBI_Academy</strong></span><Icon name="external" /></a><a href="https://t.me/+HhBFWhYdfChhYTlk" target="_blank" rel="noreferrer"><Icon name="users" /><span><small>Community</small><strong>Join the student group</strong></span><Icon name="external" /></a><Link to="/privacy"><Icon name="shield" /><span><small>Learner help</small><strong>Privacy & support</strong></span><Icon name="arrow" /></Link></div></div>
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

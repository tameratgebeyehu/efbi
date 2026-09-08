import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon } from './icons'

const navigation = [
  { to: '/programs', label: 'Programs' },
  { to: '/courses', label: 'Courses' },
  { to: '/certification', label: 'Certificates' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
]

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link className={footer ? 'brand brand--footer' : 'brand'} to="/" aria-label="EFBI Academy home">
      <img src="/efbi-icon.png" width={footer ? 44 : 46} height={footer ? 44 : 46} alt="" />
      <span className="brand-copy">
        <strong>EFBI</strong>
        <small>Academy</small>
      </span>
    </Link>
  )
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const section = ({ programs: 'Programs', courses: 'Courses', certification: 'Certification', verify: 'Verify Certificate', blog: 'Blog', about: 'About', contact: 'Contact', join: 'Join Academy', signin: 'Student Sign In' } as Record<string, string>)[location.pathname.split('/')[1] ?? '']
    document.title = section ? ` | EFBI Academy` : 'EFBI Academy — Build skills that move Ethiopia forward'
  }, [location.pathname])

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="national-accent" aria-hidden="true"><span /><span /><span /></div>

      <header className="site-header">
        <div className="header-inner">
          <Brand />

          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} />
            <span className="sr-only">{menuOpen ? 'Close navigation' : 'Open navigation'}</span>
          </button>

          <nav id="primary-navigation" className={menuOpen ? 'primary-nav is-open' : 'primary-nav'} aria-label="Primary navigation">
            <div className="nav-links">
              {navigation.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'is-active' : undefined}>{item.label}</NavLink>
              ))}
              <NavLink to="/contact" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'mobile-only is-active' : 'mobile-only'}>Contact</NavLink>
              <NavLink to="/verify" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'mobile-only is-active' : 'mobile-only'}>Verify certificate</NavLink>
            </div>
            <div className="mobile-nav-actions">
              <Link className="button button--ghost" to="/signin" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link className="button button--primary" to="/join" onClick={() => setMenuOpen(false)}>Join Academy <Icon name="arrow" /></Link>
            </div>
          </nav>

          <div className="header-actions">
            <Link className="verify-link" to="/verify"><Icon name="shield" /> Verify</Link>
            <Link className="signin-link" to="/signin">Sign in</Link>
            <Link className="button button--primary button--compact" to="/join">Join Academy</Link>
          </div>
        </div>
      </header>

      <main id="main-content"><Outlet /></main>

      <footer className="site-footer">
        <div className="footer-main shell">
          <div className="footer-intro">
            <Brand footer />
            <p>Free, practical technology and leadership learning for Ethiopia's next generation of builders.</p>
            <div className="social-links" aria-label="EFBI contact shortcuts">
              <a href="https://t.me/EFBI_Academy" target="_blank" rel="noreferrer" aria-label="EFBI Telegram channel"><Icon name="send" /></a>
              <a href="https://t.me/+HhBFWhYdfChhYTlk" target="_blank" rel="noreferrer" aria-label="EFBI student community"><Icon name="users" /></a>
              <a href="mailto:efbi.academy@gmail.com" aria-label="Email EFBI"><Icon name="mail" /></a>
              <a href="tel:+251725520306" aria-label="Call EFBI"><Icon name="phone" /></a>
            </div>
          </div>

          <div className="footer-column">
            <h2>Quick links</h2>
            <Link to="/">Home</Link>
            <Link to="/courses">Explore courses</Link>
            <Link to="/certification">Certification</Link>
            <Link to="/verify">Verify certificate</Link>
            <Link to="/blog">Technology blog</Link>
          </div>

          <div className="footer-column">
            <h2>Our programs</h2>
            <Link to="/programs">Artificial Intelligence</Link>
            <Link to="/programs">App Development</Link>
            <Link to="/programs">Web Development</Link>
            <Link to="/programs">Programming Foundations</Link>
            <Link to="/programs">Leadership & Career</Link>
          </div>

          <div className="footer-column footer-contact">
            <h2>Contact</h2>
            <span><Icon name="map" /> Addis Ababa, Ethiopia</span>
            <a href="mailto:efbi.academy@gmail.com"><Icon name="mail" /> efbi.academy@gmail.com</a>
            <a href="tel:+251725520306"><Icon name="phone" /> +251 725 520 306</a>
            <a href="https://t.me/EFBI_Academy" target="_blank" rel="noreferrer"><Icon name="send" /> Telegram channel</a>
          </div>
        </div>

        <div className="footer-bottom shell">
          <p>© 2026 Ethiopian Future Builders Initiative Academy.</p>
          <div><Link to="/about">Our standards</Link><Link to="/contact">Contact</Link><span className="status-dot">Platform rebuild in progress</span></div>
        </div>
      </footer>
    </div>
  )
}

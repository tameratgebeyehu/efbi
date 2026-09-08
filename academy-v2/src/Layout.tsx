import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon } from './icons'
import { AccountActions } from './auth'
import './refinement.css'

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
      <img src="/efbi-icon.png" width={footer ? 42 : 46} height={footer ? 42 : 46} alt="" />
      <span className="brand-copy"><strong>EFBI</strong><small>Academy</small></span>
    </Link>
  )
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const section = ({ programs: 'Programs', courses: 'Courses', certification: 'Certification', verify: 'Verify Certificate', blog: 'Blog', about: 'About', contact: 'Contact', join: 'Join Academy', signin: 'Student Sign In' } as Record<string, string>)[location.pathname.split('/')[1] ?? '']
    document.title = section ? `${section} | EFBI Academy` : 'EFBI Academy — Learn. Build. Lead.'
  }, [location.pathname])

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="national-accent" aria-hidden="true"><span /><span /><span /></div>

      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((value) => !value)}>
            <Icon name={menuOpen ? 'x' : 'menu'} />
            <span className="sr-only">{menuOpen ? 'Close navigation' : 'Open navigation'}</span>
          </button>
          <nav id="primary-navigation" className={menuOpen ? 'primary-nav is-open' : 'primary-nav'} aria-label="Primary navigation">
            <div className="nav-links">
              {navigation.map((item) => <NavLink key={item.to} to={item.to} onClick={closeMenu} className={({ isActive }) => isActive ? 'is-active' : undefined}>{item.label}</NavLink>)}
              <NavLink to="/contact" onClick={closeMenu} className={({ isActive }) => isActive ? 'mobile-only is-active' : 'mobile-only'}>Contact</NavLink>
              <NavLink to="/verify" onClick={closeMenu} className={({ isActive }) => isActive ? 'mobile-only is-active' : 'mobile-only'}>Verify certificate</NavLink>
            </div>
            <AccountActions mobile onNavigate={closeMenu} />
          </nav>
          <div className="header-actions">
            <Link className="verify-link" to="/verify"><Icon name="shield" /> Verify</Link>
            <AccountActions />
          </div>
        </div>
      </header>

      <main id="main-content"><Outlet /></main>

      <footer className="site-footer">
        <div className="footer-main shell">
          <div className="footer-intro">
            <Brand footer />
            <p>Free, practical learning for young Ethiopian builders.</p>
            <div className="social-links" aria-label="EFBI contact shortcuts">
              <a href="https://t.me/EFBI_Academy" target="_blank" rel="noreferrer" aria-label="EFBI Telegram channel"><Icon name="send" /></a>
              <a href="https://t.me/+HhBFWhYdfChhYTlk" target="_blank" rel="noreferrer" aria-label="EFBI student community"><Icon name="users" /></a>
              <a href="mailto:efbi.academy@gmail.com" aria-label="Email EFBI"><Icon name="mail" /></a>
            </div>
          </div>

          <div className="footer-column">
            <h2>Quick links</h2>
            <Link to="/courses">Courses</Link>
            <Link to="/certification">Certificates</Link>
            <Link to="/verify">Verify</Link>
            <Link to="/blog">Blog</Link>
          </div>

          <div className="footer-column">
            <h2>Programs</h2>
            <Link to="/programs">Artificial Intelligence</Link>
            <Link to="/programs">App Development</Link>
            <Link to="/programs">Web & Mobile</Link>
            <Link to="/programs">Leadership & Career</Link>
          </div>

          <div className="footer-column footer-contact">
            <h2>Contact</h2>
            <span><Icon name="map" /> Addis Ababa, Ethiopia</span>
            <a href="mailto:efbi.academy@gmail.com"><Icon name="mail" /> efbi.academy@gmail.com</a>
            <a href="tel:+251725520306"><Icon name="phone" /> +251 725 520 306</a>
            <Link to="/contact"><Icon name="arrow" /> Contact EFBI</Link>
          </div>
        </div>

        <div className="footer-bottom shell">
          <p>© 2026 Ethiopian Future Builders Initiative Academy.</p>
          <p>Learn. Build. Lead.</p>
        </div>
      </footer>
    </div>
  )
}

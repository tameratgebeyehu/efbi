/* ==========================================================================
   Ethiopian Future Builders Initiative (EFBI) - Main Application Logic
   ========================================================================== */

// 1. STATE & THEME STATE
const state = {
  theme: localStorage.getItem('theme') || 'dark',
  activeAdminTab: 'admin-analytics',
  charts: {
    monthlyRegs: null,
    coursePopularity: null
  }
};

/* ==========================================================================
   ERROR MESSAGE SANITIZATION HELPER
   ========================================================================== */
function getFriendlyErrorMessage(err, action) {
  const isAdmin = localStorage.getItem('efbi_admin_session') !== null || sessionStorage.getItem('efbi_admin_session') !== null;

  if (!err) {
    if (action === 'student-login' || action === 'admin-login') {
      return 'Incorrect email or password. Please try again.';
    }
    if (action === 'student-registration') {
      return 'Unable to create your account. Please try again.';
    }
    return 'Something went wrong. Please try again in a few moments.';
  }

  const msg = (err.message || String(err)).trim();
  const msgLower = msg.toLowerCase();

  // Administrators should see the direct technical message so they can debug Apps Script / Sheet problems,
  // but mask out full URL endpoints for general safety.
  if (isAdmin) {
    return msg.replace(/https:\/\/script\.google\.com[^\s]*/gi, '[Apps Script URL]');
  }

  // If it is a connection/technical/database error pattern, clean it up.
  const isTechnical = 
    msgLower.includes('google') ||
    msgLower.includes('sheet') ||
    msgLower.includes('script') ||
    msgLower.includes('backend') ||
    msgLower.includes('connection') ||
    msgLower.includes('fetch') ||
    msgLower.includes('network') ||
    msgLower.includes('http') ||
    msgLower.includes('cors') ||
    msgLower.includes('failed') ||
    msgLower.includes('reach') ||
    msgLower.includes('remote') ||
    msgLower.includes('database') ||
    msgLower.includes('transaction') ||
    msgLower.includes('server') ||
    msgLower.includes('api') ||
    msgLower.includes('error');

  if (action === 'student-login' || action === 'admin-login') {
    if (msgLower.includes('incorrect password') || msgLower.includes('incorrect email') || msgLower.includes('no account found') || msgLower.includes('invalid username') || msgLower.includes('authentication failed')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (isTechnical) {
      return 'Unable to sign in. Please try again later.';
    }
    return 'Incorrect email or password. Please try again.';
  }

  if (action === 'student-registration') {
    if (msgLower.includes('already exists') || msgLower.includes('already been registered')) {
      return 'This email has already been registered.';
    }
    if (isTechnical) {
      return 'Unable to create your account. Please try again.';
    }
    return 'Unable to create your account. Please try again.';
  }

  if (action === 'profile-update') {
    if (msgLower.includes('must be at least') || msgLower.includes('do not match')) {
      return msg;
    }
    return 'Something went wrong. Please try again in a few moments.';
  }

  // Fallback for general actions for students/guests
  return 'Something went wrong. Please try again in a few moments.';
}

// 2. DOCUMENT READY ENTRY POINT
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();
  
  // Theme Setup
  initTheme();
  
  // Navigation & Router Setup
  initRouter();
  
  // Mobile Hamburger Menu Setup
  initMobileNav();
  
  // Stats Counters
  initStatsCounters();
  
  // Testimonials Carousel Slider
  initStoriesCarousel();
  
  // Auto-connect to Google Sheets on load, then render live course data
  autoDetectAndConnect().then(() => {
    renderPublicCourses();
    updateConnectionStatusBadge();
  });

  // Course Page Catalog Search & Filter
  initCourseCatalog();
  
  // Certificate Preview Generator
  initCertificatePreview();
  
  // Certificate Verifier Engine
  initCertificateVerifier();
  
  // Certificate Viewer Modal
  initCertificateViewer();
  
  // Application Registration Form Setup
  initRegistrationForm();
  
  // Blog Filter
  initBlogFilter();
  
  // Contact Form Setup
  initContactForm();
  
  // Admin Dashboard Tabs & Table population
  initAdminDashboard();
  
  // Admin Authentication Gate
  initAdminAuth();
  
  // Student Authentication Gate
  initStudentAuth();
  
  // Check Database Connection Status on load
  checkDatabaseConnection();

  // Sync homepage stats with live data (non-blocking)
  syncHomepageStats();

  // Run Hero IDE visual typewriter typing animation
  initHeroVisualAnimation();

  // Init all new feature modals & panels
  initAddStudentModal();
  initIssueCertModal();
  initStudentDetailModal();
  initAdminNotificationsPanel();
  initAdminMessagesPanel();
  initCsvExport();
  initQuizSystem();
});

/* ==========================================================================
   ADMIN AUTHENTICATION GATE
   ========================================================================== */

const ADMIN_SESSION_KEY = 'efbi_admin_session';

function initAdminAuth() {
  const loginGate      = document.getElementById('admin-login-gate');
  const mainLayout     = document.getElementById('admin-main-layout');
  const loginForm      = document.getElementById('admin-login-form');
  const loginError     = document.getElementById('admin-login-error');
  const loginBtn       = document.getElementById('admin-login-btn');
  const logoutBtn      = document.getElementById('btn-admin-logout');

  if (!loginGate) return;

  // Check if already authenticated in this session
  function applyAuthState() {
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (session) {
      loginGate.style.display  = 'none';
      mainLayout.style.display = '';
    } else {
      loginGate.style.display  = 'flex';
      mainLayout.style.display = 'none';
    }
  }

  applyAuthState();

  // Also re-check when navigating to #admin
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') {
      applyAuthState();
    }
  });

  // Handle login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();

    if (!username || !password) {
      loginError.textContent = 'Please enter both username and password.';
      loginError.style.display = 'block';
      return;
    }

    loginError.style.display = 'none';
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i data-lucide="loader" class="spin-animation" style="width:14px;"></i> Signing in...';
    lucide.createIcons();

    try {
      const result = await EFBIDatabase.request('verifyAdmin', { username, password });

      if (result && result.authenticated) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ username: result.username, role: result.role }));
        loginGate.style.display  = 'none';
        mainLayout.style.display = '';
        // Load dashboard data
        renderAdminTables();
        renderAdminCharts();
        checkDatabaseConnection(true);
        showToast(`Welcome back, ${result.username}! 👋`, 'success');
      } else {
        throw new Error('Authentication failed.');
      }
    } catch (err) {
      loginError.textContent = getFriendlyErrorMessage(err, 'admin-login');
      loginError.style.display = 'block';
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i data-lucide="log-in" style="width:16px;"></i> Sign In to Dashboard';
      lucide.createIcons();
    }
  });

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      loginGate.style.display  = 'flex';
      mainLayout.style.display = 'none';
      document.getElementById('admin-username').value = '';
      document.getElementById('admin-password').value = '';
      showToast('Logged out successfully.', 'success');
    });
  }
}

/* ==========================================================================
   HOMEPAGE STATS SYNC — Pull real counts from Google Sheet
   ========================================================================== */
async function syncHomepageStats() {
  try {
    const [students, certificates] = await Promise.all([
      EFBIDatabase.request('getStudents'),
      EFBIDatabase.request('getCertificates')
    ]);

    const totalStudents = students.length;
    const totalCerts = certificates.length;
    const totalProjects = Math.max(students.filter(s => s.status === 'Approved').length * 2, 12);

    // Update animated counter targets with live data
    const studentsEl = document.getElementById('homepage-stat-students');
    const certsEl = document.getElementById('homepage-stat-certs');
    const projectsEl = document.getElementById('homepage-stat-projects');

    if (studentsEl) studentsEl.setAttribute('data-target', totalStudents);
    if (certsEl) certsEl.setAttribute('data-target', totalCerts);
    if (projectsEl) projectsEl.setAttribute('data-target', totalProjects);

    // Re-run the counters with updated targets
    initStatsCounters();
  } catch (err) {
    console.info('Homepage stats using default targets:', err.message);
    // Re-run the counters with default targets
    initStatsCounters();
  }
}

/* ==========================================================================
   DATABASE STATUS MONITOR
   ========================================================================== */
async function checkDatabaseConnection(showToasts = false) {
  const badge = document.getElementById('db-status-badge');
  const result = await EFBIDatabase.testConnection();

  if (result.status === 'connected') {
    if (badge) {
      badge.className = 'status-badge verified';
      badge.innerHTML = '<i data-lucide="shield-check" style="width: 12px; height: 12px;"></i> Live Google Sheets Connected';
    }
    // Auto-activate live mode when connection confirmed
    if (localStorage.getItem('efbi_sync_mode') !== 'live') {
      localStorage.setItem('efbi_sync_mode', 'live');
    }
    if (showToasts) showToast('Live Google Sheets Database Connected!', 'success');
  } else if (result.status === 'error') {
    if (badge) {
      badge.className = 'status-badge inactive';
      badge.innerHTML = '<i data-lucide="alert-triangle" style="width: 12px; height: 12px;"></i> Connection Error';
    }
    if (showToasts) showToast(result.message, 'error');
  } else {
    if (badge) {
      badge.className = 'status-badge pending';
      badge.innerHTML = '<i data-lucide="database" style="width: 12px; height: 12px;"></i> Offline Sandbox Mode';
    }
  }
  lucide.createIcons();
  updateConnectionStatusBadge();
}

// Update the navbar live/local connection indicator
function updateConnectionStatusBadge() {
  const mode = (typeof getActiveSyncMode === 'function')
    ? getActiveSyncMode()
    : (localStorage.getItem('efbi_sync_mode') || 'live');
  const el = document.getElementById('global-sync-badge');
  if (!el) return;
  if (mode === 'live') {
    el.className = 'global-sync-badge live';
    el.innerHTML = '<span class="sync-dot"></span> Live';
    el.title = 'Connected to Google Sheets — syncing in real time';
  } else {
    el.className = 'global-sync-badge sandbox';
    el.innerHTML = '<span class="sync-dot"></span> Local';
    el.title = 'Offline sandbox — data stored locally only';
  }
}

/* ==========================================================================
   THEME MANAGER
   ========================================================================== */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', state.theme);
  
  themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    showToast(`Switched to ${state.theme === 'dark' ? 'Dark' : 'Light'} Mode`, 'success');
    
    // Update charts styling to match new theme
    updateAdminChartsTheme();
  });
}

/* ==========================================================================
   CLIENT-SIDE ROUTER
   ========================================================================== */
function initRouter() {
  const handleRouting = () => {
    const hash = window.location.hash || '#home';

    // Handle dynamic learning route: #learning/<courseId>/<moduleIdx>
    const learningMatch = hash.match(/^#learning\/([^/]+)\/(\d+)$/);
    if (learningMatch) {
      const courseId   = learningMatch[1];
      const moduleIdx  = parseInt(learningMatch[2]) || 0;

      const views = document.querySelectorAll('.router-view');
      views.forEach(view => {
        if (view.id === 'learning-view') {
          view.classList.add('active');
        } else {
          view.classList.remove('active');
        }
      });

      // Immersive mode: hide navbar/footer via CSS class
      document.body.classList.add('learning-mode');

      syncNavigationLinks('my-courses');
      window.scrollTo({ top: 0, behavior: 'instant' });
      renderLearningPage(courseId, moduleIdx);
      return;
    }

    // Handle dynamic verify route: #verify/<certId>
    const verifyMatch = hash.match(/^#verify\/([^/]+)$/);
    if (verifyMatch) {
      const certId = verifyMatch[1].toUpperCase();

      const views = document.querySelectorAll('.router-view');
      views.forEach(view => {
        if (view.id === 'verify-view') {
          view.classList.add('active');
        } else {
          view.classList.remove('active');
        }
      });

      const header = document.querySelector('header.navbar');
      const footer = document.querySelector('footer.footer');
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';

      syncNavigationLinks('verify');
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Auto-trigger verification search
      const input = document.getElementById('cert-id-input');
      if (input) {
        input.value = certId;
        const verifyBtn = document.getElementById('btn-verify-cert');
        if (verifyBtn) {
          setTimeout(() => verifyBtn.click(), 100);
        }
      }
      return;
    }

    const viewId = hash.substring(1) + '-view';
    
    // Find all views
    const views = document.querySelectorAll('.router-view');
    let viewFound = false;
    
    views.forEach(view => {
      if (view.id === viewId) {
        view.classList.add('active');
        viewFound = true;
      } else {
        view.classList.remove('active');
      }
    });
    
    // Fallback if view doesn't exist
    if (!viewFound) {
      document.getElementById('home-view').classList.add('active');
      window.location.hash = '#home';
    }
    
    // Sync Navigation highlights
    syncNavigationLinks(hash.substring(1));
    
    // Scroll window to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Remove learning immersive mode when leaving learning view
    document.body.classList.remove('learning-mode');

    // Hide/Show public header & footer for Admin back-office isolation
    const header = document.querySelector('header.navbar');
    const footer = document.querySelector('footer.footer');
    if (hash === '#admin') {
      if (header) header.style.display = 'none';
      if (footer) footer.style.display = 'none';
    } else {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
    }
    
    // Special Init routines for specific pages
    if (hash === '#admin') {
      const isAdminLoggedIn = sessionStorage.getItem('efbi_admin_session');
      if (isAdminLoggedIn) {
        renderAdminTables();
        renderAdminCharts();
        checkDatabaseConnection(true); // Check connection status on entering admin (admin gets toasts)
      } else {
        checkDatabaseConnection(false); // Silent connection status check on admin login gate page
      }
    } else if (hash === '#profile') {
      renderStudentDashboard();
    } else if (hash === '#courses' || hash === '#register') {
      renderPublicCourses();
    } else if (hash === '#my-courses') {
      renderMyCourses();
    }
  };

  // Intercept nav links clicks to trigger SPA routes smoothly
  document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a[data-view]');
    if (targetLink) {
      const view = targetLink.getAttribute('data-view');
      window.location.hash = view;
      e.preventDefault();
    }
  });

  // Listen to hash changes
  window.addEventListener('hashchange', handleRouting);
  
  // Trigger initial routing
  handleRouting();
}

function syncNavigationLinks(activeView) {
  // Sync Desktop / Mobile links
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    const view = link.getAttribute('data-view');
    const parentLi = link.closest('.nav-item');
    if (view === activeView) {
      parentLi.classList.add('active');
    } else {
      parentLi.classList.remove('active');
    }
  });
}

/* ==========================================================================
   MOBILE NAVIGATION MENU DRAWER
   ========================================================================== */
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
  });

  // Close mobile drawer when link is clicked
  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('active');
      hamburger.classList.remove('active');
    }
  });
}

/* ==========================================================================
   ANIMATED VIEWPORT STATISTICS COUNTERS
   ========================================================================== */
function initStatsCounters() {
  const statsSection = document.getElementById('stats-section');
  const statNumbers = document.querySelectorAll('.stat-number');
  
  const countUp = (element) => {
    // Clear any active interval on this element to prevent conflicts
    if (element.dataset.intervalId) {
      clearInterval(parseInt(element.dataset.intervalId));
    }

    const target = parseInt(element.getAttribute('data-target')) || 0;
    if (target <= 0) {
      element.innerHTML = '0<span>+</span>';
      return;
    }

    const duration = 2000; // 2 seconds counting duration
    const stepTime = Math.max(Math.floor(duration / target), 15);
    let current = 0;
    
    const timer = setInterval(() => {
      const increment = Math.ceil(target / (duration / stepTime));
      current += increment;
      if (current >= target) {
        element.innerHTML = target + '<span>+</span>';
        clearInterval(timer);
        delete element.dataset.intervalId;
      } else {
        element.innerHTML = current + '<span>+</span>';
      }
    }, stepTime);

    element.dataset.intervalId = timer;
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statNumbers.forEach(num => countUp(num));
        // Unobserve to trigger only once per scroll view
        observer.unobserve(statsSection);
      }
    });
  }, { threshold: 0.1 });

  if (statsSection) {
    observer.observe(statsSection);
  }
}

/* ==========================================================================
   SUCCESS STORIES TESTIMONIAL CAROUSEL SLIDER
   ========================================================================== */
function initStoriesCarousel() {
  const track = document.getElementById('stories-track');
  const prevBtn = document.getElementById('prev-story');
  const nextBtn = document.getElementById('next-story');
  const dotsContainer = document.getElementById('slider-dots');
  const slides = document.querySelectorAll('.story-slide');
  
  if (!track || slides.length === 0) return;
  
  let currentIndex = 0;
  let autoPlayTimer;

  // Create dot paginators dynamically
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.classList.add('slider-dot');
    if (idx === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      goToSlide(idx);
      resetAutoPlay();
    });
    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll('.slider-dot');

  const goToSlide = (index) => {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    
    currentIndex = index;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Update active dot
    dots.forEach((dot, idx) => {
      if (idx === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  };

  const nextSlide = () => {
    goToSlide(currentIndex + 1);
  };

  const prevSlide = () => {
    goToSlide(currentIndex - 1);
  };

  // Nav buttons click listeners
  prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoPlay();
  });

  nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoPlay();
  });

  // Autoplay setup
  const startAutoPlay = () => {
    autoPlayTimer = setInterval(nextSlide, 6000);
  };

  const resetAutoPlay = () => {
    clearInterval(autoPlayTimer);
    startAutoPlay();
  };

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoPlayTimer));
  track.addEventListener('mouseleave', startAutoPlay);

  startAutoPlay();
}

/* ==========================================================================
   DYNAMIC PUBLIC COURSES CATALOG RENDERING
   ========================================================================== */
async function renderPublicCourses() {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;

  try {
    const courses = await EFBIDatabase.request('getCourses');
    const published = courses.filter(c => c.status && c.status.toLowerCase() === 'published');
    
    // Populate the registration dropdown interests select options
    populateRegistrationInterests(courses);

    if (published.length === 0) {
      grid.className = '';
      grid.innerHTML = `
        <div class="courses-empty-state" id="courses-empty-state">
          <div class="courses-empty-icon" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2);">
            <i data-lucide="book-x" style="color: var(--danger);"></i>
          </div>
          <h3 class="courses-empty-title">No courses available</h3>
          <p class="courses-empty-desc">No technical pathways are currently published. Please check back later or register to get notified of updates.</p>
        </div>
      `;
      // Hide empty sections / catalog controls
      const filterSection = document.querySelector('#courses-view .catalog-controls');
      if (filterSection) filterSection.style.display = 'none';
    } else {
      // Show catalog controls if courses exist
      const filterSection = document.querySelector('#courses-view .catalog-controls');
      if (filterSection) filterSection.style.display = 'flex';

      const studentSession = localStorage.getItem('efbi_student_session');
      let enrolledCourse = null;
      if (studentSession) {
        try {
          const student = JSON.parse(studentSession);
          enrolledCourse = (student.interest || '').trim().toLowerCase();
        } catch (e) {
          console.warn('Could not parse student session:', e);
        }
      }

      grid.className = 'grid-3';
      grid.innerHTML = published.map(course => {
        const isEnrolled = enrolledCourse && enrolledCourse === course.title.trim().toLowerCase();
        const actionButton = isEnrolled 
          ? `<button class="btn btn-secondary btn-block" style="display: block; text-align: center; width: 100%; cursor: not-allowed;" disabled>Enrolled</button>`
          : `<a href="${studentSession ? '#' : '#register'}" class="btn btn-primary btn-block btn-enroll" data-course="${course.title}" style="display: block; text-align: center;">Enroll Now</a>`;

        return `
          <div class="course-card glass-panel" data-level="${course.level || 'Beginner'}">
            <div class="course-img-box">
              <i data-lucide="${course.icon || 'book-open'}"></i>
              <span class="course-badge">${course.category}</span>
            </div>
            <div class="course-body">
              <span class="course-instructor">${course.instructor}</span>
              <h3 class="course-title">${course.title}</h3>
              <p class="course-desc">${course.shortDesc}</p>
              <div class="course-details">
                <span class="course-lessons"><i data-lucide="book-open" style="width: 14px;"></i> ${course.modules} Modules</span>
                <span class="course-duration"><i data-lucide="clock" style="width: 14px;"></i> ${course.duration}</span>
              </div>
              <div class="course-action">
                ${actionButton}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    lucide.createIcons();
  } catch (err) {
    console.error('Error loading public courses:', err);
  }
}

/* ==========================================================================
   DYNAMIC STUDENT ENROLLED COURSES (MY COURSES)
   ========================================================================== */
async function renderMyCourses() {
  const session = localStorage.getItem(STUDENT_SESSION_KEY);
  if (!session) {
    window.location.hash = '#home';
    return;
  }

  const grid = document.getElementById('my-courses-grid');
  const loading = document.getElementById('my-courses-loading');
  const welcomeEl = document.getElementById('my-courses-welcome');
  if (!grid) return;

  if (loading) loading.style.display = 'block';
  grid.innerHTML = '';

  try {
    const student = JSON.parse(session);
    if (welcomeEl && student.name) {
      const firstName = student.name.trim().split(' ')[0];
      welcomeEl.textContent = `Welcome back, ${firstName}! Pick up where you left off and stay on your path to certification.`;
    }
    
    // Check if the student actually has an enrolled course pathway
    if (!student.interest || student.interest.trim() === '') {
      if (loading) loading.style.display = 'none';
      renderMyCoursesEmptyState(grid);
      return;
    }

    // Silently sync progress from backend
    await syncProgressWithBackend(student.email);

    // Load courses using in-memory cache
    if (!_cachedCourses) {
      _cachedCourses = await EFBIDatabase.request('getCourses');
    }
    const matchedCourse = _cachedCourses.find(c => c.title.toLowerCase().trim() === student.interest.toLowerCase().trim());

    if (!matchedCourse) {
      if (loading) loading.style.display = 'none';
      renderMyCoursesEmptyState(grid);
      return;
    }

    // Get lessons for this course to determine progress and resume index
    const lessons = await getLessonsForCourse(matchedCourse);
    const totalModules = lessons.length;
    
    // Calculate progress from local storage / cookies
    const completedIndices = getLocalProgress(student.email);
    const completedCount = completedIndices.filter(idx => idx < totalModules).length;
    const progressPct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    // Find the first uncompleted lesson to resume learning
    let resumeIdx = 0;
    for (let i = 0; i < totalModules; i++) {
      if (!completedIndices.includes(i)) {
        resumeIdx = i;
        break;
      }
    }

    if (loading) loading.style.display = 'none';

    // Last activity date
    const activityKey = 'efbi_activity_' + student.email.replace(/[^a-zA-Z0-9]/g, '_');
    let lastActivityDate = localStorage.getItem(activityKey);
    if (!lastActivityDate) {
      lastActivityDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      localStorage.setItem(activityKey, lastActivityDate);
    }

    // SVG ring values (circ = 2π × 36 ≈ 226.2)
    const circ    = 226.2;
    const offset  = circ - (circ * progressPct / 100);
    const ringColor = progressPct >= 100 ? '#10b981' : progressPct >= 50 ? '#6366f1' : '#818cf8';
    const certStatus = progressPct >= 100
      ? `<span style="color:#34d399;font-weight:800;display:inline-flex;align-items:center;gap:5px;"><i data-lucide="award" style="width:13px;height:13px;"></i> Certificate Unlocked!</span>`
      : `<span style="color:rgba(255,255,255,0.35);font-size:0.78rem;">Complete all lessons to unlock your certificate</span>`;

    // Build lesson preview list (first 6)
    const previewLessons = lessons.slice(0, 6);
    const lessonRows = previewLessons.map((l, i) => {
      const done   = completedIndices.includes(i);
      const active = i === resumeIdx && !done;
      const icon   = done ? 'check-circle-2' : active ? 'play-circle' : 'circle';
      const color  = done ? '#34d399' : active ? '#818cf8' : 'rgba(255,255,255,0.2)';
      return `
        <a href="#learning/${matchedCourse.id}/${i}" class="mc-lesson-row ${done ? 'done' : active ? 'active' : ''}">
          <i data-lucide="${icon}" style="width:15px;height:15px;color:${color};flex-shrink:0;"></i>
          <span class="mc-lesson-row-title">${l.title}</span>
          ${done ? '<span class="mc-lesson-row-badge">Done</span>' : active ? '<span class="mc-lesson-row-badge active">Resume</span>' : ''}
        </a>`;
    }).join('');

    const moreCount = lessons.length - previewLessons.length;

    grid.innerHTML = `
      <div class="mc-dashboard">

        <!-- Top hero banner -->
        <div class="mc-hero">
          <div class="mc-hero-left">
            <div class="mc-course-icon">
              <i data-lucide="${matchedCourse.icon || 'book-open'}" style="width:32px;height:32px;"></i>
            </div>
            <div class="mc-hero-info">
              <div class="mc-enrolled-tag">
                <i data-lucide="check-circle" style="width:11px;height:11px;"></i> Enrolled Pathway
              </div>
              <h2 class="mc-course-name">${matchedCourse.title}</h2>
              <div class="mc-course-meta">
                <i data-lucide="user" style="width:12px;height:12px;"></i>
                ${matchedCourse.instructor || 'EFBI Faculty'}
                &nbsp;·&nbsp;
                <i data-lucide="layers" style="width:12px;height:12px;"></i>
                ${totalModules} Lessons
              </div>
            </div>
          </div>

          <!-- SVG Progress Ring -->
          <div class="mc-ring-wrap">
            <svg width="90" height="90" viewBox="0 0 90 90" style="transform:rotate(-90deg);">
              <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="7"/>
              <circle cx="45" cy="45" r="36" fill="none"
                stroke="${ringColor}" stroke-width="7" stroke-linecap="round"
                stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
                style="transition:stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1);"/>
            </svg>
            <div class="mc-ring-text">
              <div class="mc-ring-pct">${progressPct}%</div>
            </div>
          </div>
        </div>

        <!-- Stat chips row -->
        <div class="mc-stats-row">
          <div class="mc-stat-chip">
            <i data-lucide="check-square" style="width:14px;height:14px;color:#34d399;"></i>
            <span><strong>${completedCount}</strong> Completed</span>
          </div>
          <div class="mc-stat-chip">
            <i data-lucide="layers" style="width:14px;height:14px;color:#818cf8;"></i>
            <span><strong>${totalModules - completedCount}</strong> Remaining</span>
          </div>
          <div class="mc-stat-chip">
            <i data-lucide="calendar" style="width:14px;height:14px;color:#fbbf24;"></i>
            <span>Active: ${lastActivityDate}</span>
          </div>
        </div>

        <!-- Certificate status -->
        <div class="mc-cert-bar">
          <i data-lucide="${progressPct >= 100 ? 'award' : 'lock'}" style="width:14px;height:14px;"></i>
          ${progressPct >= 100
            ? '<span style="color:#34d399;font-weight:800;">Certificate Unlocked! 🎉 Download yours from your profile.</span>'
            : `<span>Complete all <strong>${totalModules}</strong> lessons to unlock your certificate</span>`}
        </div>

        <!-- Progress bar -->
        <div class="mc-progress-track">
          <div class="mc-progress-fill" style="width:${progressPct}%;background:linear-gradient(90deg,${ringColor},#34d399);"></div>
        </div>

        <!-- CTA Button -->
        <a href="#learning/${matchedCourse.id}/${resumeIdx}" class="mc-cta-btn">
          <i data-lucide="${progressPct >= 100 ? 'refresh-cw' : 'play-circle'}" style="width:18px;height:18px;"></i>
          ${progressPct >= 100 ? 'Review Course' : progressPct > 0 ? `Continue — Lesson ${resumeIdx + 1}` : 'Start Learning'}
        </a>

        <!-- Lesson preview list -->
        <div class="mc-lesson-list">
          <div class="mc-lesson-list-header">
            <span>Course Content</span>
            <span>${completedCount} / ${totalModules} done</span>
          </div>
          ${lessonRows}
          ${moreCount > 0 ? `
            <a href="#learning/${matchedCourse.id}/${resumeIdx}" class="mc-lesson-more">
              + ${moreCount} more lesson${moreCount !== 1 ? 's' : ''} — view all inside the course
            </a>` : ''}
        </div>

      </div>
    `;
    lucide.createIcons();

  } catch (err) {
    if (loading) loading.style.display = 'none';
    console.error('Error rendering my courses:', err);
    grid.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 40px;">Unable to load your courses. Please try again later.</div>`;
  }
}


function renderMyCoursesEmptyState(container) {
  container.innerHTML = `
    <div class="mc-empty-state">
      <div class="mc-empty-icon">
        <i data-lucide="compass"></i>
      </div>
      <h3 class="mc-empty-title">Start Learning Today</h3>
      <p class="mc-empty-desc">You are not enrolled in any technical courses yet. Visit our courses catalog to find a pathway that matches your future goals.</p>
      <a href="#courses" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; margin-top: 8px;">
        <i data-lucide="search" style="width: 16px; height: 16px;"></i> Explore Courses
      </a>
    </div>
  `;
  lucide.createIcons();
}

/* ==========================================================================
   LEARNING PAGE — COOKIE & PROGRESS UTILITIES
   ========================================================================== */

// Cookie helpers (used for progress caching alongside localStorage)
function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

// Local progress key helpers (cookies + localStorage dual-write for resilience)
function getLocalProgress(email) {
  const key = 'efbi_completed_' + email.replace(/[^a-zA-Z0-9]/g, '_');
  // Try cookie first (persists beyond session), fall back to localStorage
  const cookieVal = getCookie('efbi_prog_' + email.replace(/[^a-zA-Z0-9]/g, '_'));
  if (cookieVal) {
    try {
      const parsed = JSON.parse(cookieVal);
      // Keep localStorage in sync
      localStorage.setItem(key, JSON.stringify(parsed));
      return parsed;
    } catch { /* fall through */ }
  }
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveLocalProgress(email, completedIndices) {
  const key    = 'efbi_completed_' + email.replace(/[^a-zA-Z0-9]/g, '_');
  const cKey   = 'efbi_prog_' + email.replace(/[^a-zA-Z0-9]/g, '_');
  const val    = JSON.stringify(completedIndices);
  localStorage.setItem(key, val);
  setCookie(cKey, val);
}

// Silently pull progress from backend and merge into local state
async function syncProgressWithBackend(email) {
  try {
    const rows = await EFBIDatabase.request('getProgress', { email });
    if (!Array.isArray(rows)) return;
    const completed = rows
      .filter(r => r.completed)
      .map(r => parseInt(r.moduleIdx));
    if (completed.length > 0) {
      const existing = getLocalProgress(email);
      const merged   = [...new Set([...existing, ...completed])];
      saveLocalProgress(email, merged);
    }
  } catch { /* silent — backend may be offline */ }
}

// Extract YouTube video ID from a URL (handles watch, short, embed, youtu.be formats)
function getYouTubeId(url) {
  if (!url || typeof url !== 'string') return '';
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /embed\/([A-Za-z0-9_-]{11})/,
    /shorts\/([A-Za-z0-9_-]{11})/
  ];
  for (const pat of patterns) {
    const m = url.match(pat);
    if (m) return m[1];
  }
  return '';
}

// In-memory cache for courses & lessons to eliminate UI navigation latency
let _cachedCourses = null;
let _cachedLessonsMap = {};

// Build a YouTube embed URL with options to minimize YouTube branding on student side
function buildYouTubeEmbedUrl(url) {
  const videoId = getYouTubeId(url);
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&enablejsapi=1`;
  }
  const plMatch = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (plMatch) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${plMatch[1]}&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&enablejsapi=1`;
  }
  return '';
}

// Build a list of lesson module objects for a course with caching
async function getLessonsForCourse(course) {
  if (_cachedLessonsMap[course.id]) {
    return _cachedLessonsMap[course.id];
  }

  try {
    const allLessons = await EFBIDatabase.request('getLessons');
    const courseId   = course.id;
    const matched    = allLessons.filter(l =>
      l.courseid && l.courseid.toString().trim() === courseId.toString().trim()
    );
    if (matched.length > 0) {
      const sorted = matched.sort((a, b) => a.moduleidx - b.moduleidx);
      _cachedLessonsMap[course.id] = sorted;
      return sorted;
    }
  } catch { /* fall through to placeholder */ }

  // Fallback: generate placeholder modules based on course.modules count
  const count = parseInt(course.modules) || 5;
  const placeholders = Array.from({ length: count }, (_, i) => ({
    courseid: course.id,
    moduleidx: i,
    title: i === 0
      ? `Module 1: Introduction to ${course.title}`
      : i === count - 1
        ? `Module ${i + 1}: Capstone & Final Assessment`
        : `Module ${i + 1}: Core Concepts Part ${i}`,
    videourl: '',
    notestext: 'Lesson notes will be available once your instructor uploads them.',
    resourceslinks: '',
    quizurl: ''
  }));
  _cachedLessonsMap[course.id] = placeholders;
  return placeholders;
}


/* ==========================================================================
   YOUTUBE IFRAME API — CUSTOM PLAYER CONTROLLER
   ========================================================================== */

// Global YT player instance (one player at a time)
let _ytPlayer        = null;
let _ytReady         = false;
let _ytProgressTimer = null;

/** Called by YouTube's IFrame API once it has fully loaded */
window.onYouTubeIframeAPIReady = function () {
  _ytReady = true;
};

/**
 * Extract bare YouTube video ID from any YT URL format.
 */
function getYouTubeVideoId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/**
 * Build all custom player controls HTML and inject into the wrapper.
 * Called once per lesson load.
 */
function buildPlayerControlsHTML() {
  return `
    <!-- Seek bar row -->
    <div class="lp-seek-container">
      <span class="lp-time-label" id="lp-time-current">0:00</span>
      <div class="lp-seek-bar" id="lp-seek-bar" title="Click to seek">
        <div class="lp-seek-fill" id="lp-seek-fill"></div>
        <div class="lp-seek-thumb" id="lp-seek-thumb"></div>
      </div>
      <span class="lp-time-label" id="lp-time-total">0:00</span>
    </div>
    <!-- Button row -->
    <div class="lp-controls-row">
      <div class="lp-controls-left">
        <button class="lp-ctrl-btn" id="lp-btn-play" title="Play / Pause (Space)">
          <i data-lucide="play" id="lp-play-icon" style="width:20px;height:20px;"></i>
        </button>
        <button class="lp-ctrl-btn" id="lp-btn-skip-back" title="Back 10s (J)">
          <i data-lucide="rotate-ccw" style="width:18px;height:18px;"></i>
          <span class="lp-skip-label">10</span>
        </button>
        <button class="lp-ctrl-btn" id="lp-btn-skip-fwd" title="Forward 10s (L)">
          <i data-lucide="rotate-cw" style="width:18px;height:18px;"></i>
          <span class="lp-skip-label">10</span>
        </button>
        <div class="lp-volume-group">
          <button class="lp-ctrl-btn" id="lp-btn-mute" title="Mute (M)">
            <i data-lucide="volume-2" id="lp-vol-icon" style="width:18px;height:18px;"></i>
          </button>
          <input type="range" class="lp-vol-slider" id="lp-vol-slider" min="0" max="100" value="100" title="Volume">
        </div>
      </div>
      <div class="lp-controls-right">
        <button class="lp-ctrl-btn" id="lp-btn-fullscreen" title="Fullscreen (F)">
          <i data-lucide="maximize-2" id="lp-fs-icon" style="width:18px;height:18px;"></i>
        </button>
      </div>
    </div>
  `;
}

/** Format seconds → M:SS */
function lpFmtTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Main player initializer. Called once per lesson.
 * @param {string} videoUrl  – raw YouTube URL from DB
 * @param {HTMLElement} placeholder – loading spinner element
 */
function initLearningVideoPlayer(videoUrl, placeholder) {
  const wrapper = document.getElementById('lp-video-wrapper');
  if (!wrapper) return;

  // Stop existing progress timer
  if (_ytProgressTimer) { clearInterval(_ytProgressTimer); _ytProgressTimer = null; }

  // Destroy old player if any
  if (_ytPlayer && typeof _ytPlayer.destroy === 'function') {
    try { _ytPlayer.destroy(); } catch { /* ignore */ }
    _ytPlayer = null;
  }

  const videoId = getYouTubeVideoId(videoUrl);

  // Inject custom controls into the wrapper (below the iframe/mount area)
  let ctrlsEl = document.getElementById('lp-player-controls');
  if (!ctrlsEl) {
    ctrlsEl = document.createElement('div');
    ctrlsEl.className = 'lp-player-controls';
    ctrlsEl.id = 'lp-player-controls';
    wrapper.insertAdjacentElement('afterend', ctrlsEl);
  }
  ctrlsEl.innerHTML = buildPlayerControlsHTML();

  // Update speed selector in topbar if present
  const speedSel = document.getElementById('lp-speed-select');
  if (speedSel) { speedSel.value = '1'; }

  // No video URL — show placeholder message
  if (!videoId) {
    wrapper.innerHTML = `
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
                  justify-content:center;background:#060912;color:rgba(255,255,255,0.3);gap:12px;">
        <i data-lucide="video-off" style="width:44px;height:44px;color:var(--primary,#6366f1);"></i>
        <span style="font-size:0.9rem;font-weight:600;">Video lesson coming soon — check back shortly!</span>
      </div>`;
    ctrlsEl.style.display = 'none';
    lucide.createIcons();
    return;
  }

  ctrlsEl.style.display = '';

  // Show speed selector now that a video is loading
  const speedWrap = document.getElementById('lp-speed-wrap');
  if (speedWrap) speedWrap.style.display = '';

  // Ensure the mount div exists
  let mountEl = document.getElementById('lp-yt-player-mount');
  if (!mountEl) {
    wrapper.innerHTML = `
      <div class="lp-video-placeholder" id="lp-video-placeholder">
        <div class="lp-video-placeholder-inner">
          <div class="lp-loader"></div>
          <span>Loading video lesson...</span>
        </div>
      </div>
      <div id="lp-yt-player-mount"></div>
      <div class="lp-video-top-overlay"></div>
      <div class="lp-video-bottomright-mask"></div>
      <div class="lp-center-play-btn" id="lp-center-play-btn">
        <div class="lp-center-play-ripple"></div>
        <div class="lp-center-play-icon">
          <i data-lucide="play" id="lp-center-play-icon" style="width:38px;height:38px;margin-left:4px;"></i>
        </div>
      </div>
      <div class="lp-video-shield" id="lp-video-shield"
           oncontextmenu="return false;"
           onclick="window._lpTogglePlayPause && window._lpTogglePlayPause()">
      </div>`;
    mountEl = document.getElementById('lp-yt-player-mount');
  }


  if (placeholder) placeholder.style.display = 'flex';

  // Helper to wire up controls once player is ready
  const wireControls = () => {
    const placeholderEl = document.getElementById('lp-video-placeholder');
    if (placeholderEl) placeholderEl.style.display = 'none';

    const playBtn   = document.getElementById('lp-btn-play');
    const playIcon  = document.getElementById('lp-play-icon');
    const skipBack  = document.getElementById('lp-btn-skip-back');
    const skipFwd   = document.getElementById('lp-btn-skip-fwd');
    const muteBtn   = document.getElementById('lp-btn-mute');
    const volIcon   = document.getElementById('lp-vol-icon');
    const volSlider = document.getElementById('lp-vol-slider');
    const seekBar   = document.getElementById('lp-seek-bar');
    const seekFill  = document.getElementById('lp-seek-fill');
    const timeCur   = document.getElementById('lp-time-current');
    const timeTotal = document.getElementById('lp-time-total');
    const fsBtn     = document.getElementById('lp-btn-fullscreen');

    if (!playBtn) return; // controls not yet in DOM

    // ── Center play/pause button state helper ──
    const centerBtn  = document.getElementById('lp-center-play-btn');
    const centerIcon = document.getElementById('lp-center-play-icon');

    const updateCenterBtn = (isPlaying) => {
      if (!centerBtn) return;
      if (isPlaying) {
        centerBtn.classList.add('playing');
        if (centerIcon) {
          centerIcon.setAttribute('data-lucide', 'pause');
          centerIcon.style.marginLeft = '0';
          lucide.createIcons({ nodes: [centerIcon] });
        }
      } else {
        centerBtn.classList.remove('playing');
        if (centerIcon) {
          centerIcon.setAttribute('data-lucide', 'play');
          centerIcon.style.marginLeft = '4px';
          lucide.createIcons({ nodes: [centerIcon] });
        }
      }
    };

    // Expose global toggle for shield onclick + mobile touch
    window._lpTogglePlayPause = () => {
      if (!_ytPlayer) return;
      const state = _ytPlayer.getPlayerState?.();
      if (state === 1) { _ytPlayer.pauseVideo?.(); updateCenterBtn(false); }
      else             { _ytPlayer.playVideo?.();  updateCenterBtn(true);  }
    };

    // Also handle touch tap on the shield for mobile
    const shield = document.getElementById('lp-video-shield');
    if (shield && !shield._touchWired) {
      shield._touchWired = true;
      shield.addEventListener('touchend', (e) => {
        e.preventDefault();
        window._lpTogglePlayPause?.();
      }, { passive: false });
    }

    // Play / Pause
    const syncPlayIcon = () => {
      const state = _ytPlayer.getPlayerState?.();
      const playing = state === 1; // YT.PlayerState.PLAYING
      if (playIcon) playIcon.setAttribute('data-lucide', playing ? 'pause' : 'play');
      lucide.createIcons({ nodes: [playIcon] });
    };

    if (playBtn) playBtn.onclick = () => {
      const state = _ytPlayer.getPlayerState?.();
      if (state === 1) _ytPlayer.pauseVideo?.(); else _ytPlayer.playVideo?.();
    };

    // Skip ±10s
    if (skipBack) skipBack.onclick = () => _ytPlayer.seekTo?.(_ytPlayer.getCurrentTime?.() - 10, true);
    if (skipFwd)  skipFwd.onclick  = () => _ytPlayer.seekTo?.(_ytPlayer.getCurrentTime?.() + 10, true);

    // Volume slider
    if (volSlider) {
      volSlider.oninput = () => {
        _ytPlayer.setVolume?.(parseInt(volSlider.value));
        if (_ytPlayer.getVolume?.() === 0 || volSlider.value === '0') {
          _ytPlayer.mute?.();
        } else {
          _ytPlayer.unMute?.();
        }
        updateVolIcon();
      };
    }

    const updateVolIcon = () => {
      if (!volIcon) return;
      const vol   = _ytPlayer.getVolume?.() || 0;
      const muted = _ytPlayer.isMuted?.() || vol === 0;
      volIcon.setAttribute('data-lucide', muted ? 'volume-x' : vol < 50 ? 'volume-1' : 'volume-2');
      lucide.createIcons({ nodes: [volIcon] });
    };

    // Mute toggle
    if (muteBtn) muteBtn.onclick = () => {
      if (_ytPlayer.isMuted?.()) {
        _ytPlayer.unMute?.();
        if (volSlider) volSlider.value = _ytPlayer.getVolume?.() || 100;
      } else {
        _ytPlayer.mute?.();
        if (volSlider) volSlider.value = 0;
      }
      updateVolIcon();
    };

    // Speed selector in topbar
    if (speedSel) speedSel.onchange = () => {
      _ytPlayer.setPlaybackRate?.(parseFloat(speedSel.value));
    };

    // Fullscreen
    if (fsBtn) fsBtn.onclick = () => {
      const iframe = wrapper.querySelector('iframe');
      const target = iframe || wrapper;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        target.requestFullscreen?.();
      }
    };
    document.addEventListener('fullscreenchange', () => {
      const fsIcon = document.getElementById('lp-fs-icon');
      if (fsIcon) {
        fsIcon.setAttribute('data-lucide', document.fullscreenElement ? 'minimize-2' : 'maximize-2');
        lucide.createIcons({ nodes: [fsIcon] });
      }
    });

    // Seek bar click
    if (seekBar) {
      seekBar.addEventListener('click', (e) => {
        const rect  = seekBar.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const dur   = _ytPlayer.getDuration?.() || 0;
        _ytPlayer.seekTo?.(ratio * dur, true);
      });
    }

    // Progress timer — updates seek bar + time labels every 500ms
    _ytProgressTimer = setInterval(() => {
      if (!_ytPlayer || !_ytPlayer.getCurrentTime) return;
      const cur = _ytPlayer.getCurrentTime() || 0;
      const dur = _ytPlayer.getDuration()    || 0;
      const pct = dur > 0 ? (cur / dur) * 100 : 0;
      if (seekFill) seekFill.style.width = `${pct}%`;
      if (timeCur)  timeCur.textContent  = lpFmtTime(cur);
      if (timeTotal && dur > 0) timeTotal.textContent = lpFmtTime(dur);
      syncPlayIcon();
      updateVolIcon();
      // Sync center play button
      const cp = document.getElementById('lp-center-play-btn');
      if (cp) {
        const isPlaying = _ytPlayer.getPlayerState?.() === 1;
        cp.classList.toggle('playing', isPlaying);
      }
    }, 500);

    // Keyboard shortcuts (only when learning view is active)
    window._lpKeyHandler && document.removeEventListener('keydown', window._lpKeyHandler);
    window._lpKeyHandler = (e) => {
      if (!document.body.classList.contains('learning-mode')) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.code) {
        case 'Space': case 'KeyK':
          e.preventDefault();
          if (_ytPlayer.getPlayerState?.() === 1) _ytPlayer.pauseVideo?.();
          else _ytPlayer.playVideo?.();
          break;
        case 'KeyJ': _ytPlayer.seekTo?.(_ytPlayer.getCurrentTime?.() - 10, true); break;
        case 'KeyL': _ytPlayer.seekTo?.(_ytPlayer.getCurrentTime?.() + 10, true); break;
        case 'KeyM': muteBtn?.click(); break;
        case 'KeyF': fsBtn?.click(); break;
        case 'ArrowUp':
          e.preventDefault();
          { const v = Math.min(100, (_ytPlayer.getVolume?.() || 100) + 10);
            _ytPlayer.setVolume?.(v);
            if (volSlider) volSlider.value = v;
            updateVolIcon(); }
          break;
        case 'ArrowDown':
          e.preventDefault();
          { const v = Math.max(0, (_ytPlayer.getVolume?.() || 100) - 10);
            _ytPlayer.setVolume?.(v);
            if (volSlider) volSlider.value = v;
            updateVolIcon(); }
          break;
      }
    };
    document.addEventListener('keydown', window._lpKeyHandler);

    lucide.createIcons();
  };

  // Create the YT player using the IFrame API
  const tryCreatePlayer = () => {
    if (!window.YT || !window.YT.Player) {
      // API not yet loaded — retry in 200ms
      setTimeout(tryCreatePlayer, 200);
      return;
    }

    _ytPlayer = new window.YT.Player('lp-yt-player-mount', {
      videoId,
      playerVars: {
        rel:             0,
        modestbranding:  1,
        controls:        0,   // hide native controls (we use our own)
        showinfo:        0,
        iv_load_policy:  3,
        fs:              0,   // disable native fullscreen button
        cc_load_policy:  0,
        playsinline:     1,
        origin:          window.location.origin
      },
      events: {
        onReady: (e) => {
          wireControls();
        },
        onStateChange: (e) => {
          const playIcon  = document.getElementById('lp-play-icon');
          const centerBtn = document.getElementById('lp-center-play-btn');
          const centerIco = document.getElementById('lp-center-play-icon');
          const isPlaying = e.data === 1;
          if (playIcon) {
            playIcon.setAttribute('data-lucide', isPlaying ? 'pause' : 'play');
            lucide.createIcons({ nodes: [playIcon] });
          }
          if (centerBtn) {
            centerBtn.classList.toggle('playing', isPlaying);
          }
          if (centerIco) {
            centerIco.setAttribute('data-lucide', isPlaying ? 'pause' : 'play');
            centerIco.style.marginLeft = isPlaying ? '0' : '4px';
            lucide.createIcons({ nodes: [centerIco] });
          }
        }
      }
    });
  };

  tryCreatePlayer();
}

/* ==========================================================================
   DEDICATED COURSERA-STYLE LEARNING PAGE RENDERER
   ========================================================================== */
let _learningState = {
  courseId: null,
  moduleIdx: 0,
  course: null,
  lessons: [],
  student: null
};

/** Update the sidebar toggle button icon based on collapsed state */
function updateSidebarToggleIcon(btn, isCollapsed) {
  if (!btn) return;
  const icon = btn.querySelector('i[data-lucide]');
  if (icon) {
    icon.setAttribute('data-lucide', isCollapsed ? 'panel-right-open' : 'panel-right-close');
    lucide.createIcons({ nodes: [icon] });
  }
  btn.title = isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar';
}

async function renderLearningPage(courseId, moduleIdx) {
  const session = localStorage.getItem(STUDENT_SESSION_KEY);
  if (!session) {
    window.location.hash = '#home';
    return;
  }

  const student = JSON.parse(session);

  // Header & Navigation elements
  const titleEl       = document.getElementById('learning-course-title');
  const instructorEl  = document.getElementById('learning-course-instructor');
  const modulesList   = document.getElementById('learning-modules-list');
  const mobileDd      = document.getElementById('learning-mobile-sidebar-dropdown');
  const videoFrame    = document.getElementById('learning-video-frame');
  const videoPlaceholder = document.getElementById('lp-video-placeholder');
  const lessonTitle   = document.getElementById('learning-lesson-title');
  const moduleBadge   = document.getElementById('learning-module-badge');
  const lessonDesc    = document.getElementById('learning-lesson-desc');
  const notesContent  = document.getElementById('learning-lesson-notes-content');
  const resourcesList = document.getElementById('learning-lesson-resources-list');
  const quizContainer = document.getElementById('learning-quiz-container');
  const btnComplete   = document.getElementById('btn-mark-lesson-complete');
  const btnCompleteText = document.getElementById('btn-mark-complete-text');
  const btnPrev       = document.getElementById('btn-prev-lesson');
  const btnNext       = document.getElementById('btn-next-lesson');
  
  // Coursera layout elements
  const sidebarCount  = document.getElementById('lp-sidebar-count');
  const progressFill  = document.getElementById('lp-progress-fill');
  const progressPct   = document.getElementById('lp-progress-pct');
  const certBadge     = document.getElementById('lp-cert-badge');

  if (!titleEl) return;

  // Show loading state for video
  if (videoPlaceholder) videoPlaceholder.style.display = 'flex';
  if (videoFrame) {
    videoFrame.style.opacity = '0';
    videoFrame.src = '';
  }

  try {
    // 1. Fetch/Cache Course Data
    if (!_cachedCourses) {
      _cachedCourses = await EFBIDatabase.request('getCourses');
    }
    const course = _cachedCourses.find(c => c.id === courseId);
    if (!course) {
      showToast('Course not found.', 'error');
      window.location.hash = '#my-courses';
      return;
    }

    // 2. Fetch/Cache Lessons
    const lessons = await getLessonsForCourse(course);
    const safeIdx = Math.max(0, Math.min(moduleIdx, lessons.length - 1));

    // Cache state
    _learningState = { courseId, moduleIdx: safeIdx, course, lessons, student };

    if (safeIdx !== moduleIdx) {
      window.location.hash = `#learning/${courseId}/${safeIdx}`;
      return;
    }

    const lesson = lessons[safeIdx];

    // ── Header & Topbar ───────────────────────────────────────────────────── //
    if (titleEl) titleEl.textContent = course.title;
    if (instructorEl) instructorEl.textContent = `Instructor: ${course.instructor || 'EFBI Faculty'}`;

    // ── Progress & Certificate Badge ──────────────────────────────────────── //
    const completedIndices = getLocalProgress(student.email);
    const doneCount = completedIndices.filter(i => i < lessons.length).length;
    const totalMods = lessons.length;
    const pct = totalMods > 0 ? Math.round((doneCount / totalMods) * 100) : 0;

    if (sidebarCount) sidebarCount.textContent = `${doneCount} / ${totalMods} lessons`;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressPct)  progressPct.textContent  = `${pct}% complete`;

    if (certBadge) {
      if (pct >= 100) {
        certBadge.className = 'lp-cert-badge unlocked';
        certBadge.innerHTML = `<i data-lucide="award" style="width:14px;height:14px;"></i> Certificate Unlocked!`;
      } else {
        certBadge.className = 'lp-cert-badge locked';
        certBadge.innerHTML = `<i data-lucide="lock" style="width:14px;height:14px;"></i> Certificate Locked (${pct}%)`;
      }
    }

    // ── Sidebar Lesson List ────────────────────────────────────────────────── //
    const renderLessonList = (container) => {
      if (!container) return;
      container.innerHTML = lessons.map((l, i) => {
        const isDone   = completedIndices.includes(i);
        const isActive = i === safeIdx;
        const iconName = isDone ? 'check-circle-2' : isActive ? 'play-circle' : 'circle';
        const statusClass = isDone ? 'completed' : isActive ? 'active-icon' : 'pending';

        return `
          <button class="lp-lesson-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}"
                  onclick="window.location.hash='#learning/${courseId}/${i}'">
            <div class="lp-lesson-item-icon ${statusClass}">
              <i data-lucide="${iconName}" style="width:16px;height:16px;"></i>
            </div>
            <span class="lp-lesson-item-title">${l.title}</span>
          </button>
        `;
      }).join('');
    };

    renderLessonList(modulesList);
    renderLessonList(mobileDd);

    // ── Video Player (YouTube IFrame API + Custom Controls) ──────────────── //
    initLearningVideoPlayer(lesson.videourl || '', videoPlaceholder);

    // ── Lesson Info & Tabs ────────────────────────────────────────────────── //
    if (lessonTitle) lessonTitle.textContent = lesson.title;
    if (moduleBadge) moduleBadge.textContent = `Lesson ${safeIdx + 1} of ${lessons.length}`;
    if (lessonDesc) {
      lessonDesc.textContent = lesson.notestext && lesson.notestext.length < 250
        ? lesson.notestext
        : `Welcome to ${lesson.title}. Watch the video lecture above, review the notes, and take the practice quiz when you are ready to test your knowledge.`;
    }

    // Notes tab
    if (notesContent) {
      notesContent.textContent = lesson.notestext || 'Lesson notes will be provided by your instructor.';
    }

    // Resources tab
    if (resourcesList) {
      const links = (lesson.resourceslinks || '').split('\n').filter(l => l.trim() !== '');
      if (links.length > 0) {
        resourcesList.innerHTML = links.map(link => {
          const parts = link.split('|');
          const label = parts[0] ? parts[0].trim() : 'Resource';
          const url   = parts[1] ? parts[1].trim() : link.trim();
          const isPDF = url.includes('.pdf') || url.includes('drive.google');
          const icon  = isPDF ? 'file-text' : 'external-link';
          return `
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="resource-link-card">
              <i data-lucide="${icon}" style="width:18px;height:18px;"></i>
              <span>${label}</span>
            </a>
          `;
        }).join('');
      } else {
        resourcesList.innerHTML = `
          <div style="grid-column:1/-1;color:var(--text-muted);font-size:0.85rem;padding:8px 0;">
            No extra resources attached to this module.
          </div>`;
      }
    }

    // Quiz tab
    if (quizContainer) {
      let quizScores = {};
      try {
        quizScores = await EFBIDatabase.request('getQuizScores', { email: student.email }) || {};
      } catch { /* silent */ }

      const scoreInfo = quizScores[safeIdx];
      if (scoreInfo) {
        const passed = scoreInfo.percent >= 70;
        quizContainer.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
            <div style="font-size:2.2rem;font-weight:800;color:${passed ? 'var(--secondary)' : 'var(--danger)'};">${scoreInfo.percent}%</div>
            <div style="font-size:0.92rem;font-weight:700;color:${passed ? 'var(--secondary)' : 'var(--danger)'};">${passed ? '✓ Passed' : '✗ Try Again'}</div>
            <div style="font-size:0.82rem;color:var(--text-muted);">${scoreInfo.score} of ${scoreInfo.total} correct</div>
            <button class="lp-nav-btn secondary" style="margin-top:6px;"
              onclick="window.openQuizForLesson(${safeIdx}, '${(lesson.title || '').replace(/'/g,"\\'")}', '${student.email}', '${(course.title || '').replace(/'/g,"\\'")}')">
              Retake Quiz
            </button>
          </div>
        `;
      } else {
        quizContainer.innerHTML = `
          <button class="lp-nav-btn primary" style="padding:12px 28px;font-size:0.95rem;margin:0 auto;"
            onclick="window.openQuizForLesson(${safeIdx}, '${(lesson.title || '').replace(/'/g,"\\'")}', '${student.email}', '${(course.title || '').replace(/'/g,"\\'")}')">
            <i data-lucide="play" style="width:16px;height:16px;"></i> Start Quiz
          </button>
        `;
      }

      window.openQuizForLesson = (mIdx, mName, sEmail, cTitle) => {
        window._learningPageQuizCallback = async (scoreData) => {
          try {
            await EFBIDatabase.request('saveQuizScore', {
              email: sEmail, courseId, moduleIdx: mIdx,
              score: scoreData.score, total: scoreData.total, percent: scoreData.percent
            });
          } catch { /* silent */ }
          setTimeout(() => renderLearningPage(courseId, mIdx), 500);
        };
        window.openQuiz(mIdx, mName, sEmail, cTitle, courseId);
      };
    }

    // ── Mark Complete Button ───────────────────────────────────────────────── //
    const isCurrentDone = completedIndices.includes(safeIdx);
    if (btnComplete && btnCompleteText) {
      if (isCurrentDone) {
        btnComplete.className = 'lp-complete-btn done';
        btnCompleteText.textContent = '✓ Completed';
      } else {
        btnComplete.className = 'lp-complete-btn';
        btnCompleteText.textContent = 'Mark Complete';
      }

      btnComplete.onclick = async () => {
        const fresh = getLocalProgress(student.email);
        let updated;
        const isMarking = !fresh.includes(safeIdx);
        if (isMarking) {
          updated = [...fresh, safeIdx];
        } else {
          updated = fresh.filter(i => i !== safeIdx);
          showToast('Lesson unmarked.', 'error');
        }
        saveLocalProgress(student.email, updated);

        // Update activity date
        const actKey = 'efbi_activity_' + student.email.replace(/[^a-zA-Z0-9]/g, '_');
        localStorage.setItem(actKey, new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));

        try {
          await EFBIDatabase.request('saveProgress', {
            email: student.email, courseId, moduleIdx: safeIdx, completed: isMarking
          });
        } catch { /* silent */ }

        if (isMarking) {
          const isLast = safeIdx >= lessons.length - 1;
          if (isLast) {
            // ── Last lesson completed → request certificate approval ──
            showToast('🎉 Course complete! Certificate pending admin approval.', 'success');
            try {
              await EFBIDatabase.request('issueCertificate', {
                name: student.name,
                course: course.title,
                status: 'Pending Approval',
                email: student.email
              });
            } catch { /* non-fatal: cert request may already exist */ }
            renderLearningPage(courseId, safeIdx);
          } else {
            // ── Auto-advance to next lesson ──
            showToast('Lesson complete! 🎉 Moving to next lesson…', 'success');
            setTimeout(() => {
              window.location.hash = `#learning/${courseId}/${safeIdx + 1}`;
            }, 600);
          }
        } else {
          renderLearningPage(courseId, safeIdx);
        }
      };
    }

    // ── Prev / Next Navigation ────────────────────────────────────────────── //
    if (btnPrev) {
      btnPrev.disabled = safeIdx === 0;
      btnPrev.onclick  = () => {
        if (safeIdx > 0) window.location.hash = `#learning/${courseId}/${safeIdx - 1}`;
      };
    }
    if (btnNext) {
      btnNext.disabled = safeIdx >= lessons.length - 1;
      btnNext.onclick  = () => {
        if (safeIdx < lessons.length - 1) window.location.hash = `#learning/${courseId}/${safeIdx + 1}`;
      };
    }

    // ── Mobile Sidebar Toggle ────────────────────────────────────────────── //
    const mobileToggle = document.getElementById('btn-learning-mobile-sidebar');
    if (mobileToggle && mobileDd) {
      mobileToggle.onclick = () => {
        const isOpen = mobileDd.style.display !== 'none';
        mobileDd.style.display = isOpen ? 'none' : 'block';
      };
    }

    // ── Tab Switching ─────────────────────────────────────────────────────── //
    document.querySelectorAll('.lp-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.lp-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.lp-tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-learning-tab');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) targetPanel.classList.add('active');
      };
    });

    // ── Desktop Sidebar Collapse Toggle ──────────────────────────────────── //
    const sidebarToggleBtn = document.getElementById('btn-toggle-sidebar');
    const lpBody = document.querySelector('.lp-body');
    if (sidebarToggleBtn && lpBody) {
      // Restore saved collapsed state
      const savedCollapsed = localStorage.getItem('efbi_sidebar_collapsed') === 'true';
      if (savedCollapsed) lpBody.classList.add('sidebar-collapsed');
      updateSidebarToggleIcon(sidebarToggleBtn, lpBody.classList.contains('sidebar-collapsed'));

      // Wire up the toggle (only attach once)
      if (!sidebarToggleBtn._wired) {
        sidebarToggleBtn._wired = true;
        sidebarToggleBtn.addEventListener('click', () => {
          lpBody.classList.toggle('sidebar-collapsed');
          const collapsed = lpBody.classList.contains('sidebar-collapsed');
          localStorage.setItem('efbi_sidebar_collapsed', collapsed);
          updateSidebarToggleIcon(sidebarToggleBtn, collapsed);
        });
      }
    }

    lucide.createIcons();


  } catch (err) {
    console.error('Error rendering learning page:', err);
    showToast('Failed to load lesson.', 'error');
  }
}

const DEFAULT_TECHNICAL_PATHWAYS = [
  { title: "AI Engineering & Machine Learning", shortDesc: "Learn neural networks, machine learning basics, and modern AI engineering." },
  { title: "Full-Stack Web Development", shortDesc: "Build beautiful, interactive responsive web apps using HTML, CSS, JavaScript, and APIs." },
  { title: "Mobile App Engineering", shortDesc: "Create high-performance native and cross-platform mobile apps for Android and iOS." },
  { title: "Python & Data Science", shortDesc: "Master Python fundamentals, data structures, analysis, and standard algorithms." },
  { title: "Tech Leadership & Entrepreneurship", shortDesc: "Develop core technical competencies, product design, and launch innovative tech startups." }
];

function populateRegistrationInterests(fetchedCourses = []) {
  const select = document.getElementById('reg-interests');
  const container = document.getElementById('pathway-cards-container');
  if (!select) return;

  // Detect current theme
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  // Color tokens per theme
  const colors = isLight ? {
    cardBg:         '#f8f9ff',
    cardBgSel:      '#ede9fe',
    cardBorder:     '#c7d2fe',
    cardBorderSel:  '#6366f1',
    iconBg:         '#e0e7ff',
    iconColor:      '#4f46e5',
    checkBorder:    '#a5b4fc',
    checkBgSel:     '#6366f1',
    titleColor:     '#1e1b4b',
    descColor:      '#4b5563'
  } : {
    cardBg:         'rgba(99,102,241,0.06)',
    cardBgSel:      'rgba(99,102,241,0.18)',
    cardBorder:     'rgba(99,102,241,0.25)',
    cardBorderSel:  '#6366f1',
    iconBg:         'rgba(99,102,241,0.15)',
    iconColor:      '#818cf8',
    checkBorder:    'rgba(255,255,255,0.3)',
    checkBgSel:     '#6366f1',
    titleColor:     '#f1f5f9',
    descColor:      'rgba(255,255,255,0.6)'
  };

  // Combine fetched database courses with default pathways so options are always available
  let combined = [...(Array.isArray(fetchedCourses) ? fetchedCourses : [])];
  
  // Include all active or published courses
  let activeCourses = combined.filter(c => !c.status || c.status.toLowerCase() === 'published' || c.status.toLowerCase() === 'active');
  
  // Create a map by lowercased title to eliminate duplicates while combining default & custom courses
  const courseMap = new Map();

  // Add default pathways first
  DEFAULT_TECHNICAL_PATHWAYS.forEach(p => courseMap.set(p.title.toLowerCase(), p));

  // Merge database/custom admin courses dynamically
  activeCourses.forEach(c => {
    if (c.title && c.title.trim()) {
      courseMap.set(c.title.trim().toLowerCase(), {
        title: c.title.trim(),
        shortDesc: c.shortDesc || c.description || 'Master core technical skills and build real-world portfolio projects.'
      });
    }
  });

  const finalPathways = Array.from(courseMap.values());

  // Reset master select element
  const currentVal = select.value;
  select.innerHTML = '<option value="" disabled selected>Select primary technical interest</option>';

  finalPathways.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.title;
    opt.textContent = p.title;
    if (currentVal === p.title) opt.selected = true;
    select.appendChild(opt);
  });

  // Render pathway cards grid
  if (container) {
    const getPathwayIcon = (title) => {
      const t = title.toLowerCase();
      if (t.includes('ai') || t.includes('artificial') || t.includes('machine')) return 'cpu';
      if (t.includes('web') || t.includes('html') || t.includes('css') || t.includes('stack')) return 'globe';
      if (t.includes('mobile') || t.includes('android') || t.includes('app')) return 'smartphone';
      if (t.includes('python') || t.includes('code') || t.includes('foundation') || t.includes('data')) return 'terminal';
      return 'rocket';
    };

    container.innerHTML = finalPathways.map(p => {
      const icon = getPathwayIcon(p.title);
      const isSelected = select.value === p.title;
      const bg     = isSelected ? colors.cardBgSel     : colors.cardBg;
      const border  = isSelected ? colors.cardBorderSel : colors.cardBorder;
      const chkBg   = isSelected ? colors.checkBgSel    : 'transparent';
      const chkBord = isSelected ? colors.cardBorderSel : colors.checkBorder;
      return `
        <div class="pathway-card ${isSelected ? 'selected' : ''}" data-pathway-title="${p.title}"
             style="display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 14px; border: 1.5px solid ${border}; background: ${bg}; cursor: pointer; transition: all 0.2s ease;">
          <div class="pathway-card-icon" style="width: 38px; height: 38px; border-radius: 10px; background: ${colors.iconBg}; color: ${colors.iconColor}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i data-lucide="${icon}" style="width: 20px; height: 20px;"></i>
          </div>
          <div style="flex: 1;">
            <div class="pathway-card-title" style="font-weight: 700; font-size: 0.92rem; margin-bottom: 2px; color: ${colors.titleColor};">${p.title}</div>
            <div class="pathway-card-desc" style="font-size: 0.78rem; color: ${colors.descColor}; line-height: 1.35;">${p.shortDesc}</div>
          </div>
          <div class="pathway-card-check" style="width: 22px; height: 22px; border-radius: 50%; border: 2px solid ${chkBord}; background: ${chkBg}; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">
            ${isSelected ? '✓' : ''}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();

    // Wire up interactive card selection listeners
    const cards = container.querySelectorAll('.pathway-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const title = card.getAttribute('data-pathway-title');
        select.value = title;

        // Update visual checkmark and highlight selection
        cards.forEach(c => {
          c.classList.remove('selected');
          c.style.borderColor = colors.cardBorder;
          c.style.background  = colors.cardBg;
          const chk = c.querySelector('.pathway-card-check');
          if (chk) {
            chk.style.borderColor = colors.checkBorder;
            chk.style.background  = 'transparent';
            chk.innerHTML = '';
          }
        });

        card.classList.add('selected');
        card.style.borderColor = colors.cardBorderSel;
        card.style.background  = colors.cardBgSel;
        const chk = card.querySelector('.pathway-card-check');
        if (chk) {
          chk.style.borderColor = colors.cardBorderSel;
          chk.style.background  = colors.checkBgSel;
          chk.innerHTML = '✓';
        }

        // Hide validation error message
        const errorEl = document.getElementById('error-reg-interests');
        if (errorEl) errorEl.style.display = 'none';
      });
    });
  }
}


/* ==========================================================================
   COURSES CATALOG SEARCH & FILTER FUNCTIONALITY
   ========================================================================== */
function initCourseCatalog() {
  const searchInput = document.getElementById('course-search');
  const filterBtns = document.querySelectorAll('#courses-view .filter-tag');
  const grid       = document.getElementById('courses-grid');
  
  if (!grid) return;

  let activeFilter = 'all';
  let searchQuery = '';

  // No-results placeholder (injected once, shown/hidden as needed)
  let noResultsEl = document.getElementById('courses-no-results');
  if (!noResultsEl) {
    noResultsEl = document.createElement('div');
    noResultsEl.id = 'courses-no-results';
    noResultsEl.className = 'courses-empty-state';
    noResultsEl.style.display = 'none';
    noResultsEl.innerHTML = `
      <div class="courses-empty-icon"><i data-lucide="search-x"></i></div>
      <h3 class="courses-empty-title">No Courses Found</h3>
      <p class="courses-empty-desc">No courses match your current search or filter. Try adjusting your criteria.</p>
    `;
    grid.appendChild(noResultsEl);
    lucide.createIcons();
  }

  const filterCourses = () => {
    const courseCards = document.querySelectorAll('#courses-grid .course-card');
    let visibleCount = 0;
    
    courseCards.forEach(card => {
      const cardLevel = card.getAttribute('data-level');
      const cardTitle = card.querySelector('.course-title').textContent.toLowerCase();
      const cardDesc  = card.querySelector('.course-desc').textContent.toLowerCase();

      const matchesFilter = activeFilter === 'all' || cardLevel === activeFilter;
      const matchesSearch = cardTitle.includes(searchQuery) || cardDesc.includes(searchQuery);

      if (matchesFilter && matchesSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    // Toggle the no-results message
    noResultsEl.style.display = (visibleCount === 0 && courseCards.length > 0) ? 'flex' : 'none';
  };

  // Search input change listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterCourses();
    });
  }

  // Filter tags click listeners
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      filterCourses();
    });
  });

  // Intercept click on Enroll Now buttons using event delegation on courses-grid
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('.course-action a, .course-action button');
    if (!btn) return;
    
    if (btn.hasAttribute('disabled') || btn.textContent.trim() === 'Enrolled') {
      e.preventDefault();
      return;
    }
    
    const studentSession = localStorage.getItem('efbi_student_session');
    const card = btn.closest('.course-card');
    if (!card) return;
    const courseTitle = card.querySelector('.course-title').textContent.trim();

    if (studentSession) {
      e.preventDefault();
      
      const student = JSON.parse(studentSession);
      
      // Prevent duplicate enrollments
      if (student.interest && student.interest.toLowerCase().trim() === courseTitle.toLowerCase().trim()) {
        showToast('You are already enrolled in this course.', 'warning');
        
        btn.textContent = 'Enrolled';
        btn.className = 'btn btn-secondary btn-block';
        btn.setAttribute('disabled', 'true');
        btn.style.cursor = 'not-allowed';
        btn.style.pointerEvents = 'none';
        return;
      }
      
      if (confirm(`Would you like to enroll in "${courseTitle}"? This will update your active course pathway.`)) {
        const originalText = btn.textContent;
        btn.textContent = 'Enrolling...';
        btn.style.pointerEvents = 'none';
        
        try {
          await EFBIDatabase.request('enrollCourse', { email: student.email, course: courseTitle });
          
          // Update local session
          student.interest = courseTitle;
          localStorage.setItem('efbi_student_session', JSON.stringify(student));
          
          // Change the button to Enrolled & Disable it
          btn.textContent = 'Enrolled';
          btn.className = 'btn btn-secondary btn-block';
          btn.setAttribute('disabled', 'true');
          btn.style.cursor = 'not-allowed';
          btn.style.pointerEvents = 'none';
          
          // Display success message
          showToast('You have successfully enrolled in this course.', 'success');
          
          // The student's dashboard should immediately show the newly enrolled course.
          renderStudentDashboard();
          
          // Navigate to profile dashboard after a brief delay
          setTimeout(() => {
            window.location.hash = '#profile';
          }, 800);
        } catch (err) {
          btn.textContent = originalText;
          btn.style.pointerEvents = 'auto';
          showToast(getFriendlyErrorMessage(err, 'course-enrollment'), 'error');
        }
      }
    } else {
      // Guest mode: pre-select interest in registration form
      const interestSelect = document.getElementById('reg-interests');
      if (interestSelect) {
        for (let option of interestSelect.options) {
          if (option.text.toLowerCase().includes(courseTitle.toLowerCase()) || 
              courseTitle.toLowerCase().includes(option.value.toLowerCase()) ||
              option.value.toLowerCase().includes(courseTitle.toLowerCase())) {
            interestSelect.value = option.value;
            
            // Also select corresponding visual card
            setTimeout(() => {
              const card = document.querySelector(`.pathway-card[data-pathway-title="${option.value}"]`);
              if (card) card.click();
            }, 100);
            
            break;
          }
        }
      }
    }
  });
}

/* ==========================================================================
   INTERACTIVE CERTIFICATE PREVIEW
   ========================================================================== */
function initCertificatePreview() {
  const inputName = document.getElementById('cert-preview-name-input');
  const recipientDisplay = document.getElementById('cert-recipient-name');
  const dateDisplay = document.getElementById('cert-preview-date');
  
  if (dateDisplay) {
    dateDisplay.textContent = new Date().toISOString().split('T')[0];
  }
  
  if (!inputName || !recipientDisplay) return;

  inputName.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    recipientDisplay.textContent = val !== '' ? val : 'Student Name';
  });
}

/* ==========================================================================
   CERTIFICATE VERIFICATION ENGINE (Asynchronous DB Search)
   ========================================================================== */
function initCertificateVerifier() {
  const btnVerify = document.getElementById('btn-verify-cert');
  const inputCertId = document.getElementById('cert-id-input');
  const resultBox = document.getElementById('verifier-result-box');
  
  if (!btnVerify || !inputCertId || !resultBox) return;

  btnVerify.addEventListener('click', async () => {
    const certId = inputCertId.value.trim().toUpperCase();
    
    if (certId === '') {
      showToast('Please enter a Certificate ID.', 'error');
      return;
    }

    resultBox.style.display = 'none';

    showToast('Querying certificate registry...', 'success');
    btnVerify.disabled = true;
    btnVerify.innerHTML = '<i data-lucide="loader" class="spin-animation" style="width: 14px;"></i> Searching...';
    lucide.createIcons();

    try {
      const foundCert = await EFBIDatabase.request('verifyCertificate', { id: certId });
      
      btnVerify.disabled = false;
      btnVerify.textContent = 'Verify Certificate';
      
      if (foundCert) {
        resultBox.className = 'verifier-result valid';
        document.getElementById('verifier-result-header').innerHTML = `
          <i data-lucide="check-circle" style="stroke: var(--secondary); fill: var(--secondary-glow);"></i>
          Credential Valid & Active
        `;
        document.getElementById('verifier-details').innerHTML = `
          <div style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
            <div>
              <div class="verifier-label">Student Name</div>
              <div class="verifier-value">${foundCert.name}</div>
            </div>
            <div>
              <div class="verifier-label">Course Path</div>
              <div class="verifier-value">${foundCert.course}</div>
            </div>
            <div>
              <div class="verifier-label">Completion Date</div>
              <div class="verifier-value">${foundCert.date}</div>
            </div>
            <div>
              <div class="verifier-label">Status</div>
              <div class="verifier-value" style="color: var(--secondary); font-weight: 700;">ACTIVE VERIFIED</div>
            </div>
          </div>
          
          <div style="grid-column: 1 / -1; border-top: 1px solid var(--border-color); padding-top: 24px; width: 100%;">
            <div class="cert-preview-card" style="padding: 0;">
              <div class="cert-frame-wrapper" style="box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                <!-- Accent bars -->
                <div class="cert-top-bar"></div>
                <div class="cert-bottom-bar"></div>

                <!-- Geometric watermark -->
                <div class="cert-watermark">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;">
                    <defs>
                      <pattern id="cert-grid-v" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0b132b" stroke-width="0.3" opacity="0.06"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#cert-grid-v)"/>
                  </svg>
                </div>

                <!-- Certificate Content -->
                <div class="cert-preview-content">

                  <!-- Header -->
                  <div class="cert-header">
                    <div class="cert-org-logo">
                      <svg class="cert-logo-mark" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="14" cy="14" r="12" fill="none" stroke="#0b132b" stroke-width="1.2"/>
                        <circle cx="14" cy="14" r="4" fill="#c5a456"/>
                        <line x1="14" y1="2" x2="14" y2="8" stroke="#0b132b" stroke-width="1.2"/>
                        <line x1="14" y1="20" x2="14" y2="26" stroke="#0b132b" stroke-width="1.2"/>
                        <line x1="2" y1="14" x2="8" y2="14" stroke="#0b132b" stroke-width="1.2"/>
                        <line x1="20" y1="14" x2="26" y2="14" stroke="#0b132b" stroke-width="1.2"/>
                        <line x1="5.5" y1="5.5" x2="9.5" y2="9.5" stroke="#c5a456" stroke-width="0.8" opacity="0.7"/>
                        <line x1="18.5" y1="18.5" x2="22.5" y2="22.5" stroke="#c5a456" stroke-width="0.8" opacity="0.7"/>
                        <line x1="22.5" y1="5.5" x2="18.5" y2="9.5" stroke="#c5a456" stroke-width="0.8" opacity="0.7"/>
                        <line x1="9.5" y1="18.5" x2="5.5" y2="22.5" stroke="#c5a456" stroke-width="0.8" opacity="0.7"/>
                      </svg>
                      <div class="cert-logo">Ethiopian Future Builders Initiative</div>
                    </div>
                    <div class="cert-tagline">Empowering Ethiopia's Next Generation of Innovators</div>
                  </div>

                  <div class="cert-divider"></div>

                  <!-- Title -->
                  <div class="cert-title-group">
                    <div class="cert-main-title">Certificate of Completion</div>
                    <div class="cert-sub-title">This is to officially certify that</div>
                  </div>

                  <!-- Recipient -->
                  <div>
                    <div class="cert-presented-to">Proudly Presented To</div>
                    <div class="cert-recipient">${foundCert.name}</div>
                  </div>

                  <!-- Course -->
                  <p class="cert-body-text">
                    has successfully completed the full curriculum of
                    <span class="cert-course-name">${foundCert.course}</span>,
                    demonstrating outstanding commitment, technical proficiency, and readiness for the future of technology.
                  </p>

                  <!-- Achievement -->
                  <div class="cert-achievement-row">
                    ${foundCert.score ? `<span class="cert-score-chip">Final Score: ${foundCert.score}%</span>` : ''}
                    ${foundCert.level ? `<span class="cert-achievement-badge ${(foundCert.level || '').toLowerCase()}">★ ${foundCert.level}</span>` : ''}
                  </div>

                  <div class="cert-divider" style="width:100%; opacity:0.4;"></div>

                  <!-- Footer -->
                  <div class="cert-footer-layout">
                    <!-- Left: Date & ID -->
                    <div class="cert-footer-col left">
                      <div class="cert-footer-label">Date of Issuance</div>
                      <div class="cert-footer-value">${foundCert.date}</div>
                      <div class="cert-footer-label" style="margin-top:6px;">Credential ID</div>
                      <div class="cert-footer-id">${foundCert.id}</div>
                    </div>

                    <!-- Center: QR Code -->
                    <div class="cert-footer-col">
                      <div class="cert-qr-block">
                        <svg class="cert-qr-svg" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg" fill="#0b132b">
                          <rect x="2" y="2" width="16" height="16" rx="1.5" fill="none" stroke="#0b132b" stroke-width="1.2"/>
                          <rect x="5" y="5" width="10" height="10" rx="0.5"/>
                          <rect x="24" y="2" width="16" height="16" rx="1.5" fill="none" stroke="#0b132b" stroke-width="1.2"/>
                          <rect x="27" y="5" width="10" height="10" rx="0.5"/>
                          <rect x="2" y="24" width="16" height="16" rx="1.5" fill="none" stroke="#0b132b" stroke-width="1.2"/>
                          <rect x="5" y="27" width="10" height="10" rx="0.5"/>
                          <rect x="24" y="24" width="4" height="4"/>
                          <rect x="30" y="24" width="4" height="4"/>
                          <rect x="36" y="24" width="4" height="4"/>
                          <rect x="24" y="30" width="4" height="4"/>
                          <rect x="30" y="30" width="4" height="4"/>
                          <rect x="36" y="36" width="4" height="4"/>
                          <rect x="24" y="36" width="4" height="4"/>
                          <rect x="30" y="36" width="10" height="4"/>
                        </svg>
                        <div class="cert-verify-url">efbi.org/verify?id=${foundCert.id}</div>
                      </div>
                    </div>

                    <!-- Right: Signatures -->
                    <div class="cert-footer-col right">
                      <div class="cert-sigs-row">
                        <div class="cert-sig-unit">
                          <span class="cert-sig-name">Tamerat Gebeyehu</span>
                          <div class="cert-sig-line"></div>
                          <div class="cert-sig-label">Founder &amp; Director</div>
                        </div>
                        <div class="cert-sig-unit">
                          <span class="cert-sig-name" style="font-size:1rem;">${foundCert.instructor || 'EFBI Faculty'}</span>
                          <div class="cert-sig-line"></div>
                          <div class="cert-sig-label">Lead Instructor</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div><!-- /cert-preview-content -->
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <button class="btn btn-secondary btn-sm" onclick="window.print()" style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; padding: 8px 16px;">
                <i data-lucide="printer" style="width: 14px; height: 14px;"></i> Print / Save Certificate PDF
              </button>
            </div>
          </div>
        `;
        showToast('Credential successfully verified!', 'success');
      } else {
        resultBox.className = 'verifier-result invalid';
        document.getElementById('verifier-result-header').innerHTML = `
          <i data-lucide="alert-triangle" style="stroke: var(--danger); fill: var(--danger-glow);"></i>
          Credential Invalid
        `;
        document.getElementById('verifier-details').innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 12px 0;">
            The certificate ID <strong>${certId}</strong> does not match any records in the EFBI registry database.<br>Please double check the spelling and formatting (e.g. EFBI-2026-001).
          </div>
        `;
        showToast('Certificate not found.', 'error');
      }
      
      resultBox.style.display = 'block';
      lucide.createIcons();

    } catch (err) {
      btnVerify.disabled = false;
      btnVerify.textContent = 'Verify Certificate';
      showToast(getFriendlyErrorMessage(err, 'certificate-verification'), 'error');
    }
  });
}

/* ==========================================================================
   PREMIUM CERTIFICATE VIEWER MODAL CONTROLLERS
   ========================================================================== */
window.openCertificateViewer = async (certId) => {
  const modal = document.getElementById('cert-viewer-modal');
  if (!modal) return;

  showToast('Loading credential details...', 'success');

  try {
    const foundCert = await EFBIDatabase.request('verifyCertificate', { id: certId.trim().toUpperCase() });
    if (!foundCert) {
      showToast('Certificate credential could not be found.', 'error');
      return;
    }

    // Populate metadata
    document.getElementById('cv-student-name').textContent = foundCert.name;
    document.getElementById('cv-course-name').textContent = foundCert.course;
    document.getElementById('cv-issue-date').textContent = foundCert.date;
    document.getElementById('cv-cert-id').textContent = foundCert.id;
    
    const scoreText = foundCert.score ? foundCert.score + '%' : 'N/A';
    const levelText = foundCert.level ? foundCert.level : 'N/A';
    document.getElementById('cv-score-level').textContent = `${scoreText} / ${levelText}`;

    // Render Preview Frame
    const renderTarget = document.getElementById('cert-viewer-render-target');
    renderTarget.innerHTML = `
      <div class="cert-frame-wrapper" style="box-shadow: 0 10px 30px rgba(0,0,0,0.4); width: 100%; max-width: 760px; margin: 0 auto;">
        <!-- Accent bars -->
        <div class="cert-top-bar"></div>
        <div class="cert-bottom-bar"></div>

        <!-- Watermark -->
        <div class="cert-watermark">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;">
            <defs>
              <pattern id="cert-grid-cv" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0b132b" stroke-width="0.3" opacity="0.06"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cert-grid-cv)"/>
          </svg>
        </div>

        <!-- Certificate Content -->
        <div class="cert-preview-content" style="padding: 5% 6%;">
          <!-- Header -->
          <div class="cert-header">
            <div class="cert-org-logo">
              <svg class="cert-logo-mark" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="12" fill="none" stroke="#0b132b" stroke-width="1.2"/>
                <circle cx="14" cy="14" r="4" fill="#c5a456"/>
                <line x1="14" y1="2" x2="14" y2="8" stroke="#0b132b" stroke-width="1.2"/>
                <line x1="14" y1="20" x2="14" y2="26" stroke="#0b132b" stroke-width="1.2"/>
                <line x1="2" y1="14" x2="8" y2="14" stroke="#0b132b" stroke-width="1.2"/>
                <line x1="20" y1="14" x2="26" y2="14" stroke="#0b132b" stroke-width="1.2"/>
              </svg>
              <div class="cert-logo" style="font-size:0.6rem;">Ethiopian Future Builders Initiative</div>
            </div>
            <div class="cert-tagline" style="font-size:0.5rem;">Empowering Ethiopia's Next Generation of Innovators</div>
          </div>

          <div class="cert-divider" style="margin: 2px auto;"></div>

          <!-- Title -->
          <div class="cert-title-group" style="margin: 0;">
            <div class="cert-main-title" style="font-size: 1.4rem;">Certificate of Completion</div>
            <div class="cert-sub-title" style="font-size: 0.65rem;">This is to officially certify that</div>
          </div>

          <!-- Recipient -->
          <div style="margin: 2px 0;">
            <div class="cert-presented-to" style="font-size: 0.55rem;">Proudly Presented To</div>
            <div class="cert-recipient" style="font-size: 1.8rem; min-width: 220px; padding-bottom: 4px; margin: 2px 0;">${foundCert.name}</div>
          </div>

          <!-- Course -->
          <p class="cert-body-text" style="font-size: 0.55rem; line-height: 1.4; max-width: 440px; margin: 0 auto;">
            has successfully completed the full curriculum of
            <span class="cert-course-name">${foundCert.course}</span>,
            demonstrating outstanding commitment, technical proficiency, and readiness for the future of technology.
          </p>

          <!-- Achievement -->
          <div class="cert-achievement-row" style="margin: 2px 0;">
            ${foundCert.score ? `<span class="cert-score-chip" style="font-size: 0.55rem; padding: 2px 8px;">Final Score: ${foundCert.score}%</span>` : ''}
            ${foundCert.level ? `<span class="cert-achievement-badge ${(foundCert.level || '').toLowerCase()}" style="font-size: 0.55rem; padding: 2px 8px;">★ ${foundCert.level}</span>` : ''}
          </div>

          <div class="cert-divider" style="width:100%; opacity:0.4; margin: 2px 0;"></div>

          <!-- Footer -->
          <div class="cert-footer-layout" style="padding-top: 4px;">
            <div class="cert-footer-col left">
              <div class="cert-footer-label" style="font-size: 0.45rem;">Date of Issuance</div>
              <div class="cert-footer-value" style="font-size: 0.55rem;">${foundCert.date}</div>
              <div class="cert-footer-label" style="font-size: 0.45rem; margin-top:4px;">Credential ID</div>
              <div class="cert-footer-id" style="font-size: 0.55rem;">${foundCert.id}</div>
            </div>

            <div class="cert-footer-col">
              <div class="cert-qr-block" style="gap: 2px;">
                <svg class="cert-qr-svg" style="width: 32px; height: 32px;" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg" fill="#0b132b">
                  <rect x="2" y="2" width="16" height="16" rx="1.5" fill="none" stroke="#0b132b" stroke-width="1.2"/>
                  <rect x="5" y="5" width="10" height="10" rx="0.5"/>
                  <rect x="24" y="2" width="16" height="16" rx="1.5" fill="none" stroke="#0b132b" stroke-width="1.2"/>
                  <rect x="27" y="5" width="10" height="10" rx="0.5"/>
                  <rect x="2" y="24" width="16" height="16" rx="1.5" fill="none" stroke="#0b132b" stroke-width="1.2"/>
                  <rect x="5" y="27" width="10" height="10" rx="0.5"/>
                  <rect x="24" y="24" width="4" height="4"/>
                  <rect x="30" y="24" width="4" height="4"/>
                  <rect x="36" y="24" width="4" height="4"/>
                  <rect x="24" y="30" width="4" height="4"/>
                  <rect x="30" y="30" width="4" height="4"/>
                  <rect x="36" y="36" width="4" height="4"/>
                  <rect x="24" y="36" width="4" height="4"/>
                  <rect x="30" y="36" width="10" height="4"/>
                </svg>
                <div class="cert-verify-url" style="font-size: 0.4rem;">efbi.org/verify?id=${foundCert.id}</div>
              </div>
            </div>

            <div class="cert-footer-col right">
              <div class="cert-sigs-row" style="gap: 16px;">
                <div class="cert-sig-unit">
                  <span class="cert-sig-name" style="font-size: 0.95rem;">Tamerat Gebeyehu</span>
                  <div class="cert-sig-line" style="width: 100px; margin: 2px 0 1px;"></div>
                  <div class="cert-sig-label" style="font-size: 0.45rem;">Founder &amp; Director</div>
                </div>
                <div class="cert-sig-unit">
                  <span class="cert-sig-name" style="font-size:0.8rem;">${foundCert.instructor || 'EFBI Faculty'}</span>
                  <div class="cert-sig-line" style="width: 100px; margin: 2px 0 1px;"></div>
                  <div class="cert-sig-label" style="font-size: 0.45rem;">Lead Instructor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind Button Click Actions
    document.getElementById('btn-cv-download').onclick = () => {
      closeCertificateViewer();
      downloadCertificatePDF(foundCert.id);
    };

    document.getElementById('btn-cv-print').onclick = async () => {
      modal.style.display = 'none';
      window.triggerCertVerify(foundCert.id);
      window.location.hash = '#verify';
      await new Promise(r => setTimeout(r, 600));
      window.print();
    };

    document.getElementById('btn-cv-verify').onclick = () => {
      closeCertificateViewer();
      window.triggerCertVerify(foundCert.id);
      window.location.hash = '#verify';
    };

    document.getElementById('btn-cv-share').onclick = () => {
      const shareLink = `${window.location.origin}${window.location.pathname}#verify/${foundCert.id}`;
      navigator.clipboard.writeText(shareLink)
        .then(() => {
          showToast('Verifiable credential link copied to clipboard!', 'success');
        })
        .catch(() => {
          showToast('Failed to copy link. Please select and copy manually.', 'error');
        });
    };

    // Open Modal Overlay
    modal.style.display = 'flex';
    lucide.createIcons();

  } catch (err) {
    showToast('Failed to load credential verification details.', 'error');
  }
};

window.closeCertificateViewer = () => {
  const modal = document.getElementById('cert-viewer-modal');
  if (modal) {
    modal.style.display = 'none';
  }
};

function initCertificateViewer() {
  const modal = document.getElementById('cert-viewer-modal');
  const btnClose = document.getElementById('btn-close-cert-viewer');
  if (!modal || !btnClose) return;

  btnClose.addEventListener('click', closeCertificateViewer);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeCertificateViewer();
    }
  });
}

/* ==========================================================================
   STUDENT REGISTRATION FORM VALIDATION AND PERSISTENT SUBMISSION
   ========================================================================== */
function initRegistrationForm() {
  const form = document.getElementById('registration-form');
  const cardPanel = document.getElementById('register-card-panel');
  const successPanel = document.getElementById('register-success-panel');
  const btnReset = document.getElementById('btn-register-reset');

  if (!form) return;

  const fields = [
    { id: 'reg-name', errorId: 'error-reg-name', validate: (val) => val.trim().length > 3, step: 1 },
    { id: 'reg-email', errorId: 'error-reg-email', validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()), step: 1 },
    { id: 'reg-password', errorId: 'error-reg-password', validate: (val) => val.trim().length >= 6, step: 1 },
    { id: 'reg-region', errorId: 'error-reg-region', validate: (val) => val !== '', step: 2 },
    { id: 'reg-school', errorId: 'error-reg-school', validate: (val) => val.trim().length > 2, step: 2 },
    { id: 'reg-grade', errorId: 'error-reg-grade', validate: (val) => val !== '', step: 2 },
    { id: 'reg-interests', errorId: 'error-reg-interests', validate: (val) => val !== '', step: 3 }
  ];

  // ONBOARDING WIZARD STEPS MANAGEMENT
  let currentStep = 1;
  const totalSteps = 3;

  const showStep = (step) => {
    currentStep = step;
    
    // Switch active step content panels
    const containers = form.querySelectorAll('.onboarding-step');
    containers.forEach(c => {
      const stepIdx = parseInt(c.getAttribute('data-step-content'));
      if (stepIdx === step) {
        c.classList.add('active');
        c.style.display = 'block';
      } else {
        c.classList.remove('active');
        c.style.display = 'none';
      }
    });

    // Update Progress Indicators
    const indicators = cardPanel.querySelectorAll('.step-indicator');
    indicators.forEach(ind => {
      const indStep = parseInt(ind.getAttribute('data-step'));
      const circle = ind.querySelector('.step-num-circle');
      const textSpan = ind.querySelector('span:not(.step-num-circle)');
      if (indStep < step) {
        ind.className = 'step-indicator completed';
        if (circle) {
          circle.style.background = '#10b981';
          circle.style.border = 'none';
          circle.style.color = '#fff';
          circle.style.boxShadow = '0 4px 12px rgba(16,185,129,0.35)';
          circle.innerHTML = '✓';
        }
        if (textSpan) textSpan.style.color = '#10b981';
      } else if (indStep === step) {
        ind.className = 'step-indicator active';
        if (circle) {
          circle.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
          circle.style.border = 'none';
          circle.style.color = '#fff';
          circle.style.boxShadow = '0 4px 12px rgba(99,102,241,0.45)';
          circle.innerHTML = indStep;
        }
        if (textSpan) textSpan.style.color = '#a5b4fc';
      } else {
        ind.className = 'step-indicator';
        if (circle) {
          circle.style.background = 'rgba(99,102,241,0.15)';
          circle.style.border = '2px solid rgba(99,102,241,0.3)';
          circle.style.color = 'rgba(255,255,255,0.45)';
          circle.style.boxShadow = 'none';
          circle.innerHTML = indStep;
        }
        if (textSpan) textSpan.style.color = 'rgba(255,255,255,0.4)';
      }
    });

    // Update Line and Bar
    const lines = cardPanel.querySelectorAll('.step-line');
    lines.forEach((line, idx) => {
      if (idx < step - 1) {
        line.style.background = '#10b981';
      } else {
        line.style.background = 'rgba(99,102,241,0.2)';
      }
    });

    const progressBar = document.getElementById('onboarding-progress-bar');
    if (progressBar) {
      const percentage = (step / totalSteps) * 100;
      progressBar.style.width = percentage + '%';
    }
  };

  // Explicitly initialize Step 1 active state
  showStep(1);

  // Populate pathway cards immediately with defaults, then refresh from live DB
  populateRegistrationInterests([]);
  EFBIDatabase.request('getCourses').then(courses => {
    populateRegistrationInterests(courses || []);
  }).catch(() => {
    // Defaults already rendered above — no action needed
  });

  const validateStep = (step) => {
    let stepValid = true;
    fields.forEach(field => {
      if (field.step !== step) return;
      const el = document.getElementById(field.id);
      const errEl = document.getElementById(field.errorId);
      if (!el || !errEl) return;
      
      const isValid = field.validate(el.value);
      if (!isValid) {
        errEl.style.display = 'block';
        el.style.borderColor = 'var(--danger)';
        stepValid = false;
      } else {
        errEl.style.display = 'none';
        el.style.borderColor = 'var(--border-color)';
      }
    });
    return stepValid;
  };

  // Wire up Next buttons
  const nextButtons = form.querySelectorAll('.btn-next-step');
  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = parseInt(btn.getAttribute('data-next'));
      const activeStep = nextStep - 1;
      
      if (validateStep(activeStep)) {
        showStep(nextStep);
      } else {
        showToast('Please fill out all required fields before proceeding.', 'error');
      }
    });
  });

  // Wire up Back buttons
  const prevButtons = form.querySelectorAll('.btn-prev-step');
  prevButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const prevStep = parseInt(btn.getAttribute('data-prev'));
      showStep(prevStep);
    });
  });

  // Step indicator click navigation
  const stepIndicators = cardPanel.querySelectorAll('.step-indicator');
  stepIndicators.forEach(ind => {
    ind.style.cursor = 'pointer';
    ind.addEventListener('click', () => {
      const targetStep = parseInt(ind.getAttribute('data-step'));
      if (targetStep < currentStep) {
        showStep(targetStep);
      } else if (targetStep > currentStep) {
        if (validateStep(currentStep)) {
          showStep(targetStep);
        }
      }
    });
  });


  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isFormValid = true;

    // Run validations (with null-guards for safety)
    try {
      fields.forEach(field => {
        const el = document.getElementById(field.id);
        const errEl = document.getElementById(field.errorId);
        if (!el || !errEl) return; // skip if element not in DOM
        const isValid = field.validate(el.value);

        if (!isValid) {
          errEl.style.display = 'block';
          el.style.borderColor = 'var(--danger)';
          isFormValid = false;
        } else {
          errEl.style.display = 'none';
          el.style.borderColor = 'var(--border-color)';
        }
      });
    } catch (validationErr) {
      console.error('Validation error:', validationErr);
    }

    if (isFormValid) {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i data-lucide="loader" class="spin-animation" style="width: 14px;"></i> Submitting...';
      lucide.createIcons();
      
      showToast('Submitting application details...', 'success');
      
      const payload = {
        name: document.getElementById('reg-name').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value.trim(),
        country: document.getElementById('reg-country').value.trim(),
        region: document.getElementById('reg-region').value,
        school: document.getElementById('reg-school').value.trim(),
        grade: document.getElementById('reg-grade').value,
        interest: document.getElementById('reg-interests').value,
        why: document.getElementById('reg-why').value.trim()
      };

      try {
        // FRONTEND DEDUP: quick email check before hitting the server
        // (non-fatal — if the check fails we still attempt to register)
        try {
          const existingStudents = await EFBIDatabase.request('getStudents');
          const emailAlreadyExists = existingStudents.some(
            s => s.email && s.email.trim().toLowerCase() === payload.email.toLowerCase()
          );
          if (emailAlreadyExists) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
            const emailField = document.getElementById('reg-email');
            const emailError = document.getElementById('error-reg-email');
            emailField.style.borderColor = 'var(--danger)';
            emailError.textContent = 'An application with this email already exists in our system. Please contact us if you need help.';
            emailError.style.display = 'block';
            showToast('This email has already been registered.', 'error');
            return;
          }
        } catch (_dedupErr) {
          console.warn('Dedup check skipped (backend issue):', _dedupErr.message);
        }

        await EFBIDatabase.request('addStudent', payload);

        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';

        // Auto-login newly registered student
        const newStudentSession = {
          id: 'STUDENT-' + Date.now(),
          name: payload.name,
          email: payload.email,
          country: payload.country,
          region: payload.region,
          school: payload.school,
          grade: payload.grade,
          interest: payload.interest,
          status: 'Approved',
          joined: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        };

        localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(newStudentSession));
        applyStudentAuthState();

        showToast(`Welcome to EFBI, ${payload.name.split(' ')[0]}! Your account is active. 🎉`, 'success');
        
        form.reset();
        renderAdminTables();

        // Direct redirect to My Courses dashboard!
        window.location.hash = '#my-courses';

      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
        showToast(getFriendlyErrorMessage(err, 'student-registration'), 'error');
        console.error(err);
      }
    }
  });

  // Input focus border resets
  fields.forEach(field => {
    const el = document.getElementById(field.id);
    if (!el) return;
    el.addEventListener('focus', () => {
      el.style.borderColor = 'var(--primary-hover)';
    });
    el.addEventListener('blur', () => {
      el.style.borderColor = 'var(--border-color)';
    });
  });

  btnReset.addEventListener('click', () => {
    successPanel.style.display = 'none';
    cardPanel.style.display = 'block';
    
    // Clear all pathway card selections
    const cards = cardPanel.querySelectorAll('.pathway-card');
    cards.forEach(c => c.classList.remove('selected'));
    
    // Reset inputs
    form.reset();
    
    // Show step 1
    showStep(1);
  });
}

/* ==========================================================================
   BLOG CATAGORIES FILTER
   ========================================================================== */
function initBlogFilter() {
  const searchInput = document.getElementById('blog-search');
  const filterBtns = document.querySelectorAll('[data-blog-filter]');
  const blogCards = document.querySelectorAll('#blog-grid .blog-card');
  
  if (blogCards.length === 0) return;

  let activeFilter = 'all';
  let searchQuery = '';

  const filterBlog = () => {
    blogCards.forEach(card => {
      const cardCat = card.getAttribute('data-category');
      const cardTitle = card.querySelector('.blog-card-title').textContent.toLowerCase();
      const cardDesc = card.querySelector('.blog-card-desc').textContent.toLowerCase();
      
      const matchesFilter = activeFilter === 'all' || cardCat.toLowerCase().includes(activeFilter.toLowerCase()) || activeFilter.toLowerCase().includes(cardCat.toLowerCase());
      const matchesSearch = cardTitle.includes(searchQuery) || cardDesc.includes(searchQuery);

      if (matchesFilter && matchesSearch) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  };

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    filterBlog();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-blog-filter');
      filterBlog();
    });
  });
}

/* ==========================================================================
   CONTACT FORM HANDLER
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const fields = [
    { id: 'contact-name', errorId: 'error-contact-name', validate: (val) => val.trim().length > 3 },
    { id: 'contact-email', errorId: 'error-contact-email', validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) },
    { id: 'contact-subject', errorId: 'error-contact-subject', validate: (val) => val.trim().length > 3 },
    { id: 'contact-msg', errorId: 'error-contact-msg', validate: (val) => val.trim().length > 10 }
  ];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isFormValid = true;

    fields.forEach(field => {
      const el = document.getElementById(field.id);
      const errEl = document.getElementById(field.errorId);
      if (!el || !errEl) return;
      const isValid = field.validate(el.value);

      if (!isValid) {
        errEl.style.display = 'block';
        el.style.borderColor = 'var(--danger)';
        isFormValid = false;
      } else {
        errEl.style.display = 'none';
        el.style.borderColor = 'var(--border-color)';
      }
    });

    if (isFormValid) {
      showToast('Sending message...', 'success');
      
      const payload = {
        name: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        subject: document.getElementById('contact-subject').value.trim(),
        message: document.getElementById('contact-msg').value.trim()
      };

      try {
        await EFBIDatabase.request('sendContactMessage', payload);
        showToast('Message sent! We will contact you soon.', 'success');
        form.reset();
      } catch (err) {
        showToast(getFriendlyErrorMessage(err, 'contact-message'), 'error');
      }
    }
  });
}

/* ==========================================================================
   ADMIN PORTAL PORTLET (Dashboard views & controllers)
   ========================================================================== */
function initAdminDashboard() {
  const menuItems = document.querySelectorAll('.admin-sidebar .admin-menu-item');
  const panels = document.querySelectorAll('.admin-view-panel');
  const btnRefresh = document.getElementById('btn-admin-refresh');
  const btnAddStudent = document.getElementById('btn-admin-add-student');
  const btnIssueCert = document.getElementById('btn-admin-issue-cert');
  
  if (menuItems.length === 0) return;

  // Sidebar Tab Switching
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');
      
      const tabId = item.getAttribute('data-tab');
      state.activeAdminTab = tabId;
      
      panels.forEach(panel => {
        if (panel.id === tabId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
      
      if (tabId === 'admin-analytics') {
        renderAdminCharts();
      }
    });
  });

  // Student search in tables
  const studentSearchInput = document.getElementById('admin-student-search');
  studentSearchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    renderAdminTables(val, '');
  });

  // Certificate search in tables
  const certSearchInput = document.getElementById('admin-cert-search');
  certSearchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    renderAdminTables('', val);
  });

  // Course search in tables
  const courseSearchInput = document.getElementById('admin-course-search');
  if (courseSearchInput) {
    courseSearchInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase().trim();
      renderAdminTables('', '', val);
    });
  }

  // Refresh Analytics metrics
  btnRefresh.addEventListener('click', async () => {
    showToast('Syncing with database...', 'success');
    btnRefresh.innerHTML = '<i data-lucide="loader" class="spin-animation" style="width: 14px;"></i> Refreshing...';
    lucide.createIcons();

    try {
      const students = await EFBIDatabase.request('getStudents');
      const certificates = await EFBIDatabase.request('getCertificates');

      btnRefresh.innerHTML = '<i data-lucide="refresh-cw" style="width: 14px;"></i> Refresh Analytics';
      
      // Update widgets dynamically
      const totalPending = students.filter(s => s.status === 'Pending').length;
      const totalApproved = students.filter(s => s.status === 'Approved').length;
      
      document.getElementById('admin-stat-total-apps').textContent = students.length;
      document.getElementById('admin-stat-approved').textContent = totalApproved;
      document.getElementById('admin-stat-pending').textContent = totalPending;
      document.getElementById('admin-stat-certs').textContent = certificates.length;
      
      renderAdminTables();
      renderAdminCharts();
      showToast('Database synced successfully.', 'success');
      lucide.createIcons();

    } catch (err) {
      btnRefresh.innerHTML = '<i data-lucide="refresh-cw" style="width: 14px;"></i> Refresh Analytics';
      showToast(getFriendlyErrorMessage(err, 'admin-sync'), 'error');
      console.error(err);
    }
  });

  // Add student profile — proper modal
  btnAddStudent.addEventListener('click', () => openAddStudentModal());

  // Issue new certificate — proper modal
  btnIssueCert.addEventListener('click', () => openIssueCertModal());

  // ── Course Modal Setup ─────────────────────────────────────────────────── //
  const courseModal          = document.getElementById('admin-course-modal');
  const btnAddCourse         = document.getElementById('btn-admin-add-course');
  const btnCloseCourseModal  = document.getElementById('btn-close-course-modal');
  const btnCancelCourse      = document.getElementById('btn-cancel-course');
  const courseForm           = document.getElementById('admin-course-form');
  const btnSaveCourse        = document.getElementById('btn-save-course');

  // Helper: set a select element value safely (handles mismatches)
  const setSelect = (id, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    const target = (value || '').toString().trim().toLowerCase();
    for (const opt of el.options) {
      if (opt.value.trim().toLowerCase() === target) {
        el.value = opt.value;
        return;
      }
    }
    if (el.options.length > 0) el.selectedIndex = 0;
  };

  // Helper: highlight a field as valid/invalid
  const markField = (id, valid) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = valid ? '' : 'var(--danger)';
  };

  // YouTube Video URL Validator
  const isValidYouTubeUrl = (url) => {
    if (!url) return false;
    const trimmed = url.trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return true;
    return getYouTubeId(trimmed) !== '';
  };

  // ── Curriculum State ────────────────────────────────────────────────────── //
  window.adminEditCurriculum = {
    lessons: [],
    quizzes: {}, // keys: moduleIdx, value: array of questions
    activeModuleIdx: 0
  };

  // Helper: Save active module fields from UI inputs to state
  const saveActiveModuleFieldsToState = () => {
    const idx = window.adminEditCurriculum.activeModuleIdx;
    if (idx === null || idx === undefined) return;

    const mTitleInput = document.getElementById('module-edit-title');
    const mVideoInput = document.getElementById('module-edit-video');
    const mDescInput  = document.getElementById('module-edit-desc');
    const mNotesInput = document.getElementById('module-edit-notes');
    const mResInput   = document.getElementById('module-edit-resources');

    if (!mTitleInput) return; // not initialized or modal closed

    const mTitle = mTitleInput.value.trim();
    const mVideo = mVideoInput.value.trim();
    const mDesc  = mDescInput.value.trim();
    const mNotes = mNotesInput.value.trim();
    const mRes   = mResInput.value.trim();

    let lesson = window.adminEditCurriculum.lessons.find(l => parseInt(l.moduleidx) === idx);
    if (!lesson) {
      lesson = { moduleidx: idx };
      window.adminEditCurriculum.lessons.push(lesson);
    }

    lesson.title = mTitle || `Module ${idx + 1}`;
    lesson.videourl = mVideo;
    lesson.quizurl = mDesc; // Using quizurl column for Lesson Description
    lesson.notestext = mNotes;
    lesson.resourceslinks = mRes;

    // Save quiz questions from UI container
    const questions = [];
    const qElements = document.querySelectorAll('#module-questions-container .quiz-question-item');
    qElements.forEach(qEl => {
      const qText = qEl.querySelector('.quiz-q-text').value.trim();
      const opt1  = qEl.querySelector('.quiz-opt-1').value.trim();
      const opt2  = qEl.querySelector('.quiz-opt-2').value.trim();
      const opt3  = qEl.querySelector('.quiz-opt-3').value.trim();
      const opt4  = qEl.querySelector('.quiz-opt-4').value.trim();
      const ans   = parseInt(qEl.querySelector('.quiz-q-ans').value) || 0;

      if (qText) {
        questions.push({
          q: qText,
          opts: [opt1, opt2, opt3, opt4],
          a: ans
        });
      }
    });
    window.adminEditCurriculum.quizzes[idx] = questions;
  };

  // Helper: Append a quiz question item to the visual editor
  const addQuizQuestionToUI = (qText = '', opts = ['', '', '', ''], correctAns = 0) => {
    const container = document.getElementById('module-questions-container');
    if (!container) return;

    const qCount = container.children.length;
    const div = document.createElement('div');
    div.className = 'quiz-question-item glass-card';
    div.style.padding = '16px';
    div.style.background = 'rgba(255,255,255,0.01)';
    div.style.border = '1px solid var(--border-color)';
    div.style.borderRadius = '8px';
    div.style.position = 'relative';
    div.style.marginBottom = '12px';

    div.innerHTML = `
      <button type="button" class="btn-remove-question" style="position: absolute; right: 12px; top: 12px; background: transparent; border: none; color: var(--danger); cursor: pointer;" title="Remove Question">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
      <div style="font-weight: 700; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px;">Question ${qCount + 1}</div>
      <div class="form-group" style="margin-bottom: 12px;">
        <input type="text" class="form-control quiz-q-text" placeholder="Enter quiz question..." value="${qText.replace(/"/g, '&quot;')}" required style="font-weight: 600;">
      </div>
      <div class="grid-2" style="gap: 12px; margin-bottom: 12px;">
        <input type="text" class="form-control quiz-opt-1" placeholder="Option A" value="${opts[0].replace(/"/g, '&quot;')}" required>
        <input type="text" class="form-control quiz-opt-2" placeholder="Option B" value="${opts[1].replace(/"/g, '&quot;')}" required>
      </div>
      <div class="grid-2" style="gap: 12px; margin-bottom: 12px;">
        <input type="text" class="form-control quiz-opt-3" placeholder="Option C" value="${opts[2].replace(/"/g, '&quot;')}" required>
        <input type="text" class="form-control quiz-opt-4" placeholder="Option D" value="${opts[3].replace(/"/g, '&quot;')}" required>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
        <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Correct Option:</label>
        <select class="form-control quiz-q-ans" style="width: auto; padding: 4px 8px; font-size: 0.8rem;">
          <option value="0" ${correctAns === 0 ? 'selected' : ''}>Option A</option>
          <option value="1" ${correctAns === 1 ? 'selected' : ''}>Option B</option>
          <option value="2" ${correctAns === 2 ? 'selected' : ''}>Option C</option>
          <option value="3" ${correctAns === 3 ? 'selected' : ''}>Option D</option>
        </select>
      </div>
    `;

    div.querySelector('.btn-remove-question').addEventListener('click', () => {
      div.remove();
      // Re-index titles
      container.querySelectorAll('.quiz-question-item').forEach((item, index) => {
        item.querySelector('div').textContent = `Question ${index + 1}`;
      });
    });

    container.appendChild(div);
    lucide.createIcons();
  };

  // Helper: Load a module's fields from state to UI inputs
  const loadModuleFieldsFromState = (idx) => {
    window.adminEditCurriculum.activeModuleIdx = idx;

    let lesson = window.adminEditCurriculum.lessons.find(l => parseInt(l.moduleidx) === idx);
    if (!lesson) {
      lesson = {
        moduleidx: idx,
        title: `Module ${idx + 1}: `,
        videourl: '',
        quizurl: '', // Lesson Description
        notestext: '',
        resourceslinks: ''
      };
      window.adminEditCurriculum.lessons.push(lesson);
    }

    document.getElementById('module-edit-title').value     = lesson.title || '';
    document.getElementById('module-edit-video').value     = lesson.videourl || '';
    document.getElementById('module-edit-desc').value      = lesson.quizurl || ''; // Lesson Description
    document.getElementById('module-edit-notes').value     = lesson.notestext || '';
    document.getElementById('module-edit-resources').value = lesson.resourceslinks || '';

    // Load Quiz Questions
    const container = document.getElementById('module-questions-container');
    if (container) {
      container.innerHTML = '';
      const questions = window.adminEditCurriculum.quizzes[idx] || [];
      questions.forEach(q => {
        addQuizQuestionToUI(q.q, q.opts, q.a);
      });
    }
    lucide.createIcons();
  };

  // Helper: Populate the module selector dropdown
  const updateModuleSelectorDropdown = (numModules) => {
    const select = document.getElementById('course-module-select');
    if (!select) return;
    const oldVal = select.value;

    select.innerHTML = '';
    for (let i = 0; i < numModules; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      const lesson = window.adminEditCurriculum.lessons.find(l => parseInt(l.moduleidx) === i);
      const title = lesson && lesson.title ? lesson.title : `Module ${i + 1}`;
      opt.textContent = title.length > 32 ? title.substring(0, 32) + '...' : title;
      select.appendChild(opt);
    }

    if (oldVal !== '' && parseInt(oldVal) < numModules) {
      select.value = oldVal;
    } else {
      select.selectedIndex = 0;
    }
  };

  // Add event listener to module count change
  const modulesInput = document.getElementById('course-modules');
  if (modulesInput) {
    modulesInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value) || 5;
      updateModuleSelectorDropdown(val);
    });
  }

  // Add event listener to module dropdown selection changes
  const moduleSelect = document.getElementById('course-module-select');
  if (moduleSelect) {
    moduleSelect.addEventListener('change', (e) => {
      saveActiveModuleFieldsToState();
      const newIdx = parseInt(e.target.value) || 0;
      loadModuleFieldsFromState(newIdx);
    });
  }

  // Add quiz question click handler
  const btnAddQuestion = document.getElementById('btn-add-quiz-question');
  if (btnAddQuestion) {
    btnAddQuestion.addEventListener('click', () => {
      addQuizQuestionToUI('', ['', '', '', ''], 0);
    });
  }

  // Wire up editor tab switcher click events
  document.querySelectorAll('.course-editor-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Save current tab's active module fields if we are leaving the modules tab
      saveActiveModuleFieldsToState();

      document.querySelectorAll('.course-editor-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = '';
        b.style.border = '';
      });
      btn.classList.add('active');
      btn.style.background = 'var(--bg-secondary)';
      btn.style.border = '1px solid var(--border-color)';
      btn.style.borderBottom = 'none';

      const targetTab = btn.getAttribute('data-editor-tab');
      document.querySelectorAll('.course-editor-tab-content').forEach(p => p.style.display = 'none');
      const targetPanel = document.getElementById(targetTab);
      if (targetPanel) targetPanel.style.display = 'block';

      // Re-populate names of modules in selector dropdown when entering modules tab
      if (targetTab === 'course-tab-modules') {
        const numModules = parseInt(document.getElementById('course-modules').value) || 5;
        updateModuleSelectorDropdown(numModules);
        loadModuleFieldsFromState(parseInt(document.getElementById('course-module-select').value) || 0);
      }
    });
  });

  const openCourseModal = async (course = null) => {
    if (!courseModal) return;
    courseForm.reset();

    // Reset Tabs
    document.querySelectorAll('.course-editor-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-editor-tab') === 'course-tab-info');
      btn.style.background = btn.getAttribute('data-editor-tab') === 'course-tab-info' ? 'var(--bg-secondary)' : '';
      btn.style.border = btn.getAttribute('data-editor-tab') === 'course-tab-info' ? '1px solid var(--border-color)' : '';
      if (btn.classList.contains('active')) btn.style.borderBottom = 'none';
    });
    document.getElementById('course-tab-info').style.display = 'block';
    document.getElementById('course-tab-modules').style.display = 'none';

    // Clear field highlights
    ['course-title','course-instructor','course-category','course-duration','course-modules','course-short-desc','course-full-desc']
      .forEach(id => markField(id, true));

    const idField    = document.getElementById('course-id');
    const titleField = document.getElementById('course-modal-title');

    idField.value       = '';
    titleField.textContent = 'Create New Course';

    // Reset Curriculum State
    window.adminEditCurriculum = {
      lessons: [],
      quizzes: {},
      activeModuleIdx: 0
    };

    if (course) {
      // ── Populate form for edit ──
      idField.value = course.id || '';
      titleField.textContent = 'Edit Course';
      document.getElementById('course-title').value       = course.title       || '';
      document.getElementById('course-instructor').value  = course.instructor  || '';
      document.getElementById('course-duration').value    = course.duration    || '';
      document.getElementById('course-modules').value     = course.modules     || '';
      document.getElementById('course-short-desc').value  = course.shortDesc   || '';
      document.getElementById('course-full-desc').value   = course.fullDesc    || '';
      setSelect('course-category', course.category);
      setSelect('course-level',    course.level || 'Beginner');
      setSelect('course-status',   course.status || 'Draft');
      setSelect('course-icon',     course.icon   || 'book-open');

      // Load curriculum details from backend
      try {
        const [allLessons, allQuizzes] = await Promise.all([
          EFBIDatabase.request('getLessons'),
          EFBIDatabase.request('getQuizzes')
        ]);

        window.adminEditCurriculum.lessons = allLessons.filter(l => String(l.courseid) === String(course.id));
        const courseQuizzes = allQuizzes.filter(q => String(q.courseid) === String(course.id));
        
        courseQuizzes.forEach(q => {
          if (!window.adminEditCurriculum.quizzes[q.moduleidx]) {
            window.adminEditCurriculum.quizzes[q.moduleidx] = [];
          }
          window.adminEditCurriculum.quizzes[q.moduleidx].push(q);
        });
      } catch (err) {
        console.error('Failed to prefetch lessons and quizzes:', err);
      }
    }

    const numModules = parseInt(document.getElementById('course-modules').value) || 5;
    updateModuleSelectorDropdown(numModules);
    loadModuleFieldsFromState(0);

    courseModal.style.display = 'flex';
    // Trigger live preview sync
    courseModal.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const closeCourseModal = () => {
    if (courseModal) courseModal.style.display = 'none';
  };

  if (btnAddCourse)        btnAddCourse.addEventListener('click',        () => openCourseModal());
  if (btnCloseCourseModal) btnCloseCourseModal.addEventListener('click', closeCourseModal);
  if (btnCancelCourse)     btnCancelCourse.addEventListener('click',     closeCourseModal);

  // Close modal on overlay click (outside the dialog box)
  if (courseModal) {
    courseModal.addEventListener('click', (e) => {
      if (e.target === courseModal) closeCourseModal();
    });
  }

  // ── Handle Save Course form submission ────────────────────────────────── //
  if (courseForm) {
    courseForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Make sure we save the currently open module fields first
      saveActiveModuleFieldsToState();

      const title      = document.getElementById('course-title').value.trim();
      const instructor = document.getElementById('course-instructor').value.trim();
      const category   = document.getElementById('course-category').value;
      const level      = document.getElementById('course-level').value;
      const status     = document.getElementById('course-status').value;
      const duration   = document.getElementById('course-duration').value.trim();
      const modules    = document.getElementById('course-modules').value.trim();
      const icon       = document.getElementById('course-icon').value;
      const shortDesc  = document.getElementById('course-short-desc').value.trim();
      const fullDesc   = document.getElementById('course-full-desc').value.trim();
      const courseId   = document.getElementById('course-id').value.trim();

      // Validate Course level fields
      const validations = [
        { id: 'course-title',      ok: !!title      },
        { id: 'course-instructor', ok: !!instructor  },
        { id: 'course-category',   ok: !!category    },
        { id: 'course-duration',   ok: !!duration    },
        { id: 'course-modules',    ok: !!modules     },
        { id: 'course-short-desc', ok: !!shortDesc   },
        { id: 'course-full-desc',  ok: !!fullDesc    }
      ];
      let hasErrors = validations.some(v => !v.ok);
      validations.forEach(v => markField(v.id, v.ok));
      
      if (hasErrors) {
        showToast('Please fill in all required Course fields.', 'error');
        return;
      }

      // Validate Module level fields
      const numModulesVal = parseInt(modules) || 5;
      for (let i = 0; i < numModulesVal; i++) {
        const lesson = window.adminEditCurriculum.lessons.find(l => parseInt(l.moduleidx) === i);
        if (!lesson || !lesson.title.trim()) {
          showToast(`Module ${i + 1} has no title. Please configure it in the Modules tab.`, 'error');
          return;
        }
        if (lesson.videourl && !isValidYouTubeUrl(lesson.videourl)) {
          showToast(`Module ${i + 1} has an invalid YouTube URL.`, 'error');
          return;
        }
      }

      // Build payload — use null for new courses (not undefined, which JSON drops)
      const payload = {
        id:        courseId || null,
        title,
        instructor,
        category,
        level,
        status,
        duration,
        modules:   numModulesVal,
        icon,
        shortDesc,
        fullDesc
      };

      // Disable submit button to prevent double-save
      if (btnSaveCourse) {
        btnSaveCourse.disabled = true;
        btnSaveCourse.innerHTML = '<i data-lucide="loader" class="spin-animation" style="width:14px;"></i> Saving...';
        lucide.createIcons();
      }

      try {
        const result = await EFBIDatabase.request('saveCourse', payload);
        const finalCourseId = result.id;
        let savedLocally = result._savedLocally === true;

        // Save Lessons & Quizzes
        for (let i = 0; i < numModulesVal; i++) {
          const lesson = window.adminEditCurriculum.lessons.find(l => parseInt(l.moduleidx) === i) || {
            moduleidx: i,
            title: `Module ${i + 1}`,
            videourl: '',
            quizurl: '', // Lesson Description
            notestext: '',
            resourceslinks: ''
          };

          const lessonResult = await EFBIDatabase.request('saveLesson', {
            courseId: finalCourseId,
            moduleIdx: i,
            title: lesson.title,
            videourl: lesson.videourl,
            notestext: lesson.notestext,
            resourceslinks: lesson.resourceslinks,
            quizurl: lesson.quizurl // Lesson Description
          });
          if (lessonResult && lessonResult._savedLocally) savedLocally = true;

          const questions = window.adminEditCurriculum.quizzes[i] || [];
          const quizResult = await EFBIDatabase.request('saveQuizzes', {
            courseId: finalCourseId,
            moduleIdx: i,
            questions: questions
          });
          if (quizResult && quizResult._savedLocally) savedLocally = true;
        }

        if (savedLocally) {
          // Backend was unreachable — data is safe in localStorage but admin should know
          showToast(
            '⚠️ Saved locally (backend offline). Go to Admin → Settings and re-check your Apps Script URL, then redeploy.',
            'warning'
          );
        } else {
          showToast(
            courseId ? 'Course updated successfully! ✓' : 'New course created successfully! ✓',
            'success'
          );
        }
        closeCourseModal();
        renderAdminTables();
        renderPublicCourses();
      } catch (err) {
        showToast(getFriendlyErrorMessage(err, 'admin-save-course'), 'error');
      } finally {
        if (btnSaveCourse) {
          btnSaveCourse.disabled = false;
          btnSaveCourse.innerHTML = '<i data-lucide="save" style="width:14px;"></i> Save Course';
          lucide.createIcons();
        }
      }
    });
  }

  // ── Edit course (load into modal) ─────────────────────────────────────── //
  window.editCourse = async (id) => {
    try {
      const courses = await EFBIDatabase.request('getCourses');
      const course  = courses.find(c => c.id === id);
      if (course) {
        openCourseModal(course);
      } else {
        showToast('Course not found. Please refresh and try again.', 'error');
      }
    } catch (err) {
      showToast('Failed to load course details. Please try again.', 'error');
    }
  };

  // ── Toggle publish status directly from table ─────────────────────────── //
  window.toggleCoursePublish = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Published' ? 'Draft' : 'Published';
    try {
      const courses = await EFBIDatabase.request('getCourses');
      const course  = courses.find(c => c.id === id);
      if (!course) { showToast('Course not found.', 'error'); return; }

      const payload = { ...course, id, status: newStatus };
      await EFBIDatabase.request('saveCourse', payload);
      showToast(
        newStatus === 'Published'
          ? `"${course.title}" is now Published ✓`
          : `"${course.title}" moved to Draft`,
        newStatus === 'Published' ? 'success' : 'error'
      );
      renderAdminTables();
      renderPublicCourses();
    } catch (err) {
      showToast('Failed to update course status.', 'error');
    }
  };

  // ── Delete course ─────────────────────────────────────────────────────── //
  window.deleteCourse = async (id, title) => {
    const label = title ? `"${title}"` : 'this course';
    if (!confirm(`Are you sure you want to permanently delete ${label}?\n\nThis action cannot be undone.`)) return;
    try {
      showToast('Deleting course...', 'success');
      await EFBIDatabase.request('deleteCourse', { id });
      showToast('Course deleted successfully.', 'success');
      renderAdminTables();
      renderPublicCourses();
    } catch (err) {
      showToast('Failed to delete course. Please try again.', 'error');
    }
  };
}

function getTableSkeletonHtml(cols = 5, rows = 3) {
  return Array(rows).fill(0).map(() => `
    <tr>
      ${Array(cols).fill(0).map(() => `
        <td>
          <div class="skeleton skeleton-cell" style="width: ${30 + Math.random() * 60}%;"></div>
        </td>
      `).join('')}
    </tr>
  `).join('');
}

async function renderAdminTables(studentSearch = '', certSearch = '', courseSearch = '') {
  const studentsTbody = document.getElementById('admin-students-table-body');
  const certsTbody = document.getElementById('admin-certs-table-body');
  const coursesTbody = document.getElementById('admin-courses-table-body');

  if (!studentsTbody || !certsTbody) return;

  // Set skeleton loaders immediately while loading
  studentsTbody.innerHTML = getTableSkeletonHtml(7, 4);
  certsTbody.innerHTML = getTableSkeletonHtml(6, 3);
  if (coursesTbody) coursesTbody.innerHTML = getTableSkeletonHtml(7, 3);

  try {
    const students = await EFBIDatabase.request('getStudents');
    const certificates = await EFBIDatabase.request('getCertificates');
    
    let courses = [];
    try {
      courses = await EFBIDatabase.request('getCourses');
    } catch (cErr) {
      console.warn('Silent course fetch bypass:', cErr.message);
    }


    // Update main widgets values on render
    const totalPending  = students.filter(s => s.status === 'Pending').length;
    const totalApproved = students.filter(s => s.status === 'Approved').length;
    
    document.getElementById('admin-stat-total-apps').textContent = students.length;
    document.getElementById('admin-stat-approved').textContent   = totalApproved;
    document.getElementById('admin-stat-pending').textContent    = totalPending;
    document.getElementById('admin-stat-certs').textContent      = certificates.length;

    // Render live region distribution
    const regionGrid = document.getElementById('region-stats-grid');
    if (regionGrid && students.length > 0) {
      // Tally regions
      const regionMap = {};
      students.forEach(s => {
        const region = (s.region || 'Unknown').trim();
        regionMap[region] = (regionMap[region] || 0) + 1;
      });

      // Sort by count descending, take top 4
      const sorted = Object.entries(regionMap).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const total  = students.length;
      const colors = ['var(--primary-hover)', 'var(--secondary)', 'var(--accent)', 'var(--text-primary)'];

      regionGrid.innerHTML = sorted.map(([region, count], i) => `
        <div class="glass-card" style="padding: 16px;">
          <div style="font-size: 1.5rem; font-weight: 700; color: ${colors[i % colors.length]};">${Math.round(count / total * 100)}%</div>
          <div style="font-size: 0.85rem; font-weight: 600; margin: 4px 0;">${region}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${count} student${count !== 1 ? 's' : ''}</div>
        </div>
      `).join('');
    } else if (regionGrid) {
      regionGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 20px;">No student data yet. Region stats will appear after first applications.</div>';
    }

    // Render Students
    studentsTbody.innerHTML = '';
    
    if (students.length === 0) {
      studentsTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No student applications registered yet.</td></tr>';
    } else {
      const filteredStudents = students.filter(student => {
        return student.name.toLowerCase().includes(studentSearch) || 
               student.school.toLowerCase().includes(studentSearch) ||
               student.region.toLowerCase().includes(studentSearch) ||
               student.interest.toLowerCase().includes(studentSearch);
      });

      filteredStudents.forEach(student => {
        const tr = document.createElement('tr');
        const badgeClass = student.status === 'Approved' ? 'status-badge verified' : 'status-badge pending';
        
        tr.innerHTML = `
          <td style="font-weight: 700;">${student.name}</td>
          <td>${student.email}</td>
          <td>${student.region}</td>
          <td>${student.school}</td>
          <td>${student.interest}</td>
          <td><span class="${badgeClass}">${student.status}</span></td>
          <td>
            ${student.status === 'Pending' ? 
              `<button class="btn btn-accent" onclick="approveStudent(${student.id})" style="padding: 6px 12px; font-size: 0.75rem;"><i data-lucide="check" style="width: 12px;"></i> Approve</button>` : 
              `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Authorized</span>`
            }
          </td>
        `;
        studentsTbody.appendChild(tr);
      });
    }

    // Render Certificates
    certsTbody.innerHTML = '';
    
    if (certificates.length === 0) {
      certsTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No certificates issued yet.</td></tr>';
    } else {
      const filteredCerts = certificates.filter(cert => {
        return cert.id.toLowerCase().includes(certSearch) ||
               cert.name.toLowerCase().includes(certSearch) ||
               cert.course.toLowerCase().includes(certSearch);
      });

      filteredCerts.forEach(cert => {
        const tr = document.createElement('tr');
        const isPending = (cert.status || '').toLowerCase().includes('pending');
        const statusBadge = isPending
          ? `<span class="status-badge pending" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);">⏳ Pending Approval</span>`
          : `<span class="status-badge verified">${cert.status || 'Active'}</span>`;
        const actionBtns = isPending
          ? `<div style="display:flex;gap:8px;">
               <button class="btn btn-accent" onclick="approveCertificate('${cert.id}')" style="padding:6px 12px;font-size:0.75rem;"><i data-lucide="check" style="width:12px;vertical-align:middle;"></i> Approve</button>
               <button class="btn btn-secondary" onclick="revokeCert('${cert.id}')" style="padding:6px 12px;font-size:0.75rem;border-color:var(--danger);color:var(--danger);"><i data-lucide="x" style="width:12px;vertical-align:middle;"></i> Reject</button>
             </div>`
          : `<div style="display:flex;gap:8px;">
               <button class="btn btn-secondary" onclick="openCertificateViewer('${cert.id}')" style="padding:6px 12px;font-size:0.75rem;"><i data-lucide="eye" style="width:12px;vertical-align:middle;"></i> View</button>
               <button class="btn btn-secondary" onclick="revokeCert('${cert.id}')" style="padding:6px 12px;font-size:0.75rem;border-color:var(--danger);color:var(--danger);"><i data-lucide="x" style="width:12px;vertical-align:middle;"></i> Revoke</button>
             </div>`;
        tr.innerHTML = `
          <td style="font-weight:bold;color:var(--primary-hover);font-family:monospace;">${cert.id}</td>
          <td style="font-weight:700;">${cert.name}</td>
          <td>${cert.course}</td>
          <td>${cert.date}</td>
          <td>${statusBadge}</td>
          <td>${actionBtns}</td>
        `;
        certsTbody.appendChild(tr);
      });
      lucide.createIcons();
    }

    // Render Courses
    if (coursesTbody) {
      coursesTbody.innerHTML = '';
      if (courses.length === 0) {
        coursesTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No courses found.</td></tr>';
      } else {
        const filteredCourses = courses.filter(c => {
          return (c.title || '').toLowerCase().includes(courseSearch) ||
                 (c.instructor || '').toLowerCase().includes(courseSearch) ||
                 (c.category || '').toLowerCase().includes(courseSearch);
        });

        if (filteredCourses.length === 0) {
          coursesTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No courses match search.</td></tr>';
        } else {
          filteredCourses.forEach(course => {
            const tr = document.createElement('tr');
            const levelClass =
              course.level === 'Advanced'    ? 'status-badge verified' :
              course.level === 'Intermediate' ? 'status-badge pending'  :
              'status-badge active';
            const levelStyle     = course.level === 'Beginner' ? 'background: rgba(59, 130, 246, 0.1); color: var(--primary-hover);' : '';
            const isPublished    = (course.status || '').toLowerCase() === 'published';
            const statusClass    = isPublished ? 'status-badge verified' : 'status-badge pending';
            const toggleLabel    = isPublished ? 'Unpublish' : 'Publish';
            const toggleIcon     = isPublished ? 'eye-off' : 'eye';
            const toggleStyle    = isPublished
              ? 'border-color: var(--accent); color: var(--accent);'
              : 'border-color: var(--secondary); color: var(--secondary);';
            // Escape title for inline onclick attribute
            const safeTitle = (course.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

            tr.innerHTML = `
              <td style="font-weight: 700; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${safeTitle}">${course.title}</td>
              <td>${course.instructor || '—'}</td>
              <td><span class="${levelClass}" style="border-radius: 4px; ${levelStyle}">${course.level || 'Beginner'}</span></td>
              <td>${course.modules || '—'} Modules</td>
              <td>${course.duration || '—'}</td>
              <td>
                <span class="${statusClass}" style="border-radius: 4px; cursor: pointer;" onclick="toggleCoursePublish('${course.id}', '${course.status}')" title="Click to toggle status">
                  ${course.status || 'Draft'}
                </span>
              </td>
              <td style="white-space: nowrap;">
                <button class="btn btn-secondary" onclick="toggleCoursePublish('${course.id}', '${course.status}')" style="padding: 5px 10px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 3px; ${toggleStyle}" title="${toggleLabel}">
                  <i data-lucide="${toggleIcon}" style="width: 11px;"></i> ${toggleLabel}
                </button>
                <button class="btn btn-secondary" onclick="editCourse('${course.id}')" style="padding: 5px 10px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 3px;" title="Edit course">
                  <i data-lucide="edit-3" style="width: 11px;"></i> Edit
                </button>
                <button class="btn btn-secondary" onclick="deleteCourse('${course.id}', '${safeTitle}')" style="padding: 5px 10px; font-size: 0.72rem; border-color: var(--danger); color: var(--danger); display: inline-flex; align-items: center; gap: 3px;" title="Delete course">
                  <i data-lucide="trash-2" style="width: 11px;"></i> Delete
                </button>
              </td>
            `;
            coursesTbody.appendChild(tr);
          });
        }
      }
    }

    lucide.createIcons();

  } catch (err) {
    console.error('Error rendering tables:', err);
  }
}

// Global hooks for dynamic actions
window.approveStudent = async (id) => {
  try {
    await EFBIDatabase.request('approveStudent', { id });
    renderAdminTables();
    showToast(`Approved student application!`, 'success');
  } catch (err) {
    showToast(getFriendlyErrorMessage(err, 'admin-approve-student'), 'error');
  }
};

window.revokeCert = async (id) => {
  try {
    await EFBIDatabase.request('revokeCertificate', { id });
    renderAdminTables();
    showToast(`Revoked certificate ID: ${id}`, 'error');
  } catch (err) {
    showToast(getFriendlyErrorMessage(err, 'admin-revoke-cert'), 'error');
  }
};

window.approveCertificate = async (id) => {
  try {
    await EFBIDatabase.request('updateCertificateStatus', { id, status: 'Active' });
    renderAdminTables();
    updateNotifBadge();
    showToast(`✅ Certificate ${id} approved and activated!`, 'success');
  } catch (err) {
    showToast(getFriendlyErrorMessage(err, 'admin-approve-cert'), 'error');
  }
};

/* ==========================================================================
   ADMIN PORTAL ANALYTICS CHARTS (Using Chart.js)
   ========================================================================== */
async function renderAdminCharts() {
  const monthlyCtx = document.getElementById('monthlyRegistrationsChart');
  const popularityCtx = document.getElementById('coursePopularityChart');
  
  if (!monthlyCtx || !popularityCtx) return;

  const colors = getThemeChartColors();

  try {
    const students = await EFBIDatabase.request('getStudents');
    
    // Group monthly stats (Jan-Jun) based on registrations
    const monthlyCounts = [0, 0, 0, 0, 0, 0]; // Jan, Feb, Mar, Apr, May, Jun
    students.forEach(s => {
      const month = new Date(s.date).getMonth();
      if (month >= 0 && month <= 5) {
        monthlyCounts[month]++;
      }
    });

    // Group paths stats
    const courseCounts = { AI: 0, Web: 0, Mobile: 0, Python: 0, Entre: 0 };
    students.forEach(s => {
      const interest = s.interest.toLowerCase();
      if (interest.includes('ai') || interest.includes('artificial')) courseCounts.AI++;
      else if (interest.includes('web')) courseCounts.Web++;
      else if (interest.includes('mobile')) courseCounts.Mobile++;
      else if (interest.includes('python') || interest.includes('foundations')) courseCounts.Python++;
      else courseCounts.Entre++;
    });

    // 1. Line Chart: Monthly Registrations
    if (state.charts.monthlyRegs) {
      state.charts.monthlyRegs.destroy();
    }
    
    state.charts.monthlyRegs = new Chart(monthlyCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        },
        datasets: [{
          label: 'Student Inquiries',
          data: monthlyCounts, 
          borderColor: colors.primary,
          backgroundColor: colors.primaryGlow,
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: colors.primary,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: colors.grid },
            ticks: { color: colors.text, font: { family: 'Plus Jakarta Sans', weight: 'bold' } }
          },
          y: {
            grid: { color: colors.grid },
            ticks: { color: colors.text, font: { family: 'Plus Jakarta Sans' } }
          }
        }
      }
    });

    // 2. Doughnut Chart: Program popularity share
    if (state.charts.coursePopularity) {
      state.charts.coursePopularity.destroy();
    }

    state.charts.coursePopularity = new Chart(popularityCtx, {
      type: 'doughnut',
      data: {
        labels: ['AI', 'Web Dev', 'Mobile Dev', 'Foundations', 'Entrepreneurship'],
        datasets: [{
          data: [
            courseCounts.AI,
            courseCounts.Web,
            courseCounts.Mobile,
            courseCounts.Python,
            courseCounts.Entre
          ],
          backgroundColor: [
            colors.primary,
            colors.secondary,
            colors.accent,
            '#6366f1',
            '#ef4444'
          ],
          borderWidth: 2,
          borderColor: colors.bg
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: colors.text, font: { family: 'Plus Jakarta Sans', size: 10, weight: 'bold' } }
          }
        },
        cutout: '65%'
      }
    });

  } catch (err) {
    console.error('Error rendering charts:', err);
  }
}

function getThemeChartColors() {
  const isDark = state.theme === 'dark';
  return {
    primary: isDark ? '#6366f1' : '#3b82f6',
    primaryGlow: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(59, 130, 246, 0.12)',
    secondary: isDark ? '#10b981' : '#059669',
    accent: isDark ? '#f59e0b' : '#d97706',
    grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
    text: isDark ? '#94a3b8' : '#475569',
    bg: isDark ? '#111827' : '#ffffff'
  };
}

function updateAdminChartsTheme() {
  if (window.location.hash === '#admin') {
    renderAdminCharts();
  }
}

/* ==========================================================================
   TOAST NOTIFICATION COMPONENT
   ========================================================================== */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'check-circle' : 'alert-triangle';
  const color = type === 'success' ? 'var(--secondary)' : 'var(--danger)';

  toast.innerHTML = `
    <i data-lucide="${icon}" style="stroke: ${color}; width: 18px;"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}

// Stylesheet declarations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes toastSlideOut {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(100px); }
}
@keyframes spin-animation {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin-animation {
  animation: spin-animation 1s linear infinite;
  display: inline-block;
  vertical-align: middle;
}
`;
document.head.appendChild(styleSheet);

/* ==========================================================================
   STUDENT PORTAL & AUTHENTICATION HANDLERS
   ========================================================================== */

const STUDENT_SESSION_KEY = 'efbi_student_session';

const studentSyllabi = {
  'artificial intelligence': [
    'Lesson 1: Introduction to Machine Learning & Data Preprocessing',
    'Lesson 2: Supervised Learning: Regression Models & Predictions',
    'Lesson 3: Deep Neural Networks & Backpropagation Algorithms',
    'Lesson 4: Computer Vision & Convolutional Neural Networks (CNNs)',
    'Lesson 5: Natural Language Processing & Transformer architectures'
  ],
  'web development': [
    'Lesson 1: HTML5 Semantic Structures, SEO Best Practices & Accessibility',
    'Lesson 2: CSS3 Styling custom tokens, Typography & Flexbox Layouts',
    'Lesson 3: Responsive Designs, CSS Grid & Micro-Animations',
    'Lesson 4: JavaScript Basics: Logic, Control flows & Functions',
    'Lesson 5: DOM Interactivity, Event Handlers & API Fetch Requests'
  ],
  'mobile app development': [
    'Lesson 1: Mobile App Architecture & UI/UX Design Guidelines',
    'Lesson 2: Flutter Environment Setup & Core Stateful Widgets',
    'Lesson 3: State Management Systems & Router Page Navigations',
    'Lesson 4: Fetching REST APIs & Local Database Storage',
    'Lesson 5: Building Automation bundles & App Store Releases'
  ],
  'programming foundations': [
    'Lesson 1: Logic, Flowcharts & Computational Problem-Solving',
    'Lesson 2: Python Data Types, Input/Output & Basic Variables',
    'Lesson 3: Control Structures: Conditions & Interactive Loops',
    'Lesson 4: Writing Custom Functions & Scope Rules',
    'Lesson 5: Structured Data Collections: Lists & Dictionaries'
  ],
  'entrepreneurship': [
    'Lesson 1: Ideation & Customer Problem Validation',
    'Lesson 2: Building MVPs & User Feedback Loop cycles',
    'Lesson 3: Business Model Canvas & Local Market Sizing',
    'Lesson 4: Pricing Strategies & Startup Revenue Models',
    'Lesson 5: Pitching startups & Presenting slides to investors'
  ],
  'leadership': [
    'Lesson 1: Public speaking & Clear communication strategies',
    'Lesson 2: Git, Github & Building portfolios',
    'Lesson 3: Resume writing & Scholarship application prep',
    'Lesson 4: LinkedIn profiles & Professional Networking',
    'Lesson 5: Mock Interviews & Career readiness workshops'
  ]
};

function initStudentAuth() {
  const showLoginBtn    = document.getElementById('btn-show-student-login');
  const showLoginBtnMobile = document.getElementById('btn-show-student-login-mobile');
  const closeLoginBtn   = document.getElementById('btn-close-student-login');
  const loginModal      = document.getElementById('student-login-modal');
  const loginForm       = document.getElementById('student-login-form');
  const loginError      = document.getElementById('student-login-error');
  const loginSubmitBtn  = document.getElementById('student-login-submit-btn');
  const studentLogoutBtn = document.getElementById('btn-student-logout');
  const studentLogoutBtnMobile = document.getElementById('btn-student-logout-mobile');
  const goRegisterLink  = document.getElementById('link-go-register');

  if (!loginModal) return;

  // Sync Navbar UI on load
  applyStudentAuthState();

  const closeMobileMenu = () => {
    const navLinks = document.getElementById('nav-links');
    const hamburger = document.getElementById('hamburger');
    if (navLinks) navLinks.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
  };

  const handleShowLoginModal = (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    loginModal.style.display = 'flex';
  };

  // Show Modal (Desktop)
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', handleShowLoginModal);
  }

  // Show Modal (Mobile)
  if (showLoginBtnMobile) {
    showLoginBtnMobile.addEventListener('click', (e) => {
      handleShowLoginModal(e);
      closeMobileMenu();
    });
  }

  // Close Modal
  if (closeLoginBtn) {
    closeLoginBtn.addEventListener('click', () => {
      loginModal.style.display = 'none';
    });
  }

  // Close Modal on Register Link click
  if (goRegisterLink) {
    goRegisterLink.addEventListener('click', () => {
      loginModal.style.display = 'none';
    });
  }

  // Submit Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('student-email').value.trim();
    const password = document.getElementById('student-password').value.trim();

    if (!email || !password) {
      loginError.textContent = 'Please enter both email and password.';
      loginError.style.display = 'block';
      return;
    }

    loginError.style.display = 'none';
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.innerHTML = '<i data-lucide="loader" class="spin-animation" style="width:14px;"></i> Signing in...';
    lucide.createIcons();

    try {
      const result = await EFBIDatabase.request('verifyStudentLogin', { email, password });

      if (result && result.authenticated) {
        localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(result.student));
        loginModal.style.display = 'none';
        applyStudentAuthState();
        
        // Show success and redirect
        showToast(`Welcome back, ${result.student.name}! 👋`, 'success');
        window.location.hash = '#profile';
        renderStudentDashboard();
      } else {
        throw new Error('Authentication failed.');
      }
    } catch (err) {
      loginError.textContent = getFriendlyErrorMessage(err, 'student-login');
      loginError.style.display = 'block';
    } finally {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.innerHTML = '<i data-lucide="log-in" style="width:16px;"></i> Sign In';
      lucide.createIcons();
    }
  });

  const handleLogout = () => {
    localStorage.removeItem(STUDENT_SESSION_KEY);
    applyStudentAuthState();
    showToast('Logged out successfully.', 'success');
    window.location.hash = '#home';
  };

  // Logout Student (Profile Page)
  const profileLogoutBtn = document.getElementById('btn-student-logout-profile');
  if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }

  // Logout Student (Desktop)
  if (studentLogoutBtn) {
    studentLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }

  // Logout Student (Mobile)
  if (studentLogoutBtnMobile) {
    studentLogoutBtnMobile.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
      closeMobileMenu();
    });
  }

  // Global document fallback listener for any logout button clicks
  document.addEventListener('click', (e) => {
    const logoutTarget = e.target.closest('#btn-student-logout-profile, #btn-student-logout-mobile, #btn-student-logout, [data-action="logout"]');
    if (logoutTarget) {
      e.preventDefault();
      handleLogout();
    }
  });

  // Profile Settings Form
  initStudentSettings();
  
  // Profile sidebar tabs
  initStudentTabs();
}

function applyStudentAuthState() {
  const isLoggedIn = localStorage.getItem(STUDENT_SESSION_KEY) !== null;
  const guestActions = document.getElementById('nav-guest-actions');
  const studentActions = document.getElementById('nav-student-actions');
  const mobileGuests = document.querySelectorAll('.mobile-auth-guest');
  const mobileStudents = document.querySelectorAll('.mobile-auth-student');

  let hasEnrolledCourse = false;
  if (isLoggedIn) {
    try {
      const student = JSON.parse(localStorage.getItem(STUDENT_SESSION_KEY));
      if (student && student.interest && student.interest.trim() !== '') {
        hasEnrolledCourse = true;
      }
    } catch (e) {
      console.warn('Error reading student session for nav updates:', e);
    }
  }

  const desktopNavItem = document.getElementById('nav-mycourses-desktop');
  const mobileLink = document.querySelector('.mobile-auth-mycourses');

  if (isLoggedIn) {
    if (guestActions) guestActions.style.display = 'none';
    if (studentActions) studentActions.style.display = 'flex';
    
    mobileGuests.forEach(el => el.style.display = 'none');
    mobileStudents.forEach(el => el.style.display = 'block');

    // Toggle My Courses navigation link based on enrollment status
    if (hasEnrolledCourse) {
      if (desktopNavItem) desktopNavItem.style.display = 'block';
      if (mobileLink) mobileLink.style.display = 'block';
    } else {
      if (desktopNavItem) desktopNavItem.style.display = 'none';
      if (mobileLink) mobileLink.style.display = 'none';
    }
  } else {
    if (guestActions) guestActions.style.display = 'flex';
    if (studentActions) studentActions.style.display = 'none';
    
    mobileGuests.forEach(el => el.style.display = 'block');
    mobileStudents.forEach(el => el.style.display = 'none');

    if (desktopNavItem) desktopNavItem.style.display = 'none';
    if (mobileLink) mobileLink.style.display = 'none';
  }
  lucide.createIcons();
}

async function renderStudentDashboard() {
  const session = localStorage.getItem(STUDENT_SESSION_KEY);
  if (!session) {
    window.location.hash = '#home';
    return;
  }

  let student = JSON.parse(session);

  // Sync fresh details from backend database silently
  try {
    const students = await EFBIDatabase.request('getStudents');
    const freshStudent = students.find(s => s.email.toLowerCase().trim() === student.email.toLowerCase().trim());
    if (freshStudent) {
      student = freshStudent;
      localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(freshStudent));
    }
  } catch (err) {
    console.warn('Silent profile sync failed:', err);
  }

  // Update profile sidebar
  document.getElementById('profile-student-name').textContent = student.name;
  document.getElementById('profile-student-email').textContent = student.email;
  document.getElementById('profile-school').textContent = student.school || 'Unspecified';
  document.getElementById('profile-grade').textContent = student.grade || 'Unspecified';
  document.getElementById('profile-region').textContent = student.region || 'Unspecified';
  document.getElementById('profile-joined-date').textContent = student.date || 'Unspecified';

  // Render Status Badge
  const badge = document.getElementById('profile-status-badge');
  if (student.status === 'Approved') {
    badge.className = 'status-badge verified';
    badge.textContent = 'Active Enrolled';
    // Load certificates into the Certificates tab
    renderStudentCertificates(student);
  } else if (student.status === 'Rejected') {
    badge.className = 'status-badge inactive';
    badge.textContent = 'Declined';
  } else {
    badge.className = 'status-badge pending';
    badge.textContent = 'Pending Approval';
  }

  // Pre-fill the settings form with the current name
  const nameInput = document.getElementById('student-settings-name');
  if (nameInput) nameInput.value = student.name;
}

async function renderStudentSyllabus(student) {
  const grid = document.getElementById('student-syllabus-grid');
  if (!grid) return;

  const normalizedInterest = (student.interest || '').toLowerCase().trim();
  let syllabus = null;

  try {
    const courses = await EFBIDatabase.request('getCourses');
    const matchedCourse = courses.find(c => c.title.toLowerCase().trim() === normalizedInterest);
    
    if (matchedCourse) {
      const numModules = parseInt(matchedCourse.modules) || 5;
      syllabus = [];
      for (let i = 1; i <= numModules; i++) {
        if (i === 1) {
          syllabus.push(`Module 1: Introduction to ${matchedCourse.title}`);
        } else if (i === numModules) {
          syllabus.push(`Module ${i}: Advanced Applications & Capstone Project Review`);
        } else {
          syllabus.push(`Module ${i}: Core Concepts & Practical Workshop Part ${i - 1}`);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching courses for syllabus generation:', err);
  }

  // Fallback to legacy hardcoded syllabi
  if (!syllabus) {
    syllabus = studentSyllabi['programming foundations']; // Default fallback
    for (let key in studentSyllabi) {
      if (normalizedInterest.includes(key) || key.includes(normalizedInterest)) {
        syllabus = studentSyllabi[key];
        break;
      }
    }
  }

  // Load progress checkboxes
  const completedKey = 'efbi_completed_' + student.email.replace(/[^a-zA-Z0-9]/g, '_');
  const completedIndices = JSON.parse(localStorage.getItem(completedKey) || '[]');

  // Load quiz scores
  let quizScores = {};
  try {
    quizScores = await EFBIDatabase.request('getQuizScores', { email: student.email }) || {};
  } catch (err) {
    console.error('Error loading quiz scores:', err);
  }

  grid.innerHTML = syllabus.map((lesson, idx) => {
    const isCompleted = completedIndices.includes(idx);
    const scoreInfo = quizScores[idx];
    
    let quizBtnHtml = '';
    if (scoreInfo) {
      const isPassed = scoreInfo.percent >= 70;
      quizBtnHtml = `
        <button class="btn-quiz completed" onclick="openQuiz(${idx}, '${lesson.replace(/'/g, "\\'")}', '${student.email}', '${student.interest.replace(/'/g, "\\'")}')">
          <i data-lucide="award" style="width:14px;"></i> Quiz: ${scoreInfo.percent}% (${isPassed ? 'Passed' : 'Failed'})
        </button>
      `;
    } else {
      quizBtnHtml = `
        <button class="btn-quiz" onclick="openQuiz(${idx}, '${lesson.replace(/'/g, "\\'")}', '${student.email}', '${student.interest.replace(/'/g, "\\'")}')">
          <i data-lucide="help-circle" style="width:14px;"></i> Take Quiz
        </button>
      `;
    }

    return `
      <div class="glass-card" style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: ${isCompleted ? 'var(--secondary-glow)' : 'var(--bg-tertiary)'}; color: ${isCompleted ? 'var(--secondary)' : 'var(--text-muted)'}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">
              ${idx + 1}
            </div>
            <span style="font-size: 0.9rem; font-weight: 600; color: ${isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)'};">${lesson}</span>
          </div>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; color: ${isCompleted ? 'var(--secondary)' : 'var(--text-muted)'}; white-space: nowrap;">
            <input type="checkbox" class="lesson-checkbox" data-idx="${idx}" ${isCompleted ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--secondary); cursor: pointer;">
            ${isCompleted ? 'Completed' : 'Mark Done'}
          </label>
        </div>
        <div style="display: flex; justify-content: flex-end; border-top: 1px dashed var(--border-color); padding-top: 8px; width: 100%;">
          ${quizBtnHtml}
        </div>
      </div>
    `;
  }).join('');

  // Update visual progress metrics
  updateProgressUI(completedIndices.length, syllabus.length);

  // Wire up checkbox toggles
  grid.querySelectorAll('.lesson-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const idx = parseInt(cb.getAttribute('data-idx'));
      let freshIndices = JSON.parse(localStorage.getItem(completedKey) || '[]');

      if (cb.checked) {
        if (!freshIndices.includes(idx)) freshIndices.push(idx);
        showToast('Lesson marked as completed!', 'success');
      } else {
        freshIndices = freshIndices.filter(i => i !== idx);
        showToast('Lesson unmarked.', 'error');
      }

      localStorage.setItem(completedKey, JSON.stringify(freshIndices));
      const activityKey = 'efbi_activity_' + student.email.replace(/[^a-zA-Z0-9]/g, '_');
      localStorage.setItem(activityKey, new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }));
      renderStudentSyllabus(student);
    });
  });
  lucide.createIcons();
}

function updateProgressUI(doneCount, totalCount) {
  const percent = totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0;
  const progressText = document.getElementById('student-progress-text');
  const progressBar = document.getElementById('student-progress-bar');

  if (progressText) progressText.textContent = `${percent}%`;
  if (progressBar) progressBar.style.width = `${percent}%`;
}

async function renderStudentCertificates(student) {
  const listContainer = document.getElementById('student-certificates-list');
  if (!listContainer) return;

  listContainer.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px; color:var(--text-muted); padding:40px; justify-content:center;">
      <i data-lucide="loader" class="spin-animation" style="width:18px;"></i>
      <span>Fetching credentials from registry…</span>
    </div>`;
  lucide.createIcons();

  try {
    const certificates = await EFBIDatabase.request('getCertificates');
    // Support multiple certificates per student name
    const myCerts = certificates.filter(c =>
      c.name.toLowerCase().trim() === student.name.toLowerCase().trim()
    );

    if (myCerts.length === 0) {
      // ── Empty State ────────────────────────────────────────────
      listContainer.innerHTML = `
        <div class="sc-empty-state">
          <div class="sc-empty-icon">
            <i data-lucide="award"></i>
          </div>
          <h3 class="sc-empty-title">No Certificates Yet</h3>
          <p class="sc-empty-desc">
            Complete all lessons in your enrolled course and pass the final assessment to earn your official EFBI Certificate of Completion — a verifiable, shareable credential.
          </p>
          <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:8px;">
            <a href="#my-courses" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:8px;">
              <i data-lucide="book-open" style="width:16px;"></i> Continue Learning
            </a>
            <a href="#courses" class="btn btn-secondary" style="display:inline-flex; align-items:center; gap:8px;">
              <i data-lucide="search" style="width:16px;"></i> Explore Courses
            </a>
          </div>
        </div>`;
      lucide.createIcons();
      return;
    }

    // ── Certificate Cards Grid ─────────────────────────────────
    const levelClass = (level) => {
      if (!level) return '';
      const l = level.toLowerCase();
      if (l === 'distinction') return 'sc-badge-distinction';
      if (l === 'merit')       return 'sc-badge-merit';
      if (l === 'pass')        return 'sc-badge-pass';
      return '';
    };
    const levelIcon = (level) => {
      if (!level) return '';
      const l = level.toLowerCase();
      if (l === 'distinction') return '★';
      if (l === 'merit')       return '◆';
      return '✓';
    };

    const cardsHtml = myCerts.map(cert => `
      <div class="sc-cert-card">

        <!-- Mini Certificate Thumbnail Preview -->
        <div class="sc-cert-thumb">
          <!-- Top accent bar -->
          <div class="sc-thumb-bar"></div>

          <!-- Watermark -->
          <svg class="sc-thumb-watermark" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <pattern id="tg-${cert.id}" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0b132b" stroke-width="0.4" opacity="0.08"/>
              </pattern>
            </defs>
            <rect width="200" height="120" fill="url(#tg-${cert.id})"/>
          </svg>

          <!-- Thumb Content -->
          <div class="sc-thumb-inner">
            <!-- EFBI logo mark -->
            <svg class="sc-thumb-logomark" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="11" fill="none" stroke="#0b132b" stroke-width="1.2"/>
              <circle cx="14" cy="14" r="3.5" fill="#c5a456"/>
              <line x1="14" y1="3" x2="14" y2="8" stroke="#0b132b" stroke-width="1.2"/>
              <line x1="14" y1="20" x2="14" y2="25" stroke="#0b132b" stroke-width="1.2"/>
              <line x1="3" y1="14" x2="8" y2="14" stroke="#0b132b" stroke-width="1.2"/>
              <line x1="20" y1="14" x2="25" y2="14" stroke="#0b132b" stroke-width="1.2"/>
            </svg>
            <div class="sc-thumb-heading">Certificate of Completion</div>
            <div class="sc-thumb-divider"></div>
            <div class="sc-thumb-name">${cert.name}</div>
            <div class="sc-thumb-course">${cert.course}</div>
          </div>

          <!-- Achievement level ribbon on thumb -->
          ${cert.level ? `<div class="sc-thumb-ribbon ${levelClass(cert.level)}">${levelIcon(cert.level)} ${cert.level}</div>` : ''}
        </div>

        <!-- Card Body -->
        <div class="sc-cert-body">
          <div class="sc-cert-info">
            <h3 class="sc-cert-course">${cert.course}</h3>
            <div class="sc-cert-meta-row">
              ${cert.level ? `<span class="sc-badge ${levelClass(cert.level)}">${levelIcon(cert.level)} ${cert.level}</span>` : ''}
              ${cert.score ? `<span class="sc-score-chip">Score: ${cert.score}%</span>` : ''}
            </div>
            <div class="sc-cert-details">
              <div class="sc-detail-item">
                <span class="sc-detail-label">Issued On</span>
                <span class="sc-detail-value">${cert.date}</span>
              </div>
              <div class="sc-detail-item">
                <span class="sc-detail-label">Credential ID</span>
                <span class="sc-detail-value sc-cert-id">${cert.id}</span>
              </div>
              <div class="sc-detail-item">
                <span class="sc-detail-label">Status</span>
                <span class="sc-detail-value" style="color:var(--success); font-weight:700;">
                  <i data-lucide="check-circle" style="width:12px; vertical-align:middle; margin-right:3px;"></i>${cert.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="sc-cert-actions">
            <button onclick="openCertificateViewer('${cert.id}')" class="sc-action-btn sc-action-view">
              <i data-lucide="eye" style="width:14px;"></i> View
            </button>
            <a href="#verify" onclick="triggerCertVerify('${cert.id}')" class="sc-action-btn sc-action-verify">
              <i data-lucide="shield-check" style="width:14px;"></i> Verify
            </a>
            <button onclick="downloadCertificatePDF('${cert.id}')" class="sc-action-btn sc-action-download">
              <i data-lucide="download" style="width:14px;"></i> Download PDF
            </button>
          </div>
        </div>

      </div>
    `).join('');

    listContainer.innerHTML = `<div class="sc-cert-grid">${cardsHtml}</div>`;
    lucide.createIcons();

  } catch (err) {
    listContainer.innerHTML = `
      <div style="color:var(--danger); font-size:0.85rem; text-align:center; padding:40px;">
        <i data-lucide="alert-circle" style="width:20px; margin-bottom:8px; display:block; margin:0 auto 8px;"></i>
        Error loading certificates. Please try again.
      </div>`;
    lucide.createIcons();
  }
}

// Helper to prefill and trigger certificate verifications
window.triggerCertVerify = (certId) => {
  const input = document.getElementById('cert-id-input');
  if (input) {
    input.value = certId;
    // Delay slightly to let hash routing finish navigating to #verify
    setTimeout(() => {
      const verifyBtn = document.getElementById('btn-verify-cert');
      if (verifyBtn) verifyBtn.click();
    }, 100);
  }
};

// Helper to download certificate as PDF via browser print dialog
window.downloadCertificatePDF = async (certId) => {
  // Navigate to verify page and trigger cert lookup
  window.location.hash = '#verify';
  await new Promise(r => setTimeout(r, 300));
  const input = document.getElementById('cert-id-input');
  if (input) {
    input.value = certId;
    const verifyBtn = document.getElementById('btn-verify-cert');
    if (verifyBtn) verifyBtn.click();
    // Wait for the certificate to render, then print
    await new Promise(r => setTimeout(r, 800));
    showToast('Opening print dialog — choose "Save as PDF" to download.', 'info');
    await new Promise(r => setTimeout(r, 400));
    window.print();
  }
};

function initStudentSettings() {
  const settingsForm = document.getElementById('student-settings-form');
  const nameInput = document.getElementById('student-settings-name');
  const passwordInput = document.getElementById('student-settings-password');
  const confirmPasswordInput = document.getElementById('student-settings-confirm-password');
  const errorEl = document.getElementById('student-settings-error');
  const saveBtn = document.getElementById('btn-save-student-settings');

  if (!settingsForm) return;

  // Pre-fill name from session
  const session = localStorage.getItem(STUDENT_SESSION_KEY);
  if (session) {
    const student = JSON.parse(session);
    nameInput.value = student.name;
  }

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const session = localStorage.getItem(STUDENT_SESSION_KEY);
    if (!session) return;
    const student = JSON.parse(session);

    const name = nameInput.value.trim();
    const newPassword = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!name) {
      errorEl.textContent = 'Full name is required.';
      errorEl.style.display = 'block';
      return;
    }

    const fields = { name };

    if (newPassword) {
      if (newPassword.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters long.';
        errorEl.style.display = 'block';
        return;
      }
      if (newPassword !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match.';
        errorEl.style.display = 'block';
        return;
      }
      fields.password = newPassword;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i data-lucide="loader" class="spin-animation" style="width:14px;"></i> Saving...';
    lucide.createIcons();

    try {
      await EFBIDatabase.request('updateStudentProfile', { email: student.email, fields });
      
      // Update session values
      student.name = name;
      if (newPassword) student.password = newPassword;
      localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(student));

      showToast('Profile updated successfully!', 'success');
      passwordInput.value = '';
      confirmPasswordInput.value = '';
      renderStudentDashboard();
    } catch (err) {
      errorEl.textContent = getFriendlyErrorMessage(err, 'profile-update');
      errorEl.style.display = 'block';
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i data-lucide="check" style="width: 14px;"></i> Save Profile Changes';
      lucide.createIcons();
    }
  });
}

function initStudentTabs() {
  const tabs = document.querySelectorAll('[data-student-tab]');
  const panels = document.querySelectorAll('.student-view-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = tab.getAttribute('data-student-tab');
      panels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });
}

/* ==========================================================================
   HOMEPAGE HERO VISUAL TYPEWRITER ANIMATION
   ========================================================================== */
function initHeroVisualAnimation() {
  const codeEl = document.getElementById('hero-animated-code');
  const termEl = document.getElementById('hero-animated-terminal');
  if (!codeEl || !termEl) return;

  const lines = [
    'import efbi_core',
    '',
    'def build_future(student):',
    '    path = student.interest',
    '    skills = [',
    '        "AI & Coding",',
    '        "Leadership",',
    '        "Innovation"',
    '    ]',
    '    return efbi_core.empower(skills)',
    '',
    '# Ready to build the nation!',
    'build_future("Ethiopian Youth")'
  ];

  function highlightPythonLine(text) {
    if (text.trim().startsWith('#')) {
      return `<span class='code-comment'>${text}</span>`;
    }
    let html = text;
    // Keywords
    const keywords = ['import', 'def', 'return'];
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      html = html.replace(regex, `<span class='code-keyword'>${kw}</span>`);
    });
    // Strings
    html = html.replace(/("[^"]*")/g, `<span class='code-string'>$1</span>`);
    // Functions
    html = html.replace(/\bdef\s+(\w+)\b/g, `def <span class='code-function'>$1</span>`);
    // Calls
    html = html.replace(/\b(\w+)(?=\()/g, `<span class='code-function'>$1</span>`);
    return html;
  }

  // Clear initial static content
  codeEl.innerHTML = '';
  termEl.innerHTML = '';

  let currentLineIndex = 0;
  let currentCharIndex = 0;
  let typedBuffer = '';

  // Add line 1 container
  let currentLineEl = createLineElement(1);
  codeEl.appendChild(currentLineEl);

  function createLineElement(num) {
    const el = document.createElement('div');
    el.style.display = 'block';
    
    const numSpan = document.createElement('span');
    numSpan.className = 'code-line';
    numSpan.textContent = num;
    el.appendChild(numSpan);
    
    const contentSpan = document.createElement('span');
    contentSpan.className = 'code-content';
    el.appendChild(contentSpan);

    return el;
  }

  function typeChar() {
    const currentLineText = lines[currentLineIndex];
    const contentSpan = currentLineEl.querySelector('.code-content');

    if (currentCharIndex < currentLineText.length) {
      typedBuffer += currentLineText[currentCharIndex];
      contentSpan.innerHTML = highlightPythonLine(typedBuffer) + '<span class="code-cursor"></span>';
      currentCharIndex++;
      setTimeout(typeChar, 20 + Math.random() * 15); // Fast natural typing speed
    } else {
      // Remove cursor from finished line
      const cursor = contentSpan.querySelector('.code-cursor');
      if (cursor) cursor.remove();

      currentLineIndex++;
      if (currentLineIndex < lines.length) {
        currentCharIndex = 0;
        typedBuffer = '';
        currentLineEl = createLineElement(currentLineIndex + 1);
        codeEl.appendChild(currentLineEl);
        setTimeout(typeChar, 80); // Small pause between lines
      } else {
        // Code typing is done, trigger terminal output animation
        setTimeout(animateTerminalOutput, 250);
      }
    }
  }

  function animateTerminalOutput() {
    termEl.innerHTML = '';
    
    // Line 1: typing the run command
    const line1 = document.createElement('div');
    line1.className = 'terminal-line';
    line1.innerHTML = '<span class="terminal-prompt">$ </span><span class="terminal-cmd"></span><span class="code-cursor"></span>';
    termEl.appendChild(line1);
    
    const cmdText = 'python main.py';
    let cmdCharIndex = 0;
    const cmdSpan = line1.querySelector('.terminal-cmd');
    const cursor = line1.querySelector('.code-cursor');

    function typeCmd() {
      if (cmdCharIndex < cmdText.length) {
        cmdSpan.textContent += cmdText[cmdCharIndex];
        cmdCharIndex++;
        setTimeout(typeCmd, 40);
      } else {
        if (cursor) cursor.remove();
        setTimeout(showOutputs, 300);
      }
    }

    function showOutputs() {
      const line2 = document.createElement('div');
      line2.className = 'terminal-line success';
      line2.style.opacity = '0';
      line2.style.transition = 'opacity 0.4s ease';
      line2.textContent = '>>> [EFBI Core] Status: Empowered 🌟';
      termEl.appendChild(line2);
      
      // Trigger reflow
      line2.offsetHeight;
      line2.style.opacity = '1';

      setTimeout(() => {
        const line3 = document.createElement('div');
        line3.className = 'terminal-line success';
        line3.style.opacity = '0';
        line3.style.transition = 'opacity 0.4s ease';
        line3.textContent = '>>> Impact: 100% Certified. Curriculum unlocked!';
        termEl.appendChild(line3);
        
        line3.offsetHeight;
        line3.style.opacity = '1';
      }, 300);
    }

    typeCmd();
  }

  // Start typing
  typeChar();
}


/* ==========================================================================
   ADD STUDENT MODAL (Replaces prompt())
   ========================================================================== */
function openAddStudentModal() {
  const modal = document.getElementById('add-student-modal');
  const form  = document.getElementById('add-student-form');
  const err   = document.getElementById('add-student-error');
  if (!modal) return;
  form.reset();
  err.style.display = 'none';
  modal.classList.add('open');
  lucide.createIcons();
}

function closeAddStudentModal() {
  const modal = document.getElementById('add-student-modal');
  if (modal) modal.classList.remove('open');
}

function initAddStudentModal() {
  const modal     = document.getElementById('add-student-modal');
  const form      = document.getElementById('add-student-form');
  const err       = document.getElementById('add-student-error');
  const btnClose  = document.getElementById('btn-close-add-student');
  const btnCancel = document.getElementById('btn-cancel-add-student');
  const btnSubmit = document.getElementById('btn-submit-add-student');

  if (!modal) return;

  btnClose.addEventListener('click', closeAddStudentModal);
  btnCancel.addEventListener('click', closeAddStudentModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAddStudentModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.style.display = 'none';

    const name     = document.getElementById('add-s-name').value.trim();
    const email    = document.getElementById('add-s-email').value.trim();
    const password = document.getElementById('add-s-password').value.trim();
    const region   = document.getElementById('add-s-region').value;
    const school   = document.getElementById('add-s-school').value.trim();
    const grade    = document.getElementById('add-s-grade').value;
    const interest = document.getElementById('add-s-interest').value.trim();
    const status   = document.getElementById('add-s-status').value;

    if (!name || !email || !password || !region || !school || !grade || !interest) {
      err.textContent = 'Please fill in all required fields.';
      err.style.display = 'block';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err.textContent = 'Please enter a valid email address.';
      err.style.display = 'block';
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i data-lucide="loader" class="spin-animation" style="width:14px;"></i> Adding...';
    lucide.createIcons();

    try {
      await EFBIDatabase.request('addStudent', {
        name, email, password, region, school, grade,
        interest, status, country: 'Ethiopia', why: 'Added by Administrator.'
      });
      closeAddStudentModal();
      renderAdminTables();
      renderAdminCharts();
      updateNotifBadge();
      showToast(`Student "${name}" added successfully!`, 'success');
    } catch (error) {
      err.textContent = getFriendlyErrorMessage(error, 'admin-add-student');
      err.style.display = 'block';
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i data-lucide="user-plus" style="width:14px;"></i> Add Student';
      lucide.createIcons();
    }
  });
}

/* ==========================================================================
   ISSUE CERTIFICATE MODAL (Replaces prompt())
   ========================================================================== */
async function openIssueCertModal(prefillName = '') {
  const modal   = document.getElementById('issue-cert-modal');
  const form    = document.getElementById('issue-cert-form');
  const err     = document.getElementById('issue-cert-error');
  const select  = document.getElementById('cert-course-name');
  const nameIn  = document.getElementById('cert-student-name');
  if (!modal) return;

  form.reset();
  err.style.display = 'none';
  if (prefillName) nameIn.value = prefillName;

  select.innerHTML = '<option value="" disabled selected>Select completed course</option>';
  try {
    const courses = await EFBIDatabase.request('getCourses');
    const published = courses.filter(c => c.status === 'Published');
    const defaults = [
      'Artificial Intelligence Fundamentals',
      'Web Development Bootcamp',
      'Mobile App Development',
      'Programming Foundations with Python',
      'Entrepreneurship & Innovation',
      'Leadership & Career Readiness'
    ];
    const options = published.length > 0 ? published.map(c => c.title) : defaults;
    options.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      select.appendChild(opt);
    });
  } catch {
    ['Artificial Intelligence Fundamentals','Web Development Bootcamp','Programming Foundations'].forEach(t => {
      const opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      select.appendChild(opt);
    });
  }

  modal.classList.add('open');
  lucide.createIcons();
}

function closeIssueCertModal() {
  const modal = document.getElementById('issue-cert-modal');
  if (modal) modal.classList.remove('open');
}

function initIssueCertModal() {
  const modal     = document.getElementById('issue-cert-modal');
  const form      = document.getElementById('issue-cert-form');
  const err       = document.getElementById('issue-cert-error');
  const btnClose  = document.getElementById('btn-close-issue-cert');
  const btnCancel = document.getElementById('btn-cancel-issue-cert');
  const btnSubmit = document.getElementById('btn-submit-issue-cert');

  if (!modal) return;

  btnClose.addEventListener('click', closeIssueCertModal);
  btnCancel.addEventListener('click', closeIssueCertModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeIssueCertModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.style.display = 'none';

    const name     = document.getElementById('cert-student-name').value.trim();
    const course   = document.getElementById('cert-course-name').value;
    const customId = document.getElementById('cert-custom-id').value.trim().toUpperCase() || undefined;
    const scoreRaw = document.getElementById('cert-score') ? parseInt(document.getElementById('cert-score').value, 10) : NaN;
    const score    = isNaN(scoreRaw) ? null : Math.min(100, Math.max(0, scoreRaw));
    let level      = document.getElementById('cert-level') ? document.getElementById('cert-level').value : '';

    // Auto-calculate achievement level if score provided and level left blank
    if (score !== null && !level) {
      if (score >= 90)      level = 'Distinction';
      else if (score >= 80) level = 'Merit';
      else if (score >= 70) level = 'Pass';
    }

    // Resolve instructor from selected course
    let instructor = null;
    try {
      const courses = await EFBIDatabase.request('getCourses');
      const found = courses.find(c => c.title === course);
      if (found) instructor = found.instructor || null;
    } catch { /* non-critical */ }

    if (!name || !course) {
      err.textContent = 'Please fill in the student name and select a course.';
      err.style.display = 'block';
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i data-lucide="loader" class="spin-animation" style="width:14px;"></i> Issuing...';
    lucide.createIcons();

    try {
      const cert = await EFBIDatabase.request('issueCertificate', { name, course, id: customId, score, level, instructor });
      closeIssueCertModal();
      renderAdminTables();
      updateNotifBadge();
      showToast(`Certificate issued: ${cert.id}`, 'success');
    } catch (error) {
      err.textContent = getFriendlyErrorMessage(error, 'admin-issue-cert');
      err.style.display = 'block';
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i data-lucide="award" style="width:14px;"></i> Issue Certificate';
      lucide.createIcons();
    }
  });
}

/* ==========================================================================
   STUDENT DETAIL MODAL (Admin)
   ========================================================================== */
let _detailStudentId = null;

function initStudentDetailModal() {
  const modal      = document.getElementById('student-detail-modal');
  const btnClose   = document.getElementById('btn-close-student-detail');
  const btnClose2  = document.getElementById('btn-detail-close');
  const btnApprove = document.getElementById('btn-detail-approve');
  const btnIssue   = document.getElementById('btn-detail-issue-cert');

  if (!modal) return;

  const closeModal = () => modal.classList.remove('open');
  btnClose.addEventListener('click', closeModal);
  if (btnClose2) btnClose2.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  btnApprove.addEventListener('click', async () => {
    if (!_detailStudentId) return;
    try {
      await EFBIDatabase.request('approveStudent', { id: _detailStudentId });
      showToast('Student approved successfully!', 'success');
      closeModal();
      renderAdminTables();
      updateNotifBadge();
    } catch (err) {
      showToast(getFriendlyErrorMessage(err, 'admin-approve-student'), 'error');
    }
  });

  btnIssue.addEventListener('click', async () => {
    const grid    = document.getElementById('student-detail-grid');
    const nameEl  = grid ? grid.querySelector('[data-field="name"]') : null;
    const prefill = nameEl ? nameEl.textContent : '';
    closeModal();
    await openIssueCertModal(prefill);
  });
}

window.openStudentDetail = async (studentId) => {
  const modal = document.getElementById('student-detail-modal');
  if (!modal) return;
  _detailStudentId = studentId;

  const grid = document.getElementById('student-detail-grid');
  const why  = document.getElementById('student-detail-why');
  const btnApprove = document.getElementById('btn-detail-approve');

  grid.innerHTML = Array(8).fill(0).map(() => `
    <div class="student-detail-item">
      <div class="skeleton skeleton-line short" style="margin-bottom:8px;"></div>
      <div class="skeleton skeleton-line medium"></div>
    </div>`).join('');
  why.textContent = 'Loading...';
  modal.classList.add('open');

  try {
    const students = await EFBIDatabase.request('getStudents');
    const s = students.find(st => st.id == studentId);
    if (!s) { showToast('Student not found.', 'error'); modal.classList.remove('open'); return; }

    const statusColor = s.status === 'Approved'
      ? 'var(--secondary)' : s.status === 'Rejected'
      ? 'var(--danger)' : 'var(--accent)';

    grid.innerHTML = `
      <div class="student-detail-item">
        <div class="student-detail-label">Full Name</div>
        <div class="student-detail-value" data-field="name">${s.name}</div>
      </div>
      <div class="student-detail-item">
        <div class="student-detail-label">Email</div>
        <div class="student-detail-value" style="font-size:0.82rem; word-break:break-all;">${s.email}</div>
      </div>
      <div class="student-detail-item">
        <div class="student-detail-label">Region</div>
        <div class="student-detail-value">${s.region || '—'}</div>
      </div>
      <div class="student-detail-item">
        <div class="student-detail-label">School</div>
        <div class="student-detail-value">${s.school || '—'}</div>
      </div>
      <div class="student-detail-item">
        <div class="student-detail-label">Grade Level</div>
        <div class="student-detail-value">${s.grade || '—'}</div>
      </div>
      <div class="student-detail-item">
        <div class="student-detail-label">Course Interest</div>
        <div class="student-detail-value">${s.interest || '—'}</div>
      </div>
      <div class="student-detail-item">
        <div class="student-detail-label">Applied On</div>
        <div class="student-detail-value">${s.date || '—'}</div>
      </div>
      <div class="student-detail-item">
        <div class="student-detail-label">Status</div>
        <div class="student-detail-value" style="color:${statusColor}; font-weight:800;">${s.status}</div>
      </div>
    `;
    why.textContent = s.why || 'No motivation statement provided.';
    if (btnApprove) btnApprove.style.display = s.status === 'Approved' ? 'none' : '';
    lucide.createIcons();
  } catch {
    modal.classList.remove('open');
    showToast('Unable to load student details.', 'error');
  }
};

/* ==========================================================================
   ADMIN NOTIFICATIONS PANEL
   ========================================================================== */
const notifTypeMap = {
  'registration': { label: 'New Student Registration', bg: 'rgba(245,158,11,0.12)', color: 'var(--accent)', icon: 'user-plus', typeClass: 'warning' },
  'enrollment':   { label: 'New Course Enrollment', bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', icon: 'graduation-cap', typeClass: 'info' },
  'message':      { label: 'Contact Message', bg: 'rgba(168,85,247,0.12)', color: '#c084fc', icon: 'mail', typeClass: 'warning' },
  'publish':      { label: 'Course Published', bg: 'rgba(16,185,129,0.12)', color: 'var(--secondary)', icon: 'book-open', typeClass: 'success' },
  'certificate':  { label: 'Certificate Issued', bg: 'rgba(16,185,129,0.12)', color: 'var(--secondary)', icon: 'award', typeClass: 'success' },
  'announcement': { label: 'System Announcement', bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', icon: 'settings', typeClass: 'info' }
};

async function syncDatabaseNotifications() {
  try {
    const notifs = await EFBIDatabase.request('getNotifications');
    
    // 1. Sync Contact Messages
    try {
      const messages = await EFBIDatabase.request('getContactMessages');
      for (const m of messages) {
        const hasNotif = notifs.some(n => 
          n.type === 'message' && 
          n.relatedUser === `${m.name} (${m.email})` &&
          n.date === m.date
        );
        if (!hasNotif) {
          await EFBIDatabase.request('addNotification', {
            type: 'message',
            icon: 'mail',
            title: `Contact Message from ${m.name}`,
            description: `A visitor has submitted a message via the public contact form.\n\nSubject: ${m.subject || 'General Inquiry'}\n\nMessage Content:\n${m.message}`,
            date: m.date,
            time: '12:00:00',
            relatedUser: `${m.name} (${m.email})`,
            relatedCourse: 'N/A',
            read: m.status === 'Read'
          });
        }
      }
    } catch (cErr) {
      console.warn('Sync contact messages error:', cErr.message);
    }

    // 2. Sync Student Registrations (Pending Applications)
    try {
      const students = await EFBIDatabase.request('getStudents');
      for (const s of students) {
        if (s.status === 'Pending') {
          const hasNotif = notifs.some(n => 
            n.type === 'registration' && 
            n.relatedUser === `${s.name} (${s.email})`
          );
          if (!hasNotif) {
            await EFBIDatabase.request('addNotification', {
              type: 'registration',
              icon: 'user-plus',
              title: `New Student Application: ${s.name}`,
              description: `A new student application is pending review.\n\nDetails:\nSchool: ${s.school || 'N/A'}\nRegion: ${s.region || 'N/A'}\nCourse Interest: ${s.interest || 'N/A'}`,
              date: s.date || new Date().toISOString().split('T')[0],
              time: '12:00:00',
              relatedUser: `${s.name} (${s.email})`,
              relatedCourse: s.interest || 'N/A'
            });
          }
        }
      }
    } catch (sErr) {
      console.warn('Sync student registrations error:', sErr.message);
    }

    // 3. Sync Course Enrollments (Approved Students)
    try {
      const students = await EFBIDatabase.request('getStudents');
      for (const s of students) {
        if (s.status === 'Approved' && s.interest) {
          const hasNotif = notifs.some(n => 
            n.type === 'enrollment' && 
            n.relatedUser === `${s.name} (${s.email})` &&
            n.relatedCourse === s.interest
          );
          if (!hasNotif) {
            await EFBIDatabase.request('addNotification', {
              type: 'enrollment',
              icon: 'graduation-cap',
              title: `Course Enrollment: ${s.name}`,
              description: `Approved student ${s.name} has enrolled in the following path: ${s.interest}.`,
              date: s.date || new Date().toISOString().split('T')[0],
              time: '12:00:00',
              relatedUser: `${s.name} (${s.email})`,
              relatedCourse: s.interest
            });
          }
        }
      }
    } catch (eErr) {
      console.warn('Sync course enrollments error:', eErr.message);
    }

    // 4. Sync Issued Certificates
    try {
      const certificates = await EFBIDatabase.request('getCertificates');
      for (const c of certificates) {
        const hasNotif = notifs.some(n => 
          n.type === 'certificate' && 
          n.title.includes(c.id)
        );
        if (!hasNotif) {
          await EFBIDatabase.request('addNotification', {
            type: 'certificate',
            icon: 'award',
            title: `Certificate Issued: ${c.id}`,
            description: `A graduation certificate has been issued to student ${c.name}.\n\nCertificate ID: ${c.id}\nCourse Path: ${c.course}`,
            date: c.date || new Date().toISOString().split('T')[0],
            time: '12:00:00',
            relatedUser: c.name,
            relatedCourse: c.course
          });
        }
      }
    } catch (certErr) {
      console.warn('Sync certificates error:', certErr.message);
    }

    // 5. Sync Course Publications
    try {
      const courses = await EFBIDatabase.request('getCourses');
      for (const co of courses) {
        if (co.status === 'Published') {
          const hasNotif = notifs.some(n => 
            n.type === 'publish' && 
            n.relatedCourse === co.title
          );
          if (!hasNotif) {
            await EFBIDatabase.request('addNotification', {
              type: 'publish',
              icon: 'book-open',
              title: `Course Published: ${co.title}`,
              description: `A new course has been successfully published to the public catalog.\n\nTitle: ${co.title}\nInstructor: ${co.instructor || 'N/A'}\nDuration: ${co.duration || 'N/A'}`,
              date: new Date().toISOString().split('T')[0],
              time: '12:00:00',
              relatedUser: co.instructor || 'N/A',
              relatedCourse: co.title
            });
          }
        }
      }
    } catch (coErr) {
      console.warn('Sync courses error:', coErr.message);
    }

    // 6. Default Announcement
    const hasAnnouncement = notifs.some(n => n.type === 'announcement');
    if (!hasAnnouncement) {
      await EFBIDatabase.request('addNotification', {
        type: 'announcement',
        icon: 'settings',
        title: 'System Notice: Sheets Sync Active',
        description: 'The administrative console is successfully linked to your Google Sheets database. Inbound contact forms, applications, and certs will sync automatically.',
        date: new Date().toISOString().split('T')[0],
        time: '08:00:00',
        relatedUser: 'System Administrator',
        relatedCourse: 'N/A'
      });
    }

  } catch (err) {
    console.warn('Failed to sync database notifications:', err.message);
  }
}

async function updateNotifBadge() {
  try {
    await syncDatabaseNotifications();
    const notifs = await EFBIDatabase.request('getNotifications');
    const unread = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('admin-notif-badge');
    if (!badge) return;
    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  } catch { /* silent */ }
}

function closeNotifDetail() {
  const modal = document.getElementById('notif-detail-modal');
  if (modal) modal.style.display = 'none';
}

function initAdminNotificationsPanel() {
  const btnMarkAll = document.getElementById('btn-mark-all-read');
  if (btnMarkAll) {
    btnMarkAll.addEventListener('click', async () => {
      await EFBIDatabase.request('markNotificationRead', { id: 'all' });
      renderAdminNotifications();
      updateNotifBadge();
      showToast('All notifications marked as read.', 'success');
    });
  }

  // Close buttons for detailed modal
  const btnCloseX = document.getElementById('btn-close-notif-detail');
  const btnCloseBtn = document.getElementById('btn-detail-close-notif');
  if (btnCloseX) btnCloseX.addEventListener('click', closeNotifDetail);
  if (btnCloseBtn) btnCloseBtn.addEventListener('click', closeNotifDetail);
}

async function openNotifDetail(notif) {
  const modal = document.getElementById('notif-detail-modal');
  if (!modal) return;

  const typeInfo = notifTypeMap[notif.type] || notifTypeMap['announcement'];
  
  const typeBadge = document.getElementById('notif-detail-type-badge');
  typeBadge.textContent = typeInfo.label;
  typeBadge.style.background = typeInfo.bg;
  typeBadge.style.color = typeInfo.color;

  document.getElementById('notif-detail-title-text').textContent = notif.title;
  document.getElementById('notif-detail-date').textContent = notif.date;
  document.getElementById('notif-detail-time').textContent = notif.time || 'N/A';
  document.getElementById('notif-detail-user').textContent = notif.relatedUser || 'N/A';
  document.getElementById('notif-detail-course').textContent = notif.relatedCourse || 'N/A';
  document.getElementById('notif-detail-desc').textContent = notif.description || '';

  const btnMarkRead = document.getElementById('btn-detail-mark-read');
  if (notif.read) {
    btnMarkRead.style.display = 'none';
  } else {
    btnMarkRead.style.display = 'inline-flex';
    // Recreate the button listener to avoid duplication accumulation
    const newBtn = btnMarkRead.cloneNode(true);
    btnMarkRead.parentNode.replaceChild(newBtn, btnMarkRead);
    newBtn.addEventListener('click', async () => {
      await markNotifRead(notif.id);
      notif.read = true;
      newBtn.style.display = 'none';
      closeNotifDetail();
    });
  }

  modal.style.display = 'flex';
  lucide.createIcons();
}

async function renderAdminNotifications() {
  const list = document.getElementById('admin-notif-list');
  if (!list) return;

  list.innerHTML = `<div class="notif-empty"><i data-lucide="loader" class="spin-animation" style="width:24px; display:block; margin:0 auto 12px;"></i> Loading...</div>`;
  lucide.createIcons();

  try {
    const notifs = await EFBIDatabase.request('getNotifications');
    if (notifs.length === 0) {
      list.innerHTML = `<div class="notif-empty"><i data-lucide="bell-off" style="width:32px; height:32px; margin:0 auto 12px; display:block; color:var(--text-muted);"></i>No notifications yet.</div>`;
    } else {
      list.innerHTML = notifs.map(n => {
        const typeInfo = notifTypeMap[n.type] || notifTypeMap['announcement'];
        return `
          <div class="notif-item ${n.read ? 'read' : 'unread'}" data-notif-id="${n.id}">
            <div class="notif-icon ${typeInfo.typeClass}">
              <i data-lucide="${typeInfo.icon}" style="width:16px;"></i>
            </div>
            <div class="notif-text">
              <div class="notif-title" style="${n.read ? 'font-weight: 500;' : 'font-weight: 700; color: var(--text-primary);'}">${n.title}</div>
              <div class="notif-meta">${n.date} ${n.time || ''}</div>
            </div>
          </div>
        `;
      }).join('');

      list.querySelectorAll('.notif-item[data-notif-id]').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-notif-id');
          const notif = notifs.find(n => String(n.id) === String(id));
          if (notif) {
            openNotifDetail(notif);
          }
        });
      });
    }
    lucide.createIcons();
    updateNotifBadge();
  } catch {
    list.innerHTML = `<div class="notif-empty">Unable to load notifications.</div>`;
  }
}

window.markNotifRead = async (id) => {
  await EFBIDatabase.request('markNotificationRead', { id });
  renderAdminNotifications();
};

/* ==========================================================================
   ADMIN MESSAGES PANEL (Contact Form Submissions)
   ========================================================================== */
async function renderAdminMessages(searchQuery = '') {
  const tbody = document.getElementById('admin-messages-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px 0;"><i data-lucide="loader" class="spin-animation" style="width: 24px; margin-bottom: 12px; display: block; margin: 0 auto 12px;"></i> Loading messages...</td></tr>`;
  lucide.createIcons();

  try {
    const messages = await EFBIDatabase.request('getContactMessages');
    if (!messages || messages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px 0;">No contact messages yet.</td></tr>';
      return;
    }

    const filtered = messages.filter(m => {
      const name = (m.name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const subject = (m.subject || '').toLowerCase();
      const msg = (m.message || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      return name.includes(query) || email.includes(query) || subject.includes(query) || msg.includes(query);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px 0;">No matching messages found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(m => {
      const statusText = m.status === 'Read' ? 'Read' : 'Unread';
      const statusClass = m.status === 'Read' ? 'status-badge active' : 'status-badge pending';
      return `
        <tr data-message-id="${m.id}" style="cursor: pointer;">
          <td style="font-weight: 700;">${m.name}</td>
          <td>${m.email}</td>
          <td>${m.subject || 'General Inquiry'}</td>
          <td>${m.date}</td>
          <td><span class="${statusClass}">${statusText}</span></td>
          <td>
            <button class="btn btn-secondary btn-view-message" style="padding: 6px 12px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;">
              <i data-lucide="eye" style="width: 14px;"></i> View
            </button>
          </td>
        </tr>
      `;
    }).join('');
    lucide.createIcons();

    // Attach click listeners to rows
    tbody.querySelectorAll('tr[data-message-id]').forEach(row => {
      row.addEventListener('click', (e) => {
        const id = row.getAttribute('data-message-id');
        const msg = messages.find(m => String(m.id) === String(id));
        if (msg) {
          openMessageDetail(msg);
        }
      });
    });

  } catch (err) {
    console.error('Failed to load contact messages:', err);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 40px 0;">Unable to load messages. Please try again.</td></tr>';
  }
}

// Open detailed message modal
async function openMessageDetail(msg) {
  const modal = document.getElementById('message-detail-modal');
  if (!modal) return;

  document.getElementById('message-detail-name').textContent = msg.name || '';
  document.getElementById('message-detail-email').textContent = msg.email || '';
  document.getElementById('message-detail-subject').textContent = msg.subject || 'General Inquiry';
  document.getElementById('message-detail-date').textContent = msg.date || '';
  document.getElementById('message-detail-body').textContent = msg.message || '';

  modal.style.display = 'flex';
  
  // Mark read if it was unread
  if (msg.status !== 'Read') {
    try {
      await EFBIDatabase.request('markContactMessageRead', { id: msg.id });
      // Update local message state
      msg.status = 'Read';
      updateNotifBadge();
      // Silently refresh the messages table to update read status badge
      const searchVal = document.getElementById('admin-messages-search')?.value || '';
      renderAdminMessages(searchVal);
    } catch (err) {
      console.warn('Failed to mark message read:', err);
    }
  }
}

function closeMessageDetail() {
  const modal = document.getElementById('message-detail-modal');
  if (modal) modal.style.display = 'none';
}

function initAdminMessagesPanel() {
  // Wire up close button listeners
  const btnCloseX = document.getElementById('btn-close-message-detail');
  const btnCloseBtn = document.getElementById('btn-detail-close-msg');
  if (btnCloseX) btnCloseX.addEventListener('click', closeMessageDetail);
  if (btnCloseBtn) btnCloseBtn.addEventListener('click', closeMessageDetail);

  // Wire up real-time search input
  const searchInput = document.getElementById('admin-messages-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      renderAdminMessages(val);
    });
  }
}

/* ==========================================================================
   CSV EXPORT FOR STUDENTS
   ========================================================================== */
function initCsvExport() {
  const btn = document.getElementById('btn-export-students');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="spin-animation" style="width:14px;"></i> Exporting...';
    lucide.createIcons();

    try {
      const students = await EFBIDatabase.request('getStudents');
      if (!students || students.length === 0) {
        showToast('No student data to export.', 'warning');
        return;
      }

      const headers = ['ID','Name','Email','Region','School','Grade','Interest','Status','Date'];
      const rows    = students.map(s => [
        s.id, s.name, s.email, s.region||'', s.school||'',
        s.grade||'', s.interest||'', s.status||'', s.date||''
      ].map(v => `"${String(v).replace(/"/g,'""')}"`));

      const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `EFBI_Students_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${students.length} students to CSV!`, 'success');
    } catch {
      showToast('Export failed. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="download" style="width:14px;"></i> Export CSV';
      lucide.createIcons();
    }
  });
}

/* ==========================================================================
   QUIZ SYSTEM
   ========================================================================== */
const QUIZ_BANK = {
  'default': [
    { q:'What is the primary goal of machine learning?', opts:['To hard-code rules','To learn from data automatically','To store large files','To design web pages'], a:1 },
    { q:'Which language is most popular for AI development?', opts:['Java','C++','Python','Ruby'], a:2 },
    { q:'What does HTML stand for?', opts:['HyperText Markup Language','HighText Machine Language','HyperText Machine Loader','None'], a:0 },
    { q:'What does an entrepreneur primarily focus on?', opts:['Government policies','Identifying and solving problems','Academic research only','Following competitors'], a:1 },
    { q:'Which of these is a version control system?', opts:['GitHub','Figma','Canva','Trello'], a:0 }
  ],
  'artificial intelligence': [
    { q:'What is supervised learning?', opts:['Learning without labels','Learning with labeled data','Unsupervised clustering','Reinforcement only'], a:1 },
    { q:'Which is a neural network layer type?', opts:['Recursive','Convolutional','Sequential','Iterative'], a:1 },
    { q:'What does NLP stand for?', opts:['Natural Language Processing','Network Layer Protocol','New Learning Platform','None'], a:0 },
    { q:'What is a training dataset?', opts:['Data used to test models','Data used to train models','Random web data','Backup files'], a:1 },
    { q:'What does "overfitting" mean in ML?', opts:['Model too simple','Model performs poorly on training','Model learns noise in training','Model uses too few features'], a:2 }
  ],
  'web development': [
    { q:'What does CSS stand for?', opts:['Cascading Style Sheets','Computer Style System','Creative Style Syntax','Color Style Script'], a:0 },
    { q:'Which tag creates a hyperlink in HTML?', opts:['<link>','<href>','<a>','<nav>'], a:2 },
    { q:'What is the DOM?', opts:['Document Object Model','Data Output Map','Dynamic Object Module','None'], a:0 },
    { q:'What does "responsive design" mean?', opts:['Fast website','Design adapts to screen sizes','Using animations','Dark mode'], a:1 },
    { q:'Which HTTP method sends data to a server?', opts:['GET','PUT','POST','FETCH'], a:2 }
  ]
};

let quizState = { questions:[], currentQ:0, selectedAnswer:null, answers:[], moduleIdx:0, moduleName:'', studentEmail:'', courseTitle:'', courseId:'', timerSecs:0, answeredCorrectly:[] };

function initQuizSystem() {
  const modal    = document.getElementById('quiz-modal');
  const btnNext  = document.getElementById('btn-quiz-next');
  const btnSkip  = document.getElementById('btn-quiz-skip');
  const btnRetry = document.getElementById('btn-quiz-retry');
  const btnClose = document.getElementById('btn-quiz-close');
  const btnCloseX= document.getElementById('btn-quiz-close-x');

  if (!modal) return;

  btnNext?.addEventListener('click',  () => advanceQuiz());
  btnSkip?.addEventListener('click',  () => advanceQuiz(true));
  btnRetry?.addEventListener('click', () => startQuiz(quizState.moduleIdx, quizState.moduleName, quizState.studentEmail, quizState.courseTitle, quizState.questions));
  btnClose?.addEventListener('click', () => closeQuizModal());
  btnCloseX?.addEventListener('click',() => closeQuizModal());
  // Click backdrop to close
  modal.addEventListener('click', (e) => { if (e.target === modal) closeQuizModal(); });
}

window.openQuiz = async (moduleIdx, moduleName, studentEmail, courseTitle, courseId = '') => {
  let questions = [];
  try {
    const allQuizzes = await EFBIDatabase.request('getQuizzes');
    questions = allQuizzes
      .filter(q => String(q.courseid) === String(courseId) && parseInt(q.moduleidx) === parseInt(moduleIdx))
      .sort((a, b) => a.questionidx - b.questionidx);
  } catch (err) {
    console.warn('Fallback to local QUIZ_BANK:', err);
  }

  if (!questions || questions.length === 0) {
    const key = courseTitle.toLowerCase().trim();
    const bank = QUIZ_BANK[key] || QUIZ_BANK['default'];
    questions = [...bank].sort(() => Math.random() - 0.5).slice(0, 5);
  }

  // Store courseId in state for saving score
  quizState.courseId = courseId;
  startQuiz(moduleIdx, moduleName, studentEmail, courseTitle, questions);
};

function startQuiz(moduleIdx, moduleName, studentEmail, courseTitle = '', questions = []) {
  const modal = document.getElementById('quiz-modal');
  if (!modal) return;

  let activeQuestions = questions;
  if (!activeQuestions || activeQuestions.length === 0) {
    if (quizState && quizState.questions && quizState.questions.length > 0) {
      activeQuestions = quizState.questions;
    } else {
      const key  = courseTitle.toLowerCase().trim();
      const bank = QUIZ_BANK[key] || QUIZ_BANK['default'];
      activeQuestions = [...bank].sort(() => Math.random() - 0.5).slice(0, 5);
    }
  }

  quizState = {
    questions: activeQuestions,
    currentQ: 0,
    selectedAnswer: null,
    answers: [],
    moduleIdx, moduleName, studentEmail, courseTitle,
    timerSecs: 0,
    answeredCorrectly: []
  };

  // Header
  document.getElementById('quiz-module-label').textContent = `Module ${moduleIdx + 1}`;
  document.getElementById('quiz-modal-title-text').textContent = moduleName;
  document.getElementById('quiz-question-view').style.display = '';
  document.getElementById('quiz-result-view').style.display = 'none';
  document.getElementById('quiz-feedback').className = 'quiz-feedback';

  // Build step dots
  const dotsEl = document.getElementById('quiz-step-dots');
  if (dotsEl) {
    dotsEl.innerHTML = activeQuestions.map((_, i) =>
      `<div class="quiz-step-dot ${i === 0 ? 'active' : ''}" id="quiz-dot-${i}"></div>`
    ).join('');
  }

  // Start timer
  clearInterval(window._quizTimerInt);
  quizState.timerSecs = 0;
  window._quizTimerInt = setInterval(() => {
    quizState.timerSecs++;
    const m = Math.floor(quizState.timerSecs / 60);
    const s = quizState.timerSecs % 60;
    const display = document.getElementById('quiz-timer-display');
    const timerEl = document.getElementById('quiz-timer');
    if (display) display.textContent = `${m}:${s.toString().padStart(2,'0')}`;
    if (timerEl) {
      const total = activeQuestions.length * 30; // 30s per question budget
      const ratio = quizState.timerSecs / total;
      timerEl.className = `quiz-timer${ratio > 0.85 ? ' danger' : ratio > 0.65 ? ' warning' : ''}`;
    }
  }, 1000);

  renderQuizQuestion();
  modal.classList.add('open');

  // Wire close button
  const closeX = document.getElementById('btn-quiz-close-x');
  if (closeX) closeX.onclick = closeQuizModal;

  // Wire keyboard shortcuts
  window._quizKeyHandler && document.removeEventListener('keydown', window._quizKeyHandler);
  window._quizKeyHandler = (e) => {
    const modal = document.getElementById('quiz-modal');
    if (!modal?.classList.contains('open')) return;

    const qView = document.getElementById('quiz-question-view');
    const rView = document.getElementById('quiz-result-view');

    if (e.key === 'Escape') { closeQuizModal(); return; }

    if (qView && qView.style.display !== 'none') {
      // 1–4: pick option
      if (['1','2','3','4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        const opts = document.querySelectorAll('.quiz-option:not([data-revealed])');
        if (opts[idx]) { e.preventDefault(); window.selectQuizOption(idx); }
      }
      // Enter / Space: confirm
      if ((e.key === 'Enter' || e.key === ' ') && !document.getElementById('btn-quiz-next')?.disabled) {
        e.preventDefault();
        advanceQuiz();
      }
    }

    if (rView && rView.style.display !== 'none') {
      if (e.key === 'Enter') document.getElementById('btn-quiz-close')?.click();
      if (e.key === 'r' || e.key === 'R') document.getElementById('btn-quiz-retry')?.click();
    }
  };
  document.addEventListener('keydown', window._quizKeyHandler);

  lucide.createIcons();
}

function closeQuizModal() {
  const modal = document.getElementById('quiz-modal');
  if (modal) modal.classList.remove('open');
  clearInterval(window._quizTimerInt);
  window._quizKeyHandler && document.removeEventListener('keydown', window._quizKeyHandler);
}

function renderQuizQuestion() {
  const { questions, currentQ } = quizState;
  const q = questions[currentQ];
  const total = questions.length;

  // Counter + progress
  document.getElementById('quiz-q-current').textContent = currentQ + 1;
  document.getElementById('quiz-q-total').textContent   = total;
  document.getElementById('quiz-progress-fill').style.width = `${((currentQ + 1) / total) * 100}%`;

  // Step dots
  for (let i = 0; i < total; i++) {
    const dot = document.getElementById(`quiz-dot-${i}`);
    if (!dot) continue;
    dot.className = 'quiz-step-dot' +
      (i < currentQ
        ? (quizState.answeredCorrectly[i] === true ? ' done' : ' wrong-dot')
        : i === currentQ ? ' active' : '');
  }

  // Question text
  document.getElementById('quiz-question-text').textContent = q.q || q.question || '';

  // Hide feedback banner
  const fb = document.getElementById('quiz-feedback');
  if (fb) fb.className = 'quiz-feedback';

  // Options
  const letters = ['A','B','C','D'];
  const optsList = document.getElementById('quiz-options-list');
  optsList.innerHTML = q.opts.map((opt, i) => `
    <button class="quiz-option" onclick="window.selectQuizOption(${i})" id="quiz-opt-${i}">
      <span class="quiz-option-letter">${letters[i]}</span>${opt}
    </button>`).join('');

  quizState.selectedAnswer = null;
  const btnNext = document.getElementById('btn-quiz-next');
  btnNext.disabled = true;
  btnNext.innerHTML = currentQ < total - 1
    ? 'Next <i data-lucide="arrow-right" style="width:14px;height:14px;vertical-align:middle;"></i>'
    : 'Finish <i data-lucide="check" style="width:14px;height:14px;vertical-align:middle;"></i>';

  lucide.createIcons();
}

window.selectQuizOption = (idx) => {
  // Don't re-select if already revealed
  if (document.querySelector('.quiz-option[data-revealed]')) return;

  quizState.selectedAnswer = idx;
  document.querySelectorAll('.quiz-option').forEach((btn, i) =>
    btn.classList.toggle('selected', i === idx)
  );
  document.getElementById('btn-quiz-next').disabled = false;
};

function advanceQuiz(skip = false) {
  const { currentQ, selectedAnswer, questions } = quizState;
  const q = questions[currentQ];
  const correctIdx = q.a;

  if (skip) {
    quizState.answers.push(null);
    quizState.answeredCorrectly[currentQ] = false;
    _doAdvanceQuiz();
    return;
  }

  // Reveal correct / wrong with animation BEFORE advancing
  const opts = document.querySelectorAll('.quiz-option');
  opts.forEach(btn => {
    btn.setAttribute('data-revealed', '1');
    btn.disabled = true;
  });

  const isCorrect = selectedAnswer === correctIdx;
  quizState.answers.push(selectedAnswer);
  quizState.answeredCorrectly[currentQ] = isCorrect;

  // Highlight correct answer always
  const correctBtn = document.getElementById(`quiz-opt-${correctIdx}`);
  if (correctBtn) correctBtn.classList.add('correct');

  // Highlight wrong if chosen
  if (!isCorrect && selectedAnswer !== null) {
    const wrongBtn = document.getElementById(`quiz-opt-${selectedAnswer}`);
    if (wrongBtn) wrongBtn.classList.add('wrong');
  }

  // Feedback banner
  const fb     = document.getElementById('quiz-feedback');
  const fbIcon = document.getElementById('quiz-feedback-icon');
  const fbText = document.getElementById('quiz-feedback-text');
  if (fb && fbIcon && fbText) {
    if (isCorrect) {
      fb.className = 'quiz-feedback correct-fb';
      fbIcon.setAttribute('data-lucide', 'check-circle');
      fbText.textContent = ['Correct! 🎉', 'Excellent!', 'Spot on! ✓', 'Well done!'][Math.floor(Math.random()*4)];
    } else {
      fb.className = 'quiz-feedback wrong-fb';
      fbIcon.setAttribute('data-lucide', 'x-circle');
      fbText.textContent = selectedAnswer === null
        ? 'Skipped — the correct answer is highlighted above.'
        : `Not quite — the correct answer is ${['A','B','C','D'][correctIdx]}.`;
    }
    lucide.createIcons({ nodes: [fbIcon] });
  }

  // Auto-advance after 1.1s so user can see the feedback
  setTimeout(_doAdvanceQuiz, 1100);
}

function _doAdvanceQuiz() {
  const { currentQ, questions } = quizState;
  if (currentQ < questions.length - 1) {
    quizState.currentQ++;
    // Re-animate question view
    const qv = document.getElementById('quiz-question-view');
    if (qv) { qv.style.animation = 'none'; void qv.offsetWidth; qv.style.animation = ''; }
    renderQuizQuestion();
  } else {
    showQuizResult();
  }
}

async function showQuizResult() {
  clearInterval(window._quizTimerInt);

  const { questions, answers, moduleIdx, studentEmail, answeredCorrectly } = quizState;

  let correct = 0, wrong = 0, skipped = 0;
  answers.forEach((ans, i) => {
    if (ans === null) skipped++;
    else if (ans === questions[i].a) correct++;
    else wrong++;
  });
  const percent = Math.round((correct / questions.length) * 100);
  const passed  = percent >= 70;

  // Switch views
  document.getElementById('quiz-question-view').style.display = 'none';
  document.getElementById('quiz-result-view').style.display = '';

  // Animate SVG score ring (circumference = 2π × 58 ≈ 364.4)
  const ringFill = document.getElementById('quiz-score-ring-fill');
  const scoreEl  = document.getElementById('quiz-score-pct');
  const labelEl  = document.getElementById('quiz-score-label');
  if (ringFill) {
    const circ   = 364.4;
    const offset = circ - (circ * percent / 100);
    ringFill.style.stroke = passed ? '#10b981' : percent >= 40 ? '#6366f1' : '#ef4444';
    // Animate counter 0 → percent
    let cur = 0;
    const step = () => {
      cur = Math.min(cur + 2, percent);
      if (scoreEl) scoreEl.textContent = `${cur}%`;
      ringFill.style.strokeDashoffset = circ - (circ * cur / 100);
      if (cur < percent) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if (labelEl) labelEl.textContent = passed ? 'Passed!' : 'Score';

  // Badge
  const badge     = document.getElementById('quiz-result-badge');
  const badgeIcon = document.getElementById('quiz-result-badge-icon');
  const badgeTxt  = document.getElementById('quiz-result-badge-text');
  if (badge && badgeIcon && badgeTxt) {
    badge.className = `quiz-result-badge ${passed ? 'pass' : 'fail'}`;
    badgeIcon.setAttribute('data-lucide', passed ? 'award' : 'refresh-cw');
    badgeTxt.textContent = passed ? 'Passed ✓' : 'Try Again';
    lucide.createIcons({ nodes: [badgeIcon] });
  }

  // Result text
  const title = document.getElementById('quiz-result-title');
  const desc  = document.getElementById('quiz-result-desc');
  if (percent >= 70) {
    title.textContent = 'Outstanding! 🎉';
    desc.textContent  = `You answered ${correct} of ${questions.length} questions correctly in ${Math.floor(quizState.timerSecs/60)}m ${quizState.timerSecs%60}s. Keep up the great work!`;
  } else if (percent >= 40) {
    title.textContent = 'Good Effort! 💪';
    desc.textContent  = `You scored ${correct}/${questions.length}. Review the lesson notes and try again — you are almost there!`;
  } else {
    title.textContent = 'Keep Going! 📚';
    desc.textContent  = `You scored ${correct}/${questions.length}. Revisit this module and give it another shot — practice makes perfect!`;
  }

  // Stat pills
  const sc = document.getElementById('quiz-stat-correct');
  const sw = document.getElementById('quiz-stat-wrong');
  const ss = document.getElementById('quiz-stat-skipped');
  if (sc) sc.textContent = correct;
  if (sw) sw.textContent = wrong;
  if (ss) ss.textContent = skipped;

  // Confetti on pass
  if (passed) spawnQuizConfetti();

  // Save score
  try {
    if (studentEmail) {
      await EFBIDatabase.request('saveQuizScore', {
        email: studentEmail, moduleIdx, courseId: quizState.courseId || '',
        score: correct, total: questions.length, percent
      });
    }
  } catch { /* silent */ }

  // Notify learning page callback if present
  if (typeof window._learningPageQuizCallback === 'function') {
    window._learningPageQuizCallback({ score: correct, total: questions.length, percent });
    window._learningPageQuizCallback = null;
  }

  const session = localStorage.getItem('efbi_student_session');
  if (session) {
    setTimeout(() => renderStudentSyllabus(JSON.parse(session)), 600);
  }

  lucide.createIcons();
}

/** Launch confetti particles for a pass result */
function spawnQuizConfetti() {
  const container = document.getElementById('quiz-confetti-container');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#6366f1','#34d399','#fbbf24','#f472b6','#38bdf8','#a78bfa'];
  for (let i = 0; i < 48; i++) {
    const el = document.createElement('div');
    el.className = 'quiz-confetti-particle';
    el.style.cssText = `
      left: ${Math.random()*100}%;
      top: ${-10 - Math.random()*40}px;
      background: ${colors[Math.floor(Math.random()*colors.length)]};
      width: ${6 + Math.random()*8}px;
      height: ${6 + Math.random()*8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${1.2 + Math.random()*1.4}s;
      animation-delay: ${Math.random()*0.6}s;
    `;
    container.appendChild(el);
  }
  setTimeout(() => { if (container) container.innerHTML = ''; }, 3000);
}



/* ==========================================================================
   ADMIN TAB SWITCH HOOKS — render panels on demand
   ========================================================================== */
document.addEventListener('click', async (e) => {
  const tab = e.target.closest('.admin-menu-item[data-tab]');
  if (!tab) return;
  const tabId = tab.getAttribute('data-tab');
  if (tabId === 'admin-notifications') setTimeout(renderAdminNotifications, 100);
  else if (tabId === 'admin-messages')  setTimeout(renderAdminMessages, 100);
});

// Update notification badge after 1s on load
setTimeout(updateNotifBadge, 1200);

/* ==========================================================================
   STUDENT TABLE ROW CLICK — open detail modal
   ========================================================================== */
(function patchStudentRowClicks() {
  const observer = new MutationObserver(() => {
    document.querySelectorAll('#admin-students-table tbody tr[data-student-id]').forEach(row => {
      if (row.dataset.clickBound) return;
      row.dataset.clickBound = 'true';
      row.style.cursor = 'pointer';
      row.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        openStudentDetail(row.dataset.studentId);
      });
    });
  });

  const tryObserve = () => {
    const table = document.getElementById('admin-students-table');
    if (table) observer.observe(table, { childList: true, subtree: true });
    else setTimeout(tryObserve, 600);
  };
  tryObserve();
})();

/* ==========================================================================
   WARNING TOAST SUPPORT (yellow)
   ========================================================================== */
const _origShowToastWarning = showToast;
window.showToast = function(message, type = 'success') {
  if (type === 'warning') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast warning';
    toast.innerHTML = `<i data-lucide="alert-triangle" style="stroke:var(--accent); width:18px;"></i><span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
      toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.16,1,0.3,1) forwards';
      toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
  } else {
    _origShowToastWarning(message, type);
  }
};

/* ==========================================================================
   SETTINGS & SYNC CENTER — Full Implementation
   ========================================================================== */

/* ---------- Helpers ---------- */
function termLog(msg, cls = '') {
  const term = document.getElementById('diagnostics-terminal');
  if (!term) return;
  const line = document.createElement('span');
  line.className = `terminal-line ${cls}`;
  line.textContent = msg;
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

function termClear() {
  const term = document.getElementById('diagnostics-terminal');
  if (term) term.innerHTML = '';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ---------- Sync Badge ---------- */
function updateSettingsSyncBadge() {
  const dot = document.getElementById('settings-sync-dot');
  const label = document.getElementById('settings-sync-label');
  if (!dot || !label) return;
  const mode = localStorage.getItem('efbi_sync_mode') || 'sandbox';
  if (mode === 'live') {
    dot.className = 'sync-indicator live';
    label.textContent = '🟢 Live — Google Sheets Sync Active';
  } else {
    dot.className = 'sync-indicator sandbox';
    label.textContent = '🟡 Sandbox — Local Storage Mode';
  }
}

/* ---------- Load settings into panel ---------- */
function loadSettingsPanel() {
  const modeEl = document.getElementById('settings-sync-mode');
  const urlEl = document.getElementById('settings-script-url');
  if (modeEl) modeEl.value = localStorage.getItem('efbi_sync_mode') || 'sandbox';
  if (urlEl) urlEl.value = localStorage.getItem('efbi_script_url') || '';
  updateSettingsSyncBadge();
}

/* ---------- Save Settings ---------- */
document.addEventListener('click', function(e) {
  if (!e.target.closest('#btn-save-settings')) return;
  const mode = document.getElementById('settings-sync-mode')?.value || 'sandbox';
  const url = document.getElementById('settings-script-url')?.value?.trim() || '';
  localStorage.setItem('efbi_sync_mode', mode);
  if (url) localStorage.setItem('efbi_script_url', url);
  updateSettingsSyncBadge();
  showToast('Settings saved! Sync mode updated to: ' + (mode === 'live' ? 'Live' : 'Sandbox'), 'success');
});

/* ---------- Run Diagnostics ---------- */
document.addEventListener('click', async function(e) {
  if (!e.target.closest('#btn-run-diagnostics')) return;
  const btn = document.getElementById('btn-run-diagnostics');
  if (btn) btn.disabled = true;
  termClear();

  const scriptUrl = localStorage.getItem('efbi_script_url') || '';
  const mode = localStorage.getItem('efbi_sync_mode') || 'sandbox';

  termLog('── EFBI Diagnostic Tool [v2.0] ──', 'system');
  await sleep(300);
  termLog(`[${new Date().toLocaleTimeString()}] Starting full system check...`, 'info');
  await sleep(400);

  // Check 1: Sync mode
  termLog('', '');
  termLog('▶ CHECK 1 — Sync Configuration', 'system');
  await sleep(300);
  termLog(`  Mode: ${mode === 'live' ? 'Live (Google Sheets)' : 'Sandbox (localStorage)'}`, mode === 'live' ? 'ok' : 'warn');
  if (!scriptUrl && mode === 'live') {
    termLog('  ⚠ WARNING: No Web App URL configured. Live mode requires a valid URL.', 'warn');
  } else if (scriptUrl) {
    termLog(`  URL: ${scriptUrl.substring(0, 48)}...`, 'muted');
  }
  await sleep(500);

  // Check 2: localStorage
  termLog('', '');
  termLog('▶ CHECK 2 — Local Storage Health', 'system');
  await sleep(300);
  try {
    localStorage.setItem('__efbi_test__', '1');
    localStorage.removeItem('__efbi_test__');
    const used = JSON.stringify(localStorage).length;
    termLog(`  ✔ LocalStorage available (${(used / 1024).toFixed(1)} KB used)`, 'ok');
  } catch {
    termLog('  ✘ LocalStorage unavailable or full!', 'err');
  }
  await sleep(400);

  // Check 3: Network
  termLog('', '');
  termLog('▶ CHECK 3 — Network Connectivity', 'system');
  await sleep(400);
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch('https://www.google.com/generate_204', { mode: 'no-cors', signal: ctrl.signal });
    clearTimeout(tid);
    termLog('  ✔ Internet connection detected', 'ok');
  } catch {
    termLog('  ✘ No internet connection (or request blocked)', 'err');
  }
  await sleep(400);

  // Check 4: Endpoint ping (only if live and URL set)
  termLog('', '');
  termLog('▶ CHECK 4 — Google Apps Script Endpoint', 'system');
  await sleep(400);
  if (!scriptUrl) {
    termLog('  ⚠ Skipped — No Web App URL configured', 'warn');
  } else if (mode !== 'live') {
    termLog('  ⚠ Skipped — Mode is set to Sandbox. Switch to Live to test endpoint.', 'warn');
  } else {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 8000);
      const t0 = Date.now();
      const resp = await fetch(scriptUrl + '?action=ping', { signal: ctrl.signal });
      clearTimeout(tid);
      const ms = Date.now() - t0;
      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (data.status === 'success' || data.status === 'ok' || data.success) {
          termLog(`  ✔ Endpoint reachable and healthy (${ms}ms)`, 'ok');
        } else {
          termLog(`  ⚠ Endpoint reachable but returned unexpected response (${ms}ms)`, 'warn');
          termLog(`    Response: ${JSON.stringify(data).substring(0, 80)}`, 'muted');
        }
      } else {
        termLog(`  ✘ Endpoint returned HTTP ${resp.status}`, 'err');
      }
    } catch (err) {
      termLog(`  ✘ Endpoint unreachable: ${err.message}`, 'err');
      termLog('  → Tip: Re-deploy the Apps Script as a new Web App and paste the new URL.', 'warn');
    }
  }
  await sleep(400);

  // Check 5: Data summary
  termLog('', '');
  termLog('▶ CHECK 5 — Local Data Summary', 'system');
  await sleep(300);
  try {
    const courses = JSON.parse(localStorage.getItem('efbi_courses') || '[]');
    const students = JSON.parse(localStorage.getItem('efbi_students') || '[]');
    const notifs = JSON.parse(localStorage.getItem('efbi_notifications') || '[]');
    termLog(`  Courses:       ${courses.length} records`, 'muted');
    termLog(`  Students:      ${students.length} records`, 'muted');
    termLog(`  Notifications: ${notifs.length} records`, 'muted');
  } catch {
    termLog('  Could not parse local data', 'warn');
  }
  await sleep(300);

  termLog('', '');
  termLog('── Diagnostic complete ──', 'system');
  const cursor = document.createElement('span');
  cursor.className = 'terminal-cursor';
  document.getElementById('diagnostics-terminal')?.appendChild(cursor);
  if (btn) btn.disabled = false;
});

/* ---------- Export DB ---------- */
document.addEventListener('click', function(e) {
  if (!e.target.closest('#btn-export-db')) return;
  const snapshot = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('efbi_')) {
      try { snapshot[key] = JSON.parse(localStorage.getItem(key)); }
      catch { snapshot[key] = localStorage.getItem(key); }
    }
  }
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `efbi-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Database exported successfully!', 'success');
});

/* ---------- Import DB ---------- */
document.addEventListener('change', function(e) {
  if (e.target.id !== 'input-import-db') return;
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      let count = 0;
      for (const [key, val] of Object.entries(data)) {
        if (key.startsWith('efbi_')) {
          localStorage.setItem(key, JSON.stringify(val));
          count++;
        }
      }
      showToast(`Import complete — ${count} data collections restored.`, 'success');
      e.target.value = '';
    } catch {
      showToast('Import failed: invalid JSON file.', 'error');
    }
  };
  reader.readAsText(file);
});

/* ---------- Reset Sandbox ---------- */
document.addEventListener('click', function(e) {
  if (!e.target.closest('#btn-reset-db')) return;
  const confirmed = confirm('⚠ This will permanently delete ALL local EFBI data (courses, students, notifications, etc). This cannot be undone.\n\nAre you sure?');
  if (!confirmed) return;
  const keysToDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('efbi_')) keysToDelete.push(key);
  }
  keysToDelete.forEach(k => localStorage.removeItem(k));
  showToast(`Sandbox reset — ${keysToDelete.length} collections cleared.`, 'success');
  updateSettingsSyncBadge();
});

/* ---------- Course Live Preview ---------- */
(function initCoursePreview() {
  const modal = document.getElementById('admin-course-modal');
  if (!modal) return;

  function syncPreview() {
    const title = document.getElementById('course-title')?.value || 'Course Title';
    const instructor = document.getElementById('course-instructor')?.value || 'Instructor Name';
    const category = document.getElementById('course-category')?.value || 'Category';
    const level = document.getElementById('course-level')?.value || 'Beginner';
    const duration = document.getElementById('course-duration')?.value || 'Duration';
    const modules = document.getElementById('course-modules')?.value || '—';
    const shortDesc = document.getElementById('course-short-desc')?.value || 'Your short description will appear here as you type.';

    const el = (id) => document.getElementById(id);
    if (el('preview-title')) el('preview-title').textContent = title;
    if (el('preview-instructor')) el('preview-instructor').textContent = `by ${instructor}`;
    if (el('preview-category')) el('preview-category').textContent = category || 'Category';
    if (el('preview-level')) el('preview-level').textContent = level;
    if (el('preview-duration')) el('preview-duration').textContent = duration;
    if (el('preview-modules')) el('preview-modules').textContent = `${modules} module${modules > 1 ? 's' : ''}`;
    if (el('preview-desc')) el('preview-desc').textContent = shortDesc;
  }

  modal.addEventListener('input', syncPreview);
  modal.addEventListener('change', syncPreview);

  // Also sync on open
  const openBtn = document.getElementById('btn-admin-add-course');
  if (openBtn) openBtn.addEventListener('click', () => setTimeout(syncPreview, 50));
})();

/* ---------- Admin Sidebar: Settings Tab ---------- */
(function initSettingsSidebarNav() {
  // Watch for clicks on the settings sidebar item
  document.addEventListener('click', function(e) {
    const link = e.target.closest('[data-admin-view="settings"]');
    if (!link) return;
    // Load settings panel values when opened
    setTimeout(loadSettingsPanel, 50);
  });

  // Also handle the case where app.js switchAdminView is called
  const origSwitch = window.switchAdminView;
  if (typeof origSwitch === 'function') {
    window.switchAdminView = function(view) {
      origSwitch(view);
      if (view === 'settings') {
        setTimeout(loadSettingsPanel, 80);
      }
    };
  }
})();

/* ---------- Sync Recovery Modal ---------- */
window.__syncRecoveryCallback = null;

window.showSyncRecoveryModal = function(message, retryCallback) {
  const modal = document.getElementById('sync-recovery-modal');
  const msgEl = document.getElementById('sync-recovery-message');
  if (!modal) return;
  if (msgEl && message) msgEl.textContent = message;
  modal.style.display = 'flex';
  window.__syncRecoveryCallback = retryCallback || null;
  lucide.createIcons();
};

document.addEventListener('click', function(e) {
  if (e.target.closest('#btn-recovery-retry')) {
    document.getElementById('sync-recovery-modal').style.display = 'none';
    if (typeof window.__syncRecoveryCallback === 'function') {
      window.__syncRecoveryCallback();
      window.__syncRecoveryCallback = null;
    } else {
      showToast('Retrying — please try your action again.', 'success');
    }
  }

  if (e.target.closest('#btn-recovery-sandbox')) {
    localStorage.setItem('efbi_sync_mode', 'sandbox');
    updateSettingsSyncBadge();
    document.getElementById('sync-recovery-modal').style.display = 'none';
    showToast('Switched to Sandbox mode. Data will save locally.', 'success');
    if (typeof window.__syncRecoveryCallback === 'function') {
      window.__syncRecoveryCallback();
      window.__syncRecoveryCallback = null;
    }
  }

  if (e.target.closest('#btn-recovery-settings')) {
    document.getElementById('sync-recovery-modal').style.display = 'none';
    // Navigate to admin settings view
    const link = document.querySelector('[data-admin-view="settings"]');
    if (link) link.click();
  }

  if (e.target.closest('#btn-recovery-dismiss')) {
    document.getElementById('sync-recovery-modal').style.display = 'none';
    window.__syncRecoveryCallback = null;
  }
});

/* ---------- Patch EFBIDatabase.request to show Recovery Modal on fetch errors ---------- */
(function patchRequestForRecovery() {
  if (typeof window.EFBIDatabase === 'undefined') {
    // Retry after DB loads
    const iv = setInterval(() => {
      if (typeof window.EFBIDatabase !== 'undefined') {
        clearInterval(iv);
        patchIt();
      }
    }, 500);
  } else {
    patchIt();
  }

  function patchIt() {
    const origRequest = EFBIDatabase.request.bind(EFBIDatabase);
    EFBIDatabase.request = async function(action, data = {}) {
      try {
        return await origRequest(action, data);
      } catch (err) {
        // Use the same getActiveSyncMode() function as api.js for consistency
        const mode = (typeof getActiveSyncMode === 'function') ? getActiveSyncMode() : (localStorage.getItem('efbi_sync_mode') || 'sandbox');
        const errMsg = err.message || String(err);
        const isNetworkErr = 
          errMsg.toLowerCase().includes('fetch') || 
          errMsg.toLowerCase().includes('network') || 
          errMsg.toLowerCase().includes('connection') || 
          errMsg.toLowerCase().includes('failed') ||
          err.name === 'TypeError';
          
        if (mode === 'live' && err && isNetworkErr) {
          return new Promise((resolve) => {
            window.showSyncRecoveryModal(
              `The action "${action}" failed because the database endpoint is unreachable. Choose how to proceed:`,
              async () => {
                try {
                  const result = await origRequest(action, data);
                  resolve(result);
                } catch {
                  resolve({ success: false, error: 'Retry also failed' });
                }
              }
            );
          });
        }
        throw err;
      }
    };
  }
})();

/* ---------- Init on page load ---------- */
document.addEventListener('DOMContentLoaded', function() {
  updateSettingsSyncBadge();
});
// Also run immediately if DOM is ready
if (document.readyState !== 'loading') {
  updateSettingsSyncBadge();
}


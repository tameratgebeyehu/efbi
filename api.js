/* ==========================================================================
   Ethiopian Future Builders Initiative (EFBI) - Database & Webhook Service
   ========================================================================== */

// Secure Logging Wrapper - prevents technical leaks in public console
(function sanitizeConsoleLogs() {
  const isDevOrAdmin = () => {
    try {
      return localStorage.getItem('efbi_admin_session') !== null || 
             window.location.search.includes('debug=true') || 
             window.location.search.includes('dev=true');
    } catch (e) {
      return false;
    }
  };

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  const sanitize = (args) => {
    return Array.from(args).map(arg => {
      if (arg instanceof Error) {
        if (isDevOrAdmin()) return arg;
        return new Error('An internal operation error occurred.');
      }
      if (typeof arg === 'string') {
        if (isDevOrAdmin()) return arg;
        return arg
          .replace(/https:\/\/script\.google\.com[^\s]*/gi, '[SECURE ENDPOINT]')
          .replace(/google/gi, 'Server')
          .replace(/sheet/gi, 'Database')
          .replace(/apps\s*script/gi, 'Service')
          .replace(/spreadsheet/gi, 'Database')
          .replace(/localstorage/gi, 'Cache')
          .replace(/COURSE-[0-9]+/gi, '[ID]')
          .replace(/STUDENT-[0-9]+/gi, '[ID]');
      }
      if (typeof arg === 'object' && arg !== null) {
        if (isDevOrAdmin()) return arg;
        try {
          let str = JSON.stringify(arg);
          if (str.includes('script.google') || str.includes('sheet') || str.includes('spreadsheet')) {
            return '[Protected Details]';
          }
        } catch(e) {}
      }
      return arg;
    });
  };

  console.log = function(...args) {
    if (isDevOrAdmin()) {
      originalLog.apply(console, args);
    } else {
      const hasSensitive = args.some(arg => {
        const str = String(arg).toLowerCase();
        return str.includes('google') || str.includes('sheet') || str.includes('script.google') || str.includes('database') || str.includes('api.js');
      });
      if (!hasSensitive) {
        originalLog.apply(console, sanitize(args));
      }
    }
  };

  console.warn = function(...args) {
    if (isDevOrAdmin()) {
      originalWarn.apply(console, args);
    }
  };

  console.error = function(...args) {
    if (isDevOrAdmin()) {
      originalError.apply(console, args);
    } else {
      originalError.call(console, 'An error occurred. Details have been logged securely.');
    }
  };
})();

// 1. WEBHOOK CONFIGURATION
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzExxZzi9AZ-bBsJJQQkcrYkcIT4kBKZGBK5sG1GmoLa6CUp4oHQZ2D-m5GcR6qenDm/exec"; 

// Helper to resolve the script URL dynamically (allows editing in UI)
function getActiveScriptUrl() {
  const saved = localStorage.getItem('efbi_script_url');
  if (saved === "https://script.google.com/macros/s/AKfycbxTVnBEFdPvpFTAxQlh9pnsSqSkr_W3A5-FH2E___shLhp-tDEd4LYwh4zxp6HwsqjP/exec") {
    localStorage.removeItem('efbi_script_url');
    return GOOGLE_SCRIPT_URL;
  }
  return saved || GOOGLE_SCRIPT_URL;
}

// Helper to get active sync mode ('live' or 'sandbox')
// Defaults to 'live' so data flows from Google Sheets on first visit.
// Falls back to 'sandbox' only on network failure or explicit admin override.
function getActiveSyncMode() {
  return localStorage.getItem('efbi_sync_mode') || 'live';
}

// Auto-detect backend and configure sync mode on first page load.
// Skipped if the user/admin has already chosen a mode.
async function autoDetectAndConnect() {
  const explicit = localStorage.getItem('efbi_sync_mode');
  if (explicit) return explicit;

  const activeUrl = getActiveScriptUrl();
  if (!activeUrl || !activeUrl.startsWith('http')) {
    localStorage.setItem('efbi_sync_mode', 'sandbox');
    return 'sandbox';
  }

  try {
    const r = await fetch(activeUrl + '?action=ping', { method: 'GET', mode: 'cors' });
    if (r.ok) {
      const j = await r.json();
      if (j.status === 'success') {
        localStorage.setItem('efbi_sync_mode', 'live');
        return 'live';
      }
    }
  } catch (_) {}

  localStorage.setItem('efbi_sync_mode', 'sandbox');
  return 'sandbox';
}

// Default Mock Data - Set to empty for a clean database
const DEFAULT_STUDENTS = [];
const DEFAULT_CERTIFICATES = [];
const DEFAULT_CONTACTS = [];

// Helper to initialize local storage
function initLocalStorageDB() {
  if (!localStorage.getItem('efbi_students')) {
    localStorage.setItem('efbi_students', JSON.stringify(DEFAULT_STUDENTS));
  }
  if (!localStorage.getItem('efbi_certificates')) {
    localStorage.setItem('efbi_certificates', JSON.stringify(DEFAULT_CERTIFICATES));
  }
  if (!localStorage.getItem('efbi_contacts')) {
    localStorage.setItem('efbi_contacts', JSON.stringify(DEFAULT_CONTACTS));
  }
  if (!localStorage.getItem('efbi_courses')) {
    localStorage.setItem('efbi_courses', JSON.stringify([]));
  }
  if (!localStorage.getItem('efbi_notifications')) {
    localStorage.setItem('efbi_notifications', JSON.stringify([]));
  }
}
initLocalStorageDB();

// 2. UNIFIED DATA ACCESS OBJECT (DAO)
const EFBIDatabase = {
  // Check if we are connected to the live Google Script URL
  // Uses a GET request to avoid CORS preflight issues (OPTIONS request)
  async testConnection() {
    const activeUrl = getActiveScriptUrl();
    if (!activeUrl || !activeUrl.startsWith('http')) {
      return { status: 'disconnected', message: 'No Google Script URL configured. Running in local sandbox mode.' };
    }
    
    try {
      // GET request with ?action=ping avoids CORS preflight (no OPTIONS request needed)
      const pingUrl = `${activeUrl}?action=ping`;
      const response = await fetch(pingUrl, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        return { status: 'error', message: 'Something went wrong. Please try again in a few moments.' };
      }

      const result = await response.json();
      if (result.status === 'success') {
        return { status: 'connected', message: 'Connected to Google Sheets Database!' };
      } else {
        return { status: 'error', message: result.message || 'Something went wrong. Please try again in a few moments.' };
      }
    } catch (error) {
      return { 
        status: 'error', 
        message: 'Something went wrong. Please try again in a few moments.' 
      };
    }
  },

  // Generic remote requester
  async request(action, payload = {}) {
    // Whitelist local-only actions that should never hit the remote server
    const localOnlyActions = [
      'getNotifications',
      'addNotification',
      'markNotificationRead'
    ];

    // Actions that WRITE data — safe to fall back to localStorage if backend is unreachable
    const writeFallbackActions = [
      'saveCourse', 'deleteCourse',
      'saveLesson',
      'saveQuizzes', 'saveQuizScore',
      'saveProgress',
      'enrollCourse',
      'updateStudentProfile',
      'issueCertificate', 'revokeCertificate',
      'sendContactMessage',
      'markContactMessageRead',
      'addStudent',
      'approveStudent', 'rejectStudent'
    ];

    if (localOnlyActions.includes(action) || getActiveSyncMode() === 'sandbox') {
      return this.localFallback(action, payload);
    }

    const activeUrl = getActiveScriptUrl();
    if (activeUrl && activeUrl.startsWith('http')) {
      try {
        const response = await fetch(activeUrl, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8' // Crucial for avoiding pre-flight checks in Apps Script
          },
          body: JSON.stringify({ action, ...payload })
        });
        
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        const result = await response.json();
        if (result.status === 'success') {
          return result.data;
        } else {
          // If the Apps Script throws a validation/database error, let's bubble it up
          throw new Error(result.message || 'Something went wrong. Please try again in a few moments.');
        }
      } catch (error) {
        console.warn(`[EFBI API] Live request failed for action "${action}":`, error.message);

        // For write actions: silently save to localStorage as an offline buffer.
        // This keeps the admin workflow unblocked when the backend is unreachable.
        if (writeFallbackActions.includes(action)) {
          const localResult = await this.localFallback(action, payload);
          // Tag the result so the caller knows it was saved locally, not to the server
          if (localResult && typeof localResult === 'object') {
            localResult._savedLocally = true;
          }
          return localResult;
        }

        // For read actions: throw so the UI knows data may be unavailable
        throw new Error('Connection failed. Please check your internet connection and try again.');
      }
    } else {
      // If no URL is set, run completely offline in Local Storage sandbox
      return this.localFallback(action, payload);
    }
  },

  // Local Storage Transaction Logic (Used as local sandbox when no URL is set)
  localFallback(action, payload) {
    let students = JSON.parse(localStorage.getItem('efbi_students'));
    let certificates = JSON.parse(localStorage.getItem('efbi_certificates'));
    let contacts = JSON.parse(localStorage.getItem('efbi_contacts'));

    switch (action) {
      case 'getStudents':
        return Promise.resolve(students);

      case 'getStudentById':
        const foundById = students.find(s => s.id === parseInt(payload.id));
        return Promise.resolve(foundById || null);

      case 'addStudent':
        const newStudent = {
          id: students.length + 1,
          name: payload.name,
          email: payload.email,
          password: payload.password || 'efbi2026',
          country: payload.country || 'Ethiopia',
          region: payload.region,
          school: payload.school,
          grade: payload.grade,
          interest: payload.interest,
          why: payload.why || '',
          status: payload.status || 'Pending',
          date: new Date().toISOString().split('T')[0]
        };
        students.unshift(newStudent);
        localStorage.setItem('efbi_students', JSON.stringify(students));
        // Add a notification for new student
        EFBIDatabase.localFallback('addNotification', {
          type: 'info',
          icon: 'user-plus',
          title: `New student registered: ${newStudent.name}`,
          meta: `${newStudent.interest} • ${newStudent.region} • ${newStudent.date}`
        });
        return Promise.resolve(newStudent);

      case 'approveStudent':
        students = students.map(s => {
          if (s.id === parseInt(payload.id)) {
            s.status = 'Approved';
          }
          return s;
        });
        localStorage.setItem('efbi_students', JSON.stringify(students));
        return Promise.resolve(true);

      case 'getCertificates':
        return Promise.resolve(certificates);

      case 'verifyCertificate':
        const cert = certificates.find(c => c.id === payload.id.trim().toUpperCase());
        return Promise.resolve(cert || null);

      case 'issueCertificate':
        const newCert = {
          id: payload.id || `EFBI-2026-${String(certificates.length + 1).padStart(3, '0')}`,
          name: payload.name,
          course: payload.course,
          date: new Date().toISOString().split('T')[0],
          score: payload.score || null,
          level: payload.level || null,
          instructor: payload.instructor || null,
          status: 'Active'
        };
        certificates.unshift(newCert);
        localStorage.setItem('efbi_certificates', JSON.stringify(certificates));
        // Add a notification for issued cert
        EFBIDatabase.localFallback('addNotification', {
          type: 'success',
          icon: 'award',
          title: `Certificate issued to ${newCert.name}`,
          meta: `${newCert.course} • ${newCert.id} • ${newCert.date}`
        });
        return Promise.resolve(newCert);

      case 'revokeCertificate':
        certificates = certificates.filter(c => c.id !== payload.id);
        localStorage.setItem('efbi_certificates', JSON.stringify(certificates));
        return Promise.resolve(true);

      case 'sendContactMessage':
        const newContact = {
          id: contacts.length + 1,
          name: payload.name,
          email: payload.email,
          subject: payload.subject || 'General Inquiry',
          message: payload.message,
          date: new Date().toISOString().split('T')[0],
          status: 'Unread'
        };
        contacts.unshift(newContact);
        localStorage.setItem('efbi_contacts', JSON.stringify(contacts));
        // Add notification for contact message
        EFBIDatabase.localFallback('addNotification', {
          type: 'warning',
          icon: 'mail',
          title: `New message from ${newContact.name}`,
          meta: `${newContact.email} • ${newContact.date}`
        });
        return Promise.resolve(newContact);

      case 'getContactMessages':
        return Promise.resolve(contacts);

      case 'markContactMessageRead':
        contacts = contacts.map(c => {
          if (c.id === parseInt(payload.id)) {
            c.status = 'Read';
          }
          return c;
        });
        localStorage.setItem('efbi_contacts', JSON.stringify(contacts));
        return Promise.resolve(true);

      case 'verifyAdmin':
        if (payload.username === 'admin' && payload.password === 'efbi2026') {
          return Promise.resolve({ authenticated: true, role: 'super-admin', username: 'admin' });
        }
        return Promise.reject(new Error('Invalid username or password. Please try again.'));

      case 'verifyStudentLogin':
        const stud = students.find(s => s.email.trim().toLowerCase() === payload.email.trim().toLowerCase());
        if (!stud) {
          return Promise.reject(new Error(`No account found with email "${payload.email}".`));
        }
        // Coerce both to string: Sheets may store passwords as numbers
        if (String(stud.password).trim() !== String(payload.password).trim()) {
          return Promise.reject(new Error('Incorrect password. Please try again.'));
        }
        return Promise.resolve({ authenticated: true, student: stud });

      case 'updateStudentProfile':
        students = students.map(s => {
          if (s.email.trim().toLowerCase() === payload.email.trim().toLowerCase()) {
            if (payload.fields.name) s.name = payload.fields.name.trim();
            if (payload.fields.password) s.password = payload.fields.password.trim();
          }
          return s;
        });
        localStorage.setItem('efbi_students', JSON.stringify(students));
        return Promise.resolve({ success: true });

      case 'enrollCourse':
        students = students.map(s => {
          if (s.email.trim().toLowerCase() === payload.email.trim().toLowerCase()) {
            s.interest = payload.course.trim();
            if (!Array.isArray(s.enrollments)) s.enrollments = [];
            if (!s.enrollments.includes(payload.course.trim())) {
              s.enrollments.push(payload.course.trim());
            }
          }
          return s;
        });
        localStorage.setItem('efbi_students', JSON.stringify(students));
        return Promise.resolve({ success: true, course: payload.course });

      case 'getCourses':
        return Promise.resolve(JSON.parse(localStorage.getItem('efbi_courses') || '[]'));

      case 'saveCourse':
        let coursesList = JSON.parse(localStorage.getItem('efbi_courses') || '[]');
        let savedCourseId = payload.id;
        if (savedCourseId) {
          coursesList = coursesList.map(c => c.id === savedCourseId ? { ...c, ...payload } : c);
        } else {
          savedCourseId = 'COURSE-' + new Date().getTime();
          coursesList.unshift({ id: savedCourseId, ...payload });
        }
        localStorage.setItem('efbi_courses', JSON.stringify(coursesList));
        return Promise.resolve({ success: true, id: savedCourseId });

      case 'deleteCourse':
        let currentCourses = JSON.parse(localStorage.getItem('efbi_courses') || '[]');
        currentCourses = currentCourses.filter(c => c.id !== payload.id);
        localStorage.setItem('efbi_courses', JSON.stringify(currentCourses));
        return Promise.resolve({ success: true });

      // ======= NOTIFICATIONS =======
      case 'getNotifications':
        return Promise.resolve(JSON.parse(localStorage.getItem('efbi_notifications') || '[]'));

      case 'addNotification':
        const notifList = JSON.parse(localStorage.getItem('efbi_notifications') || '[]');
        const newNotif = {
          id: payload.id || Date.now(),
          type: payload.type || 'announcement',
          icon: payload.icon || 'bell',
          title: payload.title || 'Notification Alert',
          description: payload.description || 'No description provided.',
          date: payload.date || new Date().toISOString().split('T')[0],
          time: payload.time || new Date().toLocaleTimeString(),
          relatedUser: payload.relatedUser || 'N/A',
          relatedCourse: payload.relatedCourse || 'N/A',
          read: payload.read !== undefined ? payload.read : false
        };
        
        // Prevent duplicate entries by type and key identifiers
        const isDuplicate = notifList.some(n => 
          n.type === newNotif.type && 
          n.title === newNotif.title && 
          n.relatedUser === newNotif.relatedUser &&
          n.relatedCourse === newNotif.relatedCourse
        );
        if (isDuplicate) {
          return Promise.resolve(null);
        }

        notifList.unshift(newNotif);
        if (notifList.length > 50) notifList.pop();
        localStorage.setItem('efbi_notifications', JSON.stringify(notifList));
        return Promise.resolve(newNotif);

      case 'markNotificationRead':
        const notifs = JSON.parse(localStorage.getItem('efbi_notifications') || '[]');
        const updated = notifs.map(n => {
          if (payload.id === 'all' || n.id === payload.id) n.read = true;
          return n;
        });
        localStorage.setItem('efbi_notifications', JSON.stringify(updated));
        return Promise.resolve(true);

      // ======= QUIZ SCORES =======
      case 'getQuizScores':
        // Scores stored per student email
        const scoresKey = 'efbi_quiz_scores_' + (payload.email || 'guest').replace(/[^a-zA-Z0-9]/g, '_');
        return Promise.resolve(JSON.parse(localStorage.getItem(scoresKey) || '{}'));

      case 'saveQuizScore':
        const sKey = 'efbi_quiz_scores_' + (payload.email || 'guest').replace(/[^a-zA-Z0-9]/g, '_');
        const existingScores = JSON.parse(localStorage.getItem(sKey) || '{}');
        existingScores[payload.moduleIdx] = {
          score: payload.score,
          total: payload.total,
          percent: payload.percent,
          date: new Date().toISOString()
        };
        localStorage.setItem(sKey, JSON.stringify(existingScores));
        return Promise.resolve(true);

      // ======= LESSONS & PROGRESS SANDBOX FALLBACKS =======
      case 'saveProgress':
        const progKey = 'efbi_backend_progress_' + (payload.email || 'guest').replace(/[^a-zA-Z0-9]/g, '_');
        let emailProgress = JSON.parse(localStorage.getItem(progKey) || '[]');
        // remove existing record if any
        emailProgress = emailProgress.filter(p => !(p.courseId === payload.courseId && String(p.moduleIdx) === String(payload.moduleIdx)));
        emailProgress.push({
          courseId: payload.courseId,
          moduleIdx: parseInt(payload.moduleIdx) || 0,
          completed: payload.completed
        });
        localStorage.setItem(progKey, JSON.stringify(emailProgress));
        return Promise.resolve({ success: true });

      case 'getProgress':
        const getProgKey = 'efbi_backend_progress_' + (payload.email || 'guest').replace(/[^a-zA-Z0-9]/g, '_');
        return Promise.resolve(JSON.parse(localStorage.getItem(getProgKey) || '[]'));

      case 'getLessons':
        return Promise.resolve(JSON.parse(localStorage.getItem('efbi_backend_lessons') || '[]'));

      case 'saveLesson':
        let allLessons = JSON.parse(localStorage.getItem('efbi_backend_lessons') || '[]');
        allLessons = allLessons.filter(l => !(l.courseid === payload.courseId && String(l.moduleidx) === String(payload.moduleIdx)));
        allLessons.push({
          courseid: payload.courseId,
          moduleidx: parseInt(payload.moduleIdx) || 0,
          title: payload.title,
          videourl: payload.videourl,
          notestext: payload.notestext,
          resourceslinks: payload.resourceslinks,
          quizurl: payload.quizurl
        });
        localStorage.setItem('efbi_backend_lessons', JSON.stringify(allLessons));
        return Promise.resolve({ success: true });

      case 'getQuizzes':
        return Promise.resolve(JSON.parse(localStorage.getItem('efbi_backend_quizzes') || '[]'));

      case 'saveQuizzes':
        let allQuizzes = JSON.parse(localStorage.getItem('efbi_backend_quizzes') || '[]');
        // Filter out old ones
        allQuizzes = allQuizzes.filter(q => !(q.courseid === payload.courseId && String(q.moduleidx) === String(payload.moduleIdx)));
        // Add new ones
        const newQuizzes = (payload.questions || []).map((q, idx) => ({
          courseid: payload.courseId,
          moduleidx: parseInt(payload.moduleIdx) || 0,
          questionidx: idx,
          q: q.q,
          opts: q.opts || ['', '', '', ''],
          a: parseInt(q.a) || 0
        }));
        allQuizzes = allQuizzes.concat(newQuizzes);
        localStorage.setItem('efbi_backend_quizzes', JSON.stringify(allQuizzes));
        return Promise.resolve({ success: true });

      default:
        return Promise.reject(new Error(`Action ${action} not supported.`));
    }
  }

};


/* EFBI Academy - temporary public maintenance mode
 * Keep enabled until the v2 authentication and data layers are deployed.
 */
(() => {
  'use strict';

  const HOLD = Object.freeze({
    active: true,
    code: 'EFBI_SECURITY_HOLD',
    message: 'EFBI Academy is undergoing a security and learning-platform upgrade. Registration and account access are temporarily paused.'
  });

  window.EFBI_SECURITY_HOLD = HOLD;

  function addStyles() {
    if (document.getElementById('efbi-maintenance-styles')) return;

    const style = document.createElement('style');
    style.id = 'efbi-maintenance-styles';
    style.textContent = `
      .efbi-security-hold-banner {
        position: fixed;
        top: 72px;
        left: 0;
        right: 0;
        z-index: 1000;
        padding: 11px 20px;
        text-align: center;
        color: #fff;
        background: linear-gradient(90deg, #9a3412, #c2410c);
        box-shadow: 0 8px 24px rgba(15, 23, 42, .24);
        font-size: .9rem;
        line-height: 1.45;
      }
      .efbi-security-hold-notice {
        padding: 24px;
        border: 1px solid rgba(249, 115, 22, .4);
        border-radius: 16px;
        background: rgba(249, 115, 22, .08);
        color: var(--text-primary);
        text-align: center;
      }
      .efbi-security-hold-notice h3 { margin: 0 0 8px; }
      .efbi-security-hold-notice p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.6;
      }
      .security-hold [aria-disabled="true"] {
        opacity: .65;
        cursor: not-allowed;
      }
      @media (max-width: 768px) {
        .efbi-security-hold-banner {
          top: 64px;
          padding: 9px 14px;
          font-size: .8rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createNotice(title, description) {
    const notice = document.createElement('div');
    notice.className = 'efbi-security-hold-notice';
    notice.dataset.securityHoldNotice = 'true';
    notice.setAttribute('role', 'status');

    const heading = document.createElement('h3');
    heading.textContent = title;

    const message = document.createElement('p');
    message.textContent = description;

    notice.append(heading, message);
    return notice;
  }

  function replaceForm(selector, title, description) {
    const form = document.querySelector(selector);
    if (!form || form.dataset.securityHoldApplied === 'true') return;

    form.dataset.securityHoldApplied = 'true';
    form.hidden = true;
    form.style.display = 'none';
    form.insertAdjacentElement('beforebegin', createNotice(title, description));
  }

  function disableVerification() {
    const inputGroup = document.querySelector('.verifier-input-group');
    if (!inputGroup || inputGroup.dataset.securityHoldApplied === 'true') return;

    inputGroup.dataset.securityHoldApplied = 'true';
    inputGroup.hidden = true;
    inputGroup.style.display = 'none';

    const examples = inputGroup.nextElementSibling;
    if (examples) examples.style.display = 'none';

    inputGroup.insertAdjacentElement(
      'beforebegin',
      createNotice(
        'Certificate verification is temporarily paused',
        'Verification will return when the new secure credential service is launched.'
      )
    );
  }

  function bootMaintenanceMode() {
    document.body.classList.add('security-hold');

    ['efbi_student_session', 'efbi_admin_session'].forEach((key) => {
      try { localStorage.removeItem(key); } catch (_) {}
      try { sessionStorage.removeItem(key); } catch (_) {}
    });

    addStyles();

    if (!document.getElementById('efbi-security-hold-banner')) {
      const banner = document.createElement('div');
      banner.id = 'efbi-security-hold-banner';
      banner.className = 'efbi-security-hold-banner';
      banner.setAttribute('role', 'status');
      banner.textContent = HOLD.message;

      const header = document.querySelector('header');
      if (header) header.insertAdjacentElement('afterend', banner);
      else document.body.prepend(banner);
    }

    replaceForm(
      '#registration-form',
      'Registration is temporarily paused',
      'Please do not submit personal information. EFBI is rebuilding the academy with stronger account protection.'
    );
    replaceForm(
      '#student-login-form',
      'Student access is temporarily paused',
      'The new student portal will reopen with secure email verification and password recovery.'
    );
    replaceForm(
      '#admin-login-form',
      'Administrator access is temporarily paused',
      'Management actions remain disabled while the new authorization system is being built.'
    );
    replaceForm(
      '#contact-form',
      'The website contact form is temporarily paused',
      'Please use EFBI\'s published email or Telegram contact during the upgrade.'
    );

    disableVerification();

    ['homepage-stat-students', 'homepage-stat-certs', 'homepage-stat-projects'].forEach((id) => {
      const metric = document.getElementById(id);
      const item = metric && metric.closest('.stat-item');
      if (item) item.style.display = 'none';
    });

    document.querySelectorAll('#btn-show-student-login, #btn-show-student-login-mobile').forEach((control) => {
      control.setAttribute('aria-disabled', 'true');
      control.setAttribute('title', HOLD.message);
    });
  }

  document.addEventListener('submit', (event) => {
    if (!event.target.matches('#registration-form, #student-login-form, #admin-login-form, #contact-form')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener('click', (event) => {
    const signIn = event.target.closest('#btn-show-student-login, #btn-show-student-login-mobile');
    if (!signIn) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.hash = '#register';
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootMaintenanceMode, { once: true });
  } else {
    bootMaintenanceMode();
  }
})();

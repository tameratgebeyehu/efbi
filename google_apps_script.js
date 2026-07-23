/**
 * Google Apps Script Webhook Backend for EFBI Platform
 *
 * =====================================================================
 * ⚠️  IMPORTANT SETUP - DO THIS FIRST BEFORE DEPLOYING  ⚠️
 * =====================================================================
 *
 * STEP 1: Find your Google Sheet's Spreadsheet ID.
 *    - Open your Google Sheet in the browser.
 *    - Look at the URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_IS_HERE/edit
 *    - Copy the long string between /d/ and /edit
 *
 * STEP 2: Paste that ID below, replacing "PASTE_YOUR_SPREADSHEET_ID_HERE":
 */
const SPREADSHEET_ID = "PASTE_YOUR_SPREADSHEET_ID_HERE";

/**
 * STEP 3: In Google Sheets: Extensions > Apps Script
 * STEP 4: Paste this entire script (replacing all existing code)
 * STEP 5: Save (disk icon)
 * STEP 6: Deploy > Manage Deployments > Edit > Version: New version > Deploy
 */

// Default admin credentials used if no "Admins" sheet row exists yet
const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "efbi2026";

// =============================================================
// MAIN ENTRY POINTS
// =============================================================

/**
 * Handles POST requests from the website
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    // Ping — no spreadsheet needed
    if (action === 'ping') {
      return createResponse({ status: 'success', data: 'pong', message: 'EFBI Backend is online.' });
    }

    const ss = getSpreadsheet();
    initSheets(ss);

    let responseData;

    switch (action) {
      case 'getStudents':
        responseData = getSheetData(ss, 'Students');
        break;

      case 'addStudent':
        responseData = addStudentRow(ss, requestData);
        break;

      case 'approveStudent':
        responseData = updateStudentStatus(ss, requestData.id, 'Approved');
        break;

      case 'rejectStudent':
        responseData = updateStudentStatus(ss, requestData.id, 'Rejected');
        break;

      case 'getCertificates':
        responseData = getSheetData(ss, 'Certificates');
        break;

      case 'verifyCertificate':
        responseData = lookupCertificate(ss, requestData.id);
        break;

      case 'issueCertificate':
        responseData = addCertificateRow(ss, requestData);
        break;

      case 'revokeCertificate':
        responseData = deleteCertificateRow(ss, requestData.id);
        break;

      case 'sendContactMessage':
        responseData = addContactRow(ss, requestData);
        break;

      case 'getContactMessages':
        responseData = getSheetData(ss, 'Contacts');
        break;

      case 'markContactMessageRead':
        responseData = updateContactMessageStatus(ss, requestData.id, 'Read');
        break;

      case 'verifyAdmin':
        responseData = verifyAdminCredentials(ss, requestData.username, requestData.password);
        break;

      // Student Auth Actions
      case 'verifyStudentLogin':
        responseData = verifyStudentLogin(ss, requestData.email, requestData.password);
        break;

      case 'updateStudentProfile':
        responseData = updateStudentProfile(ss, requestData.email, requestData.fields);
        break;

      case 'enrollCourse':
        responseData = enrollCourse(ss, requestData.email, requestData.course);
        break;

      case 'getCourses':
        responseData = getCourses(ss);
        break;

      case 'saveCourse':
        responseData = saveCourse(ss, requestData);
        break;

      case 'deleteCourse':
        responseData = deleteCourse(ss, requestData.id);
        break;

      case 'saveProgress':
        responseData = saveProgressRow(ss, requestData);
        break;

      case 'getProgress':
        responseData = getProgressRows(ss, requestData.email);
        break;

      case 'getLessons':
        responseData = getLessons(ss);
        break;

      case 'saveLesson':
        responseData = saveLesson(ss, requestData);
        break;

      case 'getQuizzes':
        responseData = getQuizzes(ss);
        break;

      case 'saveQuizzes':
        responseData = saveQuizzes(ss, requestData);
        break;

      case 'saveQuizScore':
        responseData = saveQuizScore(ss, requestData);
        break;

      case 'getQuizScores':
        responseData = getQuizScores(ss, requestData.email);
        break;

      default:
        return createResponse({ status: 'error', message: 'Unknown action: ' + action });
    }

    return createResponse({ status: 'success', data: responseData });

  } catch (error) {
    return createResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * Handles GET requests — for browser testing and ping
 */
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === 'ping') {
    return createResponse({ status: 'success', data: 'pong', message: 'EFBI Backend is online (GET ping).' });
  }

  let sheetInfo = "Unspecified (using container-bound Active Spreadsheet)";
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'PASTE_YOUR_SPREADSHEET_ID_HERE') {
    sheetInfo = SPREADSHEET_ID;
  } else {
    try {
      const activeSS = SpreadsheetApp.getActiveSpreadsheet();
      if (activeSS) {
        sheetInfo = "Active Spreadsheet: " + activeSS.getName() + " (" + activeSS.getId() + ")";
      }
    } catch (err) {
      sheetInfo = "Error: Not container-bound and SPREADSHEET_ID is not set.";
    }
  }

  return ContentService.createTextOutput(
    'EFBI Platform Backend is running! ✅\n\n' +
    'Database: ' + sheetInfo + '\n\n' +
    'To test: add ?action=ping to the end of this URL.'
  );
}

// =============================================================
// SPREADSHEET HELPER
// =============================================================

function getSpreadsheet() {
  // First, check if the script is container-bound to a Google Sheet
  try {
    const activeSS = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSS) return activeSS;
  } catch (err) {
    // Script is not container-bound, proceed to open by ID
  }

  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'PASTE_YOUR_SPREADSHEET_ID_HERE') {
    throw new Error(
      'Spreadsheet is not container-bound and SPREADSHEET_ID is not set! ' +
      'Either: (1) Open this script via Extensions > Apps Script in your Google Sheet, ' +
      'or (2) Replace "PASTE_YOUR_SPREADSHEET_ID_HERE" at the top of the script with your actual Google Sheet ID.'
    );
  }

  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    throw new Error(
      'Could not open spreadsheet ID: ' + SPREADSHEET_ID + '. ' +
      'Ensure the ID is correct and the script is authorized. Error: ' + err.toString()
    );
  }
}

/**
 * Creates all required sheets if they do not exist
 */
function initSheets(ss) {
  if (!ss.getSheetByName('Students')) {
    const sheet = ss.insertSheet('Students');
    sheet.appendRow(['ID', 'Name', 'Email', 'Password', 'Country', 'Region', 'School', 'Grade', 'Interest', 'Why Join', 'Status', 'Date']);
    sheet.setFrozenRows(1);
  } else {
    // Migrate existing sheet if headers are mismatched
    migrateStudentsSheet(ss);
  }

  if (!ss.getSheetByName('Certificates')) {
    const sheet = ss.insertSheet('Certificates');
    sheet.appendRow(['ID', 'Name', 'Course', 'Date', 'Status']);
    sheet.setFrozenRows(1);
  }

  if (!ss.getSheetByName('Contacts')) {
    const sheet = ss.insertSheet('Contacts');
    sheet.appendRow(['ID', 'Name', 'Email', 'Subject', 'Message', 'Date', 'Status']);
    sheet.setFrozenRows(1);
  } else {
    migrateContactsSheet(ss);
  }

  // Admins sheet — stores login credentials
  if (!ss.getSheetByName('Admins')) {
    const sheet = ss.insertSheet('Admins');
    sheet.appendRow(['Username', 'Password', 'Role', 'Created']);
    sheet.setFrozenRows(1);
    // Seed default admin credentials
    sheet.appendRow([
      DEFAULT_ADMIN_USERNAME,
      DEFAULT_ADMIN_PASSWORD,
      'super-admin',
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
    ]);
  }

  if (!ss.getSheetByName('Courses')) {
    const sheet = ss.insertSheet('Courses');
    sheet.appendRow(['ID', 'Title', 'Short Description', 'Full Description', 'Instructor', 'Category', 'Difficulty Level', 'Duration', 'Thumbnail Image', 'Number of Modules', 'Status']);
    sheet.setFrozenRows(1);
  }

  if (!ss.getSheetByName('Progress')) {
    const sheet = ss.insertSheet('Progress');
    sheet.appendRow(['Email', 'CourseID', 'ModuleIdx', 'Completed', 'Timestamp']);
    sheet.setFrozenRows(1);
  }

  if (!ss.getSheetByName('Lessons')) {
    const sheet = ss.insertSheet('Lessons');
    sheet.appendRow(['CourseID', 'ModuleIdx', 'Title', 'VideoURL', 'NotesText', 'ResourcesLinks', 'QuizURL']);
    sheet.setFrozenRows(1);
  }

  if (!ss.getSheetByName('Quizzes')) {
    const sheet = ss.insertSheet('Quizzes');
    sheet.appendRow(['CourseID', 'ModuleIdx', 'QuestionIdx', 'Question', 'Option1', 'Option2', 'Option3', 'Option4', 'Answer']);
    sheet.setFrozenRows(1);
  }

  if (!ss.getSheetByName('QuizScores')) {
    const sheet = ss.insertSheet('QuizScores');
    sheet.appendRow(['Email', 'CourseID', 'ModuleIdx', 'Score', 'Total', 'Percent', 'Date']);
    sheet.setFrozenRows(1);
  }
}

/**
 * Automatically migrates existing Students sheet from 10/11-column layouts to 12-column layout.
 * Adds Password column and preserves headers and historical data cleanly.
 */
function migrateStudentsSheet(ss) {
  const sheet = ss.getSheetByName('Students');
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1) return;

  const range = sheet.getRange(1, 1, lastRow, Math.max(lastCol, 12));
  const values = range.getValues();
  const headers = values[0];
  
  // Normalize headers
  const normHeaders = headers.map(h => h.toString().toLowerCase().replace(/\s+/g, ''));
  const hasPassword = normHeaders.includes('password');

  if (hasPassword) {
    return; // Already migrated to 12-column schema
  }

  const migratedRows = [];
  // Header row
  migratedRows.push(['ID', 'Name', 'Email', 'Password', 'Country', 'Region', 'School', 'Grade', 'Interest', 'Why Join', 'Status', 'Date']);

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const id = row[0];
    const name = row[1];
    const email = row[2];
    
    // Skip completely empty rows
    if (id === "" && name === "" && email === "") {
      continue;
    }

    // Checking if row was written in 10-column or 11-column format
    const val8 = (row[8] || '').toString().trim();
    const val9 = (row[9] || '').toString().trim();
    const val10 = (row[10] || '').toString().trim();

    const isStatus = ['pending', 'approved', 'rejected'].includes(val8.toLowerCase());
    const hasVal10 = (row[10] !== undefined && row[10] !== "");

    const password = 'efbi2026'; // Default password for historical accounts
    const country = row[3] || 'Ethiopia';
    const region = row[4];
    const school = row[5];
    const grade = row[6];
    const interest = row[7];
    
    let why = '';
    let status = 'Pending';
    let date = '';

    if (hasVal10 || !isStatus) {
      // 11-column layout: [id, name, email, country, region, school, grade, interest, why, status, date]
      why = val8;
      status = val9 || 'Pending';
      date = val10;
    } else {
      // 10-column layout: [id, name, email, country, region, school, grade, interest, status, date]
      why = '';
      status = val8 || 'Pending';
      date = val9;
    }

    migratedRows.push([id, name, email, password, country, region, school, grade, interest, why, status, date]);
  }

  // Clear sheet and rewrite corrected rows
  sheet.clear();
  sheet.getRange(1, 1, migratedRows.length, 12).setValues(migratedRows);
  sheet.setFrozenRows(1);
}

/**
 * Automatically migrates existing Contacts sheet to the 7-column layout (adds Subject and Status).
 */
function migrateContactsSheet(ss) {
  const sheet = ss.getSheetByName('Contacts');
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1) return;

  const range = sheet.getRange(1, 1, lastRow, Math.max(lastCol, 5));
  const values = range.getValues();
  const headers = values[0];
  
  // Normalize headers
  const normHeaders = headers.map(h => h.toString().toLowerCase().replace(/\s+/g, ''));
  const hasSubject = normHeaders.includes('subject');
  const hasStatus = normHeaders.includes('status');

  if (hasSubject && hasStatus) {
    return; // Already migrated
  }

  const migratedRows = [];
  migratedRows.push(['ID', 'Name', 'Email', 'Subject', 'Message', 'Date', 'Status']);

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const id = row[0];
    const name = row[1];
    const email = row[2];
    
    if (id === "" && name === "" && email === "") {
      continue;
    }

    let subject = 'General Inquiry';
    let message = '';
    let date = '';
    let status = 'Unread';

    if (!hasSubject && !hasStatus) {
      // Old schema: ID, Name, Email, Message, Date
      message = row[3] || '';
      date = row[4] || '';
    } else if (!hasSubject && hasStatus) {
      // Middle schema: ID, Name, Email, Message, Date, Status
      message = row[3] || '';
      date = row[4] || '';
      status = row[5] || 'Unread';
    } else {
      message = row[3] || '';
      date = row[4] || '';
    }

    migratedRows.push([id, name, email, subject, message, date, status]);
  }

  sheet.clear();
  sheet.getRange(1, 1, migratedRows.length, 7).setValues(migratedRows);
  sheet.setFrozenRows(1);
}

/**
 * Converts sheet rows to JSON array (latest first)
 */
function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      let key = header.toString().toLowerCase().replace(/\s+/g, '');
      if (key === 'whyjoin') key = 'why';
      const val = row[index];
      obj[key] = val instanceof Date
        ? Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd')
        : val;
    });
    return obj;
  }).reverse();
}

// =============================================================
// ADMIN AUTHENTICATION
// =============================================================

function verifyAdminCredentials(ss, username, password) {
  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  const sheet = ss.getSheetByName('Admins');
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowUsername = data[i][0].toString().trim();
      const rowPassword = data[i][1].toString().trim();
      const rowRole     = data[i][2].toString().trim() || 'admin';

      if (rowUsername === username.trim() && rowPassword === password.trim()) {
        return { authenticated: true, role: rowRole, username: rowUsername };
      }
    }
  }

  if (username.trim() === DEFAULT_ADMIN_USERNAME && password.trim() === DEFAULT_ADMIN_PASSWORD) {
    return { authenticated: true, role: 'super-admin', username: username };
  }

  throw new Error('Invalid username or password. Please try again.');
}

// =============================================================
// STUDENT OPERATIONS
// =============================================================

/**
 * Adds a new student row with server-side email deduplication.
 */
function addStudentRow(ss, data) {
  const sheet = ss.getSheetByName('Students');
  const sheetData = sheet.getDataRange().getValues();

  const emailToAdd = (data.email || '').trim().toLowerCase();
  for (let i = 1; i < sheetData.length; i++) {
    const existingEmail = sheetData[i][2].toString().trim().toLowerCase();
    if (existingEmail === emailToAdd) {
      throw new Error(
        'Duplicate application: An application with email "' + data.email + '" already exists. ' +
        'Contact us directly if you believe this is an error.'
      );
    }
  }

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const newId = sheet.getLastRow();

  // Appends 12 elements (includes Password at Col 4 / index 3)
  sheet.appendRow([
    newId,
    data.name     || '',
    data.email    || '',
    String(data.password || 'efbi2026'),
    data.country  || 'Ethiopia',
    data.region   || '',
    data.school   || '',
    data.grade    || '',
    data.interest || '',
    data.why      || '',
    'Pending',
    today
  ]);

  return {
    id: newId,
    name: data.name,
    email: data.email,
    country: data.country || 'Ethiopia',
    region: data.region,
    school: data.school,
    grade: data.grade,
    interest: data.interest,
    why: data.why,
    status: 'Pending',
    date: today
  };
}

function updateStudentStatus(ss, id, newStatus) {
  const sheet = ss.getSheetByName('Students');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (parseInt(data[i][0]) === parseInt(id)) {
      sheet.getRange(i + 1, 11).setValue(newStatus); // Column 11 is Status (index 10)
      
      // Auto-Email Trigger on Approval
      if (newStatus === 'Approved') {
        try {
          const name = data[i][1];
          const email = data[i][2];
          const course = data[i][8]; // Column 9 is Interest (index 8)
          sendApprovalEmail(email, name, course);
        } catch (emailErr) {
          console.error('Failed to send approval notification email: ' + emailErr.toString());
        }
      }

      return { id: id, status: newStatus };
    }
  }
  throw new Error('Student ID ' + id + ' not found.');
}

/**
 * Validates student login credentials
 */
function verifyStudentLogin(ss, email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const sheet = ss.getSheetByName('Students');
  if (!sheet) throw new Error('Students database not found.');

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowEmail    = data[i][2].toString().trim().toLowerCase();
    const rowPassword = data[i][3].toString().trim();

    if (rowEmail === email.trim().toLowerCase()) {
      if (rowPassword === String(password).trim()) {
        const headers = data[0];
        const studentObj = {};
        headers.forEach((header, index) => {
          let key = header.toString().toLowerCase().replace(/\s+/g, '');
          if (key === 'whyjoin') key = 'why';
          const val = data[i][index];
          studentObj[key] = val instanceof Date
            ? Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd')
            : val;
        });
        return { authenticated: true, student: studentObj };
      } else {
        throw new Error('Incorrect password. Please try again.');
      }
    }
  }
  throw new Error('No registered account found with email "' + email + '".');
}

/**
 * Updates editable student fields (Name / Password) from student settings
 */
function updateStudentProfile(ss, email, fields) {
  const sheet = ss.getSheetByName('Students');
  if (!sheet) throw new Error('Students database not found.');

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowEmail = data[i][2].toString().trim().toLowerCase();
    if (rowEmail === email.trim().toLowerCase()) {
      if (fields.name) sheet.getRange(i + 1, 2).setValue(fields.name.trim());
      if (fields.password) sheet.getRange(i + 1, 4).setValue(fields.password.trim());
      return { success: true };
    }
  }
  throw new Error('Student account not found.');
}

/**
 * Enrolls a logged-in student in a new course
 */
function enrollCourse(ss, email, courseName) {
  const sheet = ss.getSheetByName('Students');
  if (!sheet) throw new Error('Students database not found.');

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowEmail = data[i][2].toString().trim().toLowerCase();
    if (rowEmail === email.trim().toLowerCase()) {
      sheet.getRange(i + 1, 9).setValue(courseName.trim()); // Column 9 is Interest (index 8)
      
      // Send dynamic email notification about course enrollment
      try {
        const studentName = data[i][1];
        sendCourseEnrollmentEmail(email, studentName, courseName);
      } catch (err) {
        console.error('Failed to send enrollment email: ' + err.toString());
      }
      return { success: true, course: courseName };
    }
  }
  throw new Error('Student account not found.');
}

// =============================================================
// EMAIL HELPER TRIGGERS
// =============================================================

function sendApprovalEmail(email, name, course) {
  const subject = "Congratulations! Your EFBI Application is Approved 🎉";
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1a202c;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 26px; font-weight: bold; color: #2563eb; letter-spacing: -0.5px;">EFBI Initiative</div>
        <p style="font-size: 13px; color: #718096; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Ethiopian Future Builders Initiative</p>
      </div>
      
      <h2 style="font-size: 22px; color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-top: 0;">Application Approved!</h2>
      
      <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
      
      <p style="font-size: 15px; line-height: 1.6;">We are absolutely thrilled to inform you that your application to the <strong>Ethiopian Future Builders Initiative (EFBI)</strong> has been officially approved! 🌟</p>
      
      <div style="background-color: #f8fafc; padding: 18px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #10b981; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);">
        <p style="margin: 0; font-size: 15px; color: #334155;"><strong>Enrolled Path:</strong> ${course}</p>
        <p style="margin: 6px 0 0 0; font-size: 15px; color: #334155;"><strong>Status:</strong> Active (Curriculum Unlocked)</p>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6;">You can now log in to the Student Portal to start your learning modules, track your syllabus items, and work toward your verified completion certificate.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="http://localhost:8000/#profile" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2);">Go to Student Dashboard</a>
      </div>
      
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 10px; font-size: 13.5px; color: #475569; line-height: 1.5; border: 1px solid #e2e8f0;">
        <strong>Login Instructions:</strong><br>
        Log in using your registered email address and the password you selected during registration. 
        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 12.5px; color: #64748b;">
          * Note: If you registered before this system was active, your default password is <strong>efbi2026</strong>. You can change this anytime from your profile settings.
        </div>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
      
      <p style="font-size: 12.5px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.4;">
        Addis Ababa, Ethiopia | info@efbi-initiative.org <br>
        &copy; 2026 Ethiopian Future Builders Initiative. All Rights Reserved.
      </p>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

function sendCourseEnrollmentEmail(email, name, course) {
  const subject = `Successfully Enrolled in ${course} - EFBI`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1a202c;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 24px; font-weight: bold; color: #2563eb;">EFBI Initiative</div>
      </div>
      
      <h2 style="font-size: 20px; color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-top: 0;">Course Enrollment Confirmed</h2>
      
      <p style="font-size: 15px; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
      
      <p style="font-size: 15px; line-height: 1.6;">This email confirms that you have successfully enrolled in your new learning pathway:</p>
      
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #2563eb;">
        <p style="margin: 0; font-size: 15px; color: #334155;"><strong>Course Path:</strong> ${course}</p>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6;">Your curriculum has been updated. Log in to your student dashboard to access your lessons and materials.</p>
      
      <div style="text-align: center; margin: 28px 0;">
        <a href="http://localhost:8000/#profile" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Start Learning Now</a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      
      <p style="font-size: 12.5px; color: #94a3b8; text-align: center; margin: 0;">
        Addis Ababa, Ethiopia | info@efbi-initiative.org
      </p>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

// =============================================================
// CERTIFICATE OPERATIONS
// =============================================================

function lookupCertificate(ss, id) {
  const sheet = ss.getSheetByName('Certificates');
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim().toUpperCase() === id.toString().trim().toUpperCase()) {
      const dateVal = data[i][3];
      return {
        id: data[i][0],
        name: data[i][1],
        course: data[i][2],
        date: dateVal instanceof Date
          ? Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd')
          : dateVal,
        status: data[i][4]
      };
    }
  }
  return null;
}

function addCertificateRow(ss, data) {
  const sheet = ss.getSheetByName('Certificates');
  const totalRows = sheet.getLastRow();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const certId = data.id || ('EFBI-' + new Date().getFullYear() + '-' + String(totalRows).padStart(3, '0'));

  sheet.appendRow([certId, data.name, data.course, today, 'Active']);
  return { id: certId, name: data.name, course: data.course, date: today, status: 'Active' };
}

function deleteCertificateRow(ss, id) {
  const sheet = ss.getSheetByName('Certificates');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim().toUpperCase() === id.toString().trim().toUpperCase()) {
      sheet.deleteRow(i + 1);
      return { deleted: true, id: id };
    }
  }
  throw new Error('Certificate ID ' + id + ' not found.');
}

// =============================================================
// CONTACT OPERATIONS
// =============================================================

function addContactRow(ss, data) {
  const sheet = ss.getSheetByName('Contacts');
  const sheetData = sheet.getDataRange().getValues();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const emailToAdd   = (data.email   || '').trim().toLowerCase();
  const messageToAdd = (data.message || '').trim().toLowerCase();

  for (let i = 1; i < sheetData.length; i++) {
    const isNewSchema = sheetData[0].length >= 7;
    const msgIdx = isNewSchema ? 4 : 3;
    const dateIdx = isNewSchema ? 5 : 4;

    const existingEmail   = sheetData[i][2].toString().trim().toLowerCase();
    const existingMessage = sheetData[i][msgIdx].toString().trim().toLowerCase();
    const existingDate    = sheetData[i][dateIdx] instanceof Date
      ? Utilities.formatDate(sheetData[i][dateIdx], Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : sheetData[i][dateIdx].toString();

    if (existingEmail === emailToAdd && existingMessage === messageToAdd && existingDate === today) {
      throw new Error('This message was already sent today. Contact us directly at info@efbi-initiative.org if you need urgent assistance.');
    }
  }

  const totalRows = sheet.getLastRow();
  const isNewSchema = sheetData[0].length >= 7;
  if (isNewSchema) {
    sheet.appendRow([totalRows, data.name || '', data.email || '', data.subject || 'General Inquiry', data.message || '', today, 'Unread']);
  } else {
    sheet.appendRow([totalRows, data.name || '', data.email || '', data.message || '', today]);
  }
  return { id: totalRows, name: data.name, date: today };
}

function updateContactMessageStatus(ss, id, status) {
  const sheet = ss.getSheetByName('Contacts');
  if (!sheet) throw new Error('Contacts database not found.');

  const data = sheet.getDataRange().getValues();
  const statusIdx = data[0].map(h => h.toString().toLowerCase().replace(/\s+/g, '')).indexOf('status');
  if (statusIdx === -1) throw new Error('Status column not found. Sheet migration required.');

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === id.toString().trim()) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(status);
      return { success: true };
    }
  }
  throw new Error('Message not found.');
}

// =============================================================
// COURSE OPERATIONS
// =============================================================

function getCourses(ss) {
  const sheet = ss.getSheetByName('Courses');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const courses = [];
  for (let i = 1; i < data.length; i++) {
    courses.push({
      id: data[i][0].toString(),
      title: data[i][1].toString(),
      shortDesc: data[i][2].toString(),
      fullDesc: data[i][3].toString(),
      instructor: data[i][4].toString(),
      category: data[i][5].toString(),
      level: data[i][6].toString(),
      duration: data[i][7].toString(),
      icon: data[i][8].toString(),
      modules: parseInt(data[i][9]) || 5,
      status: data[i][10].toString()
    });
  }
  return courses;
}

function saveCourse(ss, data) {
  const sheet = ss.getSheetByName('Courses');
  const dataRange = sheet.getDataRange().getValues();
  let courseId = data.id;
  let rowIdx = -1;
  
  if (courseId) {
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][0].toString() === courseId.toString()) {
        rowIdx = i + 1;
        break;
      }
    }
  } else {
    courseId = 'COURSE-' + new Date().getTime();
  }
  
  const rowValues = [
    courseId,
    data.title || '',
    data.shortDesc || '',
    data.fullDesc || '',
    data.instructor || '',
    data.category || '',
    data.level || 'Beginner',
    data.duration || '6 Weeks',
    data.icon || 'book-open',
    parseInt(data.modules) || 5,
    data.status || 'Draft'
  ];
  
  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return { success: true, id: courseId };
}

function deleteCourse(ss, id) {
  const sheet = ss.getSheetByName('Courses');
  if (!sheet) return { success: false };
  const dataRange = sheet.getDataRange().getValues();
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

// =============================================================
// PROGRESS OPERATIONS
// =============================================================

function saveProgressRow(ss, data) {
  const sheet = ss.getSheetByName('Progress');
  if (!sheet) return { success: false };
  const dataRange = sheet.getDataRange().getValues();
  const email = (data.email || '').trim().toLowerCase();
  const courseId = (data.courseId || '').toString().trim();
  const moduleIdx = (data.moduleIdx !== undefined ? data.moduleIdx : '').toString().trim();
  const completed = data.completed ? 'TRUE' : 'FALSE';
  const today = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  let rowIdx = -1;
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0].toString().trim().toLowerCase() === email &&
        dataRange[i][1].toString().trim() === courseId &&
        dataRange[i][2].toString().trim() === moduleIdx) {
      rowIdx = i + 1;
      break;
    }
  }

  const rowValues = [email, courseId, moduleIdx, completed, today];
  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return { success: true };
}

function getProgressRows(ss, email) {
  const sheet = ss.getSheetByName('Progress');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const progress = [];
  const searchEmail = (email || '').trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim().toLowerCase() === searchEmail) {
      progress.push({
        courseId: data[i][1].toString().trim(),
        moduleIdx: parseInt(data[i][2]) || 0,
        completed: data[i][3].toString().trim().toUpperCase() === 'TRUE',
        timestamp: data[i][4] ? data[i][4].toString() : ''
      });
    }
  }
  return progress;
}

// =============================================================
// LESSON OPERATIONS
// =============================================================

function getLessons(ss) {
  const sheet = ss.getSheetByName('Lessons');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const lessons = [];
  for (let i = 1; i < data.length; i++) {
    lessons.push({
      courseid: data[i][0].toString(),
      moduleidx: parseInt(data[i][1]) || 0,
      title: data[i][2].toString(),
      videourl: data[i][3].toString(),
      notestext: data[i][4].toString(),
      resourceslinks: data[i][5].toString(),
      quizurl: data[i][6].toString()
    });
  }
  return lessons;
}

function saveLesson(ss, data) {
  const sheet = ss.getSheetByName('Lessons');
  if (!sheet) return { success: false };
  const dataRange = sheet.getDataRange().getValues();
  const courseId = (data.courseId || '').toString().trim();
  const moduleIdx = (data.moduleIdx !== undefined ? data.moduleIdx : '').toString().trim();

  let rowIdx = -1;
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0].toString().trim() === courseId &&
        dataRange[i][1].toString().trim() === moduleIdx) {
      rowIdx = i + 1;
      break;
    }
  }

  const rowValues = [
    courseId,
    moduleIdx,
    data.title || '',
    data.videourl || '',
    data.notestext || '',
    data.resourceslinks || '',
    data.quizurl || ''
  ];

  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return { success: true };
}

// =============================================================
// QUIZ OPERATIONS
// =============================================================

function getQuizzes(ss) {
  const sheet = ss.getSheetByName('Quizzes');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const quizzes = [];
  for (let i = 1; i < data.length; i++) {
    quizzes.push({
      courseid: data[i][0].toString().trim(),
      moduleidx: parseInt(data[i][1]) || 0,
      questionidx: parseInt(data[i][2]) || 0,
      q: data[i][3].toString(),
      opts: [
        data[i][4].toString(),
        data[i][5].toString(),
        data[i][6].toString(),
        data[i][7].toString()
      ],
      a: parseInt(data[i][8]) || 0
    });
  }
  return quizzes;
}

function saveQuizScore(ss, data) {
  const sheet = ss.getSheetByName('QuizScores');
  if (!sheet) return { success: false };
  const dataRange = sheet.getDataRange().getValues();
  const email = (data.email || '').trim().toLowerCase();
  const courseId = (data.courseId || '').toString().trim();
  const moduleIdx = (data.moduleIdx !== undefined ? data.moduleIdx : '').toString().trim();
  const today = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  let rowIdx = -1;
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0].toString().trim().toLowerCase() === email &&
        dataRange[i][1].toString().trim() === courseId &&
        dataRange[i][2].toString().trim() === moduleIdx) {
      rowIdx = i + 1;
      break;
    }
  }

  const rowValues = [email, courseId, moduleIdx, data.score || 0, data.total || 5, data.percent || 0, today];
  if (rowIdx !== -1) {
    sheet.getRange(rowIdx, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return { success: true };
}

function getQuizScores(ss, email) {
  const sheet = ss.getSheetByName('QuizScores');
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const scores = {};
  const searchEmail = (email || '').trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim().toLowerCase() === searchEmail) {
      const moduleIdx = parseInt(data[i][2]) || 0;
      scores[moduleIdx] = {
        score: parseInt(data[i][3]) || 0,
        total: parseInt(data[i][4]) || 5,
        percent: parseInt(data[i][5]) || 0,
        date: data[i][6] ? data[i][6].toString() : ''
      };
    }
  }
  return scores;
}

function saveQuizzes(ss, data) {
  const sheet = ss.getSheetByName('Quizzes');
  if (!sheet) return { success: false };
  
  const courseId = (data.courseId || '').toString().trim();
  const moduleIdx = (data.moduleIdx !== undefined ? data.moduleIdx : '').toString().trim();
  
  // Remove existing questions for this course & module to prevent duplication
  const dataRange = sheet.getDataRange().getValues();
  for (let i = dataRange.length - 1; i >= 1; i--) {
    if (dataRange[i][0].toString().trim() === courseId &&
        dataRange[i][1].toString().trim() === moduleIdx) {
      sheet.deleteRow(i + 1);
    }
  }
  
  const questions = data.questions || [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const opts = q.opts || ['', '', '', ''];
    sheet.appendRow([
      courseId,
      moduleIdx,
      i, // questionIdx
      q.q || '',
      opts[0] || '',
      opts[1] || '',
      opts[2] || '',
      opts[3] || '',
      q.a !== undefined ? q.a : 0
    ]);
  }
  return { success: true };
}

// =============================================================
// RESPONSE HELPER
// =============================================================

function createResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

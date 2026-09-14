import { useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import { getAdminFirebase } from './firebase'

type Notice = { kind: 'success' | 'error'; message: string } | null

type CourseRelease = {
  releaseId: string
  courseId: string
  title: string
  summary: string
  description: string
  level: string
  language: string
  estimatedMinutes: number
  version: number
}

type LessonRelease = {
  releaseId: string
  lessonId: string
  courseId: string
  title: string
  summary: string
  durationMinutes: number
  order: number
  version: number
}

type CourseVersion = {
  versionId: string
  courseId: string
  courseVersion: number
}

type ActiveCourse = CourseVersion & {
  courseTitle: string
  lessonCount: number
  assessmentType: 'practice-only' | 'project'
}

function safeString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) ? value : 0
}

function asCourseRelease(data: Record<string, unknown>): CourseRelease {
  return {
    releaseId: safeString(data.releaseId),
    courseId: safeString(data.courseId),
    title: safeString(data.title),
    summary: safeString(data.summary),
    description: safeString(data.description),
    level: safeString(data.level),
    language: safeString(data.language),
    estimatedMinutes: safeNumber(data.estimatedMinutes),
    version: safeNumber(data.version),
  }
}

function asLessonRelease(data: Record<string, unknown>): LessonRelease {
  return {
    releaseId: safeString(data.releaseId),
    lessonId: safeString(data.lessonId),
    courseId: safeString(data.courseId),
    title: safeString(data.title),
    summary: safeString(data.summary),
    durationMinutes: safeNumber(data.durationMinutes),
    order: safeNumber(data.order),
    version: safeNumber(data.version),
  }
}

function asCourseVersion(id: string, data: Record<string, unknown>): CourseVersion {
  return {
    versionId: id,
    courseId: safeString(data.courseId),
    courseVersion: safeNumber(data.courseVersion),
  }
}

function asActiveCourse(id: string, data: Record<string, unknown>): ActiveCourse {
  const assessmentType = data.assessmentType === 'project' ? 'project' : 'practice-only'
  return {
    versionId: safeString(data.versionId),
    courseId: id,
    courseVersion: safeNumber(data.courseVersion),
    courseTitle: safeString(data.courseTitle),
    lessonCount: safeNumber(data.lessonCount),
    assessmentType,
  }
}

function identifier(prefix: string, courseId: string, version: number) {
  const random = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${courseId}-v${version}-${random}`.slice(0, 180)
}

export default function CourseActivationManager({ user }: { user: User }) {
  const [courseReleases, setCourseReleases] = useState<CourseRelease[]>([])
  const [lessonReleases, setLessonReleases] = useState<LessonRelease[]>([])
  const [courseVersions, setCourseVersions] = useState<CourseVersion[]>([])
  const [activeCourses, setActiveCourses] = useState<ActiveCourse[]>([])
  const [courseId, setCourseId] = useState('')
  const [releaseVersion, setReleaseVersion] = useState('')
  const [assessmentType, setAssessmentType] = useState<'practice-only' | 'project'>('practice-only')
  const [assessmentVersion, setAssessmentVersion] = useState('1')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  useEffect(() => {
    let active = true
    const stops: Array<() => void> = []
    void getAdminFirebase().then((services) => {
      if (!active || !services) return
      const { collection, onSnapshot } = services.firestoreSdk
      stops.push(onSnapshot(collection(services.db, 'courseReleases'), (snapshot) => {
        if (!active) return
        setCourseReleases(snapshot.docs.map((item) => asCourseRelease(item.data())))
        setLoading(false)
      }, () => { if (active) { setNotice({ kind: 'error', message: 'Course releases could not be loaded.' }); setLoading(false) } }))
      stops.push(onSnapshot(collection(services.db, 'lessonReleases'), (snapshot) => {
        if (active) setLessonReleases(snapshot.docs.map((item) => asLessonRelease(item.data())))
      }, () => { if (active) setNotice({ kind: 'error', message: 'Lesson releases could not be loaded.' }) }))
      stops.push(onSnapshot(collection(services.db, 'courseVersions'), (snapshot) => {
        if (active) setCourseVersions(snapshot.docs.map((item) => asCourseVersion(item.id, item.data())))
      }, () => { if (active) setNotice({ kind: 'error', message: 'Course versions could not be loaded.' }) }))
      stops.push(onSnapshot(collection(services.db, 'activeCourses'), (snapshot) => {
        if (active) setActiveCourses(snapshot.docs.map((item) => asActiveCourse(item.id, item.data())))
      }, () => { if (active) setNotice({ kind: 'error', message: 'Active courses could not be loaded.' }) }))
    }).catch(() => {
      if (active) {
        setNotice({ kind: 'error', message: 'Firebase could not start for course activation.' })
        setLoading(false)
      }
    })
    return () => { active = false; stops.forEach((stop) => stop()) }
  }, [])

  const courseOptions = useMemo(() => {
    const latestTitles = new Map<string, string>()
    for (const release of [...courseReleases].sort((left, right) => left.version - right.version)) latestTitles.set(release.courseId, release.title)
    return [...latestTitles].map(([id, title]) => ({ id, title })).sort((left, right) => left.title.localeCompare(right.title))
  }, [courseReleases])

  const versionOptions = useMemo(() => [...new Set(courseReleases
    .filter((release) => release.courseId === courseId)
    .map((release) => release.version))].sort((left, right) => right - left), [courseReleases, courseId])
  const selectedVersion = Number(releaseVersion)
  const selectedCourse = courseReleases.find((release) => release.courseId === courseId && release.version === selectedVersion)
  const selectedLessons = lessonReleases
    .filter((release) => release.courseId === courseId && release.version === selectedVersion)
    .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
  const lessonIds = selectedLessons.map((lesson) => lesson.lessonId)
  const versionId = courseId && Number.isInteger(selectedVersion) ? `${courseId}--v${selectedVersion}` : ''
  const existingVersion = courseVersions.find((version) => version.versionId === versionId)
  const currentActive = activeCourses.find((course) => course.courseId === courseId)
  const assessmentNumber = Number(assessmentVersion)
  const uniqueLessons = new Set(lessonIds).size === lessonIds.length
  const uniqueOrders = new Set(selectedLessons.map((lesson) => lesson.order)).size === selectedLessons.length
  const contiguousOrders = selectedLessons.every((lesson, index) => lesson.order === index + 1)
  const releaseReady = Boolean(
    selectedCourse
    && selectedVersion >= 1
    && selectedLessons.length >= 1
    && selectedLessons.length <= 12
    && uniqueLessons
    && uniqueOrders
    && contiguousOrders
    && Number.isInteger(assessmentNumber)
    && assessmentNumber >= 1
    && assessmentNumber <= 10000
    && !existingVersion
  )

  function chooseCourse(value: string) {
    setCourseId(value)
    setReleaseVersion('')
    setConfirmed(false)
    setNotice(null)
  }

  function chooseVersion(value: string) {
    setReleaseVersion(value)
    setAssessmentVersion(value || '1')
    setConfirmed(false)
    setNotice(null)
  }

  async function activate() {
    if (!selectedCourse || !releaseReady || !confirmed) return
    setBusy(true)
    setNotice(null)
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      const { collection, doc, serverTimestamp, writeBatch } = services.firestoreSdk
      const auditId = identifier('audit-activate', courseId, selectedVersion)
      const batch = writeBatch(services.db)
      batch.set(doc(collection(services.db, 'courseVersions'), versionId), {
        versionId,
        courseId,
        courseTitle: selectedCourse.title,
        courseVersion: selectedVersion,
        assessmentVersion: assessmentNumber,
        assessmentType,
        lessonIds,
        publishedAt: serverTimestamp(),
        publishedBy: user.uid,
        auditId,
      })
      batch.set(doc(collection(services.db, 'activeCourses'), courseId), {
        courseId,
        versionId,
        courseVersion: selectedVersion,
        courseTitle: selectedCourse.title,
        lessonCount: lessonIds.length,
        assessmentVersion: assessmentNumber,
        assessmentType,
        activatedAt: serverTimestamp(),
        activatedBy: user.uid,
        auditId,
      })
      batch.set(doc(collection(services.db, 'publicCourseCatalog'), courseId), {
        courseId,
        versionId,
        courseReleaseId: selectedCourse.releaseId,
        courseVersion: selectedVersion,
        courseTitle: selectedCourse.title,
        courseDescription: selectedCourse.summary || selectedCourse.description,
        level: selectedCourse.level,
        language: selectedCourse.language,
        estimatedMinutes: selectedCourse.estimatedMinutes,
        lessonCount: lessonIds.length,
        assessmentVersion: assessmentNumber,
        assessmentType,
        lessonOutlines: selectedLessons.map((lesson) => ({
          lessonId: lesson.lessonId,
          title: lesson.title,
          summary: lesson.summary,
          order: lesson.order,
          durationMinutes: lesson.durationMinutes,
        })),
        publishedAt: serverTimestamp(),
      })
      batch.set(doc(collection(services.db, 'adminAudit'), auditId), {
        eventId: auditId,
        action: 'course.version.activated',
        entityType: 'courseVersion',
        entityId: courseId,
        actorUid: user.uid,
        revision: selectedVersion,
        releaseId: versionId,
        createdAt: serverTimestamp(),
      })
      await batch.commit()
      setConfirmed(false)
      setNotice({ kind: 'success', message: `${selectedCourse.title} version ${selectedVersion} is now publicly discoverable and active for new learners.` })
    } catch {
      setNotice({ kind: 'error', message: 'Activation failed safely. No course version, public catalog entry, active pointer, or audit event was partially written.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="activation-workspace">
      <header className="workspace-title">
        <div><p className="eyebrow">Final publishing step</p><h1>Publish course</h1><p>Choose the approved course and lessons that should appear together for learners.</p></div>
        <span className="security-badge">Atomic and audited</span>
      </header>

      {notice && <div className={`notice notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.message}</div>}

      <div className="activation-grid">
        <section className="activation-form">
          <p className="eyebrow">Choose content</p>
          <h2>What should learners see?</h2>
          <p>Course and lesson release numbers must match. Lessons must use unique, continuous order numbers starting at 1.</p>
          <label>Course<select value={courseId} onChange={(event) => chooseCourse(event.target.value)} disabled={loading || busy}><option value="">Choose a published course</option>{courseOptions.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <label>Published version<select value={releaseVersion} onChange={(event) => chooseVersion(event.target.value)} disabled={!courseId || busy}><option value="">Choose a matching version</option>{versionOptions.map((version) => <option key={version} value={version}>Version {version}</option>)}</select></label>
          <div className="field-grid">
            <label>Completion path<select value={assessmentType} onChange={(event) => { const next = event.target.value as 'practice-only' | 'project'; setAssessmentType(next); if (next === 'practice-only') setAssessmentVersion('1'); setConfirmed(false) }} disabled={busy}><option value="practice-only">Lessons + practice · no certificate</option><option value="project">Lessons + reviewed final project</option></select></label>
            <label>{assessmentType === 'project' ? 'Project instructions version' : 'Assessment version'}<input type="number" min={1} max={10000} step={1} value={assessmentVersion} onChange={(event) => { setAssessmentVersion(event.target.value); setConfirmed(false) }} disabled={busy || assessmentType === 'practice-only'} /></label>
          </div>
          <div className="assessment-choice-note"><strong>{assessmentType === 'project' ? 'Certificate pathway' : 'Learning-only pathway'}</strong><p>{assessmentType === 'project' ? 'After every lesson, the learner submits one project for human review. Approval, a learner certificate request, and administrator issuance are all required.' : 'The learner completes lessons and browser-only practice. This version has no final submission, review, or certificate.'}</p></div>
        </section>

        <section className="activation-checks" aria-live="polite">
          <p className="eyebrow">Automatic check</p>
          <h2>{selectedCourse?.title ?? 'Choose a course and version'}</h2>
          <ul>
            <li className={selectedCourse ? 'ready' : ''}><span>{selectedCourse ? '✓' : '—'}</span>Course is published</li>
            <li className={selectedLessons.length >= 1 && selectedLessons.length <= 12 ? 'ready' : ''}><span>{selectedLessons.length >= 1 && selectedLessons.length <= 12 ? '✓' : '—'}</span>{selectedLessons.length} matching lesson release{selectedLessons.length === 1 ? '' : 's'} (1–12 required)</li>
            <li className={uniqueLessons && uniqueOrders && contiguousOrders && selectedLessons.length > 0 ? 'ready' : ''}><span>{uniqueLessons && uniqueOrders && contiguousOrders && selectedLessons.length > 0 ? '✓' : '—'}</span>Unique lessons in continuous order</li>
            <li className={!existingVersion && versionId ? 'ready' : ''}><span>{!existingVersion && versionId ? '✓' : '—'}</span>{existingVersion ? 'This version is already online' : 'Ready for a new public version'}</li>
          </ul>
          {selectedLessons.length > 0 && <ol className="activation-lessons">{selectedLessons.map((lesson) => <li key={lesson.lessonId}><span>{lesson.order}</span><div><strong>{lesson.title}</strong><small>{lesson.lessonId}</small></div></li>)}</ol>}
        </section>

        <aside className="activation-action">
          <p className="eyebrow">Publish</p>
          <h2>{currentActive ? `Currently active: version ${currentActive.courseVersion}` : 'No active version yet'}</h2>
          {currentActive && <p>{currentActive.courseTitle} · {currentActive.lessonCount} lessons · {currentActive.assessmentType === 'project' ? 'Final project' : 'Practice only'}</p>}
          <div className="activation-boundary"><strong>What publishing changes</strong><p>Visitors can see the course title and lesson outline. Only verified learners can open full lessons. Learners who already started keep their original version.</p></div>
          <label className="confirm-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={!releaseReady || busy} />I checked the course, every lesson, their order, the public outline, and what this completion path allows learners to do.</label>
          <button className="publish-action" type="button" disabled={!releaseReady || !confirmed || busy} onClick={() => void activate()}>{busy ? 'Publishing…' : 'Publish course'}</button>
          <small>The course and its public outline are saved together. If anything fails, nothing changes.</small>
        </aside>
      </div>
    </section>
  )
}

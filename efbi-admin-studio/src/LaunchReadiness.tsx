import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAdminFirebase } from './firebase'

type StoredRecord = { id: string; data: Record<string, unknown> }
type Inventory = Record<string, StoredRecord[]>

const collectionNames = [
  'programDrafts', 'publishedPrograms', 'courseDrafts', 'courseReleases', 'lessonDrafts',
  'lessonReleases', 'courseVersions', 'activeCourses', 'blogDrafts', 'publishedPosts',
] as const

const manualChecks = [
  ['Responsive pages', 'Test every public route on phone, tablet, and desktop.'],
  ['Keyboard & screen reader', 'Check focus order, visible focus, labels, headings, and useful announcements.'],
  ['Slow or interrupted use', 'Test failed videos, slow connections, interrupted saves, and recovery after restart.'],
  ['Account journeys', 'Test join, verification, sign-in, password reset, sign-out, and deletion from a clean account.'],
  ['Firebase operations', 'Review App Check metrics, authorized domains, operator roles, quotas, and recovery access.'],
  ['Security review', 'Run the final rules suite, browser checks, synthetic lifecycle, and controlled external review.'],
] as const

function text(value: unknown) { return typeof value === 'string' ? value : '' }
function number(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : 0 }
function unfinished(records: StoredRecord[]) { return records.filter((record) => ['draft', 'ready', 'unpublished'].includes(text(record.data.status))).length }

function collectStrings(value: unknown, path = '', results: Array<{ path: string; value: string }> = []) {
  if (typeof value === 'string') results.push({ path, value })
  else if (Array.isArray(value)) value.forEach((item, index) => collectStrings(item, `${path}[${index}]`, results))
  else if (value && typeof value === 'object') Object.entries(value as Record<string, unknown>).forEach(([key, item]) => collectStrings(item, path ? `${path}.${key}` : key, results))
  return results
}

export default function LaunchReadiness() {
  const [inventory, setInventory] = useState<Inventory>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true); setMessage('')
    try {
      const services = await getAdminFirebase()
      if (!services) throw new Error('Firebase configuration is missing.')
      const snapshots = await Promise.all(collectionNames.map((name) => services.firestoreSdk.getDocs(services.firestoreSdk.collection(services.db, name))))
      setInventory(Object.fromEntries(snapshots.map((snapshot, index) => [collectionNames[index], snapshot.docs.map((item) => ({ id: item.id, data: item.data() }))])))
    } catch {
      setMessage('The protected content inventory could not be loaded. Check the session and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const analysis = useMemo(() => {
    const records = (name: string) => inventory[name] ?? []
    const activeCourses = records('activeCourses')
    const versions = new Map(records('courseVersions').map((record) => [record.id, record.data]))
    const courseReleases = records('courseReleases')
    const lessonReleases = records('lessonReleases')
    const issues: string[] = []
    const activeSources: StoredRecord[] = [...records('publishedPrograms'), ...records('publishedPosts')]
    let referencedLessons = 0

    for (const active of activeCourses) {
      const courseId = text(active.data.courseId) || active.id
      const versionId = text(active.data.versionId)
      const courseVersion = number(active.data.courseVersion)
      const version = versions.get(versionId)
      if (!version) { issues.push(`${courseId}: active version ${versionId || 'is missing'}.`); continue }
      activeSources.push({ id: versionId, data: version })
      const lessonIds = Array.isArray(version.lessonIds) ? version.lessonIds.filter((item): item is string => typeof item === 'string') : []
      referencedLessons += lessonIds.length
      if (text(version.courseId) !== courseId || number(version.courseVersion) !== courseVersion) issues.push(`${courseId}: the active pointer does not match its immutable course version.`)
      const release = courseReleases.find((item) => text(item.data.courseId) === courseId && number(item.data.version) === courseVersion)
      if (!release) issues.push(`${courseId}: course release ${courseVersion} is missing.`)
      else activeSources.push(release)
      if (number(active.data.lessonCount) !== lessonIds.length || lessonIds.length === 0) issues.push(`${courseId}: lesson count does not match the activated version.`)
      for (const lessonId of lessonIds) {
        const lesson = lessonReleases.find((item) => text(item.data.courseId) === courseId && number(item.data.version) === courseVersion && text(item.data.lessonId) === lessonId)
        if (!lesson) issues.push(`${courseId}: lesson release ${lessonId} is missing for version ${courseVersion}.`)
        else activeSources.push(lesson)
      }
    }

    const placeholderPattern = /\b(?:lorem ipsum|todo|tbd|placeholder|coming soon|demo learner)\b|example\.com/i
    const placeholderHits = activeSources.flatMap((record) => collectStrings(record.data).filter((entry) => placeholderPattern.test(entry.value)).map((entry) => `${record.id} · ${entry.path}`))
    return {
      activeCourses: activeCourses.length,
      publishedPrograms: records('publishedPrograms').length,
      publishedPosts: records('publishedPosts').length,
      referencedLessons,
      issues,
      placeholderHits: [...new Set(placeholderHits)],
      unfinishedDrafts: unfinished(records('programDrafts')) + unfinished(records('courseDrafts')) + unfinished(records('lessonDrafts')) + unfinished(records('blogDrafts')),
    }
  }, [inventory])

  const contentBlocked = !loading && (analysis.publishedPrograms === 0 || analysis.activeCourses === 0 || analysis.publishedPosts === 0 || analysis.issues.length > 0 || analysis.placeholderHits.length > 0)
  const cards = [
    ['Public programs', analysis.publishedPrograms, analysis.publishedPrograms > 0 ? 'ready' : 'blocked', 'At least one reviewed program must be public.'],
    ['Active courses', analysis.activeCourses, analysis.activeCourses > 0 && analysis.issues.length === 0 ? 'ready' : 'blocked', 'Every active pointer must match an immutable course and lesson set.'],
    ['Referenced lessons', analysis.referencedLessons, analysis.referencedLessons > 0 && analysis.issues.length === 0 ? 'ready' : 'blocked', 'Only lesson releases bound to active versions are counted.'],
    ['Public articles', analysis.publishedPosts, analysis.publishedPosts > 0 ? 'ready' : 'blocked', 'Launch with reviewed material or remove the Blog promise.'],
    ['Placeholder matches', analysis.placeholderHits.length, analysis.placeholderHits.length === 0 ? 'ready' : 'blocked', 'Matches require a human check before launch.'],
    ['Unfinished drafts', analysis.unfinishedDrafts, 'information', 'Private drafts are safe, but they are not launch content.'],
  ] as const

  return <section className="launch-readiness-workspace">
    <header className="workspace-title"><div><p className="eyebrow">Phase 27 · Launch quality</p><h1>Launch content readiness</h1><p>See what is truly public or active, catch broken release links, and keep manual launch checks visible.</p></div><button className="primary-action" type="button" disabled={loading} onClick={() => void refresh()}>{loading ? 'Checking…' : 'Refresh inventory'}</button></header>
    {message && <div className="notice notice--error" role="alert">{message}</div>}
    <aside className={`launch-readiness-state ${contentBlocked ? 'launch-readiness-state--blocked' : ''}`}><div><strong>{loading ? 'Checking protected content…' : contentBlocked ? 'Content is not ready for launch.' : 'Automated content checks pass.'}</strong><p>Automated checks do not replace device, accessibility, account-flow, operational, or external safeguarding review.</p></div><span>{loading ? 'Checking' : contentBlocked ? 'Blocked' : 'Manual checks remain'}</span></aside>
    <section className="launch-inventory-grid" aria-label="Launch content inventory">{cards.map(([label, value, state, detail]) => <article key={label} className={`launch-inventory-card launch-inventory-card--${state}`}><small>{label}</small><strong>{loading ? '—' : value}</strong><p>{detail}</p><span>{state === 'ready' ? 'Ready' : state === 'blocked' ? 'Needs attention' : 'Information'}</span></article>)}</section>
    {(analysis.issues.length > 0 || analysis.placeholderHits.length > 0) && <section className="launch-findings"><div><p className="eyebrow">Automated findings</p><h2>Review these exact records.</h2></div>{analysis.issues.length > 0 && <article><strong>Release integrity</strong><ul>{analysis.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></article>}{analysis.placeholderHits.length > 0 && <article><strong>Possible placeholder text</strong><ul>{analysis.placeholderHits.map((hit) => <li key={hit}>{hit}</li>)}</ul></article>}</section>}
    <section className="manual-launch-checks"><div className="section-heading"><div><p className="eyebrow">Human verification</p><h2>These checks cannot be guessed by software.</h2></div><p>Complete them against the exact release candidate. Record evidence outside this page before approval.</p></div><div>{manualChecks.map(([title, detail], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{detail}</p></div><small>Open</small></article>)}</div></section>
    <aside className="safety-boundary"><strong>Read-only boundary</strong><p>This page reads protected and public content but never publishes, activates, edits, or deletes it. Passing automated checks is not permission to deploy or open enrollment.</p></aside>
  </section>
}

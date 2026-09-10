import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './auth-context'
import { curriculum } from './data'
import { Icon } from './icons'
import { completeLesson, readCourseProgress, type CourseProgress } from './lib/progress'
import './learning.css'

const courseId = 'ai-foundations'
const lowBandwidthPreference = 'efbi-low-bandwidth'
const initialProgress: CourseProgress = { completedLessonIds: [], lastLessonId: '', percent: 0 }
const availableLessonIds = [curriculum[0].slug]

function readLowBandwidthPreference() {
  try {
    return window.localStorage.getItem(lowBandwidthPreference) === 'true'
  } catch {
    return false
  }
}

function saveLowBandwidthPreference(enabled: boolean) {
  try {
    window.localStorage.setItem(lowBandwidthPreference, String(enabled))
  } catch {
    // The lesson still works when browser privacy settings block local storage.
  }
}

function getYouTubeVideoId() {
  const value = import.meta.env.VITE_AI_LESSON_01_YOUTUBE_ID?.trim() ?? ''
  return /^[A-Za-z0-9_-]{11}$/.test(value) ? value : ''
}

function progressErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  if (code.includes('unavailable') || code.includes('network')) return 'Your progress could not reach EFBI. Check your connection and try again.'
  if (code.includes('permission-denied')) return 'Your session cannot update progress. Sign out, sign in again, and retry.'
  return 'Your progress could not be updated. Please try again.'
}

export function LearningPage() {
  const { user } = useAuth()
  const [lowBandwidth, setLowBandwidth] = useState(readLowBandwidthPreference)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [progress, setProgress] = useState<CourseProgress>(initialProgress)
  const [progressState, setProgressState] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading')
  const [progressError, setProgressError] = useState('')
  const lesson = curriculum[0]
  const lessonComplete = progress.completedLessonIds.includes(lesson.slug)
  const videoId = getYouTubeVideoId()

  useEffect(() => {
    if (!user) return undefined
    let active = true

    void readCourseProgress({ uid: user.uid, courseId, allowedLessonIds: availableLessonIds, totalLessonCount: curriculum.length })
      .then((savedProgress) => {
        if (!active) return
        setProgress(savedProgress)
        setProgressState('ready')
      })
      .catch((error: unknown) => {
        if (!active) return
        setProgressError(progressErrorMessage(error))
        setProgressState('error')
      })

    return () => { active = false }
  }, [user])

  function updateLowBandwidth(enabled: boolean) {
    saveLowBandwidthPreference(enabled)
    setLowBandwidth(enabled)
    if (enabled) setVideoLoaded(false)
  }

  async function markLessonComplete() {
    if (!user || lessonComplete || progressState === 'saving') return
    setProgressError('')
    setProgressState('saving')

    try {
      const savedProgress = await completeLesson({
        uid: user.uid,
        courseId,
        lessonId: lesson.slug,
        allowedLessonIds: availableLessonIds,
        totalLessonCount: curriculum.length,
      })
      setProgress(savedProgress)
      setProgressState('ready')
    } catch (error) {
      setProgressError(progressErrorMessage(error))
      setProgressState('error')
    }
  }

  function retryProgress() {
    if (!user) return
    setProgressError('')
    setProgressState('loading')
    void readCourseProgress({ uid: user.uid, courseId, allowedLessonIds: availableLessonIds, totalLessonCount: curriculum.length })
      .then((savedProgress) => {
        setProgress(savedProgress)
        setProgressState('ready')
      })
      .catch((error: unknown) => {
        setProgressError(progressErrorMessage(error))
        setProgressState('error')
      })
  }

  return (
    <section className="learning-page">
      <div className="learning-topbar">
        <div className="shell learning-topbar-inner">
          <Link to="/courses/ai-foundations">← Course outline</Link>
          <span>Lesson 1 of {curriculum.length}</span>
        </div>
      </div>

      <div className="shell learning-header">
        <div>
          <p className="eyebrow-label">AI Foundations for Ethiopia</p>
          <h1>Welcome, {user?.displayName?.split(' ')[0] || 'learner'}.</h1>
          <p>Start with a simple question: what is AI, and when should you trust it?</p>
        </div>
        <div className="learning-progress" aria-label={`Course progress: ${progress.percent} percent`}>
          <strong>{progressState === 'loading' ? '—' : `${progress.percent}%`}</strong>
          <span>{lessonComplete ? '1 of 4 lessons complete' : progressState === 'loading' ? 'Checking saved progress' : 'Your course progress'}</span>
          <div className="learning-progress-track" aria-hidden="true"><i style={{ width: `${progress.percent}%` }} /></div>
        </div>
      </div>

      <div className="section shell lesson-layout">
        <main className="lesson-main">
          <header className="lesson-heading">
            <div className="lesson-number">01</div>
            <div>
              <p>{lesson.duration} · Beginner</p>
              <h2>{lesson.title}</h2>
              <p>{lesson.detail}</p>
            </div>
          </header>

          <section className="lesson-objectives" aria-labelledby="lesson-objectives-title">
            <p className="eyebrow-label">In this lesson</p>
            <h3 id="lesson-objectives-title">You will learn to</h3>
            <ul>
              {lesson.objectives.map((objective) => <li key={objective}><Icon name="check" /> {objective}</li>)}
            </ul>
          </section>

          <section className="lesson-media" aria-labelledby="video-title">
            <div className="lesson-media-header">
              <div><p className="eyebrow-label">Watch</p><h3 id="video-title">Lesson video</h3></div>
              <span>{lesson.duration}</span>
            </div>

            {videoId && videoLoaded && !lowBandwidth ? (
              <div className="video-frame">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                  title={`${lesson.title} — EFBI Academy lesson video`}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="video-gate">
                <span className="video-gate-icon"><Icon name="play" /></span>
                {videoId ? (
                  lowBandwidth ? <><h3>Video is off in low-bandwidth mode.</h3><p>The full written lesson is available below and uses much less data.</p></> : <><h3>Load the video when you are ready.</h3><p>YouTube will receive connection data only after you choose to load it.</p><button className="button button--light" type="button" onClick={() => setVideoLoaded(true)}>Load video <Icon name="play" /></button></>
                ) : (
                  <><h3>The video is being prepared.</h3><p>You can complete the full written lesson below today.</p></>
                )}
              </div>
            )}

            <label className="bandwidth-control">
              <input type="checkbox" checked={lowBandwidth} onChange={(event) => updateLowBandwidth(event.target.checked)} />
              <span><strong>Low-bandwidth mode</strong><small>Keep video off and use the written lesson.</small></span>
            </label>
          </section>

          <article className="written-lesson" aria-labelledby="written-lesson-title">
            <div className="written-lesson-intro">
              <p className="eyebrow-label">Read</p>
              <h2 id="written-lesson-title">Written lesson and transcript</h2>
              <p>This covers the same ideas as the lesson video, so you can learn without streaming.</p>
            </div>
            {lesson.sections.map((section) => (
              <section key={section.heading}>
                <h3>{section.heading}</h3>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
            <div className="lesson-takeaway">
              <Icon name="spark" />
              <div><strong>Remember</strong><p>AI can help you work, but you are responsible for checking the result and protecting private information.</p></div>
            </div>
          </article>

          <section className={lessonComplete ? 'lesson-completion is-complete' : 'lesson-completion'} aria-labelledby="lesson-completion-title">
            <span className="lesson-completion-icon"><Icon name={lessonComplete ? 'check' : 'book'} /></span>
            <div>
              <p className="eyebrow-label">Your progress</p>
              <h2 id="lesson-completion-title">{lessonComplete ? 'Lesson completed.' : 'Finished reading?'}</h2>
              <p>{lessonComplete ? 'This completion is saved to your EFBI account.' : 'Mark the lesson complete only after you understand the main ideas. EFBI will save it to your account.'}</p>
              {progressError && <p className="form-status form-status--error" role="alert">{progressError}</p>}
            </div>
            {progressState === 'error' ? (
              <button className="button button--outline" type="button" onClick={retryProgress}>Retry progress</button>
            ) : (
              <button className="button button--primary" type="button" disabled={lessonComplete || progressState !== 'ready'} onClick={() => void markLessonComplete()}>
                {lessonComplete ? 'Completed' : progressState === 'loading' ? 'Checking progress…' : progressState === 'saving' ? 'Saving…' : 'Mark lesson complete'}
              </button>
            )}
          </section>

          <div className="lesson-next">
            <div><p className="eyebrow-label">Up next</p><h2>Prompting with purpose</h2><p>The next lesson is being prepared.</p></div>
            <button className="button button--outline" type="button" disabled>Coming soon</button>
          </div>
        </main>

        <aside className="lesson-sidebar" aria-label="Course lessons">
          <div className="lesson-sidebar-heading"><p className="eyebrow-label">Course outline</p><h2>Four practical lessons</h2></div>
          <ol>
            {curriculum.map((item, index) => (
              <li className={index === 0 ? 'is-current' : ''} key={item.number}>
                <span>{item.number}</span>
                <div><strong>{item.title}</strong><small>{index === 0 ? lessonComplete ? 'Completed' : 'Available now' : 'Coming soon'}</small></div>
                {index === 0 && lessonComplete && <Icon name="check" />}
              </li>
            ))}
          </ol>
          <div className="lesson-privacy"><Icon name="shield" /><div><strong>Your learning is private.</strong><p>This page requires a verified account. Progress is stored only under your user ID.</p></div></div>
        </aside>
      </div>
    </section>
  )
}
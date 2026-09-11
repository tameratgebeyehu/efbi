import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from './auth-context'
import { curriculum, type CourseLesson, type KnowledgeCheckQuestion } from './data'
import { Icon } from './icons'
import { completeLesson, readCourseProgress, type CourseProgress } from './lib/progress'
import './learning.css'

const courseId = 'ai-foundations'
const coursePath = '/learn/ai-foundations'
const publishedLessons = curriculum.slice(0, 3)
const publishedLessonIds = publishedLessons.map((lesson) => lesson.slug)
const lowBandwidthPreference = 'efbi-low-bandwidth'
const initialProgress: CourseProgress = { completedLessonIds: [], lastLessonId: '', percent: 0 }
const lessonTakeaways: Record<string, string> = {
  'understanding-ai': 'AI can help you work, but you are responsible for checking the result and protecting private information.',
  'prompting-with-purpose': 'A useful prompt is clear and specific. A useful learner still checks the answer.',
  'responsible-use': 'Protect people, verify important claims, and keep a responsible person in every high-impact decision.',
}

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

function getYouTubeVideoId(lessonSlug: string) {
  const videoIds: Record<string, string | undefined> = {
    'understanding-ai': import.meta.env.VITE_AI_LESSON_01_YOUTUBE_ID,
    'prompting-with-purpose': import.meta.env.VITE_AI_LESSON_02_YOUTUBE_ID,
    'responsible-use': import.meta.env.VITE_AI_LESSON_03_YOUTUBE_ID,
  }
  const value = videoIds[lessonSlug]?.trim() ?? ''
  return /^[A-Za-z0-9_-]{11}$/.test(value) ? value : ''
}

function progressErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  if (code.includes('unavailable') || code.includes('network')) return 'Your progress could not reach EFBI. Check your connection and try again.'
  if (code.includes('permission-denied')) return 'Your session cannot update progress. Sign out, sign in again, and retry.'
  if (error instanceof Error && error.message.startsWith('Complete the earlier lesson')) return error.message
  return 'Your progress could not be updated. Please try again.'
}

function LessonVideo({ lesson }: { lesson: CourseLesson }) {
  const [lowBandwidth, setLowBandwidth] = useState(readLowBandwidthPreference)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const videoId = getYouTubeVideoId(lesson.slug)

  function updateLowBandwidth(enabled: boolean) {
    saveLowBandwidthPreference(enabled)
    setLowBandwidth(enabled)
    if (enabled) setVideoLoaded(false)
  }

  return (
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
  )
}

function KnowledgeCheck({ questions }: { questions: KnowledgeCheckQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [checked, setChecked] = useState(false)
  const allAnswered = questions.every((question) => answers[question.id] !== undefined)
  const score = questions.filter((question) => answers[question.id] === question.correctOption).length

  function chooseAnswer(questionId: string, optionIndex: number) {
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }))
    setChecked(false)
  }

  function checkAnswers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (allAnswered) setChecked(true)
  }

  return (
    <section className="knowledge-check" aria-labelledby="knowledge-check-title">
      <div className="knowledge-check-heading">
        <p className="eyebrow-label">Practice</p>
        <h2 id="knowledge-check-title">Quick knowledge check</h2>
        <p>Use this to review the lesson. Your answers are checked only in this browser and are not used for certificates.</p>
      </div>
      <form onSubmit={checkAnswers}>
        {questions.map((question, questionIndex) => {
          const selectedAnswer = answers[question.id]
          const correct = selectedAnswer === question.correctOption
          return (
            <fieldset className={checked ? correct ? 'is-correct' : 'is-incorrect' : ''} key={question.id}>
              <legend><span>{String(questionIndex + 1).padStart(2, '0')}</span>{question.prompt}</legend>
              <div className="answer-options">
                {question.options.map((option, optionIndex) => (
                  <label className={checked && optionIndex === question.correctOption ? 'is-answer' : ''} key={option}>
                    <input type="radio" name={question.id} value={optionIndex} checked={selectedAnswer === optionIndex} onChange={() => chooseAnswer(question.id, optionIndex)} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {checked && <p className="answer-feedback"><strong>{correct ? 'Correct.' : 'Review this one.'}</strong> {question.explanation}</p>}
            </fieldset>
          )
        })}
        <div className="knowledge-check-actions">
          <button className="button button--primary" type="submit" disabled={!allAnswered}>{checked ? 'Check again' : 'Check answers'}</button>
          {checked && <p role="status"><strong>{score} of {questions.length}</strong> correct. {score === questions.length ? 'You understood the key ideas.' : 'Change any answer and try again.'}</p>}
        </div>
      </form>
    </section>
  )
}

export function LearningPage() {
  const { lessonSlug } = useParams()
  const { user } = useAuth()
  const requestedLesson = publishedLessons.find((lesson) => lesson.slug === lessonSlug)
  const lesson = requestedLesson ?? publishedLessons[0]
  const lessonIndex = publishedLessons.findIndex((item) => item.slug === lesson.slug)
  const [progress, setProgress] = useState<CourseProgress>(initialProgress)
  const [progressState, setProgressState] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading')
  const [progressError, setProgressError] = useState('')
  const lessonComplete = progress.completedLessonIds.includes(lesson.slug)
  const previousLesson = lessonIndex > 0 ? publishedLessons[lessonIndex - 1] : undefined
  const nextPublishedLesson = publishedLessons[lessonIndex + 1]
  const lessonUnlocked = !previousLesson || progress.completedLessonIds.includes(previousLesson.slug)

  useEffect(() => {
    if (!user) return undefined
    let active = true

    void readCourseProgress({ uid: user.uid, courseId, allowedLessonIds: publishedLessonIds, totalLessonCount: curriculum.length })
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

  async function markLessonComplete() {
    if (!user || lessonComplete || progressState === 'saving') return
    setProgressError('')
    setProgressState('saving')

    try {
      const savedProgress = await completeLesson({
        uid: user.uid,
        courseId,
        lessonId: lesson.slug,
        allowedLessonIds: publishedLessonIds,
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
    void readCourseProgress({ uid: user.uid, courseId, allowedLessonIds: publishedLessonIds, totalLessonCount: curriculum.length })
      .then((savedProgress) => {
        setProgress(savedProgress)
        setProgressState('ready')
      })
      .catch((error: unknown) => {
        setProgressError(progressErrorMessage(error))
        setProgressState('error')
      })
  }

  if (lessonSlug && !requestedLesson) return <Navigate to={`${coursePath}/${publishedLessons[0].slug}`} replace />

  if (!lessonSlug && progressState === 'ready') {
    const resumeLesson = publishedLessons.find((item) => !progress.completedLessonIds.includes(item.slug)) ?? publishedLessons.at(-1)!
    return <Navigate to={`${coursePath}/${resumeLesson.slug}`} replace />
  }

  if (progressState === 'ready' && !lessonUnlocked && previousLesson) {
    return <Navigate to={`${coursePath}/${previousLesson.slug}`} replace />
  }

  const completedCount = progress.completedLessonIds.length
  const upcomingLesson = curriculum[publishedLessons.length]

  return (
    <section className="learning-page">
      <div className="learning-topbar">
        <div className="shell learning-topbar-inner">
          <Link to="/courses/ai-foundations">← Course outline</Link>
          <span>Lesson {lessonIndex + 1} of {curriculum.length}</span>
        </div>
      </div>

      <div className="shell learning-header">
        <div>
          <p className="eyebrow-label">AI Foundations for Ethiopia</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.detail}</p>
        </div>
        <div className="learning-progress" aria-label={`Course progress: ${progress.percent} percent`}>
          <strong>{progressState === 'loading' ? '—' : `${progress.percent}%`}</strong>
          <span>{progressState === 'loading' ? 'Checking saved progress' : `${completedCount} of ${curriculum.length} lessons complete`}</span>
          <div className="learning-progress-track" aria-hidden="true"><i style={{ width: `${progress.percent}%` }} /></div>
        </div>
      </div>

      <div className="section shell lesson-layout">
        <main className="lesson-main">
          <header className="lesson-heading">
            <div className="lesson-number">{lesson.number}</div>
            <div>
              <p>{lesson.duration} · Beginner</p>
              <h2>{lesson.title}</h2>
              <p>{lesson.detail}</p>
            </div>
          </header>

          <section className="lesson-objectives" aria-labelledby="lesson-objectives-title">
            <p className="eyebrow-label">In this lesson</p>
            <h3 id="lesson-objectives-title">You will learn to</h3>
            <ul>{lesson.objectives.map((objective) => <li key={objective}><Icon name="check" /> {objective}</li>)}</ul>
          </section>

          <LessonVideo key={`video-${lesson.slug}`} lesson={lesson} />

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
              <div><strong>Remember</strong><p>{lessonTakeaways[lesson.slug]}</p></div>
            </div>
          </article>

          {lesson.knowledgeCheck.length > 0 && <KnowledgeCheck key={`check-${lesson.slug}`} questions={lesson.knowledgeCheck} />}

          <section className={lessonComplete ? 'lesson-completion is-complete' : 'lesson-completion'} aria-labelledby="lesson-completion-title">
            <span className="lesson-completion-icon"><Icon name={lessonComplete ? 'check' : 'book'} /></span>
            <div>
              <p className="eyebrow-label">Your progress</p>
              <h2 id="lesson-completion-title">{lessonComplete ? 'Lesson completed.' : 'Finished this lesson?'}</h2>
              <p>{lessonComplete ? `This completion is saved to your EFBI account. Your course progress is ${progress.percent}%.` : 'Mark the lesson complete only after you understand the main ideas. EFBI will save it to your account.'}</p>
              {progressError && <p className="form-status form-status--error" role="alert">{progressError}</p>}
            </div>
            {progressState === 'error' ? (
              <button className="button button--outline" type="button" onClick={retryProgress}>Retry progress</button>
            ) : (
              <button className="button button--primary" type="button" disabled={lessonComplete || progressState !== 'ready' || !lessonUnlocked} onClick={() => void markLessonComplete()}>
                {lessonComplete ? 'Completed' : progressState === 'loading' ? 'Checking progress…' : progressState === 'saving' ? 'Saving…' : 'Mark lesson complete'}
              </button>
            )}
          </section>

          <div className="lesson-next">
            {nextPublishedLesson ? (
              <><div><p className="eyebrow-label">Up next</p><h2>{nextPublishedLesson.title}</h2><p>{lessonComplete ? 'Continue when you are ready.' : 'Complete this lesson first.'}</p></div>{lessonComplete ? <Link className="button button--primary" to={`${coursePath}/${nextPublishedLesson.slug}`}>Open Lesson {lessonIndex + 2} <Icon name="arrow" /></Link> : <button className="button button--outline" type="button" disabled>Complete Lesson {lessonIndex + 1} first</button>}</>
            ) : (
              <><div><p className="eyebrow-label">Coming next</p><h2>{upcomingLesson.title}</h2><p>The next lesson is being prepared.</p></div><button className="button button--outline" type="button" disabled>Coming soon</button></>
            )}
          </div>
        </main>

        <aside className="lesson-sidebar" aria-label="Course lessons">
          <div className="lesson-sidebar-heading"><p className="eyebrow-label">Course outline</p><h2>Four practical lessons</h2></div>
          <ol>
            {curriculum.map((item, index) => {
              const published = index < publishedLessons.length
              const unlocked = index === 0 || progress.completedLessonIds.includes(curriculum[index - 1].slug)
              const completed = progress.completedLessonIds.includes(item.slug)
              const current = item.slug === lesson.slug
              return (
                <li className={current ? 'is-current' : ''} key={item.number}>
                  <span>{item.number}</span>
                  <div>
                    {published && unlocked ? <Link aria-current={current ? 'page' : undefined} to={`${coursePath}/${item.slug}`}><strong>{item.title}</strong></Link> : <strong>{item.title}</strong>}
                    <small>{completed ? 'Completed' : published ? unlocked ? 'Available now' : `Complete Lesson ${index} first` : 'Coming soon'}</small>
                  </div>
                  {completed && <Icon name="check" />}
                </li>
              )
            })}
          </ol>
          <div className="lesson-privacy"><Icon name="shield" /><div><strong>Your learning is private.</strong><p>This page requires a verified account. Progress is stored only under your user ID.</p></div></div>
        </aside>
      </div>
    </section>
  )
}
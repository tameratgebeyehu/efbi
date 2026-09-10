import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './auth-context'
import { curriculum } from './data'
import { Icon } from './icons'
import './learning.css'

const lowBandwidthPreference = 'efbi-low-bandwidth'

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

export function LearningPage() {
  const { user } = useAuth()
  const [lowBandwidth, setLowBandwidth] = useState(readLowBandwidthPreference)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const lesson = curriculum[0]
  const videoId = getYouTubeVideoId()

  function updateLowBandwidth(enabled: boolean) {
    saveLowBandwidthPreference(enabled)
    setLowBandwidth(enabled)
    if (enabled) setVideoLoaded(false)
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
        <div className="learning-progress" aria-label="Course progress: zero percent">
          <strong>0%</strong>
          <span>Progress saving comes in Phase 5</span>
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
                <div><strong>{item.title}</strong><small>{index === 0 ? 'Available now' : 'Coming soon'}</small></div>
                {index === 0 && <Icon name="check" />}
              </li>
            ))}
          </ol>
          <div className="lesson-privacy"><Icon name="shield" /><div><strong>Your learning is private.</strong><p>This page requires a verified account. Progress will be stored only under your user ID.</p></div></div>
        </aside>
      </div>
    </section>
  )
}
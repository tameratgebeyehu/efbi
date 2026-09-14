import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BlogContent } from './blogModel'
import { categoryLabel, type CourseContent } from './courseModel'
import type { LessonContent } from './lessonModel'
import type { ProgramContent } from './programModel'

export type OwnerPreviewItem =
  | { kind: 'program'; id: string; content: ProgramContent }
  | { kind: 'course'; id: string; content: CourseContent }
  | { kind: 'lesson'; id: string; content: LessonContent }
  | { kind: 'article'; id: string; content: BlogContent }

function display(value: string, fallback: string) {
  return value.trim() || fallback
}

function TextBlocks({ text, fallback }: { text: string; fallback: string }) {
  const source = text.trim() || fallback
  return <div className="owner-preview-prose">{source.split(/\n{2,}/).map((block, index) => {
    const value = block.trim()
    if (value.startsWith('### ')) return <h3 key={index}>{value.slice(4)}</h3>
    if (value.startsWith('## ')) return <h2 key={index}>{value.slice(3)}</h2>
    const lines = value.split('\n')
    if (lines.every((line) => line.startsWith('- '))) return <ul key={index}>{lines.map((line, lineIndex) => <li key={`${index}-${lineIndex}`}>{line.slice(2)}</li>)}</ul>
    return <p key={index}>{value}</p>
  })}</div>
}

function ProgramPreview({ item }: { item: Extract<OwnerPreviewItem, { kind: 'program' }> }) {
  const { content } = item
  return <section className={`owner-preview-public owner-preview-public--program accent-${content.accent}`}>
    <section className="owner-preview-hero"><span>EFBI program</span><h1>{display(content.title, 'Program title')}</h1><p>{display(content.description, 'The public program description will appear here.')}</p></section>
    <section className="owner-preview-program-card"><div><small>{display(content.shortTitle, 'EFBI')}</small><span>{content.level} · {content.durationWeeks || 0} weeks</span></div><h2>What learners will work toward</h2><p>{display(content.outcome, 'The learner outcome will appear here.')}</p><button type="button" disabled>Explore courses</button></section>
  </section>
}

function CoursePreview({ item }: { item: Extract<OwnerPreviewItem, { kind: 'course' }> }) {
  const { content } = item
  return <section className="owner-preview-public owner-preview-public--course">
    <section className="owner-preview-hero"><span>{categoryLabel(content.category)}</span><h1>{display(content.title, 'Course title')}</h1><p>{display(content.summary, 'A short course summary will appear here.')}</p><div className="owner-preview-meta"><b>{content.level}</b><b>{display(content.language, 'Language')}</b><b>{content.estimatedMinutes || 0} minutes</b></div></section>
    <section className="owner-preview-reading"><span>About this course</span><TextBlocks text={content.description} fallback="The complete course description will appear here." /><button type="button" disabled>Start learning</button></section>
  </section>
}

function LessonPreview({ item }: { item: Extract<OwnerPreviewItem, { kind: 'lesson' }> }) {
  const { content } = item
  const videoId = /^[A-Za-z0-9_-]{11}$/.test(content.videoYoutubeId) ? content.videoYoutubeId : ''
  return <section className="owner-preview-public owner-preview-public--lesson">
    <section className="owner-preview-hero"><span>Lesson {content.order || 0} · {content.durationMinutes || 0} min</span><h1>{display(content.title, 'Lesson title')}</h1><p>{display(content.summary, 'A short lesson summary will appear here.')}</p></section>
    <section className="owner-preview-reading">
      {videoId && <div className="owner-preview-video"><iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&controls=1&disablekb=0&playsinline=1`} title={`Preview video for ${display(content.title, 'this lesson')}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}
      {!videoId && <div className="owner-preview-video owner-preview-video--empty">No video is attached to this lesson.</div>}
      <TextBlocks text={content.bodyMarkdown} fallback="The written lesson will appear here." />
      <section className="owner-preview-checks"><span>Practice checks · {content.questions.length}</span>{content.questions.length === 0 && <p>No practice questions in this lesson.</p>}{content.questions.map((question, index) => <article key={index}><strong>{index + 1}. {display(question.prompt, 'Question prompt')}</strong><ol>{question.options.map((option, optionIndex) => <li key={optionIndex}>{display(option, `Option ${optionIndex + 1}`)}</li>)}</ol><small>Owner answer key: option {question.correctOption + 1} · {display(question.explanation, 'Explanation')}</small></article>)}</section>
    </section>
  </section>
}

function ArticlePreview({ item }: { item: Extract<OwnerPreviewItem, { kind: 'article' }> }) {
  const { content } = item
  return <section className={`owner-preview-public owner-preview-public--article tone-${content.tone}`}>
    <section className="owner-preview-hero"><span>{display(content.category, 'Article')}</span>{content.featured && <b>Featured</b>}<h1>{display(content.title, 'Article title')}</h1><p>{display(content.excerpt, 'The article excerpt will appear here.')}</p><div className="owner-preview-meta"><b>By {display(content.authorName, 'Author')}</b><b>{content.readingMinutes || 0} min read</b></div></section>
    <article className="owner-preview-reading"><TextBlocks text={content.bodyMarkdown} fallback="The full article will appear here." /></article>
  </section>
}

function PreviewContent({ item }: { item: OwnerPreviewItem }) {
  if (item.kind === 'program') return <ProgramPreview item={item} />
  if (item.kind === 'course') return <CoursePreview item={item} />
  if (item.kind === 'lesson') return <LessonPreview item={item} />
  return <ArticlePreview item={item} />
}

function OwnerPreview({ item, issues, onClose }: { item: OwnerPreviewItem; issues: string[]; onClose: () => void }) {
  const [viewport, setViewport] = useState<'desktop' | 'phone'>('desktop')
  const closeButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { onClose(); return }
      if (event.key !== 'Tab') return
      const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), iframe, [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])]
      if (controls.length === 0) return
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); previousFocus?.focus() }
  }, [onClose])

  return <div className="owner-preview-overlay" role="dialog" aria-modal="true" aria-labelledby="owner-preview-title">
    <section ref={dialog} className="owner-preview-dialog">
      <header><div><span>Private owner preview</span><h2 id="owner-preview-title">{item.kind[0].toUpperCase() + item.kind.slice(1)} · {item.id || 'new draft'}</h2><p>Exact current editor values. This preview is local and is not a publication.</p></div><div className="owner-preview-actions" aria-label="Preview size"><button type="button" aria-pressed={viewport === 'desktop'} className={viewport === 'desktop' ? 'active' : ''} onClick={() => setViewport('desktop')}>Desktop</button><button type="button" aria-pressed={viewport === 'phone'} className={viewport === 'phone' ? 'active' : ''} onClick={() => setViewport('phone')}>Phone</button><button ref={closeButton} type="button" onClick={onClose}>Close</button></div></header>
      <div className="owner-preview-stage">{issues.length > 0 && <div className="owner-preview-validation" role="status"><strong>Preview contains unfinished fields.</strong><span>{issues[0]}{issues.length > 1 ? ` And ${issues.length - 1} more.` : ''}</span></div>}<div className={`owner-preview-frame owner-preview-frame--${viewport}`}><div className="owner-preview-sitebar"><img src="/efbi-icon.png" alt="" /><strong>EFBI</strong><span>Private content preview</span></div><PreviewContent item={item} /></div></div>
      <footer><strong>Nothing was published.</strong><span>Close this preview, make any corrections in the editor, and open it again before marking the draft ready.</span></footer>
    </section>
  </div>
}

export default function OwnerPreviewLauncher({ item, issues = [] }: { item: OwnerPreviewItem; issues?: string[] }) {
  const [open, setOpen] = useState(false)
  return <><div className="owner-preview-launch"><button type="button" onClick={() => setOpen(true)}>Open full preview</button><span>Check desktop and phone views before publication.</span></div>{open && createPortal(<OwnerPreview item={item} issues={issues} onClose={() => setOpen(false)} />, document.body)}</>
}

export const blogToneOptions = ['green', 'gold', 'blue', 'red'] as const

export type BlogTone = typeof blogToneOptions[number]
export type BlogStatus = 'draft' | 'ready' | 'published' | 'unpublished'

export type BlogFormValues = {
  title: string
  excerpt: string
  category: string
  authorName: string
  readingMinutes: string
  featured: boolean
  tone: BlogTone
  bodyMarkdown: string
}

export type BlogContent = Omit<BlogFormValues, 'readingMinutes'> & { readingMinutes: number }

export type BlogDraft = BlogContent & {
  postId: string
  status: BlogStatus
  revision: number
  latestReleaseNumber: number
  latestReleaseId: string
  createdAt: unknown
  createdBy: string
  updatedAt: unknown
  updatedBy: string
  lastAuditId: string
}

export type BlogRelease = BlogContent & {
  releaseId: string
  postId: string
  version: number
  draftRevision: number
  publishedAt: unknown
  publishedBy: string
  auditId: string
}

export const emptyBlogForm: BlogFormValues = {
  title: '',
  excerpt: '',
  category: 'Learning',
  authorName: 'Tamerat Gebeyehu',
  readingMinutes: '5',
  featured: false,
  tone: 'green',
  bodyMarkdown: '',
}

export function validPostId(value: string) {
  return value.length >= 3 && value.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function normalizeBlogForm(values: BlogFormValues) {
  const content: BlogContent = {
    title: values.title.trim(),
    excerpt: values.excerpt.trim(),
    category: values.category.trim(),
    authorName: values.authorName.trim(),
    readingMinutes: Number(values.readingMinutes),
    featured: values.featured,
    tone: values.tone,
    bodyMarkdown: values.bodyMarkdown.trim(),
  }
  const errors: string[] = []
  if (content.title.length < 5 || content.title.length > 120) errors.push('Article title must be 5–120 characters.')
  if (content.excerpt.length < 20 || content.excerpt.length > 320) errors.push('Excerpt must be 20–320 characters.')
  if (content.category.length < 2 || content.category.length > 40) errors.push('Category must be 2–40 characters.')
  if (content.authorName.length < 2 || content.authorName.length > 80) errors.push('Author name must be 2–80 characters.')
  if (!Number.isInteger(content.readingMinutes) || content.readingMinutes < 1 || content.readingMinutes > 60) errors.push('Reading time must be 1–60 minutes.')
  if (!blogToneOptions.includes(content.tone)) errors.push('Choose a supported article color.')
  if (content.bodyMarkdown.length < 100 || content.bodyMarkdown.length > 20000) errors.push('Article body must be 100–20,000 characters.')
  return { content, errors }
}

export function formFromBlog(draft: BlogDraft): BlogFormValues {
  return { ...draft, readingMinutes: String(draft.readingMinutes) }
}

export function blogContentMatches(draft: BlogDraft, content: BlogContent) {
  return draft.title === content.title
    && draft.excerpt === content.excerpt
    && draft.category === content.category
    && draft.authorName === content.authorName
    && draft.readingMinutes === content.readingMinutes
    && draft.featured === content.featured
    && draft.tone === content.tone
    && draft.bodyMarkdown === content.bodyMarkdown
}

import { getFirebaseFirestore } from './firebase'

export type PublicBlogPost = {
  postId: string
  title: string
  excerpt: string
  category: string
  authorName: string
  readingMinutes: number
  featured: boolean
  tone: 'green' | 'gold' | 'blue' | 'red'
  bodyMarkdown: string
  releaseId: string
  version: number
  publishedAt: Date | null
}

const tones = ['green', 'gold', 'blue', 'red'] as const

function asDate(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const timestamp = value as { toDate?: () => Date }
  if (typeof timestamp.toDate !== 'function') return null
  const date = timestamp.toDate()
  return Number.isNaN(date.getTime()) ? null : date
}

function asPost(id: string, data: Record<string, unknown>): PublicBlogPost | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 80 || data.postId !== id) return null
  if (typeof data.title !== 'string' || data.title.length < 5 || data.title.length > 120) return null
  if (typeof data.excerpt !== 'string' || data.excerpt.length < 20 || data.excerpt.length > 320) return null
  if (typeof data.category !== 'string' || data.category.length < 2 || data.category.length > 40) return null
  if (typeof data.authorName !== 'string' || data.authorName.length < 2 || data.authorName.length > 80) return null
  if (!Number.isInteger(data.readingMinutes) || (data.readingMinutes as number) < 1 || (data.readingMinutes as number) > 60) return null
  if (typeof data.featured !== 'boolean' || typeof data.tone !== 'string' || !tones.includes(data.tone as typeof tones[number])) return null
  if (typeof data.bodyMarkdown !== 'string' || data.bodyMarkdown.length < 100 || data.bodyMarkdown.length > 20000) return null
  if (typeof data.releaseId !== 'string' || data.releaseId.length < 16 || data.releaseId.length > 140 || !Number.isInteger(data.version) || (data.version as number) < 1) return null
  return {
    postId: id,
    title: data.title,
    excerpt: data.excerpt,
    category: data.category,
    authorName: data.authorName,
    readingMinutes: data.readingMinutes as number,
    featured: data.featured,
    tone: data.tone as PublicBlogPost['tone'],
    bodyMarkdown: data.bodyMarkdown,
    releaseId: data.releaseId,
    version: data.version as number,
    publishedAt: asDate(data.publishedAt),
  }
}

let postsPromise: Promise<PublicBlogPost[]> | null = null

export function loadPublishedPosts() {
  if (postsPromise) return postsPromise
  postsPromise = (async () => {
    try {
      const services = await getFirebaseFirestore()
      if (!services) return []
      const { collection, getDocs } = services.firestoreSdk
      const snapshot = await getDocs(collection(services.db, 'publishedPosts'))
      return snapshot.docs
        .map((item) => asPost(item.id, item.data()))
        .filter((item): item is PublicBlogPost => Boolean(item))
        .sort((left, right) => Number(right.featured) - Number(left.featured)
          || (right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0)
          || left.title.localeCompare(right.title))
    } catch {
      return []
    }
  })()
  return postsPromise
}

export async function loadPublishedPost(postId: string) {
  const posts = await loadPublishedPosts()
  return posts.find((post) => post.postId === postId) ?? null
}

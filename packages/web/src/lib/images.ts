const ABSOLUTE_URL = /^(?:https?:)?\/\//i

/** Resolve a blog-relative image path (e.g. /images/x.png) against a base origin for display. */
export function resolveImageUrl(src: string, baseUrl?: string): string {
  if (!src || !baseUrl) return src
  if (ABSOLUTE_URL.test(src) || src.startsWith('data:') || src.startsWith('blob:')) return src
  const base = baseUrl.replace(/\/+$/, '')
  return `${base}${src.startsWith('/') ? src : `/${src}`}`
}

/** Derive a sensible alt text / label from an image URL path. */
export function imageAltFromUrl(url: string): string {
  const name = url.split('/').pop() || 'image'
  return name.replace(/\.[^.]+$/, '')
}

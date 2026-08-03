export interface RouteFile {
  path: string
}

/**
 * Map a blog URL route (e.g. "/blog/on-clean-code-2026") to the markdown file
 * in the content directory, using the known file list to disambiguate between
 * "page.md" and "page/index.md". Returns null when no file matches.
 */
export function blogRouteToFile(route: string, files: RouteFile[]): string | null {
  const clean = route.replace(/^\/+|\/+$/g, '')
  if (!clean) return 'index.md'

  const known = new Set(files.map((f) => f.path))
  const candidates = [`${clean}.md`, `${clean}/index.md`]
  return candidates.find((c) => known.has(c)) ?? null
}

/**
 * Map a content-relative markdown path (e.g. "blog/on-clean-code-2026.md")
 * to the blog's URL route for that page (e.g. "/blog/on-clean-code-2026").
 */
export function fileToBlogRoute(file: string): string {
  const base = file.replace(/\.md$/, '')
  const trimmed = base === 'index' ? '' : base.replace(/\/index$/, '')
  return `/${trimmed}`
}

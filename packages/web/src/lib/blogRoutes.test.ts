import { describe, expect, it } from 'vitest'
import { blogRouteToFile, fileToBlogRoute } from './blogRoutes'

const files = [
  { path: 'index.md' },
  { path: 'blog.md' },
  { path: 'blog/on-clean-code-2026.md' },
  { path: 'blog/la-fundacion-de-tenochtitlan.md' },
  { path: 'projects.md' },
  { path: 'projects/hello-world/index.md' },
  { path: '404.md' },
]

describe('blogRouteToFile', () => {
  it('maps the root route to index.md', () => {
    expect(blogRouteToFile('/', files)).toBe('index.md')
    expect(blogRouteToFile('', files)).toBe('index.md')
  })

  it('maps a top-level page to its file', () => {
    expect(blogRouteToFile('/blog', files)).toBe('blog.md')
    expect(blogRouteToFile('/404', files)).toBe('404.md')
  })

  it('maps a nested page to its file', () => {
    expect(blogRouteToFile('/blog/on-clean-code-2026', files)).toBe(
      'blog/on-clean-code-2026.md',
    )
  })

  it('falls back to a directory index file', () => {
    expect(blogRouteToFile('/projects/hello-world', files)).toBe(
      'projects/hello-world/index.md',
    )
  })

  it('tolerates leading/trailing slashes', () => {
    expect(blogRouteToFile('blog/on-clean-code-2026/', files)).toBe(
      'blog/on-clean-code-2026.md',
    )
  })

  it('returns null when no file matches', () => {
    expect(blogRouteToFile('/does/not/exist', files)).toBeNull()
  })
})

describe('fileToBlogRoute', () => {
  it('maps index.md to the root route', () => {
    expect(fileToBlogRoute('index.md')).toBe('/')
  })

  it('maps a top-level page to its route', () => {
    expect(fileToBlogRoute('blog.md')).toBe('/blog')
    expect(fileToBlogRoute('projects.md')).toBe('/projects')
  })

  it('maps a nested page to its route', () => {
    expect(fileToBlogRoute('blog/on-clean-code-2026.md')).toBe('/blog/on-clean-code-2026')
  })

  it('strips a directory index segment', () => {
    expect(fileToBlogRoute('projects/hello-world/index.md')).toBe('/projects/hello-world')
  })
})

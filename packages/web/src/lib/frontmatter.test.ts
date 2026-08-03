import { describe, expect, it } from 'vitest'
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter'

describe('frontmatter', () => {
  it('parses yaml frontmatter and body', () => {
    const raw = `---\ntitle: Hello\ndate: 2026-01-01\n---\n\n# Hello\n\nBody text\n`
    const parsed = parseFrontmatter(raw)
    expect(parsed.hasFrontmatter).toBe(true)
    expect(parsed.frontmatter).toContain('title: Hello')
    expect(parsed.body).toContain('# Hello')
  })

  it('handles content without frontmatter', () => {
    const raw = '# Just a heading\n'
    const parsed = parseFrontmatter(raw)
    expect(parsed.hasFrontmatter).toBe(false)
    expect(parsed.frontmatter).toBe('')
    expect(parsed.body).toBe(raw)
  })

  it('round-trips frontmatter + body', () => {
    const fm = 'title: "Test"\ndate: 2026-08-03'
    const body = '# Test\n\nHello world\n'
    const joined = stringifyFrontmatter(fm, body)
    const parsed = parseFrontmatter(joined)
    expect(parsed.frontmatter).toBe(fm)
    expect(parsed.body.trim()).toBe(body.trim())
  })

  it('omits fence when frontmatter empty', () => {
    expect(stringifyFrontmatter('', '# hi')).toBe('# hi')
  })
})

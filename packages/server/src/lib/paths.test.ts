import { describe, expect, test } from 'bun:test'
import path from 'path'
import { PathError, resolveWithin } from './paths'

const base = path.join('/tmp', 'blog-editor-test-base')

describe('resolveWithin', () => {
  test('resolves a simple relative path', () => {
    const result = resolveWithin(base, 'post.md')
    expect(result).toBe(path.resolve(base, 'post.md'))
  })

  test('resolves nested paths', () => {
    const result = resolveWithin(base, 'folder/nested/post.md')
    expect(result).toBe(path.resolve(base, 'folder/nested/post.md'))
  })

  test('decodes URI components', () => {
    const result = resolveWithin(base, 'my%20post.md')
    expect(result).toBe(path.resolve(base, 'my post.md'))
  })

  test('rejects parent traversal', () => {
    expect(() => resolveWithin(base, '../secret')).toThrow(PathError)
    expect(() => resolveWithin(base, 'a/../../secret')).toThrow(PathError)
  })

  test('rejects empty path', () => {
    expect(() => resolveWithin(base, '')).toThrow(PathError)
  })
})

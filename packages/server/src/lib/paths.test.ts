import { describe, expect, test } from 'bun:test'
import path from 'path'
import { PathError, resolveWithin, toGitRelativePath } from './paths'

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

describe('toGitRelativePath', () => {
  const gitDir = path.join('/tmp', 'blog-editor-repo')
  const blogDir = path.join(gitDir, 'src')

  test('prefixes paths under the blog content dir with the subdir', () => {
    expect(toGitRelativePath(gitDir, blogDir, 'posts/hello.md')).toBe('src/posts/hello.md')
  })

  test('handles top-level files', () => {
    expect(toGitRelativePath(gitDir, blogDir, 'index.md')).toBe('src/index.md')
  })

  test('normalizes separators to forward slashes', () => {
    expect(toGitRelativePath(gitDir, blogDir, 'a\\b.md')).toBe('src/a/b.md')
  })

  test('rejects paths escaping the blog dir', () => {
    expect(() => toGitRelativePath(gitDir, blogDir, '../secret')).toThrow(PathError)
  })
})

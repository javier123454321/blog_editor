export interface ParsedMarkdown {
  frontmatter: string
  body: string
  hasFrontmatter: boolean
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

/**
 * Split a markdown document into YAML frontmatter and body.
 * If no frontmatter fence is found, frontmatter is empty and body is the full text.
 */
export function parseFrontmatter(content: string): ParsedMarkdown {
  const match = content.match(FRONTMATTER_RE)
  if (!match) {
    return {
      frontmatter: '',
      body: content,
      hasFrontmatter: false,
    }
  }

  return {
    frontmatter: match[1] ?? '',
    body: match[2] ?? '',
    hasFrontmatter: true,
  }
}

/**
 * Rejoin frontmatter + body into a full markdown file.
 * Empty frontmatter omits the fence entirely.
 */
export function stringifyFrontmatter(frontmatter: string, body: string): string {
  const fm = frontmatter.trim()
  if (!fm) {
    return body
  }
  // Preserve a single trailing newline after closing fence
  const normalizedBody = body.replace(/^\r?\n/, '')
  return `---\n${fm}\n---\n\n${normalizedBody}`
}

/** Minimal default template for new posts */
export function defaultNewPost(title = 'Your Post Title'): string {
  const date = new Date().toISOString().split('T')[0]
  return stringifyFrontmatter(
    `title: "${title}"\ndate: ${date}\ntags:\n  - tag1`,
    `# ${title}\n\nStart writing your blog post here...\n`,
  )
}

import { InputRule, Node, type JSONContent } from '@tiptap/core'

/**
 * Block-level HTML elements that Tiptap's StarterKit has no node for. When
 * these appear in markdown they are preserved verbatim instead of being
 * stripped down to their text content by the schema parser.
 */
const BLOCK_TAGS = [
  'div',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'nav',
  'main',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'caption',
  'figure',
  'figcaption',
  'iframe',
  'video',
  'audio',
  'canvas',
  'details',
  'summary',
  'dialog',
  'form',
  'fieldset',
  'legend',
  'select',
  'optgroup',
  'option',
  'textarea',
  'button',
  'label',
  'address',
  'hgroup',
  'object',
  'picture',
] as const

/**
 * Inline HTML elements not already handled by StarterKit marks (bold, italic,
 * strike, code, link). Preserved as-is when they appear inside a paragraph.
 */
const INLINE_TAGS = [
  'span',
  'mark',
  'sub',
  'sup',
  'small',
  'kbd',
  'abbr',
  'time',
  'u',
  'ins',
  'bdi',
  'bdo',
  'data',
  'q',
  'samp',
  'var',
  'wbr',
  'meter',
  'output',
  'progress',
  'ruby',
  'rt',
  'rp',
  'input',
] as const

const BLOCK_ALT = BLOCK_TAGS.join('|')
const INLINE_ALT = INLINE_TAGS.join('|')

interface RawHtmlAttributes {
  html: string
}

/**
 * Keeps arbitrary block-level HTML (e.g. `<div class="callout">…</div>`,
 * `<table>…</table>`, `<iframe>…</iframe>`) verbatim through the markdown
 * round-trip instead of having its tags and attributes stripped by Tiptap's
 * schema parser.
 *
 * Block HTML tokens from marked are captured directly (preserving the original
 * source, including whitespace) via `parseMarkdown`. Pasting or loading the
 * HTML through the schema is handled by the `parseHTML` rules.
 */
export const RawHtml = Node.create({
  name: 'rawHtml',

  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  markdownTokenName: 'html',

  addAttributes() {
    return {
      html: { default: '' },
    }
  },

  parseMarkdown(token) {
    if (!token.block) return []
    const html = (token.raw ?? token.text ?? '').toString().replace(/\s+$/, '')
    if (!html) return []
    return { type: 'rawHtml', attrs: { html } }
  },

  renderMarkdown(node: JSONContent) {
    return (node.attrs as RawHtmlAttributes).html
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-raw-html]',
        getAttrs: (dom) => ({
          html: (dom as HTMLElement).getAttribute('data-raw-html') || '',
        }),
      },
      ...BLOCK_TAGS.map((tag) => ({
        tag,
        getAttrs: (dom: HTMLElement) => ({ html: dom.outerHTML }),
      })),
    ]
  },

  renderHTML({ node }) {
    return [
      'div',
      { class: 'raw-html-block', 'data-raw-html': node.attrs.html },
      node.attrs.html,
    ]
  },

  addInputRules() {
    const find = new RegExp(`^<(?:${BLOCK_ALT})\\b[^>]*>[\\s\\S]*?<\\/(?:${BLOCK_ALT})>$`)
    return [
      new InputRule({
        find,
        handler: ({ state, match }) => {
          const html = match[0]
          const { $from } = state.selection
          const parent = $from.parent
          if (parent.type.name !== 'paragraph') return null
          state.tr.replaceWith(
            $from.start() - 1,
            $from.end() + 1,
            this.type.create({ html }),
          )
        },
      }),
    ]
  },
})

/**
 * Keeps inline HTML elements (e.g. `<span class="hl">…</span>`, `<mark>…</mark>`)
 * that StarterKit has no mark for, so they survive the markdown round-trip.
 */
export const RawHtmlInline = Node.create({
  name: 'rawHtmlInline',

  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      html: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-raw-html]',
        getAttrs: (dom) => ({
          html: (dom as HTMLElement).getAttribute('data-raw-html') || '',
        }),
      },
      ...INLINE_TAGS.map((tag) => ({
        tag,
        getAttrs: (dom: HTMLElement) => ({ html: dom.outerHTML }),
      })),
    ]
  },

  renderHTML({ node }) {
    return [
      'span',
      { class: 'raw-html-inline', 'data-raw-html': node.attrs.html },
      node.attrs.html,
    ]
  },

  renderMarkdown(node: JSONContent) {
    return (node.attrs as RawHtmlAttributes).html
  },

  addInputRules() {
    const find = new RegExp(`<(?:${INLINE_ALT})\\b[^>]*>[\\s\\S]*?<\\/(?:${INLINE_ALT})>$`)
    return [
      new InputRule({
        find,
        handler: ({ state, range, match }) => {
          const html = match[0]
          const { $from } = state.selection
          // Skip when an unclosed block-level tag is still being typed, so
          // nested markup like `<div><span>x</span></div>` is not partially
          // converted before the outer element completes.
          const before = $from.parent.textBetween(0, $from.parentOffset, '\n', '\ufffc')
          if (new RegExp(`<(?:${BLOCK_ALT})\\b`).test(before.slice(0, before.length - html.length))) {
            return null
          }
          state.tr.replaceWith(range.from, range.to, this.type.create({ html }))
        },
      }),
    ]
  },
})

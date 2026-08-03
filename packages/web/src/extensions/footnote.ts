import { Node, mergeAttributes } from '@tiptap/core'

interface FootnoteAttributes {
  anchor: 'ref' | 'note'
  n: number
}

export const Footnote = Node.create({
  name: 'footnote',

  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      anchor: { default: 'ref' },
      n: { default: null },
    }
  },

  renderHTML({ node }) {
    const { anchor, n } = node.attrs as FootnoteAttributes
    if (anchor === 'ref') {
      return ['a', mergeAttributes({ name: `ref${n}` }), `[(${n})](#note${n})`]
    }
    return ['a', mergeAttributes({ name: `note${n}` }), `${n}.`]
  },

  parseHTML() {
    return [
      {
        tag: 'a[name]',
        getAttrs: (dom) => {
          const name = (dom as HTMLElement).getAttribute('name') || ''
          const match = name.match(/^(ref|note)(\d+)$/)
          return match ? { anchor: match[1], n: parseInt(match[2], 10) } : false
        },
      },
    ]
  },

  renderMarkdown(node) {
    const { anchor, n } = node.attrs as FootnoteAttributes
    if (anchor === 'ref') {
      return `<a name="ref${n}">[(${n})](#note${n})</a>`
    }
    return `<a name="note${n}">**${n}.**</a>`
  },
})

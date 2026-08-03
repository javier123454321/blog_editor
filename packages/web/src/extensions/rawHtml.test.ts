// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import { Markdown } from '@tiptap/markdown'
import StarterKit from '@tiptap/starter-kit'
import { RawHtml, RawHtmlInline } from './rawHtml'

const extensions = [Markdown, StarterKit, RawHtml, RawHtmlInline]

function createEditor(content: string) {
  return new Editor({
    element: document.createElement('div'),
    content,
    contentType: 'markdown',
    extensions,
  })
}

async function simulateTyping(editor: Editor, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    const pos = editor.state.selection.from
    const handled = editor.view.someProp('handleTextInput', (fn) =>
      (fn as (view: unknown, from: number, to: number, text: string) => boolean)(
        editor.view,
        pos,
        pos,
        text[i],
      ),
    )
    if (!handled) {
      editor.chain().focus().insertContentAt(pos, text[i]).run()
      editor.commands.setTextSelection(pos + 1)
    }
  }
}

describe('rawHtml', () => {
  it('preserves block HTML verbatim through the markdown round-trip', () => {
    const md = `Intro.

<div class="callout">
  <p>Hello <strong>world</strong></p>
</div>

<table><tr><td>A</td><td>B</td></tr></table>

<iframe src="https://example.com"></iframe>
`
    const editor = createEditor(md)
    const out = editor.getMarkdown()
    expect(out).toContain('<div class="callout">\n  <p>Hello <strong>world</strong></p>\n</div>')
    expect(out).toContain('<table><tr><td>A</td><td>B</td></tr></table>')
    expect(out).toContain('<iframe src="https://example.com"></iframe>')
    editor.destroy()
  })

  it('keeps HTML blocks as single atom nodes with the full source in attrs', () => {
    const editor = createEditor('<div class="x">a</div>')
    const nodes = editor.getJSON().content
    expect(nodes[0]).toMatchObject({ type: 'rawHtml', attrs: { html: '<div class="x">a</div>' } })
    editor.destroy()
  })

  it('preserves inline HTML that StarterKit has no mark for', () => {
    const md = `Text with <span class="hl">inline</span> and <mark>mark</mark>.`
    const editor = createEditor(md)
    expect(editor.getMarkdown()).toBe('Text with <span class="hl">inline</span> and <mark>mark</mark>.')
    const types = editor.getJSON().content![0]!.content!.map((n) => n.type)
    expect(types).toContain('rawHtmlInline')
    editor.destroy()
  })

  it('is stable across repeated markdown round-trips', () => {
    const md = `A.

<div class="c">
  <p>B</p>
</div>
`
    const first = createEditor(md).getMarkdown()
    const second = createEditor(first).getMarkdown()
    expect(second).toBe(first)
  })

  it('converts typed block HTML into a raw HTML node', async () => {
    const editor = createEditor('')
    await simulateTyping(editor, '<div class="box">typed</div>')
    expect(editor.getMarkdown().trim()).toBe('<div class="box">typed</div>')
    editor.destroy()
  })

  it('converts typed inline HTML into a raw HTML inline node', async () => {
    const editor = createEditor('')
    await simulateTyping(editor, 'Use <mark>mark</mark> now')
    const types = editor.getJSON().content![0]!.content!.map((n) => n.type)
    expect(types).toContain('rawHtmlInline')
    expect(editor.getMarkdown()).toBe('Use <mark>mark</mark> now')
    editor.destroy()
  })

  it('does not convert the inner element of a partially-typed block', async () => {
    const editor = createEditor('')
    await simulateTyping(editor, '<div><span>x</span></div>')
    expect(editor.getMarkdown().trim()).toBe('<div><span>x</span></div>')
    editor.destroy()
  })

  it('preserves HTML when pasted through the schema', () => {
    const editor = createEditor('')
    editor.commands.insertContent('<div class="c">x</div>')
    expect(editor.getMarkdown()).toContain('<div class="c">x</div>')
    editor.destroy()
  })

  it('survives a copy/paste round trip through getHTML', () => {
    const editor = createEditor('<div class="c">x</div>')
    const html = editor.getHTML()
    editor.commands.setContent('', { contentType: 'markdown' })
    editor.commands.insertContent(html)
    expect(editor.getMarkdown().trim()).toBe('<div class="c">x</div>')
    editor.destroy()
  })

  it('does not swallow ordinary markdown like code blocks or paragraphs', () => {
    const editor = createEditor('# Heading\n\nSome **bold** text.\n\n```js\nconst x = 1\n```\n')
    const out = editor.getMarkdown()
    expect(out).toContain('# Heading')
    expect(out).toContain('**bold**')
    expect(out).toContain('const x = 1')
    editor.destroy()
  })
})

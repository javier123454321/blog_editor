<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'
import type { Editor } from '@tiptap/core'
import { ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import { Footnote } from '@/extensions/footnote'
import { ImagePreview } from '@/extensions/image'
import { RawHtml, RawHtmlInline } from '@/extensions/rawHtml'
import { imageAltFromUrl } from '@/lib/images'
import ImagePickerModal from '@/components/ImagePickerModal.vue'

const body = defineModel<string>({ required: true })

const previewBase = import.meta.env.VITE_BLOG_PREVIEW_URL || 'http://localhost:5178'

function nextFootnoteNumber(markdown: string): number {
  const refs = Array.from(markdown.matchAll(/<a name="ref(\d+)">/g), (m) => parseInt(m[1], 10))
  const max = refs.length ? Math.max(...refs) : 0
  return max + 1
}

function addFootnote(editor: Editor) {
  const next = nextFootnoteNumber(editor.getMarkdown())

  editor.chain().focus().insertContent({ type: 'footnote', attrs: { anchor: 'ref', n: next } }).run()

  const md = editor.getMarkdown()
  const noteEntry = `\n\n<a name="note${next}">**${next}.**</a> [[Back]](#ref${next})`
  const hasNotesSection = /^#{1,6}\s*[^*]*(?:\*\*)?Notes(?:\*\*)?[^*]*$/m.test(md)
  const updated = hasNotesSection ? md + noteEntry : `${md}\n\n## Notes${noteEntry}`

  editor.commands.setContent(updated, { contentType: 'markdown' })
}

const toolbarItems: EditorToolbarItem[][] = [
  [
    { kind: 'undo', icon: 'i-lucide-undo', tooltip: { text: 'Undo' } },
    { kind: 'redo', icon: 'i-lucide-redo', tooltip: { text: 'Redo' } },
  ],
  [
    {
      icon: 'i-lucide-heading',
      tooltip: { text: 'Headings' },
      content: { align: 'start' },
      items: [
        { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: 'Heading 1' },
        { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: 'Heading 2' },
        { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: 'Heading 3' },
        { kind: 'heading', level: 4, icon: 'i-lucide-heading-4', label: 'Heading 4' },
      ],
    },
    { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: 'Bullet list' } },
    { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: 'Numbered list' } },
    { kind: 'blockquote', icon: 'i-lucide-text-quote', tooltip: { text: 'Quote' } },
    { kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: 'Code block' } },
  ],
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Strike' } },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Code' } },
  ],
  [
    { kind: 'link', icon: 'i-lucide-link', tooltip: { text: 'Link' } },
    { kind: 'imageUpload', icon: 'i-lucide-image-up', tooltip: { text: 'Upload image' } },
    { kind: 'mediaCard', icon: 'i-lucide-images', tooltip: { text: 'Media card' } },
    { kind: 'pdfEmbed', icon: 'i-lucide-file-text', tooltip: { text: 'Embed PDF' } },
    { kind: 'footnote', icon: 'i-lucide-bookmark', tooltip: { text: 'Add footnote' } },
    { kind: 'horizontalRule', icon: 'i-lucide-separator-horizontal', tooltip: { text: 'Divider' } },
  ],
]

const activeEditor = ref<Editor | null>(null)
const pickerOpen = ref(false)
const pendingInsert = ref<'image' | 'card' | 'pdf'>('image')
const toast = useToast()

function escapeLiquidValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function mediaCardSnippet(url: string, alt: string): string {
  return (
    `{% render "partials/components/media-card.liquid", ` +
    `image: '${escapeLiquidValue(url)}', alt: '${escapeLiquidValue(alt)}', side: 'left', ` +
    `text: '${escapeLiquidValue('Write your text here.')}' %}`
  )
}

function pdfEmbedSnippet(url: string): string {
  const name = imageAltFromUrl(url)
  return `{% render "partials/components/pdf-embed.liquid", url: '${escapeLiquidValue(url)}', name: '${escapeLiquidValue(name)}' %}`
}

function onPickerSelect(url: string) {
  const editor = activeEditor.value
  if (!editor) return

  if (pendingInsert.value === 'card') {
    editor
      .chain()
      .focus()
      .insertContent({ type: 'paragraph', content: [{ type: 'text', text: mediaCardSnippet(url, imageAltFromUrl(url)) }] })
      .run()
    toast.add({ title: 'Media card inserted', color: 'success' })
  } else if (pendingInsert.value === 'pdf') {
    editor
      .chain()
      .focus()
      .insertContent({ type: 'paragraph', content: [{ type: 'text', text: pdfEmbedSnippet(url) }] })
      .run()
    toast.add({ title: 'PDF embed inserted', color: 'success' })
  } else {
    editor.chain().focus().setImage({ src: url }).run()
    toast.add({ title: 'Image inserted', color: 'success' })
  }
}

const handlers = {
  footnote: {
    canExecute: () => true,
    execute: (editor: Editor) => ({ run: () => addFootnote(editor) }),
    isActive: () => false,
  },
  imageUpload: {
    canExecute: (editor: Editor) => editor.can().setImage({ src: '' }),
    execute: (editor: Editor) => {
      activeEditor.value = editor
      pendingInsert.value = 'image'
      pickerOpen.value = true
      return editor.chain()
    },
    isActive: () => false,
  },
  mediaCard: {
    canExecute: () => true,
    execute: (editor: Editor) => {
      activeEditor.value = editor
      pendingInsert.value = 'card'
      pickerOpen.value = true
      return editor.chain()
    },
    isActive: () => false,
  },
  pdfEmbed: {
    canExecute: () => true,
    execute: (editor: Editor) => {
      activeEditor.value = editor
      pendingInsert.value = 'pdf'
      pickerOpen.value = true
      return editor.chain()
    },
    isActive: () => false,
  },
}

const suggestionItems = [
  [
    { type: 'label' as const, label: 'Style' },
    { kind: 'paragraph' as const, label: 'Paragraph', icon: 'i-lucide-type' },
    { kind: 'heading' as const, level: 1 as const, label: 'Heading 1', icon: 'i-lucide-heading-1' },
    { kind: 'heading' as const, level: 2 as const, label: 'Heading 2', icon: 'i-lucide-heading-2' },
    { kind: 'heading' as const, level: 3 as const, label: 'Heading 3', icon: 'i-lucide-heading-3' },
    { kind: 'bulletList' as const, label: 'Bullet List', icon: 'i-lucide-list' },
    { kind: 'orderedList' as const, label: 'Numbered List', icon: 'i-lucide-list-ordered' },
    { kind: 'blockquote' as const, label: 'Blockquote', icon: 'i-lucide-text-quote' },
    { kind: 'codeBlock' as const, label: 'Code Block', icon: 'i-lucide-square-code' },
  ],
]
</script>

<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-default bg-default">
    <UEditor
      v-slot="{ editor }"
      v-model="body"
      content-type="markdown"
      placeholder="Write… type / for commands"
      class="flex min-h-0 flex-1 flex-col"
      :image="false"
      :ui="{
        content: 'relative size-full min-h-0 flex-1 flex flex-col',
        base: 'px-4 py-3 sm:px-6 flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full',
      }"
      :extensions="[
        Footnote,
        ImagePreview.configure({ baseUrl: previewBase }),
        RawHtml,
        RawHtmlInline,
      ]"
      :handlers="handlers"
    >
      <UEditorToolbar
        :editor="editor"
        :items="toolbarItems"
        class="sticky top-0 z-10 border-b border-default bg-default px-2 py-4 overflow-x-auto"
      />
      <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
      <UEditorDragHandle :editor="editor" />
    </UEditor>
    <ImagePickerModal
      v-model:open="pickerOpen"
      :title="pendingInsert === 'pdf' ? 'Insert PDF' : 'Insert image'"
      :accept="pendingInsert === 'pdf' ? '.pdf,application/pdf' : 'image/*,.pdf'"
      @select="onPickerSelect"
    />
  </div>
</template>

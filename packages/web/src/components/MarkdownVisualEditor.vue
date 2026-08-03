<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'

const body = defineModel<string>({ required: true })

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
    { kind: 'horizontalRule', icon: 'i-lucide-separator-horizontal', tooltip: { text: 'Divider' } },
  ],
]

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
      :ui="{ base: 'px-4 py-3 sm:px-6 flex-1 overflow-y-auto min-h-0' }"
    >
      <UEditorToolbar
        :editor="editor"
        :items="toolbarItems"
        class="sticky top-0 z-10 border-b border-default bg-default px-2 py-1.5 overflow-x-auto"
      />
      <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
    </UEditor>
  </div>
</template>

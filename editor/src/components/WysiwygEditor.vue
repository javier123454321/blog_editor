<template>
  <div class="wysiwyg-container">
    <div class="wysiwyg-toolbar">
      <button @click="formatBold" title="Bold (Ctrl+B)" type="button">
        <strong>B</strong>
      </button>
      <button @click="formatItalic" title="Italic (Ctrl+I)" type="button">
        <em>I</em>
      </button>
      <button @click="formatHeading1" title="Heading 1" type="button">
        H1
      </button>
      <button @click="formatHeading2" title="Heading 2" type="button">
        H2
      </button>
      <button @click="formatHeading3" title="Heading 3" type="button">
        H3
      </button>
      <button @click="formatBulletList" title="Bullet List" type="button">
        •List
      </button>
      <button @click="formatNumberedList" title="Numbered List" type="button">
        1.List
      </button>
      <button @click="formatLink" title="Insert Link" type="button">
        Link
      </button>
    </div>
    <div
      ref="editorRef"
      class="wysiwyg-editor"
      contenteditable="true"
      @input="handleInput"
      @keydown="handleKeydown"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const editorRef = ref<HTMLDivElement | null>(null);

// Convert markdown to HTML for display
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  
  // Unordered lists
  html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

// Convert HTML back to markdown
function htmlToMarkdown(html: string): string {
  let markdown = html;
  
  // Headers
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n');
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n');
  
  // Bold
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  
  // Italic
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  
  // Links
  markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)');
  
  // Lists
  markdown = markdown.replace(/<ul>(.*?)<\/ul>/gis, (match, content) => {
    return content.replace(/<li>(.*?)<\/li>/gi, '* $1\n');
  });
  markdown = markdown.replace(/<ol>(.*?)<\/ol>/gis, (match, content) => {
    let counter = 1;
    return content.replace(/<li>(.*?)<\/li>/gi, () => `${counter++}. $1\n`);
  });
  
  // Remove remaining HTML tags
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  markdown = markdown.replace(/<div>/gi, '\n');
  markdown = markdown.replace(/<\/div>/gi, '');
  markdown = markdown.replace(/<p>/gi, '');
  markdown = markdown.replace(/<\/p>/gi, '\n');
  
  // Clean up extra newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();
  
  return markdown;
}

function handleInput() {
  if (editorRef.value) {
    const markdown = htmlToMarkdown(editorRef.value.innerHTML);
    emit('update:modelValue', markdown);
  }
}

function formatBold() {
  document.execCommand('bold', false);
  handleInput();
}

function formatItalic() {
  document.execCommand('italic', false);
  handleInput();
}

function formatHeading1() {
  document.execCommand('formatBlock', false, '<h1>');
  handleInput();
}

function formatHeading2() {
  document.execCommand('formatBlock', false, '<h2>');
  handleInput();
}

function formatHeading3() {
  document.execCommand('formatBlock', false, '<h3>');
  handleInput();
}

function formatBulletList() {
  document.execCommand('insertUnorderedList', false);
  handleInput();
}

function formatNumberedList() {
  document.execCommand('insertOrderedList', false);
  handleInput();
}

function formatLink() {
  const url = prompt('Enter URL:');
  if (url) {
    document.execCommand('createLink', false, url);
    handleInput();
  }
}

function handleKeydown(event: KeyboardEvent) {
  // Handle Ctrl+B for bold
  if (event.ctrlKey && event.key === 'b') {
    event.preventDefault();
    formatBold();
  }
  // Handle Ctrl+I for italic
  if (event.ctrlKey && event.key === 'i') {
    event.preventDefault();
    formatItalic();
  }
}

// Initialize editor content from markdown
onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = markdownToHtml(props.modelValue);
  }
});

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (editorRef.value && htmlToMarkdown(editorRef.value.innerHTML) !== newValue) {
    editorRef.value.innerHTML = markdownToHtml(newValue);
  }
});
</script>

<style scoped>
.wysiwyg-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.wysiwyg-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ccc;
  flex-shrink: 0;
}

.wysiwyg-toolbar button {
  padding: 6px 12px;
  border: 1px solid #ccc;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.wysiwyg-toolbar button:hover {
  background-color: #e9e9e9;
}

.wysiwyg-toolbar button:active {
  background-color: #d9d9d9;
}

.wysiwyg-editor {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  outline: none;
}

.wysiwyg-editor :deep(h1) {
  font-size: 2em;
  margin: 0.67em 0;
  font-weight: bold;
}

.wysiwyg-editor :deep(h2) {
  font-size: 1.5em;
  margin: 0.75em 0;
  font-weight: bold;
}

.wysiwyg-editor :deep(h3) {
  font-size: 1.17em;
  margin: 0.83em 0;
  font-weight: bold;
}

.wysiwyg-editor :deep(strong) {
  font-weight: bold;
}

.wysiwyg-editor :deep(em) {
  font-style: italic;
}

.wysiwyg-editor :deep(a) {
  color: #007bff;
  text-decoration: underline;
}

.wysiwyg-editor :deep(ul),
.wysiwyg-editor :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.wysiwyg-editor :deep(li) {
  margin: 0.5em 0;
}
</style>

<template>
  <div class="markdown-editor-container">
    <textarea
      ref="textarea"
      class="markdown-editor"
      :value="content"
      @input="handleInput"
    ></textarea>
    <pre v-html="highlightedContent" class="markdown-highlight"></pre>
  </div>

</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import hljs from 'highlight.js';

export default defineComponent({
  name: 'MarkdownEditor',
  props: {
    content: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const content = ref(props.content);
    const highlightedContent = ref('');

    const highlightContent = () => {
      highlightedContent.value = hljs.highlightAuto(content.value).value;
    };

    const handleInput = (event: Event) => {
      const value = (event.target as HTMLTextAreaElement).value;
      content.value = value;
      emit('update', value);
    };

    watch(() => content.value, highlightContent, { immediate: true });

    return {
      content,
      highlightedContent,
      handleInput,
    };
  },
});
</script>

<style scoped>
.markdown-editor {
  width: 100%;
  height: 100%;
  font-family: monospace;
  font-size: 14px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: none;
}

.markdown-editor-container {
  position: relative;
  display: flex;
}

.markdown-editor {
  position: absolute;
  background: transparent;
  z-index: 1;
  color: transparent;
  caret-color: black;
}

.markdown-highlight {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 14px;
}

</style>
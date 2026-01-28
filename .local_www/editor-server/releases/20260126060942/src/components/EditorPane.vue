<template>
  <div class="editor-pane">
    <FileTree @select="(path) => { filePath = path; }" :files="fileList" />
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading">Loading...</div>
    <MarkdownEditor v-if="!loading && !error" :content="content" @update="updateContent" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import MarkdownEditor from './MarkdownEditor.vue';

export default defineComponent({
  name: 'EditorPane',
  components: { MarkdownEditor },
  props: {
    filePath: {
      type: String,
      required: false,
    },
  },
  setup(props) {
    const content = ref('');
    const loading = ref(false);
    const error = ref('');
    const fileList = ref([]);

    const fetchFileList = async () => {
      try {
        const response = await fetch('/api/files');
        if (response.ok) {
          const data = await response.json();
          fileList.value = data.files;
        }
      } catch (err) {
        console.error('Failed to fetch file list', err);
      }
    };

    const fetchFileContent = async (path: string) => {
      loading.value = true;
      error.value = '';
      try {
        const response = await fetch(`/api/file/${encodeURIComponent(path)}`);
        if (!response.ok) {
          throw new Error('Failed to load file');
        }
        const data = await response.json();
        content.value = data.content;
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const updateContent = (newContent: string) => {
      content.value = newContent;
    };

    fetchFileList();

    if (props.filePath) {
      fetchFileContent(props.filePath);
    }

    return {
      content,
      loading,
      error,
      updateContent,
    };
  },
});
</script>

<style scoped>
.editor-pane {
  position: relative;
  margin: 10px;
}

.error {
  color: red;
  padding: 10px;
}
</style>

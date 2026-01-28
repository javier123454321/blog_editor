<template>
  <div v-if="loading">Loading files...</div>
<ul v-else>
  <li v-for="file in files" :key="file.path">
    {{ file.name }}
  </li>
</ul>
</template>

<script>
export default {
  name: 'FileTree',
  setup() {
    const files = ref([]);
    const loading = ref(false);
    const fetchFiles = async () => {
      try {
        loading.value = true;
        const response = await fetch('/api/files');
        files.value = await response.json();
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchFiles);

    return { files, loading, fetchFiles }
  },
};
</script>

<style>
/* Add styles here */
</style>
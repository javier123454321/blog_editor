<template>
  <div>{{ message }}</div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      message: 'Hello, Vue with TypeScript!',
    };
  },
};
</script>

<style>
/* Add some styles */
div {
  color: blue;
}
</style>
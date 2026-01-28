<template>
  <div class="editor-layout">
    <!-- Header -->
    <header class="editor-header">
      <div class="header-content">
        <h1 class="app-title">Blog Editor</h1>
        <div class="header-actions">
          <button
            class="theme-toggle"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
            title="Toggle theme"
          >
            <span v-if="isDark">☀️</span>
            <span v-else>🌙</span>
          </button>
          <slot name="header-actions">
            <!-- Placeholder for future actions -->
          </slot>
        </div>
      </div>
    </header>

    <div class="editor-main">
      <!-- Sidebar -->
      <aside :class="['editor-sidebar', { collapsed: isSidebarCollapsed }]">
        <div class="sidebar-content">
          <slot name="sidebar">
            <!-- Sidebar content goes here -->
          </slot>
        </div>
      </aside>

      <!-- Main content area -->
      <main class="editor-content">
        <slot>
          <!-- Main content goes here -->
        </slot>
      </main>
    </div>

    <!-- Mobile sidebar toggle -->
    <button
      v-if="isMobile"
      class="sidebar-toggle"
      @click="toggleSidebar"
      :aria-label="isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'"
    >
      ☰
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const isSidebarCollapsed = ref(false);
const windowWidth = ref(window.innerWidth);

const MOBILE_BREAKPOINT = 768;

const isMobile = computed(() => windowWidth.value < MOBILE_BREAKPOINT);

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  // Auto-collapse sidebar on mobile, auto-expand on desktop
  if (windowWidth.value < MOBILE_BREAKPOINT) {
    isSidebarCollapsed.value = true;
  } else {
    isSidebarCollapsed.value = false;
  }
};

// Theme handling (persisted to localStorage and applied to document)
const THEME_KEY = 'editor:theme';
const isDark = ref(false);

const applyTheme = (dark: boolean) => {
  isDark.value = dark;
  const theme = dark ? 'dark' : 'light';
  try {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // ignore
  }
};

const toggleTheme = () => applyTheme(!isDark.value);

onMounted(() => {
  // initialize from localStorage or system preference
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') applyTheme(true);
    else if (saved === 'light') applyTheme(false);
    else applyTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (e) {
    applyTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
  // Initial check
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg);
}

.editor-header {
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border);
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 100%;
}

.app-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text);
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-sidebar {
  width: 250px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.sidebar-content {
  padding: 1rem;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 1.5rem;
}

.sidebar-toggle {
  display: none;
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: var(--primary);
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.sidebar-toggle:hover {
  background-color: var(--primary-700);
}

/* Mobile styles */
@media (max-width: 767px) {
  .editor-sidebar {
    position: fixed;
    left: 0;
    top: 70px;
    height: calc(100vh - 70px);
    z-index: 99;
    transform: translateX(0);
  }

  .editor-sidebar.collapsed {
    transform: translateX(-100%);
  }

  .sidebar-toggle {
    display: block;
  }

  .app-title {
    font-size: 1.5rem;
  }

  .editor-header {
    padding: 0.75rem 1rem;
  }
}

/* Scrollbar styling */
.editor-sidebar::-webkit-scrollbar,
.editor-content::-webkit-scrollbar {
  width: 8px;
}

.editor-sidebar::-webkit-scrollbar-track,
.editor-content::-webkit-scrollbar-track {
  background: transparent;
}

.editor-sidebar::-webkit-scrollbar-thumb,
.editor-content::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb);
  border-radius: 4px;
}

.editor-sidebar::-webkit-scrollbar-thumb:hover,
.editor-content::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>

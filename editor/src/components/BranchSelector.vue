<template>
  <div class="branch-selector">
    <div v-if="loading" class="branch-display">
      Loading branches...
    </div>
    <div v-else-if="error" class="branch-display error">
      {{ error }}
    </div>
    <div v-else class="branch-dropdown">
      <button 
        class="branch-button" 
        @click="toggleDropdown"
        :aria-expanded="isOpen"
        aria-haspopup="true"
      >
        <span class="branch-icon">⎇</span>
        <span class="branch-name">{{ currentBranch }}</span>
        <span class="dropdown-arrow">▼</span>
      </button>
      
      <div v-if="isOpen" class="dropdown-menu">
        <div 
          v-for="branch in branches" 
          :key="branch.name"
          class="dropdown-item"
          :class="{ active: branch.current }"
          @click="selectBranch(branch.name)"
        >
          <span class="branch-icon">⎇</span>
          <span class="branch-name">{{ branch.name }}</span>
          <span v-if="branch.current" class="check-icon">✓</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '../composables/useAuth';

interface Branch {
  name: string;
  current: boolean;
}

const emit = defineEmits<{
  branchChanged: [];
}>();

const { password } = useAuth();
const branches = ref<Branch[]>([]);
const loading = ref(true);
const error = ref('');
const isOpen = ref(false);

const currentBranch = computed(() => {
  const current = branches.value.find(b => b.current);
  return current ? current.name : 'No branch';
});

const fetchBranches = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const res = await fetch('/api/branches', {
      headers: {
        'X-Auth-Password': password.value || '',
      },
    });
    
    if (res.ok) {
      const data = await res.json();
      branches.value = data.branches;
    } else {
      error.value = 'Failed to load branches';
    }
  } catch (e) {
    console.error('Failed to fetch branches', e);
    error.value = 'Failed to load branches';
  } finally {
    loading.value = false;
  }
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const selectBranch = async (branchName: string) => {
  // Don't switch if already on this branch
  if (branches.value.find(b => b.name === branchName)?.current) {
    isOpen.value = false;
    return;
  }

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Password': password.value || '',
      },
      body: JSON.stringify({ branch: branchName }),
    });

    if (res.ok) {
      // Refresh branches list to update current branch
      await fetchBranches();
      // Emit event to parent to refresh file tree
      emit('branchChanged');
      isOpen.value = false;
    } else {
      const data = await res.json();
      error.value = data.error || 'Failed to checkout branch';
      setTimeout(() => {
        error.value = '';
      }, 3000);
    }
  } catch (e) {
    console.error('Failed to checkout branch', e);
    error.value = 'Failed to checkout branch';
    setTimeout(() => {
      error.value = '';
    }, 3000);
  }
};

onMounted(() => {
  fetchBranches();
});

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.branch-dropdown')) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<script lang="ts">
import { onUnmounted } from 'vue';
export default {
  name: 'BranchSelector',
};
</script>

<style scoped>
.branch-selector {
  position: relative;
  min-width: 200px;
}

.branch-display {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: #666;
}

.branch-display.error {
  color: #d32f2f;
}

.branch-dropdown {
  position: relative;
}

.branch-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;
  transition: all 0.2s ease;
  width: 100%;
}

.branch-button:hover {
  background-color: #e8e8e8;
  border-color: #ccc;
}

.branch-button:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.branch-icon {
  font-size: 1rem;
  color: #666;
}

.branch-name {
  flex: 1;
  text-align: left;
  font-weight: 500;
}

.dropdown-arrow {
  font-size: 0.7rem;
  color: #999;
  transition: transform 0.2s ease;
}

.branch-button[aria-expanded="true"] .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item.active {
  background-color: #e3f2fd;
  font-weight: 500;
}

.dropdown-item .branch-name {
  flex: 1;
  text-align: left;
}

.check-icon {
  color: #007bff;
  font-weight: bold;
}

/* Scrollbar styling for dropdown */
.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>

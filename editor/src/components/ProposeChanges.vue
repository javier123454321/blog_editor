<template>
  <div>
    <!-- Propose Changes Button -->
    <button class="propose-button" @click="openModal">
      Propose Changes
    </button>

    <!-- Modal Dialog -->
    <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Propose Changes</h2>
          <button class="close-button" @click="close" aria-label="Close modal" :disabled="loading">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Success State - Show PR URL -->
          <div v-if="prUrl" class="success-state">
            <div class="success-icon">✓</div>
            <h3>Pull Request Created!</h3>
            <p>Your changes have been committed and pushed.</p>
            <a :href="prUrl" target="_blank" rel="noopener noreferrer" class="pr-link">
              View Pull Request →
            </a>
            <button class="btn btn-primary" @click="close">Done</button>
          </div>

          <!-- Form State - Commit Message Input -->
          <form v-else @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="commit-message">Commit Message</label>
              <textarea
                id="commit-message"
                v-model="commitMessage"
                class="form-textarea"
                placeholder="Describe your changes..."
                rows="4"
                required
                :disabled="loading"
                ref="textareaRef"
              ></textarea>
            </div>
            
            <!-- Progress/Error Display -->
            <div v-if="currentStep" class="progress-info">
              <div class="progress-step">
                <span class="step-label">{{ currentStep }}</span>
                <span v-if="loading" class="spinner"></span>
              </div>
            </div>

            <div v-if="error" class="error-message">
              {{ error }}
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="close" :disabled="loading">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading || !commitMessage.trim()">
                {{ loading ? 'Processing...' : 'Submit' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useAuth } from '../composables/useAuth';

const { password } = useAuth();
const isOpen = ref(false);
const commitMessage = ref('');
const loading = ref(false);
const error = ref('');
const currentStep = ref('');
const prUrl = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const openModal = () => {
  isOpen.value = true;
  commitMessage.value = '';
  error.value = '';
  currentStep.value = '';
  prUrl.value = '';
};

// Focus textarea when modal opens
watch(isOpen, async (open) => {
  if (open) {
    await nextTick();
    textareaRef.value?.focus();
  }
});

const handleOverlayClick = () => {
  if (!loading.value) {
    close();
  }
};

const close = () => {
  if (!loading.value) {
    isOpen.value = false;
  }
};

const handleSubmit = async () => {
  if (!commitMessage.value.trim() || loading.value) {
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    // Step 1: Commit
    currentStep.value = 'Committing changes...';
    const commitRes = await fetch('/api/commit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Password': password.value || '',
      },
      body: JSON.stringify({ message: commitMessage.value.trim() }),
    });
    
    if (!commitRes.ok) {
      const commitData = await commitRes.json();
      throw new Error(commitData.error || 'Failed to commit changes');
    }

    // Step 2: Push
    currentStep.value = 'Pushing to remote...';
    const pushRes = await fetch('/api/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Password': password.value || '',
      },
    });
    
    if (!pushRes.ok) {
      const pushData = await pushRes.json();
      throw new Error(pushData.error || 'Failed to push changes');
    }

    // Step 3: Create PR
    currentStep.value = 'Creating pull request...';
    const prRes = await fetch('/api/pr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Password': password.value || '',
      },
      body: JSON.stringify({ 
        title: commitMessage.value.trim().split('\n')[0], // Use first line as title
        body: commitMessage.value.trim()
      }),
    });
    
    if (!prRes.ok) {
      const prData = await prRes.json();
      throw new Error(prData.error || 'Failed to create pull request');
    }

    const prData = await prRes.json();
    prUrl.value = prData.url;
    currentStep.value = '';
  } catch (e) {
    console.error('Failed to propose changes', e);
    error.value = e instanceof Error ? e.message : 'Failed to propose changes';
    currentStep.value = '';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.propose-button {
  padding: 0.6rem 1.2rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.propose-button:hover {
  background-color: #218838;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.75rem;
  line-height: 1;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover:not(:disabled) {
  background-color: #f5f5f5;
  color: #333;
}

.close-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  padding: 1.5rem;
}

.success-state {
  text-align: center;
  padding: 1rem 0;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #28a745;
  color: white;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.success-state h3 {
  margin: 0 0 0.5rem;
  color: #333;
}

.success-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.pr-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-bottom: 1rem;
  transition: background-color 0.2s ease;
}

.pr-link:hover {
  background-color: #0056b3;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.progress-info {
  margin-bottom: 1rem;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 4px;
}

.step-label {
  color: #004085;
  font-weight: 500;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #004085;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 0.75rem;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #d32f2f;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e8e8e8;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}
</style>

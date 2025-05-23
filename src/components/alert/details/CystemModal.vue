<template>
  <el-dialog
    :model-value="modelValue"
    @update:modelValue="updateVisibility"
    title="AI Security Assistant"
    width="100vw"
    top="2vh"
    class="full-screen-modal"
    :modal="false"
    :lock-scroll="true"
    @close="handleClose"
  >
    <div class="modal-container">
      <div class="modal-header">
        <h2>Security Assistant</h2>
        <p>Explore insights or chat below for deeper analysis.</p>
      </div>

      <div class="modal-body" :class="{ 'detail-active': selectedIndex !== null }">
        <!-- Recommendation Selection -->
        <div class="recommendations" :class="{ vertical: selectedIndex !== null }">
          <div
            v-for="(item, index) in recommendations"
            :key="index"
            class="recommendation-box"
            :class="{ active: selectedIndex === index }"
            @click="selectRecommendation(index)"
          >
            <h4>{{ item.title }}</h4>
            <p>{{ item.short }}</p>
          </div>
        </div>

        <!-- Detail View -->
        <transition name="slide-fade">
          <div v-if="selectedIndex !== null" class="recommendation-detail">
            <h3>{{ recommendations[selectedIndex].title }}</h3>
            <div class="expanded-content">
              <pre v-if="recommendations[selectedIndex].detail" class="code-box">
<code>{{ recommendations[selectedIndex].detail }}</code></pre>
              <p v-else>No details available.</p>
            </div>
            <!-- Chat Log -->
            <div class="chat-log">
              <div
                v-for="(msg, i) in chatMessages"
                :key="i"
                class="chat-msg"
                :class="msg.type"
              >
                {{ msg.text }}
              </div>
            </div>
            <!-- Chat Input -->
            <div class="chat-bar">
              <el-input
                v-model="chatInput"
                placeholder="Ask a question..."
                @keyup.enter="sendMessage"
                class="chat-input"
              >
                <template #append>
                  <el-button icon="el-icon-sent" @click="sendMessage" />
                </template>
              </el-input>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';

defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue']);
const updateVisibility = (val) => emit('update:modelValue', val);
const handleClose = () => updateVisibility(false);

const selectedIndex = ref(null);
const chatInput = ref('');
const chatMessages = ref([]);

const recommendations = [
  { title: 'YARA Rule', short: 'Detect signature', detail: 'rule detect_threat { condition: true }' },
  { title: 'TLD Check', short: 'Domain risk scan', detail: 'tlds:\n- domain: test.com\n  risk: high' },
  { title: 'SOAR Steps', short: 'Auto-response play', detail: 'steps:\n- isolate host' },
  { title: 'STIX Data', short: 'Threat bundle format', detail: '{ "type": "bundle" }' },
  { title: 'Ask AI', short: 'Query assistant', detail: '' }
];

function selectRecommendation(index) {
  selectedIndex.value = index;
  chatMessages.value = [];
  chatInput.value = '';
}

function sendMessage() {
  if (chatInput.value.trim()) {
    chatMessages.value.push({ text: chatInput.value, type: 'user' });
    const question = chatInput.value;
    chatInput.value = '';

    setTimeout(() => {
      chatMessages.value.push({
        text: `AI response to: "${question}"`,
        type: 'ai'
      });
    }, 800);
  }
}
</script>

<style scoped>
.full-screen-modal {
  max-height: 98vh;
  padding: 0;
}

.modal-container {
  display: flex;
  flex-direction: column;
  height: 90vh;
}

.modal-header {
  text-align: center;
  padding: 10px 0;
}

.modal-body {
  display: flex;
  flex-grow: 1;
  padding: 0 20px;
  gap: 20px;
  transition: all 0.3s ease;
}

.recommendations {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding: 10px 0;
  transition: all 0.3s ease;
  max-height: 100%;
}

.recommendations.vertical {
  flex-direction: column;
  width: 20%;
  overflow-y: auto;
}

.recommendation-box {
  background: #f9f9f9;
  border-radius: 6px;
  padding: 8px 10px;
  min-width: 120px;
  cursor: pointer;
  text-align: center;
  font-size: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: 0.3s;
}
.recommendation-box:hover,
.recommendation-box.active {
  background: #e3f2fd;
  transform: scale(1.03);
}

.recommendation-detail {
  flex-grow: 1;
  padding: 15px;
  background: #fff;
  border-left: 2px solid #2196f3;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.expanded-content {
  margin-bottom: 20px;
}

.code-box {
  background: #272822;
  color: #f8f8f2;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

/* Chat */
.chat-log {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 10px;
}

.chat-msg {
  margin-bottom: 8px;
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 8px;
  word-wrap: break-word;
  font-size: 14px;
}

.chat-msg.user {
  align-self: flex-end;
  background-color: #e0f7fa;
  margin-left: auto;
}

.chat-msg.ai {
  align-self: flex-start;
  background-color: #ede7f6;
  margin-right: auto;
}

.chat-bar {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.chat-input {
  width: 100%;
  max-width: 600px;
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.4s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(50px);
}
</style>

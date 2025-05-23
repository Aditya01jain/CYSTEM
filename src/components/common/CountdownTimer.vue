<script setup lang="ts">
import { reactive, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['finish']);

const props = defineProps({
  minutes: { type: Number, default: 0 }
});

const state = reactive({
  minutes: 0,
  seconds: 0,
  timerInterval: null as any
});

const toggleTimer = () => {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  } else {
    state.timerInterval = setInterval(() => {
      if (state.seconds === 0) {
        if (state.minutes === 0) {
          clearInterval(state.timerInterval);
          emit('finish');
        } else {
          state.minutes--;
          state.seconds = 59;
        }
      } else {
        state.seconds--;
      }
    }, 1000);
  }
};

onMounted(() => {
  state.minutes = props.minutes;
  toggleTimer();
});

onUnmounted(() => {
  clearInterval(state.timerInterval);
});
</script>
<template>
  <span class="cyw-text-f14">
    {{ state.minutes.toString().padStart(2, '0') }} :
    {{ state.seconds.toString().padStart(2, '0') }}
  </span>
</template>

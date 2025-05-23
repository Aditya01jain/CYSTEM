<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive } from 'vue';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['show:lockwarning']);
const { t: $t } = useI18n();

const props = defineProps({
  timerValue: {
    type: Number,
    default: 0
  }
});

const state = reactive({
  timer: 0 as number,
  displayTime: {} as Record<string, any>,
  lastWarningOffset: 5,
  lockInfoTextMap: {
    first: $t('alerts.lock-info-text.first'),
    last: $t('alerts.lock-info-text.last')
  } as Record<string, string>
});

function getTImeByUnits(remainingTime = 0, type = 'seconds') {
  const factor = ['minutes', 'hours'].includes(type) ? 60 : 1;
  return Math.floor(
    (remainingTime % (1000 * 60 * factor * (type === 'hours' ? 24 : 1))) /
      (1000 * factor * (type === 'hours' ? 60 : 1))
  );
}

function initAlertLockTimer() {
  let lastWarning = false;
  state.timer = setInterval(() => {
    const now = new Date().getTime();
    const remainingTime = props.timerValue - now;
    if (remainingTime <= 0) {
      state.displayTime = {
        hours: '00',
        minutes: '00',
        seconds: '00'
      };
      emit('show:lockwarning', 'last');
      clearInterval(state.timer);
      return;
    }
    const hours = getTImeByUnits(remainingTime, 'hours');
    const minutes = getTImeByUnits(remainingTime, 'minutes');
    const seconds = getTImeByUnits(remainingTime, 'seconds');

    state.displayTime = {
      hours: hours.toLocaleString('en-US', {
        minimumIntegerDigits: 2
      }),
      minutes: minutes.toLocaleString('en-US', {
        minimumIntegerDigits: 2
      }),
      seconds: seconds.toLocaleString('en-US', {
        minimumIntegerDigits: 2
      })
    };

    if (!lastWarning && hours === 0 && minutes <= state.lastWarningOffset && seconds === 0) {
      emit('show:lockwarning', 'first');
      lastWarning = true;
    }
  }, 1000);
}

function handleAlertLock() {
  const now = new Date().getTime();
    const remainingTime = props.timerValue - now;
    if (remainingTime <= 0 && state.timer) {
      emit('show:lockwarning', 'last');
      clearInterval(state.timer);
    }
}

onMounted(() => {
  if (props.timerValue) initAlertLockTimer();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) handleAlertLock()
});
});

onBeforeUnmount(() => {
  if (state.timer) clearInterval(state.timer);
   document.removeEventListener("visibilitychange", handleAlertLock)
});
</script>

<template>
  <div>
    <span v-if="state.displayTime.hours" class="cyw-text-medium cyw-color-N900"
      >{{ state.displayTime.hours }}<span>hr</span></span
    >
    <span v-if="state.displayTime.minutes" class="cyw-text-medium cyw-color-N900">
      : {{ state.displayTime.minutes }}<span>m</span></span
    >
    <span v-if="state.displayTime.seconds" class="cyw-text-medium cyw-color-N900">
      : {{ state.displayTime.seconds }}<span>s</span></span
    >
  </div>
</template>

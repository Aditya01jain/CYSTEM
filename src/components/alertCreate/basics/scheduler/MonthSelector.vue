<script setup lang="ts">
import { ref, defineEmits, watch } from 'vue';
import { initTestId } from '@/utils/testid';

const testId = initTestId('ac', 'month-selector');
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const selectedDays = ref([]) as any;

const emit = defineEmits(['update:selectedDays']);

const props = defineProps({
  selected: {
    type: Array,
    default: () => []
  }
});

function toggleDay(day: number) {
  if (selectedDays.value.includes(day)) {
    selectedDays.value = selectedDays.value.filter((selectedDay: number) => selectedDay !== day);
  } else {
    selectedDays.value.push(day);
  }
  emit('update:selectedDays', selectedDays.value);
}

watch(
  () => props.selected,
  (value) => {
    selectedDays.value = value;
  },
  { immediate: true }
);
</script>

<template>
  <div class="month-days cyw-round-md">
    <div
      v-for="(day, index) in days"
      :key="index"
      v-bind="testId(`${day}`)"
      :class="[
        'day cyw-cursor-pointer cyw-color-N900 cyw-flex-center cyw-mx-1 cyw-my-2',
        { 'day--selected cyw-round-md cyw-color-N10': selectedDays.includes(index + 1) }
      ]"
      @click="toggleDay(index + 1)"
    >
      {{ day }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.month-days {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  border: 0.1rem solid var(--N200);
}

.day {
  width: 4rem;
  height: 4rem;
  &--selected {
    background-color: var(--P600);
    color: var(--N10);
  }
}
</style>

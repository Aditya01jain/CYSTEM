<script setup lang="ts">
import { ref, watch } from 'vue';
import { DAYS } from '../config';
import { initTestId } from '@/utils/testid';

const testId = initTestId('ac', 'week-selector');

const selectedDays = ref([]) as any;
const emit = defineEmits(['update:selectedDays']);

const props = defineProps({
  selected: {
    type: Array,
    default: () => []
  }
});

function toggleDay(dayIndex: number) {
  if (selectedDays.value.includes(dayIndex)) {
    selectedDays.value = selectedDays.value.filter((day: number) => day !== dayIndex);
  } else {
    selectedDays.value.push(dayIndex);
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
  <div class="week-days cyw-round-md">
    <div
      v-for="(day, index) in DAYS"
      :key="index"
      v-bind="testId(`${day.key}`)"
      :class="[
        'day cyw-cursor-pointer cyw-color-N900 cyw-flex-center cyw-mx-1 cyw-my-2',
        {
          'day--selected cyw-round-md cyw-color-N10': selectedDays.includes(day.key)
        }
      ]"
      @click="toggleDay(day.key)"
    >
      {{ day.semiLabel }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.week-days {
  display: flex;
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

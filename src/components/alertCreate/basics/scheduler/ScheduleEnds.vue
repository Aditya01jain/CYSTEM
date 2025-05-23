<script setup lang="ts">
import { reactive, watch, shallowRef, h } from 'vue';
import { initTestId } from '@/utils/testid';

const testId = initTestId('ac', 'schedule-ends');
defineOptions({ inheritAttrs: false });

const state = reactive({
  ends: 'never',
  end_time_tz: 0,
  max_run_count: 0
});

const emit = defineEmits(['update:ends', 'update:endsTime', 'update:runCount']);

const props = defineProps({
  ends: {
    type: String,
    default: ''
  },
  endsTime: {
    type: Number,
    default: 0
  },
  maxRunCount: {
    type: Number,
    default: 0
  }
});

const calenderIcon = shallowRef({
  render() {
    return h('i', {
      class: 'cyicon-calender-day cyw-color-N700 cyw-text-semi-bold'
    });
  }
});

const disabledDate = (time: any) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
};

function updateEndsTime(event: any) {
  state.end_time_tz = event / 1000;
  emit('update:endsTime', state.end_time_tz);
}

function updateEndSelection(event: any) {
  state.ends = event;
  emit('update:ends', state.ends);
}

function updateRunCount(event: any) {
  state.max_run_count = event;
  emit('update:runCount', state.max_run_count);
}

watch(
  () => props.ends,
  (value) => {
    state.ends = value;
  },
  { immediate: true }
);

watch(
  () => props.maxRunCount,
  (value) => {
    state.max_run_count = value;
  },
  { immediate: true }
);

watch(
  () => props.endsTime,
  (value) => {
    state.end_time_tz = value;
  },
  { immediate: true }
);
</script>

<template>
  <div class="mfa-schedule-ends">
    <div class="cyw-color-N800 cyw-text-medium cyw-text-f16 cyw-my-4">Ends</div>
    <CyRadio
      :modelValue="state.ends"
      v-for="option in [
        {
          text: 'Never',
          value: 'never'
        },
        {
          text: 'On',
          value: 'datetime'
        },
        {
          text: 'After',
          value: 'iteration'
        }
      ]"
      :data-testid="testId(`${option.value}`)"
      :key="option.value"
      class="cyw-py-3 mfa-schedule-ends__radio-option"
      :option="option.value"
      @update:modelValue="updateEndSelection($event)"
    >
      <div class="cyw-flex-align-center cyw-w-100 cyw-flex-grow-1">
        <span class="cyw-color-N800 cyw-text-f14 mfa-schedule-ends__radio-option__label cyw-mr-5">{{
          option.text
        }}</span>
        <div v-if="option.value === 'datetime'" class="cyw-w-100">
          <el-date-picker
            :disabled="state.ends !== 'datetime'"
            type="datetime"
            class="mfa-schedule-ends__date-picker cyw-mt-3 cyw-w-100 cyw-mb-2"
            :modelValue="state.end_time_tz * 1000"
            @update:modelValue="updateEndsTime"
            :prefix-icon="calenderIcon"
            :data-testid="testId('time')"
            size="large"
            placeholder="Select execution date and time"
            value-format="x"
            :disabled-date="disabledDate"
            :teleported="false"
            :clearable="false"
          ></el-date-picker>
        </div>
        <div v-if="option.value === 'iteration'">
          <CyInput
            :disabled="state.ends !== 'iteration'"
            class="cyw-w-75"
            type="number"
            :data-testid="testId('max-run-count')"
            :modelValue="state.max_run_count"
            @update:modelValue="updateRunCount"
          >
            <template #append> {{ Occurences }}</template>
          </CyInput>
        </div>
      </div>
    </CyRadio>
  </div>
</template>

<style lang="scss">
.mfa-schedule-ends {
  .option-label {
    min-height: 3rem;
  }

  &__radio-option {
    width: 80% !important;

    &__label {
      min-width: 10%;
    }
  }

  &__date-picker {
    .el-input__wrapper {
      background: var(--N10);
      border: 0.1rem solid var(--N400);
      box-shadow: none;

      &:hover {
        border: 0.1rem solid var(--N500);
        box-shadow: none;
      }

      &.is-focus {
        border: 0.1rem solid var(--P600);
        box-shadow: none;
      }

      .el-input {
        &__icon {
          margin-right: 0;
          margin-left: 1rem !important;
        }
        &__inner {
          color: var(--N800);
          margin-left: 1rem !important;
          &:disabled {
            background-color: none !important;
          }
          &::placeholder {
            color: var(--N600);
          }
        }
      }
    }
  }
}
</style>

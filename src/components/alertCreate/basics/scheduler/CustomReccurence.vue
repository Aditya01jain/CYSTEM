<script setup lang="ts">
import { reactive, defineAsyncComponent, watch, shallowRef, h, onMounted, computed } from 'vue';
import { DateTime } from 'luxon';
import { useI18n } from 'vue-i18n';
import { DAYS } from '../config';
import { initTestId } from '@/utils/testid';

const WeekSelector = defineAsyncComponent(() => import('./WeekSelector.vue'));
const MonthSelector = defineAsyncComponent(() => import('./MonthSelector.vue'));
const ScheduleEnds = defineAsyncComponent(() => import('./ScheduleEnds.vue'));

defineOptions({ inheritAttrs: false });

const { t: $t }: any = useI18n();
const testId = initTestId('ac', 'custom-reccurence');

const defaultValues = reactive({
  end_time_tz: null,
  ends: 'never',
  max_run_count: 1,
  mode: 'once',
  repeat_on: [],
  run_count: 0,
  start_time: new Date(),
  start_time_tz: Math.floor(Date.now() / 1000),
  timezone: DateTime.now().zoneName,
  timezone_config: {
    hour: Math.floor(DateTime.now().offset / 60),
    minute: Math.abs(DateTime.now().offset % 60)
  }
});

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {}
  },
  mode: {
    default: 'view'
  }
});

const state = reactive({
  model: {} as Record<string, any>,
  selectedSection: 'once',
  selectedInterval: 'daily'
});

const repeatAfterMap = [
  {
    name: 'Daily',
    value: 'daily'
  },
  {
    name: 'Weekly',
    value: 'weekly'
  },
  {
    name: 'Monthly',
    value: 'monthly'
  }
];

const calenderIcon = shallowRef({
  render() {
    return h('i', {
      class: 'cyicon-calender-day cyw-color-N700 cyw-text-semi-bold'
    });
  }
});

const intervalLabel = computed(() => {
  if (props.modelValue.mode === 'daily') return 'Daily';
  else if (props.modelValue.mode === 'weekly') return 'Weekly';
  else if (props.modelValue.mode === 'monthly') return 'Monthly';
  return '';
});

const endsLabel = computed(() => {
  if (props.modelValue.ends === 'never') return 'Never';
  else if (props.modelValue.ends === 'datetime') {
    return `${$t('On')} ${DateTime.fromMillis(props.modelValue.end_time_tz * 1000).toFormat(
      'dd LLL yyyy, hh:mm a'
    )}`;
  } else if (props.modelValue.ends === 'iteration') {
    return $t('After {number} occurrences', {
      number: props.modelValue.max_run_count
    });
  } else return '';
});

const repeatDaysLabel = computed(() => {
  if (props.modelValue.mode === 'weekly') {
    const result = props.modelValue.repeat_on
      .map((key: any) => DAYS.find((day) => day.key === key)?.semiLabel)
      .filter((label: any) => label !== undefined)
      .join(', ');
    return result;
  } else if (props.modelValue.mode === 'monthly') {
    const result = props.modelValue.repeat_on.map(getOrdinalSuffix).join(', ');
    return result;
  } else return '';
});

const disabledDate = (time: any) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() < today.getTime();
};

function getOrdinalSuffix(number: number) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = number % 100;
  return number + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}

onMounted(() => {
  state.model = {
    ...defaultValues,
    ...props.modelValue
  };
  emit('update:modelValue', state.model);
});

function updateData(event: any) {
  if (event !== 'interval') {
    state.selectedSection = event;
    state.model.mode = event;

    emit('update:modelValue', state.model);
  } else {
    state.selectedSection = event;
    state.model.mode = state.selectedInterval;
    emit('update:modelValue', state.model);
  }
}

function updateRepeatAfter(event: any) {
  if (event === 'monthly' && props.modelValue.mode === 'weekly') state.model.repeat_on = [];
  else if (event === 'weekly' && props.modelValue.mode === 'monthly') state.model.repeat_on = [];
  state.selectedInterval = event;
  state.model.mode = event;
  state.model.repeat_on = [];
  emit('update:modelValue', state.model);
}

function updateRepeatDays(event: any) {
  state.model.repeat_on = event;
  emit('update:modelValue', state.model);
}

function updateDateTime(event: any) {
  state.model.start_time_tz = event / 1000;
  state.model.start_time = DateTime.fromMillis(event).toISO();
  emit('update:modelValue', state.model);
}

function updateEndMode(event: string) {
  state.model.ends = event;
  emit('update:modelValue', state.model);
}

function updateEndTime(event: any) {
  state.model.end_time_tz = event;
  state.model.end_time = DateTime.fromMillis(event * 1000).toISO();
  emit('update:modelValue', state.model);
}

function updateOccurences(event: any) {
  state.model.max_run_count = event;
  emit('update:modelValue', state.model);
}

watch(
  () => props.modelValue.mode,
  (value: string) => {
    if (value === 'daily') {
      state.selectedInterval = 'daily';
    } else if (value === 'weekly') {
      state.selectedInterval = 'weekly';
    } else {
      state.selectedInterval = 'monthly';
    }
  },
  {
    immediate: true
  }
);
</script>

<template>
  <div class="events-schedule cyw-pb-4">
    <div v-if="props.mode === 'view'">
      <div v-if="['daily', 'weekly', 'monthly'].includes(props.modelValue.mode)" class="cyw-pb-4">
        <div class="cyw-color-N600 cyw-text-medium cyw-text-f12">
          {{ $t('Interval') }}
        </div>
        <div class="cyw-color-N800 cyw-text-f14" v-bind="testId('interval-label')">
          {{ intervalLabel }}
        </div>
      </div>

      <div 
        v-if="['weekly', 'monthly'].includes(props.modelValue.mode)"  
        v-bind="testId('scheduler-mode')" 
        class="cyw-pb-4"
      >
        <div class="cyw-color-N600 cyw-text-medium cyw-text-f12">
          {{
            props.modelValue.mode === 'weekly'
              ? $t('Execute Every Week On')
              : $t('Execute Every Month On')
          }}
        </div>
        <div class="cyw-color-N800 cyw-text-f14">
          {{ repeatDaysLabel }}
        </div>
      </div>

      <div v-if="props.modelValue.mode !== 'once'" v-bind="testId('end-label')">
        <div class="cyw-color-N600 cyw-text-medium cyw-text-f12">
          {{ $t('Ends') }}
        </div>
        <div class="cyw-color-N800 cyw-text-f14">
          {{ endsLabel }}
        </div>
      </div>
    </div>

    <div v-else>
      <div v-if="state.selectedSection === 'interval'" class="cyw-pt-4">
        <div class="cyw-color-N700 cyw-text-medium">
          {{ 'Repeat Every' }}
        </div>
        <CySelect
          class="repeat-after-select"
          v-bind="testId('repeat-after')"
          placeholder=""
          :modelValue="state.selectedInterval"
          :data="repeatAfterMap"
          identifier="value"
          :hideClear="true"
          :isValueKey="true"
          valueIdentifier="name"
          @update:modelValue="updateRepeatAfter"
        ></CySelect>
      </div>

      <WeekSelector
        v-if="state.selectedSection === 'interval' && state.selectedInterval === 'weekly'"
        class="cyw-mt-4"
        :selected="state.selectedInterval === 'weekly' ? state.model.repeat_on : []"
        @update:selectedDays="updateRepeatDays"
      />
      <MonthSelector
        v-if="state.selectedSection === 'interval' && state.selectedInterval === 'monthly'"
        class="cyw-mt-4"
        :selected="state.selectedInterval === 'monthly' ? state.model.repeat_on : []"
        @update:selectedDays="updateRepeatDays"
      />

      <div v-if="['interval', 'once'].includes(state.selectedSection)" class="cyw-pt-4">
        <div>Execution Date & Time</div>
        <el-date-picker
          type="datetime"
          popper-class="ca-date-picker__popper"
          class="ca-date-picker events-schedule__date-picker cyw-mt-3 cyw-w-100 cyw-mb-2"
          :modelValue="state.model.start_time_tz * 1000"
          @update:modelValue="updateDateTime"
          :prefix-icon="calenderIcon"
          v-bind="testId('event-start')"
          size="large"
          placeholder="Select execution date and time"
          value-format="x"
          :disabled-date="disabledDate"
          :teleported="false"
          :clearable="false"
        />
      </div>

      <ScheduleEnds
        :ends="state.model.ends"
        :maxRunCount="state.model.max_run_count"
        :endsTime="state.model.end_time_tz"
        @update:ends="updateEndMode"
        @update:endsTime="updateEndTime"
        @update:runCount="updateOccurences"
      />
    </div>
  </div>
</template>

<style lang="scss">
.events-schedule {
  &__radio-container {
    flex-wrap: wrap;
    &__radio-option {
      flex: 1 1 10rem;
      min-width: 16rem;
    }
  }

  .repeat-after-select {
    width: 40%;
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
          &::placeholder {
            color: var(--N600);
          }
        }
      }
    }
  }
}
</style>

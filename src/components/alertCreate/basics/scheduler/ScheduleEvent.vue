<script setup lang="ts">
import { reactive, onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import store from '@/store';
import { DateTime } from 'luxon';
import { isEmpty, sortBy } from 'lodash';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { TIMEZONE_RULE } from '../rules';
import { initTestId } from '@/utils/testid';

const testId = initTestId('ac', 'schedule-event');
const { t: $t } = useI18n();

const { fetchTZs, updateAlertFormStore } = useAlertBasicsData();

const props = defineProps({
  skipValidation: { type: Boolean, default: false }
});

const state = reactive({
  timeZoneList: [],
  model: {
    location: '',
    schedules: [
      {
        date: null,
        start_time: null,
        end_time: null
      }
    ] as Array<Record<string, any>>,
    type: 'single',
    url: ''
  },
  timezone_str: '',
  defaultTimezone: '',
  refresh: 0
});

const emit = defineEmits(['validate:field']);

const eventUrlRef: any = ref(null);

const alertData = computed(() => {
  const alertFormData = JSON.parse(
    JSON.stringify(
      store.getters['alertCreate/getAlertFormData']?.event ?? {
        location: '',
        schedules: [{}] as Array<{ start_time: string | null; end_time: string | null }>,
        type: 'single',
        url: ''
      }
    )
  );

  const sanitizedSchedules = alertFormData.schedules.map(
    ({ start_time, end_time }: { start_time: string | null; end_time: string | null }) => ({
      start_time,
      end_time
    })
  );

  return { ...alertFormData, schedules: sanitizedSchedules };
});

const updateStore = () => {
  const sanitizedSchedules = state.model.schedules
    .map(({ date, start_time, end_time }) => {
      const dateVal = new Date(date);
      dateVal.setHours(0, 0, 0, 0);

      const createTime = (time: string) =>
        DateTime.fromJSDate(dateVal)
          .setZone(state.timezone_str, { keepLocalTime: true })
          .set({
            hour: new Date(time).getHours(),
            minute: new Date(time).getMinutes()
          })
          .plus({ seconds: 59 })
          .startOf('minute');

      const startTimeLocal = start_time ? createTime(start_time) : null;
      const endTimeLocal = end_time ? createTime(end_time) : null;

      if (startTimeLocal || endTimeLocal)
        return {
          start_time: startTimeLocal ? startTimeLocal.toSeconds() : null,
          end_time: endTimeLocal ? endTimeLocal.toSeconds() : null
        };
      else return {};
    })
    .filter((schedule) => Object.keys(schedule).length);

  updateAlertFormStore('event', { ...state.model, schedules: sanitizedSchedules });
};

const updateField = (field: keyof typeof state.model, value: any) => {
  state.model[field] = value;
  updateStore();
};

const sortSchedules = () => {
  state.model.schedules = sortBy(state.model.schedules, [
    (schedule) => (!schedule.date && !schedule.start_time && !schedule.end_time ? 1 : 0),
    'date',
    'start_time',
    'end_time'
  ]);

  updateStore();
};

const addSchedule = () => {
  state.model.schedules.push({
    date: null,
    start_time: null,
    end_time: null
  });
  updateStore();
};

const removeSchedule = (index: number) => {
  if (index >= 0 && index < state.model.schedules.length) {
    state.model.schedules.splice(index, 1);
  }
  state.refresh = 1;
  updateStore();
  setTimeout(() => {
    state.refresh = 0;
  }, 0);
};

const copyToAll = () => {
  const firstSchedule = state.model.schedules[0];
  const start_time = firstSchedule.start_time;
  const end_time = firstSchedule.end_time;

  state.model.schedules.forEach((schedule, index) => {
    if (index !== 0) {
      schedule.start_time = start_time;
      schedule.end_time = end_time;
    }
  });
  updateStore();
};

function getDateTimeTimestamps(timestamp: number, timezoneStr: any) {
  const dateTime = DateTime.fromSeconds(timestamp, { zone: timezoneStr });
  const date = dateTime.toFormat('yyyy-MM-dd');
  const time = dateTime.toFormat('HH:mm:ss');
  const dateStr = `${date} ${time}`;
  const dateTimeVal = new Date(dateStr);
  const timeTimestamp = dateTimeVal.getTime();
  const dateTimestamp = DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: timezoneStr }).toMillis();
  return { dateTimestamp, timeTimestamp };
}

onMounted(async () => {
  state.timeZoneList = (await fetchTZs()).map((data: Record<string, any>) => {
    const offSet = DateTime.now().setZone(data.key).toFormat('ZZ');
    return { ...data, name: `(GMT${offSet}) ${data.name}` };
  });
  state.defaultTimezone = DateTime.now().zoneName;

  const filteredTimezones = state.timeZoneList.filter(
    (timezone) => timezone.key === state.defaultTimezone
  );
  state.timezone_str =
    store.getters['alertCreate/getAlertFormData']?.timezone_str ?? filteredTimezones[0]?.key;
  updateAlertFormStore('timezone_str', state.timezone_str);
  state.model = alertData.value;
  if (Array.isArray(state.model.schedules) && state.model.schedules.length > 0) {
    const hasSingleEmptySchedule =
      state.model.schedules.length === 1 && isEmpty(state.model.schedules[0]);

    if (!hasSingleEmptySchedule) {
      state.model.schedules.forEach((schedule: Record<string, any>) => {
        const { start_time: startTime, end_time: endTime } = schedule;
        const startTimeDetails = startTime
          ? getDateTimeTimestamps(startTime, state.timezone_str)
          : startTime;
        const endTimeDetails = endTime
          ? getDateTimeTimestamps(endTime, state.timezone_str)
          : endTime;

        Object.assign(schedule, {
          date: endTimeDetails?.dateTimestamp,
          start_time: startTimeDetails?.timeTimestamp,
          end_time: endTimeDetails?.timeTimestamp
        });
      });
    }
  }
  if (!store.getters['alertCreate/getAlertFormData'].event)
    updateAlertFormStore('event', { schedules: [] });
});

function rule(date: any) {
  return {
    validator: (rule: any, value: string, callback: Function) => {
      if (!date) {
        return callback(new Error($t('alerts.validations.this-field-is-required-1')));
      }
      callback();
    },
    trigger: 'blur'
  };
}

function getRules(rule: any, value: any = null) {
  if (!props.skipValidation || value) return rule;
  return [];
}

function onUpdateCheckbox(event: any) {
  state.model.type = event ? 'custom' : 'single';
  state.model.schedules = [{}];
  updateStore();
}
</script>
<template>
  <div id="eventDate" :key="state.refresh">
    <CyAccordionItem
      name="schedules"
      :title="$t('alerts.event-scheduler.schedule-event')"
      v-bind="testId()"
    >
      <el-form-item
        class="cyw-mb-3"
        prop="timezone_str"
        :rules="getRules(TIMEZONE_RULE($t))"
        v-bind="testId('timezone-form-item')"
      >
        <CySelect
          :label="`${$t('alerts.event-scheduler.timezone')}*`"
          size="md"
          :data="state.timeZoneList"
          :showSearch="true"
          value-identifier="name"
          searchIdentifier="name"
          identifier="key"
          isValueKey
          v-bind="testId('timezone')"
          v-model="state.timezone_str"
          @update:model-value="updateAlertFormStore('timezone_str', state.timezone_str)"
        />
      </el-form-item>

      <div class="cyw-flex-justify-between">
        <CyCheckbox
          class="cyw-w-fit"
          :modelValue="state.model.type === 'custom'"
          v-bind="testId('multi-day')"
          @update:modelValue="onUpdateCheckbox"
          ><div class="cyw-text-f12 cyw-color-N800 cyw-my-3">Multi Day Event</div>
        </CyCheckbox>
        <cy-button
          v-if="state.model.type === 'custom'"
          type="tertiary"
          v-bind="testId('copy-to-all')"
          @click="copyToAll"
          size="md"
        >
          Copy Time to all
        </cy-button>
      </div>

      <div
        v-for="(schedule, index) in state.model.schedules"
        :key="index"
        class="cyw-flex cyw-w-100"
      >
        <div class="date-width cyw-mr-2">
          <el-form-item
            :prop="`event.schedules.${index}.start_time`"
            class="cyw-mb-5"
            :rules="getRules(rule(schedule.date))"
            v-bind="testId(`${index}-date-form-item`)"
          >
            <CyFieldWrapper class="cyw-w-100" :label="$t('alerts.event-scheduler.event-date')">
              <el-date-picker
                v-model="schedule.date"
                @change="sortSchedules"
                class="ca-date-picker cyw-w-100"
                popper-class="ca-date-picker__popper"
                value-format="x"
                format="MMM DD, YYYY"
                v-bind="testId(`${index}-date`)"
                :disabledDate="
              (date: Date) =>
                date < new Date(new Date().setDate(new Date().getDate() - 1))
            "
              />
            </CyFieldWrapper>
          </el-form-item>
        </div>
        <div class="calender-time-picker cyw-mr-2">
          <el-form-item
            :prop="`event.schedules.${index}.start_time`"
            class="cyw-mb-5 cyw-mr-2 cyw-w-100"
            :rules="
              getRules(
                [
                  {
                    required: true,
                    message: $t('alerts.validations.this-field-is-required-1'),
                    trigger: 'change'
                  }
                ],
                schedule.end_time
              )
            "
            v-bind="testId(`${index}-start-time-form-item`)"
          >
            <CyFieldWrapper label="Start Time" class="cyw-w-100">
              <el-time-picker
                v-model="schedule.start_time"
                class="cyw-w-100"
                @change="sortSchedules"
                format="HH:mm"
                v-bind="testId(`${index}-start-time`)"
                :disabled="!schedule.date"
              />
            </CyFieldWrapper>
          </el-form-item>
        </div>
        <div class="calender-time-picker">
          <el-form-item
            :prop="`event.schedules.${index}.end_time`"
            class="cyw-mb-5 cyw-w-100"
            :rules="
              getRules(
                [
                  {
                    required: true,
                    message: $t('alerts.validations.this-field-is-required-1'),
                    trigger: 'change'
                  }
                ],
                schedule.start_time
              )
            "
            v-bind="testId(`${index}-end-time-form-item`)"
          >
            <CyFieldWrapper label="End Time" class="cyw-w-100">
              <el-time-picker
                v-model="schedule.end_time"
                class="cyw-w-100"
                @change="sortSchedules"
                format="HH:mm"
                v-bind="testId(`${index}-end-time`)"
                :disabled="!schedule.date"
              />
            </CyFieldWrapper>
          </el-form-item>
        </div>
        <div class="cyw-pt-5 cyw-mt-2 cyw-ml-2">
          <CyIconShell
            v-if="state.model.schedules.length > 1"
            v-bind="testId(`${index}-remove`)"
            @click="removeSchedule(index)"
          >
            <CyIcon icon="fa-regular fa-circle-minus" />
          </CyIconShell>
        </div>
      </div>
      <CyButton
        v-if="state.model.type === 'custom'"
        type="tertiary"
        v-bind="testId('more-btn')"
        @click="addSchedule"
      >
        {{ ` + ${$t('alerts.irs-added-listing.add-more-button')} ` }}
      </CyButton>
      <CyInput
        label="Place or Address"
        v-model="state.model.location"
        size="md"
        v-bind="testId('location')"
        @update:model-value="updateField('location', state.model.location)"
      />
      <el-form-item
        ref="eventUrlRef"
        :rules="{ type: 'url', message: 'Please enter a valid url (eg: http://example.com)' }"
        prop="event.url"
        v-bind="testId('url-form-item')"
      >
        <CyInput
          class="cyw-w-100"
          :label="$t('alerts.event-scheduler.event-url')"
          :maxlength="400"
          v-bind="testId('url')"
          :showCount="true"
          v-model="state.model.url"
          @update:modelValue="
            updateStore();
            emit('validate:field', 'event.url');
          "
          size="md"
          @update:model-value="updateField('url', state.model.url)"
        />
      </el-form-item>
    </CyAccordionItem>
  </div>
</template>
<style lang="scss">
#eventDate {
  .date-width {
    width: 33%;
  }
  .calender-time-picker {
    width: 33% !important;
  }
}
</style>

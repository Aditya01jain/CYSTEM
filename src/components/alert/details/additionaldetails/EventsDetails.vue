<script setup lang="ts">
import { getDateTimeInMS, formatDateForTimezone, formatTimeForTimezone } from '@/utils';
import { initTestId } from '@/utils/testid';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();
const props = defineProps({
  event: {
    default: {} as Record<string, any>
  },
  timezone: {
    default: ''
  },
  dataTestid: {
    type: String,
    default: 'event-details'
  }
});
const testId = initTestId(props.dataTestid, 'events');
</script>
<template>
  <div class="cyw-mb-3 cyw-flex-align-center" v-bind="testId()">
    <h6 class="alert-details-subtitle-box">{{ $t('alerts.alert-details.events') }}</h6>
    <hr class="cyw-flex-grow-1" />
  </div>
  <div class="cyw-bg-N50 cyw-p-4 cyw-flex-row cyw-flex-justify-between">
    <div class="cyw-flex-grow-1 cyw-mr-5 cyw-w-75" v-bind="testId('timezone')">
      <div class="cyw-text-f12 cyw-color-N600">
        {{ $t('alerts.event-scheduler.timezone') }}
      </div>
      <p class="cyw-text-f14 cyw-color-N800 cyw-mb-4">
        {{ props?.timezone }}
      </p>
      <div>
        <div class="cyw-text-f12 cyw-color-N600" v-bind="testId('starts')">
          {{ $t('alerts.alert-details.starts-on-label') }}
        </div>
        <p class="cyw-text-f14 cyw-color-N800 cyw-mb-4">
          {{ getDateTimeInMS(props.event?.schedules[0]?.start_time, props.timezone) }}
        </p>
      </div>
      <div>
        <div class="cyw-text-f12 cyw-color-N600" v-bind="testId('ends')">
          {{ $t('alerts.alert-details.ends-on-label') }}
        </div>
        <p class="cyw-text-f14 cyw-color-N800 cyw-mb-4">
          {{ getDateTimeInMS(props.event?.schedules[0]?.end_time, props.timezone) }}
        </p>
      </div>

      <hr />
      <div class="cyw-text-f12 cyw-color-N600" v-bind="testId('location')">
        {{ $t('alerts.event-scheduler.location') }}
      </div>
      <p class="cyw-text-f14 cyw-color-N800 cyw-mb-4">
        {{ props.event?.location || $t('alerts.labels.na') }}
      </p>
      <div class="cyw-text-f12 cyw-color-N600" v-bind="testId('url')">
        {{ $t('alerts.event-scheduler.event-url') }}
      </div>

      <a
        v-if="props?.event?.url"
        :href="props?.event?.url"
        class="cyw-text-nolink cyw-text-f14 cyw-color-N800 cyw-mb-4 ca-word-break-all"
        :class="{ 'cyw-text-underline': props.event?.url }"
        v-bind="testId('url-link')"
      >
        {{ props.event?.url }}
      </a>
      <p v-else class="cyw-text-nolink cyw-text-f14 cyw-color-N800 cyw-mb-4">
        {{ $t('alerts.labels.na') }}
      </p>
    </div>
    <div
      class="cyw-bg-N20 events-multi-day-width cyw-border-1 cyw-round-md"
      :data-testid="`${props.dataTestid}-events-mulit-day`"
    >
      <div
        v-for="(time, index) in props.event?.schedules"
        class="cyw-mx-4 cyw-my-3"
        :key="index"
        v-bind="testId(`schedules-${index}`)"
      >
        <div class="cyw-text-f14 cyw-color-N800">
          {{ formatDateForTimezone(time.start_time, props.timezone) }}
        </div>
        <p class="cyw-text-f12 cyw-color-N600">
          {{ formatTimeForTimezone(time.start_time, props.timezone) }} -
          {{ formatTimeForTimezone(time.end_time, props.timezone) }}
        </p>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.events-multi-day-width {
  width: 35% !important;
}
</style>

<script setup lang="ts">
import { formatDateTime } from '@/utils';
import { initTestId } from '@/utils/testid';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const props = defineProps({
  data: {
    default: {} as Record<string, any>
  },
  dataTestid: {
    type: String,
    default: 'ta-details'
  }
});

const testId = initTestId(props.dataTestid);
</script>
<template>
  <div class="cyw-mb-5 cyw-text-f12 cyw-color-N700">
    <div class="cyw-text-f12 cyw-color-N600" v-bind="testId('title')">
      {{ $t('alerts.responses.threat-assessment-title') }}
    </div>
    <p class="cyw-text-f14 cyw-color-N900 cyw-mb-4" v-bind="testId('question')">
      {{ props.data?.question }}
    </p>
    <template v-if="props.data.question_type === 'SINGLE-SELECT'">
      <div class="cyw-text-f12 cyw-color-N600" v-bind="testId('options')">
        {{ $t('alerts.responses.threat-assessment-options') }}
      </div>
      <p class="cyw-mb-4">
        <CyArrayPopper
          :config="{
            key: 'choices',
            slice: 2,
            mapper: 'choices:title',
            type: 'tags',
            rounded: false
          }"
          :value="props.data"
          v-bind="testId('options')"
        >
        </CyArrayPopper>
      </p>
    </template>
    <div class="cyw-text-f12 cyw-color-N600" v-bind="testId('expiry')">
      {{ $t('alerts.responses.threat-assessment-expiry') }}
    </div>
    <p class="cyw-text-f14 cyw-color-N900 cyw-mb-4" v-bind="testId('expiry-time')">
      {{ formatDateTime(props.data?.expire_acknowledgement_time) }}
    </p>
    <div v-if="!!props.data?.sla_name" v-bind="testId('sla')">
      <div class="cyw-text-f12 cyw-color-N600" v-bind="testId('sla-title')">
        {{ $t('alerts.responses.sla') }}
      </div>
      <p class="cyw-text-f14 cyw-color-N900 cyw-mb-4" v-bind="testId('sla')">
        {{ props.data?.sla_name }}
        <CyTag
          v-if="props.data?.sla_1"
          :text="props.data?.sla_1 + 'min'"
          :rounded="false"
          v-bind="testId('sla_1')"
        />
        <CyTag
          v-if="props.data?.sla_2"
          :text="props.data?.sla_2 + 'min'"
          :rounded="false"
          v-bind="testId('sla_2')"
        />
        <CyTag
          v-if="props.data?.sla_3"
          :text="props.data?.sla_3 + 'min'"
          :rounded="false"
          v-bind="testId('sla_3')"
        />
      </p>
    </div>
  </div>
</template>

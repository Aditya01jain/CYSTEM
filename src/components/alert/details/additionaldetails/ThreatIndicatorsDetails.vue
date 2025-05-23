<script setup lang="ts">
import { additionalIocs } from '@/components/alertCreate/basics/config';
import { computed } from 'vue';
import { initTestId } from '@/utils/testid';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();

const props = defineProps({
  threatIndicators: {
    default: {} as Record<string, any>
  },
  dataTestid: {
    type: String,
    default: 'threat-indicator'
  }
});
const testId = initTestId(props.dataTestid, 'threat-indicator');

const indicatorTabLength = computed(() =>
  Object.values(props.threatIndicators).reduce(
    (total, entry) => total + (entry.blacklisted?.length || 0) + (entry.whitelisted?.length || 0),
    0
  )
);

const iocTypeLength = (threat: string) => {
  return (
    props.threatIndicators[threat].blacklisted?.length +
    props.threatIndicators[threat].whitelisted?.length
  );
};
</script>
<template>
  <div class="cyw-pb-4" v-bind="testId('ioc-details')">
    <div class="cyw-mb-3 cyw-flex-align-center">
      <h6 class="alert-details-subtitle-box" v-bind="testId('ioc-title')">
        {{ $t('alerts.alert-details-tab.threat-indicators') }} ({{ indicatorTabLength }})
      </h6>
      <hr class="cyw-flex-grow-1" />
    </div>
    <div v-for="(threat, index) in Object.keys(props?.threatIndicators)" :key="index">
      <div
        v-if="iocTypeLength(threat)"
        class="cyw-text-f12 cyw-color-N600 cyw-mt-4 cyw-mb-2"
        v-bind="testId(`ioc-${threat}`)"
      >
        {{ props?.threatIndicators[threat].label }}
        <span
          v-if="!!props?.threatIndicators[threat].label"
          class="cyw-bg-N100 cyw-w-fit cyw-px-3 cyw-round-lg"
        >
          {{ iocTypeLength(threat) }}
        </span>
      </div>
      <div v-if="props?.threatIndicators[threat].blacklisted?.length" class="cyw-px-3 cyw-mb-2">
        <div
          v-if="!additionalIocs.includes(props?.threatIndicators[threat].label)"
          class="cyw-text-f12 cyw-color-N600"
          v-bind="testId(`ioc-${threat}-blocked`)"
        >
          {{ $t('alerts.alert-details.blocked-label') }}
        </div>
        <p
          v-for="(item, idx) in props?.threatIndicators[threat].blacklisted"
          :key="idx"
          class="cyw-text-f14 cyw-color-N900 ca-word-break"
          v-bind="testId(`ioc-${threat}-blocked-${idx}`)"
        >
          {{ item }}
        </p>
      </div>
      <div v-if="props?.threatIndicators[threat].whitelisted?.length" class="cyw-px-3">
        <div class="cyw-text-f12 cyw-color-N600" v-bind="testId(`ioc-${threat}-allowed`)">
          {{ $t('alerts.alert-details.allowed-label') }}
        </div>
        <p
          v-for="(item, idx) in props?.threatIndicators[threat].whitelisted"
          :key="idx"
          class="cyw-text-f14 cyw-color-N900 ca-word-break"
          v-bind="testId(`ioc-${threat}-allowed-${idx}`)"
        >
          {{ item }}
        </p>
      </div>
    </div>
  </div>
</template>

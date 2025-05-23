<script setup lang="ts">
import { computed } from 'vue';
import SectionList from '@/components/common/SectionList.vue';
import ThreatAssessment from './responses/ThreatAssessmentResponse.vue';
import EventAttendance from './responses/EventAttendance.vue';
import { useCommonData } from '@/composables/useCommonData';
import { useI18n } from 'vue-i18n';
import { initTestId } from '@/utils/testid';

const { t: $t } = useI18n();
const { isPermittedToMe, isFlagAccessableToTenant } = useCommonData();

const props = defineProps({
  details: {
    default: {},
    type: Object
  },
  dataTestid: {
    type: String,
    default: 'responses'
  }
});

const testId = initTestId(props.dataTestid);

const showEvents = computed(
  () =>
    isPermittedToMe('view', 'event_attendance') &&
    props.details?.card_category?.category_code === 'event'
);

const showTA = computed(
  () =>
    !!props.details?.acknowledgement_type_data && isPermittedToMe('view', 'acknowledgement_type')
);

const showRFI = computed(
  () => props.details?.card_category?.category_code === 'rfi' && props.details?.status !== 'EXPIRED'
);

const showFeedback = computed(() => isFlagAccessableToTenant('card_feedback_feature'));

const sectionList = computed(() =>
  [
    {
      id: 'threat-assessment',
      title: $t('alerts.alert-form-step.threat-assessments-section'),
      permissions: showTA.value
    },
    {
      id: 'event-attendance',
      title: $t('alerts.responses.event-attendance'),
      permissions: showEvents.value
    },
    { id: 'rfi-response', title: $t('alerts.responses.rfi-response'), permissions: showRFI.value },
    {
      id: 'alert-feedback',
      title: $t('alerts.responses.alert-feedback'),
      permissions: showFeedback.value
    }
  ].filter((tab) => tab.permissions ?? true)
);

const scrollTo = async (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>
<template>
  <div class="cyw-flex cyw-p-4">
    <template v-if="sectionList.length">
      <div class="section-list">
        <SectionList :list="sectionList" @section-click="scrollTo" v-bind="testId()" />
      </div>
      <div class="section-content">
        <threat-assessment
          v-if="showTA"
          class="cyw-mb-4"
          :details="props.details"
          :alertId="props.details.short_id"
          v-bind="testId()"
        />
        <event-attendance
          v-if="showEvents"
          class="cyw-mb-4"
          :alertId="props.details.short_id"
          :details="props.details"
          v-bind="testId()"
        />
        <rfi-response
          v-if="showRFI"
          class="cyw-mb-4"
          :alertId="props.details.short_id"
          :details="props.details"
          v-bind="testId()"
        />
        <alert-feedback
          v-if="showFeedback"
          class="cyw-mb-4"
          :alertId="props.details.short_id"
          v-bind="testId()"
        />
      </div>
    </template>
    <CyEmptyState 
      v-else 
      type="inbox" 
      :message="{ title: $t('alerts.empty.no-responses-found'), description: $t('alerts.empty.no-responses-description')}"
    />
  </div>
</template>

<style lang="css" scoped>
.section-list {
  width: 15rem;
}
.section-content {
  width: calc(100% - 15rem);
}
</style>

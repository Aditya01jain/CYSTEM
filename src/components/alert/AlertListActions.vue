<script setup lang="ts">
import { computed, reactive, ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ALERT_EXPORT_OPTIONS } from '@/components/alert/config';
import { useStore } from '@/store';
import { useCommonData } from '@/composables/useCommonData';
import { initTestId } from '@/utils/testid';
const testId = initTestId('al');
const { isPermittedToMe } = useCommonData();
const router = useRouter();

const store: Record<string, any> = useStore();
const emit = defineEmits(['refresh', 'fromTemplate']);
const $api: any = inject('$api');
const $notify: any = inject('$notify');
const { t: $t } = useI18n();

const oneWeekInSeconds = ref(7 * 24 * 60 * 60);
const currentTimestamp = ref(Math.floor(Date.now() / 1000));

const props = defineProps<{
  openForm: Function;
  switchToOldVersion: Function;
}>();

const state = reactive({
  alertExportOptions: ALERT_EXPORT_OPTIONS($t),
  exportLoading: false as boolean
});

const isMyQueueApplied = computed(() => {
  const statusFilters = store.getters['alert/getFilters']?.status;
  return statusFilters?.length === 1 && statusFilters?.[0] === 'SUBMITTED';
});

const currentFilters = computed(() => store.getters['alert/getFilters']);

const isAlertCreationAllowed = computed(() => {
  return (
    isPermittedToMe('draft', 'sa') ||
    isPermittedToMe('submitted', 'sa') ||
    isPermittedToMe('scheduled', 'sa') ||
    isPermittedToMe('published', 'sa')
  );
});

const analystGroupsEnabled = computed(() => {
  const userDetails = store.getters['common/getUserDetails'] || {}
  return !userDetails.hasOwnProperty('analyst_group_enabled') || userDetails.analyst_group_enabled || false; // so that switch to old button doesn't appear while loading
});

const onRefreshClick = () => {
  emit('refresh');
};

const onExportClick = async (key: string) => {
  state.exportLoading = true;
  try {
    const { data } = await $api.get('analyst.alertexport', {
      params: { ...currentFilters.value },
      id: key
    });
    $notify.success({
      title: data.title,
      message: data.msg
    });
  } catch {
    //
  } finally {
    state.exportLoading = false;
  }
};

const applyMyqueueFilter = () => {
  if (isMyQueueApplied.value) {
    store.dispatch('alert/removeAllFilter');
    store.dispatch('alert/setFilter', {
      modified_start: currentTimestamp.value - oneWeekInSeconds.value,
      modified_end: currentTimestamp.value
    });
  } else {
    store.dispatch('alert/removeAllFilter');
    store.dispatch('alert/setFilter', { status: ['SUBMITTED'] });
  }
  emit('refresh');
};

const openAlertCreateFormView = () => {
  store.dispatch('alert/setAppliedFilter', currentFilters.value);
  store.dispatch('alert/removeAllFilter');
  store.dispatch('alertCreate/resetAlertFormData');
  store.dispatch('alertCreate/resetAlertTempData');
  store.dispatch('alertCreate/setAlertFormListData', {
    key: 'active-category',
    value: {}
  });
  if (props.openForm) props.openForm();
  else router?.push({ name: 'alertCreateForm' });
};
</script>

<template>
  <div class="cyw-flex cyw-flex-align-center list-actions__height">
    <cy-button
      v-if="!analystGroupsEnabled"
      v-bind="testId('switch-to-old-version')"
      type="secondary"
      subtype="subtle"
      class="cyw-mx-2"
      @click="switchToOldVersion()"
    >
      <div class="cyw-flex-align-center">
        <CyIcon
          icon="fa-solid fa-arrow-left"
          class="cyw-color-N10 cyw-text-f14 cyw-bg-N600 cyw-p-2 cyw-round-md"
        />
        <div class="cyw-ml-3 cyw-color-N600 cyw-text-medium">
          {{ $t('alerts.labels.switch-to-old-version') }}
        </div>
      </div>
    </cy-button>
    <CyTooltip :content="$t('alerts.listing-page.refresh')">
      <CyIconShell size="md" v-bind="testId('refresh')" @click="onRefreshClick">
        <CyIcon icon="fa-regular fa-rotate-right" /> </CyIconShell
    ></CyTooltip>

    <CyDropdown>
      <template #dropdown-link>
        <div class="cyw-flex-align-center">
          <cy-spinner v-if="state.exportLoading" size="1.5" class="cyw-mx-3" />
          <CyTooltip v-else :content="$t('alerts.listing-page.export')">
            <CyIconShell size="md" v-bind="testId('export')">
              <CyIcon icon="fa-regular fa-arrow-up-to-line" /> </CyIconShell
          ></CyTooltip>
        </div>
      </template>
      <template #dropdown>
        <div class="cyw-flex-column">
          <div
            v-for="(option, index) in state.alertExportOptions"
            :key="index"
            class="cyw-py-2"
            @click="onExportClick(option.key)"
          >
            <CySelectOption>{{ option.label }}</CySelectOption>
          </div>
        </div>
      </template>
    </CyDropdown>

    <cy-button
      v-bind="testId('my-queue')"
      :type="isMyQueueApplied ? 'primary' : 'secondary'"
      class="cyw-mx-2"
      @click="applyMyqueueFilter"
    >
      {{ $t('alerts.listing-page.my-queue-button') }}
    </cy-button>
    <cy-button
      v-if="isAlertCreationAllowed"
      v-bind="testId('create-alert')"
      class="cyw-ml-2 cyw-py-2 cyw-pr-o"
      :class="{ 'cyw-round-right-0 ': isPermittedToMe('view', 'alert_template') }"
      size="lg"
      @click="openAlertCreateFormView"
    >
      {{ $t('alerts.listing-page.create-alert-button') }}
    </cy-button>
    <cy-dropdown v-if="isAlertCreationAllowed && isPermittedToMe('view', 'alert_template')">
      <template #dropdown-link>
        <cy-button
          v-bind="testId('create-alert-from-template')"
          class="cyw-round-left-0"
          subtype="icon"
          size="lg"
        >
          <div class="cyw-flex-align-center cyw-py-1 cyw-px-2">
            <CyIcon icon="fa-solid fa-caret-down" />
          </div>
        </cy-button>
      </template>
      <template #dropdown>
        <cy-button
          v-bind="testId('choose-from-template')"
          size="lg"
          type="tertiary"
          subtype="subtle"
          @click="emit('fromTemplate')"
        >
          {{ $t('alerts.threat-assessment-section.templates') }}
        </cy-button>
      </template>
    </cy-dropdown>
  </div>
</template>
<style lang="scss" scoped>
.list-actions {
  &__height {
    height: 4rem;
  }
}
</style>

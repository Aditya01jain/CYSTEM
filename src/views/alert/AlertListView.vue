<script setup lang="ts">
import { reactive, ref, onBeforeMount, computed, nextTick, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import AlertListTabs from '@/components/alert/AlertListTabs.vue';
import AlertListActions from '@/components/alert/AlertListActions.vue';
import AlertListTable from '@/components/alert/AlertListTable.vue';
import IncidentListTable from '@/components/incident/IncidentListTable.vue';
import rfiListTable from '@/components/rfi/rfiListTable.vue';
import ListActions from '@/components/common/ListActions.vue';
import AlertListTemplate from '@/components/alert/AlertListTemplate.vue';
import AlertLockTime from '@/components/alert/AlertLockTime.vue';
import { useCommonData } from '@/composables/useCommonData';
import { onMounted } from 'vue';
import { isEmpty } from 'lodash';

const { fetchUserDetails, fetchLocations, fetchCommunitites } = useCommonData();
const store: any = useStore();

const props = defineProps<{
  openForm: Function;
  switchToOldVersion: Function;
  redirectTo: Function;
  badgeCountData: Function;
}>();

const state = reactive({
  openTemplate: false as boolean,
  activeListTab: 'alerts',
  listComponentMap: {
    alerts: AlertListTable,
    incident: IncidentListTable,
    rfi: rfiListTable
  } as Record<string, any>,
  alertLockVisible: false,
  badgeCountData: {} as Record<string, any>,
  badgeCountTimer: 0,
  formLoading: false
});

const listTableRef: Record<string, any> = ref(null);
const alertRef: any = ref();

const alertLockDuration = computed(
  () => store.getters['common/getUserDetails']?.tenant?.alert_lock_duration * 1000 || 0
);

const tenantLogo = computed(() => {
  const tenantDetails = store.getters['common/getUserDetails'].tenant;
  return tenantDetails
    ? {
        src: tenantDetails.webapp_logo_dark,
        alt: tenantDetails.tenant_name
      }
    : {};
});

const refreshList = () => {
  listTableRef.value.refresh();
};

const onChangeTab = (tabName: string) => {
  if (props.redirectTo) {
    props.redirectTo(tabName);
  } else state.activeListTab = tabName;
};

const getBadgeCount = () => {
  if (props.badgeCountData) {
    state.badgeCountData = props.badgeCountData();
  } else state.badgeCountData = {};
};

const startBadgeCount = () => {
  setTimeout(() => {
    getBadgeCount();
  }, 1000);
  state.badgeCountTimer = setInterval(() => {
    getBadgeCount();
  }, 10000);
};

function onCreateAlertTemplate() {
  const currFilter = store.getters['alert/getFilters'];
  store.dispatch('alert/setAppliedFilter', currFilter);
  state.openTemplate = true;
}
const updateFormLoading = (loading: boolean) => {
  state.formLoading = loading;
};

onBeforeMount(async () => {
  await fetchUserDetails();
  await fetchLocations();
  await fetchCommunitites();
});

const userDetails = computed(() => {
  return store.getters['common/getUserDetails'];
});

onMounted(async () => {
  const alertLocked = store.getters['alertCreate/getAlertTempData'].alertLocked || {};
  if (!isEmpty(alertLocked)) {
    nextTick(() => {
      alertRef.value.open(alertLocked.message, {}, alertLocked.data);
      state.alertLockVisible = true;
      store.dispatch('alertCreate/setAlertTempData', { alertLocked: {} });
    });
  }
  startBadgeCount();
});

onBeforeUnmount(() => {
  clearInterval(state.badgeCountTimer);
});
</script>

<template>
  <div
    v-if="state.formLoading || isEmpty(userDetails)"
    class="cyw-h-100 cyw-w-100 cyw-position-absolute"
  >
    <div class="ca-loading-overlay cyw-flex-justify-center cyw-flex-align-center">
      <cy-spinner size="4" />
    </div>
  </div>
  <div v-if="!isEmpty(userDetails)" id="alert-module" class="cyw-base-font cyw-h-100">
    <div class="cyw-flex-justify-between cyw-px-4 cyw-py-3 cyw-pb-2 cyw-bg-N10">
      <div class="cyw-flex-align-center">
        <img :src="tenantLogo?.src" :alt="tenantLogo?.alt" class="alert-list--logo cyw-mr-4" />
        <AlertListTabs
          type="text"
          :badgeCountData="state.badgeCountData"
          @change:tab="onChangeTab"
        ></AlertListTabs>
      </div>
      <AlertListActions
        v-if="state.activeListTab === 'alerts'"
        :openForm="openForm"
        :switchToOldVersion="switchToOldVersion"
        @refresh="refreshList"
        @from-template="onCreateAlertTemplate"
      />
      <ListActions
        v-else
        :exportOptions="
          state.activeListTab === 'incident' ? [{ label: 'Export as CSV', key: 'csv' }] : []
        "
        :export-link="state.activeListTab === 'incident' ? '/admin/export/intel_report/' : ''"
        @refresh="refreshList"
      />
    </div>
    <div class="alert-list--layout cyw-p-4">
      <component
        :is="state.listComponentMap[state.activeListTab]"
        :openForm="openForm"
        ref="listTableRef"
        @alert:locked="
          alertRef.open($event.message, {}, $event.data), (state.alertLockVisible = true)
        "
        @form:loading="updateFormLoading"
      ></component>
    </div>
  </div>
  <AlertListTemplate
    v-if="state.openTemplate"
    :showModal="state.openTemplate"
    :openForm="openForm"
    @close="state.openTemplate = false"
  />
  <CyAlert ref="alertRef" :config="{ showCancel: false }">
    <template #extraInfo="{ data }">
      <AlertLockTime
        v-if="state.alertLockVisible"
        :timerValue="data.editor_details?.locked_on * 1000 + alertLockDuration"
        @confirm="state.alertLockVisible = false"
      />
    </template>
  </CyAlert>
</template>

<style lang="scss">
.alert-list--logo {
  height: 3.2rem;
  width: auto;
}
.alert-list--layout {
  background: var(--N50);
  height: calc(100% - 4rem);
}
.alert-list--body {
  height: calc(100% - 6rem);
  overflow-y: auto;
}
</style>

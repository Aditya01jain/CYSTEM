<script setup lang="ts">
import { onMounted, reactive, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { ALERT_DETAILS_TABS } from '@/components/alert/config';
import { INVALID_ALERT_MESSAGE } from '@/utils/config';
import AlertDetails from '@/components/alert/details/AlertDetails.vue';
import SendingOptions from '@/components/alert/details/SendingOptions.vue';
import Responses from '@/components/alert/details/Responses.vue';
import { useCommonData } from '@/composables/useCommonData';
import { isEmpty } from 'lodash';
import { initTestId } from '@/utils/testid';

const testId = initTestId('ad');
const { t: $t } = useI18n();

const { setToasterMsg, fetchUserDetails } = useCommonData();
const $api: any = inject('$api');
const $session: any = inject('$session');

const $route = useRoute();
const store = useStore();

const emits = defineEmits(['active:title']);

const props = defineProps({
  alertId: {
    default: '',
    required: true
  }
});

// reactive state
const state = reactive({
  alertDetails: {} as Record<string, any>,
  detailsLoading: false as boolean,
  activeTab: 'alertdetails' as string,
  tabsList: ALERT_DETAILS_TABS($t),
  invaidId: false,
  detailsMap: {
    alertdetails: AlertDetails,
    sendingoptions: SendingOptions,
    responses: Responses
  } as Record<string, any>,
  dataTestid: 'details'
});

const fetchAlertDetails = async () => {
  state.detailsLoading = true;
  try {
    const { data } = await $api.get('analyst.alertdetails', {
      params: { card_id: $route?.params?.shortid || props.alertId }
    });
    state.alertDetails = {
      ...data,
      created: data.created / 1000
    };
    emits('active:title', data.title);
    store.dispatch('alert/setAlertDetails', state.alertDetails);
  } catch (error: any) {
    if (error.code === 404) {
      state.invaidId = true;
    } else
      setToasterMsg('error', {
        title: 'Error',
        message: error.error?.detail
      });
  } finally {
    state.detailsLoading = false;
  }
};

onMounted(async () => {
  if ($session?.callUserDetails) await fetchUserDetails();
  await fetchAlertDetails();
});
</script>

<template>
  <div class="cyw-m-auto alert-details cyw-base-font">
    <div
      v-if="state.detailsLoading"
      class="cyw-mt-5"
      :style="{
        height: 'calc(100vh - 11.5rem)',
        overflowY: 'auto'
      }"
    >
      <CyShimmer v-for="index in 5" :key="index"></CyShimmer>
      <CyShimmer type="image"></CyShimmer>
      <CyShimmer v-for="index in 14" :key="index"></CyShimmer>
    </div>
    <cy-empty-state v-else-if="state.invaidId" type="oops" :message="INVALID_ALERT_MESSAGE($t)" />
    <div v-else>
      <CyTab
        type="line"
        v-model="state.activeTab"
        :data="state.tabsList"
        v-bind="testId()"
        class="cyw-border-bottom-1"
        @update:modelValue="onListTabChange"
      >
      </CyTab>
      <div
        :style="{
          height: 'calc(100vh - 11.5rem)',
          overflowY: 'auto'
        }"
        class="cyw-pb-5"
      >
        <component
          v-if="!isEmpty(state.alertDetails)"
          :is="state.detailsMap[state.activeTab]"
          v-bind="testId()"
          :details="state.alertDetails"
        ></component>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.alert-details {
  width: 65%;
  @media screen and (max-width: 1500px) {
    width: 80%;
  }
}
</style>

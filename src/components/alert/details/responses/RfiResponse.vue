<script setup lang="ts">
import { reactive, onMounted, ref, inject, computed } from 'vue';
import { alertResponses } from './alertResponses';
import { RFI_STATUS_MAP } from './config';
import ResponseList from '@/components/common/ResponseList.vue';
import { formatDateTime } from '@/utils';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useI18n } from 'vue-i18n';
import store from '@/store';
import { initTestId } from '@/utils/testid';
import { RFI_STATUS_ALERT_MSG } from '@/utils/config';

const { rfiResponses, exportRfi } = alertResponses();
const { fetchAlertData } = useAlertBasicsData();
const $api: any = inject('$api');
const { t: $t } = useI18n();
const $notify: any = inject('$notify');
const testId = initTestId('ad', 'rfi');

const props = defineProps({
  alertId: {
    default: ''
  },
  details: {
    default: {},
    type: Object
  }
});
const rfiStatusAlertRef: any = ref(null);

const onrfiStatusClosed = async () => {
  await $api.put('analyst.closedRfiResponse', {
    id: props.details.short_id,
    status: 'CLOSED'
  });
  state.alertData = await fetchAlertData({ card_id: props.details.short_id });
  state.data = [];
  state.page = 1;
  fetchData();
};

const state = reactive({
  data: [] as Array<Record<string, any>>,
  total: 0,
  page: 1,
  alertData: {}
});

const loadMore = () => {
  if (state.total <= state.page * 10) return;
  state.page += 1;
  fetchData();
};

const fetchData = async () => {
  const data = await rfiResponses(props.alertId, state.page);
  state.data = [...state.data, ...data.results].map((item) => ({
    ...item,
    first_name: item.creator.first_name
  }));
  state.total = data.count;
};

const onDeleteRFIResponse = async (rfiId: string) => {
  try {
    const { data } = await $api.put(
      'analyst.deleteRfiResponse',
      {
        id: rfiId
      },
      {
        id: `/${props.details.short_id}/responses`
      }
    );
    $notify.success({
      title: 'Success!',
      message: data.detail
    });
    state.data = [];
    state.page = 1;
    fetchData();
  } catch {
    //
  }
};

const isCurrentUserCreator = computed(() => {
  const { creator: { user_id: creator_id = '' } = { user_id: '' } } = props.details || {};
  const { user_id = '' } = store.getters['common/getUserDetails'] || {};
  return creator_id === user_id;
});

const onRfiStatusClick = () => {
  if (!isCurrentUserCreator.value) return;
  const openModal = state.alertData.rfi_alert_status
    ? state.alertData.rfi_alert_status
    : props.details.rfi_alert_status;
  if (openModal === 'CLOSED') return;
  rfiStatusAlertRef?.value?.open({ type: 'error' }, {}, {});
};

const getSuffixIcon = () => {
  return isCurrentUserCreator.value ? 'cyicon-chevron-filled-down' : '';
};

onMounted(() => {
  fetchData();
});
</script>
<template>
  <div id="rfi-response" v-bind="testId(`response`)">
    <div class="cyw-flex-justify-between">
      <div class="cyw-text-f16 cyw-my-3">{{ $t('alerts.responses.rfi-response') }}</div>
      <CyButton
        v-bind="testId(`export`)"
        type="tertiary"
        class="cyw-flex-align-center"
        @click="exportRfi(props.alertId)"
        :disabled="!state.data?.length"
      >
        <CyIcon icon="fa-regular fa-arrow-up-to-line" class="cyw-mr-3" />
        {{ $t('alerts.responses.rfi-response-export') }}
      </CyButton>
    </div>

    <div
      class="cyw-bg-N20 cyw-p-3 cyw-flex-justify-start cyw-mw-100 cyw-round-lg ca-border-N200 cyw-border-1"
    >
      <div
        class="cyw-bg-N10 cyw-flex-col cyw-flex-align-start cyw-w-25 cyw-flex-justify-start cyw-round-lg cyw-p-4 rfiBox-height cyw-shadow-100"
      >
        <p class="cyw-text-f12 cyw-color-N700" v-bind="testId(`status-text`)">
          {{ $t('alerts.responses.status') }}
        </p>
        <cy-tag
          v-bind="testId(`status`)"
          :text="
            state.alertData.rfi_alert_status
              ? state.alertData.rfi_alert_status
              : props.details.rfi_alert_status
          "
          type="status"
          :value="
            RFI_STATUS_MAP[
              state.alertData.rfi_alert_status
                ? state.alertData.rfi_alert_status
                : props.details.rfi_alert_status
            ]
          "
          :suffixIcon="getSuffixIcon()"
          @click="onRfiStatusClick"
        />

        <cy-tag
          class="cyw-my-4"
          type="tlp"
          :value="props.details.tlp"
          :rounded="false"
          v-bind="testId(`tlp`)"
        />

        <p class="cyw-text-f12 cyw-color-N700">Created</p>
        <div class="cyw-text-f12" v-bind="testId(`created`)">
          {{ formatDateTime(props.details?.created) }}
        </div>
      </div>
      <div class="cyw-ml-5 cyw-mt-5 cyw-w-75">
        <response-list
          v-bind="testId()"
          :keys="{
            name: 'first_name',
            date: 'created',
            content: 'content',
            attachments: 'attachments'
          }"
          :height="30"
          :data="state.data"
          :emptyMsg="$t('alerts.alert-details-empty-state.rfi-response-description')"
          allowDelete
          @load-more="loadMore"
          @delete:response="onDeleteRFIResponse"
        />
      </div>
    </div>
  </div>
  <CyAlert
    v-bind="testId(`close`)"
    ref="rfiStatusAlertRef"
    :message="RFI_STATUS_ALERT_MSG($t)"
    @confirm="onrfiStatusClosed"
  ></CyAlert>
</template>
<style lang="scss">
.rfiBox {
  &-height {
    height: 17rem;
  }
}
</style>

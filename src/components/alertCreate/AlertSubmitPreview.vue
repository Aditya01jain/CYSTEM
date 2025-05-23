<script setup lang="ts">
import { reactive, onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
import { ALERT_DETAILS_TABS } from './config';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import SendingOptions from './preview/SendingOptions.vue';
import { initTestId } from '@/utils/testid';

const testId = initTestId('ac', 'preview');
const { updateAlertFormStore, fetchRecipientCount } = useAlertBasicsData();

const store: Record<string, any> = useStore();
const emit = defineEmits(['close', 'check:speedbump']);
const { t: $t } = useI18n();

const state = reactive({
  activeTab: 'alertdetails',
  tabList: ALERT_DETAILS_TABS($t),
  submitting: false,
  stats: {}
});

const alertPreviewRef: Record<string, any> = ref();

const alertFormData = computed(() => {
  return store.getters['alertCreate/getAlertFormData'];
});

const onSubmit = async () => {
  state.submitting = true;
  emit('check:speedbump', state.stats);
  onCancel();
  state.submitting = false;
};

const onCancel = () => {
  alertPreviewRef?.value.hide();
  emit('close');
};

onMounted(async () => {
  alertPreviewRef?.value.show();
  const {
    card_group,
    card_location_json,
    card_locations,
    card_organization,
    card_organization_types,
    regions,
    short_id
  } = alertFormData.value;
  state.stats = await fetchRecipientCount({
    card_group,
    card_location_json,
    card_locations,
    card_organization,
    card_organization_types,
    regions,
    short_id
  });
});
</script>

<template>
  <CyModal
    ref="alertPreviewRef"
    width="64%"
    :centered="true"
    :title="$t('alerts.create-alert.publish-alert')"
    class="alert-submit__preview"
    :modalAppendToBody="true"
    :modalStyle="{ height: '74%' }"
    :footer="true"
    v-bind="testId()"
    @close="emit('close')"
  >
    <template #modal-title>
      <h4>{{ $t('alerts.create-alert.publish-alert') }}</h4>
      <p class="cyw-color-N700 cyw-text-f14 cyw-py-2" v-bind="testId('header-count')">
        {{ state.stats.count }} {{ state.stats.count > 1 ? 'Recipients' : 'Recipient' }}
      </p>
    </template>
    <template #modal-content>
      <CyTab type="line" v-model="state.activeTab" :data="state.tabList" v-bind="testId()"> </CyTab>
      <div v-if="state.activeTab === 'alertdetails'" class="cyw-pb-5 alert-submit__content">
        <alert-details
          :details="{
            ...alertFormData,
            modified: alertFormData.modified,
            created: alertFormData.created / 1000
          }"
          mode="create"
          v-bind="testId()"
        />
      </div>

      <div v-else class="alert-submit__content">
        <SendingOptions :stats="state.stats" :data="alertFormData" preview v-bind="testId()" />
      </div>
    </template>
    <template #modal-footer>
      <div class="cyw-flex-justify-end">
        <div class="cyw-flex-align-center">
          <cy-button type="tertiary" subtype="subtle" v-bind="testId('cancel')" @click="onCancel">
            {{ $t('alerts.publish-alert-pop-up.go-back-to-editing-button') }}
          </cy-button>
          <cy-button v-bind="testId('publish')" @click="onSubmit" :loading="state.submitting">
            {{ $t('alerts.buttons.publish') }}
          </cy-button>
        </div>
      </div>
    </template>
  </CyModal>
</template>
<style lang="scss">
.alert-submit {
  &__preview {
    .cyw-modal-panel {
      height: calc(100% - 5.1rem);
    }
  }
  &__content {
    height: calc(100% - 11rem);
    overflow-y: auto;
  }
}
</style>

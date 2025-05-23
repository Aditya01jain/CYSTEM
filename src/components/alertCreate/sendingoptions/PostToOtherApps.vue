<script setup lang="ts">
import { reactive, computed, onMounted, watch, nextTick, ref } from 'vue';
import { THIRD_PARTY_APPS } from './config';
import { MS_TEAMS_RULE } from './rules';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import InputUserDropdown from '@/components/common/InputUserDropdown.vue';
import store from '@/store';
import { isEmpty } from 'lodash';
import { initTestId } from '@/utils/testid';
import { useI18n } from 'vue-i18n';

const testId = initTestId('ac', 'post-other-apps');
const { updateAlertFormStore } = useAlertBasicsData();
const { isFlagAccessableToTenant, isPermittedToMe } = useCommonData();
const { t: $t } = useI18n();
const props = defineProps({
  disabled: {
    default: false
  }
});

const postToOtherAppsFormRef = ref();

const state = reactive({
  model: {
    post_threat_stream: false
  } as Record<string, any>,

  apps: THIRD_PARTY_APPS($t).filter((item) => {
    if (item.flag === 'tconnect') {
      return isPermittedToMe('view', item.flag) && store.getters['common/getUserDetails']?.tconnect;
    }
    return isFlagAccessableToTenant(item.flag) || isPermittedToMe('view', item.flag);
  }) as Record<string, any>[]
});

const alertData = computed(() => store.getters['alertCreate/getAlertFormData']);

const validate = computed(() => store.getters['alertCreate/getFormValid']?.['sending']?.validate);

const tlpConfig = computed(
  () => store.getters['alertCreate/getAlertFormListData']?.['tlp-config-data'] || {}
);

const updatePostToOtherApps = (key: string, value: boolean) => {
  if (key === 'ms_teams') {
    if (!value) {
      state.model['webhooks'] = null;
      updateAlertFormStore('webhooks', null);
    } else return;
  }
  updateAlertFormStore(key, value);
};

const updateCtixFlag = () => {
  const tlp = alertData.value.tlp;
  if (!isPermittedToMe('view', 'tlp_email_config')) return;

  const tlpConf: Record<string, any> =
    Object.values(tlpConfig.value)?.find((config: any) => config.tlp === tlp) || {};

  if (!isEmpty(tlpConf)) {
    const postToCtixKey = alertData.value.card_intel_source?.length
      ? 'post_to_ctix_from_intel'
      : 'post_to_ctix_from_alert';

    state.model['post_ctix'] = tlpConf[postToCtixKey];
    updateAlertFormStore('post_ctix', tlpConf[postToCtixKey]);
  }
};

onMounted(() => {
  if (state.model['post_ctix'] === undefined || state.model['post_ctix'] === null) updateCtixFlag();
  state.apps.forEach((item) => {
    state.model[item.model_param] = alertData.value?.[item.model_param];
    if (item.channelConfig?.modelKey) {
      state.model[item.model_param] = !isEmpty(alertData.value?.[item.channelConfig?.modelKey]);
      state.model[item.channelConfig?.modelKey] = alertData.value?.[item.channelConfig?.modelKey];
    }
  });
});

function validateChannels() {
  if (state.model['ms_teams']) {
    postToOtherAppsFormRef.value?.validate((valid: boolean) => {
      store.dispatch('alertCreate/setFormValid', {
        sending: { 'post-to-other-apps': valid }
      });
    });
  } else {
    postToOtherAppsFormRef.value?.clearValidate();
    store.dispatch('alertCreate/setFormValid', {
      sending: { 'post-to-other-apps': true }
    });
  }
}

watch(
  () => alertData.value.tlp,
  () => updateCtixFlag()
);

watch(
  () => validate.value,
  (val) => {
    if (val) validateChannels();
  }
);
</script>

<template>
  <el-form @submit.prevent :model="state.model" ref="postToOtherAppsFormRef">
    <div v-for="app in state.apps" :key="app.flag">
      <div class="cyw-flex-align-center">
        <cy-checkbox
          v-bind="testId(`${app.model_param}`)"
          v-model="state.model[app.model_param]"
          @update:modelValue="updatePostToOtherApps(app.model_param, $event)"
          :disabled="props.disabled"
        />
        <div class="cyw-text-f14 cyw-text-medium cyw-ml-4">{{ app.title }}</div>
      </div>
      <el-form-item
        v-if="app.channelConfig && state.model[app.model_param]"
        class="cyw-mb-4"
        prop="webhooks"
        :rules="MS_TEAMS_RULE($t)"
        v-bind="testId('form-item')"
      >
        <InputUserDropdown
          v-model="state.model[app.channelConfig.modelKey]"
          :label="app.channelConfig.label"
          :field-name="app.channelConfig.label"
          multiple
          link="/admin/webhook/ms_teams/"
          :valueIdentifier="app.channelConfig.labelIdentifier"
          :identifier="app.channelConfig.valueIdentifier"
          :search-identifier="app.channelConfig.labelIdentifier"
          :disabled="props.disabled"
          class="cyw-mt-3"
          v-bind="testId()"
          @update:modelValue="updatePostToOtherApps(app?.channelConfig?.modelKey, $event)"
        />
      </el-form-item>
    </div>
  </el-form>
</template>

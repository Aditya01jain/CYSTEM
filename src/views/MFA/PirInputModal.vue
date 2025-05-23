<script setup lang="ts">
import { computed, onMounted } from 'vue';
import store from '@/store';
import Cookies from '@/services/Cookies';
import { baseUrl } from '@/shared/utils';
import { initApp } from 'mfa-pir/mfaConnector';
import pirInput from 'mfa-pir/pirInput';
import { useCommonData } from '@/composables/useCommonData';

const emit = defineEmits(['update:modelValue', 'selected']);
const { isComponentAccessableToMe, setToasterMsg } = useCommonData();

const props = defineProps({
  modelValue: { default: [], type: Array<Object> },
  selectedPirs: { default: [], type: Array<Object> },
  alertId: { default: '', type: String },
  isPreview: { default: false, type: Boolean },
  mode: { default: 'DRAFT' },
  dataTestid: { default: '', type: String }
});

const userDetails = computed(() => {
  return store.getters['common/getUserDetails'] || {};
});

const defaultPageSize = computed(() => {
  return store.getters['common/getDefaultPageSize'];
})

function onModelValueChange(event: any) {
  emit('update:modelValue', event?.map((item: Record<string, any>) => item.id) || []);
  emit('selected', event);
}

const init = () =>
  initApp('mfa-pir-table', {
    apiServices: {
      pir: {
        baseUrl: baseUrl(),
        slug: import.meta.env.VITE_PIR_API_SLUG,
        tokenKey: Cookies.tokenKey(),
        tokenPrefix: 'Token'
      }
    },
    component: pirInput,
    props: {
      mode: props.mode,
      alertId: props.alertId,
      selectedPirs: props.selectedPirs,
      dataTestid: props.dataTestid,
      isPreview: props.isPreview,
      defaultPageSize: defaultPageSize.value,
      parentFunctions: { onModelValueChange: onModelValueChange },
      data: {
        tenantDetails: {
          telemetry_token: userDetails.value?.tenant?.telemetry_token,
          tenant_name: userDetails.value?.tenant?.tenant_name
        },
        userDetails: {
          user_id: userDetails.value?.user_id
        },
        analytics: {
          section: 'PIR',
          prefix: 'CSAP-analyst'
        }
      }
    }
  });

onMounted(async () => {
  const status = await isComponentAccessableToMe('intelligence-requirements');
  if (!status) {
    setToasterMsg('error', {
      title: 'Permission Denied',
      message: 'You Dont have permission to access this module'
    });
    return;
  }
  init();
});
</script>
<template>
  <div id="mfa-pir-table"></div>
</template>

<style lang="scss">
#mfa-pir-table {
  height: 100%;
}
</style>

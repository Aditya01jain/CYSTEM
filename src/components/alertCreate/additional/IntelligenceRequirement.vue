<script setup lang="ts">
import { reactive, computed, onMounted, onBeforeMount } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import PirInputModal from '@/views/MFA/PirInputModal.vue';
import store from '@/store';

import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'intelligence-requirement');
const props = defineProps({ componentKey: { default: '', type: String } });

const { isComponentAccessableToMe } = useCommonData();
const { updateAlertFormStore } = useAlertBasicsData();
const state = reactive({
  localIRModel: [] as Record<string, any>[],
  localSelectedIrs: [] as Record<string, any>[]
});

const model = computed(() => {
  return store.getters['alertCreate/getAlertFormData'];
});

const onChange = (event: Array<any>) => {
  state.localIRModel = event;
  updateAlertFormStore('pirs', state.localIRModel);
};

const updatelocalSelectedIrs = (event: any) => {
  store.dispatch('alertCreate/setAlertFormListData', {
    key: 'pirs',
    value: event
  });
  state.localSelectedIrs = event;
};

onMounted(() => {
  state.localSelectedIrs = store.getters['alertCreate/getAlertFormListData'].pirs || [];
});

onBeforeMount(() => {
  store.dispatch('alertCreate/setAlertFormListData', { key: 'pirs', value: [] });
  state.localSelectedIrs = [];
});
</script>
<template>
  <PirInputModal
    v-if="isComponentAccessableToMe('intelligence-requirements')"
    @update:model-value="onChange"
    @selected="updatelocalSelectedIrs"
    :selectedPirs="state.localSelectedIrs"
    :model-value="state.localIRModel"
    v-bind="testId()"
    :alertId="model.short_id ?? model.copied_short_id"
  />
</template>

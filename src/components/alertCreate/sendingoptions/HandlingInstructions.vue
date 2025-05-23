<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';

import { useStore } from '@/store';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'handling-instructions');

const store: Record<string, any> = useStore();

const { fetchHandlingInstructions, updateAlertFormStore } = useAlertBasicsData();

const ALERT_KEY = 'special_flag';

const state = reactive({
  model: [] as string[]
});

const getHandlingData = computed(() => {
  return store.getters['alertCreate/getAlertFormListData']['handling-instructions'] || [];
});

const updateHandlingInstructions = (handling: Record<string, any>, value: boolean) => {
  if (value) state.model.push(handling.special_flag_id);
  else {
    const targetIndex = state.model.findIndex((item: string) => item === handling.special_flag_id);
    if (targetIndex !== -1) state.model.splice(targetIndex, 1);
  }
  let specialFlags: Record<string, any>[] = [];
  state.model.forEach((flag_id: string) => {
    const flag = getHandlingData.value.find(
      (item: Record<string, any>) => item.special_flag_id === flag_id
    );
    specialFlags.push(flag);
  });
  updateAlertFormStore(ALERT_KEY, specialFlags);
};

onMounted(() => {
  fetchHandlingInstructions();
  const data = store.getters['alertCreate/getAlertFormData'][ALERT_KEY];
  state.model = data?.map((item) => item.special_flag_id) || [];
});
</script>

<template>
  <div class="accordion--content__scroll">
    <div v-for="handling in getHandlingData" :key="handling.special_flag_id" class="cyw-flex-start">
      <cy-checkbox
        v-bind="testId(`${handling.special_flag_id}`)"
        :modelValue="state.model?.includes(handling.special_flag_id)"
        @update:modelValue="updateHandlingInstructions(handling, $event)"
        class="cyw-mt-2"
      >
        <div class="cyw-flex-col cyw-ml-2">
          <cy-tooltip placement="top-end">
            <div v-bind="testId(`${handling.special_flag_id}`)" class="cyw-text-f14">
              {{ handling.special_flag_name }}
            </div>
            <template #content>
              <div class="cyw-text-f12 cyw-text-medium cyw-color-N10">
                <CySanitizeHtml v-bind="testId(`${handling.special_flag_id}-def`)" :text="handling.special_flag_definition" />
              </div>
            </template>
          </cy-tooltip>
        </div>
      </cy-checkbox>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';

import { useStore } from '@/store';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'share-with-communities');
const store: Record<string, any> = useStore();

const { updateAlertFormStore, fetchSharingRules } = useAlertBasicsData();

const COMMUNITY_SHARING_VALUES = ref({
  NEVER_SHARE: 0,
  ALREADY_SHARED: 1,
  CAN_BE_SHARED: -1
});

const props = defineProps({
  disabled: {
    default: false,
    type: Boolean
  },
  onPage: {
    default: false,
    type: Boolean
  }
});

const state = reactive({
  model: [] as string[],
  selectAll: false,
  communityRules: {} as any
});

const getSharingCommunities = computed(() => store.getters['common/getCommunitySharing'] || []);

const updateStore = () => {
  const specialFlags = state.model
    ?.map((key_id: string) =>
      getSharingCommunities.value?.find((item: Record<string, any>) => item.key_id === key_id)
    )
    ?.filter(Boolean);
  updateAlertFormStore('sharing_community', specialFlags);
};

const updateCommunitySharing = (app: Record<string, any>, value: boolean) => {
  if (value) state.model?.push(app.key_id);
  else {
    const targetIndex = state.model?.findIndex((item: string) => item === app.key_id);
    if (targetIndex !== -1) state.model?.splice(targetIndex, 1);
  }
  state.selectAll = state.model?.length === getSharingCommunities.value?.length;
};

const onSelectAll = (value: boolean) => {
  state.selectAll = value;

  if (value) {
    state.model = getSharingCommunities.value?.map((app: any) => app.key_id);
  } else state.model = [];
  updateStore();
};

onMounted(() => {
  state.model = [
    ...(store.getters['alertCreate/getAlertFormData']['sharing_community']?.map(
      (item: Record<string, any>) => item.key_id
    ) || [])
  ];
  updateStore();
});

watch(
  () => props.onPage,
  async (val) => {
    if (
      val &&
      !['SUBMITTED', 'SCHEDULED', 'PUBLISHED'].includes(
        store.getters['alertCreate/getAlertFormData']?.status
      )
    )
      state.communityRules = await fetchSharingRules();
    state.model = [
      ...state.model,
      ...(Object.keys(state.communityRules)?.filter(
        (key) => state.communityRules[key] === COMMUNITY_SHARING_VALUES.value.ALREADY_SHARED
      ) || [])
    ];
    state.selectAll = state.model?.length === getSharingCommunities.value?.length;
    updateStore();
  }
);
</script>

<template>
  <div class="accordion--content__scroll">
    <div class="cyw-flex-align-center">
      <CyCheckbox
        v-bind="testId('seleted-all')"
        :disabled="props.disabled"
        :model-value="state.selectAll"
        @update:model-value="onSelectAll"
      />
      <div class="cyw-text-f14 cyw-text-medium cyw-ml-4">Select All</div>
    </div>
    <div v-for="app in getSharingCommunities" :key="app.key_id" class="cyw-flex-align-center">
      <CyCheckbox
        v-bind="testId(`${app.key_id}`)"
        :modelValue="state.model?.includes(app.key_id)"
        :disabled="
          props.disabled ||
          state.communityRules?.[app.key_id] === COMMUNITY_SHARING_VALUES.NEVER_SHARE
        "
        @update:modelValue="
          updateCommunitySharing(app, $event);
          updateStore();
        "
      ></CyCheckbox>
      <div class="cyw-text-f14 cyw-text-medium cyw-ml-4">
        {{ app.app_name }}
      </div>
    </div>
  </div>
</template>

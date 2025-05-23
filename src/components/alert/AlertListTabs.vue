<script setup lang="ts">
import { ALERT_TAB_LIST } from './config';
import { reactive, computed } from 'vue';
import { useStore } from '@/store';
import { useCommonData } from '@/composables/useCommonData';
import { initTestId } from '@/utils/testid';
const testId = initTestId('al');
const store: Record<string, any> = useStore();
const { isPermittedToMe } = useCommonData();

const props = defineProps({
  badgeCountData: {
    default: () => {},
    type: Object
  }
});

// reactive state
const state = reactive({
  activeTab: 'alerts' as string,
  countDataMap: {
    alerts: 'alert',
    incident: 'intel',
    rfi: 'rfi'
  } as Record<string, string>
});

const tabsList = computed(() => {
  let filteredTabs = ALERT_TAB_LIST.filter((tab) => isPermittedToMe('view', tab.permissions));
  filteredTabs = filteredTabs.map((tab: Record<string, any>) => {
    tab['count'] = props.badgeCountData?.[state.countDataMap[tab.id]] || 0;
    return tab;
  });
  return filteredTabs;
});

const onListTabChange = () => {
  store.dispatch('alert/removeAllFilter');
  emit('change:tab', state.activeTab);
};

const emit = defineEmits(['change:tab']);
</script>

<template>
  <cy-tab
    v-model="state.activeTab"
    :data="tabsList"
    v-bind="testId()"
    @update:modelValue="onListTabChange"
  >
    <template #title-suffix="{ tab }">
      <div
        v-if="tab?.count"
        class="cyw-flex-center cyw-px-3 cyw-ml-2 cyw-text-f10 cyw-round-circle cyw-bg-P600 cyw-color-N10"
      >
        {{ tab?.count }}
      </div>
    </template>
  </cy-tab>
</template>

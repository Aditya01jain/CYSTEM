<script setup lang="ts">
import { onMounted, reactive, inject, ref } from 'vue';
import { useStore } from '@/store';
import { useCommonData } from '@/composables/useCommonData';
import { initTestId } from '@/utils/testid';
const testId = initTestId('al');
const { setToasterMsg } = useCommonData();
const store: Record<string, any> = useStore();
const $api: any = inject('$api');
const emit = defineEmits(['refresh']);

const channelTabRef: any = ref();

// reactive state
const state = reactive({
  activeChannel: '' as string,
  channelLoading: true as boolean,
  channelList: [] as Record<string, any>[]
});

const fetchAlertChannels = async () => {
  try {
    state.channelLoading = true;
    const response = await $api.get('analyst.channels', {
      params: { is_active: true }
    });
    state.channelList = response.data.data.map((item: any) => {
      item.id = item.tab_id;
      item.title = item.display_name;
      return item;
    });
  } catch (error: any) {
    setToasterMsg('error', {
      title: 'error',
      message: error.error?.detail
    });
  } finally {
    state.channelLoading = false;
  }
};

const setActiveChannel = (tab_id: string) => {
  state.activeChannel = tab_id;
  store.dispatch('alert/setFilter', { tab_id: state.activeChannel });
};

const onChannelChange = (tab_id: string) => {
  setActiveChannel(tab_id);
  emit('refresh');
};

onMounted(async () => {
  await fetchAlertChannels();
  const filters = store.getters['alert/getFilters'];
  if (state.channelList?.length && filters?.tab_id) {
    const index = state.channelList?.findIndex(
      (item: Record<string, any>) => item?.tab_id === filters.tab_id
    );
    if (index > -1) channelTabRef.value?.onTabClick(index, state.channelList[index]);
  } else if (state.channelList?.length) setActiveChannel(state.channelList[0]?.tab_id);
  emit('refresh');
});
</script>

<template>
  <div v-if="state.channelLoading">
    <CyShimmer type="single"></CyShimmer>
    <CyShimmer type="single"></CyShimmer>
  </div>
  <div v-if="state.channelList?.length" class="cyw-bg-N50">
    <cy-tab
      ref="channelTabRef"
      :data="state.channelList"
      moreTab
      id="alert-channels"
      v-bind="testId('channels')"
      class="alert-channels"
      :moreTabConfig="{ dependentId: 'alert-channels' }"
      @update:modelValue="onChannelChange"
    ></cy-tab>
  </div>
</template>

<style lang="scss" scoped>
.alert-channels {
  width: calc(100% - 15rem);
}
</style>

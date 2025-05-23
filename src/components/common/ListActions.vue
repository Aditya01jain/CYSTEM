<script setup lang="ts">
import { useStore } from '@/store';
import { computed, reactive, inject } from 'vue';

const store: Record<string, any> = useStore();
const emit = defineEmits(['refresh']);
const props = defineProps({
  exportOptions: {
    default: [
      {
        label: 'Export as CSV',
        key: 'csv'
      }
    ]
  },
  exportLink: {
    default: ''
  }
});
const $api: any = inject('$api');
const $notify: any = inject('$notify');

const state = reactive({
  exportLoading: false as boolean
});

const exportFilters = computed(() => {
  return store.getters['alert/getFilters'];
});

const onRefreshClick = () => {
  emit('refresh');
};

const onExportClick = async (key: string) => {
  state.exportLoading = true;
  try {
    const { data } = await $api.get(props.exportLink, {
      params: { ...exportFilters.value },
      id: key
    });
    $notify.success({
      title: data.detail.title,
      message: data.detail.msg
    });
  } catch {
    //
  } finally {
    state.exportLoading = false;
  }
};
</script>

<template>
  <div class="cyw-flex cyw-flex-align-center list-actions__height">
    <CyIconShell size="md" @click="onRefreshClick">
      <CyIcon icon="fa-regular fa-rotate-right" />
    </CyIconShell>
    <CyDropdown v-if="props.exportOptions?.length">
      <template #dropdown-link>
        <cy-spinner v-if="state.exportLoading" size="1.5" class="cyw-mx-3" />
        <CyIconShell v-else size="md">
          <CyIcon icon="fa-regular fa-arrow-up-to-line" />
        </CyIconShell>
      </template>
      <template #dropdown>
        <div class="cyw-flex-column">
          <div
            v-for="(option, index) in props.exportOptions"
            :key="index"
            class="cyw-py-2"
            @click="onExportClick(option.key)"
          >
            <CySelectOption>{{ option.label }}</CySelectOption>
          </div>
        </div>
      </template>
    </CyDropdown>
  </div>
</template>
<style lang="scss" scoped>
.list-actions {
  &__height {
    height: 4rem;
  }
}
</style>

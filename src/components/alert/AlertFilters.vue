<script setup lang="ts">
import { reactive, inject, ref, onBeforeMount, onMounted, nextTick } from 'vue';
import { useStore } from '@/store';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { ALERT_FILTERS } from './config';
import { useI18n } from 'vue-i18n';
import { defaultDateFilter } from '@/utils';
import { isEmpty, debounce } from 'lodash';
import { initTestId } from '@/utils/testid';
const testId = initTestId('al');
const { t: $t } = useI18n();

const { fetchFilters, fetchOptions } = useAlertBasicsData();
const store: Record<string, any> = useStore();
const $api: any = inject('$api');
const $session: any = inject('$session');
const emit = defineEmits(['refresh']);

const filterRef = ref();

const DEFAULT_FILTER = defaultDateFilter('modified_start', 'modified_end');

// reactive state
const state = reactive({
  inputString: '' as string,
  selectedCategory: null,
  filtersLoading: false,
  categoryLoading: false,
  filters: [] as Record<string, any>[],
  defaultValue: {
    ...DEFAULT_FILTER
  } as Record<string, any>
});

const onApplyFilter = (data: Record<string, any>, resetAll = false) => {
  store.dispatch('alert/removeAllFilter');
  store.dispatch('alert/setFilter', { ...data });
  emit('refresh');
};
const debouncedApplyFilter = debounce(onApplyFilter, 500);

async function setFilterValues(params: Record<string, any>) {
  const { tab_id, ...rest } = params;
  await filterRef.value?.setDefaultValues(rest);
}

onBeforeMount(async () => {
  state.filters = [...ALERT_FILTERS($t), ...(await fetchFilters('sa', true))];
});

onMounted(() => {
  let currFilter;
  if (!isEmpty(store.getters['alert/getAppliedFilters'])) {
    currFilter = store.getters['alert/getAppliedFilters'];
    store.dispatch('alert/setAppliedFilter', {});
  } else if ($session?.alertFilters?.length) {
    store.dispatch('alert/removeAllFilter');
    const filters = $session.alertFilters;
    const multiSelectMap: Record<string, any[]> = {};

    currFilter = filters
      .map((item: Record<string, any>) => {
        switch (item.field_type) {
          case 'daterange':
            return {
              [item.start_key]: item.value[0] / 1000,
              [item.end_key]: item.value[1] / 1000
            };

          case 'text':
            return { [item.key]: item.value };

          case 'static':
          case 'drop_down':
            if (item.sub_type === 'bool') {
              return { [item.key]: item?.value?.[item?.send] };
            } else {
              if (!multiSelectMap[item.key]) {
                multiSelectMap[item.key] = [];
              }
              multiSelectMap[item.key].push(item?.value?.[item?.send]);
            }
            break;
          default:
            return {
              [item.key]: item?.value?.[item?.send]
            };
        }
      })
      .reduce((acc, obj) => {
        return { ...acc, ...obj };
      }, {});

    currFilter = { ...currFilter, ...multiSelectMap };

  } else {
    currFilter = !isEmpty(store.getters['alert/getFilters'])
      ? store.getters['alert/getFilters']
      : state.defaultValue;
  }
  store.dispatch('alert/setFilter', { ...currFilter });
  setTimeout(() => {
    setFilterValues(currFilter);
  }, 1000);
  emit('refresh');
});

defineExpose({ setFilterValues });
</script>

<template>
  <CyFilter
    ref="filterRef"
    v-bind="testId()"
    :filters="state.filters"
    :staticFilterCount="0"
    :defaultValue="{ ...DEFAULT_FILTER }"
    :apiService="{
      api: $api.get,
      apiPrefix: 'admin/',
      getParams: (val: any, filter: Record<string,any>) => {
        return filter.filters;
      }
    }"
    class="alert-filters"
    type="pro"
    :config="{ fetchOptions }"
    @apply="debouncedApplyFilter"
  />
</template>

<style lang="scss" scoped>
.alert-filters {
  margin-right: 10rem;
}
</style>

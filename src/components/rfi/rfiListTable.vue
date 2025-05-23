<script setup lang="ts">
import { ref, reactive, onMounted, inject } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { RFI_LIST_COLUMNS, RFI_STATUS_MAP, RFI_ROW_ACTIONS, RFI_TABS } from './config';
import store from '@/store';
import { useRouter } from 'vue-router';
import { isEmpty, debounce } from 'lodash';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();

const router = useRouter();

const $api: any = inject('$api');

const { fetchRFI, createAlertFromIntel, updateAlertFormStore, fetchFilters, openAlertDetailsView } =
  useAlertBasicsData();

// defineExpose({
//   refresh: fetchData
// });

const COLUMNS = ref([...RFI_LIST_COLUMNS($t)]);
let sortModel: Record<string, any> = reactive({});

const state: any = reactive({
  pagination: {
    page: 1,
    page_size: 10
  },
  loading: false,
  total: 0,
  stats: {},
  filters: {},
  intels: [],
  selectedTab: '',
  filterOptions: [],
  openClosedColumns: COLUMNS.value.splice(0, RFI_LIST_COLUMNS?.length - 1),
  sort: {}
});

async function fetchData() {
  state.loading = true;
  let data: Record<string, any> = {};
  try {
    data = await fetchRFI({
      ...state.pagination,
      ...state.filters,
      ...(state.selectedTab != 'all' ? { status: state.selectedTab } : {}),
      ...state.sort
    });
  } catch (error) {
    //
  } finally {
    state.intels = data.results.map((obj: Record<string, any>) => ({
      ...obj,
      reported_on: obj.reported_on / 1000
    }));
    state.total = data.count;
    state.stats = data.stats;
    state.loading = false;
  }
}

const onPageChange = (page: number, size: number) => {
  state.pagination.page = page;
  state.pagination.page_size = size;
  fetchData();
};

const onRowActionClick = async (clickedAction: Record<string, any>) => {
  const data = await createAlertFromIntel({
    incident_id: clickedAction.data.incident_id,
    status: 'DRAFT'
  });
  Object.keys(data).forEach((key) => updateAlertFormStore(key, data[key] ?? null));
  store.dispatch('alert/removeAllFilter');
  router?.push({ name: 'alertCreateForm' });
};

const sortRFI = (event: Record<string, any>) => {
  sortModel = event;
  const sort = sortModel.sort.replace('reported_on', 'created');
  state.sort =
    !isEmpty(event) || sort != 'undefined'
      ? {
          sortby: sort
        }
      : {};
  fetchData();
};

const viewIntel = async () => {};

const onApplyFilter = (event: any) => {
  state.filters = event;
  fetchData();
};

const debouncedApplyFilter = debounce(onApplyFilter, 500);

onMounted(async () => {
  fetchData();
  state.selectedTab = 'all';
  state.filterOptions = await fetchFilters('rfi');
});
</script>
<template>
  <CyTab v-model="state.selectedTab" :data="RFI_TABS" @click="fetchData" class="cyw-bg-N50" />
  <div v-if="!state.intels?.length && !state.loading">
    <CyEmptyState :message="{ title: 'No RFIs Found' }" />
  </div>
  <div v-else class="cyw-border-1 cyw-p-3 cyw-bg-N10">
    <cy-filter
      :filters="state.filterOptions"
      :apiService="{
        api: $api.get,
        apiPrefix: 'admin/',
        getParams: ( _: any , filter: Record<string,any>) => filter.filters
      }"
      @apply="debouncedApplyFilter"
      @reset:all="onApplyFilter({})"
      type="pro"
    />
    <cy-table
      :key="state.selectedTab"
      :config="{
        selectable: false,
        rowIdentifier: 'incident_id',
        customizable: false
      }"
      :pagination="{
        ...state.pagination,
        pageSize: state.pagination.page_size
      }"
      row-class-name="cyw-cursor-pointer"
      :total="state.total"
      :loading="state.loading"
      :data="state.intels"
      :columns="state.selectedTab != 'all' ? state.openClosedColumns : RFI_LIST_COLUMNS($t)"
      :sort="sortModel"
      @page-change="onPageChange"
      :actions="RFI_ROW_ACTIONS"
      @action-click="onRowActionClick"
      @row-clicked="viewIntel"
      @sort-change="sortRFI"
    >
      <template #column-cell="{ row, column }">
        <div v-if="column.key === 'sa_card'">
          <a
            v-if="row[column.key]"
            class="cyw-text-underline cyw-cursor-pointer"
            @click.stop="openAlertDetailsView(row[column.key])"
            >{{ row[column.key] }}</a
          >
          <p v-else>-</p>
        </div>
        <p v-if="column.key === 'intel_media'" class="cyw-flex-justify-center">
          {{ row[column.key]?.length }}
        </p>
        <CyTag
          v-if="column.key === 'tlp'"
          :type="column.key"
          :value="row[column.key].toLowerCase()"
        >
        </CyTag>
        <CyTag
          v-else-if="column.type === 'status'"
          type="status"
          :text="row[column.key]"
          :value="RFI_STATUS_MAP[row[column.key]] || ''"
        >
        </CyTag>
        <CyDataRenderer v-else :config="column" :data="row"></CyDataRenderer>
      </template>
    </cy-table>
  </div>
</template>

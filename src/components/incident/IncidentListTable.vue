<script setup lang="ts">
import { ref, reactive, onMounted, inject, computed } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { INTEL_LIST_COLUMNS, ALERT_STATUS_MAP, INTEL_ROW_ACTIONS, INTEL_TABS } from './config';
import store from '@/store';
import { useRouter } from 'vue-router';
import { debounce, isEmpty } from 'lodash';
const router = useRouter();
const $api: any = inject('$api');

const {
  fetchIntelSubmissions,
  createAlertFromIntel,
  updateAlertFormStore,
  fetchFilters,
  openAlertDetailsView
} = useAlertBasicsData();

const props = defineProps<{
  openForm: Function;
}>();

let sortModel: Record<string, any> = reactive({});

const intelApprovalEnabled = computed(
  () => store.getters['common/getTenantDetails']?.enable_intel_approval_analyst
);

const COLUMNS = computed(() => {
  const list = [...INTEL_LIST_COLUMNS];
  return list.filter((item) => (item.key === 'status' ? intelApprovalEnabled.value : true));
});

const state = reactive({
  pagination: {
    page: 1,
    page_size: 10
  },
  sort: {},
  loading: false,
  total: 0,
  stats: {},
  filters: {},
  filterOptions: [],
  intels: [],
  selectedTab: '',
  allColumns: [...COLUMNS.value],
  openClosedColumns: [...COLUMNS.value.splice(0, COLUMNS.value?.length - 1)]
});

async function fetchData() {
  state.loading = true;
  let data: Record<string, any> = {};
  try {
    data = await fetchIntelSubmissions({
      ...state.pagination,
      ...state.filters,
      ...state.sort,
      ...(state.selectedTab != 'all' ? { status: state.selectedTab } : {})
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
  if (props.openForm) props.openForm();
  else router?.push({ name: 'alertCreateForm' });
};

const viewIntel = async () => {};

const onApplyFilter = (event: any) => {
  state.filters = event;
  fetchData();
};

const debouncedApplyFilter = debounce(onApplyFilter, 500);

const sortIncident = (event: Record<string, any>) => {
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

onMounted(async () => {
  fetchData();
  state.filterOptions = await fetchFilters('intelreport');
});
</script>
<template>
  <CyTab
    v-if="intelApprovalEnabled"
    v-model="state.selectedTab"
    :data="INTEL_TABS"
    @click="fetchData"
    class="cyw-bg-N50"
  />
  <div v-if="!state.intels?.length && !state.loading">
    <CyEmptyState :message="{ title: 'No Intels Found' }" />
  </div>
  <div v-else class="cyw-border-1 cyw-p-3 cyw-bg-N10">
    <cy-filter
      :filters="state.filterOptions"
      :apiService="{
        api: $api.get,
        apiPrefix: 'admin/',
        getParams: (_:any , filter: Record<string,any>) => filter.filters
      }"
      @apply="debouncedApplyFilter"
      @reset:all="onApplyFilter({})"
      type="pro"
    />
    <cy-table
      key="intel-list-table"
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
      :columns="
        ['all', ''].includes(state.selectedTab) ? state.allColumns : state.openClosedColumns
      "
      @page-change="onPageChange"
      :actions="INTEL_ROW_ACTIONS"
      :sort="sortModel"
      @action-click="onRowActionClick"
      @row-clicked="viewIntel"
      @sort-change="sortIncident($event)"
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
          :value="ALERT_STATUS_MAP[row[column.key]] || ''"
        >
        </CyTag>
        <CyDataRenderer v-else :config="column" :data="row"></CyDataRenderer>
      </template>
    </cy-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, inject, computed, nextTick } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { DOC_LIBRARY_LIST_COLUMNS } from '../config';
import { formatBytes, fileImage } from '@/utils';
import { debounce } from 'lodash';
import BreadCrumb from '@/components/common/BreadCrumb.vue';
import { initTestId } from '@/utils/testid';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
const { t: $t } = useI18n();
const store: Record<string, any> = useStore();

const $api: any = inject('$api');
const { fetchDocLibraryList, fetchFilters } = useAlertBasicsData();

const props = defineProps({
  showBack: {
    default: false,
    type: Boolean
  },
  dataTestid: {
    default: 'doc-lib-drawer',
    type: String
  }
});

const emit = defineEmits(['selectedFiles', 'back']);
const testId = initTestId(props.dataTestid, 'doc-library');

const state = reactive({
  docLibraryList: [] as Record<string, any>[],
  columns: DOC_LIBRARY_LIST_COLUMNS($t),
  loading: false,
  total: 0 as Number,
  pagination: {
    page: 1,
    page_size: 10
  },
  breadCrumbList: [] as Record<string, any>[],
  filters: {} as Record<string, any>,
  filterOptions: [] as Record<string, any>[],
  docId: {}
});

let sortModel: Record<string, any> = reactive({
  prop: 'modified',
  order: 'descending',
  sort: '-modified'
});

const events = reactive({ dragInit: () => null, dragEnd: () => null });

const defaultPageSize = computed(() => {
  return store.getters['common/getDefaultPageSize'];
})

async function onCancel() {
  state.breadCrumbList = [{ name: 'Doc Library' }];
  state.docId = {};
  state.filters = {};
  state.pagination = { page: 1, page_size: defaultPageSize.value  };
  state.docLibraryList = [];
  state.loading = false;
  await nextTick();
  emit('back');
}

const onPageChange = (page: number, size: number) => {
  state.pagination.page = page;
  state.pagination.page_size = size;
  fetchDocLibrary();
};

const fetchDocLibrary = async () => {
  state.loading = true;
  const data = await fetchDocLibraryList({
    ...state.pagination,
    ...state.docId,
    ...state.filters,
    ...(sortModel.sort ? { sortby: sortModel.sort } : {})
  });
  state.docLibraryList = data.data?.map((obj: Record<string, any>) => ({
    ...obj,
    modified: obj.modified / 1000
  }));
  state.total = data.count;
  state.loading = false;
};

const onRowClick = (event: Record<string, any>) => {
  if (event?.type === 'folder') {
    const { file_name, document_id } = event;
    state.breadCrumbList.push({ name: file_name, id: document_id });
    state.docId = { id: document_id };
    fetchDocLibrary();
    state.pagination.page = 1;
  } else {
    emit('selectedFiles', event);
  }
};

const onBreadCrumbClick = (docid: string, index: number) => {
  state.docId = !!docid ? { id: docid } : {};
  fetchDocLibrary();
  state.breadCrumbList.length = index + 1;
};

const onApplyFilter = (event: any) => {
  state.pagination.page = 1;
  state.filters = event;
  fetchDocLibrary();
};

const onSort = (event: Record<string, any>) => {
  sortModel = event;
  state.pagination.page = 1;
  fetchDocLibrary();
};

const debouncedApplyFilter = debounce(onApplyFilter, 500);

onMounted(async () => {
  state.breadCrumbList = [{ name: 'Doc Library' }];
  state.pagination.page_size = defaultPageSize.value;
  fetchDocLibrary();
  state.filterOptions = await fetchFilters('drive', true);
});

defineExpose({
  onCancel
});
</script>

<template>
  <Teleport to="#attachments-header">
    <div class="cyw-flex-align-center" v-bind="testId('header')">
      <CyIconShell v-if="props.showBack" size="lg" @click="onCancel()" v-bind="testId('cancel')">
        <CyIcon icon="fa-regular fa-arrow-left" />
      </CyIconShell>
      <BreadCrumb
        class="cyw-ml-3"
        :bread-crumb-list="state.breadCrumbList"
        wrapper-class="cyw-mw-100"
        v-bind="testId('current-path')"
        @bread-crumb-click="onBreadCrumbClick($event?.item?.id, $event?.index)"
      />
    </div>
  </Teleport>

  <div class="cyw-m-4">
    <cy-filter
      v-bind="testId()"
      :filters="state.filterOptions"
      :apiService="{
            api: $api?.get,
            apiPrefix: 'admin/',
            getParams: (_: any, filter: Record<string, any>) => filter?.filters
          }"
      @apply="debouncedApplyFilter"
      @reset:all="onApplyFilter({})"
      type="pro"
    />
  </div>
  <div v-if="!state.docLibraryList?.length && !state.loading">
    <CyEmptyState
      v-bind="testId()"
      :message="{ title: $t('alerts.doc-library.empty-state-title'), description: $t('alerts.doc-library.empty-state-description') }"
      class="cyw-h-100 cyw-my-5 cyw-py-5"
    />
  </div>
  <div v-else class="doc-select-table">
    <cy-table
      v-bind="testId()"
      key="doc-library-list-table"
      :config="{
        selectable: false,
        maxHeight: 300,
        rowIdentifier: 'document_id',
        customizable: false,
        showSort: false
      }"
      :pagination="{
        page: state.pagination.page,
        pageSize: state.pagination.page_size
      }"
      :loading="state.loading"
      :total="state.total"
      :data="state.docLibraryList"
      :columns="state.columns"
      :sort="sortModel"
      :events="events"
      @sort-change="onSort"
      @page-change="onPageChange"
      @row-click="onRowClick"
    >
      <template #column-cell="{ row, column, $index }">
        <div
          v-if="column.key === 'file_name'"
          class="cyw-flex-align-center"
          v-bind="testId(`${$index}-${column.key}`)"
        >
          <CyIcon :icon="fileImage(row.file_format ?? 'folder')" class="cyw-text-f20 cyw-mr-3" />
          <cy-expandable-title
            v-bind="testId(`${$index}-${column.key}`)"
            class="cyw-text-f14"
            :offset="10"
            :value="row.file_name"
            hideCopy
          />
        </div>
        <div v-else-if="column.key === 'size'" v-bind="testId(`${$index}-${column.key}`)">
          {{ row.size != 0 ? formatBytes(row.size) : '-' }}
        </div>
        <CyDataRenderer
          v-else
          :config="column"
          :data="row"
          v-bind="testId(`${$index}-${column.key}`)"
        />
      </template>
    </cy-table>
  </div>
</template>

<style lang="scss" scoped>
.doc-select-table {
  max-height: 45rem !important;
  overflow-y: auto;
}
</style>
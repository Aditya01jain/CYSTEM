<script setup lang="ts">
import { reactive, computed, ref, inject, onMounted, nextTick } from 'vue';
import { useStore } from '@/store';
import { TD_LIST_COLUMNS, TD_TABLE_COLUMNS, VIEW_TABLE_ACTIONS } from './config';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { debounce } from 'lodash';
const { updateAlertFormStore, fetchTdList, tdlFiles } = useAlertBasicsData();
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'threat-defender');
const store: Record<string, any> = useStore();
const $api: any = inject('$api');

const props = defineProps({
  disabled: {
    default: false
  }
});

const state = reactive({
  table: {
    selected: [],
    tempSelected: [],
    refreshKey: 0
  },
  filter: {},
  tdList: [],
  loading: false as boolean,
  total: 0 as Number,
  pagination: {
    page: 1,
    pageSize: 10
  }
});

const modalRef: Record<string, any> = ref();
let sortModel = reactive({});
const events = reactive({ dragInit: () => null, dragEnd: () => null });

const debouncedApplyFilter = debounce(onApplyFilter, 500);

const defaultPageSize = computed(() => {
  return store.getters['common/getDefaultPageSize'];
})

const shortId = computed(
  () =>
    store.getters['alertCreate/getAlertFormData'].short_id ||
    store.getters['alertCreate/getAlertFormData'].copied_short_id ||
    ''
);

const tdlContent = computed(() => {
  return store.getters['alertCreate/getAlertTempData']['tdl_content'] || [];
});

async function fetchData() {
  state.loading = true;
  const data = await fetchTdList({
    page: state.pagination.page,
    page_size: state.pagination.pageSize,
    ...state.filter,
    status: 10
  });
  if (data) {
    state.tdList = data.results;
    state.total = data.count;
  }
  state.loading = false;
}

function resetPagination() {
  state.pagination = {
    page: 1,
    pageSize: defaultPageSize.value
  };
}

function onPageChange(page: number, size: number) {
  state.pagination.page = page;
  state.pagination.pageSize = size;
  fetchData();
}

function onAttachTdl(selected: any) {
  state.table.selected = selected;
  updateAlertFormStore(
    'tdl_content',
    selected?.map((item: Record<string, any>) => item.id)
  );
  store.dispatch('alertCreate/setAlertTempData', { tdl_content: selected });
}

async function onApplyFilter(filter: any) {
  resetPagination();
  state.filter = filter;
  fetchData();
}

function openModal() {
  resetPagination();
  state.table.tempSelected = state.table.selected;
  fetchData();
  nextTick(() => modalRef?.value.show());
}

function onClose() {
  state.filter = {};
  state.table.tempSelected = [];
}

function onRowActionClick({ data, action }: Record<string, any>) {
  if (action === 'remove') {
    state.table.selected = state.table.selected.filter((item: any) => item.id !== data.id);
    onAttachTdl(state.table.selected);
  }
}

function disableSelection(row: Record<string, any>) {
  return (
    state.table.tempSelected?.every((item: Record<string, any>) => item.id !== row.id) &&
    state.table.tempSelected?.length >= 20
  );
}

function setInitValues() {
  state.table.selected = tdlContent.value;
}

function onAttachClick() {
  onAttachTdl(state.table.tempSelected);
  onClose();
  modalRef.value.hide();
}

onMounted(async () => {
  if (shortId.value) {
    const data = await tdlFiles({
      entity_id: shortId.value,
      entity_type: 1
    });
    state.table.selected = data?.results;
    onAttachTdl(state.table.selected);
  } else {
    setInitValues();
  }
  state.pagination.pageSize = defaultPageSize.value;
});
</script>

<template>
  <div
    v-if="!state.table.selected?.length"
    class="cyw-flex-col cyw-flex-justify-center cyw-flex-align-center"
  >
    <div v-bind="testId('note')" class="cyw-mb-3 cyw-text-f12 cyw-color-N600">
      <div class="cyw-text-center">
        {{ $t('alerts.form-interactions.attach-tdl-content') }}
      </div>
      <div class="cyw-text-center">{{ $t('alerts.create-alert.tdl-limit') }}</div>
    </div>
    <cy-button
      type="secondary"
      subtype="subtle"
      v-bind="testId('open-modal')"
      @click="openModal"
      :disabled="props.disabled"
    >
      {{ $t('alerts.form-interactions.search-tdl-content') }}
    </cy-button>
  </div>
  <div v-else>
    <div class="tdl-table-hide-header cyw-mt-n5">
      <CyTable
        v-bind="testId()"
        :config="{
          maxHeight: 200,
          selectable: false,
          customizable: false
        }"
        :data="state.table.selected"
        :columns="TD_TABLE_COLUMNS($t)"
        :actions="VIEW_TABLE_ACTIONS($t)"
        @action-click="onRowActionClick"
        ><template #column-cell="{ row, column, $index }">
          <CyTooltip
            v-if="column.key === 'id'"
            :content="row[column.key]"
            v-bind="testId(`${$index}-${column.key}`)"
          >
            <div class="cyw-text-ellipsis">
              {{ row[column.key] }}
            </div></CyTooltip
          >
          <CyDataRenderer
            v-bind="testId(`${$index}-${column.key}`)"
            v-else
            :config="column"
            :data="row"
          ></CyDataRenderer>
        </template>
      </CyTable>
    </div>
    <div class="cyw-mt-3">
      <CyButton
        type="tertiary"
        v-bind="testId('add-more')"
        @click="openModal"
        :disabled="props.disabled"
      >
        <CyIcon icon="fa-solid fa-plus" />
        {{ $t('alerts.irs-added-listing.add-more-button') }}
      </CyButton>
    </div>
  </div>
  <CyModal
    ref="modalRef"
    width="70%"
    :centered="true"
    :title="$t('alerts.form-interactions.search-tdl-content')"
    v-bind="testId()"
    modalBodyClass="tdl-select-table"
    :modalAppendToBody="true"
    :footer="true"
    @close="onClose"
  >
    <template #modal-content="{ visible }">
      <template v-if="visible">
        <div class="cyw-mb-4">
          <cy-filter
            v-bind="testId()"
            class="cyw-mt-5"
            @apply="debouncedApplyFilter"
            type="basic"
          />
        </div>
        <div class="tdl-select-table--page">
          <cy-empty-state
            v-if="!state.tdList?.length && !state.loading"
            v-bind="testId()"
            size="sm"
            class="cyw-mt-5"
            type="search"
            :message="{ title: $t('alerts.alerts-listing.empty-state-title') }"
          />
          <cy-table
            v-else
            v-bind="testId('list')"
            :key="state.table.refreshKey"
            :config="{
              maxHeight: 300,
              customizable: false,
              showBulkActions: false,
              showSort: false,
              disableCheckboxIf: (row:any) => disableSelection(row)
            }"
            :pagination="state.pagination"
            :page-size="[10, 20]"
            :loading="state.loading"
            :total="state.total"
            :data="state.tdList"
            :columns="TD_LIST_COLUMNS($t)"
            :sort="sortModel"
            :events="events"
            @sort-change="sortModel = $event"
            :defaultSelectedRows="state.table.selected"
            @page-change="onPageChange"
            @selection-change="state.table.tempSelected = $event"
          >
            <template #column-cell="{ row, column, $index }">
              <CyDataRenderer
                v-bind="testId(`list-${$index}-${column.key}`)"
                :config="column"
                :data="row"
              ></CyDataRenderer>
            </template>
          </cy-table>
        </div>
      </template>
    </template>
    <template #modal-footer>
      <div class="cyw-flex-justify-end">
        <cy-button
          v-bind="testId('cancel-attach')"
          class="cyw-mr-3"
          @click="
            onClose();
            modalRef.hide();
          "
          type="teritary"
        >
          {{ $t('alerts.buttons.cancel') }}
        </cy-button>
        <cy-button v-bind="testId('attach')" @click="onAttachClick">
          {{ $t('alerts.buttons.attach-1') }}
        </cy-button>
      </div>
    </template>
  </CyModal>
</template>
<style lang="scss">
.tdl-table-hide-header {
  .cyw-table-header__wrap {
    visibility: hidden;
  }
}
.tdl-select-table {
  height: 46rem !important;
  &--page {
    max-height: 40rem !important;
    overflow-y: auto;
  }
}
</style>

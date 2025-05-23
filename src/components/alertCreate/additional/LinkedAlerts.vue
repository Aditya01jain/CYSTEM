<script setup lang="ts">
import { reactive, onMounted, computed, ref, inject } from 'vue';
import { useStore } from '@/store';
import {
  LINKED_ALERTS_LIST_COLUMNS,
  LINKED_ALERTS_TABLE_COLUMNS,
  VIEW_TABLE_ACTIONS
} from './config';
import { ALERT_STATUS } from '../config';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { debounce } from 'lodash';
import { initTestId } from '@/utils/testid';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();

const { updateAlertFormStore, openAlertDetailsView } = useAlertBasicsData();
const testId = initTestId('ac', 'linked-alert');

const store: Record<string, any> = useStore();
const $api: any = inject('$api');

const state = reactive({
  model: {
    columns: LINKED_ALERTS_TABLE_COLUMNS($t)
  } as Record<string, any>,
  loading: false as boolean,
  alertList: [] as Record<string, any>[],
  columns: LINKED_ALERTS_LIST_COLUMNS($t),
  total: 0 as Number,
  pagination: {
    page: 1,
    pageSize: 10
  },
  activeAlertID: '' as string,
  activeAlertTitle: '' as string,
  refreshKey: 0 as number,
  filters: {} as Record<string, any>,
  sort: {},
  tempSelected: [] as Record<string, any>[]
});

const debouncedApplyFilter = debounce(onApplyFilter, 500);

const modalRef: Record<string, any> = ref();
let sortModel: Record<string, any> = reactive({});
const events = reactive({ dragInit: () => null, dragEnd: () => null });

const defaultPageSize = computed(() => {
  return store.getters['common/getDefaultPageSize'];
})

const linkedAlerts = computed(() => {
  return store.getters['alertCreate/getAlertFormData']['attach_cards'] || [];
});

const alertData = computed(() => {
  return store.getters['alertCreate/getAlertFormData'] || [];
});

const isDataEmpty = computed(() => {
  return !linkedAlerts.value?.length;
});

const getALertFilters = computed(() => {
  return { cardstatus: ALERT_STATUS.PUBLISHED };
});

function sortAlert(event: Record<string, any>) {
  sortModel = event;
  state.sort = sortModel.sort != 'undefined' ? { sortby: sortModel.sort } : {};
  fetchAlertList(true);
}

async function fetchAlertList(resetPage = true) {
  state.loading = true;
  if (resetPage) resetPagination();
  try {
    const response = await $api.get('analyst.linkedAlertsList', {
      params: {
        ...getALertFilters.value,
        ...state.filters,
        ...{
          page: state.pagination.page,
          page_size: state.pagination.pageSize
        },
        ...state.sort,
        ...(alertData.value?.short_id ? { exclude_card: alertData.value?.short_id } : {})
      }
    });
    state.alertList = response.data.data.map((alert: { modified: number }) => ({
      ...alert,
      modified: alert.modified / 1000
    }));

    state.total = response.data.count;
  } catch {
    //
  } finally {
    state.loading = false;
  }
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
  fetchAlertList(false);
}

function onAttachCards(selected: any) {
  state.model.attach_cards = selected;
  updateAlertFormStore('attach_cards', selected);
}

function onRowActionClick({ data, action }: Record<string, any>) {
  if (action === 'remove') {
    state.model.attach_cards = [
      ...state.model.attach_cards.filter(
        (alert: Record<string, any>) => alert.short_id !== data.short_id
      )
    ];
    onAttachCards(state.model.attach_cards);
  }
}

function refreshList() {
  state.refreshKey++;
  fetchAlertList();
}

function setInitValues() {
  state.model.attach_cards = linkedAlerts.value;
}

function onCancel() {
  state.filters = {};
  state.tempSelected = [];
}

function openModal() {
  resetPagination();
  fetchAlertList();
  modalRef?.value.show();
  state.tempSelected = state.model.attach_cards;
}

function onApplyFilter(event: any) {
  state.filters = { searchCards: event.q ? event.q : '' };
  fetchAlertList();
}

function onAttachClick() {
  onAttachCards(state.tempSelected);
  onCancel();
  modalRef.value.hide();
}

onMounted(() => {
  setInitValues();
  state.pagination.pageSize = defaultPageSize.value;
});

defineExpose({
  refresh: refreshList
});
</script>

<template>
  <div v-if="isDataEmpty" class="cyw-flex-col cyw-flex-justify-center cyw-flex-align-center">
    <div class="cyw-mb-3">
      {{ 'Link historical alerts that are associated with your information' }}
    </div>
    <cy-button v-bind="testId('open-modal')" type="secondary" subtype="subtle" @click="openModal">
      {{ $t('alerts.form-interactions.search-alerts') }}
    </cy-button>
  </div>
  <div v-else id="linked-alert-table">
    <cy-table
      v-bind="testId('list')"
      key="linked-alerts-list-table"
      :config="{
        selectable: false,
        rowIdentifier: 'short_id',
        customizable: false,
        showSort: false
      }"
      :data="state.model.attach_cards"
      :columns="state.model.columns"
      :events="events"
      :actions="VIEW_TABLE_ACTIONS($t)"
      @action-click="onRowActionClick"
    >
      <template #column-cell="{ row, column, $index }">
        <a
          v-if="column.key === 'short_id'"
          v-bind="testId(`${$index}-${column.key}`)"
          class="cyw-text-underline cyw-text-f12 cyw-text-bold cyw-cursor-pointer"
          @click="openAlertDetailsView(row[column.key])"
        >
          {{ row[column.key] }}
        </a>
        <div v-else-if="column.key === 'title'">
          <cy-expandable-title
            v-bind="testId(`${$index}-${column.key}`)"
            :value="row[column.key]"
            hideCopy
          />
        </div>
      </template>
    </cy-table>
    <div class="cyw-mt-3">
      <CyButton v-bind="testId('add-more')" type="tertiary" @click="openModal">
        <CyIcon icon="fa-solid fa-plus" />
        {{ $t('alerts.irs-added-listing.add-more-button') }}
      </CyButton>
    </div>
  </div>
  <CyModal
    v-bind="testId()"
    ref="modalRef"
    width="70%"
    :centered="true"
    :title="$t('alerts.form-interactions.linked-alerts')"
    :modalAppendToBody="true"
    modalBodyClass="linked-alert-select-table"
    :footer="true"
    @close="onCancel"
  >
    <template #modal-content="{ visible }">
      <template v-if="visible">
        <cy-filter v-bind="testId()" class="cyw-mt-5" @apply="debouncedApplyFilter" type="basic" />

        <div class="linked-alert-select-table--page">
          <div v-if="!state.alertList?.length && !state.loading">
            <CyEmptyState
              v-bind="testId()"
              :message="{ title: 'No Alerts Found' }"
              class="cyw-h-100 cyw-my-5 cyw-py-5"
            />
          </div>
          <div v-else>
            <cy-table
              v-bind="testId('modal-list')"
              :config="{
                maxHeight: 300,
                rowIdentifier: 'short_id',
                customizable: false,
                showBulkActions: false
              }"
              :pagination="state.pagination"
              :loading="state.loading"
              :total="state.total"
              :data="state.alertList"
              :columns="state.columns"
              :sort="sortModel"
              :events="events"
              @sort-change="sortAlert($event)"
              :defaultSelectedRows="state.model.attach_cards"
              @page-change="onPageChange"
              @selection-change="state.tempSelected = $event"
            >
              <template #column-cell="{ row, column, $index }">
                <a
                  v-if="column.key === 'short_id'"
                  v-bind="testId(`modal-list-${$index}-${column.key}`)"
                  class="cyw-text-underline cyw-text-f12 cyw-text-bold cyw-cursor-pointer"
                  @click="openAlertDetailsView(row[column.key])"
                >
                  {{ row[column.key] }}
                </a>
                <CyDataRenderer
                  v-else
                  v-bind="testId(`modal-list-${$index}-${column.key}`)"
                  :config="column"
                  :data="row"
                ></CyDataRenderer>
              </template>
            </cy-table>
          </div>
        </div>
      </template>
    </template>
    <template #modal-footer>
      <div class="cyw-flex-justify-end">
        <cy-button
          v-bind="testId('cancel-attach')"
          class="cyw-mr-3"
          @click="
            onCancel();
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
#linked-alert-table {
  .cyw-table-header__wrap {
    display: none; // will remove this once fixed in CYFA
  }
  section.cyw-table {
    max-height: 30rem;
    overflow: auto;
  }
}
.linked-alert-select-table {
  height: 50rem !important;
  &--page {
    max-height: 40rem !important;
    overflow-y: auto;
  }
}
</style>

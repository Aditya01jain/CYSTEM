<script setup lang="ts">
import { onMounted, ref, reactive, inject, computed, nextTick, shallowRef } from 'vue';
import { useStore } from '@/store';
import { useRouter } from 'vue-router';
import {
  ALERT_LIST_COLUMNS,
  ALERT_STATUS_MAP,
  ALERT_ROW_ACTIONS,
  ALERT_BULK_ACTIONS
} from './config';
import AlertChannelFilters from '@/components/alert/AlertChannelFilters.vue';
import AlertFilters from '@/components/alert//AlertFilters.vue';
import AlertDetailsModal from '@/components/alert/AlertDetailsModal.vue';
import TableRowActions from '@/components/common/TableRowActions.vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import { copyToClipBoard, trimComments } from '@/utils';
import FileSaver from 'file-saver';
import moment from 'moment';
import { ALERT_LOCKED_MESSAGE } from '@/utils/config';
import { useI18n } from 'vue-i18n';
import { initTestId } from '@/utils/testid';
import { EXPIRE_ALERT_MSG, BULK_EXPIRE_ALERT_MSG } from '@/utils/config';
const { setToasterMsg } = useCommonData();
const $notify: any = inject('$notify');
const router = useRouter();
const store: Record<string, any> = useStore();
const $session: any = inject('$session');
const { t: $t } = useI18n();
const testId = initTestId('al');
const {
  fetchAlerts,
  expireAlert,
  fetchAlertData,
  lockAlert,
  sendRemainder,
  exportAlertFromTable,
  fetchMCLStatement,
  alertsBulkAction
} = useAlertBasicsData();
const props = defineProps<{
  openForm: Function;
}>();
// reactive state
const state = reactive({
  loading: false as boolean,
  alertList: [] as Record<string, any>[],
  columns: ALERT_LIST_COLUMNS($t),
  total: 0 as Number,
  pagination: {
    page: 1,
    pageSize: 10
  },
  activeAlertID: '' as string,
  activeAlertTitle: '' as string,
  activeAlertData: {} as Record<string, any>,
  communityAlertId: '' as string,
  selectedAlerts: [] as Record<string, any>[]
});
const alertDetailsModalRef: Record<string, any> = ref(null);
const communitySharingRef: any = ref();
const alertFilterRef: any = ref();
const expireAlerteRef: any = shallowRef();
const bulkExpireAlerteRef: any = shallowRef();
const alertTableRef: any = shallowRef();
const dialogVisible = ref(false);
const emit = defineEmits(['alert:locked', 'form:loading']);
let sortModel: Record<string, any> = reactive({
  prop: 'modified',
  order: 'descending',
  sort: '-modified'
});
const events = reactive({ dragInit: () => null, dragEnd: () => null });
const getAlertList = computed(() => {
  return store.getters['alert/getList']('alert-list') || [];
});
const getAlertFilters = computed(() => {
  return store.getters['alert/getFilters'];
});
const userDetails = computed(() => {
  return store.getters['common/getUserDetails'];
});
const defaultPageSize = computed(() => {
  return store.getters['common/getDefaultPageSize'];
})
const sortAlert = (event: Record<string, any>) => {
  sortModel = event;
  fetchAlertList(true);
};
const fetchAlertList = async (resetPage = true) => {
  if (!getAlertFilters.value.tab_id) return;
  state.loading = true;
  if (resetPage) resetPagination();
  const params = {
    ...getAlertFilters.value,
    ...{ page: state.pagination.page, page_size: state.pagination.pageSize },
    ...(sortModel.sort !== 'undefined' ? { sortby: sortModel.sort } : {})
  };
  await fetchAlerts(params);
  state.alertList = getAlertList.value.data;
  state.total = getAlertList.value.count;
  state.loading = false;
};
function checkAlertLock(data: Record<string, any>) {
  const isAlertLocked = !data.editor_details
    ? false
    : data.editor_details.user.user_id !== userDetails.value.user_id;
  if (isAlertLocked) {
    emit('alert:locked', {
      message: ALERT_LOCKED_MESSAGE($t, data?.editor_details?.user?.full_name),
      data: data
    });
  } else {
    modifyAlert(data.short_id, 'edit', data.status);
  }
}
const openAlertDetails = (row: Record<string, any>) => {
  if (['DRAFT', 'SUBMITTED', 'REVERTED', 'SCHEDULED'].includes(row.status)) {
    checkAlertLock(row);
  } else {
    state.activeAlertID = row.short_id;
    state.activeAlertTitle = row.title;
    alertDetailsModalRef?.value?.show();
  }
};
const handleModalClick = (row: any) => {
  state.activeAlertData = row;
  console.log(state.activeAlertID)
  dialogVisible.value = true;
}
const closeAlertDetailsModal = () => {
  alertDetailsModalRef?.value?.hide();
  onDetailsClose();
};
const onDetailsClose = () => {
  state.activeAlertID = '';
  state.activeAlertTitle = '';
  $session?.backToListing();
};
const resetPagination = () => {
  state.pagination = {
    page: 1,
    pageSize: defaultPageSize.value
  };
};
const onPageChange = (page: number, size: number) => {
  state.pagination.page = page;
  state.pagination.pageSize = size;
  fetchAlertList(false);
};
const onRowActionClick = async ({ data, action }: Record<string, any>) => {
  const { protocol, host } = window.location;
  switch (action) {
    case 'view':
      openAlertDetails(data);
      break;
    case 'expire':
      expireAlerteRef?.value?.open({ type: 'error' }, {}, {});
      state.activeAlertID = data.short_id;
      break;
    case 'copyUrlAnalyst':
      let url = '';
      if (['DRAFT', 'SUBMITTED', 'REVERTED', 'SCHEDULED'].includes(data.status)) {
        url = `${protocol}//${host}/dashboard/situational-awareness/create/${data.short_id}`;
      } else {
        url = `${protocol}//${host}/dashboard/situational-awareness/${data.short_id}`;
      }
      $notify.success({
        title: $t('alerts.common.copied')
      });
      copyToClipBoard(url);
      break;
    case 'copyUrlMember':
      const baseUrl =
        process.env.NODE_ENV === 'development'
          ? window.origin.replace('5171', '5173') // Replace only in dev mode
          : window.origin;
      $notify.success({
        title: $t('alerts.common.copied')
      });
      const memberUrl = `${baseUrl}/webapp/user/myfeeds/${data.short_id}`;
      copyToClipBoard(memberUrl);
      break;
    case 'clone':
      modifyAlert(data.short_id, 'clone');
      break;
    case 'update':
      modifyAlert(data.short_id, 'update');
      break;
    case 'edit':
      checkAlertLock(data);
      break;
    case 'alertLocked':
      emit('alert:locked', {
        message: ALERT_LOCKED_MESSAGE($t, data?.editor_details?.user?.full_name),
        data
      });
      break;
    case 'notifyMobile':
      sendRemainder('app', data.short_id);
      break;
    case 'notifyEmail':
      sendRemainder('email', data.short_id);
      break;
    case 'communitySharing':
      state.communityAlertId = data.short_id;
      nextTick(() => communitySharingRef.value?.openModal());
      break;
    case 'onExportJson':
      const jsonData = await exportAlertFromTable('json', 'text/json;charset=utf-8', data.short_id);
      saveAlert([jsonData], 'text/json;charset=utf-8', data.short_id);
      break;
    case 'onExportXml':
      const xmlData = await exportAlertFromTable('xml', 'text/xml', data.short_id);
      saveAlert([xmlData], 'text/xml', data.short_id);
      break;
    case 'print':
      window.open(
        `${protocol}//${host}/dashboard/export/alert/pdf/${data.short_id}/?isPrintPreview=true`,
        '_blank',
        'noopener'
      );
      break;
    default:
      break;
  }
};
async function expiredAlertValue(data: any) {
  const status = await expireAlert({
    short_id: state.activeAlertID,
    status: 'EXPIRED'
  });
  if (status.success) {
    fetchAlertList();
    state.activeAlertID = '';
  }
}
async function bulkExpireAlertValue(data: any) {
  const payload = {
    action: 'expire',
    alert_ids: state.selectedAlerts
  };
  const status = await alertsBulkAction(payload);
  alertTableRef?.value?.clearSelection();
  if (status?.success) {
    setToasterMsg('success', {
      title: status.success?.detail
    });
    fetchAlertList();
    state.activeAlertID = '';
  }
}
function saveAlert(data: any, contentType: string, short_id: string) {
  const extension: string = contentType === 'text/xml' ? 'xml' : 'json';
  const dateString: string = moment().format('MMM D, YYYY');
  const fileName = `${short_id}_${dateString}.${extension}`;
  const blob: any = new Blob([data], { type: contentType });
  FileSaver.saveAs(blob, fileName);
}
async function modifyAlert(id: string, action: string, status: string = 'DRAFT') {
  const currFilter = store.getters['alert/getFilters'];
  store.dispatch('alert/setAppliedFilter', currFilter);
  emit('form:loading', true);
  let data = await fetchAlertData({ card_id: id });
  switch (action) {
    case 'clone':
      data = {
        ...trimComments(data),
        created_from_intel: false,
        copyAlertID: id,
        previous_base_card: null,
        copied_short_id: id,
        short_id: null,
        published_time: null,
        status: '',
        card_location: [],
        source_urls: data.source_urls?.filter((source: Record<string, any>) => source.url) || [],
        tactic_technique_pairs: data.tactic_technique_pairs_data,
        rfi_status: {}
      };
      break;
    case 'update':
      data = {
        ...trimComments(data),
        previous_base_card: [id],
        copied_short_id: id || '',
        short_id: null,
        published_time: null,
        card_location: [],
        source_urls: data.source_urls?.filter((source: Record<string, any>) => source.url) || [],
        tactic_technique_pairs: data.tactic_technique_pairs_data,
        status: ''
      };
      break;
    case 'edit':
      data = {
        ...data,
        ...(data.status === 'PUBLISHED' ? { update_post_published: true } : {}),
        source_urls: data.source_urls?.filter((source: Record<string, any>) => source.url) || [],
        tactic_technique_pairs: data.tactic_technique_pairs_data
      };
      const isAlertLocked = !data.editor_details
        ? false
        : data.editor_details.user.user_id !== userDetails.value.user_id;
      if (!isAlertLocked) {
        const response = await lockAlert({ short_id: id });
        data['editor_details'] = response?.editor_detail;
      }
      await fetchMCLStatement(data);
      break;
    default:
      break;
  }
  store.dispatch('alertCreate/resetAlertFormData');
  store.dispatch('alertCreate/resetAlertTempData');
  store.dispatch('alertCreate/setAlertForm', data);
  store.dispatch('alert/removeAllFilter');
  emit('form:loading', false);
  if (props.openForm) props.openForm();
  else router?.push({ name: 'alertCreateForm' });
}
const tableHeight = computed(() => {
  return screen.height - 380;
});
const onChipClick = (value: string, key: string) => {
  const appliedFilters = store.getters['alert/getFilters'];
  if (appliedFilters?.[key]?.length === 1 && appliedFilters?.[key]?.[0] === value) return; //value is multi-select filter
  store.dispatch('alert/setFilter', { [key]: [value] });
  refreshList();
};
const refreshList = () => {
  nextTick(() => {
    const filters = store.getters['alert/getFilters'];
    alertFilterRef.value.setFilterValues(filters);
    state.pagination.page = 1;
    fetchAlertList(false);
  });
};
function onChannelChange() {
  sortModel.value = {
    prop: 'modified',
    order: 'descending',
    sort: '-modified'
  };
  fetchAlertList();
}
async function onBulkApplyClick($event: any) {
  if ($event?.key == 'expire') {
    bulkExpireAlerteRef?.value?.open({ type: 'error' }, {}, {});
  }
}
function onSelectionChange(alertsSelected: Record<string, any>[], param: Record<string, any>) {
  if (alertsSelected.length) {
    state.selectedAlerts = alertsSelected?.map((alert: Record<string, any>) => {
      if (alert?.short_id) {
        return alert.short_id;
      }
    });
  }
}
onMounted(() => {
  state.loading = true;
  state.pagination.pageSize = defaultPageSize.value;
  if ($session?.alertId) {
    openAlertDetails({ short_id: $session.alertId });
  }
});
defineExpose({
  refresh: refreshList
});
</script>
<template>
  <div class="cyw-bg-N10 cyw-h-100">
    <AlertChannelFilters @refresh="onChannelChange"></AlertChannelFilters>
    <div class="cyw-p-3 cyw-border-1 alert-list--body">
      <AlertFilters ref="alertFilterRef" @refresh="fetchAlertList"></AlertFilters>
      <div v-if="!state.alertList?.length && !state.loading">
        <CyEmptyState :message="{ title: 'No Alerts Found' }" />
      </div>
      <div v-else>
        <cy-table
          v-bind="testId()"
          key="alert-list-table"
          ref="alertTableRef"
          :config="{
            selectable: true,
            rowIdentifier: 'short_id',
            customizable: false,
            maxHeight: tableHeight,
            showSort: false
          }"
          :pagination="state.pagination"
          :loading="state.loading"
          :total="state.total"
          :data="state.alertList"
          :columns="state.columns"
          :events="events"
          :sort="sortModel"
          rowClass="cyw-cursor-pointer"
          @sort-change="sortAlert($event)"
          @row-drop="state.alertList = $event?.data"
          @page-change="onPageChange"
          :actions="ALERT_BULK_ACTIONS($t)"
          @selection-change="onSelectionChange"
          @apply="onBulkApplyClick"
          @action-click="onRowActionClick"
          @row-clicked="openAlertDetails"
        >
          <template #column-cell="{ row, column, $index }">
            <div v-if="column.key === 'short_id'" v-bind="testId(`${$index}-${column.key}`)">
              {{ row[column.key] }}
            </div>
            <div v-else-if="column.key === 'title'" v-bind="testId(`${$index}-${column.key}`)">
              <CyDataRenderer
                class="cyw-d-inline"
                v-bind="testId(`${$index}-${column.key}`)"
                :config="column"
                :data="row"
              >
                <template #suffix>
                  <!-- <CyIcon class="cyw-text-f20" icon="fa-kit fa-quarterback-solid-1" /> -->
                  <cy-button type="secondary" size="md" class="cyw-mx-2" @click.stop="handleModalClick(row)">i</cy-button>
                </template> 
              </CyDataRenderer>
            </div>
            <CyTag
              v-else-if="column.key === 'tlp'"
              v-bind="testId(`${$index}-${column.key}`)"
              :type="column.key"
              isClickable
              :value="row[column.key].toLowerCase()"
              @click="onChipClick(row[column.key], 'tlp')"
            >
            </CyTag>
            <CyTag
              v-else-if="column.key === 'status'"
              v-bind="testId(`${$index}-${column.key}`)"
              type="status"
              :text="row[column.key]"
              isClickable
              :value="ALERT_STATUS_MAP[row[column.key]] || ''"
              @click="onChipClick(row[column.key], 'status')"
            >
            </CyTag>
            <div v-else-if="column.key === 'publisher' || column.key === 'card_category'">
              <div v-if="row[column.key]">
                <CyDataRenderer
                  v-bind="testId(`${$index}-${column.key}`)"
                  :config="column"
                  :data="{ [column.key]: row[column.key] }"
                />
              </div>
              <div v-else>—</div>
            </div>
            <div
              v-else-if="column.type === 'boolean'"
              v-bind="testId(`${$index}-${column.key}`)"
              class="cyw-ml-4"
            >
              <CyIcon v-if="row[column.key]" icon="fa-duotone fa-solid fa-check" />
              <CyIcon v-else icon="fa-solid fa-xmark" />
            </div>
            <div v-else-if="column.key === 'modified'">
              <CyDataRenderer
                v-bind="testId(`${$index}-${column.key}`)"
                :config="column"
                :data="{ [column.key]: row[column.key] / 1000 }"
              ></CyDataRenderer>
            </div>
            <CyDataRenderer
              v-else
              v-bind="testId(`${$index}-${column.key}`)"
              :config="column"
              :data="row"
            ></CyDataRenderer>
          </template>
          <template #actions="{ row, column }">
            <TableRowActions
              :config="ALERT_ROW_ACTIONS($t)"
              :row="row"
              :column="column"
              :testIdFn="testId"
              @click:action="onRowActionClick"
            />
          </template>
        </cy-table>
      </div>
    </div>
  </div>
  <CyModal
    v-bind="testId()"
    ref="alertDetailsModalRef"
    width="100%"
    top="0"
    :centered="false"
    :modalStyle="{ height: '100%' }"
    title="Modal Title"
    :modalAppendToBody="true"
    @close="onDetailsClose"
  >
    <template #modal-header>
      <div class="cyw-flex cyw-flex-align-center cyw-text-f14">
        <CyIconShell v-bind="testId('close')" size="md" @click="closeAlertDetailsModal">
          <CyIcon icon="fa-regular fa-arrow-left" />
        </CyIconShell>
        <span class="cyw-pl-4">Alert</span>
        <span class="cyw-px-3">/</span>
        <span label="Page">
          {{ state.activeAlertTitle }}
        </span>
      </div>
    </template>
    <template #modal-content>
      <AlertDetailsModal
        v-if="state.activeAlertID"
        :alertId="state.activeAlertID"
        @active:title="state.activeAlertTitle = $event"
      ></AlertDetailsModal>
    </template>
  </CyModal>
  <community-sharing
    v-if="!!state.communityAlertId"
    ref="communitySharingRef"
    :alertId="state.communityAlertId"
    @close="state.communityAlertId = ''"
  />
  <CyAlert
    ref="expireAlerteRef"
    v-bind="testId('expire')"
    :message="EXPIRE_ALERT_MSG($t)"
    @confirm="expiredAlertValue"
  ></CyAlert>
  <CyAlert
    ref="bulkExpireAlerteRef"
    v-bind="testId('bulkExpire')"
    :message="BULK_EXPIRE_ALERT_MSG($t)"
    @confirm="bulkExpireAlertValue"
  ></CyAlert>
  <CystemModal v-model="dialogVisible" :alert-data="state.activeAlertData"></CystemModal>
</template>
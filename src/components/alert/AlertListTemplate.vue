<script setup lang="ts">
import { onMounted, reactive, ref, inject, watch, nextTick } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import store from '@/store';
import { useRouter } from 'vue-router';
import { ALERT_TEMPLATE_COLUMNS, IMAGE_OPTIONS_MAP } from './config';
import { formatDateTime } from '@/utils';
import { debounce } from 'lodash';
import { initTestId } from '@/utils/testid';
import { useI18n } from 'vue-i18n';

const testId = initTestId('al', 'template');

const $api: any = inject('$api');
const router = useRouter();
const { t: $t } = useI18n();

const { fetchAlertCategories, fetchFilters, fetchAlertTemplate, updateAlertFormStore } =
  useAlertBasicsData();

const emit = defineEmits(['close']);

const props = defineProps({
  showModal: {
    default: false,
    type: Boolean
  },
  openForm: {
    type: Function
  }
});

const state = reactive({
  total: 0,
  pagination: { page: 1, pageSize: 10 },
  filter: {},
  filterOptions: [],
  sort: {},
  loading: false
});

let sortModel: Record<string, any> = reactive({});

const templateModal = ref();
const tableData = ref() as Record<string, any>;

const onPageChange = (page: number, size: number) => {
  state.pagination.page = page;
  state.pagination.pageSize = size;
  fetchData();
};

const fetchData = async () => {
  try {
    state.loading = true;
    const data = await fetchAlertTemplate({
      page: state.pagination.page,
      page_size: state.pagination.pageSize,
      is_active: true,
      ...state.filter,
      ...state.sort
    });

    tableData.value = data.data.map((data: Record<string, any>) => ({
      ...data,
      modified: formatDateTime(data.modified / 1000),
      category: data.card_category['category_name']
    }));
    state.total = data.count;
  } finally {
    state.loading = false;
  }
};

async function onApplyFilter(filter: any) {
  state.pagination.page = 1;
  state.pagination.pageSize = 10;
  state.filter = filter;
  await fetchData();
}

async function openAlert(id: string) {
  const data = await fetchAlertTemplate({ template_id: id });
  let {
    template_id,
    template_image_type,
    template_image_data,
    created,
    is_active,
    modified,
    template_name,
    tenant,
    alerts_published,
    image_file_link,
    card_image,
    alert_end_user_visible_fields,
    ...rest
  } = data;

  let card_image_type = Object.keys(IMAGE_OPTIONS_MAP).find(
    (image_option) => IMAGE_OPTIONS_MAP[image_option] === template_image_type
  );

  const do_not_show_image = template_image_type === 3;

  if ([0, 4].includes(template_image_type)) {
    image_file_link = card_image;
    card_image_type = 'uploaded_image';
  }

  let editAlert = {
    ...rest,
    card_image_type,
    do_not_show_image,
    image_file_link,
    card_image,
    alert_template_id: template_id,
    tactic_technique_pairs: data.tactic_technique_pairs_data,
    source_urls: data?.source_urls?.[0]?.idx === -1 ? [] : data.source_urls,
    alert_end_user_visible_fields
  };
  store.dispatch('alertCreate/resetAlertFormData');
  store.dispatch('alertCreate/resetAlertTempData');
  store.dispatch('alertCreate/setAlertForm', editAlert);
  templateModal.value.hide();
  store.dispatch('alert/removeAllFilter');
  if (props.openForm) props.openForm();
  else router?.push({ name: 'alertCreateForm' });
}

const openUrl = () => {
  const { protocol, host } = window.location;
  emit('close');
  window.open(
    `${protocol}//${host}/dashboard/settings/guide/manual/alert_template`,
    '_blank',
    'noopener'
  );
};

const sortTemplates = (event: Record<string, any>) => {
  sortModel = event;
  state.sort =
    sortModel.sort !== 'undefined'
      ? {
          sortby: sortModel.sort
        }
      : {};
  fetchData();
};

const debouncedApplyFilter = debounce(onApplyFilter, 500);

onMounted(async () => {
  fetchAlertCategories();
  await onApplyFilter({});
  state.filterOptions = await fetchFilters('alert_template');
});
</script>
<template>
  <cy-modal
    width="70%"
    ref="templateModal"
    v-bind="testId()"
    :value="props.showModal"
    title="Alert Templates"
    modelAppendToBody
    @close="emit('close')"
  >
    <template #modal-content>
      <cy-filter
        v-if="props.showModal"
        v-bind="testId()"
        class="cyw-mt-5"
        :filters="state.filterOptions"
        @apply="debouncedApplyFilter"
        type="pro"
        :apiService="{
          api: $api.get,
          apiPrefix: 'admin/'
        }"
      />
      <div v-if="state.loading" class="cyw-flex-justify-center cyw-my-5">
        <cy-spinner size="6" />
      </div>
      <cy-table
        v-else-if="tableData?.length"
        height="300"
        :pagination="state.pagination"
        v-bind="testId()"
        :total="state.total"
        :config="{ selectable: false, customizable: false }"
        :actions="{ createAlert: { label: $t('alerts.listing-page.create-alert-button') } }"
        :data="tableData"
        :columns="ALERT_TEMPLATE_COLUMNS($t)"
        :sort="sortModel"
        row-class="cyw-cursor-pointer"
        @action-click="openAlert($event.data.template_id)"
        @page-change="onPageChange"
        @sort-change="sortTemplates"
      >
        <template #column-cell="{ row, column, $index }">
          <CyExpandableTitle
            v-if="['template_name', 'category'].includes(column.key)"
            v-bind="testId(`${$index}-${column.key}`)"
            :hideCopy="true"
            :value="row[column.key]"
            class="cyw-mw-100"
          />
          <CyTag
            v-else-if="column.key === 'tlp'"
            v-bind="testId(`${$index}-${column.key}`)"
            :type="column.key"
            :value="row[column.key].toLowerCase()"
          />
        </template>
      </cy-table>
      <div v-else class="cyw-my-5">
        <CyEmptyState v-bind="testId()" height="90" :message="{ title: $t('alerts.empty.no-template-found') }">
          <CyButton @click="openUrl" v-bind="testId('create-new')">{{ $t('alerts.buttons.create-template') }}</CyButton>
        </CyEmptyState>
      </div>
    </template>
  </cy-modal>
</template>

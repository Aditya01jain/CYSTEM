<script setup lang="ts">
import { reactive, onMounted, ref, inject, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { fileImage } from '@/utils';
import { DOC_LIB_FOLDER_COLUMNS } from '../config';
import { debounce } from 'lodash';
import store from '@/store';
import { initTestId } from '@/utils/testid';
const $api: any = inject('$api');
const { t: $t } = useI18n();

const { fetchDocLibraryList, createFolder, fetchFilters, fetchParentFolderRg } =
  useAlertBasicsData();

const emit = defineEmits(['updated', 'path', 'close:details', 'back']);

const props = defineProps({
  details: {
    default: {} as Record<string, any>
  },
  path: {
    default: ''
  },
  showBack: {
    default: false,
    type: Boolean
  },
  dataTestid: {
    default: 'doc-lib-upload',
    type: String
  }
});

const createMode = ref(false);
const testId = initTestId(props.dataTestid, 'doc-library-upload');

let sortModel: Record<string, any> = reactive({
  prop: 'modified',
  order: 'descending',
  sort: '-modified'
});

const docLib = reactive({
  filePath: [] as Record<string, any>[],
  docId: {} as Record<string, any>,
  pagination: {
    page: 1,
    page_size: 10
  },
  loading: false,
  docLibraryList: [] as Record<string, any>[],
  total: 0 as Number,
  filterOptions: [],
  filters: {}
});

const newFolder = reactive({
  name: '',
  selectedGroups: {
    org: [],
    public: [],
    invite: [],
    system: []
  } as Record<string, any>,
  inhertitAllowed: true
});

const getUserGroup = computed(() => {
  return (
    store.getters['alertCreate/getAlertFormListData']['user-groups']?.filter(
      (group: any) => group.is_active
    ) || []
  );
});

const orgGroup = computed(() =>
  getUserGroup.value?.filter((group: any) => group.group_type === 'ORGANIZATION')
);

const systemGroup = computed(() =>
  getUserGroup.value?.filter((group: any) => !group.user_visibility && !group.is_editable)
);

const inviteOnlyGroup = computed(() =>
  getUserGroup.value?.filter((group: any) => !group.user_visibility && group.is_editable && group.group_type !== 'ORGANIZATION')
);

const publicGroups = computed(() =>
  getUserGroup.value?.filter((group: any) => group.user_visibility)
);

const onBreadCrumbClick = (docid: string, index: number) => {
  docLib.docId = !!docid ? { id: docid } : {};
  fetchDocLibrary();
  docLib.filePath.length = index + 1;
};

const onRowClick = (event: Record<string, any>) => {
  if (event.type === 'folder') {
    const { file_name, document_id } = event;
    docLib.filePath.push({ name: file_name, id: document_id });
    docLib.docId = { id: document_id };
    fetchDocLibrary();
    docLib.pagination = {
      page: 1,
      page_size: docLib.pagination.page_size
    };
  }
};

const fetchDocLibrary = async () => {
  docLib.loading = true;
  const data = await fetchDocLibraryList({
    ...docLib.pagination,
    is_active: true,
    ...docLib.docId,
    ...docLib.filters,
    ...(sortModel.sort ? { sortby: sortModel.sort } : {})
  });

  docLib.docLibraryList = data.data.map((item: any) => ({
    ...item,
    rgAssociatedtoFolder: item.document_group.filter((group: any) => group.group_purpose != 2),
    modified: item.modified / 1000
  }));

  docLib.total = data.count;
  docLib.loading = false;
};

const onPageChange = (page: number, size: any) => {
  docLib.pagination.page = page;
  docLib.pagination.page_size = size;
  fetchDocLibrary();
};

const onApplyFilter = (event: any) => {
  docLib.filters = event;
  docLib.pagination = {
    page: 1,
    page_size: docLib.pagination.page_size
  };
  fetchDocLibrary();
};

onMounted(async () => {
  docLib.filterOptions = await fetchFilters('drive', true);
  openDocLib();
});

function openDocLib() {
  onApplyFilter({});
  docLib.filePath = [{ name: $t('alerts.create-folder.doc-library-path') }];
  docLib.pagination = {
    page: 1,
    page_size: 10
  };
  fetchDocLibrary();
}

const onMove = () => {
  const parentDocId = docLib.filePath?.[docLib.filePath.length - 1]?.id;
  emit(
    'updated',
    {
      ...props.details,
      ...(parentDocId
        ? {
            parent_folder: {
              document_id: parentDocId
            }
          }
        : {})
    },
    docLib.filePath.map((ele) => ele.name).join('/')
  );
};

const debouncedApplyFilter = debounce(onApplyFilter, 500);

const createNewFolder = async () => {
  await createFolder({
    folder_name: newFolder.name,
    groups: [
      ...newFolder.selectedGroups['org'],
      ...newFolder.selectedGroups['system'],
      ...newFolder.selectedGroups['public'],
      ...newFolder.selectedGroups['invite']
    ],
    ...(docLib.docId.id ? { parent_folder: { document_id: docLib.docId.id } } : {})
  });
  await fetchDocLibrary();
  cancelCreateMode();
};

function cancelCreateMode() {
  if (!createMode.value) {
    emit('back');
    emit('close:details');
  }

  createMode.value = false;
  newFolder.inhertitAllowed = true;
  newFolder.name = '';
  newFolder.selectedGroups = {
    org: [],
    public: [],
    invite: [],
    system: []
  };
}

const groupMap = computed(() => {
  return [
    {
      label: $t('alerts.group-type.public-groups'),
      list: publicGroups.value,
      model: 'public'
    },
    {
      label: $t('alerts.rg-type.invite-only-label'),
      list: inviteOnlyGroup.value,
      model: 'invite'
    },
    {
      label: $t('alerts.rg-type.system-groups-label'),
      list: systemGroup.value,
      model: 'system'
    },
    {
      label: $t('alerts.options.org-based-groups'),
      list:  orgGroup.value,
      model: 'org'
     }
  ];
});

const fetchParentRG = async () => {
  try {
    const parentRg = await fetchParentFolderRg(docLib.filePath[docLib.filePath?.length - 1].id);

    newFolder.selectedGroups['org'] = [
      ...newFolder.selectedGroups['org'],
      ...parentRg?.filter((group: any) => group.group_type === 'ORGANIZATION')
    ];
    newFolder.selectedGroups['system'] = [
      ...newFolder.selectedGroups['system'],
      ...parentRg?.filter((group: any) => !group.user_visibility && !group.is_editable)
    ];
    newFolder.selectedGroups['invite'] = [
      ...newFolder.selectedGroups['invite'],
      ...parentRg?.filter((group: any) => !group.user_visibility && group.is_editable && group.group_type !== 'ORGANIZATION')
    ];
    newFolder.selectedGroups['public'] = [
      ...newFolder.selectedGroups['public'],
      ...parentRg?.filter((group: any) => group.user_visibility)
    ];
    newFolder.inhertitAllowed = false;
  } catch (error: any) {
    //
  }
};

const onSort = (event: Record<string, any>) => {
  sortModel = event;
  docLib.pagination.page = 1;
  fetchDocLibrary();
};

defineExpose({
  cancelCreateMode,
  openDocLib,
  createMode
});
</script>
<template>
  <Teleport to="#attachments-header">
    <div v-bind="testId('header')" class="cyw-flex-align-center">
      <CyIconShell
        v-if="createMode || props.showBack"
        size="lg"
        @click="cancelCreateMode()"
        v-bind="testId('back')"
      >
        <CyIcon icon="fa-regular fa-arrow-left" class="cyw-mr-3" />
      </CyIconShell>
      <div v-if="createMode">{{ $t('alerts.create-folder.create-new-folder-header') }}</div>
      <CyExpandableTitle
        v-else
        :hideCopy="true"
        :value="`Move &quot;${props.details?.file_name?.split('.')?.[0]}&quot;`"
        :offset="300"
      />
    </div>
    <div v-if="!createMode" class="cyw-color-N700 cyw-text-f12" v-bind="testId('current-path')">
      <CyExpandableTitle
        :hideCopy="true"
        :value="`${$t('alerts.doc-library.current-location-label')} : ${props.path}`"
        :offset="300"
        class="cyw-color-N700 cyw-text-f12 cyw-mt-2"
      />
    </div>
  </Teleport>

  <div v-if="createMode">
    <div class="cyw-p-3">
      <CyInput
        :label="`${$t('alerts.file-upload.folder-name-field')} *`"
        size="md"
        v-bind="testId('folder-name')"
        v-model="newFolder.name"
        :maxlength="50"
        showCount
      />
      <hr class="cyw-my-5" />
      <div class="cyw-flex-justify-between">
        {{ $t('alerts.file-upload.recipient-groups-dropdown') }}
        <cy-button
          v-if="docLib.filePath.length > 1"
          type="secondary"
          v-bind="testId('inherit-rg-group')"
          @click="fetchParentRG"
          :disabled="!newFolder.inhertitAllowed"
          >{{ $t('alerts.create-folder.inherit-recipient-groups-button') }}</cy-button
        >
      </div>
      <div class="cyw-mt-4" v-for="(group, index) in groupMap" :key="index">
        <CySelect
          size="md"
          multiple
          v-bind="testId('inherit-rg-groups')"
          :showSearch="true"
          :label="group.label"
          :data="group.list"
          valueIdentifier="group_name"
          identifier="group_id"
          search-identifier="group_name"
          v-model="newFolder.selectedGroups[group.model]"
        />
      </div>
    </div>
  </div>
  <div v-else>
    <div class="cyw-flex-justify-between cyw-mt-2">
      <div class="file-upload-filters-width">
        <cy-filter
          v-bind="testId()"
          :filters="docLib.filterOptions"
          :staticFilterCount="0"
          :apiService="{
            api: $api.get,
            apiPrefix: 'admin/',
            getParams: (_: any, filter: Record<string, any>) => filter.filters
          }"
          @apply="debouncedApplyFilter"
          @reset:all="onApplyFilter({})"
          type="pro"
        />
      </div>
      <div>
        <cy-button
          type="secondary"
          class="cyw-mt-3"
          v-bind="testId('new-folder')"
          @click="createMode = true"
        >
          + {{ $t('alerts.create-folder.new-folder-button') }}
        </cy-button>
      </div>
    </div>
    <BreadCrumb
      :bread-crumb-list="docLib.filePath"
      wrapper-class="cyw-text-f14 cyw-color-N700 cyw-mw-100"
      v-bind="testId('destination-path')"
      @bread-crumb-click="onBreadCrumbClick($event?.item?.id, $event?.index)"
    >
      <template #default>
        <div class="cyw-mr-2">{{ $t('alerts.doc-library.destination-path-label') }}:</div>
      </template>
    </BreadCrumb>

    <div v-if="!docLib.docLibraryList?.length && !docLib.loading" class="doc-select-table">
      <CyEmptyState
        v-bind="testId()"
        :message="{ title: $t('alerts.doc-library.empty-state-title'), description: $t('alerts.doc-library.empty-state-description') }"
        class="cyw-h-100 cyw-my-5 cyw-py-5"
      />
    </div>
    <cy-table
      v-else
      key="doc-library-list-table"
      v-bind="testId()"
      :config="{
        selectable: false,
        maxHeight: 300,
        rowIdentifier: 'document_id',
        customizable: false,
        showSort: false
      }"
      :pagination="{ page: docLib.pagination.page, pageSize: docLib.pagination.page_size }"
      :loading="docLib.loading"
      :total="docLib.total"
      :data="docLib.docLibraryList"
      :columns="DOC_LIB_FOLDER_COLUMNS($t)"
      :sort="sortModel"
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
          <CyIcon :icon="fileImage(row.file_format ?? 'folder')" class="cyw-mr-3 cyw-text-f20" />
          <cy-expandable-title
            v-bind="testId(`${$index}-${column.key}`)"
            class="cyw-text-f14"
            :offset="10"
            :value="row.file_name"
            hideCopy
          />
        </div>
        <CyArrayPopper
          v-else-if="column.type === 'array'"
          v-bind="testId(`${$index}-${column.key}`)"
          :config="{
            key: 'rgAssociatedtoFolder',
            slice: 1,
            mapper: 'rgAssociatedtoFolder:group_name',
            type: 'tags',
            rounded: false
          }"
          :value="row"
        >
        </CyArrayPopper>
        <CyDataRenderer
          v-else
          :config="column"
          :data="row"
          v-bind="testId(`${$index}-${column.key}`)"
        />
      </template>
    </cy-table>
  </div>

  <Teleport to="#attachments-footer">
    <div class="cyw-flex-justify-end">
      <cy-button
        v-if="createMode"
        v-bind="testId('create-folder')"
        @click="createNewFolder"
        :disabled="!newFolder.name"
      >
        {{ $t('alerts.file-upload.create-button') }}
      </cy-button>
      <cy-button v-else @click="onMove" v-bind="testId('update')">
        {{ $t('alerts.file-upload.update-button') }}
      </cy-button>
    </div>
  </Teleport>
</template>

<style lang="scss">
.file-upload-filters-width {
  width: 80% !important;
}
.doc-select-table {
  max-height: 45rem !important;
  overflow-y: auto;
}
</style>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, inject } from 'vue';
import store from '@/store';
import { useI18n } from 'vue-i18n';
import { isEmpty } from 'lodash';
import { initTestId } from '@/utils/testid';
import { fileImage, formatBytes } from '@/utils';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import { prepareFileData, MAX_FILE_LIMIT } from '@/components/alertCreate/additional/config';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { convertToMB } from '@/shared/utils';

import FileDetails from './FileDetails.vue';
import AttachmentsModal from './AttachmentsModal.vue';
import DocLibraryDrawer from './DocLibraryDrawer.vue';
import DocLibUpload from './DocLibUpload.vue';

const testId = initTestId('ac', 'attachments');
const $notify: any = inject('$notify');

const { isPermittedToMe } = useCommonData();

const { t: $t } = useI18n();
const {
  uploadFileAndGetDocumentId,
  updateAlertFormStore,
  uploadFileToDocLibrary,
  extractIndicators
} = useAlertBasicsData();
const { showFileLimitError, showFileSizeError } = useErrorHandler();

const fileInput: any = ref(null);
const docLibraryDrawerRef = ref();
const docLibUploadRef = ref();
const fileDetailsRef = ref();
const attachmentsModal = ref();

const props = defineProps({
  disabled: {
    default: false
  }
});

const state = reactive({
  model: { email_attachments: false },
  files: [] as Record<string, any>[],
  uploadPercentage: 0 as number,
  docLibLoc: [] as Array<string>,
  selectedDoc: {} as Record<string, any>,
  fileError: {} as Record<string, any>,
  customColor: 'var(--P600)' as string,
  fileDetailsActive: false as boolean,
  replaceDisabled: true as boolean,
  currComponent: 'file-details' as string
});

const fileSizeLimit = computed(
  () => store.getters['common/getTenantDetails'].max_upload_file_size_allowed_for_doc_library
);

const alertData = computed(() => store.getters['alertCreate/getAlertFormData'] || {});

const alertFormListData = computed(() => store.getters['alertCreate/getAlertFormListData'] || {})

const getFileExtensions = computed(() => {
  const extensions = store.getters['common/getTenantDetails']?.file_extension_doc_library;
  return extensions
    .split(',')
    .map((ext: string) => `.${ext.trim()}`)
    .join(', ');
});

const isParseIndicatorEnabled = computed(() => {
  const activeCategory = store.getters['alertCreate/getAlertFormListData']['active-category'] || {};
  return activeCategory && activeCategory.threat_indicators_field
    ? activeCategory.threat_indicators_field
    : false;
});

const getIntelAttachments = computed(() => {
  let attachments: Record<string, any>[] = alertData.value?.intel_attachments || [];
  if (attachments.length)
    attachments = attachments.map((item: Record<string, any>) => {
      item['loading'] = false;
      return item;
    });
  return attachments;
});

const disableEmailAttachments = computed(() => {
  const tlpList = Object.values(alertFormListData?.value?.['tlp-config-data']);
  const tlpConfig: any = tlpList.find((item: any) => {
		return item.tlp === alertData?.value?.tlp;
	});
	return tlpConfig ? !tlpConfig.attachment : true;
})

const handleFileUpload = async (event: Event) => {
  if (state.files?.length >= MAX_FILE_LIMIT) {
    showFileLimitError();
    return;
  }

  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if(convertToMB(file.size) > fileSizeLimit.value) {
    showFileSizeError(fileSizeLimit.value);
    return;
  };

  state.files.push(prepareFileData(file, alertData.value.tlp));

  const formData = new FormData();
  formData.append('file', file);

  let percentageInterval = setInterval(() => {
    state.uploadPercentage = Math.min(state.uploadPercentage + 10, 90);
  }, 300);

  const uploadedFile = state.files[state.files?.length - 1];

  const status: any = await uploadFileAndGetDocumentId(formData);

  if (status.success) {
    state.uploadPercentage = 100;
    uploadedFile.document_id = status.success.data.document_id;
    delete uploadedFile.loading;
    state.selectedDoc = state.files[state.files?.length - 1];
    state.currComponent = 'file-details';
    nextTick(() => {
      attachmentsModal.value.show();
      fileDetailsRef.value.openFileDetails();
      state.fileDetailsActive = true;
    });
  } else {
    state.files.pop();
  }
  state.uploadPercentage = 0;
  clearInterval(percentageInterval);
};

const fileUploadToDocLib = async (payload: Record<string, any>, path: string, replace = false) => {
  const data = await uploadFileToDocLibrary({ ...payload, status: 'DRAFT' });
  if (state.fileDetailsActive) {
    if (data.status) {
      fileDetailsRef?.value?.onCancelDetails();
      state.fileDetailsActive = false;
      state.replaceDisabled = true;
    } else {
      if (data.error.code === '451') state.replaceDisabled = false;
      fileDetailsRef?.value?.changeUpdateClicked(false);
      return;
    }
  }

  state.files.forEach((file, index) => {
    if (payload.document_id === file.document_id && data.status) {
      state.files[index] = data.data;
      state.docLibLoc[index] = path;
      if (replace) {
        state.files[index]['new_document_id'] = payload.document_id;
      }
    }
  });

  if (!data.status) {
    state.fileError = {
      ...state.fileError,
      [payload.document_id]: data?.error?.detail
    };
  } else {
    delete state.fileError[payload.document_id];
    removeDuplicateFiles();
    updateAlertFormStore(
      'attachments',
      state.files.filter((file) => !state.fileError[file.document_id])
    );
    state.selectedDoc = {};
  }
  attachmentsModal.value.hide();
  fileDetailsRef.value.updateClicked = true;
  docLibUploadRef.value?.cancelCreateMode();
};

function removeDuplicateFiles() {
  const ids = state.files.map((file) => file.document_id);

  ids.forEach((id, index) => {
    if (index !== ids.lastIndexOf(id)) {
      state.files.splice(index, 1);
    }
  });
}

const docLibUpload = (event: Record<string, any>) => {
  const documents = state.files.map((file) => file.document_id);
  if (state.files?.length >= MAX_FILE_LIMIT) {
    showFileLimitError();
    return;
  }

  if (documents.includes(event.document_id)) {
    $notify.error({
      title: $t('alerts.error-message.same-file-upload')
    });
    return;
  }

  attachmentsModal?.value?.hide();
  docLibraryDrawerRef?.value?.onCancel();

  state.files.push(event);
  state.docLibLoc.push(
    `Doc Library/${event.file_hierarchy.map((item: any) => item.file_name).join('/')}`
  );
  updateAlertFormStore('attachments', state.files);
};

const openDocLibraryDrawer = () => {
  state.currComponent = 'doc-lib-draw';
  attachmentsModal.value?.show();
};

const updateEmailAttachment = (value: boolean) => {
  state.model.email_attachments = value;
  updateAlertFormStore('email_attachments', value);
};

const onDelete = (index: number) => {
  state.files.splice(index, 1);
  state.docLibLoc.splice(index, 1);
  state.docLibLoc.splice(index, 1);
  updateAlertFormStore('attachments', state.files);
  state.selectedDoc = {};
};

const onChangePath = (index: number) => {
  state.currComponent = 'doc-lib-upload';
  state.selectedDoc = state.files[index];
  attachmentsModal.value.show();
};

const onReplaceFile = (id: string) => {
  const payload = state.files.filter((item) => item.document_id === id);
  fileUploadToDocLib({ ...payload[0], replace_info: true }, 'Doc Library', true);
};

const removeIntelAttachment = (media: Record<string, any>) => {
  let intelAttachments = alertData.value.intel_attachments || [];
  intelAttachments = intelAttachments.filter(
    (file: Record<string, any>) => file.media_id !== media.media_id
  );
  updateAlertFormStore('intel_attachments', intelAttachments);
};

const doExtractIndicators = async (media: Record<string, any>) => {
  store.dispatch('alertCreate/setAlertTempData', { mountIndicators: false });

  const payload = {
    media_id: [media.media_id],
    short_id: alertData.value.short_id
  };
  media.loading = true;
  const indicator =
    (alertData.value?.optional_fields?.threat_indicators || '') +
    '<br/>' +
    (await extractIndicators(payload)).content;

  updateAlertFormStore('optional_fields', {
    ...store.getters['alertCreate/getAlertFormData']?.optional_fields,
    ...{
      threat_indicators: indicator,
      is_threat_indicators_defanged: alertData.value?.optional_fields?.is_threat_indicators_defanged
    }
  });

  media.loading = false;
  store.dispatch('alertCreate/setAlertTempData', { mountIndicators: true });
};

onMounted(() => {
  state.files = alertData.value.attachments || [];
  state.files?.forEach((file) => {
    state.docLibLoc.push(
      `Doc Library${file.file_path?.substring(0, file.file_path.lastIndexOf('/'))}/`
    );
  });
});

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  const uploadArea = event.target as HTMLElement;
  uploadArea.classList.add('drag-over');
};

const onDragLeave = (event: DragEvent) => {
  const uploadArea = event.target as HTMLElement;
  uploadArea.classList.remove('drag-over');
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  const uploadArea = event.target as HTMLElement;
  uploadArea.classList.remove('drag-over');

  const files = event.dataTransfer?.files;
  if (files && files.length) {
    Array.from(files).forEach((file) => {
      if (state.files?.length >= MAX_FILE_LIMIT) {
        showFileLimitError();
      } else {
        handleFileUpload({ target: { files: [file] } } as Event);
      }
    });
  }
};

function onModalClose() {
  if (state.fileDetailsActive) closeFileDetails();
  docLibUploadRef?.value?.cancelCreateMode();
  docLibraryDrawerRef?.value?.onCancel();
  state.currComponent = '';
  state.selectedDoc = {};
}

function closeFileDetails() {
  state.files.pop();
  state.replaceDisabled = true;
  state.fileDetailsActive = false;
}
</script>

<template>
  <div>
    <div
      :class="{
        'cyw-cursor-not-allowed cyw-pointer-events cyw-opacity-50': !!state.uploadPercentage
      }"
    >
      <input
        v-if="isPermittedToMe('create', 'drive')"
        :key="state.files?.length"
        type="file"
        :size="fileSizeLimit * 1024 * 1024"
        v-bind="testId('file-input')"
        ref="fileInput"
        :accept="getFileExtensions"
        @change="handleFileUpload"
        :style="{ display: 'none' }"
      />

      <div
        v-if="isPermittedToMe('create', 'drive')"
        class="attachment--upload-area cyw-flex-col cyw-flex-center cyw-border cyw-cursor-pointer"
        v-bind="testId('file-upload')"
        @click="fileInput?.click()"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <CyIcon icon="fa-light fa-cloud-arrow-up" class="cyw-h1 cyw-color-P600 cyw-my-5" />
        <div class="cyw-h5">
          <span class="cyw-text-semi-bold">
            {{ $t('alerts.form-interactions.drag-drop-file') + ' ' }}
          </span>
          <a class="cyw-color-P600">{{ $t('alerts.buttons.browse') }}</a>
        </div>
        <CyTooltip
          v-bind="testId(`extension-tooltip`)"
          :content="$t('alerts.tooltips.permitted-file-types', { extension: getFileExtensions })"
        >
          <span class="cyw-color-N700 cyw-text-f12 cyw-mt-3">
            {{ $t('alerts.form-interactions.supported-formats') }}
            <CyIcon icon="fa-solid fa-circle-info" v-bind="testId('info')" />
          </span>
        </CyTooltip>
        <div class="cyw-color-N700 cyw-text-f12 cyw-my-5">
          {{ $t('alerts.form-interactions.maximum-file-size', { FileSize: fileSizeLimit }) }}
        </div>
      </div>
      <div
        class="cyw-flex-align-center cyw-flex-justify-between cyw-border-1 cyw-round-lg cyw-p-5 cyw-mt-5"
      >
        <div class="cyw-flex-align-center">
          <CyIcon icon="fa-thin fa-folder-open" class="cyw-h1 cyw-color-P600" />
          <div class="cyw-ml-4 cyw-color-N800 cyw-text-f14 cyw-text-semi-bold">
            {{ $t('alerts.attachments.select-file-label') }}
          </div>
        </div>
        <div
          v-bind="testId('doc-library')"
          class="cyw-ml-4 cyw-color-P600 cyw-text-f14 cyw-text-semi-bold cyw-cursor-pointer"
          @click="openDocLibraryDrawer"
        >
          {{ $t('alerts.form-interactions.browse-doc-library') }}
        </div>
      </div>
      <div class="cyw-text-f12 cyw-mt-4">
        <span class="cyw-text-semi-bold">{{ `${$t('alerts.labels.note')} ` }}</span>
        <span class="cyw-color-N600">{{
          $t('alerts.form-interactions.you-can-attach-up-to-files')
        }}</span>
      </div>
    </div>
    <div v-if="state.files?.length" class="cyw-my-5">
      <div
        v-for="(file, index) in state.files"
        :key="file.document_id"
        class="cyw-flex-justify-between cyw-flex-align-center cyw-text-f12 cyw-mb-4"
        v-bind="testId(`${file.file_name}`)"
      >
        <div class="cyw-flex-align-center cyw-w-100">
          <CyIcon
            :icon="fileImage(file.file_format ?? 'folder')"
            class="cyw-text-f20 cyw-color-N800"
            :class="{ 'error-text': !!state.fileError[file.document_id] }"
          />
          <div class="cyw-ml-3 cyw-w-100">
            <div class="cyw-text-12 cyw-text-medium cyw-color-N800">
              {{ file.file_name?.substring(0, file.file_name.lastIndexOf('.')) || '' }}
            </div>
            <!-- file meta details -->
            <div v-if="file.loading" v-bind="testId('file-upload-progress')">
              <ElProgress
                class="cyw-w-100"
                :percentage="state.uploadPercentage"
                :color="state.customColor"
              />
            </div>
            <div v-else-if="!!state.fileError[file.document_id]" class="error-text">
              {{ state.fileError[file.document_id] }}
            </div>
            <div v-else class="cyw-flex cyw-text-f10 cyw-color-N600">
              <div>{{ file?.file_format }}</div>
              <div class="cyw-mx-2">|</div>
              <div>{{ typeof file.size === 'string' ? file.size : formatBytes(file.size) }}</div>
            </div>
            <div class="cyw-text-f10 cyw-color-N600">
              {{ $t('alerts.create-folder.doc-library-path') }}: {{ state.docLibLoc[index] }}
              <CyButton
                v-bind="testId('change-path')"
                type="tertiary"
                @click="onChangePath(index)"
                size="sm"
                :disabled="props.disabled || state.uploadPercentage"
              >
                {{ $t('alerts.file-upload.change-path-button') }}
              </CyButton>
            </div>
          </div>
        </div>
        <cy-dropdown class="cyw-ml-0" :disabled="props.disabled">
          <template #dropdown-link>
            <CyIconShell size="md" v-bind="testId('dropdown')">
              <CyIcon icon="fa-solid fa-ellipsis-vertical" class="cyw-p-1" />
            </CyIconShell>
          </template>
          <template #dropdown>
            <div class="cyw-flex-col">
              <CyButton
                v-bind="testId('delete')"
                type="tertiary"
                subtype="subtle"
                @click="onDelete(index)"
                class="cyw-text-left"
              >
                {{ $t('alerts.file-upload.delete-button') }}
              </CyButton>
            </div>
          </template>
        </cy-dropdown>
      </div>
    </div>
    <div v-if="getIntelAttachments.length" class="cyw-my-5">
      <div class="cyw-mb-3" v-bind="testId('intel-attachments')">
        {{ $t('alerts.alert-from-intel.attachments-label') }} ({{ getIntelAttachments.length }})
      </div>
      <div
        v-for="file in getIntelAttachments"
        :key="file.media_id"
        class="cyw-flex-justify-between cyw-flex-align-center cyw-text-f12 cyw-mb-4"
        v-bind="testId(`${file.media_file?.substring(0, file.media_file.lastIndexOf('.')) || ''}`)"
      >
        <div class="cyw-flex-align-center cyw-w-100">
          <CyIcon
            :icon="fileImage(file?.file_format)"
            class="cyw-text-f20 cyw-color-N800"
            v-bind="testId(`${file?.file_format}-icon`)"
          />
          <div class="cyw-ml-3 cyw-w-100">
            <div class="cyw-text-12 cyw-text-medium cyw-color-N800">
              {{ file.media_file?.substring(0, file.media_file.lastIndexOf('.')) || '' }}
            </div>
            <div class="cyw-flex-align-center cyw-text-f10 cyw-color-N600">
              <div>{{ file?.media_file.split('.')[1] }}</div>
              <div class="cyw-mx-2">|</div>
              <div>{{ typeof file.size === 'string' ? file.size : formatBytes(file.size) }}</div>
              <div class="cyw-flex-align-center cyw-ml-3 cyw-text-f10 cyw-color-N600">
                <CyButton
                  size="sm"
                  type="tertiary"
                  v-bind="testId('extract-indicators')"
                  @click="doExtractIndicators(file)"
                  :loading="file.loading"
                  :disabled="!isParseIndicatorEnabled"
                >
                  {{ $t('alerts.buttons.extract-indicators') }}
                </CyButton>
                <CyTooltip
                  v-if="!isParseIndicatorEnabled"
                  :content="$t('alerts.tooltips.extract-indicators-tooltip')"
                >
                  <CyIcon icon="fa-solid fa-circle-info" />
                </CyTooltip>
              </div>
            </div>
          </div>
        </div>
        <cy-dropdown class="cyw-ml-0" :disabled="props.disabled">
          <template #dropdown-link>
            <CyIconShell size="md" v-bind="testId('actions')">
              <CyIcon icon="fa-solid fa-ellipsis-vertical" class="cyw-p-1" />
            </CyIconShell>
          </template>
          <template #dropdown>
            <div class="cyw-flex-col">
              <CyButton
                v-bind="testId('delete')"
                type="tertiary"
                subtype="subtle"
                @click="removeIntelAttachment(file)"
                class="cyw-text-left"
              >
                {{ $t('alerts.file-upload.delete-button') }}
              </CyButton>
            </div>
          </template>
        </cy-dropdown>
      </div>
    </div>
    <div class="cyw-flex-col cyw-mt-5">
      <div class="cyw-flex-align-center">
        <CyCheckbox
          v-bind="testId('send-email-as-attachment')"
          :modelValue="state.model.email_attachments"
          @update:modelValue="updateEmailAttachment($event)"
          :disabled="props.disabled || disableEmailAttachments"
        />
        <div class="cyw-ml-3">{{ $t('alerts.file-upload.send-as-email-attachment') }}</div>
      </div>
      <div class="cyw-color-N600 cyw-text-f12 cyw-ml-5">
        {{ $t('alerts.attachments-section.send-as-email-tooltip') }}
      </div>
    </div>
  </div>
  <attachments-modal
    :width="state.currComponent === 'doc-lib-draw' ? '70%' : '50%'"
    ref="attachmentsModal"
    :footer="true"
    :onCloseIcon="state.currComponent === 'file-details' || docLibUploadRef?.createMode"
    @close="onModalClose"
    :modalStyle="{ maxHeight: '70rem' }"
    v-bind="testId()"
  >
    <DocLibraryDrawer
      v-if="state.currComponent === 'doc-lib-draw'"
      ref="docLibraryDrawerRef"
      @selectedFiles="docLibUpload($event)"
      v-bind="testId()"
    />
    <FileDetails
      v-if="!isEmpty(state.selectedDoc) && state.currComponent === 'file-details'"
      ref="fileDetailsRef"
      :details="state.selectedDoc"
      :replaceDisabled="state.replaceDisabled"
      @updated="fileUploadToDocLib"
      @close:details="attachmentsModal?.hide()"
      @replace="onReplaceFile($event)"
      v-bind="testId()"
    />
    <DocLibUpload
      v-if="!isEmpty(state.selectedDoc) && state.currComponent === 'doc-lib-upload'"
      ref="docLibUploadRef"
      :details="state.selectedDoc"
      :path="
        state.docLibLoc[
          state.files.findIndex((item:any) => item.document_id === state.selectedDoc?.document_id)
        ]
      "
      @close:details="state.selectedDoc = {}"
      @updated="fileUploadToDocLib"
      v-bind="testId()"
    />
  </attachments-modal>
</template>
<style lang="scss" scoped>
.attachment {
  &--upload-area {
    border: 0.1rem dashed var(--P500);
    border-radius: 1rem;
    transition: background-color 0.3s ease;
    &.drag-over {
      background-color: var(--N200);
    }
  }
}
.error-text {
  color: var(--R500);
}
</style>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, inject } from 'vue';
import store from '@/store';
import { fileImage, formatBytes } from '@/utils';
import { isEmpty } from 'lodash';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import { initTestId } from '@/utils/testid';
import { prepareFileData, MAX_FILE_LIMIT } from '@/components/alertCreate/additional/config';
import { convertToMB } from '@/shared/utils';

import AttachmentsModal from '@/components/alertCreate/additional/attachments/AttachmentsModal.vue';
import DocLibUpload from '@/components/alertCreate/additional/attachments/DocLibUpload.vue';
import DocLibraryDrawer from '@/components/alertCreate/additional/attachments/DocLibraryDrawer.vue';
import FileDetails from '@/components/alertCreate/additional/attachments/FileDetails.vue';
import { useI18n } from 'vue-i18n';
import { useErrorHandler } from '@/composables/useErrorHandler';

const { isPermittedToMe } = useCommonData();
const { uploadFileAndGetDocumentId, uploadFileToDocLibrary, attachFilesToAlert } =
  useAlertBasicsData();
const { showFileLimitError, showFileSizeError } = useErrorHandler();

const { t: $t } = useI18n();
const $notify: any = inject('$notify');
const fileInputRef: any = ref(null);
const docLibraryDrawerRef = ref();
const docLibUploadRef = ref();
const fileDetailsRef = ref();
const attachmentsModalRef = ref();

const finalPayload = ref({} as Record<string, any>);
const testId = initTestId('ad', 'add-attachments');

const state = reactive({
  model: { email_attachments: false },
  files: [] as Record<string, any>[],
  uploadPercentage: 0 as number,
  docLibLoc: [] as Array<string>,
  selectedDoc: {} as Record<string, any>,
  fileError: {} as any,
  customColor: 'var(--P600)' as string,
  modalVisible: false as boolean,
  teleportFooter: false as boolean,
  currComponent: 'file-input' as string,
  fileDetailsActive: false as boolean,
  replaceDisabled: true as boolean
});

const emit = defineEmits(['close']);

const fileSizeLimit = computed(
  () => store.getters['common/getTenantDetails'].max_upload_file_size_allowed_for_doc_library
);

const alertData = computed(() => store.getters['alert/getAlertDetails'] || {});

const getFileExtensions = computed(() => {
  const extensions = store.getters['common/getTenantDetails']?.file_extension_doc_library;
  return extensions
    ?.split(',')
    ?.map((ext: string) => `.${ext.trim()}`)
    ?.join(', ');
});

const maxFileUploadLimit = computed(
  (): number => MAX_FILE_LIMIT - alertData?.value?.attachments?.length
);

async function handleFileUpload(event: Event) {
  if (state.files?.length >= maxFileUploadLimit.value) {
    showFileLimitError(maxFileUploadLimit.value);
    return;
  }

  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if(convertToMB(file.size) > fileSizeLimit.value) {
    showFileSizeError(fileSizeLimit.value);
    return;
  };

  state.files.push(prepareFileData(file, alertData?.value?.tlp));

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
      fileDetailsRef?.value?.openFileDetails();
      state.fileDetailsActive = true;
    });
  } else {
    state.files.pop();
  }
  state.uploadPercentage = 0;
  clearInterval(percentageInterval);
}

async function fileUploadToDocLib(payload: Record<string, any>, path: string, replace = false) {
  const data = await uploadFileToDocLibrary({ ...payload, status: 'DRAFT' });
  if (state.fileDetailsActive) {
    if (data.status) {
      fileDetailsRef?.value?.onCancelDetails();
      state.fileDetailsActive = false;
      state.replaceDisabled = true;
      state.currComponent = 'file-input';
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

    finalPayload.value['attachments'] = state.files?.filter(
      (file) => !state.fileError[file.document_id]
    );
  }
  state.selectedDoc = {};

  docLibUploadRef?.value?.cancelCreateMode();
}

function removeDuplicateFiles() {
  const ids = state.files?.map((file) => file.document_id);

  ids.forEach((id, index) => {
    if (index !== ids.lastIndexOf(id)) {
      state.files?.splice(index, 1);
    }
  });
}

function docLibUpload(event: Record<string, any>) {
  const documents = [...alertData?.value?.attachments, ...state.files]?.map(
    (file) => file.document_id
  );

  if (state.files?.length >= maxFileUploadLimit.value) {
    showFileLimitError(maxFileUploadLimit.value);
    return;
  }

  if (documents.includes(event.document_id)) {
    $notify.error({
      title: $t('alerts.error-message.same-file-upload')
    });
    return;
  }

  docLibraryDrawerRef?.value?.onCancel();
  goBack('file-input');

  state.files.push(event);
  state.docLibLoc.push(
    `${$t('alerts.create-folder.doc-library-path')}/${event.file_hierarchy
      ?.map((item: Record<string, any>) => item.file_name)
      ?.join('/')}`
  );
  finalPayload.value['attachments'] = state.files;
}

function openDocLibraryDrawer() {
  state.currComponent = 'doc-lib-draw';
  state.teleportFooter = false;
}

function onDelete(index: number) {
  state.files?.splice(index, 1);
  state.docLibLoc?.splice(index, 1);
  finalPayload.value['attachments'] = state.files;
  state.selectedDoc = {};
}

function onChangePath(index: number) {
  state.selectedDoc = state.files[index];
  state.currComponent = 'doc-lib-upload';
}

function onReplaceFile(id: string) {
  const payload = state.files?.filter((item) => item.document_id === id);
  fileUploadToDocLib(
    { ...payload[0], replace_info: true },
    `${$t('alerts.create-folder.doc-library-path')}/`,
    true
  );
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  const uploadArea = event.target as HTMLElement;
  uploadArea.classList.add('drag-over');
}

function onDragLeave(event: DragEvent) {
  const uploadArea = event.target as HTMLElement;
  uploadArea.classList.remove('drag-over');
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  const uploadArea = event.target as HTMLElement;
  uploadArea.classList.remove('drag-over');

  const files = event.dataTransfer?.files;
  if (files && files?.length) {
    Array.from(files).forEach((file) => {
      if (state.files?.length >= maxFileUploadLimit.value) {
        showFileLimitError(maxFileUploadLimit.value);
      } else {
        handleFileUpload({ target: { files: [file] } } as Event);
      }
    });
  }
}

function closeFileDetails() {
  state.files?.pop();
  state.currComponent = 'file-input';
  state.replaceDisabled = true;
  state.fileDetailsActive = false;
}

function show() {
  state.modalVisible = true;
  state.currComponent = 'file-input';
  state.teleportFooter = true;
}

async function goBack(view: string) {
  state.currComponent = view;
  setTimeout(() => (state.teleportFooter = state.currComponent !== 'doc-lib-draw'), 100);
}

function onClose() {
  docLibUploadRef?.value?.cancelCreateMode();
  docLibraryDrawerRef?.value?.onCancel();
  fileDetailsRef?.value?.onCancelDetails();
  state.modalVisible = false;
  state.files = [];
  state.docLibLoc = [];
  emit('close');
}

function onDone() {
  attachFilesToAlert(finalPayload.value, alertData?.value?.short_id);
  state.files = [...alertData?.value?.attachments, ...state.files];
  removeDuplicateFiles();
  store.dispatch('alert/setAlertDetails', {
    ...alertData.value,
    attachments: state.files
  });
  attachmentsModalRef?.value?.hide();
}

defineExpose({ show });
</script>

<template>
  <attachments-modal
    :value="state.modalVisible"
    width="70%"
    :footer="state.currComponent !== 'doc-lib-draw'"
    ref="attachmentsModalRef"
    :noCloseIcon="state.currComponent !== 'file-input'"
    @close="onClose"
    v-bind="testId()"
  >
    <div v-if="state.currComponent === 'file-input' && state.modalVisible">
      <Teleport to="#attachments-header">
        <h4 v-bind="testId('header')">Add More Files</h4>
      </Teleport>
      <Teleport v-if="state.teleportFooter" to="#attachments-footer">
        <div class="cyw-flex-justify-end">
          <cy-button @click="onDone" v-bind="testId('done')">
            {{ $t('alerts.linked-alerts-listing.done-button') }}
          </cy-button>
        </div>
      </Teleport>
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
          ref="fileInputRef"
          :accept="getFileExtensions"
          @change="handleFileUpload"
          :style="{ display: 'none' }"
          v-bind="testId('input-file')"
        />

        <div
          v-if="isPermittedToMe('create', 'drive')"
          class="attachment--upload-area cyw-flex-col cyw-flex-center cyw-border cyw-cursor-pointer"
          @click="fileInputRef?.click()"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <CyIcon
            icon="fa-light fa-cloud-arrow-up"
            v-bind="testId('upload-icon')"
            class="cyw-h1 cyw-color-P600 cyw-my-5"
          />
          <div class="cyw-h5" v-bind="testId('input-file')">
            <span class="cyw-text-semi-bold">
              {{ $t('alerts.form-interactions.drag-drop-file') + ' ' }}
            </span>
            <a class="cyw-color-P600">{{ $t('alerts.buttons.browse') }}</a>
          </div>
          <CyTooltip
            :content="$t('alerts.tooltips.permitted-file-types', { extension: getFileExtensions })"
          >
            <span class="cyw-color-N700 cyw-text-f12 cyw-mt-3" v-bind="testId('supported-format')">
              {{ $t('alerts.form-interactions.supported-formats') }}
              <CyIcon
                icon="fa-solid fa-circle-info"
                class="note-icon-color"
                v-bind="testId('info')"
              />
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
            class="cyw-ml-4 cyw-color-P600 cyw-text-f14 cyw-text-semi-bold cyw-cursor-pointer"
            @click="openDocLibraryDrawer"
            v-bind="testId('open-doc-library')"
          >
            {{ $t('alerts.form-interactions.browse-doc-library') }}
          </div>
        </div>
        <div class="cyw-text-f12 cyw-mt-4">
          <span class="cyw-text-semi-bold">{{ `${$t('alerts.labels.note')} ` }}</span>
          <span class="cyw-color-N600" v-bind="testId('max-file-count')">{{
            $t('alerts.form-interactions.you-can-attach-up-to-files')?.replace(
              '20',
              maxFileUploadLimit
            )
          }}</span>
        </div>
      </div>
      <div v-if="state.files?.length" class="cyw-mt-5 attached-file-length cyw-overflow-auto">
        <div
          v-for="(file, index) in state.files"
          :key="file.document_id"
          class="cyw-flex-justify-between cyw-flex-align-center cyw-text-f12 cyw-mr-5"
          v-bind="testId(`${file.file_name}`)"
        >
          <div class="cyw-flex-align-center cyw-w-100">
            <CyIcon
              :icon="fileImage(file.file_format ?? 'folder')"
              class="cyw-text-f20 cyw-color-N800"
              :class="{ 'error-text': !!state.fileError[file.document_id] }"
            />
            <div class="cyw-ml-3 cyw-w-100">
              <div
                class="cyw-text-12 cyw-text-medium cyw-color-N800"
                v-bind="testId(`${index}-file-name`)"
              >
                {{ file.file_name?.substring(0, file.file_name.lastIndexOf('.')) || '' }}
              </div>

              <div v-if="file.loading">
                <ElProgress
                  class="cyw-w-100"
                  :percentage="state.uploadPercentage"
                  :color="state.customColor"
                />
              </div>

              <div v-else-if="!!state.fileError[file.document_id]" class="error-text">
                {{ state.fileError[file.document_id] }}
              </div>

              <div
                v-else
                class="cyw-flex cyw-text-f10 cyw-color-N600"
                v-bind="testId(`${index}-file-format`)"
              >
                <div>{{ file?.file_format }}</div>
                <div class="cyw-mx-2" v-bind="testId(`${index}-file-size`)">|</div>
                <div>{{ typeof file.size === 'string' ? file.size : formatBytes(file.size) }}</div>
              </div>

              <div class="cyw-text-f10 cyw-color-N600" v-bind="testId(`${index}-file-path`)">
                {{ $t('alerts.create-folder.doc-library-path') }}: {{ state.docLibLoc[index] }}
                <CyButton
                  type="tertiary"
                  @click="onChangePath(index)"
                  size="sm"
                  :disabled="state.uploadPercentage"
                  v-bind="testId(`${index}-change-path`)"
                >
                  {{ $t('alerts.file-upload.change-path-button') }}
                </CyButton>
              </div>
            </div>
          </div>
          <cy-dropdown class="cyw-ml-0">
            <template #dropdown-link>
              <CyIconShell size="md" v-bind="testId(`${index}-file-actions`)">
                <CyIcon icon="fa-solid fa-ellipsis-vertical" class="cyw-p-1" />
              </CyIconShell>
            </template>
            <template #dropdown>
              <div class="cyw-flex-col">
                <CyButton
                  type="tertiary"
                  subtype="subtle"
                  @click="onDelete(index)"
                  class="cyw-text-left"
                  v-bind="testId(`${index}-file-delete`)"
                >
                  {{ $t('alerts.file-upload.delete-button') }}
                </CyButton>
              </div>
            </template>
          </cy-dropdown>
        </div>
      </div>
    </div>

    <DocLibraryDrawer
      v-else-if="state.currComponent === 'doc-lib-draw'"
      ref="docLibraryDrawerRef"
      showBack
      @selectedFiles="docLibUpload($event)"
      @back="goBack('file-input')"
      v-bind="testId()"
    />

    <FileDetails
      v-else-if="!isEmpty(state.selectedDoc) && state.currComponent === 'file-details'"
      :details="state.selectedDoc"
      :replaceDisabled="state.replaceDisabled"
      @updated="fileUploadToDocLib"
      @close:details="closeFileDetails()"
      ref="fileDetailsRef"
      @replace="onReplaceFile($event)"
      v-bind="testId()"
    />

    <DocLibUpload
      v-else-if="!isEmpty(state.selectedDoc) && state.currComponent === 'doc-lib-upload'"
      ref="docLibUploadRef"
      showBack
      :path="
        state.docLibLoc[
          state.files.findIndex((item) => item.document_id === state.selectedDoc?.document_id)
        ]
      "
      :details="state.selectedDoc"
      @updated="fileUploadToDocLib"
      @close:details="state.selectedDoc = {}"
      @back="goBack('file-input')"
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
.attached-file-length {
  max-height: 14rem;
}
</style>

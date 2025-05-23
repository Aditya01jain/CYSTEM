<script lang="ts" setup>
import { PropType, inject } from 'vue';
import { fileImage, formatBytes } from '@/utils';

const props = defineProps({
  files: { type: Array as PropType<File[]>, default: () => [] },
  showDownload: { type: Boolean, default: true },
  isClickable: { default: false, type: Boolean },
  dataTestid: { type: String, default: '' }
});

const $api: any = inject('$api');

const emit = defineEmits(['fileClick']);

function downloadFile(id: string) {
  $api
    .get('analyst.downloadDocument', { params: { id } })
    .then((res: any) => (window.location.href = res.data.url))
    .catch();
}

type File = {
  file_name: string;
  file_format: string;
  size?: number;
  document_id?: string;
  document_file?: string;
  download_id?: string;
};
</script>

<template>
  <div class="cyw-border-1 cyw-round-lg cyw-p-2">
    <div
      class="cyw-flex-justify-between cyw-flex-align-center cyw-py-3 cyw-px-2 cyw-text-f12 cyw-border-bottom file-download"
      v-for="(file, index) in props.files"
      :key="index"
      :data-testid="`${props.dataTestid}-${index}`"
    >
      <div class="cyw-flex-align-center cyw-w-100">
        <CyIcon
          :icon="fileImage(file?.file_format)"
          class="cyw-text-f20 cyw-color-N800"
          :data-testid="`${props.dataTestid}-${file?.file_format}-icon`"
        />
        <div class="cyw-ml-3 file-name cyw-w-75">
          <div
            class="cyw-text-f12 cyw-color-N800 cyw-w-100"
            :class="{ 'cyw-cursor-pointer': props.isClickable }"
          >
            <CyExpandableTitle
              :hideCopy="true"
              :value="
                file.file_name?.substring(0, file.file_name.lastIndexOf('.')) || file.file_name
              "
              :offset="10"
              @click="props.isClickable ? emit('fileClick', file) : ''"
              :data-testid="`${props.dataTestid}-file_name-${file.file_name}`"
            />
          </div>
          <div class="cyw-flex cyw-text-f10 cyw-color-N600">
            <div :data-testid="`${props.dataTestid}-format`">
              {{ '.' + file?.file_format }}
            </div>
            <div v-if="!!file.size" class="cyw-flex">
              <div class="cyw-mx-2">|</div>
              <div :data-testid="`${props.dataTestid}-size`">
                {{ typeof file.size === 'string' ? file?.size : formatBytes(file?.size) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <a
        v-if="props.showDownload"
        class="ca-decoration-none cyw-mr-5 cyw-color-N600"
        :data-testid="`${props.dataTestid}-${index}-${file.file_name}-link`"
        @click="downloadFile(file.download_id ?? '')"
      >
        <CyIcon icon="fa-regular fa-arrow-down-to-line"></CyIcon>
      </a>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.file {
  &-download:last-child {
    border: none;
  }
  &-name {
    max-width: 70%;
  }
}
</style>

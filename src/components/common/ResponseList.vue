<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { fileImage } from '@/utils';
import { timeAgo } from '@/utils/index';
import { isEmpty } from 'lodash';
import { initTestId } from '@/utils/testid';

const { t: $t } = useI18n()

const props = defineProps({
  data: {
    default: [] as Record<string, any>
  },
  height: {
    default: 30
  },
  keys: {
    default: {
      name: 'full_name',
      date: 'modified',
      content: 'content',
      attachments: 'attachments'
    }
  },
  busy: {
    default: false
  },
  emptyMsg: {
    default: '',
    type: String
  },
  allowDelete: {
    type: Boolean,
    default: false
  },
  dataTestid: {
    type: String,
    default: 'response-list'
  }
});

const testId = initTestId(props.dataTestid, 'response');

const emit = defineEmits(['loadMore', 'delete:response']);

const onDownload = (link: string) => {
  window.open(link);
};
</script>
<template>
  <div v-if="isEmpty(props.data)" class="response-list-empty-state" v-bind="testId(`empty`)">
    <p class="cyw-text-f14 cyw-color-N800" v-bind="testId(`empty-title`)">
      {{ $t('alerts.alert-details-empty-state.rfi-response-title') }}
    </p>
    <p class="cyw-text-f12 cyw-color-N700" v-bind="testId(`empty-msg`)">
      {{ props.emptyMsg }}
    </p>
  </div>
  <cy-height-wrapper
    v-else
    :max-height="props.height"
    :busy="props.busy"
    @bottom="emit('loadMore')"
  >
    <div v-for="item in props.data" :key="item.tenantuser">
      <div class="cyw-flex-justify-between">
        <div class="cyw-flex-align-center cyw-mb-3">
          <span class="cyw-text-f14 cyw-text-medium cyw-mr-2 cyw-color-N800 cyw-w-fit">
            <cy-expandable-title
              :value="item[props.keys.name]"
              :offset="500"
              hideCopy
              v-bind="testId(`name`)"
            />
          </span>
          <span class="cyw-color-N700 cyw-text-f12" v-bind="testId(`time`)">
            | {{ timeAgo(item[props.keys.date]) }}
          </span>
        </div>
        <cy-dropdown v-if="props.allowDelete">
          <template #dropdown-link>
            <CyIconShell size="md" v-bind="testId(`actions`)">
              <CyIcon icon="fa-solid fa-ellipsis-vertical" />
            </CyIconShell>
          </template>
          <template #dropdown>
            <p
              class="cyw-flex-justify-center cyw-my-2 cyw-cursor-pointer"
              @click="emit('delete:response', item.id)"
              v-bind="testId(`delete`)"
            >
              {{ $t('alerts.file-upload.delete-button') }}
            </p>
          </template>
        </cy-dropdown>
      </div>
      <slot name="additional-detail" :data="item" />
      <CySanitizeHtml
        class="cyw-text-f14 cyw-mt-3"
        :text="item[props.keys.content]"
        v-bind="testId(`content`)"
      />

      <div
        v-for="(file, index) in item[props.keys.attachments]"
        :key="index"
        class="cyw-bg-N10 cyw-border-1 cyw-round-lg cyw-m-3 cyw-p-2 cyw-w-50"
        :class="{ 'cyw-border-top': index >= 1 }"
        v-bind="testId(`attachments`)"
      >
        <div class="cyw-flex-justify-between cyw-flex-align-center">
          <div class="cyw-flex-align-center cyw-w-100">
            <CyIcon
              :icon="fileImage(file?.file_format)"
              class="cyw-text-f20 cyw-color-N800"
              v-bind="testId(`file-icon`)"
            />
            <div class="cyw-ml-3 cyw-w-100">
              <div class="cyw-text-f12 cyw-color-N800">
                <cy-expandable-title
                  class="cy-ml-3"
                  :value="file.file_name?.substring(0, file.file_name.lastIndexOf('.'))"
                  :offset="0"
                  v-bind="testId(`file`)"
                />
              </div>
              <div class="cyw-flex cyw-text-f10 cyw-color-N600" v-bind="testId(`file-ext`)">
                <div>{{ '.' + file?.ext }}</div>
              </div>
            </div>
          </div>
          <CyIconShell
            size="md"
            @click="onDownload(file.media_file)"
            class="cyw-mr-4"
            v-bind="testId(`download`)"
          >
            <CyIcon icon="fa-regular fa-arrow-down-to-line"></CyIcon>
          </CyIconShell>
        </div>
      </div>
      <hr />
    </div>
  </cy-height-wrapper>
</template>
<style lang="scss" scoped>
.response-list-empty-state {
  position: relative;
  top: 25%;
  text-align: center;
}
</style>

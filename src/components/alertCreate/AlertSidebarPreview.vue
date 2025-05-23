<script setup lang="ts">
import { reactive, computed, defineAsyncComponent } from 'vue';
import { useStore } from '@/store';
import { TABS } from '../alertCreate/config';
import { useI18n } from 'vue-i18n';
import { initTestId } from '@/utils/testid';
import CommentsList from '../comments/CommentsList.vue';
import { useCommentsStore } from '@/store/modules/useComments';
const SanitizeHtml = defineAsyncComponent(() => import('@/components/common/SanitizeHtml.vue'));
const store: Record<string, any> = useStore();

const testId = initTestId('ac', 'sidebar-preview');

const { t: $t } = useI18n();
const { visibleComments, fetchComments } = useCommentsStore();

const state = reactive({
  activeTab: {} as { name: string; id: string }
});

const isDataPresent = computed(() => {
  if(title.value?.length || description.value?.length){
    state.activeTab = TABS[0];
  }
  return title.value?.length || description.value?.length;
});

const previewImg = computed(() => {
  const formData = store.getters['alertCreate/getAlertFormData'];
  const defaultImageData = store.getters['common/getFormDetails']?.defaultImage;
  const imageType = formData?.card_image_type;

  if (!imageType) return '';

  switch (imageType) {
    case 'category_image':
      return formData?.card_image_file || '';
    case 'default_image':
      return defaultImageData;
    case 'new_image':
      return formData?.card_image_file ? `data:image/jpeg;base64,${formData.card_image_file}` : '';
    case 'no_image':
      return '';
    default:
      return formData?.image_file_link || '';
  }
});

const title = computed(() => {
  return store.getters['alertCreate/getAlertFormData']?.title || '';
});

const description = computed(() => {
  return store.getters['alertCreate/getAlertFormData']?.content || '';
});

const isPreviewSelected = computed(() => {
  return state.activeTab.id === "preview";
})

function changeTab(tab: any) {
  state.activeTab = tab
  if(state.activeTab.id === TABS[1].id){
    fetchComments();
  }
}
</script>

<template>
  <div v-if="isDataPresent" class="cyw-pb-5 cyw-px-5 comment-section" v-bind="testId()">
    <div class="cyw-flex-justify-center cyw-text-f12 cyw-mb-3 cyw-color-N700">
      <CySwitcher v-if="visibleComments" ref="switcherRef" :options="TABS" :currentOption="state.activeTab.id"
        @change="changeTab($event)">
      </CySwitcher>
      <div v-else>{{ $t('alerts.alert-form-step.preview-button') }}</div>
    </div>
    <template v-if="isPreviewSelected">
      <div class="cyw-text-medium cyw-text-f16 cyw-color-N900 overflow-wrap">
        {{ title }}
      </div>
      <img :src="previewImg" :style="previewImg ? { 'aspect-ratio': '3/1', 'object-fit': 'cover' } : null"
        class="cyw-w-100 cyw-h-auto cyw-my-3" />
      <SanitizeHtml :text="description" class="overflow-wrap cyw-text-f12 cyw-color-N800" />
    </template>
    <CommentsList v-else />
  </div>
  <div v-else class="cyw-h-100 cyw-flex-justify-center cyw-flex-align-center cyw-text-f12">
    {{ $t('alerts.alert-form.preview-your-changes-label') }}
  </div>
</template>
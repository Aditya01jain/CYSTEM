<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { baseUrl } from '@/shared/utils';
import { formatBytes } from '@/utils';
import { FROALA_OPTIONS, FROALA_OPTIONS_WITH_COMMENT } from '@/components/alertCreate/config';
import PublisherComments from '@/components/comments/PublisherComments.vue';
import { useCommentsStore } from '@/store/modules/useComments';
const { visibleComments } = useCommentsStore();
import { validateAndDefang, makeFang } from '@/utils/fangdefang';
import { isEmpty } from 'lodash';

const { t: $t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Summary'
  },
  placeholder: {
    type: String,
    default: ''
  },
  modelKey: {
    type: String,
    default: ''
  },
  modelKeyCategory: {
    type: Object,
    default: {}
  },
  required: {
    type: Boolean
  },
  maxLength: {
    type: Number
  },
  modelIndex: {
    type: Number,
    default: 0
  },
  name: {
    type: String,
    default: ''
  },
  fangDefangStatus: {
    type: Object,
    default: {}
  },
  disabled: {
    type: Boolean,
    default: false
  },
  key: {
    type: Boolean,
    default: false
  },
  referencesList: {
    type: Array<any>,
    default: []
  },
  modalReference: {
    type: Object,
    default: {}
  },
  showAddReferences: {
    type: Boolean,
    default: false
  },
  dataTestid: {
    type: String,
    default: ''
  },
  disableComment: {
    type: Boolean,
    default: false
  },
  showFangDefang: {
    type: Boolean,
    default: true
  },
  wrapperClass: {
    type: String,
    default: ''
  }
});

const state = reactive({
  content: '',
  config: {},
  commentData: {},
  showPublisherComments: false,
  referenceOptions: [],
  deFanged: false
});

const emit = defineEmits(['update:modelValue', 'add:reference', 'isDefanged']);

const editorRef = ref();

const ERROR_CODE = {
  FILE_UPLOAD: 3,
  FILE_TOO_LARGE: 5
};

const FILE_UPLOAD = {
  ALLOWED_TYPES: (types: string[]) => `Only following files are allowed: ${types.join(', ')}`,
  ALLOWED_SIZE: (bytes: number) => {
    const size = formatBytes(bytes);
    return `Maximum file size allowed is ${size}`;
  },
  INVALID_FILE_NAME: 'File name is not valid. Review and try again.',
  PERMITTED_FILE_TEXT:
    'Permitted characters include (A-Z), (a-z), (0-9), ( ), [ ], { }, ( - ), (+) and ( _ ).',
  INVALID_FILE_SIZE:
    'File size must be less than 10 MB. Reduce file size or upload a different file.'
};

function defangContent() {
  state.content = validateAndDefang(state.content);
  emit('update:modelValue', state.content);
  emit('isDefanged', true);
}

function fangContent() {
  state.content = makeFang(state.content);
  emit('update:modelValue', state.content);
  emit('isDefanged', false);
}

const getConfigOptions = computed(() => ({
  ...getFroalaConfig(),
  events: {
    'image.uploaded': (response: string) => {
      const data: Record<string, any> = JSON.parse(response);
      const { id } = data;
      const link = `${baseUrl()}/api/admin/file-stream/alert-featured-image/${id}/`;
      editorRef.value.editor.image.insert(
        link,
        false,
        { id, 'data-image-id': id },
        editorRef.value.editor.image.get(),
        data
      );
      return false;
    },
    'image.inserted': (img: any) => {
      const id = img[0].id;
      img.attr('data-image-id', id);
    },
    'image.error': (error: any) => {
      if (error.code == ERROR_CODE.FILE_UPLOAD) {
        showErrorModal(FILE_UPLOAD.INVALID_FILE_NAME);
      } else if (error.code == ERROR_CODE.FILE_TOO_LARGE) {
        showErrorModal(FILE_UPLOAD.INVALID_FILE_SIZE);
      }
    }
  }
}));

function showErrorModal(errorText: string) {
  const $popup = editorRef.value.editor.popups.get('image.insert');
  const $layer = $popup.find('.fr-image-progress-bar-layer');
  $layer.find('h3').text(errorText);
}

const getFroalaConfig = () => {
  let config =
    !props.disableComment && visibleComments ? FROALA_OPTIONS_WITH_COMMENT : FROALA_OPTIONS;

  if (props.showAddReferences) {
    config = {
      ...config,
      toolbarButtons: {
        ...config.toolbarButtons,
        moreMisc: {
          ...config.toolbarButtons.moreMisc,
          buttons: ['reference', ...config.toolbarButtons.moreMisc.buttons],
          buttonsVisible: config.toolbarButtons.moreMisc.buttonsVisible + 1
        }
      },
      pluginsEnabled: [...config.pluginsEnabled, 'reference']
    };
  }
  return config;
};

function onUpdateModelValue($event: any) {
  state.content = $event;
  isEmpty(state.content) ? fangContent() : emit('update:modelValue', state.content);
}

const onCallback = (params: Record<string, any> = {}) => {
  if (params?.type) {
    if (params?.type === 'select' && params?.selectedValue === 'addNewReference') {
      emit('add:reference');
    } else if (params.type === 'getReferenceList') {
      return referenceOptions.value;
    } else {
      state.showPublisherComments = true;
      state.commentData = { ...params };
    }
  }
};

const onRemoveClass = (id: string) => {
  state.content = state.content.replace(
    new RegExp(`<span[^>]*data-commentid="${id}"[^>]*>(.*?)<\/span>`, 'g'),
    '$1'
  );
  emit('update:modelValue', state.content);
};

const referenceOptions = computed(() =>
  props.referencesList
    ?.filter((item: Record<string, any>) => item.url)
    ?.map((refList: Record<string, any>) => ({
      label: refList?.source?.source_url_name,
      value: refList?.source?.source_url_name,
      link: refList?.url
    }))
);

watch(
  () => props.modelValue,
  (val) => {
    state.content = val;
  },
  { immediate: true, deep: true }
);

watch(
  () => props.modalReference,
  (newVal: any) => {
    if (newVal?.url) {
      editorRef?.value?.editor?.reference?.addLink({
        value: newVal?.source?.source_url_name,
        link: newVal.url,
        addLinkInSameLine: true
      });
    }
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <div
    :class="`cyw-w-100 cyw-h-auto ${props.wrapperClass} ${
      !state.commentData?.isFullScreen ? 'cyw-position-relative' : ''
    }`"
  >
    <CyInputEditor
      ref="editorRef"
      :disabled="props.disabled"
      class="cyw-mt-0 csp-input-editor"
      :label="props.label"
      :key="props.key"
      :name="props?.name"
      :placeholder="props.placeholder"
      v-bind="{ configOptions: { ...getConfigOptions, callback: onCallback } }"
      :modelValue="state.content"
      :maxlength="props?.maxLength"
      :required="props?.required"
      :data-testid="props.dataTestid"
      @update:modelValue="onUpdateModelValue"
    />

    <PublisherComments
      v-if="state.showPublisherComments"
      :commentData="state.commentData"
      :modelValue="state.content"
      :modelKey="props.modelKey"
      :modelKeyCategory="props.modelKeyCategory"
      :modelIndex="props.modelIndex"
      :fangDefangStatus="props.fangDefangStatus"
      @remove:span:class="onRemoveClass"
      @update:modelValue="onUpdateModelValue"
    />
    <div class="cyw-flex-justify-end" v-if="props.showFangDefang">
      <CyButton
        type="tertiary"
        :data-testid="props.dataTestid + '-fang'"
        :disabled="props.disabled"
        @click="fangContent"
      >
        {{ $t('alerts.buttons.fang') }}
      </CyButton>
      <CyButton
        type="tertiary"
        :data-testid="props.dataTestid + '-defang'"
        :disabled="props.disabled"
        @click="defangContent"
      >
        {{ $t('alerts.alert-form.defang-button') }}
      </CyButton>
      <slot name="extra-button"></slot>
    </div>
  </div>
</template>
<style lang="scss">
.csp-input-editor {
  span[data-commentid] {
    background: var(--P200);
    color: var(--N900);
    display: inline;
    cursor: pointer;
    text-decoration: inherit;
  }
  span[data-commentid] * {
    background: transparent !important;
  }
  a[href] {
    color: var(--P600)
  }
}
</style>

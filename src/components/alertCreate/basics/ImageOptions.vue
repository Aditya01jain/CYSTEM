<script setup lang="ts">
import { reactive, computed, onMounted, watch, ref } from 'vue';
import { isEmpty } from 'lodash';
import { useStore } from '@/store';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import { initTestId } from '@/utils/testid';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();
const testId = initTestId('ac', 'image');
const { setToasterMsg } = useCommonData();

import { LOGO_TYPES, MAX_FILE_SIZE_ALLOWED } from '@/components/alertCreate/basics/config';

const validImageRef = ref(null);
const fileUploadRef = ref(null);

async function validateImage(
  file: Blob,
  options: {
    maxFileSize: number;
    allowedTypes: string[];
    validateResolution?: boolean;
    minWidth?: number;
    minHeight?: number;
  }
): Promise<string> {
  const {
    maxFileSize,
    allowedTypes,
    validateResolution = true,
    minWidth = 300,
    minHeight = 300
  } = options;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e: any) => {
      // Check if the file size exceeds the maximum allowed size in MB
      if (file.size / 1024 / 1024 > maxFileSize) {
        setToasterMsg('error', {
          title: 'Error',
          message: `The maximum file size allowed is ${maxFileSize} MB. Reduce file size or upload a different file.`
        });
        handleReject();
        reject();
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setToasterMsg('error', {
          title: 'Error',
          message: 'File type is not supported. Review and try again.'
        });
        handleReject();
        reject();
        return;
      }

      const imageContent: string = e.target.result;
      if (validateResolution) {
        const { width, height, ratio } = await checkResolution(imageContent);

        const ratioToleranceWindow = [ratio.value * 0.98, ratio.value * 1.02];
        const isValidRatio =
          Number.parseFloat(ratio) >= ratioToleranceWindow[0] &&
          Number.parseFloat(ratio) <= ratioToleranceWindow[1];
        if (!isValidRatio || width < minWidth || height < minHeight) {
          try {
            if (validImageRef.value) {
              validImageRef.value.open({ type: 'error' }, {}, { fn: resolve, data: imageContent });
            }
          } catch {
            handleReject();
            reject();
          }
        }
      }
    };
  });
}

const ratio = computed(() => {
  return Math.floor(imageInfo.value.minWidth / imageInfo.value.minHeight);
});

const tlp = computed(() => {
  return store.getters['alertCreate/getAlertFormData']?.tlp;
});

const tlpConfig = computed(() =>
  Object.values(store.getters['alertCreate/getAlertFormListData']?.['tlp-config-data'] || {})
);

async function checkResolution(
  imageContent: string
): Promise<{ width: number; height: number; ratio: string }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = imageContent;

    image.onload = function () {
      const context: any = this;
      const ratio = (context.width / context.height).toFixed(2);
      resolve({ width: context.width, height: context.height, ratio });
    };
  });
}

const { updateAlertFormStore } = useAlertBasicsData();

const store: Record<string, any> = useStore();

const state = reactive({
  field: {
    key: 'card_image',
    label: $t('alerts.labels.alert-image'),
    defaultValue: '',
    required: true,
    type: 'image'
  },
  imageMap: [
    {
      key: 'default_image',
      label: $t('alerts.labels.default-image'),
      disabled: false
    },
    {
      key: 'category_image',
      label: $t('alerts.labels.category-image'),
      disabled: false
    },
    {
      key: 'new_image',
      label: $t('alerts.labels.upload-new-image'),
      disabled: false
    },
    {
      key: 'no_image',
      label: $t('alerts.labels.none'),
      disabled: false
    },
    {
      key: 'uploaded_image',
      label: $t('alerts.labels.existing-image'),
      disabled: false
    }
  ] as Record<string, any>[],
  selectedOption: 'default_image',
  fileValue: null,
  validImage: null,
  resolveImage: false
});

const imageInfo = computed(() => {
  const idx = LOGO_TYPES.findIndex((type: Record<string, any>) => type.id === 'card_default_logo');
  return {
    maxFileSize: MAX_FILE_SIZE_ALLOWED,
    minWidth: LOGO_TYPES[idx].visibleWidth || 300,
    minHeight: LOGO_TYPES[idx].visibleHeight || 300,
    allowedTypes: ['image/png', 'image/jpeg', 'image/jpg']
  };
});

const msg = reactive({
  title: $t('alerts.close-speedbump.warning-title'),
  subTitle: $t('alerts.speedbumps.upload-image', {
    minWidth: imageInfo.value.minWidth,
    minHeight: imageInfo.value.minHeight,
    AspectRatio: ratio.value
  }),
  confirmText: $t('alerts.speedbumps.continue-anyway')
});

const tenantDefaultImage = computed(() => {
  return store.getters['common/getTenantDetails']?.tenant_card_default_image || '';
});

const getCatgoryDefaultImage = computed(() => {
  const categoryList = store.getters['alertCreate/getAlertFormListData']['category-list'] || [];
  const selectedcategory = store.getters['alertCreate/getAlertFormData']['card_category'];
  const targetCategory = categoryList.find(
    (category: Record<string, any>) => category.category_id === selectedcategory?.category_id
  );
  return targetCategory?.category_image_link || '';
});

const displayImgUrl = computed(() => {
  if (state.selectedOption === 'default_image') return tenantDefaultImage.value;
  else if (state.selectedOption === 'category_image') return getCatgoryDefaultImage.value;
  else if (state.selectedOption === 'new_image' && state.validImage) {
    return state.validImage;
  } else return '';
});

const updateImageOptionsdata = async (key: any) => {
  state.fileValue = key.target.files[0];
  updateAlertFormStore('card_image_file_name', key.target.files[0].name);
  store.dispatch('common/setFormDetails', { files: key });
  if (state.fileValue) {
    try {
      await validateImage(state.fileValue, {
        maxFileSize: imageInfo.value.maxFileSize,
        allowedTypes: imageInfo.value.allowedTypes,
        minWidth: imageInfo.value.minWidth,
        minHeight: imageInfo.value.minHeight
      });
    } catch (error) {
      //
    }
  }
};

function resetNewImageState() {
  state.fileValue = null;
  state.validImage = null;
  fileUploadRef.value?.remove(null);
}

const updateImageOptions = async (key: string) => {
  if (key === 'new_image' && state.selectedOption !== 'new_image') {
    resetNewImageState();
  }
  state.selectedOption = key;
  store.dispatch('common/setFormDetails', { selectedOption: key });
  updateAlertFormStore('card_image_type', key);
  const doNotShowImage = key === 'no_image';
  updateAlertFormStore('do_not_show_image', doNotShowImage);
  if (doNotShowImage) return;
  const isDefaultImage = ['default_image'].includes(key);
  const isImageKey = ['category_image'].includes(key);
  const isNewImageKey = key === 'new_image';
  if (isDefaultImage)
    store.dispatch('common/setFormDetails', { defaultImage: displayImgUrl.value });
  if (isImageKey) {
    updateAlertFormStore('card_image_file', displayImgUrl.value);
  } else if (isNewImageKey) {
    updateAlertFormStore('card_image_file', displayImgUrl.value.split(',')[1]);
  }
  if (!isImageKey && !isNewImageKey) {
    return store.getters['alertCreate/getAlertFormData'].image_file_link;
  }
};

const filteredImageMap = computed(() => {
  const alertData = store.getters['alertCreate/getAlertFormData'];
  const idValue = alertData.short_id || alertData.copied_short_id;
  const options = getCatgoryDefaultImage.value
    ? ['default_image', 'category_image', 'new_image', 'no_image']
    : ['default_image', 'new_image', 'no_image'];

  const { image_file_link } = store.getters['alertCreate/getAlertFormData'];
  if (!!idValue || image_file_link) {
    options.push('uploaded_image');
  }

  return state.imageMap.filter((option) => options.includes(option.key));
});

function handleResolve(validatedImage: any) {
  state.validImage = validatedImage?.data;
}

function removeFile() {
  state.validImage = null;
  state.selectedOption = 'default_image';
  updateImageOptions('default_image');
}

function handleReject() {
  if (fileUploadRef.value) {
    fileUploadRef.value.remove(null);
  }
}

watch(
  () => displayImgUrl.value,
  (newValue) => {
    if (newValue) {
      updateImageOptions(state.selectedOption);
    }
  }
);

function updateImageOptionsMap(tlp: string, tlpConfig: Record<string, any>) {
  if (!tlp || isEmpty(tlpConfig)) return;
  const findTlpConfig: Record<string, any> | undefined = tlpConfig?.find(
    (item: Record<string, any>) => item.tlp === tlp
  );
  state.imageMap = state.imageMap.map((item: Record<string, any>) => {
    if (item.key !== 'no_image') {
      if (!findTlpConfig?.image_to_member_portal) {
        item.disabled = true;
        updateImageOptions('no_image');
      } else {
        item.disabled = false;
      }
    }
    return item;
  });
}

watch(
  () => tlp.value,
  (newValue) => {
    updateImageOptionsMap(newValue, tlpConfig.value);
  }
);

watch(
  () => tlpConfig.value,
  (newValue) => {
    updateImageOptionsMap(tlp.value, newValue);
  }
);

onMounted(() => {
  const { image_file_link } = store.getters['alertCreate/getAlertFormData'];
  const noImage = store.getters['alertCreate/getAlertFormData'].do_not_show_image;

  if (image_file_link) updateImageOptions('uploaded_image');
  else if (noImage) updateImageOptions('no_image');
  else updateImageOptions('default_image');
});
</script>

<template>
  <div class="cyw-label cyw-text-f14 cyw-text-medium">
    {{ state.field.label }}
  </div>
  <div class="cyw-flex-wrap cyw-mt-3">
    <div v-for="(imgOption, index) in filteredImageMap" :key="index" class="cyw-mr-4">
      <CyRadio
        :option="true"
        :modelValue="state.selectedOption === imgOption.key"
        @update:modelValue="updateImageOptions(imgOption.key)"
        v-bind="testId(imgOption.key)"
        :label="imgOption.label"
        :disabled="imgOption.disabled"
      />
    </div>
  </div>
  <div v-if="state.selectedOption === 'new_image'" class="cyw-mt-4">
    <CyFileUpload
      :maxSize="imageInfo.maxFileSize * 1024 * 1024"
      ref="fileUploadRef"
      accept=".png, .jpg, .jpeg"
      :value="state.fileValue"
      :dragDrop="true"
      v-bind="testId('new-image')"
      @change="updateImageOptionsdata"
      @remove="removeFile"
    >
      <template #extra-info>
        <p class="cyw-my-3 cyw-text-f12 cyw-color-N600">
          {{ $t('alerts.image-options.recommended-size-message') }}
        </p>
      </template>
    </CyFileUpload>
    <div v-bind="testId('info')" class="cyw-text-f12 cyw-ml-4">
      <span class="cyw-text-semi-bold cyw-mr-2">{{ $t('alerts.labels.note') }} </span>
      <span class="cyw-color-N600">{{ $t('alerts.upload-new-image.note') }}</span>
    </div>
  </div>
  <CyAlert
    ref="validImageRef"
    v-bind="testId('valid')"
    :message="msg"
    @cancel="handleReject"
    @confirm="handleResolve"
  ></CyAlert>
</template>

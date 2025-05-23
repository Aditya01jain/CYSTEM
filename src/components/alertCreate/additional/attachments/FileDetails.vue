<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { FILE_DETAILS_RULE } from '../rules';
import { initTestId } from '@/utils/testid';
const { t: $t } = useI18n();

const emit = defineEmits(['updated', 'close:details', 'replace']);

const props = defineProps({
  details: {
    default: {} as Record<string, any>
  },
  replaceDisabled: {
    default: true
  },
  dataTestid: {
    default: 'file-details',
    type: String
  }
});

const testId = initTestId(props.dataTestid, 'file-details');

const fileDetailsFormRef = ref();

const fileDetails = reactive({
  name: '',
  description: '',
  tags: [],
  updateClicked: false,
  currFileName: ''
});

const openFileDetails = () => {
  fileDetails.name = props.details?.file_name?.substring(
    0,
    props.details?.file_name?.lastIndexOf('.')
  );
  fileDetails.description = props.details.description;
  fileDetails.currFileName = fileDetails.name;
};

const onUpdate = () => {
  fileDetailsFormRef.value.validate((valid: boolean) => {
    if (valid) {
      fileDetails.updateClicked = true;
      emit(
        'updated',
        {
          ...props.details,
          file_name: `${fileDetails.name}.${props.details.file_format}`,
          description: fileDetails.description,
          document_tag: fileDetails.tags
        },
        'Doc Library/'
      );
      fileDetails.tags = [];
    }
  });
};

function changeUpdateClicked(value: boolean) {
  fileDetails.updateClicked = value;
}

const onCancelDetails = () => {
  if (fileDetails.updateClicked) return;
  emit('close:details');
  fileDetailsFormRef.value.clearValidate();
  fileDetails.tags = [];
};

defineExpose({
  openFileDetails: openFileDetails,
  onCancelDetails: onCancelDetails,
  changeUpdateClicked: changeUpdateClicked
});
</script>
<template>
  <Teleport to="#attachments-header">
    <div class="cyw-h4" v-bind="testId('header')">
      {{ $t('alerts.file-upload.file-details-title') }}
    </div>
  </Teleport>
  <el-form
    @submit.prevent
    ref="fileDetailsFormRef"
    :model="fileDetails"
    :rules="FILE_DETAILS_RULE($t)"
  >
    <div>
      <el-form-item prop="name" v-bind="testId('file-name-form-item')">
        <CyInput
          class="cyw-w-100"
          :maxlength="100"
          v-bind="testId('file-name')"
          showCount
          v-model="fileDetails.name"
          :label="$t('alerts.file-upload.filename-field')"
          size="md"
        >
          <template #append>{{ props.details.file_format }}</template>
        </CyInput>
      </el-form-item>
      <CyTextarea
        :maxlength="2500"
        v-bind="testId('description')"
        showCount
        class="cyw-my-5"
        :label="$t('alerts.file-upload.description-field')"
        v-model="fileDetails.description"
      />
      <InputTags v-model="fileDetails.tags"></InputTags>
    </div>
  </el-form>
  <Teleport to="#attachments-footer">
    <div class="cyw-flex-justify-end">
      <cy-button
        @click="onCancelDetails"
        v-bind="testId('cancel')"
        type="tertiary"
        class="cyw-mr-3"
        >{{ $t('alerts.buttons.cancel') }}</cy-button
      >
      <cy-button
        type="secondary"
        class="cyw-mr-3"
        v-bind="testId('replace')"
        :disabled="props.replaceDisabled || fileDetails.currFileName !== fileDetails.name"
        @click="
          emit('replace', props.details.document_id);
          changeUpdateClicked(true);
        "
      >
        {{ $t('alerts.buttons.replace') }}
      </cy-button>
      <cy-button @click="onUpdate" v-bind="testId('update')">
        {{ $t('alerts.file-upload.update-button') }}
      </cy-button>
    </div>
  </Teleport>
</template>

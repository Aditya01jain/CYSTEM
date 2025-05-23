<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { ADDITIONAL_INFORMATION_RULE, REQUIRED_RULE } from './additional/rules';

const { fetchReferenceName } = useAlertBasicsData();
const { t: $t } = useI18n();
const referenceModalRef = ref()
const modalReferenceLinkFormRef: any = ref();

const emit = defineEmits([
  'click:addNewReference'
]);

const props = defineProps({
  currentIdx: {
    default: 0
  },
  getUniqueName: {
    default: () => ({})
  }
})

const state = reactive({
  modalReference: {
    source_detail_id: '',
    source: {
      source_tld: '',
      source_url_name: ''
    },
    idx: 0,
    url: ''
  },
  formValid: false,
  adding: false,
  isSubmitDisabled: true
})


function showReferenceModal() {
  state.isSubmitDisabled = true;
  referenceModalRef?.value?.show();
}

function closeReferenceModal(idx: number) {
  setTimeout(() => {
    state.modalReference = {
      source_detail_id: '',
      source: {
        source_tld: '',
        source_url_name: ''
      },
      idx: idx,
      url: ''
    }
  }, 1000)
  modalReferenceLinkFormRef.value.clearValidate();
  referenceModalRef?.value?.hide();
}

function updateModalUrl(value: string) {
  state.modalReference.url = value;
  validateModalUrl();
};

async function validateModalUrl() {
  try {
    await modalReferenceLinkFormRef.value.validate();
    state.formValid = true
  } catch {
    state.formValid = false
  }
};

async function fetchModalNameAndUpdate() {
  if (!state.modalReference.url) return;
  const data: Record<string, any> = await fetchReferenceName({
    url: state.modalReference.url
  });
  if(data?.tld) state.isSubmitDisabled = false;
  const name = props.getUniqueName(data.tld, 0);
  state.modalReference.source.source_url_name = name;
};

async function addModalReference(idx: number) {
  state.adding = true
  emit('click:addNewReference', state.modalReference, idx)
  state.modalReference.idx = idx;
  state.adding = false
  closeReferenceModal(idx);
}

function isAddReferenceDisabled() {
 return !state.modalReference.url || !state.formValid || !state.modalReference.source.source_url_name || state.isSubmitDisabled;
}

defineExpose({ showReferenceModal, closeReferenceModal });

</script>
<template>
  <CyModal ref="referenceModalRef" class="csp-alert-z-index" :headerClass="'ca-border-0'" :footer="true"
    :noCloseIcon="true" :title="$t('alerts.alert-form-step.add-reference-button')">
    <template #modal-content>
      <div class="cyw-flex" tabindex="0">
        <div class="reference__url">{{ $t('alerts.alert-form.reference-url-section') }}</div>
        <div class="reference__name cyw-ml-5">{{ $t('alerts.alert-form.reference-name-section') }}</div>
      </div>
      <div class="cyw-mb-4">
        <el-form ref="modalReferenceLinkFormRef" :model="state.modalReference" class="cyw-flex cyw-flex-align-center " @submit.prevent>
          <div class="reference__url">
              <el-form-item prop="url" :rules="ADDITIONAL_INFORMATION_RULE($t)">
                <CyInput class="cyw-flex-grow-1" size="md" :modelValue="state.modalReference.url" name="url"
                  @update:modelValue="updateModalUrl" @blur="fetchModalNameAndUpdate" />
              </el-form-item>
          </div>
          <div class="reference__name">
            <el-form-item prop="source.source_url_name" class="cyw-ml-5"  :rules="REQUIRED_RULE($t)">
              <CyInput
                v-model="state.modalReference.source.source_url_name" 
                size="md" 
                @blur="modalReferenceLinkFormRef.validateField('source.source_url_name')"
              />
            </el-form-item>
          </div>
         </el-form>
      </div>
    </template>
    <template #modal-footer>
      <div class="cyw-flex-justify-end">
        <CyButton type="subtle" class="cyw-mr-3" @click="closeReferenceModal(currentIdx)">
          {{ $t('alerts.buttons.cancel') }}
        </CyButton>
        <CyButton 
          type="primary" 
          :disabled="isAddReferenceDisabled()"
          :loading="state.adding"
          @click="addModalReference(currentIdx)"
        >
          {{ $t('alerts.alert-form.add-button') }}
        </CyButton>
      </div>
    </template>
  </CyModal>
</template>
<style lang="css" scoped>
.csp-alert-z-index{
  z-index: 2147483640;
}
</style>
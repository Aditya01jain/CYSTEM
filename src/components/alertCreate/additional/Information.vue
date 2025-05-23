<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import store from '@/store';
import EditorWithReference from '@/components/alertCreate/EditorWithReference.vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
const { updateAlertFormStore } = useAlertBasicsData();
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'additional-information');

const { t: $t } = useI18n()

const editorRef: any = ref()

const alertFormData = computed(() => store.getters['alertCreate/getAlertFormData']);

const validate = computed(
  () => store.getters['alertCreate/getFormValid']?.additional?.validate || false
);

watch(
  () => validate.value,
  async (val) => {
    if (val) {
      let valid = await editorRef.value?.validateReferenceURL()
      store.dispatch('alertCreate/setFormValid', {
        additional: { 'additional-information': valid }
      });
    }   
  }, 
  { immediate: true }
);
</script>

<template>
  <EditorWithReference 
    ref="editorRef"
    :label="$t('alerts.form-interactions.description')" 
    :modelValue="alertFormData.card_info"
    :showReferenceListing="true"
    v-bind="testId()"
    :fangDefangStatus="{ is_card_info_defanged: alertFormData.is_card_info_defanged }"
    @is-defanged="updateAlertFormStore('is_card_info_defanged', $event)"
    @update:modelValue="updateAlertFormStore('card_info', $event)"
  />
</template>
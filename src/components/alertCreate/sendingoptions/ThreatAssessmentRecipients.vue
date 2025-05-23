<script setup lang="ts">
import { computed, onMounted, reactive, watch, ref } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useStore } from '@/store';
import { RECIPIENT_RULES } from '@/components/alertCreate/sendingoptions/rules';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'threat-assessment-recipients');
const store: Record<string, any> = useStore();

const { updateAlertFormStore } = useAlertBasicsData();

const props = defineProps({
  disabled: {
    default: false
  }
});

const state = reactive({
  model: {} as Record<string, any>
});

const threatRef = ref();

const selectedThreatRecipient = computed(
  () => store.getters['alertCreate/getAlertFormData']['acknowledgement_type_group'] || []
);

const getRecipientList = computed(
  () => store.getters['alertCreate/getAlertFormData']['card_group'] || []
);

const threatAssessment = computed(
  () => store.getters['alertCreate/getAlertFormData']['acknowledgement_type_data'] || {}
);

const getThreatRecipientList = computed(
  () =>
    getRecipientList.value.map((group: Record<string, any>) => {
      if (!group.label) {
        group.label = group.email;
      }
      return group;
    }) || []
);

const updateThreatRecipientGroups = (e: Record<string, any>[]) => {
  state.model.acknowledgement_type_group = e;
  updateAlertFormStore('acknowledgement_type_group', state.model.acknowledgement_type_group);
};

onMounted(() => {
  state.model.acknowledgement_type_group = selectedThreatRecipient.value;
});

watch(
  () => getThreatRecipientList.value,
  (newList, oldList) => {
    if (newList.length === oldList.length) return;
    if (state.model.acknowledgement_type_group?.length) {
      const validGroupIds = new Set(newList.map((item: { group_id: string }) => item.group_id));
      state.model.acknowledgement_type_group = state.model.acknowledgement_type_group.filter(
        (group: Record<string, any>) => validGroupIds.has(group.group_id)
      );
      updateAlertFormStore('acknowledgement_type_group', state.model.acknowledgement_type_group);
    }
  },
  { deep: true }
);
</script>
<template>
  <el-form-item
    ref="threatRef"
    prop="acknowledgement_type_group"
    :rules="RECIPIENT_RULES($t)?.card_group"
    v-bind="testId('form-item')"
  >
    <CySelect
      v-bind="testId()"
      class="cyw-select-menu"
      :floatLabel="false"
      :showSearch="true"
      :multiple="true"
      name="recipient-users"
      :label="$t('alerts.labels.threat-assessment-title', { Question: threatAssessment.question })"
      :placeholder="$t('alerts.placeholder.search-recipients')"
      searchIdentifier="group_name"
      valueIdentifier="group_name"
      identifier="group_id"
      :data="getThreatRecipientList"
      :modelValue="state.model.acknowledgement_type_group"
      size="md"
      :disabled="!getThreatRecipientList?.length || props.disabled"
      @update:modelValue="updateThreatRecipientGroups"
      @blur="threatRef.validate()"
    >
    </CySelect>
  </el-form-item>
</template>

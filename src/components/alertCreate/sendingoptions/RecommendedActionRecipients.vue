<script setup lang="ts">
import { computed, reactive, watch, ref } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useStore } from '@/store';
import { RECIPIENT_RULES } from '@/components/alertCreate/sendingoptions/rules';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'recommended-action-recipients');
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

const actionRef = ref();

const recommendedActions = computed(() => {
  return store.getters['alertCreate/getAlertFormData']['recommended_actions'] || [];
});

const getRecipientList = computed(
  () => store.getters['alertCreate/getAlertFormData']['card_group'] || []
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

const updateThreatRecipientGroups = (idx: number, key: string, value: string) => {
  state.model.recommended_actions[idx][key] = value;
  updateAlertFormStore('recommended_actions', state.model.recommended_actions);
};

async function validate(index: number) {
  try {
    await actionRef.value[index].validate();
  } catch {
    //
  }
}

watch(
  () => recommendedActions.value,
  () => {
    state.model.recommended_actions = [...recommendedActions.value];
  },
  { deep: true, immediate: true }
);

watch(
  () => getThreatRecipientList.value,
  (newList) => {
    state.model.recommended_actions.forEach((recipient: Record<string, any>) => {
      recipient.assigned_groups =
        newList.length === 0
          ? []
          : recipient.assigned_groups.filter((group: Record<string, any>) =>
              newList.some((item: Record<string, any>) => item.group_id === group.group_id)
            );
    });

    updateAlertFormStore('recommended_actions', state.model.recommended_actions);
  },
  { deep: true, immediate: true }
);
</script>
<template>
  <div v-for="(recipient, index) in state.model.recommended_actions" :key="index">
    <el-form-item
      ref="actionRef"
      :prop="`recommended_actions.${index}.assigned_groups`"
      :rules="RECIPIENT_RULES($t)?.card_group"
      class="cyw-mb-4"
      v-bind="testId(`${index}-form-item`)"
    >
      <CySelect
        v-bind="testId(`${index}`)"
        class="cyw-select-menu"
        :name="`recommended_actions.${index}.assigned_groups`"
        :label="`${$t('alerts.labels.recommended-action')}${index + 1} (${recipient.title}) *`"
        :floatLabel="false"
        :showSearch="true"
        :multiple="true"
        placeholder="Search Users"
        searchIdentifier="group_name"
        valueIdentifier="group_name"
        identifier="group_id"
        :data="getThreatRecipientList"
        :modelValue="recipient.assigned_groups"
        size="md"
        :disabled="!getThreatRecipientList?.length || props.disabled"
        @update:modelValue="updateThreatRecipientGroups(index, 'assigned_groups', $event)"
        @blur="validate(index)"
      >
      </CySelect>
    </el-form-item>
  </div>
</template>

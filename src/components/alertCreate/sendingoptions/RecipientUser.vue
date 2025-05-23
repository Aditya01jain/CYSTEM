<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import { RECIPIENT_GROUP_TYPE } from './config';
import store from '@/store';
import { initTestId } from '@/utils/testid';
import { useI18n } from 'vue-i18n';

const testId = initTestId('ac', 'recipient-user');
const { t: $t } = useI18n();
const { updateAlertFormStore } = useAlertBasicsData();
const { isFieldAccessableToMe } = useCommonData();

const emit = defineEmits(['validate:field']);

const props = defineProps({
  disabled: {
    default: false
  }
});

const state = reactive({
  model: {} as Record<string, any>,
  selectedUsers: [] as Record<string, any>[],
  recipientGroupTypes: RECIPIENT_GROUP_TYPE($t)
});

const showAsterik = computed(
  () =>
    state.model.recipient_users?.length ||
    !store.getters['alertCreate/getAlertFormData']?.card_group?.length
);

const selectedUserGroups = computed(
  () => store.getters['alertCreate/getAlertFormData']['card_group'] || []
);

const updateRecipientUsers = () => {
  const groups = state.model.recipient_users?.map((item: Record<string, any>) => {
    item['group_id'] = item.email;
    item['group_name'] = item.email;
    item['group_purpose'] = 2;
    return item;
  });
  updateAlertFormStore('card_group', [
    ...selectedUserGroups.value.filter((group: Record<string, any>) => group.group_purpose !== 2),
    ...groups
  ]);
  emit('validate:field', 'card_group');
};

onMounted(() => {
  state.model.recipient_users =
    store.getters['alertCreate/getAlertFormData']?.card_group
      ?.filter((obj: any) => obj.group_purpose === 2)
      ?.map((obj: any) => ({ ...obj, email: obj.group_name })) || [];
});
</script>

<template>
  <el-form-item
    v-if="isFieldAccessableToMe('recipient-user')"
    prop="card_group"
    class="cyw-mb-3"
    v-bind="testId('form-item')"
  >
    <input-user-dropdown
      v-bind="testId()"
      class="cyw-select-menu cyw-mt-4 cyw-w-100"
      :multiple="true"
      :label="`${$t('alerts.form-interactions.individual-users')} ${showAsterik ? '*' : ''}`"
      name="recipient-users"
      placeholder="Search & Select"
      valueIdentifier="email"
      identifier="email"
      link="analyst.alertformrecipientusers"
      v-model="state.model.recipient_users"
      @update:modelValue="updateRecipientUsers"
      size="md"
      :disabled="props.disabled"
    />
  </el-form-item>
</template>

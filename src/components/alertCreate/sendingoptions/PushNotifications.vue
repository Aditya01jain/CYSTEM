<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'push-notifications');
const store: Record<string, any> = useStore();
const { t: $t } = useI18n();

const { updateAlertFormStore } = useAlertBasicsData();
const { isFlagAccessableToTenant } = useCommonData();

const props = defineProps({
  disabled: {
    default: false
  },
  pushEnabled: {
    default: false
  }
});

const state: any = reactive({
  email_notification_group: [] as Record<string, any>[],
  push_notification_group: [] as Record<string, any>[],
  push_required: true,
  push_email_notification: true,
  sms_alert: true,
  call_alert: true,
  additional_sms_alert: false,
  additional_sms_alert_text: '',
  mounted: false
});

const selectedRecipients = computed(() => {
  return store.getters['alertCreate/getAlertFormData']['card_group'] || [];
});

const selectedGroups = computed(() => {
  return (
    selectedRecipients.value?.filter((item: Record<string, any>) => item.group_purpose !== 2) || []
  );
});

const selectedUsers = computed(() => {
  return (
    selectedRecipients.value?.filter((item: Record<string, any>) => item.group_purpose === 2) || []
  );
});

// no. of grp part for selected for email notification
const emailGrpCount = computed(
  () =>
    state.email_notification_group.filter((grp: Record<string, any>) => grp.group_purpose !== 2)
      ?.length || 0
);

// no. of grp part for selected for push notification
const pushGrpCount = computed(
  () =>
    state.push_notification_group.filter((grp: Record<string, any>) => grp.group_purpose !== 2)
      ?.length || 0
);

const isAllEmailGroupSelected = computed(() => {
  return emailGrpCount.value === selectedGroups.value?.length;
});

const isAllMobileGroupSelected = computed(() => {
  return pushGrpCount.value === selectedGroups.value?.length;
});

const isAllEmailUserSelected = computed(() => {
  return (
    state.email_notification_group.length - emailGrpCount.value === selectedUsers.value?.length
  );
});

const isAllMobileUserSelected = computed(() => {
  return state.push_notification_group.length - pushGrpCount.value === selectedUsers.value?.length;
});

const isCategoryCrisisNotification = computed(() => {
  return (
    store.getters['alertCreate/getAlertFormData']?.card_category?.category_name ===
    'Crisis Notification'
  );
});

const isValueSelected = (type: 'email' | 'push', group: Record<string, any>) => {
  const groupList =
    type === 'email' ? state.email_notification_group : state.push_notification_group;
  return groupList.some((obj: Record<string, any>) => obj.group_id === group.group_id);
};

function selectValue(type: string, value: boolean, group: Record<string, any>) {
  const notificationGroupKey =
    type === 'email' ? 'email_notification_group' : 'push_notification_group';

  if (value) {
    state[notificationGroupKey].push(group);
  } else {
    const grpList =
      type === 'email' ? state.email_notification_group : state.push_notification_group;
    const idx = grpList.findIndex((grp: Record<string, any>) => grp.group_id === group.group_id);

    state[notificationGroupKey].splice(idx, 1);
  }

  updateStoreValue();
}

// Filters out items with a specific `group_purpose` and optionally adds back selected items.
function updateNotificationGroup(
  type: 'email' | 'push',
  value: boolean,
  selectedItems: Record<string, any>[],
  matchPurpose: boolean
) {
  const notificationGroupKey =
    type === 'email' ? 'email_notification_group' : 'push_notification_group';

  // filter function
  const filterCondition = matchPurpose
    ? (grp: Record<string, any>) => grp.group_purpose === 2 // 2 is user groups
    : (grp: Record<string, any>) => grp.group_purpose !== 2; // individual users

  // Filter the existing state
  state[notificationGroupKey] = state[notificationGroupKey].filter(filterCondition);

  // Add back selected items if value is true
  if (value) {
    selectedItems.forEach((grp: Record<string, any>) => {
      if (!matchPurpose === (grp.group_purpose === 2)) {
        state[notificationGroupKey].push(grp);
      }
    });
  }
  updateStoreValue();
}

// function for selecting or deselecting all groups
function selectAllGroup(type: 'email' | 'push', value: boolean) {
  updateNotificationGroup(type, value, selectedGroups.value, true);
}

// function for selecting or deselecting all users
function selectAllUsers(type: 'email' | 'push', value: boolean) {
  updateNotificationGroup(type, value, selectedUsers.value, false);
}

function updateStoreValue() {
  updateAlertFormStore('email_notification_group', state.email_notification_group);
  updateAlertFormStore('push_notification_group', state.push_notification_group);
  updateAlertFormStore('push_email_notification', !!state.email_notification_group?.length);
  updateAlertFormStore('push_required', !!state.push_notification_group?.length);
}

function initDefaultValues() {
  state.email_notification_group = [];
  state.push_notification_group = [];
  if (isFlagAccessableToTenant('global_email_alert')) {
    selectAllGroup('email', true);
    selectAllUsers('email', true);
  }
  if (isFlagAccessableToTenant('global_push_notification')) {
    selectAllGroup('push', true);
    selectAllUsers('push', true);
  }
}

function updateCrisisModel(key: string, value: boolean) {
  state[key] = value;
  updateAlertFormStore(key, value);
}

onMounted(() => {
  state.mounted = true;
  const alertData = store.getters['alertCreate/getAlertFormData'];
  const newAlert = !(
    alertData.copied_short_id ||
    alertData.short_id ||
    alertData.alert_template_id
  );

  if (!newAlert) {
    state.email_notification_group = alertData.email_notification_group || [];
    state.push_notification_group = alertData.push_notification_group || [];
    if (isCategoryCrisisNotification.value) {
      state.push_required = alertData.push_required;
      state.push_email_notification = alertData.push_email_notification;
      state.sms_alert = alertData.sms_alert;
      state.call_alert = alertData.call_alert;
      state.additional_sms_alert =
        alertData.additional_sms_alert || !!alertData.additional_sms_alert_text || false;
      state.additional_sms_alert_text = alertData.additional_sms_alert_text || '';
    }
  } else if (props.pushEnabled && !props.disabled) {
    initDefaultValues();
  }
});

watch(
  () => selectedRecipients.value,
  (newVal, oldVal) => {
    const alertData = store.getters['alertCreate/getAlertFormData'];
    if (!alertData.card_category) {
      state.email_notification_group = [];
      state.push_email_notification = [];
      state.mounted = false;
    }
    if (!props.disabled && state.mounted) {
      const oldList = oldVal.map((group: Record<string, any>) => group.group_id);
      const newList = newVal.filter(
        (group: Record<string, any>) => !oldList.includes(group.group_id)
      );

      if (isFlagAccessableToTenant('global_email_alert')) {
        newList.forEach((group: Record<string, any>) => state.email_notification_group.push(group));
      }
      if (isFlagAccessableToTenant('global_push_notification')) {
        newList.forEach((group: Record<string, any>) => state.push_notification_group.push(group));
      }
      const currGrps = newVal.map((group: Record<string, any>) => group.group_id);
      const removedVals = oldVal.filter(
        (group: Record<string, any>) => !currGrps.includes(group.group_id)
      );

      removedVals.forEach((val: Record<string, any>) => {
        const emailInd = state.email_notification_group.findIndex(
          (grp: Record<string, any>) => grp.group_id === val.group_id
        );
        if (emailInd !== -1) state.email_notification_group.splice(emailInd, 1);

        const pushInd = state.push_notification_group.findIndex(
          (grp: Record<string, any>) => grp.group_id === val.group_id
        );
        if (pushInd !== -1) state.push_notification_group.splice(pushInd, 1);
      });

      updateStoreValue();
    }
  }
);

defineExpose({ initDefaultValues });
</script>

<template>
  <div v-if="isCategoryCrisisNotification">
    <div class="cyw-flex">
      <div class="cyw-w-50">
        <CyCheckbox
          v-bind="testId('crisis-mobile')"
          :modelValue="state.push_required"
          @update:modelValue="updateCrisisModel('push_required', $event)"
          :disabled="props.disabled || !(selectedGroups?.length || selectedUsers?.length)"
          >{{ $t('alerts.labels.send-mobile-notification') }}</CyCheckbox
        >
      </div>
      <div class="cyw-w-50">
        <CyCheckbox
          v-bind="testId('crisis-email')"
          :modelValue="state.push_email_notification"
          @update:modelValue="updateCrisisModel('push_email_notification', $event)"
          :disabled="props.disabled || !(selectedGroups?.length || selectedUsers?.length)"
        >
          {{ $t('alerts.labels.send-email-notification') }}</CyCheckbox
        >
      </div>
    </div>
    <div class="cyw-flex cyw-mt-3">
      <div class="cyw-w-50">
        <div class="cyw-w-50">
          <CyCheckbox
            v-bind="testId('sms-alert')"
            :modelValue="state.sms_alert"
            @update:modelValue="updateCrisisModel('sms_alert', $event)"
            :disabled="props.disabled || !(selectedGroups?.length || selectedUsers?.length)"
          >
            {{ $t('alerts.push-notification.sms-alert') }}</CyCheckbox
          >
        </div>
      </div>
      <div class="cyw-w-50">
        <CyCheckbox
          v-bind="testId('voice-alert')"
          :modelValue="state.call_alert"
          @update:modelValue="updateCrisisModel('call_alert', $event)"
          :disabled="props.disabled || !(selectedGroups?.length || selectedUsers?.length)"
        >
          {{ $t('alerts.push-notifications.voice-alert') }}</CyCheckbox
        >
      </div>
    </div>
    <hr v-if="state.sms_alert" class="cyw-flex-grow-1" />
    <div class="cyw-mt-4" v-if="state.sms_alert">
      <CyCheckbox
        v-bind="testId('additional-sms-alert')"
        :modelValue="state.additional_sms_alert"
        @update:modelValue="updateCrisisModel('additional_sms_alert', $event)"
        :disabled="props.disabled || !(selectedGroups?.length || selectedUsers?.length)"
        class="cyw-mb-3"
      >
        <div class="cyw-flex-align-center">
          <div class="cyw-mr-3">{{ $t('alerts.push-notification.sms-alert-title') }}</div>
          <CyTooltip :content="$t('alerts.tooltip.push-notification')">
            <span class="cyw-color-N700 cyw-text-f12 cyw-mt-3">
              <CyIcon
                icon="fa-duotone fa-solid fa-circle-question"
                class="cyw-text-f14 cyw-mt-2 cyw-color-N400"
              >
              </CyIcon>
            </span>
          </CyTooltip>
        </div>
      </CyCheckbox>
      <CyTextarea
        v-if="state.sms_alert"
        v-bind="testId('additional-sms-text-alert')"
        placeholder="Enter Additional SMS Alert"
        :disabled="
          !state.additional_sms_alert ||
          props.disabled ||
          !(selectedGroups?.length || selectedUsers?.length)
        "
        v-model="state.additional_sms_alert_text"
        @update:modelValue="updateAlertFormStore('additional_sms_alert_text', $event)"
      />
    </div>
  </div>
  <template v-else-if="selectedGroups?.length || selectedUsers?.length">
    <div
      v-if="selectedGroups?.length"
      class="cyw-border-1 light-border cyw-round-md cyw-mt-3 cyw-mb-5"
    >
      <div class="cyw-flex-justify-between cyw-border-bottom-1 light-border cyw-bg-P50 cyw-py-3">
        <div class="cyw-pl-3">{{ $t('alerts.form-interactions.group-name') }}</div>
        <div class="cyw-flex-justify-around cyw-w-25">
          <div class="cyw-mr-4">{{ $t('alerts.form-interactions.email') }}</div>
          <div>{{ $t('alerts.form-interactions.mobile') }}</div>
        </div>
      </div>
      <div class="cyw-flex-justify-between cyw-border-bottom-1 light-border cyw-py-3">
        <div class="cyw-pl-3 cyw-text-semi-bold">
          {{ $t('alerts.form-interactions.select-all') }}
        </div>
        <div class="cyw-flex-justify-around cyw-w-25 cyw-mt-2">
          <div class="cyw-mr-4">
            <CyCheckbox
              v-bind="testId('all-seleted-groups-email')"
              :modelValue="isAllEmailGroupSelected"
              @update:modelValue="selectAllGroup('email', $event)"
              :disabled="props.disabled"
            />
          </div>
          <div>
            <CyCheckbox
              v-bind="testId('all-seleted-groups-mobile')"
              :modelValue="isAllMobileGroupSelected"
              @update:modelValue="selectAllGroup('push', $event)"
              :disabled="props.disabled"
            />
          </div>
        </div>
      </div>
      <div class="accordion--content__scroll">
        <div
          v-for="(group, index) in selectedGroups"
          :key="group.group_id"
          class="cyw-flex-justify-between cyw-border-bottom-1 light-border cyw-py-3"
        >
          <div class="cyw-pl-3">{{ group.group_name }}</div>
          <div class="cyw-flex-justify-around cyw-w-25 cyw-mt-2">
            <div class="cyw-mr-4">
              <CyCheckbox
                v-bind="testId(`selected-groups-email-${index}`)"
                :modelValue="isValueSelected('email', group)"
                @update:modelValue="selectValue('email', $event, group)"
                :disabled="props.disabled"
              />
            </div>
            <div>
              <CyCheckbox
                v-bind="testId(`selected-groups-mobile-${index}`)"
                :modelValue="isValueSelected('push', group)"
                @update:modelValue="selectValue('push', $event, group)"
                :disabled="props.disabled"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="selectedUsers?.length" class="cyw-border-1 light-border cyw-round-md cyw-mb-2">
      <div class="cyw-flex-justify-between cyw-border-bottom-1 light-border cyw-bg-P50 cyw-py-3">
        <div class="cyw-pl-3">{{ $t('alerts.form-interactions.individual-users') }}</div>
        <div class="cyw-flex-justify-around cyw-w-25">
          <div class="cyw-mr-4">{{ $t('alerts.form-interactions.email') }}</div>
          <div>{{ $t('alerts.form-interactions.mobile') }}</div>
        </div>
      </div>
      <div class="cyw-flex-justify-between cyw-border-bottom-1 light-border cyw-py-3">
        <div class="cyw-pl-3 cyw-text-semi-bold">
          {{ $t('alerts.form-interactions.select-all') }}
        </div>
        <div class="cyw-flex-justify-around cyw-w-25 cyw-mt-2">
          <div class="cyw-mr-4">
            <CyCheckbox
              v-bind="testId('all-seleted-users-email')"
              :modelValue="isAllEmailUserSelected"
              @update:modelValue="selectAllUsers('email', $event)"
              :disabled="props.disabled"
            />
          </div>
          <div>
            <CyCheckbox
              v-bind="testId('all-seleted-users-mobile')"
              :modelValue="isAllMobileUserSelected"
              @update:modelValue="selectAllUsers('push', $event)"
              :disabled="props.disabled"
            />
          </div>
        </div>
      </div>
      <div class="accordion--content__scroll">
        <div
          v-for="(group, index) in selectedUsers"
          :key="group.group_id"
          class="cyw-flex-justify-between cyw-border-bottom-1 light-border cyw-py-3"
        >
          <div class="cyw-pl-3">{{ group.group_name }}</div>
          <div class="cyw-flex-justify-around cyw-w-25 cyw-mt-2">
            <div class="cyw-mr-4">
              <CyCheckbox
                v-bind="testId(`selected-users-email-${index}`)"
                :modelValue="isValueSelected('email', group)"
                @update:modelValue="selectValue('email', $event, group)"
                :disabled="props.disabled"
              />
            </div>
            <div>
              <CyCheckbox
                v-bind="testId(`selected-users-mobile-${index}`)"
                :modelValue="isValueSelected('push', group)"
                @update:modelValue="selectValue('push', $event, group)"
                :disabled="props.disabled"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  <div v-else>{{ $t('alerts.push-notification.empty-state') }}</div>
</template>
<style scoped lang="scss">
.light-border {
  border-color: var(--P100) !important;
}
</style>

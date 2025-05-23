<script setup lang="ts">
import { reactive, computed, watch, onMounted, ref, inject } from 'vue';
import { ALERT_OPTIONS } from '@/components/alertCreate/sendingoptions/config';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import { useStore } from '@/store';
import { getDateWithOrdinal } from '@/utils';
import { ALERT_RULES } from '@/components/alertCreate/sendingoptions/rules';
import { useI18n } from 'vue-i18n';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'alert-options');
const { t: $t } = useI18n();
const $api: any = inject('$api')

const store: Record<string, any> = useStore();

const { updateAlertFormStore } = useAlertBasicsData();
const { isPermittedToMe } = useCommonData();

const alertOptionFormRef = ref();
const defaultTime = new Date().setHours(23, 59, 59, 999);

const props = defineProps({
  disabled: {
    default: false
  },
  onPage: {
    default: false
  }
});

const state = reactive({
  model: {} as Record<string, any>,
  flagModel: {} as Record<string, any>,
  dateModel: {} as Record<string, any>,
  options: ALERT_OPTIONS($t), 
  publishers: [] as Record<string, any>[]
});

const analystGroupsEnabled = computed(() => {
  return store.getters['common/getUserDetails']?.analyst_group_enabled || false;
});

const getPublishersList = computed(() => {
  const selectedCategory =
    store.getters['alertCreate/getAlertFormListData']['active-category'] || {};
  const publishers = analystGroupsEnabled.value ? state.publishers : selectedCategory.permitted_publisher;
  const publisherObject = formatPublishers(publishers);
  return publisherObject;
});

const alertFormData = computed(() => {
  return store.getters['alertCreate/getAlertFormData'];
});

const alertFormListData = computed(() => {
  const configData: Record<string, any> =
    store.getters['alertCreate/getAlertFormListData']['tlp-config-data'];
  return configData;
});

const validate = computed(() => store.getters['alertCreate/getFormValid']?.['sending']?.validate);

function formatPublishers(publishers: Record<string, any>[]) {
  return publishers?.map((user: Record<string, any>) => {
    return {
      name_email:
        user?.name_email ?? `${[user.first_name, user.last_name].join(' ')} [${user.email}]`,
      user_id: user['user_id']
    };
  });
}

const setInitValues = () => {
  const {
    short_id,
    status,
    published_time,
    schedule_frequency_gap,
    schedule_tilldate,
    destruction_time,
    expire_time
  } = alertFormData.value;

  if (!short_id || !['SUBMITTED', 'REVERTED', 'SCHEDULED'].includes(status)) return; // DRAFT doesn't save scheduled info in backend so excluding that check

  const getOption = (key: string) => state.options.find((item) => item.key === key);

  const updateState = (
    details: Record<string, any> | undefined,
    flagKey: string,
    dateKey: string,
    value: boolean
  ) => {
    if (details) {
      state.flagModel[details[flagKey]] = true;
      state.dateModel[details[dateKey]] = value;
    }
  };

  if (published_time) {
    updateState(getOption('schedule-alert-publish'), 'flagKey', 'dateModelKey', published_time);
    updateAlertFormStore('status', 'SCHEDULED');
  }

  if (schedule_frequency_gap && schedule_tilldate) {
    const repeatDetails = getOption('repeat-alert');
    if (repeatDetails) {
      state.flagModel[repeatDetails.flagKey] = true;
      state.dateModel[repeatDetails.firstModelKey] = schedule_frequency_gap;
      state.dateModel[repeatDetails.dateModelKey] = schedule_tilldate;
      disableOption('self_destruction', true);
    }
  }

  if (destruction_time) {
    updateState(getOption('self-destruct-alert'), 'flagKey', 'dateModelKey', destruction_time);
    disableOption('expire_alert', true);
    disableOption('repeat_alert', true);
  }

  if (expire_time) {
    updateState(getOption('schedule-alert-expire'), 'flagKey', 'dateModelKey', expire_time);
    disableOption('self_destruction', true);
  }
};

const updateStateModel = () => {
  const result: Record<string, any> =
    alertFormListData?.value &&
    Object.values(alertFormListData?.value)?.filter(
      (item: Record<string, any>) =>
        item.tlp === alertFormData?.value?.tlp ||
        (item.tlp === 'WHITE' && alertFormData?.value?.tlp === 'CLEAR')
    );
  const publisherObject = alertFormData?.value?.permitted_publisher?.map(
    (user: Record<string, any>) => {
      return {
        name_email:
          user?.name_email ?? `${[user.first_name, user.last_name].join(' ')} [${user.email}]`,
        user_id: user['user_id']
      };
    }
  );
  state.model = {
    ...state.model,
    ...result?.[0],
    export_alert_from_webapp: result?.[0]?.export_to_member_portal,
    card_comment: alertFormData?.value?.card_comment
  };
  if (publisherObject) state.model['permitted_publisher'] = [...publisherObject];
  disableEnableFields(['export_alert_from_webapp', 'attach_alert_export_in_doc_library']);
  Object.keys(state?.model).forEach((field: string) => {
    const index = findTargetIndex(state?.options, 'modelKey', field);
    if (index !== -1) {
      updateAlertFormStore(field, state?.model[field]);
    }
  });
};

const disableEnableFields = (flag: string[]) => {
  flag.forEach((field: string) => {
    disableOptionWithModelKey(field, !state.model?.[field]);
  });
};

const disableOptionWithModelKey = (modelKey: string, value: boolean) => {
  const index = findTargetIndex(state.options, 'modelKey', modelKey);
  if (index !== -1) state.options[index].disabled = value;
};

const disabledDate = computed(() => {
  return (date: any) => {
    return date < new Date().setHours(0, 0, 0, 0) && date < new Date();
  };
});

const updateAlertOptions = (key: string, value: boolean) => {
  state.model[key] = value;
  updateStoreValue(key, value);
};

const updatePublishers = (event: any) => {
  state.model.permitted_publisher = event.map((user: Record<string, any>) => {
    return getPublishersList.value.find((item: any) => item.user_id === user.user_id);
  });
  updateAlertFormStore('permitted_publisher', state.model.permitted_publisher);
};

const findTargetIndex = (options: Record<string, any>[], key: string, target: string) =>
  options.findIndex((item) => item[key] === target);

const disableOption = (flagKey: string, value: boolean) => {
  const index = findTargetIndex(state.options, 'flagKey', flagKey);
  if (index !== -1) state.options[index].disabled = value;
};

const updateFlagKeys = (key: string, value: boolean) => {
  const resetModelValue = (flagKey: string) => {
    const index = findTargetIndex(state.options, 'flagKey', flagKey);
    const targetObject = state.options[index];
    if (flagKey === 'status') {
      updateAlertFormStore('status', '');
    }
    if (flagKey === 'repeat_alert') {
      updateAlertFormStore(targetObject.dateModelKey, null);
      updateAlertFormStore(targetObject.firstModelKey, 0);
      updateAlertFormStore(targetObject.extraModelKey, '');
      state.dateModel[targetObject.dateModelKey] = null;
      state.dateModel[targetObject.firstModelKey] = 0;
      state.dateModel[targetObject.extraModelKey] = '';
    } else {
      updateAlertFormStore(targetObject.dateModelKey, null);
      state.dateModel[targetObject.dateModelKey] = null;
    }
  };

  const resetFlagValue = (flagKey: string) => {
    state.flagModel[flagKey] = false;
  };

  const updateDependencies = (flagKeys: string[], value: boolean) => {
    flagKeys.forEach((key: string) => {
      if (value) {
        resetModelValue(key);
        resetFlagValue(key);
      }
      disableOption(key, value);
    });
  };

  if (key === 'self_destruction') {
    updateDependencies(['expire_alert', 'repeat_alert'], value);
  } else if (['repeat_alert', 'expire_alert'].includes(key)) {
    updateDependencies(['self_destruction'], value);
  }
  if (!value) resetModelValue(key);
};

const updateStoreValue = (key: string, value: any) => {
  if (key === 'published_time') {
    updateAlertFormStore('status', value ? 'SCHEDULED' : '');
  } else if (key === 'schedule_tilldate') {
    const formattedWithOrdinal = getDateWithOrdinal(value);
    updateAlertFormStore('schedule_tilldate_utc', formattedWithOrdinal);
    updateAlertFormStore('schedule_count', 0);
  } else if (key === 'destruction_time') {
    updateAlertFormStore('self_destruction', state?.flagModel?.self_destruction);
  }
  if (['destruction_time', 'expire_time', 'published_time', 'schedule_tilldate'].includes(key)) {
    value = parseInt(value);
  }
  updateAlertFormStore(key, value);
};

function validateChannels() {
  const fieldsToValidate = state.options
    .filter((option) => option.dateModelKey)
    .map((option) => option.dateModelKey);

  if (
    state.dateModel.published_time == null ||
    state.dateModel.expire_time == null ||
    state.dateModel.schedule_tilldate === null
  ) {
    alertOptionFormRef.value?.validateField(fieldsToValidate, (valid: boolean) => {
      store.dispatch('alertCreate/setFormValid', {
        sending: { 'restrictions-and-alert-options': valid }
      });
    });
  } else {
    alertOptionFormRef.value?.clearValidate();
    store.dispatch('alertCreate/setFormValid', {
      sending: { 'restrictions-and-alert-options': true }
    });
  }
}

async function fetchPublisherList() {
  if(!analystGroupsEnabled.value) return;
  const analystGrpIds = alertFormData.value.analyst_groups.map((grp: any) => grp.id)
  const { data } = await $api.post('analyst.permittedPublishers', { analyst_group_ids: analystGrpIds })
  state.publishers = data.results;
  state.model.permitted_publisher = alertFormData.value.permitted_publisher?.map((user: Record<string, any>) => {
    return getPublishersList.value.find((item: any) => item.user_id === user.user_id);
  });
}

onMounted(() => {
  updateStateModel();
  setInitValues();
});

watch(
  () => validate.value,
  () => {
    validateChannels();
  }
);

watch(
  () => [alertFormData.value.tlp, alertFormListData?.value],
  () => {
    updateStateModel();
  }
);

watch(
  () => props.onPage, 
  (val: boolean) => {
    if(val) {
      state.model.permitted_publisher = formatPublishers(alertFormData.value.permitted_publisher)
      fetchPublisherList()
    }
  }
);
</script>

<template>
  <el-form
    v-if="isPermittedToMe('scheduled', 'sa')"
    :model="state.dateModel"
    ref="alertOptionFormRef"
  >
    <div v-for="option in state.options" :key="option.key">
      <div v-if="option.modelKey" class="cyw-flex-align-center cyw-mb-2">
        <cy-checkbox
          v-bind="testId(`${option.modelKey}`)"
          :modelValue="state.model[option.modelKey]"
          @update:modelValue="updateAlertOptions(option.modelKey, $event)"
          :disabled="option.disabled || props.disabled"
        ></cy-checkbox>
        <div class="cyw-ml-4">
          <div class="cyw-text-f14">{{ option.name }}</div>
        </div>
      </div>
      <div v-else-if="option.flagKey" class="cyw-mb-2">
        <div class="cyw-flex-align-center">
          <cy-checkbox
            v-bind="testId(`${option.flagKey}`)"
            :modelValue="state.flagModel[option.flagKey]"
            @update:modelValue="
              (state.flagModel[option.flagKey] = $event), updateFlagKeys(option.flagKey, $event)
            "
            :disabled="option.disabled || props.disabled"
          ></cy-checkbox>
          <div class="cyw-ml-4">
            <div class="cyw-text-f14">{{ option.name }}</div>
          </div>
        </div>
        <div v-if="state.flagModel[option.flagKey]">
          <div v-if="option.key === 'repeat-alert'">
            <div class="cyw-flex-align-center">
              <div class="cyw-w-50 cyw-mr-3">
                <label class="cyw-text-f12 cyw-color-N700">{{ option.firstModelLabel }}</label>
                <CyInput
                  :modelValue="state.dateModel[option.firstModelKey]"
                  @update:modelValue="
                    (state.dateModel[option.firstModelKey] = $event),
                      updateStoreValue(option.firstModelKey, $event)
                  "
                  size="lg"
                  :required="true"
                  v-bind="testId(`${option.firstModelKey}`)"
                >
                </CyInput>
              </div>
              <div class="cyw-flex-grow-1">
                <label class="cyw-text-f12 cyw-color-N700">Until</label>
                <el-form-item
                  :prop="option.dateModelKey"
                  :rules="ALERT_RULES($t)"
                  v-bind="testId(`${option.dateModelKey}-form-item`)"
                >
                  <el-date-picker
                    :modelValue="state.dateModel[option.dateModelKey]"
                    @update:modelValue="
                      (state.dateModel[option.dateModelKey] = $event),
                        updateStoreValue(option.dateModelKey, $event)
                    "
                    class="ca-date-picker"
                    popper-class="ca-date-picker__popper"
                    value-format="X"
                    time-format="hh:mm A"
                    format="MMM D, YYYY h:mm A"
                    :disabled-date="disabledDate"
                    type="datetime"
                    placeholder="Select date and time"
                    v-bind="testId(`${option.dateModelKey}`)"
                  />
                </el-form-item>
              </div>
            </div>
          </div>
          <div class="cyw-mb-4 cyw-mt-2" v-else>
            <el-form-item
              :prop="option.dateModelKey"
              :rules="ALERT_RULES($t)"
              v-bind="testId(`${option.dateModelKey}-form-item`)"
            >
              <el-date-picker
                :modelValue="state.dateModel[option.dateModelKey]"
                @update:modelValue="
                  (state.dateModel[option.dateModelKey] = $event),
                    updateStoreValue(option.dateModelKey, $event)
                "
                class="ca-date-picker"
                popper-class="ca-date-picker__popper"
                value-format="X"
                :disabled-date="disabledDate"
                type="datetime"
                format="MMM D, YYYY h:mm A"
                time-format="hh:mm A"
                placeholder="Select date and time"
                v-bind="testId(`${option.dateModelKey}`)"
                :default-time="defaultTime"
              />
            </el-form-item>
          </div>
        </div>
      </div>
    </div>
  </el-form>
  <div v-if="isPermittedToMe('submitted', 'sa')" class="cyw-bg-N50 cyw-p-4 cyw-mt-4 cyw-round-lg">
    <div>{{ $t('alerts.form-interactions.publishers') }}</div>
    <CySelect
      v-bind="testId('publishers')"
      class="cyw-select-menu cyw-mb-4"
      :showSearch="true"
      :multiple="true"
      name="publishers"
      :placeholder="$t('alerts.alert-form.select-placeholder')"
      valueIdentifier="name_email"
      identifier="user_id"
      searchIdentifier="name_email"
      :data="getPublishersList"
      :modelValue="state.model.permitted_publisher"
      size="md"
      :disabled="props.disabled"
      @update:modelValue="updatePublishers"
    >
    </CySelect>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, computed, watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
import ImageOptions from '@/components/alertCreate/basics/ImageOptions.vue';
import CategoryFields from '@/components/alertCreate/basics/CategoryFields.vue';
import ThreatIndicators from '@/components/alertCreate/basics/Indicators/ThreatIndicators.vue';
import ScheduleEvent from './basics/scheduler/ScheduleEvent.vue';
import Tags from '@/components/alertCreate/basics/Tags.vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import { initTestId } from '@/utils/testid';
import EditorWithReference from './EditorWithReference.vue';
const testId = initTestId('ac');

const store: Record<string, any> = useStore();
const { t: $t } = useI18n();

const { fetchActiveCategory, fetchAnalysisFieldsMap, updateAlertFormStore, disabledTlps } =
  useAlertBasicsData();

const { isPermittedToMe, isFieldAccessableToMe } = useCommonData();

const emit = defineEmits([
  'validate:field',
  'update:rules',
  'clearValidate',
  'refresh:sendingoptions'
]);

const props = defineProps({
  skipValidation: {
    type: Boolean,
    default: false
  }
});

const state = reactive({
  model: {} as Record<string, any>,
  isCategoryFieldLoading: false,
  inputDefanged: false,
  activeItems: ['threat_indicators', 'schedules', 'card_tag'],
  disableTeams: false
});

const accRef = ref();

const alertData: Record<string, any> = computed(
  () => store.getters['alertCreate/getAlertFormData']
);

const categoryAnalysisMap = computed(
  () => store.getters['alertCreate/getAlertFormListData']['analysis-field-map']
);

const editDisabled = computed(() => store.getters['alertCreate/editAlertMode']);

const disableCategory = computed(() => {
  const { rfi_status } = alertData.value;
  return (
    rfi_status?.id ||
    editDisabled.value ||
    (analystGroupsEnabled.value && !state.model['analyst_groups']?.length)
  );
});

const activeCategoryData = computed(
  () => store.getters['alertCreate/getAlertFormListData']['active-category'] || {}
);

const isTagRequired = computed(
  () =>
    !!activeCategoryData.value?.required_fields?.some(
      (field: Record<string, any>) => field.field_type === 'tag'
    )
);

const isEventsVisible = computed(() => activeCategoryData.value?.category_code === 'event');

const isIndicatorsEnabled = computed(
  () => !!(activeCategoryData.value?.threat_indicators_field && !isEventsVisible.value) || false
);

const analystGroupsEnabled = computed(
  () => store.getters['common/getUserDetails']?.analyst_group_enabled || false
);

function updateValue(key: string, value: any) {
  state.model[key] = value;
  updateAlertFormStore(key, value);

  switch (key) {
    case 'card_category':
      updateAlertFormStore('permitted_publisher', []);
      updateAlertFormStore('alert_end_user_visible_fields', []);
      fetchAdditionalData();
      break;
    case 'tlp':
      if (!editDisabled.value) updateRecipientGroups();
      break;
    case 'analyst_groups':
      updateAlertFormStore('permitted_publisher', []); // any change to analyst groups should reset permitted publisher
      break;
    default:
      break;
  }
  emit('validate:field', key);
}

function updateRecipientGroups() {
  let selectedRGs = alertData.value.card_group || [];
  selectedRGs = selectedRGs.filter(
    (group: Record<string, any>) => !disabledTlps(state.model.tlp).includes(group.group_tlp)
  );
  updateAlertFormStore('card_group', selectedRGs);
  emit('refresh:sendingoptions');
}

async function fetchAdditionalData() {
  const activeCategoryId = alertData.value?.['card_category']?.category_id;
  if (activeCategoryId) {
    state.isCategoryFieldLoading = true;
    await fetchActiveCategory(activeCategoryId);
    state.isCategoryFieldLoading = false;
  } else {
    store.dispatch('alertCreate/setAlertFormListData', {
      key: 'active-category',
      value: {}
    });
  }
  if (!categoryAnalysisMap.value) fetchAnalysisFieldsMap();
}

function getList(component: string) {
  return store.getters['alertCreate/getAlertFormListData'][component];
}

function collectCategories(groups: Record<string, any>[]): Record<string, any>[] {
  const analystGrpIds = groups?.map((group: Record<string, any>) => group.id) || [];
  const seen = new Set();
  return groups?.reduce((acc, group) => {
    if (analystGrpIds.includes(group.id)) {
      group.categories?.forEach((category: Record<string, any>) => {
        if (!seen.has(category.category_id)) {
          seen.add(category.category_id);
          acc.push(category);
        }
      });
    }
    return acc;
  }, [] as Record<string, any>[]);
}

function assignTeamsOnInit(alertModel: any) {
  const categories: Record<string, any>[] = [];
  const analystGrpIds =
    alertModel['analyst_groups'].map((group: Record<string, any>) => group.id) || [];
  const allGroups = getList('analyst-groups') || [];
  const filteredGroups =
    allGroups.filter((group: Record<string, any>) => analystGrpIds.includes(group.id)) || [];

  if (['DRAFT', 'SUBMITTED', 'REVERTED', 'SCHEDULED'].includes(alertModel.status)) {
    state.disableTeams = filteredGroups.length !== analystGrpIds.length;
    categories.push(...collectCategories(allGroups));
    if (!state.disableTeams) alertModel['analyst_groups'] = filteredGroups;
  } else {
    alertModel['analyst_groups'] = filteredGroups;
    categories.push(...collectCategories(filteredGroups));
  }

  store.dispatch('alertCreate/setAlertFormListData', {
    key: 'category-list',
    value: categories
  });
}

function setInitValues() {
  if (isFieldAccessableToMe('do-not-show-card-image'))
    updateAlertFormStore('do_not_show_image', true);

  const alertModel = alertData.value;

  if (analystGroupsEnabled.value && !editDisabled.value && alertModel?.['analyst_groups']?.length)
    assignTeamsOnInit(alertModel);

  if (alertModel?.card_category) {
    if (alertModel?.copied_short_id) {
      const category = getList('category-list')?.find(
        (item: Record<string, any>) => item?.category_id === alertModel.card_category?.category_id
      );
      category ? fetchAdditionalData() : (alertModel['card_category'] = null);
    } else fetchAdditionalData();
  }

  alertModel.tlp =
    alertData.value?.tlp || store.getters['common/getTenantDetails']['default_card_tlp'];

  state.model = { ...alertModel };
  updateRecipientGroups();
}

function openItemsWithError(item: string) {
  if (!state.activeItems.includes(item)) {
    accRef.value.handleItemClick(item);
  }
}

function updateCategoryList() {
  const categories: Record<string, any>[] = collectCategories(state.model['analyst_groups']);
  store.dispatch('alertCreate/setAlertFormListData', {
    key: 'category-list',
    value: categories
  });

  if (state.model.card_category && !alertData.value?.rfi_status?.id) {
    const removeCategory = !getList('category-list').find(
      (category: Record<string, any>) =>
        category.category_id === state.model.card_category.category_id
    );
    if (removeCategory) {
      state.model.card_category = null;
      updateAlertFormStore('card_category', null);
    }
  }
}

onMounted(() => {
  setInitValues();
  state.inputDefanged =
    store.getters['alertCreate/getAlertFormData']['is_content_defanged'] || false;
});

watch(
  () => isIndicatorsEnabled.value,
  (visible: boolean) => {
    if (!visible) {
      updateAlertFormStore('defang_ioc_in_ioc_attachments', false);
      updateAlertFormStore('is_threat_indicators_defanged', false);
      updateAlertFormStore('ioc_export_types', []);
      updateAlertFormStore('threat_indicators', {});
      updateAlertFormStore('optional_fields', {
        threat_indicators: '',
        is_threat_indicators_defanged: false
      });
      const isTempAlert = store.getters['alertCreate/getAlertTempData']?.mountIndicators;
      store.dispatch('alertCreate/setAlertTempData', { mountIndicators: !isTempAlert });
    }
  }
);

watch(
  () => isEventsVisible.value,
  (visible: boolean) => {
    if (!visible) {
      updateAlertFormStore('event', {
        location: null,
        schedules: {},
        type: 'single',
        url: null
      });
      updateAlertFormStore('timezone_str', null);
    }
  }
);

watch(
  () => isTagRequired.value,
  (required: boolean) => {
    if (!required) {
      emit('clearValidate', 'card_tag');
    }
  }
);

defineExpose({
  state: state,
  openItemsWithError
});
</script>

<template>
  <el-form-item prop="title" class="cyw-mb-5" v-bind="testId('title-form-item')">
    <div class="cyw-w-100">
      <CyInput
        :modelValue="state.model.title"
        @update:modelValue="updateValue('title', $event)"
        :label="`${$t('alerts.alert-form.title-section')} *`"
        :required="true"
        v-bind="testId('title')"
        :maxlength="150"
        :showCount="true"
        type="text"
      >
      </CyInput>
    </div>
  </el-form-item>
  <EditorWithReference
    :label="`${$t('alerts.alert-form.summary-section')} *`"
    v-bind="testId('summary')"
    :modelValue="state.model.content"
    modelKey="content"
    :wrapperConfig="{
      prop: 'content',
      class: 'cyw-mb-5 csp-input-editor-wrapper'
    }"
    @is-defanged="updateValue('is_content_defanged', $event)"
    @update:modelValue="updateValue('content', $event)"
  />
  <div class="cyw-flex-align-center cyw-w-100">
    <el-form-item
      v-if="analystGroupsEnabled"
      prop="analyst_groups"
      class="cyw-mb-5 cyw-w-50 cyw-mr-5"
      v-bind="testId('analyst-groups-form-item')"
    >
      <cy-tooltip
        :disabled="!state.disableTeams"
        :content="$t('alerts.tooltips.category-analyst-group-disabled')"
      >
        <CySelect
          :modelValue="state.model['analyst_groups']"
          class="cyw-select-menu"
          :showSearch="true"
          name="analyst_groups"
          :label="`${$t('alerts.labels.analyst-groups')} *`"
          :placeholder="$t('alerts.alert-form.select-placeholder')"
          searchIdentifier="name"
          valueIdentifier="name"
          identifier="id"
          :data="getList('analyst-groups')"
          size="md"
          multiple
          :maxTagCount="1"
          :disabled="editDisabled || state.disableTeams"
          v-bind="testId('analyst-groups')"
          @update:modelValue="updateValue('analyst_groups', $event)"
          @blur="updateCategoryList"
        />
      </cy-tooltip>
    </el-form-item>

    <el-form-item
      prop="card_category"
      class="cyw-mb-5 cyw-w-50"
      v-bind="testId('card-category-form-item')"
      :class="{ 'cyw-pr-4': !analystGroupsEnabled }"
    >
      <cy-tooltip
        :disabled="
          !analystGroupsEnabled ||
          (analystGroupsEnabled && state.model['analyst_groups']?.length) ||
          (state.model['analyst_groups']?.length && !state.disableTeams)
        "
        :content="
          state.disableTeams
            ? $t('alerts.tooltips.category-analyst-group-disabled')
            : $t('alerts.tooltips.category-disabled')
        "
      >
        <CySelect
          class="cyw-select-menu"
          :showSearch="true"
          :name="'card_category'"
          :label="`${$t('alerts.alert-form.category-field')} *`"
          :placeholder="$t('alerts.alert-form.select-placeholder')"
          searchIdentifier="category_name"
          valueIdentifier="category_name"
          :noDataText="$t('alerts.empty.no-active-categories-message')"
          :data="getList('category-list')"
          :modelValue="state.model['card_category']"
          size="md"
          v-bind="testId('card-category')"
          :disabled="disableCategory || state.disableTeams"
          @update:modelValue="updateValue('card_category', $event)"
        />
      </cy-tooltip>
    </el-form-item>
  </div>
  <div class="cyw-flex-align-center cyw-w-100">
    <el-form-item
      v-if="isFieldAccessableToMe('tlp')"
      prop="tlp"
      class="cyw-mb-5 cyw-w-50 cyw-mr-5"
      v-bind="testId('tlp-form-item')"
    >
      <CySelect
        v-bind="testId('tlp')"
        class="cyw-select-menu"
        :showSearch="true"
        :name="'tlp'"
        :label="`${$t('alerts.alert-form.tlp-field')} *`"
        :placeholder="$t('alerts.alert-form.select-placeholder')"
        searchIdentifier="name"
        valueIdentifier="name"
        identifier="id"
        :data="getList('tlp-list')"
        :isValueKey="true"
        :model-value="state.model['tlp']"
        @update:modelValue="updateValue('tlp', $event)"
        size="md"
      >
        <template #option="{ option }"
          ><CyTag type="tlp" subtype="ghost" :value="option?.id"></CyTag
        ></template>
        <template #value="{ value }"
          ><CyTag v-if="state.model['tlp']" type="tlp" subtype="ghost" :value="value?.id"
        /></template>
      </CySelect>
    </el-form-item>

    <CySelect
      v-if="isPermittedToMe('view', 'campaign')"
      v-bind="testId('campaign')"
      class="cyw-select-menu cyw-mb-5 cyw-w-50"
      :showSearch="true"
      name="campaign"
      :label="`${$t('alerts.alert-form.campaign-section')}`"
      :placeholder="$t('alerts.alert-form.select-placeholder')"
      searchIdentifier="campaign_name"
      valueIdentifier="campaign_name"
      identifier="id"
      :data="getList('campaign-list')"
      :modelValue="state.model['campaign']"
      @update:modelValue="updateValue('campaign', $event)"
      size="md"
    >
    </CySelect>
  </div>
  <div v-if="!isFieldAccessableToMe('do-not-show-card-image')" class="cyw-w-100 cyw-mt-5">
    <ImageOptions />
  </div>
  <CyAccordion ref="accRef" v-model="state.activeItems">
    <div class="cyw-w-100 cyw-mt-5">
      <ThreatIndicators
        :key="store.getters['alertCreate/getAlertTempData']?.mountIndicators"
        :disabled="!isIndicatorsEnabled"
        :skipValidation="props.skipValidation"
        @validate:field="emit('validate:field', $event)"
      />
    </div>
    <div class="cyw-my-5">
      <schedule-event
        v-if="isEventsVisible"
        :skipValidation="props.skipValidation"
        @validate:field="emit('validate:field', $event)"
      />
    </div>

    <div class="cyw-w-100 cyw-my-5">
      <Tags
        :modelValue="state.model.card_tag"
        :required="isTagRequired"
        @selected="updateValue('card_tag', $event)"
      />
    </div>

    <div class="cyw-w-100">
      <CyShimmer v-if="state.isCategoryFieldLoading" type="form"></CyShimmer>
      <CategoryFields
        v-else-if="activeCategoryData?.category_id"
        :skipValidation="props.skipValidation"
        @validate:field="emit('validate:field', $event)"
        @update:rules="emit('update:rules', $event)"
      />
    </div>
  </CyAccordion>
</template>

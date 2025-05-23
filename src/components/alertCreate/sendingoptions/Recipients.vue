<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch, nextTick } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import { RECIPIENT_GROUP_TYPE } from './config';
import RecipientUser from './RecipientUser.vue';
import ThreatAssessmentRecipients from './ThreatAssessmentRecipients.vue';
import RecommendedActionRecipients from './RecommendedActionRecipients.vue';
import RGAdditionalOptions from './RGAdditionalOptions.vue';
import { RECIPIENT_RULES } from '@/components/alertCreate/sendingoptions/rules';
import { useI18n } from 'vue-i18n';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'recipients-filter');

const { t: $t } = useI18n();
import { useStore } from '@/store';
import { transformUserGroupData } from '@/utils';

const recipientGroupRef = ref();

const store: Record<string, any> = useStore();

const { fetchUserGroups, fetchUserGroupSet, updateAlertFormStore, disabledTlps } =
  useAlertBasicsData();

const { isPermittedToMe, isFlagAccessableToTenant, tlpList } = useCommonData();

const props = defineProps({
  disabled: {
    default: false
  }
});

const state = reactive({
  model: {} as Record<string, any>,
  recipientGroupTypes: RECIPIENT_GROUP_TYPE($t),
  filteredUserGroups: [] as Record<string, any>[],
  rgConfig: {
    currentPageSize: 0,
    jumpPageSize: 100,
    searchString: ''
  }
});

const RG_FILTER_PROPS: Record<string, any> = {
  class: 'group-filter',
  floatLabel: true,
  showSearch: true,
  multiple: true,
  searchIdentifier: 'name',
  valueIdentifier: 'name',
  identifier: 'id',
  maxTagCount: 1,
  isValueKey: true,
  size: 'md',
  disabled: props.disabled
};

const showAsterik = computed(
  () =>
    state.model.card_group?.length ||
    !store.getters['alertCreate/getAlertFormData']?.card_group?.length
);

const getGroupTypeList = computed(() => {
  const isPublicGroupAccessible = isFlagAccessableToTenant('persona_selection');
  return RECIPIENT_GROUP_TYPE($t).filter(({ id }) => id !== 'public' || isPublicGroupAccessible);
});

const getTLPList = computed(() => {
  const selectedTlp = store.getters['alertCreate/getAlertFormData']['tlp'];
  const tlps = tlpList($t);
  return tlps?.map((tlp: Record<string, any>) => ({
    ...tlp,
    disabled: disabledTlps(selectedTlp).includes(tlp.id)
  }));
});

const getUserGroups = computed(() => {
  const selectedTlp = store.getters['alertCreate/getAlertFormData'].tlp;
  let allGroups = store.getters['alertCreate/getAlertFormListData']['user-groups']?.filter((group: Record<string, any>) => group.is_active) || [];
  if (state.rgConfig.searchString) {
    allGroups = allGroups.filter((group: Record<string, any>) =>
      group.group_name?.toString().toLowerCase().includes(state.rgConfig.searchString.toLowerCase())
    );
  }
  // Define the hierarchy of TLP levels in order
  const tlpHierarchy = ['CLEAR', 'GREEN', 'AMBER', 'AMBER+STRICT', 'RED'];
  const selectedTlpIndex = tlpHierarchy.indexOf(selectedTlp);
  return allGroups.filter((group: Record<string, any>) => {
    const groupTlpIndex = tlpHierarchy.indexOf(group.group_tlp);
    // Include groups up to the selected TLP level in the hierarchy
    return groupTlpIndex >= selectedTlpIndex;
  });
});

const getUserGroupSet = computed(() => {
  return store.getters['alertCreate/getAlertFormListData']['user-group-set'] || [];
});

const selectedUserGroups = computed(
  () => store.getters['alertCreate/getAlertFormData']['card_group']?.filter((group: Record<string, any>) => group.is_active) || []
);

const validate = computed(() => store.getters['alertCreate/getFormValid']['sending']?.validate);

const getThreatAssesmentData = computed(
  () => store.getters['alertCreate/getAlertFormData']['enable_acknowledgement_type']
);

const getRecommendedActions = computed(
  () => store.getters['alertCreate/getAlertFormData']?.['enable_recommended_action']
);

const getValidateModel = computed(() => {
  const { card_group, acknowledgement_type_group, recommended_actions } =
    store.getters['alertCreate/getAlertFormData'];
  return { card_group, acknowledgement_type_group, recommended_actions };
});

const showRgAdditional = computed(
  () =>
    isPermittedToMe('view', 'user_location') ||
    isPermittedToMe('view', 'business_unit') ||
    isPermittedToMe('view', 'organization')
);

const extractUserGroupsFromGroupSet = () => {
  let groupsIds: string[] = [];
  state.model.card_group_set?.forEach((groupsetId: string) => {
    const group: Record<string, any> = getUserGroupSet.value?.find(
      (item: Record<string, any>) => item.id === groupsetId
    );
    if (group) groupsIds = group.user_groups?.filter((group: Record<string, any>) => group.is_active)?.map((item: Record<string, any>) => item.group_id);
  });
  let groups: Record<string, any>[] = [];
  groupsIds.forEach((id: string) => {
    const group: Record<string, any> = getUserGroups.value.find(
      (item: Record<string, any>) => item.group_id === id
    );
    if (group) groups.push(group);
  });
  return groups;
};

const extractGroupByGroupType = () => {
  let groups: Record<string, any>[] = [];
  state.model.card_group_type?.forEach((type: string) => {
    if (type === 'public') {
      groups = [
        ...groups,
        ...getUserGroups.value.filter((item: Record<string, any>) => item.user_visibility)
      ];
    } else if (type === 'invite-only') {
      groups = [
        ...groups,
        ...getUserGroups.value.filter(
          (item: Record<string, any>) => !item.user_visibility && item.is_editable && item.group_type !== 'ORGANIZATION'
        )
      ];
    } else if (type === 'system') {
      groups = [
        ...groups,
        ...getUserGroups.value.filter(
          (item: Record<string, any>) => !item.user_visibility && !item.is_editable
        )
      ];
    } else if (type === 'org') {
      groups = [
        ...groups,
        ...getUserGroups.value.filter(
          (item: Record<string, any>) => item.group_type === 'ORGANIZATION'
        )
      ];
    }
  });
  return groups;
};

const extractGroupByTLP = () => {
  let groups: Record<string, any>[] = [];
  state.model.card_group_tlp?.forEach((tlp: string) => {
    groups = [
      ...groups,
      ...getUserGroups.value.filter((item: Record<string, any>) => item.group_tlp === tlp)
    ];
  });
  return groups;
};

const updateUserGroupSet = (e: string[]) => {
  state.model.card_group_set = [...e];
  buildAndUpdateUserGroups();
  saveSelectedData();
};

const updateUserGroupType = (e: Record<string, any>[]) => {
  state.model.card_group_type = [...e];
  buildAndUpdateUserGroups();
  saveSelectedData();
};

const updateUserGroupByTlp = (e: Record<string, any>[]) => {
  state.model.card_group_tlp = [...e];
  buildAndUpdateUserGroups();
};

const buildAndUpdateUserGroups = () => {
  let userGroups: any[] = [
    ...extractUserGroupsFromGroupSet(),
    ...extractGroupByGroupType(),
    ...extractGroupByTLP()
  ];
  const selectedGrps: any[] = transformUserGroupData(userGroups) || [];
  // removing duplicates groups
  const finalGroups = selectedGrps.reduce((acc, current) => {
    const x = acc.find((item: Record<string, any>) => item?.group_id === current?.group_id);
    if (!x) {
      acc.push(current);
    }
    return acc;
  }, []);
  updateAlertFormStore('card_group', [
    ...selectedUserGroups.value.filter((group: Record<string, any>) => group.group_purpose === 2),
    ...finalGroups
  ]);
  state.model.card_group = [...finalGroups];
};

const updateRecipientGroups = (groups: Record<string, any>[]) => {
  state.model.card_group = groups;
  updateAlertFormStore('card_group', [
    ...selectedUserGroups.value.filter((group: Record<string, any>) => group.group_purpose === 2),
    ...groups
  ]);
  validateRgFields('card_group');
};

const validateRgFields = (field: string) => {
  nextTick(() => recipientGroupRef.value.validateField(field).catch(() => {}));
};

const saveSelectedData = () => {
  store.dispatch('alertCreate/setAlertTempData', {
    rgfilters: {
      card_group_set: state.model.card_group_set,
      card_group_type: state.model.card_group_type
    }
  });
};

const updatePreSelectedData = () => {
  const { card_group_set, card_group_type } =
    store.getters['alertCreate/getAlertTempData']?.rgfilters || {};
  if (card_group_set?.length) state.model.card_group_set = card_group_set;
  if (card_group_type?.length) state.model.card_group_type = card_group_type;
};

function setUserGroupList() {
  if (state.rgConfig.currentPageSize > getUserGroups.value.length) return;
  state.filteredUserGroups = [
    ...state.filteredUserGroups,
    ...getUserGroups.value.slice(
      state.rgConfig.currentPageSize,
      state.rgConfig.currentPageSize + state.rgConfig.jumpPageSize
    )
  ];
  state.rgConfig.currentPageSize += state.rgConfig.jumpPageSize;
}

function resetData() {
  state.filteredUserGroups = [];
  state.rgConfig.currentPageSize = 0;
  setUserGroupList();
}

function onRgSearch({ q }: Record<string, string>) {
  state.rgConfig.searchString = q;
  resetData();
}

onMounted(async () => {
  await fetchUserGroupSet();
  await fetchUserGroups();
  setUserGroupList();
  state.model.card_group = store.getters['alertCreate/getAlertFormData']?.card_group
    ?.filter((obj: any) => obj.group_purpose !== 2 && obj.is_active)
    ?.map((obj: any) => ({ ...obj, label: obj.group_name }));
  updatePreSelectedData();
});

function validateRecipients() {
  if (
    !selectedUserGroups.value?.length ||
    !getValidateModel.value?.acknowledgement_type_group?.length ||
    getValidateModel.value?.recommended_actions?.some(
      (action: Record<string, any>) => !action?.assigned_groups.length
    )
  )
    recipientGroupRef.value.validate((valid: boolean) => {
      store.dispatch('alertCreate/setFormValid', {
        sending: { recipients: valid }
      });
    });
  else {
    recipientGroupRef.value.clearValidate();
    store.dispatch('alertCreate/setFormValid', {
      sending: { recipients: true }
    });
  }
}

watch(
  () => validate.value,
  () => validateRecipients()
);
</script>

<template>
  <div class="cyw-color-N700 cyw-text-f12">
    {{ $t('alerts.form-interactions.add-recipient-groups') }}
  </div>
  <el-form
    @submit.prevent
    :validate-on-rule-change="false"
    ref="recipientGroupRef"
    :model="getValidateModel"
    :rules="RECIPIENT_RULES($t)"
  >
    <div class="cyw-flex-center">
      <CySelect
        v-bind="{ ...RG_FILTER_PROPS, ...testId('group-set') }"
        name="recipient-group-set"
        placeholder="Groupset"
        :data="getUserGroupSet"
        :modelValue="state.model.card_group_set"
        @update:modelValue="updateUserGroupSet($event)"
      >
      </CySelect>
      <CySelect
        v-bind="{ ...RG_FILTER_PROPS, ...testId('group-type') }"
        :class="'cyw-mx-4'"
        name="recipient-group-type"
        :placeholder="$t('alerts.form-interactions.group-type')"
        :data="getGroupTypeList"
        :modelValue="state.model.card_group_type"
        @update:modelValue="updateUserGroupType($event)"
      >
      </CySelect>
      <CySelect
        v-bind="{ ...RG_FILTER_PROPS, ...testId('group-tlp') }"
        name="recipient-group-tlp"
        :placeholder="$t('alerts.form-interactions.tlp')"
        :data="getTLPList"
        :disableOption="(option: Record<string,any>) => option.disabled"
        :modelValue="state.model.card_group_tlp"
        @update:modelValue="updateUserGroupByTlp($event)"
      >
      </CySelect>
    </div>
    <el-form-item prop="card_group" v-bind="testId('card-group-form-item')">
      <CySelect
        v-bind="testId('groups')"
        class="cyw-mt-4 cyw-w-100"
        :showSearch="true"
        :multiple="true"
        name="recipient-groups"
        :placeholder="$t('alerts.form-interactions.search-recipient-groups')"
        :label="`${$t('alerts.file-upload.recipient-groups-dropdown')} ${showAsterik ? '*' : ''}`"
        searchIdentifier="group_name"
        valueIdentifier="label"
        identifier="group_id"
        :data="state.filteredUserGroups"
        :modelValue="state.model.card_group"
        @update:modelValue="updateRecipientGroups"
        size="md"
        :disabled="props.disabled"
        :paginated="true"
        @search="onRgSearch"
        @loadMore="setUserGroupList"
        @blur="(state.rgConfig.searchString = ''), resetData()"
      >
      </CySelect>
    </el-form-item>
    <RecipientUser :disabled="disabled" @validate:field="validateRgFields($event)" />
    <RGAdditionalOptions v-if="showRgAdditional" :disabled="disabled" />
    <hr v-if="getThreatAssesmentData || getRecommendedActions" class="cyw-m-5" />
    <ThreatAssessmentRecipients
      v-if="getThreatAssesmentData"
      class="cyw-mb-4"
      :disabled="disabled"
    />
    <RecommendedActionRecipients
      v-if="getRecommendedActions"
      class="cyw-mb-4"
      :disabled="disabled"
    />
  </el-form>
</template>

<style lang="scss" scoped>
.group-filter {
  width: 33%;
}
</style>

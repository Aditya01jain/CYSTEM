<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import store from '@/store';
import { isEmpty } from 'lodash';
import { COMMUNITY_SHARING_MSG } from '@/utils/config';
import { useI18n } from 'vue-i18n';
import { initTestId } from '@/utils/testid';
const testId = initTestId('al', 'community-sharing');

const { communititesForAlert, publishToCommunities } = useAlertBasicsData();
const { isPermittedToMe } = useCommonData();
const { t: $t } = useI18n();

const props = defineProps({
  alertId: {
    default: ''
  }
});

const emit = defineEmits(['close']);

const COMMUNITY_SHARING_VALUES = ref({
  NEVER_SHARE: 0,
  ALREADY_SHARED: 1,
  CAN_BE_SHARED: -1
});

const state = reactive({
  loading: false,
  list: {} as Record<string, number>,
  selected: [] as string[],
  model: [] as string[],
  preSelected: [] as string[],
  allowedCommunityList: [] as string[]
});

const communitySharingRef = ref();
const confirmSharingRef = ref();

const isSelectAllChecked = computed(() => state.model.length === state.allowedCommunityList.length);

const communities = computed(() => store.getters['common/getCommunitySharing']);

const onDetailsClose = () => {
  handlePublish();
  emit('close');
};

function toggleSelectAll(event: any) {
  if (event) {
    state.model = state.allowedCommunityList;
    state.selected = [...state.allowedCommunityList, ...state.preSelected];
  } else {
    state.model = [];
    state.selected = [...state.preSelected];
  }
}

async function fetchList() {
  try {
    state.loading = true;
    const data = await communititesForAlert({ alert_id: props.alertId });
    state.list = data;
    state.selected = communities.value
      .filter(
        (community: Record<string, any>) =>
          state.list[community.key_id] === COMMUNITY_SHARING_VALUES.value.ALREADY_SHARED
      )
      .map((community: Record<string, any>) => community.key_id);
    state.preSelected = [...state.selected];
    state.allowedCommunityList = communities.value
      .filter(
        (community: Record<string, any>) =>
          state.list[community.key_id] === COMMUNITY_SHARING_VALUES.value.CAN_BE_SHARED
      )
      .map((community: Record<string, any>) => community.key_id);
  } finally {
    state.loading = false;
  }
}

function isDisabled(community: Record<string, any>) {
  return state.list[community.key_id] !== COMMUNITY_SHARING_VALUES.value.CAN_BE_SHARED;
}

function isChecked(community: Record<string, any>) {
  return !!state.selected.includes(community.key_id);
}

function checkChangedHandler(checked: boolean, item: any) {
  if (checked) {
    state.model.push(item.key_id);
    state.selected.push(item.key_id);
  } else {
    state.selected = state.selected.filter((sel) => sel !== item.key_id);
    state.model = state.model.filter((sel) => sel !== item.key_id);
  }
}

async function handlePublish() {
  try {
    await publishToCommunities({
      alert_id: props.alertId,
      community_ids: state.model
    });
    communitySharingRef?.value?.hide();
  } catch {
    //
  }
}

const openCommunitySharing = () => {
  const { protocol, host } = window.location;
  window.open(`${protocol}//${host}/dashboard/community-sharing/community`, '_self');
};

const openModal = () => {
  fetchList();
  state.model = [];
  communitySharingRef?.value?.show();
};

defineExpose({
  openModal: openModal
});
</script>

<template>
  <CyModal
    ref="communitySharingRef"
    width="40%"
    :centered="true"
    title="Community Sharing"
    v-bind="testId()"
    :modalAppendToBody="true"
    :footer="true"
  >
    <template #modal-content>
      <div class="note-bg-color cyw-round-md cyw-p-4 cyw-mb-5">
        <p class="cyw-text-f12">
          <CyIcon icon="fa-solid fa-circle-info" class="note-icon-color" v-bind="testId('info')" />
          <strong> Important </strong><br />Communities for which Rules are configured as “Do not
          share Alert” will be disabled.
        </p>
      </div>
      <div v-if="state.loading" class="cyw-flex-justify-center cyw-flex-align-center">
        <CySpinner size="5"></CySpinner>
      </div>
      <div
        v-else-if="!isEmpty(communities)"
        :style="{ maxHeight: '20rem' }"
        class="cyw-overflow-scroll"
      >
        <CyCheckbox
          class="cyw-border-bottom-1 cyw-pb-3 cyw-mb-3"
          v-bind="testId('select-all')"
          :model-value="isSelectAllChecked"
          @update:model-value="toggleSelectAll"
          :disabled="!state.allowedCommunityList.length"
          >{{ $t('alerts.form-interactions.select-all') }}</CyCheckbox
        >
        <div v-for="community in communities" :key="community.key_id">
          <CyCheckbox
            :model-value="isChecked(community)"
            :disabled="isDisabled(community)"
            v-bind="testId(`${community.tenant_name}`)"
            @update:model-value="checkChangedHandler($event, community)"
          >
            <div class="cyw-w-100 cyw-justify-content-between cyw-align-items-center">
              <span class="cyw-text-f14 cyw-color-N900">{{ community.tenant_name }}</span>
              <span
                v-if="isChecked(community) && isDisabled(community)"
                class="cyw-text-f10 cyw-ml-3"
              >
                Already Published!
              </span>
            </div>
          </CyCheckbox>
          <hr />
        </div>
      </div>
      <div v-else>
        <CyEmptyState v-bind="testId()" :message="{ title: $t('alerts.empty.no-communities-found') }" size="sm">
          <CyButton @click="openCommunitySharing" v-bind="testId('create')">
            {{ $t('alerts.buttons.create-community') }}
          </CyButton>
        </CyEmptyState>
      </div>
    </template>
    <template #modal-footer>
      <div class="cyw-flex-justify-end">
        <cy-button
          v-if="isPermittedToMe('published', 'sa') && isPermittedToMe('view', 'entity_sharing')"
          v-bind="testId('publish')"
          :disabled="!state.model.length"
          size="sm"
          @click="confirmSharingRef?.open({ type: 'error' }, {}, {})"
        >
          <span> {{ $t('alerts.buttons.publish') }} </span>
        </cy-button>
      </div>
    </template>
  </CyModal>
  <CyAlert
    :key="state.model?.length"
    v-bind="testId()"
    ref="confirmSharingRef"
    :message="COMMUNITY_SHARING_MSG($t, state.model.length)"
    @confirm="onDetailsClose"
  />
</template>
<style lang="scss" scoped>
.note-bg-color {
  background-color: var(--B200);
}
.note-icon-color {
  color: var(--B300);
}
</style>

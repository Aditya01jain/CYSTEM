<script setup lang="ts">
import { ref, onMounted, reactive, computed, onBeforeMount, inject, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { CREATE_ALERT_STEPPER, ALERT_STATUS } from '@/components/alertCreate/config';
import { useCommonData } from '@/composables/useCommonData';
import BasicInformation from '@/components/alertCreate/BasicInformation.vue';
import AdditionalInformation from '@/components/alertCreate/AdditionalInformation.vue';
import SendingOptions from '@/components/alertCreate/SendingOptions.vue';
import AlertSidebarPreview from '@/components/alertCreate/AlertSidebarPreview.vue';
import AlertSubmitPreview from '@/components/alertCreate/AlertSubmitPreview.vue';
import AlertLockTime from '@/components/alert/AlertLockTime.vue';
import { useRouter, useRoute } from 'vue-router';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { ALERT_LOCKED_MESSAGE } from '@/utils/config';

import { BASIC_REQUIRED_FIELDS } from '@/components/alertCreate/basics/rules';
import Speedbump from '@/components/common/Speedbump.vue';
import store from '@/store';
import { isEmpty } from 'lodash';
import { initTestId } from '@/utils/testid';
import { useCommentsStore } from '@/store/modules/useComments';
import CommentsAlert from '@/components/comments/CommentsAlert.vue';
import { EXPIRE_ALERT_MSG, CANCEL_ALERT_MSG } from '@/utils/config';

const $session: any = inject('$session');

const testId = initTestId('ac');
const { fetchUserDetails, fetchCommunitites, isPermittedToMe, fetchLocations, tlpList } =
  useCommonData();
const {
  fetchAlertCategories,
  fetchGroupsWithCategory,
  fetchAlertCampaign,
  setTlpList,
  updateAlertFormStore,
  submitAlertForm,
  lockAlert,
  fetchAlertData,
  tlpEmailConfig,
  checkSpeedBump
} = useAlertBasicsData();

const {
  fetchComments,
  createComment,
  resetCommentCount,
  state: commentsState
} = useCommentsStore();

const router = useRouter();
const route = useRoute();
const { t: $t } = useI18n();

const alertFormRef = ref();
const basicInformationRef = ref();
const speedbumpRef = ref();
const commentAlertRef = ref();

const props = defineProps<{
  redirectToListing: Function;
  alertId: string;
  alertData: Record<string, any>;
}>();

const emit = defineEmits(['alert:locked']);

const state = reactive({
  steps: CREATE_ALERT_STEPPER($t),
  totalSteps: 3 as number,
  currentStep: 1 as number,
  showAlertSubmitPreview: false,
  submitting: false,
  drafting: false,
  submittingPublisher: false,
  isNextLoading: false,
  isPreviousLoading: false,
  isExpireLoading: false,
  isRevertLoading: false,
  draftAlert: false,
  alertFormRules: BASIC_REQUIRED_FIELDS($t),
  speedBumpAuthConfig: {} as Record<string, any>,
  isSpeedbumpRuleMatches: false,
  expiredCodeError: false,
  refreshSendingOption: 0,
  loadingSpeedbump: false,
  activeSectionItem: '',
  skipValidation: false,
  activeSectionByUserClick: false,
  loading: true
});

const expireAlertRef: any = ref(null);
const cancelAlertRef: any = ref(null);

const banner = [
  {
    title: $t('alerts.banner.title'),
    suffix: 'Suffix',
    id: 'alert-lock-warning',
    state: 'warning',
    isMultipleLine: false,
    description: $t('alerts.banner.description')
  }
];

const lockInfoTextMap: Record<string, any> = {
  first: $t('alerts.lock-info-text.first'),
  last: $t('alerts.lock-info-text.last')
};

const getLockTimer = computed(() => {
  return alertFormData.value.editor_details
    ? alertFormData.value.editor_details?.locked_on * 1000 +
        (store.getters['common/getUserDetails']?.tenant?.alert_lock_duration * 1000 || 0)
    : 0;
});

const isFormReady = computed(() => {
  if (!isEmpty(store.getters['common/getUserDetails'])) {
    if (state.draftAlert) {
      return !!alertFormData.value.title;
    }
    return true;
  }
  return false;
});

const alertFormData = computed(() => store.getters['alertCreate/getAlertFormData']);

// Calculate next disabled based on basic details
const isNextDisabled = computed(() => basicInformationRef.value?.state?.isCategoryFieldLoading);

// Write logic for draft to be enabled when basic details are filled
const isDraftDisabled = computed(() => {
  return false;
});

const isSubmitToPublisherVisible = computed(
  () =>
    isPermittedToMe('submitted', 'sa') &&
    !(
      alertFormData.value.short_id &&
      ['PUBLISHED', 'SCHEDULED'].includes(alertFormData.value.status)
    )
);

const isExpireVisible = computed(
  () =>
    [
      ALERT_STATUS.PUBLISHED,
      ALERT_STATUS.SCHEDULED,
      ALERT_STATUS.DRAFT,
      ALERT_STATUS.SUBMITTED
    ].includes(alertFormData.value?.status) &&
    (isPermittedToMe('expired', 'sa') || isPermittedToMe('expire_published', 'sa')) &&
    !alertFormData.value?.self_destruction &&
    alertFormData.value?.show_update_btn
);

const isRevertVisible = computed(
  () =>
    isPermittedToMe('reverted', 'sa') &&
    alertFormData.value?.short_id &&
    alertFormData.value?.status === ALERT_STATUS.SUBMITTED
);

const isSaveAsDraftVisible = computed(
  () =>
    isPermittedToMe('draft', 'sa') &&
    !(
      alertFormData.value?.short_id &&
      [
        ALERT_STATUS.PUBLISHED,
        ALERT_STATUS.SCHEDULED,
        ALERT_STATUS.SUBMITTED,
        ALERT_STATUS.EXPIRED
      ].includes(alertFormData.value?.status)
    )
);

const isSubmitToPublisherDisabled = computed(
  () => !alertFormData.value?.permitted_publisher?.length
);

const isAdditionalInfoValid = computed(() =>
  Object.values(store.getters['alertCreate/getFormValid']?.additional)?.every((item) => item)
);

const sendingOptionsValid = computed(() => {
  const { validate, ...rest } = store.getters['alertCreate/getFormValid']?.sending;
  return Object.values(rest)
    ?.filter((item) => item !== 'validate')
    ?.every((item) => item);
});

const authType = computed(() => {
  return state.speedBumpAuthConfig?.is_enabled && state.isSpeedbumpRuleMatches
    ? state.speedBumpAuthConfig?.code
    : '';
});

const showSpeedbumpPopupTenantFlag = computed(() => {
  return store.getters['common/getTenantDetails']?.show_end_user_count_popup;
});

const analystGroupsEnabled = computed(() => {
  return store.getters['common/getUserDetails']?.analyst_group_enabled || false;
});

function handleImageOption() {
  const { card_image_type, card_image_file } = alertFormData.value;
  if (card_image_type === 'new_image' && !card_image_file) {
    updateAlertFormStore('card_image_type', 'default_image');
  }
}

const validateForm = async () => {
  try {
    await alertFormRef.value.validate();
    return { valid: true };
  } catch (error: any) {
    const keys = Object.keys(error);
    keys.forEach((key: string) => {
      if (['threat_indicators', 'schedules', 'card_tag'].includes(key))
        basicInformationRef.value.openItemsWithError(key);
    });
    setTimeout(() => alertFormRef.value.scrollToField(keys[0]), 200);
    return error;
  } finally {
    handleImageOption();
  }
};

const onCancel = (data: Record<string, any> = {}) => {
  if (['DRAFT', 'SCHEDULED', 'SUBMITTED', 'PUBLISHED'].includes(alertFormData.value.status)) {
    lockAlert({ short_id: alertFormData.value.short_id }, false);
  }
  if (data.clearFilter) store.dispatch('alert/setAppliedFilter', {});
  store.dispatch('alertCreate/resetAlertFormData');
  store.dispatch('alertCreate/resetAlertTempData');
  $session?.onCancel?.();
  router?.push({ name: 'alertList' });
};

const validateStep = async () => {
  if (state.currentStep === 1) {
    const valid = await validateForm();
    return valid;
  } else if (state.currentStep === 2 && !state.skipValidation) {
    return { valid: isAdditionalInfoValid.value };
  }
  return { valid: true };
};

const onStepChange = async (step: string) => {
  const stepId = parseInt(step?.split('-')[1]);
  state.skipValidation = true;

  if (stepId < state.currentStep) {
    onPrevious(state.currentStep - stepId);
  } else if (stepId > state.currentStep) {
    onNext(stepId - state.currentStep);
  } else return;
};

const onNext = async (count = 1) => {
  if (state.currentStep === 2 && !state.skipValidation) {
    await store.dispatch('alertCreate/setFormValid', { additional: { validate: true } });
  }
  setTimeout(async () => {
    const status: any = await validateStep();
    state.skipValidation = false;
    store.dispatch('alertCreate/setFormValid', { additional: { validate: false } });
    if (!status.valid) return;
    if (state.currentStep < state.totalSteps) state.currentStep += count;
  }, 1000);
};

const onPrevious = (count = 1) => {
  state.isPreviousLoading = true;
  if (state.currentStep > 1) state.currentStep -= count;
  setTimeout(() => (state.isPreviousLoading = false), 2000);
};

const saveAsDraft = async () => {
  state.skipValidation = true;
  state.drafting = true;
  const valid = await finalValidations();
  if (!valid) {
    state.drafting = false;
    return;
  }
  updateAlertFormStore('status', 'DRAFT');
  state.drafting = true;
  const status: any = await submitAlertForm();
  onAlertFormSubmit(status);
  state.drafting = false;
};

const onAlertFormSubmit = (status: Record<string, any>) => {
  if (status?.success) {
    if (props.redirectToListing) props.redirectToListing();
    else router?.push({ name: 'alertList' });
  }
};

const submitToPublisher = async () => {
  state.submittingPublisher = true;
  state.skipValidation = false;
  const valid = await finalValidations();
  if (!valid) {
    state.submittingPublisher = false;
    return;
  }
  updateAlertFormStore('status', 'SUBMITTED');
  const status: any = await submitAlertForm();
  onAlertFormSubmit(status);
  state.submittingPublisher = false;
};

const openAlertSubmitPreview = async () => {
  state.submitting = true;
  const valid = await finalValidations();
  if (valid) state.showAlertSubmitPreview = true;
  state.submitting = false;
};

async function finalValidations() {
  const status: any = await validateForm();
  if (!status.valid) {
    onStepChange('tab-1');
    nextTick(() => {
      const [firstKey] = Object.keys(status);
      alertFormRef.value.scrollToField(firstKey);
    });
    return false;
  }
  await store.dispatch('alertCreate/setFormValid', {
    additional: { validate: true }
  });
  if (!state.skipValidation)
    await store.dispatch('alertCreate/setFormValid', {
      sending: { validate: true }
    });

  const validationPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      const addValid = isAdditionalInfoValid.value;
      const sendValid = sendingOptionsValid.value;

      store.dispatch('alertCreate/setFormValid', {
        additional: { validate: false }
      });
      if (!addValid) {
        onStepChange('tab-2');
        store.dispatch('alertCreate/setFormValid', {
          sending: { validate: false }
        });
        resolve(false);
      }
      store.dispatch('alertCreate/setFormValid', {
        sending: { validate: false }
      });
      if (!state.skipValidation && !sendValid) {
        onStepChange('tab-3');
        resolve(false);
      }
      resolve(true);
    }, 1000);
  });

  const valid = await validationPromise;
  state.skipValidation = false;
  return valid;
}

const onCheckSpeedBump = async (stats: Record<string, any>) => {
  state.loadingSpeedbump = true;
  const { active_speed_bump, if_any_rule_matches } = await checkSpeedBump();
  state.speedBumpAuthConfig = active_speed_bump;
  state.isSpeedbumpRuleMatches = if_any_rule_matches;
  if (state.speedBumpAuthConfig?.is_enabled || state.isSpeedbumpRuleMatches) {
    showSpeedbump(stats);
    state.loadingSpeedbump = false;
  } else if (showSpeedbumpPopupTenantFlag.value) {
    showSpeedbump(stats);
    state.loadingSpeedbump = false;
  } else onPublish();
};

const onPublish = async ({ validate_speed_bump }: any = {}) => {
  if (!['SCHEDULED'].includes(alertFormData.value?.status))
    updateAlertFormStore('status', 'PUBLISHED');
  state.submitting = true;
  state.expiredCodeError = false;
  updateAlertFormStore('validate_speed_bump', validate_speed_bump);
  updateAlertFormStore('check_rules_for_alert', true);
  const status: any = await submitAlertForm();
  state.submitting = false;
  if (status?.success)
    if (status?.error) state.expiredCodeError = status?.error.detail?.includes('OTP is expired');
  onAlertFormSubmit(status as any);
};

const showSpeedbump = (stats: Record<string, any>) => {
  speedbumpRef.value?.show({
    authType: authType.value,
    userCount: stats?.count,
    invalidCode: false
  });
};

const storeTlpConfig = async () => {
  const response = await tlpEmailConfig();
  store.dispatch('alertCreate/setAlertFormListData', {
    key: 'tlp-config-data',
    value: { ...response?.results }
  });
};

const isRevertDisabled = () => {
  return !commentsState.commentsList?.comments_list?.length;
};

const handleRevert = async (callRevert: boolean = false) => {
  if (commentsState?.commentCount <= 0 && !callRevert) {
    commentAlertRef?.value?.showCommentAlert();
  } else {
    state.skipValidation = false;
    const valid = await finalValidations();
    if (!valid) return;
    updateAlertFormStore('status', 'REVERTED');
    state.submitting = true;
    const status: any = await submitAlertForm();
    if (status?.success) {
      if (props.redirectToListing) props.redirectToListing();
      else router?.push({ name: 'alertList' });
    }
  }
};

const handleExpireConfirm = async () => {
  state.isExpireLoading = true;
  if (!['SCHEDULED'].includes(alertFormData.value?.status))
    updateAlertFormStore('status', 'EXPIRED');
  const status = await submitAlertForm();
  state.isExpireLoading = false;
  if (status?.success) {
    if (props.redirectToListing) {
      props.redirectToListing();
    } else router?.push({ name: 'alertList' });
  }
};

const handleExpireClick = () => {
  expireAlertRef?.value?.open({ type: 'error' }, {}, {});
};

const handleCancelClick = (clearFilter = false) => {
  cancelAlertRef?.value?.open({ type: 'error' }, {}, { clearFilter });
};

const getTopmostVisibleSection = (id: string) => {
  const scrollContainer = document.querySelector(`#${id}`);
  if (!scrollContainer) return null;
  const items = Array.from(scrollContainer.querySelectorAll('.cyw-accordion-item'));
  let topmostItemId = null;
  let maxVisibleHeight = 0;
  items.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    // Calculate the visible height of the item within the container
    const visibleTop = Math.max(rect.top, containerRect.top); // The lower boundary of the top edge
    const visibleBottom = Math.min(rect.bottom, containerRect.bottom); // The upper boundary of the bottom edge
    const visibleHeight = Math.max(0, visibleBottom - visibleTop); // Visible height within the container
    // Update the topmost item based on the largest visible height
    if (visibleHeight > maxVisibleHeight) {
      maxVisibleHeight = visibleHeight;
      topmostItemId = item.id;
    }
  });
  return topmostItemId;
};

const handleScroll = (id: string) => {
  if (state.activeSectionByUserClick) return;
  const topmostId = getTopmostVisibleSection(id);
  if (topmostId) {
    state.activeSectionItem = topmostId;
  }
};
async function validateField($event: any, data: any) {
  try {
    await alertFormRef.value.validateField($event);
  } catch {
    //
  }
}

const validateAndNext = () => {
  state.skipValidation = false;
  onNext();
};

const alertLockWarningRef: any = ref();

const showAlertLockWarning = (status: string) => {
  alertLockWarningRef?.value?.open(
    {
      title: status === 'last' ? 'Time Limit Reached' : 'Reminder',
      subTitle: lockInfoTextMap[status],
      confirmText: 'Okay'
    },
    {},
    { type: status }
  );
};

const confirmWarningPopup = (data: Record<string, any>) => {
  alertLockWarningRef?.value?.close();
  if (data.type === 'last') {
    if (props.redirectToListing) props.redirectToListing();
    else router?.push({ name: 'alertList' });
  }
};

onBeforeMount(async () => {
  const alertId = props.alertId || route?.params?.shortid;
  if (!isEmpty(props.alertData)) {
    store.dispatch('alertCreate/resetAlertFormData');
    store.dispatch('alertCreate/resetAlertTempData');
    store.dispatch('alertCreate/setAlertForm', { ...props.alertData });
  } else if (!!alertId) {
    state.draftAlert = true; // why is this required?
    store.dispatch('alertCreate/resetAlertFormData');
    store.dispatch('alertCreate/resetAlertTempData');
    let data = await fetchAlertData({ card_id: alertId });
    if (data?.error?.code === 404) props.redirectToListing();
    const currentTimestamp = Math.floor(Date.now() / 1000);
    updateAlertFormStore('alert_creation_start_time', currentTimestamp);
    data = {
      ...data,
      tactic_technique_pairs: data.tactic_technique_pairs_data,
      source_urls: data?.source_urls[0]?.idx === -1 ? [] : data.source_urls
    };
    store.dispatch('alertCreate/setAlertForm', { ...data });
  }
  if (isEmpty(store.getters['common/getUserDetails'])) await fetchUserDetails();
  await (analystGroupsEnabled.value ? fetchGroupsWithCategory() : fetchAlertCategories());
  state.loading = false;
  await storeTlpConfig();
  const data = store.getters['alertCreate/getAlertFormData'];
  const userDetails = store.getters['common/getUserDetails'];

  if (isPermittedToMe('view', 'campaign')) fetchAlertCampaign();

  if (!data?.short_id) {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    updateAlertFormStore('alert_creation_start_time', currentTimestamp);
    return;
  }

  const isAlertLocked = !data?.editor_details
    ? false
    : data?.editor_details?.user.user_id !== userDetails?.user_id;
  if (isAlertLocked) {
    store.dispatch('alertCreate/setAlertTempData', {
      alertLocked: {
        message: ALERT_LOCKED_MESSAGE($t, data?.editor_details?.user?.full_name),
        data: data
      }
    });
    if (props.redirectToListing) props.redirectToListing();
    else router?.push({ name: 'alertList' });
    return;
  }
});

onMounted(async () => {
  // verify is all these awaits are required
  $session.callback?.(handleCancelClick);
  fetchCommunitites();
  fetchLocations();
  fetchComments();
  resetCommentCount();
  setTlpList(tlpList($t));
});
</script>

<template>
  <div class="cyw-h-100 cyw-base-font" v-if="isFormReady">
    <header class="create-header cyw-flex-align-center cyw-px-4 cyw-border-bottom-1">
      <CyIconShell
        v-bind="testId('back')"
        size="md"
        class="cyw-mr-3"
        @click="handleCancelClick(false)"
      >
        <CyIcon icon="fa-regular fa-arrow-left" />
      </CyIconShell>
      <h4 v-bind="testId('title')" class="cyw-text-f20 cyw-text-medium">
        {{ alertFormData?.short_id ? 'Edit Alert' : $t('alerts.listing-page.create-alert-button') }}
      </h4>
    </header>

    <cy-banner v-if="getLockTimer && !!alertFormData?.short_id" :data="banner">
      <template #message="{ item }">
        <div v-bind="testId('banner')" class="cyw-text-medium cyw-flex-align-center">
          <AlertLockTime
            class="cyw-mx-2"
            :timerValue="getLockTimer"
            @show:lockwarning="showAlertLockWarning($event)"
          />
          <p class="cyw-ml-2">{{ item.title }}</p>
        </div>
        <p>{{ item.description }}</p>
      </template>
      <template #close-button>
        <div></div>
      </template>
    </cy-banner>
    <main
      class="create-form cyw-flex cyw-flex-align-stretch"
      :class="{ 'create-form--with-banner': getLockTimer }"
    >
      <div
        v-if="
          state.loadingSpeedbump ||
          state.submitting ||
          state.drafting ||
          state.submittingPublisher ||
          state.loading
        "
        class="ca-loading-overlay cyw-flex-justify-center cyw-flex-align-center cyw-h-100"
      >
        <cy-spinner size="4" />
      </div>
      <section class="create-form__body cyw-bg-N20">
        <div class="create-form__body-content">
          <header class="empty-section create-form__header">
            <div class="cyw-flex-justify-center" id="ca-alert-create-step">
              <cy-stepper
                v-bind="testId()"
                class="stepper"
                :steps="state.steps"
                :active="state.currentStep"
                bgClass="cyw-bg-N20"
                :is-row-type="true"
                @click:step="onStepChange"
              />
            </div>
          </header>
          <template v-if="!state.loading">
            <div v-show="state.currentStep === 1" class="empty-section create-form__wrapper">
              <el-form
                @submit.prevent
                ref="alertFormRef"
                :model="alertFormData"
                :rules="state.skipValidation ? BASIC_REQUIRED_FIELDS($t) : state.alertFormRules"
                :validate-on-rule-change="false"
                :scroll-into-view-options="{ behavior: 'smooth', block: 'center' }"
              >
                <BasicInformation
                  ref="basicInformationRef"
                  :skipValidation="state.skipValidation"
                  @validate:field="validateField"
                  @update:rules="state.alertFormRules = { ...BASIC_REQUIRED_FIELDS($t), ...$event }"
                  @clear-validate="alertFormRef.clearValidate($event)"
                  @refresh:sendingoptions="state.refreshSendingOption++"
                />
              </el-form>
            </div>
            <div
              v-show="state.currentStep === 2"
              class="create-form__wrapper"
              id="additional-information-wrapper"
              @scroll="handleScroll('additional-information-wrapper')"
            >
              <AdditionalInformation
                :activeSectionItem="state.activeSectionItem"
                :skipValidation="state.skipValidation"
                @highlight:section="state.activeSectionItem = $event"
                @user:click:section="state.activeSectionByUserClick = $event"
              />
            </div>
            <div
              v-show="state.currentStep === 3"
              class="create-form__wrapper"
              id="sending-options-wrapper"
              @scroll="handleScroll('sending-options-wrapper')"
            >
              <SendingOptions
                :onPage="state.currentStep === 3"
                :key="state.refreshSendingOption"
                :activeSectionItem="state.activeSectionItem"
                @highlight:section="state.activeSectionItem = $event"
                @user:click:section="state.activeSectionByUserClick = $event"
              />
            </div>
          </template>
        </div>
        <footer class="create-form__footer">
          <hr class="cyw-my-0" />
          <div class="cyw-flex-align-center cyw-flex-justify-between cyw-h-100">
            <cy-button
              v-bind="testId('previous')"
              type="tertiary"
              subtype="subtle"
              :class="`${state.currentStep === 1 ? 'visibility-hidden' : ''} cyw-mr-3`"
              :disabled="state.isPreviousLoading"
              @click="onPrevious(1)"
            >
              {{ $t('alerts.alert-form-step.previous-button') }}
            </cy-button>
            <div class="cyw-flex-justify-end">
              <cy-button
                v-bind="testId('cancel')"
                type="tertiary"
                subtype="subtle"
                class="cyw-mr-3"
                @click="handleCancelClick(false)"
              >
                {{ $t('alerts.buttons.cancel') }}
              </cy-button>
              <cy-button
                v-if="isExpireVisible"
                v-bind="testId('expire')"
                cy-test-id="expire"
                type="primary"
                subtype="danger"
                size="sm"
                class="cyw-mr-3"
                :loading="state.isExpireLoading"
                :disabled="state.isExpireLoading"
                @click="handleExpireClick"
              >
                {{ $t('alerts.buttons.expire') }}
              </cy-button>
              <cy-button
                v-if="isSaveAsDraftVisible"
                v-bind="testId('save-as-draft')"
                type="secondary"
                subtype="subtle"
                :disabled="isDraftDisabled"
                class="cyw-mr-3"
                :loading="state.drafting"
                @click="saveAsDraft()"
              >
                {{ $t('alerts.alert-form.save-as-draft-button') }}
              </cy-button>
              <cy-button
                v-if="state.currentStep < 3"
                v-bind="testId('next')"
                type="primary"
                width="8"
                :disabled="state.isNextLoading || isNextDisabled"
                @click="validateAndNext()"
              >
                {{ $t('alerts.alert-form.next-button') }}
              </cy-button>
              <template v-else>
                <cy-tooltip
                  :disabled="!isSubmitToPublisherDisabled"
                  :content="$t('alerts.error-message.submit-to-publisher')"
                  placement="top"
                >
                  <cy-button
                    v-if="isSubmitToPublisherVisible"
                    v-bind="testId('submit')"
                    type="secondary"
                    class="cyw-mr-3"
                    :loading="state.submittingPublisher"
                    @click="submitToPublisher"
                    :disabled="isSubmitToPublisherDisabled"
                  >
                    {{ $t('alerts.buttons.submit-to-publisher') }}
                  </cy-button></cy-tooltip
                >

                <cy-tooltip
                  :disabled="!isRevertDisabled()"
                  :content="$t('alerts.publisher-comment.add-comment-to-revert-tooltip')"
                  placement="top"
                >
                  <cy-button
                    v-if="isRevertVisible"
                    v-bind="testId('revert')"
                    cy-test-id="revert"
                    type="primary"
                    class="cyw-mr-3"
                    :loading="state.isRevertLoading"
                    :disabled="state.isRevertLoading || isRevertDisabled()"
                    @click="handleRevert()"
                  >
                    {{ $t('alerts.buttons.revert') }}
                  </cy-button>
                </cy-tooltip>
                <cy-button
                  v-bind="testId('preview')"
                  v-if="isPermittedToMe('published', 'sa') || isPermittedToMe('scheduled', 'sa')"
                  type="primary"
                  @click="openAlertSubmitPreview"
                >
                  {{ $t('alerts.alert-form-step.preview-button') }}
                </cy-button>
              </template>
            </div>
          </div>
        </footer>
      </section>
      <section class="create-form__preview cyw-mh-100 cyw-overflow-y-auto cyw-bg-N10">
        <AlertSidebarPreview title="" description="" />
      </section>
    </main>
  </div>
  <CyAlert
    ref="alertLockWarningRef"
    v-bind="testId('alert-lock-time')"
    :hide-on-esc="false"
    :modalAppendToBody="false"
    :config="{ showCancel: false, modalAppendToBody: false }"
    @confirm="confirmWarningPopup"
  />
  <CyAlert
    v-bind="testId('cancel')"
    ref="cancelAlertRef"
    :message="CANCEL_ALERT_MSG($t)"
    @cancel="$session?.callback?.(handleCancelClick, true)"
    @confirm="onCancel"
  ></CyAlert>
  <CyAlert
    v-bind="testId('expire')"
    ref="expireAlertRef"
    :message="EXPIRE_ALERT_MSG($t)"
    @confirm="handleExpireConfirm"
  ></CyAlert>
  <CommentsAlert ref="commentAlertRef" @submit:revert="handleRevert(true)" />
  <AlertSubmitPreview
    v-if="state.showAlertSubmitPreview"
    :redirectToListing="redirectToListing"
    @check:speedbump="onCheckSpeedBump"
    @close="state.showAlertSubmitPreview = false"
  />
  <Speedbump
    ref="speedbumpRef"
    :loading="state.submitting"
    :expiredCodeError="state.expiredCodeError"
    :isSaveAsDraftVisible="isSaveAsDraftVisible"
    @publish="onPublish"
    @save:draft="saveAsDraft"
  />
  <common-icons v-if="false" />
</template>
<style lang="scss" scoped>
.create-header {
  height: 4.8rem;
  border-bottom: 0.1rem solid var(--N100);
}
.create-form {
  height: calc(100% - 4.8rem);
  overflow: hidden;
  &--with-banner {
    height: calc(100% - 8rem) !important;
  }
  &__body {
    width: 67.5%;
    height: 100%;
    &-content {
      height: calc(100% - 4.8rem);
      .stepper {
        margin-bottom: 4.8rem;
        width: 80%;
      }
    }
    .empty-section {
      padding-left: 32rem;
      @media screen and (max-width: 1500px) {
        padding-left: 25rem;
      }
    }
  }
  &__header {
    height: 7.2rem;
    padding: 2.4rem 12rem 0.8rem 12rem;
    margin-right: 7rem;
    @media screen and (max-width: 1500px) {
      padding: 2.4rem 8rem 0 8rem;
    }
  }
  &__wrapper {
    height: calc(100% - 8rem);
    padding: 2.4rem 12rem 0 12rem;
    overflow-y: auto;
    @media screen and (max-width: 1500px) {
      padding: 2.4rem 8rem 0 8rem;
    }
  }
  &__footer {
    height: 4.8rem;
    margin: 0 0 0 20rem;
    padding: 0 12rem 0 12rem;
    @media screen and (max-width: 1500px) {
      padding: 0 8rem 0 8rem;
      margin: 0 0 0 14rem;
    }
  }
  &__preview {
    width: 32.5%;
    padding: 2.4rem 6rem 0;
    border-left: 0.1rem solid var(--N100);
    @media screen and (max-width: 1500px) {
      padding: 2.4rem 3rem 0;
    }
  }
}
</style>

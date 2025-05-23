<script setup lang="ts">
import { reactive, ref, computed, inject, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CountdownTimer from '@/components/common/CountdownTimer.vue';
import store from '@/store';
import { initTestId } from '@/utils/testid';

const { t: $t } = useI18n();
const $api: any = inject('$api');

const speedbumpRef: any = ref(null);
const gRecaptchRef: any = ref(null);

const emit = defineEmits(['save:draft', 'publish']);

const AUTH_TYPE = {
  EMAIL_OTP: 'EMAIL_OTP',
  MOBILE_OTP: 'MOBILE_OTP',
  LAST_4_DIGIT_PH: 'LAST_4_DIGIT_PH',
  RECAPTCHA: 'RECAPTCHA'
};

const props = defineProps({
  loading: { type: Boolean, defalult: false },
  expiredCodeError: { type: Boolean, defalult: false },
  isSaveAsDraftVisible: { type: Boolean, defalult: false },
  dataTestid: { default: '' }
});

const testId = initTestId(props.dataTestid);

const state = reactive({
  isVisible: false,
  sendingCode: false,
  module_slug: '',
  startTimer: false,
  isCodeSent: false,
  otpModel: {} as Record<string, any>,
  authType: '',
  code: '',
  userCount: 0,
  siteKey: '',
  captchaResponse: '',
  captchaError: ''
});

const isGoogleCaptcha = computed(() => state.authType === AUTH_TYPE.RECAPTCHA);

const disablePublish = computed(() => {
  switch (state.authType) {
    case AUTH_TYPE.EMAIL_OTP:
    case AUTH_TYPE.MOBILE_OTP:
      return (state.code?.toString() || '').length !== 6;
    case AUTH_TYPE.LAST_4_DIGIT_PH:
      return (state.code?.toString() || '').length !== 4;
    case AUTH_TYPE.RECAPTCHA:
      return !state.siteKey;
  }
});

const isPhoneConfigured = computed(() => {
  const userDetails = store.getters['common/getUserDetails'];
  return [AUTH_TYPE.MOBILE_OTP, AUTH_TYPE.LAST_4_DIGIT_PH].includes(state.authType)
    ? !!userDetails.ph_number
    : true;
});

const speedbumpAlertMessage = computed(() => {
  return {
    title: $t(
      state.userCount === 1
        ? 'alerts.alert-sharing.message-with-1-recipient'
        : 'alerts.alert-sharing.message-with-multiple-recipients',
      { number: state.userCount }
    ),
    subTitle: [AUTH_TYPE.MOBILE_OTP, AUTH_TYPE.EMAIL_OTP].includes(state.authType)
      ? state.authType === AUTH_TYPE.MOBILE_OTP
        ? $t('alerts.messages.code-to-phone')
        : $t('alerts.messages.code-to-email')
      : [AUTH_TYPE.LAST_4_DIGIT_PH].includes(state.authType)
      ? $t('alerts.messages.last-4-digit')
      : ''
  };
});

async function sendOtp() {
  state.sendingCode = true;
  try {
    const { data } = await $api.post(
      'analyst.sendOtpSpeedbump',
      {},
      {
        params: {
          errorHandle: false
        }
      }
    );
    state.otpModel = { ...state.otpModel, auth_token: data.auth_token };
    state.startTimer = true;
    state.isCodeSent = true;
  } catch (err: any) {
    state.startTimer = false;
  } finally {
    state.sendingCode = false;
    setTimeout(() => {
      state.isCodeSent = false;
    }, 5000);
  }
}

function resend() {
  state.otpModel = {};
  handleTimerExpire();
  sendOtp();
}

function handleTimerExpire() {
  state.startTimer = false;
  state.isCodeSent = false;
}

function show({ authType, userCount, invalidCode }: Record<string, any>) {
  state.authType = authType;
  state.userCount = userCount;
  if (authType === AUTH_TYPE.RECAPTCHA) getSiteKey();
  if ([AUTH_TYPE.MOBILE_OTP, AUTH_TYPE.EMAIL_OTP].includes(state.authType)) sendOtp();
  nextTick(() => speedbumpRef.value?.show());
  state.isVisible = true;
}

function close() {
  speedbumpRef.value?.hide();
  state.isVisible = false;
  state.authType = '';
  state.captchaError = '';
  state.siteKey = '';
  state.captchaResponse = '';
  state.code = '';
}

function onDraft() {
  emit('save:draft');
  close();
}

function onCaptchaError() {
  state.captchaError = 'Invalid Captcha';
}

function onCaptchaVerify(e: string) {
  state.captchaResponse = e;
}

async function onConfirm(validationParam: Record<string, any>) {
  const payload = { validate_speed_bump: {} };
  switch (state.authType) {
    case AUTH_TYPE.EMAIL_OTP:
    case AUTH_TYPE.MOBILE_OTP:
      validationParam.otp = parseInt(validationParam.otp);
      payload.validate_speed_bump = { ...validationParam };
      break;
    case AUTH_TYPE.LAST_4_DIGIT_PH:
      payload.validate_speed_bump = { last_4_digit_ph: validationParam.otp };
      break;
    case AUTH_TYPE.RECAPTCHA:
      await gRecaptchRef.value?.execute();
      payload.validate_speed_bump = { 'g-recaptcha-response': state.captchaResponse };
  }
  emit('publish', payload);
}

async function getSiteKey() {
  try {
    const { data } = await $api.get('analyst.getAuthType');
    state.siteKey = data?.google_recaptcha_key;
  } catch {
    //
  }
}

watch(
  () => props.expiredCodeError,
  (newValue) => {
    if (newValue) handleTimerExpire();
  }
);

defineExpose({ show, close });
</script>
<template>
  <CyModal
    ref="speedbumpRef"
    noCloseIcon
    noHeader
    :footer="true"
    v-bind="testId('speedbump')"
    @discard="emit('save:draft')"
    @confirm="onConfirm({ ...state.otpModel, otp: state.code })"
  >
    <template #modal-content>
      <header>
        <h4 v-bind="testId('speedbump-title')" class="cyw-color-N900 cyw-text-medium cyw-text-f20">
          {{ speedbumpAlertMessage.title }}
        </h4>
        <p v-bind="testId('speedbump-subtitle')" class="cyw-color-N700 cyw-text-f14 cyw-pt-2">
          {{ speedbumpAlertMessage.subTitle }}
        </p>
      </header>
      <div v-if="isGoogleCaptcha && state.isVisible">
        <cy-google-recaptcha
          ref="gRecaptchRef"
          :key="state.siteKey"
          :siteKey="state.siteKey"
          v-bind="testId('speedbump-recaptcha')"
          @onSuccess="onCaptchaVerify"
          @onError="onCaptchaError"
        />
      </div>
      <div
        v-if="state.authType && !isGoogleCaptcha && isPhoneConfigured"
        class="cyw-flex-align-center cyw-mt-4"
      >
        <CyInput
          v-model="state.code"
          :maxlength="6"
          size="md"
          type="number"
          v-bind="testId('speedbump-otp')"
          class="speedbump-otp"
        />
        <div class="cyw-flex-align-center">
          <CyButton
            v-if="state.authType !== AUTH_TYPE.LAST_4_DIGIT_PH"
            type="tertiary"
            :loading="state.sendingCode"
            :disabled="state.startTimer"
            class="cyw-ml-2"
            v-bind="testId('speedbump-resend')"
            @click="resend"
          >
            {{ $t('alerts.buttons.resend') }}
          </CyButton>
          <template v-if="state.startTimer">
            <span class="cyw-text-f16 cyw-color-N700 cyw-ml-1 cyw-mr-2">{{ `( ` }}</span>
            <CountdownTimer :minutes="1" @finish="handleTimerExpire" />
            <span class="cyw-text-f16 cyw-color-N700 cyw-ml-2">{{ ` )` }}</span>
          </template>
          <span v-if="state.isCodeSent" class="cyw-text-f12 cyw-color-N700 cyw-ml-3 cyw-mr-2">
            {{ $t('alerts.messages.otp-sent-successfully') }}
          </span>
        </div>
      </div>
      <div
        v-if="!isPhoneConfigured || state.captchaError"
        class="cyw-text-f12 cyw-color-N700 speedbump-error-text"
        v-bind="testId('speedbump-captcha-error')"
      >
        {{ state.captchaError || $t('alerts.otp-messages.phone-number-configuration') }}
      </div>
    </template>
    <template #modal-footer>
      <div class="cyw-flex-align-center cyw-flex-justify-end">
        <CyButton
          type="tertiary"
          subtype="subtle"
          v-bind="testId('speedbump-cancel')"
          @click="close"
        >
          {{ $t('alerts.buttons.cancel') }}
        </CyButton>
        <CyButton
          v-if="props.isSaveAsDraftVisible"
          type="secondary"
          class="cyw-mx-3"
          :disabled="props.loading"
          v-bind="testId('speedbump-saveasdraft')"
          @click="onDraft"
          >{{ $t('alerts.alert-form.save-as-draft-button') }}</CyButton
        >
        <CyButton
          v-if="isPhoneConfigured"
          :disabled="disablePublish || props.loading"
          v-bind="testId('speedbump-publish')"
          @click="onConfirm({ ...state.otpModel, otp: state.code })"
        >
          {{ $t('alerts.buttons.publish') }}
        </CyButton>
      </div>
    </template>
  </CyModal>
</template>
<style scoped lang="scss">
.speedbump {
  &-otp {
    width: 12rem;
  }
  &-error-text {
    color: var(--R500);
  }
}
</style>

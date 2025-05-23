<script setup lang="ts">
import { reactive, computed, onMounted, ref, watch } from 'vue';
import store from '@/store';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { CONFERENCE_DIAL_IN } from './config';
import { useI18n } from 'vue-i18n';
import { CONFERENCE_DIAL_RULES, CONFERENCE_DIAL_PATTERN_RULES } from './rules';
import { isEmpty } from 'lodash';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'conference-dial-in');

const { t: $t }: any = useI18n();
const { updateAlertFormStore, fetchConferenceDetails } = useAlertBasicsData();

const props = defineProps({
  showComponent: { default: false },
  skipValidation: { default: false }
});

const state = reactive({
  model: {
    startDate: null,
    endDate: null,
    conferenceDialDirectory: null as string | null,
    conferenceDial: '',
    conferenceUrl: ''
  },
  conference: {} as Record<string, any>,
  selectedRadio: '',
  confData: {},
  confMapData: [],
  confdir: {},
  valid: true
});

const conferenceModel = ref();

const validate = computed(
  () => store.getters['alertCreate/getFormValid']?.additional?.validate || false
);

const disableUrlAndNumber = computed(
  () => state.selectedRadio === 'exisiting' && isEmpty(state.conference)
);

const confMapData: any = computed(() => {
  let { number, url }: Record<string, any> = state.confData;
  url = url.map((el: Record<string, any>) => {
    const { conference_dial_id, is_active, name, url } = el;
    return { conference_dial_id, is_active, name, url };
  });
  return [...number, ...url].reduce((accumulator, current) => {
    if (accumulator[current.conference_dial_id]) {
      accumulator[current.conference_dial_id] = {
        ...accumulator[current.conference_dial_id],
        ...current
      };
    } else {
      accumulator[current.conference_dial_id] = current;
    }
    return accumulator;
  }, {});
});

const confDir: Record<string, any> = computed(() => {
  return Object.keys(state.confMapData).map((key: any) => {
    const { name: title, conference_dial_id } = state.confMapData[key];
    return { title, conference_dial_id };
  });
});

function updateNumberUrl() {
  if (!state.conference) {
    resetConferenceModel();
    return;
  }
  const conferenceDialId = state.conference?.['conference_dial_id'];
  const { number, url } = state.confMapData[conferenceDialId];
  state.model.conferenceDialDirectory = conferenceDialId || null;
  state.model.conferenceDial = number;
  state.model.conferenceUrl = url;
  updateStore();
}

function resetConferenceModel() {
  state.conference = {};
  state.model = {
    startDate: null,
    endDate: null,
    conferenceDialDirectory: null,
    conferenceDial: '',
    conferenceUrl: ''
  };
  updateStore();
}

function updateStore() {
  updateAlertFormStore('conference_url', state.model.conferenceUrl);
  updateAlertFormStore('conference_dial', state.model.conferenceDial);
  updateAlertFormStore('conference_dial_directory', state.model.conferenceDialDirectory || null);
  store.dispatch('common/setFormDetails', {
    conference: state.conference
  });
}

async function validateField(key: string) {
  try {
    await conferenceModel.value?.validateField(key);
    if (key === 'conferenceDial') state.valid = true;
  } catch {
    if (key === 'conferenceDial') state.valid = false;
  }
}

function updateConferenceOption(value: string) {
  state.selectedRadio = value;
  store.dispatch('common/setFormDetails', {
    selectedRadio: state.selectedRadio
  });
  resetConferenceModel();
}

async function conferenceDialValue() {
  updateAlertFormStore('conference_dial', state.model.conferenceDial);
  validateField('conferenceDial');
}

onMounted(async () => {
  state.confData = await fetchConferenceDetails({});
  state.confMapData = confMapData;
  state.confdir = confDir;

  const {
    conference_url,
    conference_dial,
    conference_start_time,
    conference_end_time,
    conference_dial_directory
  } = store.getters['alertCreate/getAlertFormData'];

  state.model.conferenceUrl = conference_url || '';
  state.model.conferenceDial = conference_dial || null;
  state.model.startDate = conference_start_time || null;
  state.model.endDate = conference_end_time || null;
  state.model.conferenceDialDirectory = conference_dial_directory || null;
  state.conference = conference_dial_directory || null;
  state.selectedRadio = conference_dial_directory ? 'exisiting' : 'new';
});

watch(
  () => validate.value,
  async (validate: boolean) => {
    if (validate && props.showComponent) {
      conferenceModel.value?.validate((valid: boolean) => {
        state.valid = false;
        store.dispatch('alertCreate/setFormValid', {
          additional: { 'conference-dial-in': valid }
        });
      });
    }
  },
  { deep: true }
);
</script>
<template>
  <div class="cyw-flex-row cyw-mb-4">
    <CyRadio
      v-for="option in CONFERENCE_DIAL_IN($t)"
      v-bind="testId(`${option.key}`)"
      class="cyw-mr-5"
      :key="option.key"
      :label="option.label"
      :option="true"
      :modelValue="state.selectedRadio === option.key"
      @update:modelValue="updateConferenceOption(option.key)"
    />
  </div>
  <cy-select
    v-if="state.selectedRadio === 'exisiting'"
    v-bind="testId('template')"
    v-model="state.conference"
    :data="confDir"
    value-identifier="title"
    search-identifier="title"
    placeholder="Select conference"
    identifier="conference_dial_id"
    class="ca-w-60"
    size="sm"
    @update:model-value="updateNumberUrl"
  />
  <el-form
    @submit.prevent
    ref="conferenceModel"
    :validate-on-rule-change="false"
    :model="state.model"
    :rules="!props.skipValidation ? CONFERENCE_DIAL_RULES($t) : []"
  >
    <div class="cyw-p-4 cyw-round-lg cyw-bg-N50">
      <el-form-item
        prop="conferenceUrl"
        :rules="CONFERENCE_DIAL_PATTERN_RULES($t).conferenceUrl"
        v-bind="testId('conferenceUrl-form-item')"
      >
        <cy-input
          v-bind="testId('conferenceUrl')"
          v-model="state.model.conferenceUrl"
          :maxlength="500"
          showCount
          :disabled="disableUrlAndNumber"
          :label="`${$t('alerts.form-interactions.conference-url')}*`"
          size="md"
          @update:model-value="
            updateAlertFormStore('conference_url', $event);
            validateField('conferenceUrl');
          "
        />
      </el-form-item>
      <el-form-item
        class="cyw-mt-4"
        prop="conferenceDial"
        :rules="CONFERENCE_DIAL_PATTERN_RULES($t).conferenceDial"
        v-bind="testId('conferenceDial-form-item')"
      >
        <cy-input
          v-bind="testId('conferenceDial')"
          v-model="state.model.conferenceDial"
          @update:model-value="conferenceDialValue"
          :disabled="disableUrlAndNumber"
          :maxlength="150"
          showCount
          :label="`${$t('alerts.form-interactions.conference-number')}*`"
          size="md"
        />
      </el-form-item>
      <p class="cyw-color-N700 cyw-text-f12 cyw-mb-4" :class="{ 'cyw-mt-4': !state.valid }">
        {{ '(Country Code) Dial-in Number, PIN#' }}
      </p>
      <div class="cyw-flex">
        <el-form-item
          prop="startDate"
          class="cyw-w-50 cyw-pr-3"
          v-bind="testId('startdate-form-item')"
        >
          <div class="cyw-flex-col" v-bind="testId('startdate')">
            <label class="cyw-color-N700 cyw-text-f12">
              {{ `${$t('alerts.form-interactions.start-date')}*` }}
            </label>
            <el-date-picker
              type="datetime"
              format="MMM DD, YYYY HH:mm"
              timeFormat="HH:mm"
              dateFormat="MMM DD, YYYY"
              placeholder="Select date"
              class="ca-date-picker"
              popper-class="ca-date-picker__popper"
              value-format="X"
              :disabled-date="(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))"
              v-model="state.model.startDate"
              @update:modelValue="
                updateAlertFormStore('conference_start_time', $event);
                validateField('startDate');
              "
            />
          </div>
        </el-form-item>
        <el-form-item prop="endDate" class="cyw-w-50 cyw-pl-3" v-bind="testId('enddate-form-item')">
          <div class="cyw-flex-col" v-bind="testId('enddate')">
            <label class="cyw-color-N700 cyw-text-f12">
              {{ `${$t('alerts.form-interactions.end-date')}*` }}
            </label>
            <el-date-picker
              type="datetime"
              format="MMM DD, YYYY HH:mm"
              timeFormat="HH:mm"
              dateFormat="MMM DD, YYYY"
              placeholder="Select date"
              class="ca-date-picker"
              popper-class="ca-date-picker__popper"
              value-format="X"
              :disabled-date="(date: Date) => state.model.startDate ? date < new Date(state.model.startDate as number * 1000) : date <= new Date()"
              v-model="state.model.endDate"
              @update:modelValue="
                updateAlertFormStore('conference_end_time', $event);
                validateField('endDate');
              "
            />
          </div>
        </el-form-item>
      </div>
    </div>
  </el-form>
</template>

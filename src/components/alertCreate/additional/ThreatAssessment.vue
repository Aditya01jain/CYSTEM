<script setup lang="ts">
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue';
import { useStore } from '@/store';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { QUESTION_TYPE, THREAT_ASSESSMENT_RADIO_OPTIONS, SLA_MAP } from './config';
import { useI18n } from 'vue-i18n';
import { isEmpty } from 'lodash';
import { THREAT_ASSESSMENT, THREAT_ASSESSMENT_OPTION } from './rules';
import { useCommonData } from '@/composables/useCommonData';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'threat-assessment');

const { isPermittedToMe } = useCommonData();
const { t: $t }: any = useI18n();
const { fetchSlas, fetchThreatAssessmentTemplates, updateAlertFormStore } = useAlertBasicsData();
const store: Record<string, any> = useStore();

const props = defineProps({
  showComponent: {
    default: false
  },
  skipValidation: {
    type: Boolean,
    default: false
  }
});

const state = reactive({
  model: {
    question_type: '',
    question: '',
    override_question: null,
    expire_acknowledgement_time: '',
    choices: [{ title: '' }, { title: '' }],
    sla_name: '',
    template: '',
    selectedRadio: 'new',
    acknowledgement_type_id: null
  } as Record<string, any>,
  slas: []
});

const threatAssessFormRef = ref();

const validate = computed(
  () => store.getters['alertCreate/getFormValid']?.additional?.validate || false
);

const slas = computed(() => store.getters['alertCreate/getAlertFormListData']['slas-list'] || []);

const threatAssessmentTemplates = computed(
  () => store.getters['alertCreate/getAlertFormListData']['templates'] || []
);

const threatAssessment = computed(
  () => store.getters['alertCreate/getAlertFormData']['acknowledgement_type_data'] || {}
);

const displayThreatAssessment = computed(
  () => state.model.selectedRadio === 'new' || !!state.model.template
);

const activeCategoryData = computed(
  () => store.getters['alertCreate/getAlertFormListData']['active-category'] || {}
);

const isEventsVisible = computed(() => activeCategoryData.value?.category_code === 'event');

const addReference = () => {
  state.model.choices.push({
    title: ''
  });
};

const updateUrl = (idx: number, value: string) => {
  state.model.choices[idx].title = value;
  updateStore();
};

const removeReference = (targetIndex: number) => {
  state.model.choices.splice(targetIndex, 1);
  updateStore();
};

const updateTemplate = (template: any) => {
  if (!template) {
    state.model.acknowledgement_type_id = null;
  }
  state.model.acknowledgement_type_id =
    state.model.selectedRadio === 'template' ? template.id : null;
  state.model = { ...state.model, ...template };
  updateStore();
};

const updateThreatAssessmentType = (type: any) => {
  resetFields();
  state.model.selectedRadio = type;
  threatAssessFormRef.value.clearValidate();
  updateStore();
};

const resetFields = () => {
  state.model = {
    ...state.model,
    question_type: '',
    question: '',
    override_question: null,
    choices: [{ title: '' }, { title: '' }],
    template: ''
  };
};

const updateSlaModel = (obj: any) => {
  if (!obj) updateAckTypeData(obj);
  else {
    const { name: sla_name, sla_1 = null, sla_2 = null, sla_3 = null } = obj;
    updateAckTypeData({ sla_name, sla_1, sla_2, sla_3 });
  }
};

const updateAckTypeData = (sla: any) => {
  if (!sla) {
    const { sla_name, sla_1, sla_2, sla_3, ...rest } = state.model;
    state.model = { ...rest };
  } else {
    state.model = { ...state.model, ...sla };
  }
  updateStore();
};

const setInitValues = () => {
  if (!isEmpty(threatAssessment.value)) {
    state.model = threatAssessment.value;
    state.model.selectedRadio = threatAssessment.value.acknowledgement_type_id ? 'template' : 'new';
    state.model.template = threatAssessmentTemplates.value.find(
      (item: { id: any }) => item.id === threatAssessment.value?.acknowledgement_type_id
    );
  }
  if (state.model.expire_acknowledgement_time === 0) state.model.expire_acknowledgement_time = '';
  updateStore();
};

function validateAssessmentForm() {
  threatAssessFormRef.value?.validate((valid: boolean) => {
    store.dispatch('alertCreate/setFormValid', {
      additional: { 'threat-assessment': valid }
    });
  });
}

async function validateField(key: string) {
  try {
    await threatAssessFormRef.value?.validateField(key);
  } catch {
    //
  }
}

const getRules = (rule: any) => {
  return !props.skipValidation ? rule : [];
};

const draggedItem = ref<number | null>(null);

const handleDragStart = (index: number) => {
  draggedItem.value = index;
};

const handleDragOver = (event: Event) => {
  event.preventDefault();
};

const handleDrop = (index: number, event: Event) => {
  event.preventDefault();

  if (draggedItem.value === null) return;

  const draggedIndex = draggedItem.value;
  if (draggedIndex === index) return;

  const draggedItemCopy = state.model.choices[draggedIndex];
  state.model.choices.splice(draggedIndex, 1);
  state.model.choices.splice(index, 0, draggedItemCopy);
};

function updateStore() {
  const data = { ...state.model };
  if (data.expire_acknowledgement_time === '') data.expire_acknowledgement_time = 0;
  updateAlertFormStore('acknowledgement_type_data', data);
}

function updateType() {
  state.model.choices = [{ title: '' }, { title: '' }];
  validateField('question_type');
  updateStore();
}

onMounted(async () => {
  if (!slas.value?.length) {
    fetchSlas();
  }
  if (!threatAssessmentTemplates.value?.length) {
    await fetchThreatAssessmentTemplates();
  }
  nextTick(() => setInitValues());
});

watch(
  () => validate.value,
  (val) => {
    if (val && props.showComponent) validateAssessmentForm();
  },
  { deep: true }
);

watch(
  () => props.showComponent,
  (val) => {
    if (!val) {
      resetFields();
      state.model.expire_acknowledgement_time = '';
      state.model.sla_name = '';
      state.model.selectedRadio = 'new';
      updateStore();
    }
  }
);
</script>

<template>
  <el-form
    @submit.prevent
    ref="threatAssessFormRef"
    :model="state.model"
    :rules="getRules(THREAT_ASSESSMENT($t))"
  >
    <div class="cyw-flex-row cyw-mb-4">
      <CyRadio
        v-for="option in THREAT_ASSESSMENT_RADIO_OPTIONS($t)"
        v-bind="testId(`${option.key}`)"
        class="cyw-mr-5"
        :key="option.key"
        :label="option.label"
        :option="true"
        :disabled="isEventsVisible"
        :modelValue="state.model.selectedRadio === option.key"
        @update:modelValue="updateThreatAssessmentType(option.key)"
      />
    </div>
    <el-form-item
      v-if="state.model.selectedRadio === 'template'"
      prop="template"
      class="cyw-mb-4 cyw-w-50"
      v-bind="testId('template-form-item')"
    >
      <CySelect
        size="md"
        :label="`${$t('alerts.form-interactions.select-template')} *`"
        :floatLabel="false"
        searchIdentifier="acknowledgement_type_name"
        valueIdentifier="acknowledgement_type_name"
        v-bind="testId('template')"
        :data="threatAssessmentTemplates"
        :disabled="isEventsVisible"
        v-model="state.model.template"
        @update:modelValue="updateTemplate"
      />
    </el-form-item>
    <div
      v-if="displayThreatAssessment"
      class="cyw-bg-N50 cyw-round-lg cyw-p-4 cyw-color-N700 cyw-mb-3"
    >
      <el-form-item prop="question_type" class="cyw-mb-4" v-bind="testId('question-type-form-item')">
        <CySelect
          size="md"
          class="cyw-w-50"
          :placeholder="$t('alerts.form-interactions.question-type-1')"
          :floatLabel="false"
          searchIdentifier="label"
          valueIdentifier="label"
          identifier="key"
          :label="`${$t('alerts.form-interactions.question-type-1')} *`"
          :data="QUESTION_TYPE($t)"
          v-bind="testId('question-type')"
          :isValueKey="true"
          :disabled="isEventsVisible"
          v-model="state.model.question_type"
          @update:modelValue="updateType"
        />
      </el-form-item>
      <el-form-item class="cyw-mb-3" prop="question" v-bind="testId('title-form-item')">
        <CyInput
          size="md"
          :label="` ${$t('alerts.responses.threat-assessment-title')} *`"
          v-bind="testId('title')"
          threat-assessment
          :maxlength="100"
          :showCount="true"
          :disabled="isEventsVisible"
          v-model="state.model.question"
          @update:modelValue="
            updateStore();
            validateField('question');
          "
        />
      </el-form-item>
      <div v-if="state.model.question_type === 'SINGLE-SELECT'">
        <div
          v-for="(item, index) in state.model.choices"
          :key="index"
          class="cyw-flex-align-center cyw-mt-4 cyw-ml-4"
          @dragstart="handleDragStart(index)"
          @dragover="handleDragOver"
          @drop="handleDrop(index, $event)"
          draggable="true"
        >
          <el-form-item
            class="cyw-w-100 cyw-mb-2"
            :prop="`choices.${index}.title`"
            :rules="getRules(THREAT_ASSESSMENT_OPTION($t))"
            v-bind="testId(`options-${index}-form-item`)"
          >
            <div class="cyw-flex" v-bind="testId(`drag-and-drop-option-${index}`)">
              <CyIcon
                icon="fa-light fa-grip-dots-vertical"
                class="cyw-color-N500 cyw-mr-3 cyw-mt-5 cyw-pt-3"
              />
              <CyInput
                class="cyw-w-100"
                size="md"
                label=" "
                :maxlength="100"
                :showCount="true"
                v-bind="testId(`options-${index}`)"
                :disabled="isEventsVisible"
                :modelValue="item.title"
                @update:modelValue="
                  updateUrl(index, $event);
                  validateField(`choices.${index}.title`);
                "
              />
            </div>
          </el-form-item>
          <CyIconShell
            size="md"
            class="cyw-mx-3 cyw-mb-1 cyw-mx-4 cyw-mt-4"
            v-bind="testId(`remove-${index}`)"
            @click="removeReference(index)"
            :disabled="state.model.choices?.length <= 2 || isEventsVisible"
          >
            <CyIcon icon="fa-light fa-circle-minus" />
          </CyIconShell>
        </div>
        <div class="cyw-mt-4 cyw-flex-start cyw-w-auto">
          <cy-tooltip
            v-bind="testId('tooltip')"
            :disabled="state.model.choices?.length !== 5"
            :content="$t('alerts.tooltips.threat-assessment-add-more')"
            placement="top"
          >
            <div>
              <CyButton
                type="tertiary"
                v-bind="testId('add')"
                @click="addReference"
                :disabled="state.model.choices?.length === 5"
              >
                <CyIcon icon="fa-solid fa-plus" />
                {{ $t('alerts.form-interactions.threat-assessment-add-more') }}
              </CyButton>
            </div>
          </cy-tooltip>
        </div>
      </div>
    </div>
    <div class="cyw-flex-col cyw-mt-4 cyw-color-N700">
      <div class="cyw-mb-2 cyw-flex" v-bind="testId('expiry')">
        {{ ` ${$t('alerts.responses.threat-assessment-expiry')} *` }}
        <cy-tooltip placement="top" :content="$t('alerts.threat-assessment.expiry-tooltip')">
          <CyIcon
            icon="fa-duotone fa-solid fa-circle-question"
            class="cyw-text-f14 cyw-mt-2 cyw-ml-2 cyw-color-N400"
          />
        </cy-tooltip>
      </div>
      <el-form-item prop="expire_acknowledgement_time" v-bind="testId('expire-ack-time-form-item')">
        <el-date-picker
          v-model="state.model.expire_acknowledgement_time"
          @update:modelValue="
            updateAlertFormStore('acknowledgement_type_data', state.model);
            validateField('expire_acknowledgement_time');
          "
          format="MMM DD, YYYY HH:mm"
          timeFormat="HH:mm"
          dateFormat="MMM DD, YYYY"
          class="ca-date-picker cyw-bg-P100"
          value-format="X"
          type="datetime"
          :disabled-date="(date: Date) =>
                date < new Date(new Date().setDate(new Date().getDate() - 1))"
          placeholder="Select date and time"
          :disabled="isEventsVisible"
          :teleported="false"
          placement="top"
          v-bind="testId('expire-ack-time')"
        />
      </el-form-item>
    </div>
    <div v-if="isPermittedToMe('view', 'sla')" class="cyw-mt-4 cyw-color-N700 cyw-flex">
      <div class="cyw-w-50">
        <CySelect
          size="md"
          class="cyw-m-0"
          :label="true"
          :placeholder="$t('alerts.alert-form.select-placeholder')"
          :floatLabel="false"
          searchIdentifier="name"
          valueIdentifier="name"
          identifier="name"
          :data="slas"
          v-bind="testId('sla')"
          :disabled="isEventsVisible"
          v-model="state.model.sla_name"
          @update:modelValue="updateSlaModel"
        >
          <template #label>
            <label class="cyw-text-f14 cyw-mr-1">
              {{ $t('alerts.form-interactions.sla-1') }}
            </label>
            <CyTooltip
              content="Send reminders to members for responding to threat assessments"
              v-bind="testId('reminder-tooltip')"
            >
              <CyIcon
                icon="fa-duotone fa-solid fa-circle-question"
                class="cyw-text-f14 cyw-mt-2 cyw-color-N400"
              >
              </CyIcon>
            </CyTooltip>
          </template>
        </CySelect>
      </div>
      <div
        v-if="state.model.sla_name"
        class="cyw-flex-justify-around cyw-flex-align-end cyw-w-50 cyw-mx-4"
      >
        <div v-for="(sla, index) in SLA_MAP($t)" :key="index">
          <div>
            {{ sla.label }}
          </div>
          <div class="cyw-text-medium cyw-color-N800">
            {{ `${state.model[sla.key]} mins` }}
          </div>
        </div>
      </div>
    </div>
  </el-form>
</template>

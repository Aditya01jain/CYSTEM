<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { useStore } from '@/store';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import EnduserVisible from './EnduserVisible.vue';
import EditorWithReference from '../EditorWithReference.vue'
import { initTestId } from '@/utils/testid';
import { useI18n } from 'vue-i18n';

const { t: $t }: any = useI18n();

const testId = initTestId('ac', 'category-field');

const { updateAlertFormStore } = useAlertBasicsData();
const { isPermittedToMe, isFieldAccessableToMe } = useCommonData();

const store: Record<string, any> = useStore();

const emit = defineEmits(['update:rules', 'validate:field']);

const props = defineProps({
  skipValidation: { type: Boolean, default: false }
});

const state = reactive({
  model: {} as Record<string, any>,
  inputDefanged: {} as Record<string, any>
});

const getActiveCategory = computed(
  () => store.getters['alertCreate/getAlertFormListData']['active-category'] || {}
);

const getAnalysisFieldMap = computed(
  () => store.getters['alertCreate/getAlertFormListData']['analysis-field-map'] || {}
);

const requiredFields = computed(() => getActiveCategory.value?.required_fields || []);

const isEndUserFieldVisible = computed(
  () =>
    isPermittedToMe('view', 'analysis_settings') &&
    isFieldAccessableToMe('analysis-field-publish-to-enduser')
);

const endUserVisibleFields = computed(
  () => store.getters['alertCreate/getAlertFormData']['alert_end_user_visible_fields'] || []
);

const getActiveCategoryFields = computed(() => {
  const analysisFields =
    getActiveCategory.value?.use_analysis_fields?.filter(
      ({ field_type }) => field_type !== 'tag'
    ) || [];
  return analysisFields.map((field: Record<string, any>) => {
    return {
      ...field,
      required: requiredFields.value.some((reqField: any) => reqField.field_id === field.field_id)
    };
  });
});

const isFieldVisible = (field: Record<string, any>) => {
  return !!endUserVisibleFields.value.some((item: string) => item === field.field_id);
};

const updateEndUserVisibleField = (field: any, add = true) => {
  if (add) {
    const fields = endUserVisibleFields.value || [];
    fields.push(field.field_id);
    updateAlertFormStore('alert_end_user_visible_fields', [...fields]);
  } else {
    const findIndex = endUserVisibleFields.value.findIndex(
      (item: string) => item === field.field_id
    );
    const fields = endUserVisibleFields.value;
    fields.splice(findIndex, 1);
    updateAlertFormStore('alert_end_user_visible_fields', fields);
  }
};

const isSelectType = (field: Record<string, any>) => {
  return ['single-select', 'multi-select'].includes(field.field_type);
};

const getFieldKey = (field: Record<string, any>) => {
  return field.is_custom
    ? 'custom_fields'
    : isSelectType(field) || field.field_type === 'pair'
    ? field.field_name
    : 'optional_fields';
};

const getFieldProps = (field: Record<string, any>) => {
  return field.is_custom
    ? 'custom_fields.' + field.field_name
    : isSelectType(field) || field.field_type === 'pair'
    ? field.field_name
    : 'optional_fields.' + field.field_name;
};

const updateValue = (field: Record<string, any>, value: any) => {
  state.model[field.field_name] = value;
  const fieldKey = getFieldKey(field);
  const previousValues = store.getters['alertCreate/getAlertFormData'][fieldKey];
  if (field.is_custom) {
    updateAlertFormStore('custom_fields', {
      ...previousValues,
      ...(state.inputDefanged[field.field_id] !== undefined
        ? { [`is_${[field.field_name]}_defanged`]: state.inputDefanged[field.field_id] }
        : {}),
      [field.field_name]: value
    });
    emit('validate:field', `${fieldKey}.${field.field_name}`);
  } else {
    if (fieldKey === 'optional_fields') {
      updateAlertFormStore(fieldKey, {
        ...previousValues,
        ...(state.inputDefanged[field.field_id] !== undefined
          ? { [`is_${[field.field_name]}_defanged`]: state.inputDefanged[field.field_id] }
          : {}),
        [field.field_name]: value
      });
      emit('validate:field', `${fieldKey}.${field.field_name}`);
    } else {
      if (state.inputDefanged[field.field_id] !== undefined) {
        updateAlertFormStore(
          `is_${[field.field_name]}_defanged`,
          state.inputDefanged[field.field_id]
        );
      }
      updateAlertFormStore(fieldKey, value);
      const optionalFields = store.getters['alertCreate/getAlertFormData']['optional_fields'];
      if (!optionalFields) updateAlertFormStore('optional_fields', {});
      emit('validate:field', `${field.field_name}`);
    }
  }
};

const setCategoryFieldRules = () => {
  if (requiredFields.value.length === 0) {
    emit('update:rules', {});
    return;
  }
  const rules = requiredFields.value.reduce(
    (acc: Record<string, any>, field: Record<string, any>) => {
      if (field.field_type === 'pair') return {};
      const key = field.field_type === 'tag' ? 'card_tag' : getFieldProps(field);
      acc[key] = [
        {
          required: true,
          message: $t('alerts.validations.this-field-is-required-1'),
          trigger: 'blur'
        }
      ];
      return acc;
    },
    {}
  );
  emit('update:rules', rules);
  //
};

const updateEndUserFields = () => {
  if (!isEndUserFieldVisible.value) return;
  const { short_id, copied_short_id, alert_template_id, alert_end_user_visible_fields } =
    store.getters['alertCreate/getAlertFormData'];
  const end_user_visible_fields = getActiveCategory.value?.end_user_visible_fields || [];
  updateAlertFormStore(
    'alert_end_user_visible_fields',
    !!((short_id || copied_short_id || alert_template_id) && alert_end_user_visible_fields.length)
      ? alert_end_user_visible_fields
      : end_user_visible_fields.map((field: any) => field.field_id)
  );
};
onMounted(() => {
  setCategoryFieldRules();
  updateEndUserFields();
  state.model = {
    ...store.getters['alertCreate/getAlertFormData'],
    ...store.getters['alertCreate/getAlertFormData']?.optional_fields,
    ...store.getters['alertCreate/getAlertFormData']?.custom_fields
  };
  getActiveCategoryFields.value.forEach((field: Record<string, any>) => {
    if (['boolean', 'check_box'].includes(field.field_type)) {
      state.model[field.field_name] = state.model[field.field_name] || false;
      updateValue(field, state.model[field.field_name]);
    }
  });
});
</script>

<template>
  <div v-for="field in getActiveCategoryFields" :key="field.field_id">
    <div v-if="field.field_type === 'text-box'" class="cyw-w-100 cyw-flex">
      <div class="cyw-w-100">
        <EditorWithReference
          class="cyw-mt-0 cyw-flex-grow-1"
          :name="getFieldProps(field)"
          :label="`${field.field_label} ${field.required ? '*' : ''}`"
          :modelValue="state.model[field.field_name]"
          :modelKeyCategory="field"
          :modelKey="getFieldKey(field)"
          :data-testid="`alertform-${field.field_name}`"
          :wrapperConfig="{
            prop: getFieldProps(field),
            class: 'cyw-mb-5 csp-input-editor-wrapper'
          }"
          v-bind="testId(field.field_name)"
          @is-defanged="state.inputDefanged[field.field_id] = $event"
          @update:modelValue="updateValue(field, $event)"
        />
      </div>
      <EnduserVisible
        v-if="isEndUserFieldVisible"
        class="cyw-mt-4"
        v-bind="testId(field.field_name)"
        :isFieldVisible="isFieldVisible(field)"
        @update="updateEndUserVisibleField(field, $event)"
      />
    </div>
    <el-form-item
      v-else
      :prop="getFieldProps(field)"
      class="cyw-mb-5 csp-input-editor-wrapper"
      v-bind="testId(`${field.field_name}-form-item`)"
    >
      <div
        v-if="isSelectType(field)"
        :class="`${field.field_type === 'single-select' ? 'cyw-w-50' : 'cyw-w-100'}`"
      >
        <CyExpandableTitle
          :hideCopy="true"
          :value="`${field.field_label} ${field.required ? '*' : ''}`"
          v-bind="testId(`${field.field_name}-label`)"
          class="cyw-mw-100 cyw-color-N700 cyw-text-f12 cyw-text-medium"
        />
        <div class="cyw-flex-align-start">
          <CySelect
            v-bind="testId(field.field_name)"
            class="cyw-select-menu cyw-flex-grow-1"
            :multiple="field.field_type === 'multi-select'"
            :showSearch="true"
            :name="field.is_custom ? `${getFieldKey(field)}.${field.field_name}` : field.field_name"
            :searchIdentifier="field.field_name + '_name'"
            :valueIdentifier="field.field_name + '_name'"
            :identifier="field.field_name + '_id'"
            :data="getAnalysisFieldMap[field.field_name]"
            :modelValue="state.model[field.field_name]"
            size="md"
            @update:modelValue="updateValue(field, $event)"
          >
          </CySelect>
          <EnduserVisible
            v-if="isEndUserFieldVisible"
            class="cyw-mt-2"
            v-bind="testId(field.field_name)"
            :isFieldVisible="isFieldVisible(field)"
            @update="updateEndUserVisibleField(field, $event)"
          />
        </div>
      </div>
      <div v-else-if="field.field_type === 'pair'" class="cyw-w-100 cyw-flex-align-start">
        <tactic-technique-pair
          class="cyw-flex-grow-1"
          :required="field.required"
          :selected-pairs="
            state.model[field.field_name]?.length ? state.model[field.field_name] : [{}]
          "
          v-bind="testId(field.field_name)"
          :skipValidation="props.skipValidation"
          @selected-pairs="updateValue(field, $event)"
          @validate:field="emit('validate:field', $event)"
        />
        <EnduserVisible
          v-if="isEndUserFieldVisible"
          class="cyw-mt-1"
          v-bind="testId(field.field_name)"
          :isFieldVisible="isFieldVisible(field)"
          @update="updateEndUserVisibleField(field, $event)"
        />
      </div>
      <div v-else-if="['date', 'datetime'].includes(field.field_type)" class="cyw-w-100">
        <label
          class="cyw-color-N700 cyw-text-f12 cyw-text-medium"
          v-bind="testId(`${field.field_name}-label`)"
          >{{ `${field.field_label} ${field.required ? '*' : ''}` }}</label
        >
        <div class="cyw-w-100 cyw-flex-align-start">
          <el-date-picker
            :placeholder="`${field.field_label} ${field.required ? '*' : ''}`"
            :modelValue="state.model[field.field_name]"
            class="ca-date-picker cyw-bg-P100"
            type="date"
            size="large"
            v-bind="testId(field.field_name)"
            :clearable="false"
            :teleported="false"
            format="MMM DD, YYYY"
            value-format="X"
            popper-class="ca-date-picker__popper"
            @update:modelValue="updateValue(field, $event)"
          />
          <EnduserVisible
            v-if="isEndUserFieldVisible"
            class="cyw-mt-1"
            v-bind="testId(field.field_name)"
            :isFieldVisible="isFieldVisible(field)"
            @update="updateEndUserVisibleField(field, $event)"
          />
        </div>
      </div>
      <div v-else-if="['boolean', 'check_box'].includes(field.field_type)" class="cyw-w-50">
        <div class="cyw-w-100 cyw-flex-align-start cyw-flex-justify-between">
          <div class="cyw-flex-center">
            <CyCheckbox
              size="md"
              :modelValue="state.model[field.field_name]"
              v-bind="testId(field.field_name)"
              @update:modelValue="updateValue(field, $event)"
            />
            <label
              class="cyw-color-N700 cyw-ml-3 cyw-text-f12 cyw-text-medium"
              v-bind="testId(`${field.field_name}-label`)"
              >{{ `${field.field_label} ${field.required ? '*' : ''}` }}</label
            >
          </div>
          <EnduserVisible
            v-if="isEndUserFieldVisible"
            class="cyw-mt-1"
            v-bind="testId(field.field_name)"
            :isFieldVisible="isFieldVisible(field)"
            @update="updateEndUserVisibleField(field, $event)"
          />
        </div>
      </div>
      <div v-else class="cyw-w-100 cyw-flex-align-center">
        <CyInput
          class="cyw-flex-grow-1"
          :modelValue="state.model[field.field_name]"
          :name="field.is_custom ? `${getFieldKey(field)}.${field.field_name}` : field.field_name"
          :label="`${field.field_label} ${field.required ? '*' : ''}`"
          v-bind="testId(field.field_name)"
          :type="field.field_type"
          size="md"
          @update:modelValue="updateValue(field, $event)"
        >
        </CyInput>
        <EnduserVisible
          v-if="isEndUserFieldVisible"
          class="cyw-mt-4"
          v-bind="testId(field.field_name)"
          :isFieldVisible="isFieldVisible(field)"
          @update="updateEndUserVisibleField(field, $event)"
        />
      </div>
    </el-form-item>
  </div>
</template>

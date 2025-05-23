<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useStore } from '@/store';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { RECOMMENDED_ACTION_MODEL } from './config';
import { useI18n } from 'vue-i18n';
import { isEmpty } from 'lodash';
import { RECOMMEND_TITLE_RULE, RECOMMEND_DESC_RULE } from './rules';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'recommended-action');
const { t: $t }: any = useI18n();
const { updateAlertFormStore } = useAlertBasicsData();
const store: Record<string, any> = useStore();
const props = defineProps({
  showComponent: {
    type: Boolean
  },
  skipValidation: {
    type: Boolean,
    default: false
  }
});

const state = reactive({
  model: {
    recommended_actions: []
  } as Record<string, any>
});

const recommendForm = ref();

const validate = computed(
  () => store.getters['alertCreate/getFormValid']?.additional?.validate || false
);

const recommendedActions = computed(() => {
  return store.getters['alertCreate/getAlertFormData']['recommended_actions'] || {};
});

const activeCategoryData = computed(
  () => store.getters['alertCreate/getAlertFormListData']['active-category'] || {}
);

const isEventsVisible = computed(() => activeCategoryData.value?.category_code === 'event');

const addAction = () => {
  state.model.recommended_actions.push({ ...RECOMMENDED_ACTION_MODEL });
};

const updateAction = (idx: number, key: string, value: string) => {
  state.model.recommended_actions[idx][key] = value;
  validateField(`${idx}.${key}`);
  updateValue('recommended_actions', state.model.recommended_actions);
};

const removeAction = (targetIndex: number) => {
  state.model.recommended_actions.splice(targetIndex, 1);
  updateValue('recommended_actions', state.model.recommended_actions);
};

const updateValue = (key: string, value: any) => {
  updateAlertFormStore(key, value);
};

const getRules = (rule: any) => {
  return !props.skipValidation ? rule : [];
};

async function validateField(key: string) {
  try {
    await recommendForm.value?.validateField(key);
  } catch {
    //
  }
}

const setInitValues = () => {
  if (!isEmpty(recommendedActions.value)) {
    state.model.recommended_actions = [...recommendedActions.value];
  } else {
    state.model.recommended_actions = [{ ...RECOMMENDED_ACTION_MODEL }];
  }
};

onMounted(() => {
  setInitValues();
});

watch(
  () => validate.value,
  (val) => {
    if (val && props.showComponent)
      recommendForm.value?.validate((valid: any) => {
        store.dispatch('alertCreate/setFormValid', {
          additional: { 'recommended-actions': valid }
        });
      });
  }
);
</script>

<template>
  <el-form @submit.prevent ref="recommendForm" :model="state.model.recommended_actions">
    <div v-for="(action, index) in state.model.recommended_actions" :key="index" class="cyw-flex">
      <div class="cyw-bg-N100 cyw-color-N700 cyw-w-100 cyw-p-4 cyw-mb-4 cyw-round-lg cyw-mr-4">
        <el-form-item
          class="cyw-mb-5"
          :key="index"
          :prop="`${index}.title`"
          :rules="getRules(RECOMMEND_TITLE_RULE($t))"
          v-bind="testId(`title-${index}-form-item`)"
        >
          <CyInput
            :modelValue="action.title"
            v-bind="testId(`title-${index}`)"
            :label="`${$t('alerts.listing-page.title-column')} *`"
            :name="`${index}.title`"
            :required="true"
            :maxlength="150"
            :showCount="true"
            type="text"
            :disabled="isEventsVisible"
            @update:modelValue="updateAction(index, 'title', $event)"
          >
          </CyInput>
        </el-form-item>
        <EditorWithReference
          :key="index"
          class="cyw-mt-0"
          :disableComment="!action?.id"
          modelKey="recommended_actions"
          v-bind="testId(`description-${index}`)"
          :name="`${index}.description`"
          :label="`${$t('alerts.form-interactions.description')} *`"
          :required="true"
          :disabled="isEventsVisible"
          :modelValue="action.description"
          :modelIndex="index"
          :maxlength="500"
          :showFangDefang="false"
          :wrapperConfig="{
            prop: `${index}.description`,
            rules: getRules(RECOMMEND_DESC_RULE($t)),
            class:'csp-input-editor-wrapper'
          }"
          @update:modelValue="updateAction(index, 'description', $event)"
        />
      </div>
      <div class="cyw-flex-start-center">
        <CyIconShell
          size="lg"
          v-bind="testId(`remove-${index}`)"
          @click="removeAction(index)"
          :class="{
            'cyw-pointer-events': state.model.recommended_actions.length === 1
          }"
          :disabled="state.model.recommended_actions.length === 1 || isEventsVisible"
        >
          <CyIcon icon="fa-regular fa-circle-minus" />
        </CyIconShell>
      </div>
    </div>
  </el-form>
  <div v-if="state.model.recommended_actions?.length < 5" class="cyw-mt-3">
    <CyButton
      type="tertiary"
      v-bind="testId('add')"
      @click="addAction"
      :disabled="
        !state.model.recommended_actions?.[state.model.recommended_actions?.length - 1]?.title ||
        isEventsVisible
      "
    >
      <CyIcon icon="fa-solid fa-plus" />
      {{ $t('alerts.irs-added-listing.add-more-button') }}
    </CyButton>
  </div>
</template>

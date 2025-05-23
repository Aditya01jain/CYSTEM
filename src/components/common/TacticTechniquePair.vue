<script setup lang="ts">
import { onMounted, reactive, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { initTestId } from '@/utils/testid';

const { t: $t } = useI18n();
const { fetchAttackMatrix, fetchAttackTactic, fetchAttackSubTechnique } = useAlertBasicsData();

const props = defineProps({
  selectedPairs: {
    default: [{}]
  },
  required: {
    type: Boolean,
    default: false
  },
  skipValidation: {
    type: Boolean,
    default: false
  },
  dataTestid: {
    type: String,
    default: ''
  }
});
const testId = initTestId(props.dataTestid);
const emit = defineEmits(['selectedPairs', 'validate:field']);

const keys = ['attack_tactic', 'attack_technique'];

const state = reactive({
  matrixData: [],
  tacticData: {} as Record<string, any>,
  model: [{}] as Record<string, any>,
  matrix: [] as Record<string, any>[],
  subTechData: [] as Record<string, any>[],
  techniques: [] as Record<string, any>[],
  activeItems: ['mitre-technique']
});

const accRef = ref();

async function fetchSubTechnique(index: number) {
  const data = await fetchAttackSubTechnique(
    state.model[index]['attack_tactic'].mitre_id,
    state.model[index]['attack_technique'].mitre_id
  );
  state.subTechData[index] = data;
}

const requiredRule = computed(() => {
  if (props.required && !props.skipValidation)
    return {
      required: true,
      message: $t('alerts.error-message.empty-mitre-attack'),
      trigger: 'blur',
      validator: (rule: any, value: any, callback: Function) => {
        if (!value || Object.keys(value).length === 0) {
          if (!state.activeItems.includes('mitre-technique')) {
            accRef.value.handleItemClick('mitre-technique');
          }
          callback(new Error($t('alerts.error-message.empty-mitre-attack')));
        } else {
          callback(); // Validation passed
        }
      }
    };
  return [];
});

const matrixChange = (index: number) => {
  state.model[index] = {};
  state.techniques[index] = [];
  state.subTechData[index] = [];
};

const onChange = (index: number, idx: number, key: string, value: any) => {
  for (let i = index + 1; i < 2 - index; i++) {
    state.model[idx][keys[i]] = '';
  }
  if (value && Array.isArray(value)) {
    state.model[idx][key] = value.map(({ count, ...subTech }) => subTech);
  } else if (value) {
    const { count, technique, has_subtechnique, ...data } = value;
    state.model[idx][key] = data;
    if (index === 0) state.techniques[idx] = technique || [];
    if (index === 1) {
      fetchSubTechnique(idx);
      state.model[idx]['attack_subtechnique'] = [];
    }
  } else {
    state.model[idx][key] = null;
    if (index === 0) state.techniques[idx] = [];
    if (index !== 2) {
      state.model[idx]['attack_subtechnique'] = [];
      state.subTechData[idx] = [];
    }
  }
  emit('selectedPairs', state.model);
  emit('validate:field', `tactic_technique_pairs.${idx}`);
};

const onRemove = (index: number) => {
  state.model.splice(index, 1);
  state.matrix.splice(index, 1);
  state.techniques.splice(index, 1);
  state.subTechData?.splice(index, 1);
  emit('selectedPairs', state.model);
  emit('validate:field', `tactic_technique_pairs.${index}`);
  emit('validate:field', `tactic_technique_pairs.${index}.attack_technique`);
};
const getDisabledOption = (tactic: Record<string, any>) => {
  return (technique: Record<string, any>) =>
    state.model.some(
      (data: any) =>
        data.attack_tactic?.id + data?.attack_technique?.id === tactic?.id + technique?.id
    );
};

function getValidationRules(index: any, field: string, prevField: string) {
  return {
    validator: (rule: any, value: any, callback: Function) => {
      if (!state.model[index][field]?.id && state.model[index][prevField]?.id) {
        if (!state.activeItems.includes('mitre-technique')) {
          accRef.value.handleItemClick('mitre-technique');
        }
        callback(new Error(`Please fill attack technique`));
      } else {
        callback();
      }
    },
    trigger: 'change'
  };
}

onMounted(async () => {
  state.matrixData = await fetchAttackMatrix();
  let matrixPromises: any = [];
  state.matrixData.forEach(async (item: Record<string, any>) => {
    matrixPromises.push(fetchAttackTactic(item.value));
  });

  const data: any = await Promise.allSettled(matrixPromises);
  state.matrixData.forEach((item: Record<string, any>, index: number) => {
    state.tacticData[item.name] = data[index].value;
  });
  state.matrix = props.selectedPairs.map((i: Record<string, any>) => i?.attack_tactic?.domain);
  state.model = props.selectedPairs;

  props.selectedPairs.forEach(async (data: Record<string, any>, index: number) => {
    const targetTactic = state.tacticData[data.attack_tactic?.domain?.name]?.find(
      (tactic: Record<string, any>) => tactic.id === state.model[0]?.attack_tactic?.id
    );
    state.techniques[index] = targetTactic?.technique;
    let currTechnique = state.techniques[index]?.find(
      (technique: Record<string, any>) => technique.mitre_id === data.attack_technique.mitre_id
    );
    if (data.attack_subtechnique?.length || currTechnique?.has_subtechnique) {
      state.subTechData[index] = await fetchAttackSubTechnique(
        data.attack_tactic.mitre_id,
        data.attack_technique.mitre_id
      );
    }
  });
});
</script>
<template>
  <CyAccordion ref="accRef" v-bind="testId()" v-model="state.activeItems">
    <CyAccordionItem
      v-bind="testId()"
      :title="`${$t('alerts.form-interactions.mitre-techniques-title')} ${
        props.required ? '*' : ''
      }`"
      id="mitre-technique"
      name="mitre-technique"
    >
      <div v-for="(item, index) in state.model" :key="index">
        <el-form-item 
          :prop="`tactic_technique_pairs.${index}.attack_tactic`" 
          :rules="requiredRule" 
          v-bind="testId(`tactic-techniques-${index}-form-item`)"
          class="cyw-mb-4"
        >
          <div class="cyw-flex-row cyw-flex-align-center cyw-mb-2">
            <div class="cyw-w-100 cyw-bg-N50 cyw-px-5 cyw-py-4 cyw-round-lg">
              <div class="cyw-flex cyw-mb-3">
                <CySelect
                  class="ca-w-40 cyw-mr-3"
                  label="Matrix"
                  v-model="state.matrix[parseInt(index)]"
                  @update:model-value="matrixChange(parseInt(index))"
                  :data="state.matrixData"
                  v-bind="testId(`${index}-matrix`)"
                  size="md"
                  :placeholder="$t('alerts.alert-form.matrix-placeholder')"
                  showSearch
                  searchIdentifier="name"
                  valueIdentifier="name"
                  identifier="name"
                />
                <CySelect
                  class="ca-w-60"
                  label="Tactic"
                  :modelValue="state.model[index]['attack_tactic']"
                  @update:modelValue="onChange(0, parseInt(index), 'attack_tactic', $event)"
                  :data="state.tacticData[state.matrix[parseInt(index)]?.name]"
                  size="md"
                  v-bind="testId(`${index}-tactic`)"
                  showSearch
                  :placeholder="$t('alerts.alert-form.tactic-placeholder')"
                  searchIdentifier="display_title"
                  valueIdentifier="display_title"
                  identifier="mitre_id"
                />
              </div>
              <el-form-item
                :prop="`tactic_technique_pairs.${index}.attack_technique`"
                :rules="[getValidationRules(index, 'attack_technique', 'attack_tactic')]"
                class="cyw-mt-4"
                v-bind="testId(`${index}-technique-form-item`)"
              >
                <CySelect
                  :label="`${$t('alerts.form-interactions.technique')} ${
                    !!state.model[index]['attack_tactic'] ? '*' : ''
                  }`"
                  :modelValue="state.model[index]['attack_technique']"
                  @update:model-value="
                    onChange(1, parseInt(index), 'attack_technique', $event);
                    emit('validate:field', `tactic_technique_pairs.${index}.attack_technique`);
                  "
                  :data="state.techniques[parseInt(index)]"
                  :disable-option="getDisabledOption(state.model[index]['attack_tactic'])"
                  size="md"
                  v-bind="testId(`${index}-technique`)"
                  :placeholder="$t('alerts.alert-form.technique-placeholder')"
                  showSearch
                  valueIdentifier="display_title"
                  identifier="mitre_id"
                  search-identifier="display_title"
                />
              </el-form-item>

              <CySelect
                v-if="state.subTechData[parseInt(index)]?.length"
                class="cyw-mt-4"
                ref="subTechnique"
                :label="$t('alerts.form-interactions.sub-technique-title')"
                :modelValue="state.model[index]['attack_subtechnique']"
                @update:model-value="onChange(2, parseInt(index), 'attack_subtechnique', $event)"
                :data="state.subTechData[parseInt(index)]"
                multiple
                v-bind="testId(`${index}-subtechnique`)"
                size="md"
                :maxTagCount="1"
                :placeholder="$t('alerts.alerts-form.sub-technique-placeholder')"
                showSearch
                valueIdentifier="display_title"
                searchIdentifier="display_title"
                identifier="mitre_id"
              />
            </div>

            <CyIconShell
              v-if="state.model.length > 1"
              size="md"
              @click="
                matrixChange(parseInt(index));
                onRemove(parseInt(index));
              "
              class="cyw-ml-3"
              v-bind="testId(`${index}-delete-matrix`)"
            >
              <CyIcon icon="fa-regular fa-circle-minus" />
            </CyIconShell>
          </div>
        </el-form-item>
      </div>

      <CyButton
        class="cyw-mt-3"
        type="tertiary"
        :data-testid="`${props.dataTestid}-ttpair-add-more`"
        :disabled="state.model.length >= 50"
        @click="state.model.push({})"
      >
        + {{ $t('alerts.irs-added-listing.add-more-button') }}
      </CyButton>
    </CyAccordionItem>
  </CyAccordion>
</template>
<style lang="scss" scoped>
.ttp-width {
  width: 40%;
}
</style>

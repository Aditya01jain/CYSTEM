<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch, useAttrs } from 'vue';
import { useI18n } from 'vue-i18n';
import store from '@/store';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { ADDITIONAL_INFORMATION_RULE, REQUIRED_RULE } from './additional/rules';
import InputEditor from '@/components/common/InputEditor.vue';
import ReferenceModal from './ReferenceModal.vue';
import { ALERT_STATUS } from '@/components/alertCreate/config';
import { cloneDeep } from 'lodash';
const { fetchReferenceName, updateAlertFormStore, fetchParseUrls } = useAlertBasicsData();

const { t: $t } = useI18n();
const referenceLinkFormRef: any = ref();
const referenceModalRef: Record<string, any> = ref();

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  fangDefangStatus: {
    type: Object,
    default: () => ({})
  },
  dataTestid: {
    type: String,
    default: ''
  },
  wrapperConfig: {
    type: Object,
    default: () => ({})
  },
  showReferenceListing: {
    type: Boolean,
    default: false
  }
})

const $attrs = useAttrs()

const editorRef: any = ref()

const state = reactive({
  model: {} as Record<string, any>,
  references: [
    {
      source_detail_id: '',
      source: {
        source_tld: '',
        source_url_name: ''
      },
      idx: 0,
      url: ''
    }
  ] as Record<string, any>[],
  addNewLink: {} as Record<string, any>
});

const alertFormData = computed(() => store.getters['alertCreate/getAlertFormData']);

const showAddReferences = computed(() => {
  return (
    !alertFormData.value.status ||
    [
      ALERT_STATUS.CREATE,
      ALERT_STATUS.DRAFT,
      ALERT_STATUS.SUBMITTED,
      ALERT_STATUS.REVERTED,
      ALERT_STATUS.SCHEDULED,
      ALERT_STATUS.PUBLISHED
    ].includes(alertFormData.value.status)
  );
});

const getCurrentIndex = computed(() => {
  let currIdx = state.references[state.references?.length - 1]?.idx;
  if (state.references[state.references?.length - 1]?.url) return currIdx + 1;
  return currIdx;
});

const getReferenceList = computed(() => state.references.filter((reference) => reference.url && reference.source.source_url_name))

const addReference = () => {
  const lastIdx = state.references[state.references?.length - 1].idx || 0;
  state.references.push({
    source_detail_id: '',
    source: {
      source_tld: '',
      source_url_name: ''
    },
    idx: lastIdx + 1,
    url: ''
  });
  setTimeout(() => {
    const el = referenceLinkFormRef.value.$el
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, 500)
};

const removeReference = (name: string) => {
  const targetIndex = state.references.findIndex(
    (item: Record<string, any>) => item.source.source_url_name === name
  );
  if (targetIndex !== -1) state.references.splice(targetIndex, 1);
  updateValue('source_urls', state.references);
};

const findIndexByIdx = (idx: number) => {
  const targetIndex = state.references.findIndex((item: Record<string, any>) => item.idx === idx);
  return targetIndex;
};

const updateUrl = (idx: number, value: string) => {
  const targetIndex = findIndexByIdx(idx);
  if (targetIndex !== -1) state.references[targetIndex].url = value;
  validateUrl(idx);
};

const validateUrl = async (index: number) => {
  try {
    await referenceLinkFormRef.value.validateField(`${index}.url`);
  } catch {
    //
  }
};

const updateName = (idx: number, value: string) => {
  const targetIndex = findIndexByIdx(idx);
  if (targetIndex !== -1) state.references[targetIndex].source.source_url_name = value;
};

const fetchNameAndUpdate = async (idx: number) => {
  const targetIndex = findIndexByIdx(idx);
  if (targetIndex === -1) return;
  const data: Record<string, any> = await fetchReferenceName({
    url: state.references[targetIndex].url
  });
  const uniqueName = data.tld ? getUniqueName(data.tld, 0) : data.tld;
  if (!state.references[targetIndex].source.source_url_name)
    state.references[targetIndex].source.source_url_name = uniqueName;
  
  validateReferenceURL();
  const sourceHasUrl = state.references?.filter((source) => source.url);
  updateValue('source_urls', sourceHasUrl); 
};

function getUniqueName(name: string, counter: number = 0) {
  const sourceHasName = state.references?.some(
    (ref: Record<string, any>) => ref.source.source_url_name === name
  );
  if (sourceHasName) {
    counter++;
    name = name.lastIndexOf(' ') !== -1 ? name.split(' ')[0] : name;
    return getUniqueName(name + ' ' + counter, counter);
  }
  return name;
}

const updateValue = (key: string, value: any) => {
  if (key === 'source_urls') {
    value = value.filter((urlObj: Record<string, any>) => urlObj.url);
  }
  updateAlertFormStore(key, value);
};

function createReference() {
  referenceModalRef?.value?.showReferenceModal();
}

onMounted(() => {
  const data = store.getters['alertCreate/getAlertFormData'];
  if (data.source_urls?.length) {
    state.references = data.source_urls;
  }
});

async function validateReferenceURL() {
  const isFormFilled = state.references?.length;
  if (isFormFilled) {
    try {
      await referenceLinkFormRef.value?.validate();
      editorRef.value.validate()
      return true
    } catch {
      return false
    }
  }
  referenceLinkFormRef.value?.clearValidate();
}

function addNewReference(modalRef: Record<string, any>, idx: number) {
  const targetIndex = findIndexByIdx(idx);
  if (targetIndex === -1) {
    state.references.push(modalRef);
    updateValue('source_urls', state.references);
  } else if (!state.references[targetIndex].url) {
    state.references[targetIndex] = modalRef;
    updateValue('source_urls', state.references);
  }
  state.addNewLink = JSON.parse(JSON.stringify(modalRef));
}

const parseUrls = async () => {
  const data = await fetchParseUrls({ content: props.modelValue });
  const nonParsedReferences = state.references.filter(
    (item: Record<string, any>) => item.url && !item?.parsed
  );
  const existedUrls = nonParsedReferences.map((i) => i.url);
  if (data?.length) {
    state.references = [];
    data.forEach((item: Record<string, any>) => {
      if (!existedUrls.includes(item.url)) {
        state.references.push({
          source_detail_id: '',
          source: {
            source_tld: '',
            source_url_name: getUniqueName(item.source.source_url_name)
          },
          idx: state.references?.length - 1,
          url: item.url,
          parsed: true
        });
      }
    });
  }
  state.references = [...state.references, ...nonParsedReferences];
  setTimeout(() => validateReferenceURL(), 500)
  updateValue('source_urls', state.references);
};

watch(() => alertFormData.value.source_urls, (newVal) => {
  if (!newVal?.length) return;
  state.references = cloneDeep(alertFormData.value.source_urls)
})

defineExpose({ validateReferenceURL })
</script>

<template>
  <el-form-item ref="editorRef" v-bind="props.wrapperConfig" :dataTestid="`${props.dataTestid}-form-item`">
    <InputEditor
      ref="editorRef"
      class="cyw-mt-0"
      :modelValue="props.modelValue"
      :fangDefangStatus="props.fangDefangStatus"
      :showAddReferences="showAddReferences"
      :modalReference="state.addNewLink"
      :referencesList="getReferenceList"
      :dataTestid="props.dataTestid"
      v-bind="$attrs"
      @add:reference="createReference()"
      @is-defanged="updateValue('isDefanged', $event)"
      @update:modelValue="$emit('update:modelValue', $event)"
    >
      <template #extra-button>
        <slot name="extra-button"></slot>
        <cy-button
          v-if="props.showReferenceListing"
          class="cyw-ml-3"
          type="secondary"
          :disabled="!props.modelValue"
          :dataTestid="`${props.dataTestid}-parse-reference`"
          @click="parseUrls"
        >
          {{ $t('alerts.form-interactions.parse-reference-urls') }}
        </cy-button>
      </template>
    </InputEditor>
  </el-form-item>

  <div v-if="props.showReferenceListing" class="cyw-bg-N50 cyw-round-lg cyw-p-3 cyw-my-3">
    <div class="cyw-flex">
      <div class="reference__url">{{ $t('alerts.alert-form.reference-url-section') }}</div>
      <div class="reference__name cyw-ml-5">
        {{ $t('alerts.alert-form.reference-name-section') }}
      </div>
    </div>
    <el-form @submit.prevent ref="referenceLinkFormRef" :model="state.references" :scroll-to-error="true" class="reference__form cyw-overflow-y-auto">
      <div
        v-for="(item, index) in state.references"
        :key="item.idx"
        class="cyw-flex cyw-flex-align-center cyw-mb-4"
      >
        <div class="reference__url">
          <el-form-item
            :prop="`${index}.url`"
            :rules="ADDITIONAL_INFORMATION_RULE($t)"
            :dataTestid="`${props.dataTestid}-reference-url-${index}-form-item`"
          >
            <CyInput
              size="md"
              :dataTestid="`${props.dataTestid}-reference-url-${index}`"
              :modelValue="item.url"
              :name="`${index}.url`"
              @update:modelValue="updateUrl(item.idx, $event)"
              @blur="fetchNameAndUpdate(item.idx)"
            />
          </el-form-item>
        </div>
        <div class="reference--name cyw-ml-5 cyw-flex-align-center">
          <el-form-item
            :prop="`${index}.source.source_url_name`"
            :rules="item.url && REQUIRED_RULE($t)"
            :dataTestid="`${props.dataTestid}-reference-url-${index}-form-item`"
          >
            <CyInput
              class="cyw-flex-grow-1"
              size="md"
              :dataTestid="`${props.dataTestid}-reference-name-${index}`"
              :modelValue="item.source.source_url_name"
              @update:modelValue="updateName(item.idx, $event)"
            />
          </el-form-item>
          <CyTooltip :content="$t('alerts.buttons.remove')">
            <CyIconShell
              size="lg"
              class="cyw-mx-3"
              :class="{ 'cyw-cursor-not-allowed': state.references?.length < 2 }"
              :dataTestid="`${props.dataTestid}-remove-reference-${index}`"
              @click="removeReference(item.source.source_url_name)"
              :disabled="state.references?.length < 2"
            >
              <CyIcon icon="fa-regular fa-circle-minus" />
            </CyIconShell>
          </CyTooltip>
        </div>
      </div>
    </el-form>
    <CyButton type="tertiary" :dataTestid="`${props.dataTestid}-add-reference`" @click="addReference()">
      <CyIcon icon="fa-solid fa-plus" />
      {{ $t('alerts.alert-form-step.add-reference-button') }}
    </CyButton>
  </div>
  <ReferenceModal
    ref="referenceModalRef"
    :currentIdx="getCurrentIndex"
    :getUniqueName="getUniqueName"
    @click:addNewReference="addNewReference"
  />
</template>
<style lang="scss">
.reference {
  &__form {
    max-height: 22rem;
  }
  &__url {
    width: 60%;
  }
  &__name {
    width: 36%;
  }
}
</style>

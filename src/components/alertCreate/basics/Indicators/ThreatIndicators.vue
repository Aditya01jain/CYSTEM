<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/store';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import RelatedAlerts from './RelatedAlerts.vue';
import { allIocs, additionalIocs } from '../config';
import { makeFang, validateAndDefang } from '@/utils/fangdefang';
import EditorWithReference from '../../EditorWithReference.vue';
import { isEmpty } from 'lodash';
import { THREAT_INDICATORS_RULE } from '../rules';
import IocWorker from './worker?worker';
import Cookies from '@/services/Cookies';
import { baseUrl } from '@/shared/utils';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'threat-indicators');

const { updateAlertFormStore } =
  useAlertBasicsData();

const { isFieldAccessableToMe } = useCommonData();

const store: Record<string, any> = useStore();
const { t: $t } = useI18n();

const props = defineProps({
  disabled: { type: Boolean, default: false },
  skipValidation: { type: Boolean, default: false }
});

const emit = defineEmits(['validate:field']);

const modalRef = ref();

const BLOCKIOCSMAP = ['csv', 'xml', 'json'];

const OPTIONS = ['View Related Alerts', 'Fang', 'Defang', 'Remove'];

const state = reactive({
  activeTab: 'blacklisted',
  parsing: false,
  model: {
    optional_fields: {
      threat_indicators: '',
      is_threat_indicators_defanged: false
    },
    defang_ioc_in_ioc_attachments: false,
    ioc_export_types: []
  } as Record<string, any>,
  parsedValues: {} as Record<string, any>,
  AlertIndicators: {} as Record<string, any>,
  selectedIoc: '',
  emailSubject: '',
  selectedAdditionalIoc: '',
  showModal: false,
  inputDefanged: false as boolean,
  activeItems: [],
  tooltipProps: { config: { popperHeight: 20 } } as Record<string, any>
});

const worker = ref();

const fieldId = computed(
  () =>
    store.getters['alertCreate/getAlertFormListData']['active-category']?.threat_indicators_field
      ?.field_id
);

const endUserFields = computed(
  () => store.getters['alertCreate/getAlertFormData']?.['alert_end_user_visible_fields']
);

const isThreatIndicatorsRequired = computed(
  () =>
    store.getters['alertCreate/getAlertFormListData']['active-category']?.required_fields
      ?.map((field: Record<string, any>) => field.field_id)
      ?.includes(fieldId.value) &&
    !props.disabled &&
    !props.skipValidation
);

const indicatorTabs = computed(() => [
  {
    id: 'blacklisted',
    title: `Blocked Indicators (${getIndicatorTabLength('blacklisted').length})`
  },
  //
  {
    id: 'whitelisted',
    title: `Allowed Indicators (${getIndicatorTabLength('whitelisted').length})`
  }
]);

const updateAttachIocOptions = (key: string, value: boolean) => {
  if (value) state.model.ioc_export_types.push(key);
  else {
    const index = state.model.ioc_export_types.findIndex((item: string) => item === key);
    state.model.ioc_export_types.splice(index, 1);
  }
  updateAlertFormStore('ioc_export_types', state.model.ioc_export_types);
};

const getIndicatorTabLength = (tabId: string) => {
  return Object.keys(state.parsedValues).reduce((acc: any[], key) => {
    const tabData = state.parsedValues[key]?.[tabId] || [];
    return acc.concat(tabData);
  }, []);
};

const getAllIocs = (tabId: string) => {
  const filteredIocs = [...allIocs, ...additionalIocs].filter(
    (key) => key in state.parsedValues && !!state.parsedValues[key]?.[tabId]?.length
  );
  return filteredIocs;
};

const updateValue = (key: string, value: string | any) => {
  state.model[key] = value;

  updateAlertFormStore(key, value);
};

const clearAddindicators = (closed = false) => {
  if (!closed) modalRef.value.hide();
  state.emailSubject = '';
  state.selectedAdditionalIoc = '';
};

const AddIndicators = () => {
  if (state.emailSubject.trim() === '') {
    clearAddindicators();
    return;
  }

  state.parsedValues[state.selectedAdditionalIoc] =
    state.parsedValues[state.selectedAdditionalIoc] ?? {};
  state.parsedValues[state.selectedAdditionalIoc]['label'] =
    state.selectedAdditionalIoc === 'email_description'
      ? 'Email Description(s)'
      : 'Email Subject(s)';
  state.parsedValues[state.selectedAdditionalIoc]['whitelisted'] = [];

  state.parsedValues[state.selectedAdditionalIoc]['blacklisted'] = state.parsedValues[
    state.selectedAdditionalIoc
  ].blacklisted
    ? [...state.parsedValues[state.selectedAdditionalIoc].blacklisted, state.emailSubject.trim()]
    : [state.emailSubject.trim()];

  clearAddindicators();
};

function getWorkerData(data: Record<string, any>) {
  return new Promise((resolve, reject) => {
    worker.value.postMessage(data);

    worker.value.onmessage = (event: Record<string, any>) => {
      resolve(event.data);
    };

    worker.value.onerror = (error: Error) => {
      reject(error);
    };
  });
}

async function parseIndicators() {
  if (!state.model.optional_fields.threat_indicators) return;
  state.parsing = true;
  let parsedData: Record<string, any> = {};
  const url = `${baseUrl()}/api/admin/parse_indicator/`;
  const token = Cookies.getTokenCookie();
  try {
    const data: any = await getWorkerData({
      url,
      token,
      ioctypes: allIocs,
      payload: state.model.optional_fields.threat_indicators
    });
    Object.values(data).forEach((item: any) => {
      const key = Object.keys(item)[0];
      parsedData[key] = item[key];
    });
    transformIndicatorData(parsedData);
    emit('validate:field', 'threat_indicators');
  } catch (e: any) {
    //
  } finally {
    state.parsing = false;
  }
}

const transformIndicatorData = (data: Record<string, any>) => {
  state.parsedValues = { ...state.parsedValues, ...data };
  updateIndicatorsInStore();
};

function handleOptions(option: string, ioc: string): any {
  const activeData = state.parsedValues[ioc][state.activeTab];
  switch (option) {
    case $t('alerts.options.view-related-alerts'):
      state.showModal = true;
      state.selectedIoc = ioc;
      break;
    case $t('alerts.buttons.fang'):
      activeData.forEach((ioc: string, index: number) => {
        activeData[index] = makeFang(ioc);
      });
      updateIndicatorsInStore();
      break;
    case $t('alerts.alert-form.defang-button'):
      activeData.forEach((ioc: string, index: number) => {
        activeData[index] = validateAndDefang(ioc);
      });
      updateIndicatorsInStore();
      break;
    case $t('alerts.buttons.remove'):
      state.parsedValues[ioc][state.activeTab] = [];
      updateIndicatorsInStore();
      break;
    default:
      break;
  }
}

const showOptions = (option: string, ioc: string): boolean => {
  const isFangOption = ['Fang', 'Defang'].includes(option);
  const isInvalidIoc = !['cidr', 'domain', 'email', 'ip', 'ipv4_cidr', 'ipv6', 'url'].includes(ioc);

  if (isFangOption) {
    return state.activeTab === 'blacklisted' && !isInvalidIoc;
  }

  return true;
};

function onSelectAdditionalIoc(item: string) {
  modalRef.value?.show();
  state.selectedAdditionalIoc = item;
}

function userVisibilityUpdate(event: boolean) {
  if (!fieldId.value) return;
  const data = [...endUserFields.value];

  if (event) {
    if (!data.includes(fieldId.value)) {
      data.push(fieldId.value);
    }
  } else {
    const index = data.indexOf(fieldId.value);
    if (index !== -1) {
      data.splice(index, 1);
    }
  }

  updateAlertFormStore('alert_end_user_visible_fields', data);
}

const updateIndicatorsInStore = () => {
  if (
    !(getIndicatorTabLength('blacklisted').length + getIndicatorTabLength('whitelisted').length)
  ) {
    state.parsedValues = {};
  }
  updateAlertFormStore('threat_indicators', state.parsedValues);
};

const onDelete = (ioc: string, index: number) => {
  state.parsedValues[ioc]?.[state.activeTab]?.splice(index, 1);
  updateIndicatorsInStore();
};

const iocIcon = (ioc: string) => {
  const icon = (() => {
    switch (ioc) {
      case 'email_description':
      case 'email_subject':
        return 'email';

      case 'filepaths':
      case 'directory':
        return 'attack-pattern';

      case 'url':
        return 'url-classic-regular';

      case 'ip':
        return 'ipv4';

      case 'ipv4_cidr':
        return 'cidr';

      case 'mac_addr':
        return 'mac-address';

      case 'windows_registry_key':
        return 'registry-key';

      default:
        return ioc;
    }
  })();

  return `fa-kit fa-${icon}`;
};

onMounted(() => {
  worker.value = import.meta.env.VITE_USER_NODE_ENV === 'development' ? {} : new IocWorker();
  const {
    optional_fields,
    defang_ioc_in_ioc_attachments,
    ioc_export_types,
    is_threat_indicators_defanged,
    threat_indicators
  } = store.getters['alertCreate/getAlertFormData'];
  state.model.optional_fields = optional_fields || {
    threat_indicators: '',
    is_threat_indicators_defanged: false
  };
  state.model.defang_ioc_in_ioc_attachments = defang_ioc_in_ioc_attachments || false;
  state.model.ioc_export_types = ioc_export_types || [];
  state.model.is_threat_indicators_defanged = is_threat_indicators_defanged || false;
  state.parsedValues = threat_indicators || {};
  updateIndicatorsInStore();
});

onBeforeUnmount(() => {
  worker.value?.terminate?.();
});
</script>

<template>
  <CyAccordionItem v-bind="testId()" name="threat_indicators" id="threat_indicators">
    <template #title>
      <div class="cyw-flex-justify-between cyw-flex-align-center cyw-w-100">
        <div class="cyw-flex">
          {{ $t('alerts.alert-form.indicators-section') + (isThreatIndicatorsRequired ? '*' : '') }}
          <cy-tooltip placement="top" v-bind="testId('tooltip')">
            <CyIcon
              icon="fa-duotone fa-solid fa-circle-question"
              class="cyw-text-f14 cyw-mt-2 cyw-ml-2 cyw-color-N400"
              v-bind="testId('info-icon')"
            />
            <template #content>
              <div class="cyw-text-f14 cyw-py-1">
                {{ $t('alerts.tooltips.supported-indicator-types-title') }}
              </div>
              <div class="cyw-text-f12">
                {{ $t('alerts.tooltips.indicator-types-description') }}
              </div>
            </template>
          </cy-tooltip>
        </div>
        <div class="cyw-mr-4">
          <cy-dropdown v-bind="testId('dropdown')" :disabled="props.disabled" size="md">
            <template #dropdown-link>
              <CyButton :disabled="props.disabled" v-bind="testId('add')" type="secondary">
                <CyIcon v-bind="testId('add-icon')" icon="fa-solid fa-plus" />
                {{ $t('alerts.alert-form.add-button') }}
              </CyButton>
            </template>
            <template #dropdown>
              <div class="cyw-overflow-auto cyw-h-100">
                <div v-for="(item, index) in additionalIocs" :key="index">
                  <cy-select-option
                    class="cyw-text-capitalize"
                    v-bind="testId(`${item}`)"
                    @click="onSelectAdditionalIoc(item)"
                  >
                    {{ item.replace('_', ' ') }}
                  </cy-select-option>
                  <hr v-if="index != additionalIocs.length - 1" class="cyw-mx-4" />
                </div>
              </div>
            </template>
          </cy-dropdown>
        </div>
      </div>
    </template>
    <div>
      <div class="cyw-flex-justify-end cyw-color-N700 cyw-mt-3 cyw-text-f12 cyw-flex">
        <enduser-visible
          v-if="isFieldAccessableToMe('analysis-field-publish-to-enduser')"
          :isFieldVisible="endUserFields?.includes(fieldId)"
          :disabled="props.disabled"
          @update="userVisibilityUpdate"
        />
      </div>
      <EditorWithReference
        :key="props.disabled"
        :disabled="props.disabled"
        class="cyw-mt-0"
        modelKey="optional_fields"
        label=""
        :placeholder="$t('alerts.indicators.enter-indicators')"
        v-bind="testId('enter-indicators')"
        :modelValue="state.model.optional_fields?.threat_indicators"
        :modelKeyCategory="{ field_name: 'threat_indicators' }"
        :fangDefangStatus="{
          is_threat_indicators_defanged: state.inputDefanged
        }"
        :wrapperConfig="{
          prop: 'optional_fields.threat_indicators',
          rules: isThreatIndicatorsRequired ? THREAT_INDICATORS_RULE($t) : [],
          class: 'csp-input-editor-wrapper'
        }"
        @is-defanged="state.model.optional_fields.is_threat_indicators_defanged = $event"
        @update:modelValue="
          updateValue('optional_fields', {
            ...store.getters['alertCreate/getAlertFormData']?.optional_fields,
            threat_indicators: $event
          })
        "
      >
        <template #extra-button>
          <CyButton
            :disabled="props.disabled"
            type="secondary"
            class="cyw-ml-2"
            :loading="state.parsing"
            v-bind="testId('parse-indicators')"
            @click="parseIndicators()"
          >
            {{ $t('alerts.indicators.parse-indicators') }}
          </CyButton>
        </template>
      </EditorWithReference>

      <div class="cyw-flex cyw-mt-4">
        <CyCheckbox
          :disabled="props.disabled"
          :modelValue="state.model.defang_ioc_in_ioc_attachments"
          @update:modelValue="updateValue('defang_ioc_in_ioc_attachments', $event)"
          v-bind="testId(`${state.model.defang_ioc_in_ioc_attachments}`)"
        />
        <div class="cyw-ml-3">
          {{ $t('alerts.indicators.defang-indicators-uploaded-in-attachments') }}
        </div>
      </div>
      <div class="cyw-mt-3">
        <div class="cyw-text-semi-bold cyw-text-f14">
          {{ $t('alerts.indicators.attach-blocked-iocs-as') }}
        </div>
        <div class="cyw-flex">
          <div class="cyw-flex cyw-mr-5" v-for="(type, index) in BLOCKIOCSMAP" :key="index">
            <CyCheckbox
              :disabled="props.disabled"
              :modelValue="state.model.ioc_export_types?.includes(type)"
              @update:modelValue="updateAttachIocOptions(type, $event)"
              v-bind="testId(`${type}`)"
            />
            <div class="cyw-ml-3">{{ type.toUpperCase() }}</div>
          </div>
        </div>
      </div>
      <div v-if="Object.keys(state.parsedValues)?.length" class="cyw-mt-5">
        <div class="cyw-flex-justify-between cyw-flex-align-center">
          <CyTab type="line" v-model="state.activeTab" :data="indicatorTabs" v-bind="testId()">
          </CyTab>
          <CyButton
            type="secondary"
            subtype="subtle"
            @click="state.showModal = true"
            v-bind="testId(`related-alerts`)"
          >
            <CyIcon icon="fa-regular fa-memo" class="cyw-mr-3" />
            {{ $t('alerts.options.view-related-alerts') }}
          </CyButton>
        </div>
        <CyAccordion v-model="state.activeItems" class="accordion-border">
          <CyAccordionItem
            iconPlacement="left"
            v-for="(ioc, index) in getAllIocs(state.activeTab)"
            :key="index"
            class="cyw-w-100"
            :name="ioc"
            v-bind="testId(`${ioc}`)"
          >
            <template #title>
              <div
                class="cyw-border-bottom cyw-flex-align-center cyw-flex-justify-between cyw-w-100"
              >
                <div class="cyw-flex-align-center">
                  <CyIcon :icon="iocIcon(ioc)" class="cyw-mr-3 indicators-icon-color" />
                  <div class="cyw-text-f14 cyw-text-semi-bold cyw-py-3">
                    {{ state.parsedValues[ioc]?.label }}
                  </div>
                  <div
                    class="cyw-bg-N200 cyw-px-3 cyw-py-2 cyw-text-f10 cyw-round-circle cyw-text-semi-bold cyw-ml-3"
                  >
                    {{ state.parsedValues[ioc]?.[state.activeTab]?.length }}
                  </div>
                </div>
                <cy-dropdown v-if="state.parsedValues[ioc]?.[state.activeTab]?.length">
                  <template #dropdown-link>
                    <CyIconShell size="md" v-bind="testId('dropdown')">
                      <CyIcon icon="fa-solid fa-ellipsis-vertical" />
                    </CyIconShell>
                  </template>
                  <template #dropdown>
                    <div
                      v-for="(option, index) in OPTIONS"
                      :key="index"
                      class="cyw-text-f14 cyw-color-N900 cyw-mx-3 cyw-cursor-pointer"
                      v-bind="testId(`${option}`)"
                      @click="handleOptions(option, ioc)"
                    >
                      <div v-if="showOptions(option, ioc)">
                        <p class="cyw-flex-justify-center cyw-my-2">{{ option }}</p>
                        <hr v-if="index !== OPTIONS.length - 1" />
                      </div>
                    </div>
                  </template>
                </cy-dropdown>
              </div>
            </template>
            <div class="cyw-ml-5">
              <div v-if="state.parsedValues[ioc]?.[state.activeTab]?.length" class="cyw-text-f12">
                <div
                  class="cyw-flex-justify-between cyw-border-bottom cyw-flex-align-center cyw-my-2"
                  v-for="(item, itemIdx) in state.parsedValues[ioc]?.[state.activeTab]"
                  :key="itemIdx"
                >
                  <CyExpandableTitle :hideCopy="true" :value="item" class="cyw-w-75" :tooltipProps="state.tooltipProps" />
                  <CyTooltip content="Remove">
                    <CyIconShell
                      size="md"
                      class="cyw-mx-3"
                      @click="onDelete(ioc, itemIdx)"
                      v-bind="testId(`delete-${itemIdx}`)"
                    >
                      <CyIcon icon="fa-solid fa-xmark" />
                    </CyIconShell>
                  </CyTooltip>
                </div>
              </div>
              <div v-else class="cyw-text-f12">No {{ state.parsedValues[ioc]?.label }} found</div>
            </div>
          </CyAccordionItem>
        </CyAccordion>
      </div>
    </div>
  </CyAccordionItem>
  <CyModal
    ref="modalRef"
    width="40%"
    noCloseIcon
    noHeader
    :footer="true"
    centered
    @close="clearAddindicators(true)"
    v-bind="testId()"
  >
    <template #modal-content>
      <cy-textarea
        :label="
          state.selectedAdditionalIoc === 'email_description'
            ? 'Email Description *'
            : 'Email Subject *'
        "
        height="25"
        :maxlength="state.selectedAdditionalIoc === 'email_description' ? 1500 : 1000"
        v-bind="testId(`${state.selectedAdditionalIoc}`)"
        v-model="state.emailSubject"
      />
    </template>
    <template #modal-footer>
      <div class="cyw-float-right cyw-mb-3">
        <cy-button type="tertiary" @click="clearAddindicators()" v-bind="testId('cancel')">
          {{ $t('alerts.buttons.cancel') }}</cy-button
        >
        <cy-button
          class="cyw-px-5 cyw-ml-1"
          :disabled="isEmpty(state.emailSubject)"
          @click="AddIndicators"
          v-bind="testId('add')"
        >
          Add Objects
        </cy-button>
      </div>
    </template>
  </CyModal>
  <RelatedAlerts
    :showModal="state.showModal"
    :selectedIoc="state.selectedIoc"
    @close="state.showModal = false"
  />
</template>
<style lang="scss">
.cyw-dropdown-menu--expanded {
  overflow-y: auto !important;
}

.accordion-border {
  .cyw-accordion-item.is-expanded {
    border: none;
  }

  .cyw-accordion-item .cyw-accordion-item__header {
    border: none;
  }
}

.indicators-icon-color {
  color: var(--AQ400);
}
</style>

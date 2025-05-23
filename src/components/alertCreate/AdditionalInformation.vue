<script setup lang="ts">
import { reactive, defineAsyncComponent, computed, onMounted, watch, ref } from 'vue';
import SectionList from '@/components/common/SectionList.vue';
import { useI18n } from 'vue-i18n';
import { ADDITIONAL_SECTION_LIST } from '@/components/alertCreate/config';
import { useCommonData } from '@/composables/useCommonData';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import store from '@/store';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac');
const { isPermittedToMe, isComponentAccessableToMe, isFlagAccessableToTenant } = useCommonData();
const { updateAlertFormStore } = useAlertBasicsData();

const props = defineProps({
  activeSectionItem: {
    default: '',
    type: String
  },
  skipValidation: {
    type: Boolean,
    default: false
  }
});
const { t: $t } = useI18n();

const emit = defineEmits(['highlight:section', 'user:click:section']);

const switchConfirmationRef = ref();
const accRef = ref();

// Dynamically import components using defineAsyncComponent
const state = reactive({
  activeItems: [
    'additional-information',
    'linked-alerts',
    'attachments',
    'intelligence-requirement',
    'threat-defender'
  ] as Array<string>,
  componentMap: {
    'additional-information': defineAsyncComponent(
      () => import('@/components/alertCreate/additional/Information.vue')
    ),
    attachments: defineAsyncComponent(
      () => import('@/components/alertCreate/additional/attachments/Attachments.vue')
    ),
    'linked-alerts': defineAsyncComponent(
      () => import('@/components/alertCreate/additional/LinkedAlerts.vue')
    ),
    'intelligence-requirement': defineAsyncComponent(
      () => import('@/components/alertCreate/additional/IntelligenceRequirement.vue')
    ),
    'threat-assessment': defineAsyncComponent(
      () => import('@/components/alertCreate/additional/ThreatAssessment.vue')
    ),
    'threat-defender': defineAsyncComponent(() => import('./additional/ThreatDefender.vue')),
    'recommended-actions': defineAsyncComponent(
      () => import('@/components/alertCreate/additional/RecommendedActions.vue')
    ),
    'conference-dial-in': defineAsyncComponent(
      () => import('@/components/alertCreate/additional/ConferenceDialIn.vue')
    )
  } as Record<string, any>,

  sectionList: ADDITIONAL_SECTION_LIST($t).filter((item) => {
    const keys = Object.keys(item);
    switch (keys[2]) {
      case 'permission':
        return isPermittedToMe(item.permission[0], item.permission[1]);
      case 'component':
        return isComponentAccessableToMe(item.component);
      case 'tenant':
        return isFlagAccessableToTenant(item.tenant);
      default:
        return true;
    }
  }) as Record<string, any>[],

  switch: {
    'conference-dial-in': false,
    'threat-assessment': false,
    'recommended-actions': false
  } as Record<string, any>
});

const alertData: Record<string, any> = computed(
  () => store.getters['alertCreate/getAlertFormData']
);

const editDisabled = computed(() => store.getters['alertCreate/editAlertMode']);

const openAccordians = computed(() => {
  const valid = store.getters['alertCreate/getFormValid'].additional;
  return Object.keys(valid).filter((key) => !valid[key]);
});

const isEventsVisible = computed(() => {
  const activeCategoryData =
    store.getters['alertCreate/getAlertFormListData']['active-category'] || {};
  return activeCategoryData?.category_code === 'event';
});

const scrollTo = async (sectionId: string, emitSectionClick = false) => {
  if (emitSectionClick) {
    emit('user:click:section', true);
    expandSection(sectionId);
  }
  const element =
    document.getElementById(sectionId)?.querySelectorAll('.el-form-item.is-error')?.[0] ||
    document.getElementById(sectionId);
  if (element) {
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      emit('user:click:section', false);
    }, 1000);
  }
};

function expandSection(id: string) {
  if (!state.activeItems.includes(id)) {
    state.activeItems.push(id);
    onAccordionClick(state.activeItems);
  }
}

function showSwitch(id: string) {
  return ['conference-dial-in', 'threat-assessment', 'recommended-actions'].includes(id);
}

function disableSwitch(id: string) {
  if (isEventsVisible.value && ['threat-assessment', 'recommended-actions'].includes(id)) {
    state.switch[id] = false;
    return true;
  }
  return ['additional-information', 'linked-alerts', 'intelligence-requirement'].includes(id)
    ? false
    : editDisabled.value;
}

function onSwitchChange(id: string, value: boolean) {
  if (value) scrollTo(id);
  switch (id) {
    case 'recommended-actions':
      updateAlertFormStore('enable_recommended_action', value);
      if (!value) {
        updateAlertFormStore('recommended_actions', []);
      }
      break;
    case 'threat-assessment':
      updateAlertFormStore('enable_acknowledgement_type', value);
      if (!value) {
        updateAlertFormStore('acknowledgement_type_data', null);
        updateAlertFormStore('acknowledgement_type_group', []);
      }
      break;
    case 'conference-dial-in':
      if (!value) {
        updateAlertFormStore('conference_url', '');
        updateAlertFormStore('conference_dial', '');
        updateAlertFormStore('conference_dial_directory', null);
        updateAlertFormStore('conference_start_time', null);
        updateAlertFormStore('conference_end_time', null);
      }
      break;
    default:
      return;
  }
  state.switch[id] = value;
  onAccordionClick(state.activeItems);
  store.dispatch('alertCreate/setFormValid', {
    additional: { [id]: !value }
  });
}

const onToggle = (title: string, id: string, event: boolean) => {
  if (event) {
    state.activeItems.push(id);
    onSwitchChange(id, true);
  } else {
    store.dispatch('alertCreate/setFormValid', {
      additional: { [id]: true }
    });
    switchConfirmationRef?.value?.open(
      {
        title: $t('alerts.close-speedbump.warning-title'),
        subTitle: $t('alerts.speedbumps.turn-off-module', {
          AlertModule: title.toLocaleLowerCase()
        })
      },
      {
        type: 'warning'
      },
      {
        id: id
      }
    );
  }
};

const onAccordionClick = (event: any) => {
  state.activeItems = [
    ...event.filter((item: string) => {
      return (
        !['conference-dial-in', 'threat-assessment', 'recommended-actions'].includes(item) ||
        state.switch[item]
      );
    })
  ];
};

onMounted(() => {
  const { enable_acknowledgement_type, enable_recommended_action } = alertData.value;
  const enable_conference = !!(
    alertData.value.conference_dial ||
    alertData.value.conference_url ||
    alertData.value.conference_start_time ||
    alertData.value.conference_end_time
  );
  state.switch = {
    'conference-dial-in': !!enable_conference,
    'threat-assessment': enable_acknowledgement_type,
    'recommended-actions': enable_recommended_action
  };
  onAccordionClick([
    ...state.activeItems,
    'conference-dial-in',
    'threat-assessment',
    'recommended-actions'
  ]);
});

watch(
  () => openAccordians.value,
  (val) => {
    const validActiveItems = val.filter((item) => item != 'validate');
    if (validActiveItems?.length && !val.includes('validate')) {
      state.activeItems = [...state.activeItems, ...validActiveItems];
      const sectionId = state.sectionList.map((item: Record<string, any>) => item.id);
      const validated = validActiveItems.sort(
        (a, b) => sectionId.indexOf(a) - sectionId.indexOf(b)
      );
      scrollTo(validated[0]);
    }
  }
);
</script>

<template>
  <div class="cyw-flex">
    <div class="section-list">
      <SectionList
        :list="state.sectionList"
        :selected="state.activeItems[0]"
        :activeSectionItem="props.activeSectionItem"
        v-bind="testId()"
        @section-click="scrollTo($event, true)"
      />
    </div>
    <div class="section-content">
      <CyAccordion ref="accRef" v-model="state.activeItems" @update:model-value="onAccordionClick">
        <CyAccordionItem
          v-for="item in state.sectionList"
          :key="item.id"
          :name="item.id"
          :title="item.title"
          :id="item.id"
          v-bind="testId(`${item.id}`)"
          :class="{ 'cyw-cursor-not-allowed': disableSwitch(item.id) }"
          class="cyw-mb-5"
        >
          <template #title>
            <div
              class="cyw-flex-align-center cyw-w-100 cyw-flex-justify-between section-content--clickable"
              @click="emit('highlight:section', item.id)"
            >
              <div class="cyw-flex">
                <div class="cyw-flex">
                  {{ item.title }}
                  <cy-tooltip
                    v-if="item.tooltip"
                    v-bind="testId(`${item.id}-tooltip`)"
                    :content="item.tooltip"
                    placement="top"
                  >
                    <CyIcon
                      icon="fa-duotone fa-solid fa-circle-question"
                      class="cyw-text-f14 cyw-mt-2 cyw-ml-2 cyw-color-N400"
                      v-bind="testId(`${item.id}-icon`)"
                    />
                  </cy-tooltip>
                </div>
                <span v-if="item?.count?.show && alertData?.[item.count.key]?.length">
                  ({{ alertData[item.count.key].length }})
                </span>
              </div>
              <CySwitch
                v-if="showSwitch(item.id)"
                :model-value="state.switch[item.id]"
                :disabled="disableSwitch(item.id)"
                v-bind="testId(`${item.id}`)"
                @update:modelValue="onToggle(item.title, item.id, $event)"
              />
            </div>
          </template>
          <div
            :class="{
              'cyw-cursor-not-allowed section-content--disabled': disableSwitch(item.id)
            }"
          >
            <component
              v-if="state.activeItems.includes(item.id)"
              :is="state.componentMap[item.id]"
              :showComponent="state.switch[item.id]"
              :skipValidation="props.skipValidation"
              :disabled="disableSwitch(item.id)"
            ></component>
          </div>
        </CyAccordionItem>
      </CyAccordion>
    </div>
  </div>
  <CyAlert
    ref="switchConfirmationRef"
    v-bind="testId('switch-confirmation')"
    @confirm="onSwitchChange($event.id, false)"
  ></CyAlert>
</template>

<style lang="scss" scoped>
.section-list {
  width: 20rem;
  position: fixed;
}
.section-content {
  margin-left: 20rem;
  width: calc(100% - 20rem);
  &--clickable {
    opacity: 1;
    pointer-events: all;
    cursor: auto;
  }
  &--disabled {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
  }
}
</style>

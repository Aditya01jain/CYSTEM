<script setup lang="ts">
import { reactive, onMounted, computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SectionList from '@/components/common/SectionList.vue';
import { SENDING_OPTIONS_SECTION_LIST } from '@/components/alertCreate/config';
import Recipients from '@/components/alertCreate/sendingoptions/Recipients.vue';
import PushNotifications from '@/components/alertCreate/sendingoptions/PushNotifications.vue';
import ShareWithCommunities from '@/components/alertCreate/sendingoptions/ShareWithCommunities.vue';
import PostToOtherApps from '@/components/alertCreate/sendingoptions/PostToOtherApps.vue';
import HandlingInstructions from '@/components/alertCreate/sendingoptions/HandlingInstructions.vue';
import AlertOptions from '@/components/alertCreate/sendingoptions/AlertOptions.vue';
import { useCommonData } from '@/composables/useCommonData';
import { THIRD_PARTY_APPS } from './sendingoptions/config';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import store from '@/store';
import { initTestId } from '@/utils/testid';

const { t: $t } = useI18n();
const { isPermittedToMe, isFlagAccessableToTenant } = useCommonData();

const { updateAlertFormStore } = useAlertBasicsData();

const props = defineProps({
  onPage: {
    default: false,
    type: Boolean
  },
  activeSectionItem: {
    default: '',
    type: String
  },
  dataTestid: {
    default: 'sending'
  }
});

const testId = initTestId(props.dataTestid, 'sending-options');

const state = reactive({
  activeItems: [
    'recipients',
    'share-with-communities',
    'post-to-other-apps',
    'handling-instructions',
    'restrictions-and-alert-options'
  ],

  componentMap: {
    recipients: Recipients,
    'push-notifications': PushNotifications,
    'share-with-communities': ShareWithCommunities,
    'post-to-other-apps': PostToOtherApps,
    'handling-instructions': HandlingInstructions,
    'restrictions-and-alert-options': AlertOptions
  } as Record<string, any>,

  pushEnabled: false,
  isRendered: false
});

const pushNotificationRef = ref();

const disabled = computed(() => store.getters['alertCreate/editAlertMode']);
const openAccordians = computed(() => {
  const valid = store.getters['alertCreate/getFormValid'].sending;
  return Object.keys(valid).filter((key) => !valid[key]);
});

const displaySections = computed(() =>
  SENDING_OPTIONS_SECTION_LIST($t).filter((item) => {
    switch (item.id) {
      case 'share-with-communities':
        return (
          isPermittedToMe('view', 'entity_sharing') &&
          !!store.getters['common/getCommunitySharing'].length
        );

      case 'post-to-other-apps':
        return !!THIRD_PARTY_APPS($t).filter((item) => {
          if (item.flag === 'tconnect') {
            return (
              isPermittedToMe('view', item.flag) && store.getters['common/getUserDetails']?.tconnect
            );
          }
          return isFlagAccessableToTenant(item.flag) || isPermittedToMe('view', item.flag);
        })?.length;

      case 'handling-instructions':
        return isPermittedToMe('view', 'special_handling');

      case 'restrictions-and-alert-options':
        return isPermittedToMe('scheduled', 'sa') || isPermittedToMe('submitted', 'sa');

      default:
        return true;
    }
  })
);

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

const isShareWithCommunities = (item: any) => item.id === 'share-with-communities';

const disableComponent = (item: any) => {
  switch (item.id) {
    case 'handling-instructions':
      return false;
    default:
      return disabled.value;
  }
};

function blockAllNotifications() {
  updateAlertFormStore('email_notification_group', []);
  updateAlertFormStore('push_notification_group', []);
  updateAlertFormStore('push_required', false);
  updateAlertFormStore('push_email_notification', false);
  updateAlertFormStore('block_all_member_notifications', true);
}

function updateNotificationState(value: boolean) {
  state.pushEnabled = value;
  onAccordionClick(state.activeItems);
  if (!value) {
    blockAllNotifications();
  } else {
    state.activeItems.push('push-notifications');
    pushNotificationRef.value?.[0]?.initDefaultValues();
    updateAlertFormStore('block_all_member_notifications', false);
  }
}

const onAccordionClick = (event: any) => {
  state.activeItems = event.filter(
    (item: string) => !['push-notifications'].includes(item) || state.pushEnabled
  );
};

onMounted(() => {
  const alertFormData = store.getters['alertCreate/getAlertFormData'];
  const newAlert = !(
    alertFormData.short_id ||
    alertFormData.copied_short_id ||
    alertFormData.alert_template_id
  );
  if (newAlert) {
    state.pushEnabled =
      isFlagAccessableToTenant('global_email_alert') ||
      isFlagAccessableToTenant('global_push_notification');
    updateAlertFormStore('block_all_member_notifications', !state.pushEnabled);
  } else {
    state.pushEnabled =
      !store.getters['alertCreate/getAlertFormData']['block_all_member_notifications'];
  }

  nextTick(() => {
    if (state.pushEnabled) {
      state.activeItems.push('push-notifications');
    } else {
      blockAllNotifications();
    }
    state.isRendered = true;
  });
});

watch(
  () => openAccordians.value,
  (value: any) => {
    if (value.includes('validate')) {
      scrollTo(value[1]);
      state.activeItems = [...state.activeItems, ...openAccordians.value];
    }
  },
  { deep: true }
);
const emit = defineEmits(['highlight:section', 'user:click:section']);
</script>

<template>
  <div class="cyw-flex">
    <div class="section-list">
      <SectionList
        :list="displaySections"
        @section-click="scrollTo($event, true)"
        :activeSectionItem="props.activeSectionItem"
        v-bind="testId()"
      />
    </div>
    <div class="section-content">
      <CyAccordion
        v-if="state.isRendered"
        :model-value="state.activeItems"
        @update:model-value="onAccordionClick"
      >
        <CyAccordionItem
          v-for="item in displaySections"
          :key="item.id"
          :name="item.id"
          :title="item.title"
          :id="item.id"
          :class="{ 'cyw-cursor-not-allowed': disableComponent(item) }"
          class="cyw-mb-5"
          v-bind="testId(`${item.id}`)"
        >
          <template #title>
            <div
              class="cyw-flex-align-center cyw-w-100 cyw-flex-justify-between section-content--clickable"
              @click="emit('highlight:section', item.id)"
            >
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
              <CySwitch
                v-if="item.id === 'push-notifications'"
                v-model="state.pushEnabled"
                :disabled="disableComponent({ id: 'push-notifications' })"
                @update:modelValue="updateNotificationState"
                v-bind="testId(`${item.id}`)"
              ></CySwitch>
            </div>
          </template>
          <div
            :class="{
              'cyw-cursor-not-allowed section-content--disabled':
                !isShareWithCommunities(item) && disableComponent(item),
              'disabled-opacity': isShareWithCommunities(item) && disableComponent(item)
            }"
          >
            <push-notifications
              v-if="item.id === 'push-notifications'"
              ref="pushNotificationRef"
              :pushEnabled="state.pushEnabled"
              :disabled="!state.pushEnabled || disableComponent(item)"
            />
            <component
              v-else
              :is="state.componentMap[item.id]"
              :disabled="disableComponent(item)"
              :onPage="props.onPage"
            ></component>
          </div>
        </CyAccordionItem>
      </CyAccordion>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.section-list {
  width: 25rem;
  position: fixed;
  @media screen and (max-width: 1500px) {
    width: 18rem;
  }
}
.section-content {
  margin-left: 25rem;
  width: calc(100% - 25rem);
  @media screen and (max-width: 1500px) {
    margin-left: 18rem;
    width: calc(100% - 18rem);
  }
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
.disabled-opacity {
  opacity: 0.5;
}
</style>

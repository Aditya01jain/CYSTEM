<script setup lang="ts">
import { reactive, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import store from '@/store';
import { LOCATION_RADIO, ORG_RADIO } from './config';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import SelectLocation from '@/components/common/SelectLocation.vue';
import { isEmpty } from 'lodash';
import { initTestId } from '@/utils/testid';
const testId = initTestId('ac', 'rg-additional-options');
const { t: $t }: any = useI18n();

const { updateAlertFormStore } = useAlertBasicsData();
const { isPermittedToMe, isComponentAccessableToTenant } = useCommonData();

const ALERT_KEYS = {
  LOCATION: 'card_location_json',
  REGION: 'regions',
  ORG: 'card_organization',
  ORG_TYPE: 'card_organization_types'
};

const props = defineProps({
  disabled: {
    default: false
  }
});

const state: Record<string, any> = reactive({
  visible: false,
  locSelected: ALERT_KEYS.LOCATION,
  orgSelected: ALERT_KEYS.ORG,
  location: {
    [ALERT_KEYS.LOCATION]: [],
    [ALERT_KEYS.REGION]: []
  } as Record<string, any>,
  org: {} as Record<string, any>,
  regions: [],
  regData: {} as Record<string, any>
});

const userGroupExist = computed(() => {
  const bool = !!(store.getters['alertCreate/getAlertFormData']['card_group'] || [])?.length;
  if (!bool) state.visible = false;
  return bool;
});

const disableFields = computed(() => props.disabled || !userGroupExist.value);

const updateOrg = (value: any) => {
  if (state.orgSelected === ALERT_KEYS.ORG) {
    state.org.card_organization = value;
  } else {
    state.org.card_organization_types = value;
  }
  updateAlertFormStore(ALERT_KEYS.ORG, state.org.card_organization || []);
  updateAlertFormStore('card_organization_types', state.org.card_organization_types || []);
};

const updateLocRadio = (event: string) => {
  state['locSelected'] = event;
  state.location = {
    [ALERT_KEYS.LOCATION]: [{}],
    [ALERT_KEYS.REGION]: []
  };
  updateAlertFormStore(ALERT_KEYS.LOCATION, []);
  updateAlertFormStore(ALERT_KEYS.REGION, []);
};

const updateOrgRadio = (event: string) => {
  state['orgSelected'] = event;
  state.org = {};
};

onMounted(() => {
  const formVal = store.getters['alertCreate/getAlertFormData'];

  state.locSelected = !isEmpty(formVal[ALERT_KEYS.REGION])
    ? ALERT_KEYS.REGION
    : ALERT_KEYS.LOCATION;

  state.orgSelected = !isEmpty(formVal[ALERT_KEYS.ORG_TYPE]) ? ALERT_KEYS.ORG_TYPE : ALERT_KEYS.ORG;

  state.location[state.locSelected] = formVal[state.locSelected] ?? [{}];
  state.org[state.orgSelected] = formVal[state.orgSelected] ?? [];
  if (!state.location.card_location_json.length) {
    state.location.card_location_json = [{}];
  }
});
</script>

<template>
  <cy-button
    class="cyw-ml-n3 cyw-color-N700"
    type="tertiary"
    subtype="underlined"
    v-bind="testId('additional-settings')"
    :disabled="!userGroupExist"
    @click="state.visible = !state.visible"
  >
    {{
      state.visible
        ? $t('alerts.form-interactions.hide-additional-settings')
        : $t('alerts.form-interactions.show-additional-settings')
    }}
  </cy-button>
  <div v-if="state.visible" class="cyw-color-N700">
    {{ $t('alerts.form-interactions.send-alert-only-to-recipients-in') }}
  </div>
  <div v-if="state.visible" class="cyw-bg-N20 cyw-border-1 cyw-round-lg cyw-flex-col cyw-p-4">
    <div v-if="isPermittedToMe('view', 'user_location')" class="cyw-flex-justify-between">
      {{
        state.locSelected === ALERT_KEYS.LOCATION
          ? $t('alerts.form-interactions.location')
          : $t('alerts.form-interactions.region')
      }}
      <div class="cyw-w-75">
        <div v-if="isComponentAccessableToTenant('region')" class="cyw-flex-row cyw-mb-4">
          <CyRadio
            v-for="option in LOCATION_RADIO($t)"
            class="cyw-mr-5"
            :key="option.key"
            :label="option.label"
            v-bind="testId(`location-${option.key}`)"
            :option="true"
            :modelValue="state.locSelected === option.key"
            :disabled="disableFields"
            @update:modelValue="updateLocRadio(option.key)"
          />
        </div>

        <div
          v-if="state.locSelected === ALERT_KEYS.LOCATION"
          :key="state.location.card_location_json.length"
        >
          <div
            v-for="(loc, index) in state.location.card_location_json"
            :key="index"
            class="cyw-flex-justify-start cyw-flex-align-center"
          >
            <div class="cyw-w-100 cyw-mr-4">
              <SelectLocation
                :selected="state.location['card_location_json'][index]"
                :disabled="disableFields"
                v-bind="testId(`rg-location-${index}`)"
                @selected-location="
                  state.location['card_location_json'][index] = {
                    ...$event,
                    id: index + 1
                  };
                  updateAlertFormStore('card_location_json', state.location['card_location_json']);
                "
              />
              <hr />
            </div>
            <CyIconShell
              v-if="state.location.card_location_json?.length > 1"
              v-bind="testId(`remove-${index}`)"
              size="md"
              class="cyw-mr-3"
              @click="state.location.card_location_json.splice(index, 1)"
            >
              <CyIcon icon="fa-regular fa-circle-minus" />
            </CyIconShell>
          </div>
          <CyButton
            type="tertiary"
            :disabled="disableFields"
            v-bind="testId('add-more')"
            @click="state.location.card_location_json.push({})"
          >
            + {{ $t('alerts.form-interactions.add-location') }}</CyButton
          >
        </div>

        <input-user-dropdown
          v-else
          size="md"
          :placeholder="$t('alerts.placeholder.select-region')"
          multiple
          valueIdentifier="name"
          identifier="id"
          search-identifier="name"
          v-model="state.location[ALERT_KEYS.REGION]"
          :disabled="disableFields"
          @update:model-value="
            updateAlertFormStore(ALERT_KEYS.REGION, state.location[ALERT_KEYS.REGION])
          "
          link="/admin/region/"
        />
      </div>
    </div>

    <hr class="cyw-w-100" />

    <div v-if="isPermittedToMe('view', 'organization')" class="cyw-flex-justify-between">
      {{
        state.orgSelected === ALERT_KEYS.ORG
          ? $t('alerts.form-interactions.organization')
          : $t('alerts.form-interactions.organization-type')
      }}
      <div class="cyw-w-75">
        <div class="cyw-flex-row">
          <CyRadio
            v-for="option in ORG_RADIO($t)"
            class="cyw-mr-5 cyw-mb-3"
            :key="option.key"
            :label="option.label"
            :option="true"
            :disabled="disableFields"
            v-bind="testId(`organization-${option.key}`)"
            :modelValue="state.orgSelected === option.key"
            @update:modelValue="updateOrgRadio(option.key)"
          />
        </div>

        <input-user-dropdown
          :key="state.orgSelected"
          multiple
          :model-value="
            state.orgSelected === ALERT_KEYS.ORG
              ? state.org[ALERT_KEYS.ORG]
              : state.org[ALERT_KEYS.ORG_TYPE]
          "
          @update:model-value="updateOrg($event)"
          :value-identifier="state.orgSelected === ALERT_KEYS.ORG ? 'org_name' : 'org_type_name'"
          :search-identifier="state.orgSelected === ALERT_KEYS.ORG ? 'org_name' : 'org_type_name'"
          :identifier="state.orgSelected === ALERT_KEYS.ORG ? 'org_id' : 'org_type_id'"
          :link="
            state.orgSelected === ALERT_KEYS.ORG
              ? 'admin/tenant_organization/'
              : 'admin/tenant_organization_type/'
          "
          :placeholder="
            state.orgSelected === ALERT_KEYS.ORG
              ? 'Select Organization'
              : 'Select Organization Type'
          "
          size="md"
          :disabled="disableFields"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss"></style>

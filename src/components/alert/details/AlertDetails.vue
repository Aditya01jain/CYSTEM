<script setup lang="ts">
import { reactive, defineAsyncComponent, onMounted, computed, ref, nextTick } from 'vue';
import { useStore } from 'vuex';
import { isEmpty } from 'lodash';
import { useI18n } from 'vue-i18n';

import { initTestId } from '@/utils/testid';
import { MAX_FILE_LIMIT } from '@/components/alertCreate/additional/config';
import { ALERT_META_DATA_LIST } from '@/components/alert/config';
import { copyToClipBoard, formatDateTime, timeAgo } from '@/utils/index';

import AddAttachments from './alertdetails/AddAttachments.vue';
const PirInputModal = defineAsyncComponent(() => import('@/views/MFA/PirInputModal.vue'));
const FilesDownload = defineAsyncComponent(() => import('@/components/common/FilesDownload.vue'));
const TagsView = defineAsyncComponent(() => import('@/components/common/TagsView.vue'));
const SanitizeHtml = defineAsyncComponent(() => import('@/components/common/SanitizeHtml.vue'));

import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
const { openAlertDetailsView, tdlFiles, fetchActiveCategory, fetchMCLStatement } =
  useAlertBasicsData();
const { isPermittedToMe, isFlagAccessableToTenant, isComponentAccessableToMe } = useCommonData();

const store: Record<string, any> = useStore();
const { t: $t } = useI18n();

const props = defineProps({
  mode: {
    type: String,
    default: 'view'
  },
  details: {
    type: Object,
    default: () => ({}),
    required: true
  },
  dataTestid: {
    type: String,
    default: 'alert-details'
  }
});

const testId = initTestId(props.dataTestid, 'details');

const addAttachments = ref();
const attachemntButtonRef = ref();

const state = reactive({
  metaDetailsMap: ALERT_META_DATA_LIST($t),
  modelTags: [] as Record<string, any>[],
  selectedTags: [] as Record<string, any>[],
  tagsList: [] as Record<string, any>[],
  tagUpdating: false,
  showAddTags: false,
  editMode: '',
  tdlFiles: [] as any,
  mclStatement: '',
  openAttachments: false
});

const alertDetails = computed(() =>
  props.mode === 'view' ? store.getters['alert/getAlertDetails'] : props.details
);

const addAttachmentsEnabled = computed(
  () => MAX_FILE_LIMIT > alertDetails?.value?.attachments?.length
);

const getCategoryFields = computed(() => {
  return (
    store.getters['alertCreate/getAlertFormListData']?.[
      'active-category'
    ]?.use_analysis_fields?.filter(
      ({ field_type }: { field_type: string }) => field_type !== 'pair'
    ) || []
  );
});

const extraDetails = computed(() => {
  return {
    ...alertDetails.value,
    ...alertDetails.value.optional_fields,
    ...alertDetails.value.custom_fields
  };
});

const previewImg = computed(() => {
  if (props.mode === 'view') return alertDetails.value.image_file_link;

  const formData = store.getters['alertCreate/getAlertFormData'];
  const defaultImageData = store.getters['common/getFormDetails']?.defaultImage;
  const imageType = formData?.card_image_type;

  if (!imageType) return '';

  switch (imageType) {
    case 'category_image':
      return formData?.card_image_file || '';
    case 'default_image':
      return defaultImageData;
    case 'new_image':
      return formData?.card_image_file ? `data:image/jpeg;base64,${formData.card_image_file}` : '';
    case 'no_image':
      return '';
    default:
      return formData?.image_file_link || '';
  }
});

const tacticTechniqueData: Record<string, any> | null = computed(() => {
  return props.mode === 'view'
    ? alertDetails.value.tactic_technique_pairs_data
    : alertDetails.value.tactic_technique_pairs;
});

const copyLink = (id: string) => {
  const { protocol, host } = window.location;
  return `${protocol}//${host}/dashboard/situational-awareness/details/${id}`;
};

function updateAlertDetails(key: string, value: Record<string, any>) {
  if (props.mode !== 'view') {
    store.dispatch('alertCreate/setAlertFormData', {
      key,
      value
    });
  } else store.dispatch('alert/setAlertDetails', { ...alertDetails.value, [key]: value });
}

const openTdlPreview = (file: any) => {
  const { protocol, host } = window.location;

  window.open(
    `${protocol}//${host}/dashboard/threat-defender/${file.document_id}source${file.source || 0}`,
    '_blank',
    'noopener'
  );
};

function onOpen() {
  state.openAttachments = true;
  nextTick(() => addAttachments?.value.show());
}

onMounted(async () => {
  state.mclStatement = await fetchMCLStatement(alertDetails.value);

  state.editMode = alertDetails.value.status;

  if (state.editMode !== 'DRAFT')
    await fetchActiveCategory(alertDetails.value.card_category?.category_id);

  const tdlContent = store.getters['alertCreate/getAlertTempData']?.tdl_content;
  store.dispatch('alertCreate/setAlertTempData', { tdl_content: [] });
  if (
    ['PUBLISHED', 'EXPIRED'].includes(state.editMode) &&
    isPermittedToMe('view', 'threat_defender')
  ) {
    state.tdlFiles =
      (
        await tdlFiles({
          entity_id: alertDetails.value?.short_id,
          entity_type: 1
        })
      )?.results?.map((item: any) => ({
        file_name: item?.title,
        file_format: item?.data_type_name,
        document_id: item.id,
        source: item?.source
      })) || [];
  } else if (tdlContent?.length) {
    state.tdlFiles =
      tdlContent?.map((item: any) => ({
        file_name: item?.title,
        file_format: item?.data_type_name,
        document_id: item.id,
        source: item?.source
      })) || [];
  }
});

function openIRDetails(id: string) {
  const detailLink = `${window.location.origin}/dashboard/intelligence-requirements/${id}`;
  window.open(detailLink, '_blank');
}
</script>

<template>
  <div class="cyw-flex cyw-py-4">
    <div class="cyw-w-75">
      <div
        v-if="state.mclStatement"
        class="cyw-text-f12 cyw-bg-B200 cyw-mb-5 cyw-mt-3 cyw-p-4 cyw-round-lg cyw-flex"
        v-bind="testId(`mcl`)"
      >
        <CyIcon
          size="lg"
          icon="fa-solid fa-circle-info"
          class="cyw-mr-3 cyw-mt-1 cyw-color-B300"
          v-bind="testId(`mcl-info-icon`)"
        />
        <SanitizeHtml :text="state.mclStatement" v-bind="testId(`mcl-info-text`)"></SanitizeHtml>
      </div>
      <h5 class="cyw-text-f16 cyw-text-bold" v-bind="testId(`title`)">
        {{ alertDetails.title }}
      </h5>

      <img
        v-if="previewImg"
        :src="previewImg"
        :style="{ 'aspect-ratio': '3/1', 'object-fit': 'cover' }"
        class="cyw-w-100 cyw-h-auto cyw-my-3"
        v-bind="testId(`image`)"
      />
      <div class="cyw-text-f14 cyw-py-4">
        <SanitizeHtml
          :text="alertDetails.content"
          :mdCheck="true"
          v-bind="testId(`summary`)"
        ></SanitizeHtml>
      </div>

      <!-- category fields -->
      <template v-for="(fields, index) in getCategoryFields" :key="index">
        <template v-if="!isEmpty(extraDetails[fields.field_name])">
          <div class="cyw-text-f12 cyw-color-N600" v-bind="testId(`${fields.field_label}`)">
            {{ fields.field_label }}
          </div>
          <cy-sanitize-html
            v-if="fields.field_type === 'text-box'"
            class="cyw-text-f14 cyw-mb-4"
            :text="extraDetails[fields.field_name]"
          />
          <p
            v-else-if="fields.field_type === 'single-select'"
            class="cyw-text-f14 cyw-color-N800 cyw-mb-4"
          >
            {{ extraDetails[fields.field_name]?.[`${fields.field_name}_name`] }}
          </p>
          <div
            v-else-if="fields.field_type === 'multi-select'"
            class="cyw-w-100 cyw-mb-4 cyw-flex-align-center cyw-py-2 cyw-flex-wrap"
          >
            <CyTag
              v-for="(item, index) in extraDetails[fields.field_name]"
              :key="index"
              :text="item[`${fields.field_name}_name`]"
              :rounded="false"
              class="cyw-mb-2"
            />
          </div>
          <p
            v-else-if="['date', 'datetime'].includes(fields.field_type)"
            class="cyw-text-f14 cyw-color-N800 cyw-mb-4"
          >
            {{ formatDateTime(extraDetails[fields.field_name]) }}
          </p>
          <p
            v-else-if="['boolean', 'check_box'].includes(fields.field_type)"
            class="cyw-text-f14 cyw-color-N800 cyw-mb-4"
          >
            {{ extraDetails[fields.field_name] ? 'True' : 'False' }}
          </p>
          <p v-else class="cyw-text-f14 cyw-color-N800 cyw-mb-4">
            {{ extraDetails[fields.field_name] }}
          </p>
        </template>
      </template>

      <!-- additional info -->
      <div class="cyw-py-4" v-if="alertDetails.card_info" v-bind="testId(`additonal-info`)">
        <div class="cyw-mb-3 cyw-flex-align-center">
          <h6 class="alert-details-subtitle-box">
            {{ $t('alerts.form-interactions.additional-information') }}
          </h6>
          <hr class="cyw-flex-grow-1" />
        </div>
        <CySanitizeHtml class="cyw-text-f14" :text="alertDetails.card_info"></CySanitizeHtml>
      </div>

      <!-- threat indicators -->
      <threat-indicators-details
        v-if="Object.keys(alertDetails.threat_indicators ?? [])?.length"
        :threat-indicators="alertDetails?.threat_indicators"
        :data-testid="props.dataTestid"
      />

      <!-- ttp -->
      <mitre-technique-details
        v-if="tacticTechniqueData?.length"
        :pairsData="tacticTechniqueData"
        :data-testid="props.dataTestid"
      />

      <!-- References -->
      <div
        class="cyw-mb-5"
        v-if="props?.details?.source_urls?.[0]?.url"
        v-bind="testId(`referneces`)"
      >
        <div class="cyw-mb-3 cyw-flex-align-center">
          <h6 class="alert-details-subtitle-box">
            References ({{ props?.details?.source_urls?.length }})
          </h6>
          <hr class="cyw-flex-grow-1" />
        </div>
        <div
          v-for="(ref, index) in props?.details?.source_urls"
          :key="index"
          class="cyw-text-f14 cyw-ml-2 cyw-color-N800"
          v-bind="testId(`referneces--${ref.source.source_url_name}`)"
        >
          <a
            :href="ref.url"
            target="_blank"
            class="reference-link-color cyw-text-nolink cyw-mr-2"
            v-bind="testId(`reference-link`)"
          >
            {{ ref.source.source_url_name }}
          </a>
          {{ ref.url }}
        </div>
      </div>

      <!-- Linked Alerts -->
      <div
        class="cyw-mb-5"
        v-if="props?.details?.attach_cards?.length"
        v-bind="testId(`linked-alerts`)"
      >
        <div class="cyw-mb-3 cyw-flex-align-center">
          <h6 class="alert-details-subtitle-box">
            {{ $t('alerts.form-interactions.linked-alerts') }}
            ({{ props?.details?.attach_cards?.length }})
          </h6>
          <hr class="cyw-flex-grow-1" />
        </div>
        <div
          v-for="(linked, index) in props?.details?.attach_cards"
          :key="index"
          class="cyw-text-f14 cyw-ml-2 cyw-flex-wrap cyw-color-N800"
          v-bind="testId(`${linked.short_id}`)"
        >
          <a
            @click.stop="openAlertDetailsView(linked.short_id)"
            class="cyw-text-underline cyw-mr-3 cyw-cursor-pointer"
            v-bind="testId(`linked-alerts-link`)"
          >
            {{ linked.short_id }}
          </a>
          {{ linked.title }}
        </div>
      </div>

      <!-- recommended_actions -->
      <div
        v-for="(action, index) in isFlagAccessableToTenant('display_action')
          ? props?.details?.recommended_actions
          : []"
        :key="index"
        class="cyw-mb-5"
        v-bind="testId(`recommended_actions-${action.title}`)"
      >
        <div class="cyw-mb-3 cyw-flex-align-center">
          <h6 class="alert-details-subtitle-box">
            {{ $t('alerts.alert-form-step.recommended-actions-section') }} {{ index + 1 }}
          </h6>
          <hr class="cyw-flex-grow-1" />
        </div>
        <div class="cyw-text-f12 cyw-color-N600" v-bind="testId(`recommended_actions-title`)">
          Action Name
        </div>
        <p class="cyw-text-f14 cyw-color-N800 cyw-mb-3">
          {{ action.title }}
        </p>
        <p class="cyw-text-f12 cyw-color-N600" v-bind="testId(`recommended_actions-description`)">
          {{ $t('alerts.form-interactions.description') }}
        </p>
        <CySanitizeHtml class="cyw-text-f14 cyw-color-N800" :text="action.description" />
      </div>

      <!-- conference_dial -->
      <div
        v-if="!!props?.details?.conference_dial"
        class="cyw-mb-5"
        v-bind="testId(`conference-dial`)"
      >
        <div class="cyw-mb-3 cyw-flex-align-center">
          <h6 class="alert-details-subtitle-box">Conference Dial</h6>
          <hr class="cyw-flex-grow-1" />
        </div>
        <div class="cyw-text-f12 cyw-color-N600">Conference Number</div>
        <p class="cyw-text-f14 cyw-color-N800 cyw-mb-3" v-bind="testId(`conference-number`)">
          {{ props?.details?.conference_dial }}
        </p>
        <div class="cyw-text-f12 cyw-color-N600">Conference URL</div>
        <p class="cyw-text-f14 cyw-color-N800 cyw-mb-3" v-bind="testId(`conference-url`)">
          {{ props?.details?.conference_url }}
        </p>
        <div class="cyw-text-f12 cyw-color-N600">Conference Date & Time</div>
        <p class="cyw-text-f14 cyw-color-N800 cyw-mb-3" v-bind="testId(`conference-date&time`)">
          {{ formatDateTime(props?.details?.conference_start_time) }}
        </p>
      </div>

      <!-- event details -->
      <events-details
        v-if="props?.details?.event?.schedules?.length"
        :event="alertDetails?.event"
        :timezone="alertDetails?.timezone_str"
        :data-testid="props.dataTestid"
      />
    </div>

    <!-- sidebar -->
    <div class="cyw-w-25 cyw-pl-5 alert-side-details">
      <div class="cyw-mb-4" v-for="(meta, index) in state.metaDetailsMap" :key="index">
        <template v-if="!meta.showIf || meta.showIf(alertDetails)">
          <div class="cyw-flex-align-center cyw-w-100">
            <div
              v-if="meta.type !== 'tag-list' || alertDetails[meta.key]?.length"
              class="cyw-text-f12"
              v-bind="testId(`sidebar-${meta.key}`)"
            >
              {{ meta.label }}
            </div>
            <CyTooltip
              v-if="meta.tooltipKey"
              :content="
                alertDetails[meta.key]?.[meta.tooltipKey] || alertDetails[meta.key]?.[meta.childKey]
              "
              v-bind="testId(`sidebar-${meta.key}`)"
            >
              <CyIcon
                icon="fa-solid fa-circle-info"
                class="cyw-ml-3"
                v-bind="testId(`${meta.key}-icon`)"
              />
            </CyTooltip>
          </div>

          <div v-if="meta.type === 'tlp'">
            <CyTag
              type="tlp"
              :value="alertDetails[meta.key]?.toLowerCase()"
              :rounded="false"
              v-bind="
                testId(`sidebar-${meta.key}-${(alertDetails?.[meta.key] || '')?.toLowerCase()}`)
              "
            >
            </CyTag>
          </div>
          <div v-if="meta.type === 'tag-list' && alertDetails[meta.key]?.length">
            <CyTag
              v-for="(data, index) in alertDetails[meta.key]"
              :key="index"
              :rounded="false"
              class="cyw-mb-2"
              v-bind="testId(`sidebar-${meta.key}-${alertDetails?.[meta.childKey]?.toLowerCase()}`)"
            >
              <div class="tag-width">
                <cy-expandable-title :value="data[meta.childKey]" :offset="200" hideCopy />
              </div>
            </CyTag>
          </div>
          <div v-if="meta.type === 'tags'">
            <TagsView
              :tags="alertDetails?.[meta.key]"
              :showAddTags="!['EXPIRED'].includes(alertDetails.status) && alertDetails.short_id"
              :alertId="alertDetails.short_id"
              @update:tags="updateAlertDetails('card_tag', $event)"
              v-bind="testId('sidebar')"
              :mode="props.mode"
            />
          </div>
          <a
            v-if="meta.type === 'link'"
            class="cyw-text-underline cyw-text-f12 cyw-text-bold cyw-cursor-pointer"
            @click="openAlertDetailsView(alertDetails[meta.key])"
            v-bind="testId(`sidebar-${meta.key}-link`)"
          >
            {{ alertDetails[meta.key] }}
          </a>
          <div
            v-if="meta.type === 'array'"
            class="cyw-text-f12 cyw-text-bold cyw-flex-wrap"
            v-bind="testId(`sidebar-${meta.key}`)"
          >
            <p v-if="props.details[meta.key]?.length">
              {{ props.details[meta.key].join(', ') }}
            </p>
          </div>
          <div
            v-if="meta.key === 'short_id'"
            class="cyw-text-underline cyw-text-f12 cyw-text-bold cyw-cursor-pointer"
          >
            <a
              class="cyw-mr-2"
              @click="openAlertDetailsView(props.details[meta.key])"
              v-bind="testId(`sidebar-${meta.key}-link`)"
            >
              {{ props.details[meta.key] }}
            </a>
            <CyIconShell
              size="md"
              @click="copyToClipBoard(copyLink(props.details[meta.key]))"
              v-bind="testId(`sidebar-${meta.key}`)"
            >
              <CyIcon icon="fa-light fa-copy" v-bind="testId(`sidebar-${meta.key}-icon`)" />
            </CyIconShell>
          </div>
          <div
            v-else-if="meta.key === 'modified' && props.details?.[meta?.key]"
            class="cyw-text-f12 cyw-text-bold"
          >
            <p v-bind="testId(`sidebar-${meta.key}`)">
              {{ timeAgo(new Date(props.details[meta.key])?.toISOString()) }}
            </p>
          </div>

          <div v-else-if="meta.key === 'published_time'" class="cyw-text-f12 cyw-text-bold">
            <p v-bind="testId(`sidebar-${meta.key}`)">
              {{ props.details[meta.key] ? formatDateTime(props.details[meta.key]) : '-' }}
            </p>
          </div>
          <div v-else class="cyw-text-f14 cyw-text-bold">
            <CyDataRenderer
              :config="meta"
              :data="alertDetails"
              v-bind="testId(`sidebar-${meta.key}`)"
            />
          </div>
        </template>
      </div>
      <!--  -->
      <div
        class="cyw-mb-4"
        v-if="
          props.mode === 'create'
            ? alertDetails?.attachments?.length
            : isPermittedToMe('view', 'drive')
        "
        v-bind="testId('sidebar-attachments')"
      >
        <div class="cyw-flex-justify-between cyw-flex-align-center">
          <div class="cyw-text-f12">{{ $t('alerts.alert-form-step.attachments-section') }}</div>
          <CyTooltip
            :content="$t('alerts.tooltips.maximum-attachment-error')"
            :disabled="addAttachmentsEnabled"
            v-bind="testId('sidebar-attachments-add')"
          >
            <CyButton
              v-if="isPermittedToMe('create', 'drive') && props.mode === 'view'"
              type="tertiary"
              size="md"
              ref="attachemntButtonRef"
              @click="
                onOpen();
                attachemntButtonRef.$el.blurs();
              "
              :disabled="!addAttachmentsEnabled"
              @close="state.openAttachments = false"
              v-bind="testId('sidebar-attachments-add')"
            >
              {{ $t('alerts.alert-form.add-button') }}
            </CyButton>
          </CyTooltip>
        </div>
        <FilesDownload
          v-if="alertDetails?.attachments?.length"
          :files="alertDetails?.attachments"
          :show-download="props.mode !== 'create'"
          class="preview-box cyw-mt-2"
          v-bind="testId('sidebar-attachments')"
        />
      </div>
      <!--  -->

      <div class="cyw-mb-4" v-if="state.tdlFiles?.length">
        <div class="cyw-text-f12">Threat Defender</div>
        <FilesDownload
          :files="state.tdlFiles"
          :show-download="false"
          isClickable
          @file-click="openTdlPreview"
          class="preview-box cyw-mt-2"
          v-bind="testId('sidebar-tdl')"
        />
      </div>
      <!--  -->

      <div v-if="isComponentAccessableToMe('intelligence-requirements')" v-bind="testId()">
        <PirInputModal
          v-if="alertDetails.published_time"
          :isPreview="true"
          class="cyw-h-auto"
          v-model="alertDetails.pirs"
          :alertId="alertDetails.short_id"
          :selectedPirs="alertDetails.pirs"
          mode="PUBLISHED"
          v-bind="testId('intelligence-requirement')"
        />
        <div v-else>
          <div class="cyw-flex-justify-between cyw-flex-align-center cyw-mb-2">
            <p
              class="cyw-color-N900 cyw-text-f12 cyw-text-medium"
              v-bind="testId('intelligence-requirement-count')"
            >
              Matched IR's :<span class="cyw-ml-2"> {{ alertDetails.pirs?.length || 0 }}</span>
            </p>
          </div>
          <div
            :class="[
              'pir-preview-box',
              'cyw-px-4',
              'cyw-round-lg',
              'cyw-pt-3',
              alertDetails.pirs?.length > 0 ? 'cyw-border-1' : ''
            ]"
          >
            <p
              v-for="(item, index) in alertDetails.pirs"
              :key="index"
              class="cyw-flex-align-center cyw-flex-justify-start cyw-mb-3 cyw-py-2 cyw-border-bottom cyw-flex-col cyw-rounded-lg"
              v-bind="testId(`sidebar-pir-${index}`)"
            >
              <cy-expandable-title
                hideCopy
                tagName="a"
                :offset="10"
                class="cyw-color-P600 cyw-text-f10 cyw-cursor-pointer"
                :value="item"
                @click="openIRDetails(item)"
                v-bind="testId(`sidebar-${index}-link`)"
              />
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <add-attachments
    v-if="isPermittedToMe('create', 'drive') && state.openAttachments"
    ref="addAttachments"
  />
</template>
<style lang="scss" scoped>
.preview-box {
  max-height: 19rem;
  overflow-y: scroll;
}
.alert-side-details {
  min-width: 19rem;
}

.reference-link-color {
  color: var(--B300);
}

.pir-preview-box {
  max-height: 19rem;
  overflow-y: scroll;
}
.tag-width {
  max-width: 15rem;
}
</style>

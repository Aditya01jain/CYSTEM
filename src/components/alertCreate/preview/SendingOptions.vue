<script setup lang="ts">
import { reactive, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { THIRD_PARTY_APPS } from '@/components/alertCreate/sendingoptions/config.ts';
import { useCommonData } from '@/composables/useCommonData';
import { initTestId } from '@/utils/testid';
import { formatDate } from '@/utils';

const { t: $t } = useI18n();
const { isPermittedToMe, isFlagAccessableToTenant } = useCommonData();

const props = defineProps({
  stats: {
    type: Object,
    default: {}
  },
  data: {
    type: Object,
    default: {}
  },
  preview: {
    type: Boolean,
    default: false
  },
  dataTestid: {
    type: String,
    default: 'sending-options'
  }
});
const testId = initTestId(props.dataTestid);

const state = reactive({
  tableData: [] as Record<string, any>[]
});

const emailGroup = computed(() =>
  props.data['email_notification_group']?.map((item: Record<string, any>) => item.group_id)
);

const pushGroup = computed(() =>
  props.data['push_notification_group']?.map((item: Record<string, any>) => item.group_id)
);

const threatAssessGroup = computed(() =>
  isPermittedToMe('view', 'acknowledgement_type')
    ? props.data['acknowledgement_type_group']?.map((item: Record<string, any>) => item.group_id)
    : []
);

const actionsGroup = computed(() =>
  isFlagAccessableToTenant('display_action')
    ? props.data['recommended_actions']?.map((item: Record<string, any>) => ({
        title: item.title,
        members: item.assigned_groups?.map((obj: Record<string, any>) => obj.group_id)
      }))
    : []
);

function returnYesOrNo(value: boolean): string {
  return value ? $t('alerts.labels.yes') : $t('alerts.labels.no');
}

function recommendedActionsCount(groupId: string) {
  return actionsGroup.value?.filter((action: { members: string | any[] }) =>
    action.members.includes(groupId)
  ).length;
}

watch(
  () => Object.keys(props.stats),
  () => {
    state.tableData = [
      {
        name: $t('alerts.sending-options.share-with-communities'),
        id: 'shared_communities',
        tags: props.data.sharing_community?.map((item: any) => item.app_name)
      },
      {
        name: $t('alerts.alert-form-step.post-to-other-apps-section'),
        id: 'post-to-apps',
        tags: THIRD_PARTY_APPS($t)
          .filter((item: Record<string, any>) => {
            if (props.data[item.channelConfig?.modelKey]?.length)
              return props.data[item.channelConfig?.modelKey];
            else return props.data[item.model_param];
          })
          .map((item: any) => {
            if (props.data[item.channelConfig?.modelKey]?.length) {
              const values = props.data[item.channelConfig?.modelKey]
                .map((obj: any) => obj[item.channelConfig?.labelIdentifier])
                .join(', ');
              return `${item.title}: ${values}`;
            }
            return item.title;
          })
      },
      {
        name: $t('alerts.alert-form.special-handling-header'),
        id: 'handle-instruction',
        tags: props.data.special_flags?.map((item: any) => item.special_flag_name)
      },
      {
        name: $t('alerts.form-interactions.location'),
        id: 'location',
        tags: props.stats.locations?.length
          ? Array.from(new Set(props.stats.locations))
          : props.stats.locations
      },
      {
        name: $t('alerts.form-interactions.organization-name'),
        id: 'org-name',
        tags: props.data.card_organization?.map((item: Record<string, any>) => item.org_name) || []
      },
      {
        name: $t('alerts.form-interactions.organization-type'),
        id: 'org-type',
        tags:
          props.data.card_organization_types?.map(
            (item: Record<string, any>) => item.org_type_name
          ) || []
      },
      {
        name: $t('alerts.sharing-options.allow-member-export'),
        id: 'member-export',
        tags: [returnYesOrNo(props.data.export_alert_from_webapp)]
      },
      {
        name: $t('alerts.form-interactions.allow-export-as-pdf'),
        id: 'pdf-export',
        tags: [returnYesOrNo(props.data.attach_alert_export_in_doc_library)]
      },
      {
        name: $t('alerts.sending-options.send-email-to-publisher'),
        id: 'email-to-publisher',
        tags: [returnYesOrNo(props.data.send_notification_to_card_publisher)]
      },
      {
        name: $t('alerts.form-interactions.schedule-alert-expiry-time'),
        id: 'alert-expiry-time',
        value: props.data.expire_time,
        type: 'date'
      },
      {
        name: $t('alerts.form-interactions.repeat-this-alert-multiple-times'),
        id: 'repeat-alert-after',
        value: props.data.schedule_frequency_gap,
        type: 'string'
      },
      {
        name: $t('alerts.sharing-options.repeat-this-alert-until'),
        id: 'repeat-alert-until',
        value: props.data.schedule_tilldate,
        type: 'date'
      }
    ];
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="Object.keys(props.stats)?.length" class="cyw-bg-N50 cyw-p-4 cyw-round-lg">
    <el-table
      border
      :max-height="300"
      class="cyw-w-100 cyw-round-lg cyw-my-3"
      header-cell-class-name="cyw-bg-P50 cyw-color-N800 "
      :data="props.data['card_group']"
    >
      <el-table-column :label="$t('alerts.sending-options.recipient-details')">
        <template #default="scope">
          <div class="cyw-text-f14" v-bind="testId(`recipient-${scope.row.group_name}`)">
            {{ scope.row.group_name }}
          </div>
        </template>
      </el-table-column>

      <el-table-column
        class="cyw-text-f14"
        :label="$t('alerts.form-interactions.push-notifications-1')"
        :width="200"
      >
        <template #default="scope">
          <CyTag
            v-if="emailGroup?.includes(scope.row.group_id)"
            :text="$t('alerts.laisting-page.email')"
            :rounded="false"
            v-bind="testId(`recipient-${scope.row.group_name}-email`)"
          />
          <CyTag
            v-if="pushGroup?.includes(scope.row.group_id)"
            :text="$t('alerts.listing-page.mobile')"
            :rounded="false"
            v-bind="testId(`recipient-${scope.row.group_name}-mobile`)"
          />
        </template>
      </el-table-column>
      <el-table-column class="cyw-text-f14" label="Add-ons" :width="250">
        <template #default="scope">
          <div class="cyw-flex-wrap">
            <CyTag
              v-if="threatAssessGroup?.includes(scope.row.group_id)"
              :text="$t('alerts.alert-form-step.threat-assessments-section')"
              :rounded="false"
              class="cyw-mb-2"
              v-bind="testId(`${scope.row.group_name}-threat-assessment`)"
            />
            <div v-if="recommendedActionsCount(scope.row.group_id)">
              <CyTag
                :text="
                  recommendedActionsCount(scope.row.group_id) === 1
                    ? $t('alerts.labels.recommended-action')
                    : `${recommendedActionsCount(scope.row.group_id)} ${$t(
                        'alerts.alert-form-step.recommended-actions-section'
                      )}`
                "
                :rounded="false"
                class="cyw-mb-2"
                v-bind="
                  testId(
                    `${scope.row.group_name}-${recommendedActionsCount(
                      scope.row.group_id
                    )}-recommended-action`
                  )
                "
              />
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
  <div v-if="Object.keys(props.stats)?.length" class="cyw-py-5">
    <div class="cyw-color-N900 cyw-text-f14 cyw-my-3" v-bind="testId(`other-info-table`)">
      {{ $t('alerts.sending-options.other-information') }}
    </div>
    <el-table
      border
      class="cyw-w-100 cyw-round-lg cyw-my-3 no-header"
      :data="state.tableData.filter((i) => i.tags?.length || i.value)"
    >
      <el-table-column prop="name" :label="null" :width="250">
        <template #default="scope">
          <div class="cyw-text-f14" v-bind="testId(`other-${scope.row.id}-column`)">
            {{ scope.row.name }}
          </div>
        </template>
      </el-table-column>

      <el-table-column :label="null" class="cyw-text-f14">
        <template #default="scope">
          <div v-if="scope.row.tags?.length" class="cyw-flex-wrap">
            <CyTag
              v-for="(item, index) in scope.row.tags"
              class="cyw-m-2 cyw-w-auto"
              :key="index"
              :rounded="false"
              v-bind="testId(`${scope.row.id}-${index}`)"
            >
              <div class="tag-width">
                <CyExpandableTitle :hideCopy="true" :value="item" :offset="300" />
              </div>
            </CyTag>
          </div>
          <cy-data-renderer
            v-else
            :config="{
              type: scope.row.type,
              key: 'value',
              class: 'cyw-text-medium cyw-color-N900'
            }"
            :data="scope.row"
            v-bind="testId(`othertable-${scope.row.id}}`)"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
  <div
    v-if="
      Object.keys(props.stats)?.length &&
      ['PUBLISHED', 'EXPIRED'].includes(data.status) &&
      (!!props.stats?.initial_recipients_count || !!props.stats?.count)
    "
    class="cyw-bg-N50 cyw-p-4 cyw-round-lg"
  >
    <div class="cyw-text-f14 cyw-text-medium">
      {{ $t('alerts.sending-options.total-recipients-active') }}
    </div>
    <div class="cyw-p-3">
      <bar-chart
        v-bind="
          testId(
            `bar-chart-whenPublished-${props.stats?.initial_recipients_count}-todayActive-${props.stats?.count}`
          )
        "
        title=""
        value="Active Recipients"
        :categories="[
          `<b>When Published</b> <br/> ${formatDate(props.data.published_time)}`,
          `<b>Today Active</b> <br/> ${formatDate()}`
        ]"
        :data="[
          { y: props.stats?.initial_recipients_count, color: 'var(--AQ500)' },
          { y: props.stats?.count, color: 'var(--BR400)' }
        ]"
        :legend="{
          enabled: false
        }"
      />
    </div>
  </div>
</template>
<style lang="scss">
.no-header {
  .el-table__header-wrapper {
    display: none;
  }
}
.tag-width {
  max-width: 24rem;
}
</style>

<script setup lang="ts">
import { onMounted, reactive, ref, inject } from 'vue';
import PieChart from '@/components/charts/PieChart.vue';
import { TA_TABLE_COLUMNS } from './config';
import { alertResponses } from './alertResponses';
import ThreatAssessmentDetails from '../additionaldetails/ThreatAssessmentDetails.vue';
import { THREAT_REMINDER_MSG } from '@/utils/config';
import { useI18n } from 'vue-i18n';
import { initTestId } from '@/utils/testid';

const { t: $t } = useI18n();
const $api: any = inject('$api');
const testId = initTestId('ad', 'threat-assessement');

const { fetchTAmember, fetchTAorg, fetchTAresponses, sendTAReminder, exportTA } = alertResponses();

const props = defineProps({
  details: {
    type: Object,
    default: () => ({})
  },
  alertId: {
    default: '',
    type: String
  },
  dataTestid: {
    type: String,
    default: 'responses'
  }
});

const state = reactive({
  tableData: [],
  memData: [] as any,
  memTotal: 0,
  orgData: [] as any,
  orgTotal: 0,
  comment: ''
});

const confirmReminderRef = ref();
const popperRef = ref();

const memPieEvents: any = ref({
  load() {
    const chart = this;
    chart.renderer
      .text(
        'Total<br/>Members<br />' + state.memTotal,
        chart.plotLeft + chart.plotWidth / 2,
        chart.plotTop + chart.plotHeight / 2 - 10
      )
      .attr({ align: 'center', class: 'cyw-text-f16' })
      .add();
  }
});

const orgPieEvents: any = ref({
  load() {
    const chart = this;
    chart.renderer
      .text(
        'Total<br/>Organization<br />' + state.orgTotal,
        chart.plotLeft + chart.plotWidth / 2,
        chart.plotTop + chart.plotHeight / 2 - 10
      )
      .attr({ align: 'center', class: 'cyw-text-f16' })
      .add();
  }
});

async function approveRejectResponse(type: string, data: Record<string, any>) {
  let payload;
  if (type === 'approve') {
    payload = {
      id: data.id,
      approval_status: 'APPROVED'
    };
  } else {
    payload = {
      id: data.id,
      approval_status: 'REJECTED',
      status_update_reason: state.comment
    };
  }
  popperRef.value.close();
  await $api.put('analyst.threatResponseApproval', payload);
  state.tableData = (await fetchTAresponses(props.alertId)).results;
}

onMounted(async () => {
  state.tableData = (await fetchTAresponses(props.alertId)).results;
  const memData = await fetchTAmember(props.alertId);
  state.memData = memData?.data;
  state.memTotal = memData?.total;

  const orgData = await fetchTAorg(props.alertId);
  state.orgData = orgData?.data;
  state.orgTotal = orgData?.total;
});
</script>
<template>
  <div id="threat-assessment" v-bind="testId()">
    <div class="cyw-flex-justify-between cyw-mb-2">
      <div class="cyw-text-f16 cyw-m-y-3">
        {{ $t('alerts.alert-form-step.threat-assessments-section') }}
      </div>
      <div class="cyw-flex-row">
        <CyButton
          type="secondary"
          class="cyw-flex-align-center"
          @click="confirmReminderRef?.open({ type: 'error' }, {}, {})"
          v-bind="testId('reminder')"
        >
          <CyIcon icon="fa-light fa-bell " class="cyw-mr-3" />
          {{ $t('alerts.responses-pop-up.trigger-reminder-title') }}
        </CyButton>

        <CyButton
          type="tertiary"
          class="cyw-flex-align-center"
          @click="exportTA(props.alertId)"
          v-bind="testId('export-response')"
        >
          <CyIcon icon="fa-regular fa-arrow-up-to-line" class="cyw-mr-3" />
          {{ $t('alerts.responses.export-threat-assessment') }}
        </CyButton>
      </div>
    </div>
    <div class="cyw-p-4 cyw-border-1 cyw-round-lg cyw-bg-N20">
      <threat-assessment-details
        :data="props?.details?.acknowledgement_type_data"
        :data-testid="props.dataTestid"
      />
      <div class="cyw-flex-col cyw-bg-N20 cyw-round-lg">
        <div class="cyw-flex-row cyw-flex-justify-around">
          <div class="cyw-m-3 cyw-round-lg cyw-shadow-100" v-bind="testId('member-data-chart')">
            <pie-chart
              v-if="state.memData?.length"
              :height="270"
              :width="350"
              :data="state.memData"
              inner-radius="80%"
              value="members"
              :data-labels="{ enabled: false }"
              :events="memPieEvents"
              :title="$t('alerts.responses.member-level')"
            />
          </div>
          <div class="cyw-m-3 cyw-round-lg cyw-shadow-100">
            <pie-chart
              v-if="state.orgData?.length"
              v-bind="testId('org-data-chart')"
              :height="270"
              :width="350"
              :data="state.orgData"
              inner-radius="80%"
              value="organization"
              :data-labels="{ enabled: false }"
              :events="orgPieEvents"
              :title="$t('alerts.responses.organization-level')"
            />
          </div>
        </div>
        <div>
          <div class="cyw-mx-3 cyw-mb-3">
            <CyCompactTable
              :config="{
                maxHeight: 600,
                selectable: false,
                customizable: false,
                rowIdentifier: 'id'
              }"
              :data="state.tableData"
              :columns="TA_TABLE_COLUMNS($t)"
              v-bind="testId('table')"
            >
              <template #cell="{ row, column }">
                <div v-if="column.type === 'actions'" class="cyw-flex-align-center">
                  <template v-if="row.text_answer && row.approval_status === 'SUBMITTED'">
                    <CyPopper
                      ref="popperRef"
                      popperClass="ta-reject-comment"
                      @hide="state.comment = ''"
                      v-bind="testId()"
                    >
                      <template #reference>
                        <cy-button type="secondary" subtype="subtle" size="md" v-bind="testId('reject')">
                          {{ $t('alerts.buttons.reject') }}
                        </cy-button>
                      </template>
                      <div class="cyw-p-5">
                        <div class="cyw-text-f14 cyw-text-medium cyw-mb-2">Comment *</div>
                        <CyTextarea
                          v-model="state.comment"
                          :maxlength="500"
                          class="cyw-mb-4"
                          v-bind="testId('comment')"
                        ></CyTextarea>
                        <cy-button
                          class="cyw-float-right"
                          :disabled="!state.comment.length"
                          size="md"
                          @click="approveRejectResponse('reject', row)"
                          v-bind="testId('reject-now')"
                        >
                          {{ $t('alerts.buttons.reject') }}
                        </cy-button>
                      </div>
                    </CyPopper>
                    <cy-button
                      @click="approveRejectResponse('approve', row)"
                      type="secondary"
                      size="md"
                      class="cyw-ml-2"
                      v-bind="testId('approve')"
                    >
                      {{ $t('alerts.buttons.approve') }}
                    </cy-button>
                  </template>
                  <div v-else>
                    <CyTag
                      v-if="row.text_answer"
                      type="status"
                      :text="row.approval_status"
                      :theme="row.approval_status === 'REJECTED' ? 'red' : 'green'"
                      v-bind="testId('status')"
                    />
                    <div v-else>-</div>
                  </div>
                </div>
                <CyDataRenderer :config="column" :data="row" v-bind="testId()" />
              </template>
              <template #preview="{ row }">
                <div class="cyw-py-5 ta-response">
                  <div class="cyw-text-f12 cyw-color-N700 cyw-pb-3">
                    {{ $t('alerts.responses.event-response') }}
                  </div>
                  <p v-if="row.text_answer" v-bind="testId('answer')">
                    {{ row.text_answer }}
                  </p>
                  <CyTag v-else :text="row.choice?.title" v-bind="testId('answer')"></CyTag>
                </div>
              </template>
            </CyCompactTable>
          </div>
        </div>
      </div>
    </div>
  </div>
  <CyAlert
    ref="confirmReminderRef"
    v-bind="testId('trigger')"
    :message="THREAT_REMINDER_MSG($t)"
    @confirm="sendTAReminder(props.alertId)"
  />
</template>
<style lang="scss" scopped>
#threat-assessment {
  .ta-response {
    margin-left: 6rem;
  }
}
.ta-reject-comment {
  min-width: 40rem;
}
</style>

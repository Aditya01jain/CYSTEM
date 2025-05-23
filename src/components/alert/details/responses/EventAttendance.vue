<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { alertResponses } from './alertResponses';
import { EVENT_COLUMNS, EVENT_TABS } from './config';
import { formatDate, formatTimeRange } from '@/utils';
import { useI18n } from 'vue-i18n';
import { initTestId } from '@/utils/testid';

const { t: $t } = useI18n();

const testId = initTestId('ad', 'event-attendance');
const { eventInvitedDetails, eventStats, exportEvents } = alertResponses();

const DATE_FORMAT = ref('MMM DD, YYYY');
const TIME_FORMAT = ref('hh:mm A');

const props = defineProps({
  alertId: {
    default: ''
  },
  details: {
    default: {},
    type: Object
  },
  dataTestid: {
    type: String,
    default: 'event-attendance'
  }
});

const state = reactive({
  pagination: {
    page: 1,
    pageSize: 10
  },
  tableData: [],
  total: 0,
  selectedEvent: { value: 'entire-event', label: $t('alerts.responses.entire-event') },
  selectedTab: 'any',
  graphData: [] as Record<string, any>,
  loading: false,
  eventData: [
    { key: 'yes', label: $t('alerts.responses.attending'), color: 'var(--AQ500)' },
    { key: 'no', label: $t('alerts.responses.not-attending'), color: 'var(--BL300)' },
    { key: 'maybe', label: $t('alerts.responses.may-be'), color: 'var(--KH300)' },
    { key: 'none', label: $t('alerts.alert-details-events.no-response'), color: 'var(--TL300)' }
  ]
});

const pieEvents: any = ref({
  load() {
    const chart = this;
    chart.renderer
      .text(
        `Total<br/>Members<br/> <b> ${state.total}</b>`,
        chart.plotLeft + chart.plotWidth / 2,
        chart.plotTop + chart.plotHeight / 2 - 10
      )
      .attr({ align: 'center', class: 'cyw-text-f12 cyw-color-N800' })
      .add();
  }
});

const fetchData = async () => {
  state.loading = true;
  const data = await eventInvitedDetails(props.alertId, {
    page: state.pagination.page,
    page_size: state.pagination.pageSize,
    response: state.selectedTab,
    ...(Object.keys(state.selectedEvent).length && state.selectedEvent.value !== 'entire-event'
      ? { event_id: state.selectedEvent.value }
      : {})
  });
  fetchGraph();
  state.loading = false;
  state.total = data.count;
  state.tableData = data.results;
};

const eventSchedulesDropdownList = computed(() => {
  return [
    { value: 'entire-event', label: $t('alerts.responses.entire-event') },
    ...props.details?.event.schedules.map(({ id, start_time, end_time }: any) => {
      return {
        value: id,
        label: `${formatDate(start_time)}, 
        ${formatTimeRange(start_time, end_time)}`
      };
    })
  ];
});

const handleDropDown = (option: any) => {
  state.selectedEvent = option;
  state.pagination = {
    page: 1,
    pageSize: 10
  };
  fetchData();
  fetchGraph();
};

const onPageChange = (page: number, size: number) => {
  state.pagination.page = page;
  state.pagination.pageSize = size;
  fetchData();
};

async function fetchGraph() {
  state.graphData = [];

  const data = await eventStats(props.alertId, {
    response: state.selectedTab,
    ...(!['entire-event', ''].includes(state.selectedEvent.value)
      ? { event_id: state.selectedEvent.value }
      : {})
  });

  const percentages = Object.entries(data).reduce(
    (acc: Record<string, string>, [key, obj]: [string, any]) => {
      acc[key] = obj.percentage;
      return acc;
    },
    {}
  );

  state.eventData = state.eventData.map((event) => ({
    ...event,
    percentage: percentages[event.key] || '0%'
  }));

  state.graphData = Object.entries(data)
    .filter(([key, obj]: [string, any]) => key !== 'any')
    .map(([key, obj]: [string, any]) => {
      const matchedEvent = state.eventData.find((event) => event.key === key);

      return {
        name: matchedEvent?.label || obj.label,
        y: parseInt(obj.percentage.split('%')[0], 10),
        color: matchedEvent?.color || ''
      };
    });
}

onMounted(async () => {
  fetchData();
  fetchGraph();
});
</script>
<template>
  <div id="event-attendance">
    <div class="cyw-flex-justify-between" v-bind="testId()">
      <div class="cyw-text-f16 cyw-my-3">{{ $t('alerts.responses.event-attendance') }}</div>
      <CyButton
        type="tertiary"
        class="cyw-flex-align-center"
        @click="exportEvents(props.alertId)"
        v-bind="testId(`export`)"
      >
        <CyIcon icon="fa-regular fa-arrow-up-to-line" class="cyw-mr-3" />
        {{ $t('alerts.responses.export-attendance') }}
      </CyButton>
    </div>
    <div class="cyw-bg-N20 cyw-p-3 cyw-flex-justify-between">
      <div v-if="!!state.graphData?.length" class="cyw-bg-N10 cyw-p-3 cyw-w-25">
        <cy-dropdown class="cyw-w-100 cyw-mb-5">
          <template #dropdown-link>
            <cy-button
              type="secondary"
              class="cyw-w-100 cyw-flex-justify-between cyw-flex-align-center"
              v-bind="testId(`${state.selectedEvent.label}`)"
            >
              {{ state.selectedEvent.label }}
              <CyIcon icon="fa-solid fa-caret-down" />
            </cy-button>
          </template>
          <template #dropdown>
            <div
              v-for="(option, index) in eventSchedulesDropdownList"
              :key="index"
              class="cyw-p-3 cyw-text-f12 cyw-cursor-pointer"
              @click="handleDropDown(option)"
              v-bind="testId(`${option.label}`)"
            >
              {{ option.label }}
            </div>
          </template>
        </cy-dropdown>
        <div v-if="state.loading" class="cyw-flex-justify-center cyw-flex-align-center">
          <CySpinner size="5"></CySpinner>
        </div>
        <pie-chart
          v-else
          v-bind="testId(`pie-chart`)"
          :height="180"
          :width="180"
          :data="state.graphData"
          title=""
          :events="pieEvents"
          value="value"
          inner-radius="80%"
          :data-labels="{ enabled: false }"
        />
        <div class="cyw-mt-3 cyw-ml-5">
          <div
            v-for="item in state.eventData"
            :key="item.key"
            class="cyw-flex cyw-flex-align-center cyw-mb-2"
            v-bind="testId(`${item.key}`)"
          >
            <div
              :style="{
                backgroundColor: item.color
              }"
              class="cyw-mr-3 event-graph-data-color"
            ></div>
            <span class="cyw-text-f12"> {{ item.label }} ({{ item.percentage }}) </span>
          </div>
        </div>
      </div>
      <div class="cyw-w-75">
        <CyTab
          v-model="state.selectedTab"
          @update:model-value="fetchData"
          :data="EVENT_TABS($t)"
          v-bind="testId()"
        />
        <CyTable
          height="300"
          :pagination="state.pagination"
          :total="state.total"
          :config="{ selectable: false, customizable: false, showSort: false }"
          :data="state.tableData"
          :columns="EVENT_COLUMNS($t)"
          @page-change="onPageChange"
          v-bind="testId()"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.event-graph-data-color {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>

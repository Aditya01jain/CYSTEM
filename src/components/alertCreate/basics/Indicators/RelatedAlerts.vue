<script setup lang="ts">
import store from '@/store';
import { cloneDeep, isEmpty } from 'lodash';
import { reactive, ref, onMounted, computed, watch } from 'vue';
import { allIocs, additionalIocs, relatedAlertsColumn } from '../config';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { formatDateTime } from '@/utils';
import { initTestId } from '@/utils/testid';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();
const testId = initTestId('ac', 'related-alerts');

const { fetchRelatedAlerts, openAlertDetailsView } = useAlertBasicsData();

const props = defineProps({
  showModal: {
    default: false,
    type: Boolean
  },
  selectedIoc: {
    default: 'ip',
    type: String
  }
});

const state = reactive({
  tableValue: {
    page: 1,
    page_size: 10,
    indicator_type: '',
    indicator_value: ''
  },
  filter: {},
  selectedTab: 'blacklisted',
  total: 0,
  tableData: [] as Array<Object>,
  searchQuery: '',
  iocValue: ''
});

const emit = defineEmits(['close']);

const indicatorData: Record<string, any> = computed(
  () => store.getters['alertCreate/getAlertFormData']['threat_indicators']
);

const filteredIndicatorData: Record<string, any> = computed(() => {
  let indicators = cloneDeep(store.getters['alertCreate/getAlertFormData']['threat_indicators']);
  let updateIndicators = {};
  if (state.searchQuery) {
    Object.keys(indicators).forEach((key: string) => {
      if (indicators[key][state.selectedTab]) {
        const matches = indicators[key][state.selectedTab]?.some((val: string) =>
          val.toString().toLowerCase().includes(state.searchQuery?.toLowerCase())
        );

        if (matches) {
          Object.keys(indicators).forEach((key) => {
            if (indicators[key]) {
              indicators[key].whitelisted = indicators[key].whitelisted.filter(
                (item: string | string[]) =>
                  item.toString().toLowerCase().includes(state.searchQuery?.toLowerCase())
              );
              indicators[key].blacklisted = indicators[key].blacklisted.filter(
                (item: string | string[]) =>
                  item.toString().toLowerCase().includes(state.searchQuery?.toLowerCase())
              );
            }
          });
          const filteredIndicators = { [key]: indicators[key] };
          Object.assign(updateIndicators, filteredIndicators);
        }
      }
    });
  }

  const indicatorKey = Object.keys(updateIndicators)[0];
  const updateIndicatorDataValue = updateIndicators[indicatorKey]?.[state.selectedTab]?.[0];

  state.iocValue = state.searchQuery ? Object.keys(updateIndicators)[0] : props.selectedIoc;
  state.tableValue.indicator_value = state.searchQuery
    ? updateIndicatorDataValue
    : indicatorData.value[props.selectedIoc]?.[state.selectedTab][0];
  return state.searchQuery ? updateIndicators : indicators;
});

const onIocClick = (iocType: string, ioc: string) => {
  state.tableValue.indicator_type = iocType;
  state.tableValue.indicator_value = ioc;
  fetchData();
};
const indicatorTabs = computed(() => {
  return [
    {
      id: 'blacklisted',
      title: state.searchQuery
        ? $t('alerts.threat-indicators.blocked-indicators')
        : `${$t('alerts.threat-indicators.blocked-indicators')} (${
            getIndicatorTabLength('blacklisted').length
          })`
    },
    {
      id: 'whitelisted',
      title: state.searchQuery
        ? $t('alerts.threat-indicators.allowed-indicators')
        : `${$t('alerts.threat-indicators.allowed-indicators')} (${
            getIndicatorTabLength('whitelisted').length
          })`
    }
  ];
});

const getIndicatorTabLength = (tabId: string) => {
  return Object.keys(indicatorData.value ?? {}).reduce((acc: any[], key) => {
    const tabData = indicatorData.value[key]?.[tabId] || [];
    return acc.concat(tabData);
  }, []);
};

const getIndicatorData = (tabId: string) => {
  return [...allIocs, ...additionalIocs].filter(
    (key) => !isEmpty(indicatorData.value?.[key]?.[tabId])
  );
};

const fetchData = async () => {
  const data = await fetchRelatedAlerts({
    ...state.tableValue,
    ...(state.filter ?? {})
  });
  state.total = data.count;
  state.tableData = data.results.map((obj: Record<string, any>) => ({
    ...obj,
    category: obj.card_category.category_name,
    created: obj.created / 1000
  }));
};

const onSelectedTabChange = () => {
  onIocClick(props.selectedIoc, indicatorData.value[props.selectedIoc]?.[state.selectedTab][0]);
};

const onPageChange = (page: number, pageSize: number) => {
  state.tableValue.page = page;
  state.tableValue.page_size = pageSize;
  fetchData();
};

const onApplyFilter = (filters: Record<string, any>) => {
  state.tableValue.page = 1;
  state.filter = filters;
  fetchData();
};

const closeModal = () => {
  emit('close');
  state.searchQuery = '';
};

const onApplySearch = (filters: Record<string, any>) => {
  state.searchQuery = filters.q;
};

watch(
  () => props.showModal,
  (val) => {
    if (val) {
      state.iocValue = props.selectedIoc;
      if (indicatorData.value?.[props.selectedIoc]?.blacklisted?.length) {
        onIocClick(props.selectedIoc, indicatorData.value[props.selectedIoc]?.blacklisted[0]);
        state.selectedTab = 'blacklisted';
      } else if (indicatorData.value?.[props.selectedIoc]?.whitelisted?.length) {
        onIocClick(props.selectedIoc, indicatorData.value[props.selectedIoc]?.whitelisted[0]);
        state.selectedTab = 'whitelisted';
      }
    }
  },
  { deep: true }
);
</script>

<template>
  <cy-modal
    width="80%"
    :title="$t('alerts.labels.related-alerts')"
    v-bind="testId()"
    :value="props.showModal"
    @close="closeModal"
  >
    <template #modal-content="{ visible }">
      <div v-if="visible" class="cyw-flex">
        <div class="cyw-px-2 search-indicator-width">
          <CyFilter
            class="cyw-mt-5 cyw-w-100"
            v-bind="testId()"
            @apply="onApplySearch"
            type="basic"
          />
          <div class="cyw-mw-100">
            <cy-tab
              type="line"
              v-model="state.selectedTab"
              :data="indicatorTabs"
              size="sm"
              v-bind="testId()"
              @update:modelValue="onSelectedTabChange"
            />
            <CyAccordion
              class="search-indicator-height cyw-overflow-scroll cyw-m-2 accordion-border"
              v-model="state.iocValue"
              v-bind="testId(`${state.iocValue}`)"
            >
              <template v-for="(iocs, index) in getIndicatorData(state.selectedTab)">
                <CyAccordionItem
                  v-if="filteredIndicatorData?.[iocs]?.[state.selectedTab]?.length"
                  class="cyw-m-2 cyw-mw-100"
                  :name="iocs"
                  :key="index"
                  :title="iocs"
                  v-bind="testId(`${iocs}`)"
                >
                  <div
                    class="cyw-cursor-pointer cyw-flex-justify-between cyw-px-4"
                    v-for="(ioc, ind) in filteredIndicatorData[iocs][state.selectedTab]"
                    :key="ind"
                    :class="{
                      'cyw-bg-P100 cyw-color-P700 cyw-round-md':
                        state.tableValue.indicator_value === ioc,
                      'cyw-border-bottom':
                        ind !== filteredIndicatorData[iocs][state.selectedTab].length - 1
                    }"
                    @click="onIocClick(iocs, ioc)"
                  >
                    <CyExpandableTitle
                      v-bind="testId(`${iocs}`)"
                      :hideCopy="true"
                      :value="ioc"
                      class="cyw-w-75"
                    />
                    <p v-if="state.tableValue.indicator_value === ioc">{{ state.total }}</p>
                  </div>
                </CyAccordionItem></template
              >
            </CyAccordion>
          </div>
        </div>
        <div class="search-related-alerts-width cyw-bg-N50 cyw-p-5">
          <CyFilter v-bind="testId('apply')" @apply="onApplyFilter" type="basic" />
          <cy-table
            :pagination="{
              page: state.tableValue.page,
              pageSize: state.tableValue.page_size
            }"
            :total="state.total"
            :config="{
              selectable: false,
              customizable: false,
              showSort: false
            }"
            :columns="relatedAlertsColumn($t)"
            :max-height="300"
            :data="state.tableData"
            @page-change="onPageChange"
            v-bind="testId()"
            ><template #column-cell="{ row, column, $index }">
              <CyTag
                v-if="column.key === 'tlp'"
                type="tlp"
                :value="row[column.key]"
                v-bind="testId(`${$index}-${column.key}`)"
              >
              </CyTag>
              <a
                v-else-if="column.key === 'short_id'"
                @click.stop="openAlertDetailsView(row[column.key])"
                class="cyw-text-underline cyw-mr-3 cyw-cursor-pointer"
                v-bind="testId(`${$index}-${column.key}`)"
              >
                {{ row[column.key] }}
              </a>
              <CyDataRenderer
                v-else
                :config="column"
                :data="row"
                v-bind="testId(`${$index}-${column.key}`)"
              />
            </template>
          </cy-table>
        </div>
      </div>
    </template>
  </cy-modal>
</template>
<style lang="scss">
.search-indicator {
  &-width {
    width: 35%;
  }
  &-height {
    height: 40rem;
  }
}
.search-related-alerts-width {
  width: 65%;
}
.accordion-border {
  .cyw-accordion-item.is-expanded {
    border: none;
  }
}
</style>

<script setup lang="ts">
import { onMounted, reactive, inject, ref } from 'vue';
import { alertResponses } from './alertResponses';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { initTestId } from '@/utils/testid';

const testId = initTestId('ad', 'feedback');

const $api: any = inject('$api');

const props = defineProps({
  alertId: {
    default: ''
  }
});

const { fetchAlertFeedback, fetchAlertRating, exportFeedback } = alertResponses();
const { fetchFilters } = useAlertBasicsData();
const state = reactive({
  ratings: {} as Record<string, any>,
  responses: {} as Record<string, any>,
  filter: {} as Record<string, any>,
  filterOptions: [] as any,
  page: 1,
  value: 1,
  customColor: 'var(--O300)'
});

const fetchData = async () => {
  state.page = 1;
  const data = await fetchAlertFeedback({
    card_id: props.alertId,
    page: state.page,
    page_size: 10,
    ...state.filter
  });
  state.responses = {
    total: data.count,
    data: data.results
  };
};

const onApplyFilter = (event: any) => {
  state.filter = event;
  fetchData();
};

const loadMore = async () => {
  if (state.responses.total < state.page * 10) return;
  state.page += 1;
  const data = await fetchAlertFeedback({
    card_id: props.alertId,
    page: state.page,
    page_size: 10,
    ...state.filter
  });
  state.responses.data = [...state.responses?.data, ...data];
};

const calculatePercentage = (numerator: number, denominator: number) => {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
};

onMounted(async () => {
  state.ratings = await fetchAlertRating(props.alertId);
  fetchData();
  state.filterOptions = await fetchFilters('feedback');
});
</script>
<template id="feedback">
  <div id="alert-feedback" v-bind="testId()">
    <div class="cyw-flex-justify-between">
      <div class="cyw-text-f16 cyw-my-3">{{ $t('alerts.responses.alert-feedback') }}</div>

      <CyButton
        type="tertiary"
        class="cyw-flex-align-center"
        @click="exportFeedback(props.alertId)"
        :disabled="!state.responses.data?.length"
        v-bind="testId('export')"
      >
        <CyIcon icon="fa-regular fa-arrow-up-to-line" class="cyw-mr-3" />
        {{ $t('alerts.responses.feedback-export') }}
      </CyButton>
    </div>

    <div
      class="cyw-bg-N20 cyw-p-3 cyw-flex-justify-between cyw-round-lg ca-border-N200 cyw-border-1"
      v-bind="testId('ratings')"
    >
      <div class="ratings-width">
        <div class="cyw-bg-N10 cyw-py-5 cyw-px-4 cyw-round-lg cyw-shadow-100">
          <div class="cyw-flex-justify-around">
            <div>
              <div class="cyw-h1" v-bind="testId('likes')">
                {{ state.ratings?.likes }}
              </div>
              <div class="cyw-text-f14 cyw-ml-n5 cyw-flex-align-center">
                <CyIcon icon="fa-light fa-thumbs-up" class="cyw-text-f20 cyw-mr-3" />
                Likes
              </div>
            </div>

            <div>
              <div class="cyw-h1" v-bind="testId('dislikes')">
                {{ state.ratings?.dislikes }}
              </div>
              <div class="cyw-text-f14 cyw-ml-n5 cyw-flex-align-center">
                <CyIcon icon="fa-light fa-thumbs-down" class="cyw-text-f20 cyw-mr-3" />
                Dislikes
              </div>
            </div>
          </div>

          <hr class="cyw-w-100" />
          <div
            class="cyw-text-f12 cyw-color-N700 cyw-flex-justify-center"
            v-bind="testId('reader-count')"
          >
            Feedback from {{ state.ratings?.readers_count }} readers
          </div>
        </div>
        <div
          v-if="!!Object.keys(state.ratings)?.length"
          class="cyw-bg-N10 cyw-mt-3 cyw-py-5 cyw-px-4 cyw-round-lg cyw-shadow-100"
        >
          <div class="cyw-flex-justify-around cyw-flex-align-center">
            <div class="cyw-h1 cyw-mr-3" v-bind="testId('result-number')">
              {{ parseFloat(state.ratings?.final_result)?.toFixed(2) }}
            </div>
            <div class="ratings cyw-ml-n2" v-bind="testId('result-chart')">
              <el-rate v-model="state.ratings.final_result" disabled />
              <div
                class="cyw-text-f10 cyw-color-N700 cyw-flex-justify-center"
                v-bind="testId('engagement-responses')"
              >
                {{ state.ratings.engagement }}
                {{
                  state.ratings.engagement === 1
                    ? $t('alerts.feedback-page.single-rating')
                    : $t('alerts.feedback-page.multiple-ratings')
                }}
                &
                {{ state.responses.total }}
                {{
                  state.responses.total === 1
                    ? $t('alerts.feedback-page.single-comment')
                    : $t('alerts.feedback-page.multiple-comments')
                }}
              </div>
            </div>
          </div>
          <hr />
          <div class="cyw-flex-justify-center cyw-mt-4">
            <div
              class="cyw-mr-4"
              v-bind="testId(`relevance-chart-${state.ratings.card_relevance_avg}`)"
            >
              <el-progress
                v-if="state.ratings.card_relevance_avg != 0"
                type="circle"
                :stroke-width="10"
                :width="100"
                :percentage="calculatePercentage(state.ratings.card_relevance_avg, 5)"
                :color="state.customColor"
              >
                <template #default>
                  <div class="percentage-label cyw-text-f20 cyw-text-bold">
                    {{ state.ratings.card_relevance_avg }}
                  </div>
                </template>
              </el-progress>
              <div class="cyw-text-f12 cyw-mt-3 cyw-text-medium cyw-text-center">
                {{ $t('alerts.responses.feedback-relevancy') }}
              </div>
            </div>
            <div
              class="cyw-ml-4"
              v-bind="testId(`relevance-chart-${state.ratings.content_relevance_avg}`)"
            >
              <el-progress
                v-if="state.ratings.content_relevance_avg != 0"
                type="circle"
                :stroke-width="10"
                :width="100"
                :percentage="calculatePercentage(state.ratings.content_relevance_avg, 5)"
                :color="state.customColor"
              >
                <template #default>
                  <div class="percentage-label cyw-text-f20 cyw-text-bold">
                    {{ state.ratings.content_relevance_avg }}
                  </div>
                </template>
              </el-progress>
              <div class="cyw-text-f12 cyw-mt-3 cyw-text-medium cyw-text-center">
                {{ $t('alerts.responses.feedback-content') }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="cyw-w-75 cyw-px-5">
        <CyFilter
          v-bind="testId()"
          class="cyw-mt-5"
          :filters="state.filterOptions"
          :staticFilterCount="0"
          @apply="onApplyFilter"
          type="pro"
          :apiService="{
          api: $api.get,
          apiPrefix: 'admin/',
          getParams: (val: any, filter: Record<string,any>) => filter.filters
        }"
        />
        <response-list
          v-bind="testId()"
          :height="25"
          :keys="{ name: 'username', date: 'created', content: 'comment' }"
          :data="state.responses?.data || []"
          :busy="!state.response?.data?.length"
          :emptyMsg="$t('alerts.alert-details-empty-state.alert-feedback-description')"
          @loadMore="loadMore"
        >
          <template #additional-detail="{ data }">
            <CyTag
              :rounded="false"
              v-bind="testId(`${data.like === 1 ? 'up' : 'down'}`)"
              :text="
                data.like === 1
                  ? $t('alerts.responses.feedback-liked')
                  : $t('alerts.responses.feedback-disliked')
              "
              :prefixIcon="`cyicon-thumbs-${data.like === 1 ? 'up' : 'down'}`"
            />
            <CyTag :rounded="false">
              <span class="cyw-color-N900 cyw-text-medium cyw-mt-1" v-bind="testId('content')">{{
                data.content_relevance
              }}</span>
              <el-rate v-model="state.value" :max="1" />
              <span class="cyw-color-N900 cyw-text-medium cyw-mt-1">
                {{ $t('alerts.responses.feedback-content') }}
              </span>
            </CyTag>
            <CyTag :rounded="false">
              <span class="cyw-color-N900 cyw-text-medium cyw-mt-1" v-bind="testId(`relevancy`)">
                {{ data.card_relevance }}
              </span>
              <el-rate v-model="state.value" :max="1" />
              <span class="cyw-color-N900 cyw-text-medium cyw-mt-1">
                {{ $t('alerts.responses.feedback-relevancy') }}
              </span>
            </CyTag>
          </template>
        </response-list>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
#feedback {
  .ratings {
    &-width {
      max-width: 35%;
    }
    .el-rate {
      --el-rate-icon-size: 2.4rem !important;
    }
    &-star-color {
      color: var(--O300);
    }
  }
}
</style>

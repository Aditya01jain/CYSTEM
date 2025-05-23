<script lang="ts" setup>
import { defineAsyncComponent, reactive, watch } from 'vue';
import { formatDateTime } from '@/utils';
import { isEmpty } from 'lodash';
import { useRssFeedsData } from '@/composables/useRssFeedsData';
import { initTestId } from '@/utils/testid';
const RssFeedsShimmer = defineAsyncComponent(() => import('@/components/rss/RssFeedsShimmer.vue'));

const { fetchRssArticleData } = useRssFeedsData();
const testId = initTestId('rss', 'content');

const props = defineProps({
  selectedArticle: {
    type: Object,
    default: () => ({})
  },
  showEmptyState: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['create:alert']);

const state = reactive({
  details: {} as Record<string, any>,
  detailsLoading: true as boolean
});

async function fetchDetails(rss_id: string) {
  state.detailsLoading = true;
  const { data } = await fetchRssArticleData({ rss_id });
  state.details = data;
  state.detailsLoading = false;
}

watch(
  () => props.selectedArticle,
  async (article: Record<string, any>) => {
    if (isEmpty(article)) return;
    await fetchDetails(article?.rss_id);
  }
);

watch(
  () => props.showEmptyState,
  (value) => {
    if (value) state.detailsLoading = false;
  }
);
</script>

<template>
  <div v-bind="testId()" class="cyw-bg-N200 cyw-h-100 cyw-p-5">
    <div class="cyw-bg-N10 cyw-h-100 cyw-p-5 cyw-round-lg cyw-border-1">
      <RssFeedsShimmer v-if="state.detailsLoading" type="content" />
      <cy-empty-state
        v-else-if="props.showEmptyState || isEmpty(state.details)"
        type="oops"
        :message="{ title: $t('rss-feeds-revamp.search-result_none.no-results-found') }"
      />
      <div class="cyw-flex-col cyw-h-100" v-else>
        <div class="cyw-flex-justify-between">
          <div v-bind="testId('title')" class="cyw-w-75 cyw-h2 cyw-color-N900 cyw-text-medium">
            {{ state.details?.title }}
          </div>
          <div class="cyw-w-25">
            <div class="cyw-flex-justify-end cyw-flex-align-center">
              <!-- <CyIconShell v-bind="testId('bookmark')" size="md">
                  <CyIcon icon="fa-regular fa-bookmark" />
                </CyIconShell> required later -->
              <CyButton
                v-bind="testId('create-alert')"
                class="cyw-ml-4"
                @click="emit('create:alert', state.details)"
              >
                {{ $t('rss-feeds-revamp.create-alert.title') }}
              </CyButton>
            </div>
          </div>
        </div>
        <div v-bind="testId('published-date')" class="cyw-text-f12 cyw-color-N600 cyw-mt-3">
          {{ formatDateTime(state.details?.published_date) }}
        </div>
        <div class="cyw-overflow-y-auto cyw-mt-5 cyw-flex-grow-1 cyw-h-auto">
          <div v-bind="testId('image')" v-if="state.details?.image" class="cyw-mb-5">
            <img :src="state.details?.image" />
          </div>
          <div v-bind="testId('details')" class="cyw-text-f14 cyw-color-N800">
            <cy-sanitize-html :text="state.details?.content" />
            <a
              v-bind="testId('source-link')"
              v-if="state.details?.link"
              class="cyw-text-nolink cyw-text-medium cyw-color-P600"
              :href="state.details?.link"
              target="_blank"
            >
              {{ $t('rss-feeds-revamp.button.view-source') }}
              <CyIcon v-bind="testId('source-link-icon')" icon="fa-regular fa-arrow-right" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

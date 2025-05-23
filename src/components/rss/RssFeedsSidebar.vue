<script lang="ts" setup>
import { reactive, defineAsyncComponent, onMounted, inject, ref, nextTick } from 'vue';
import { formatDate, defaultDateFilter } from '@/utils';
import { useRssFeedsData } from '@/composables/useRssFeedsData';
import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { debounce } from 'lodash';
import { initTestId } from '@/utils/testid';
const RssFeedsShimmer = defineAsyncComponent(() => import('@/components/rss/RssFeedsShimmer.vue'));

const { fetchRssArticles } = useRssFeedsData();
const { fetchFilters } = useAlertBasicsData();
const testId = initTestId('rss', 'side-bar');
const $api: any = inject('$api');

const debouncedApplyFilter = debounce(onApplyFilter, 200);
const DEFAULT_FILTER = defaultDateFilter('start', 'end');

const emit = defineEmits(['article:clicked', 'selected:articles', 'merge:createAlert']);

const state = reactive({
  articleList: [] as Array<Record<string, any>>,
  filterOptions: [] as Array<Record<string, any>>,
  selectedArticles: [] as Array<string>,
  clickedArticle: {} as Record<string, any>,
  filterValue: {} as Record<string, any>,
  selectFirst: true as boolean,
  loading: true as boolean,
  nextPage: 1 as number
});

const filterRef = ref();

async function fetchArticles() {
  if (!state.nextPage) return;
  state.loading = true;
  const { results, link } = await fetchRssArticles({
    // bookmarked: props.bookmarked,
    page: state.nextPage,
    ...(state.filterValue ?? {})
  });
  state.articleList = [...state.articleList, ...results];
  state.loading = false;
  state.nextPage = link.next ? state.nextPage + 1 : 0;

  if (state.selectFirst) {
    if (state.articleList?.length) {
      onArticleClick(state.articleList?.[0]);
      state.selectFirst = false;
    } else {
      emit('article:clicked', {});
    }
  }
}

function onApplyFilter(event: Record<string, any>) {
  state.filterValue = event;
  state.articleList = [];
  state.nextPage = 1;
  fetchArticles();
}

function onArticleClick(article: Record<string, any>) {
  state.clickedArticle = article;
  emit('article:clicked', article);
}

function onAllCheckbox(value: boolean, article: any) {
  value
    ? state.selectedArticles.push(article.rss_id)
    : state.selectedArticles.splice(state.selectedArticles.indexOf(article.rss_id), 1);
  emit('selected:articles', state.selectedArticles);
}

function isCheckboxDisabled(rss_id: string) {
  return !state.selectedArticles.includes(rss_id) && state.selectedArticles?.length >= 5;
}

function getParams(_: any, filter: Record<string, any>) {
  filter.filters['is_active'] = true;
  if (filter.key === 'feed_id')
    filter.filters['category_id'] = state.filterValue.rss_feed_category || '';
  return filter.filters;
}

function getNextLink(data: Record<string, any>, _: any) {
  const url = data.link.next;
  return url.split('/api/')[1];
}

onMounted(async () => {
  state.filterOptions = await fetchFilters('rss-feed');
  await nextTick(() => {
    filterRef.value?.setDefaultValues({ ...DEFAULT_FILTER });
    onApplyFilter(DEFAULT_FILTER);
  });
});
</script>

<template>
  <div class="cyw-py-3 cyw-my-3 cyw-px-4">
    <cy-filter
      ref="filterRef"
      v-bind="testId()"
      :filters="state.filterOptions"
      :staticFilterCount="3"
      :defaultValue="DEFAULT_FILTER"
      :apiService="{
        api: $api.get,
        getNextLink: getNextLink,
        getParams: getParams
      }"
      type="pro"
      :config="{
        searchPlaceholder: $t('rss-feeds.all-feeds-page.search-placeholder'),
        searchClass: 'rss-feeds__search-bar cyw-ml-2 cyw-mb-4'
      }"
      @apply="debouncedApplyFilter"
    />
    <div class="cyw-px-4 cyw-mx-2 cyw-flex-align-center">
      <CyCheckbox
        v-if="state.selectedArticles?.length"
        class="cyw-mr-4 cyw-pt-3 cyw-text-f12 cyw-color-N700"
        v-bind="testId('total-selected-articles')"
        all-selected
        @update:modelValue="
          state.selectedArticles = [];
          emit('selected:articles', state.selectedArticles);
        "
      >
        {{
          `${state.selectedArticles?.length} ${$t(
            state.selectedArticles?.length === 1
              ? 'rss-feeds-revamp.articles-selection.single-selection-message'
              : 'rss-feeds.combined-alert.articles-selected'
          )}`
        }}
      </CyCheckbox>
      <cy-button
        v-if="state.selectedArticles?.length > 1"
        v-bind="testId('merge-articles-to-alert')"
        class="cyw-mt-2"
        @click="emit('merge:createAlert')"
      >
        {{ $t('rss-feeds.combined-alert.create-alert-button') }}
      </cy-button>
    </div>
  </div>

  <cy-height-wrapper
    class="cyw-h-auto cyw-flex-grow-1 cyw-px-4 cyw-pb-5"
    :busy="state.loading"
    @bottom="fetchArticles"
    v-bind="testId()"
  >
    <div
      v-for="(article, index) in state.articleList"
      v-bind="testId(`articles-${index}`)"
      :key="article.rss_id"
      class="cyw-px-4 cyw-py-3 cyw-mx-2 cyw-my-3 cyw-cursor-pointer cyw-flex-align-start cyw-round-lg rss-feeds__card"
      @click="onArticleClick(article)"
      :class="{
        'cyw-border-1 rss-feeds__card-clicked cyw-bg-N50':
          state.clickedArticle.rss_id === article.rss_id
      }"
    >
      <cy-tooltip
        :disabled="!isCheckboxDisabled(article.rss_id)"
        :content="$t('rss-feeds.combined-alerts.maximum-selection-toaster')"
        placement="top"
      >
        <CyCheckbox
          v-bind="testId(`articles-${index}-select`)"
          :disabled="isCheckboxDisabled(article.rss_id)"
          class="cyw-mr-4 cyw-pt-3"
          :modelValue="state.selectedArticles.includes(article.rss_id)"
          @update:modelValue="onAllCheckbox($event, article)"
          @click.stop
        />
      </cy-tooltip>
      <div>
        <div
          v-bind="testId(`articles-${index}-title`)"
          class="cyw-text-f14 cyw-color-N900 cyw-text-medium"
        >
          {{ article.title }}
        </div>
        <!-- meta data -->
        <div class="cyw-flex cyw-text-f12 cyw-color-N600 cyw-my-3">
          <div v-bind="testId(`articles-${index}-date`)">
            {{ formatDate(article.published_date) }}
          </div>
          <!-- <div
            v-bind="testId(`articles-${index}-bookmarked`)"
            v-if="article.is_bookmark"
            class="cyw-ml-3 cyw-border-left-1 cyw-pl-3 cyw-flex"
          >
            <CyIcon icon="fa-regular fa-bookmark" class="cyw-p-2 cyw-text-f10 cyw-mr-2" />
            Bookmarked
          </div> required later -->
        </div>
        <!-- source data -->
        <div
          v-bind="testId(`articles-${index}-feed-source`)"
          class="cyw-flex cyw-text-f12 cyw-color-N800"
        >
          <div class="cyw-flex-align-center cyw-pr-3 rss-feeds__card_source">
            <img
              v-if="article?.feed?.image || article?.feed?.rss_image"
              v-bind="testId(`articles-${index}-feed-img`)"
              :src="article.feed.image || article?.feed?.rss_image"
              class="cyw-mr-3 rss-feeds__card_source_image"
            />
            <div :class="{ 'rss-feeds__card_source_name': article?.feed?.image }">
              <cy-expandable-title
                v-bind="testId(`articles-${index}-feed-name`)"
                :value="article?.feed?.feed_name"
                :offset="300"
                hideCopy
              />
            </div>
          </div>
          <div class="cyw-border-left-1 cyw-pl-3">
            <div
              v-bind="testId(`articles-${index}-feed-category`)"
              class="cyw-border-1 cyw-round-md cyw-px-2 cyw-py-1 cyw-text-medium"
            >
              {{ article?.feed?.category?.category_name }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!state.articleList.length && !state.loading" class="cyw-flex-align-center cyw-h-100">
      <cy-empty-state
        v-bind="testId()"
        size="lg"
        type="search"
        :message="{
          title: $t('rss-feeds-revamp.search-result_none.no-results-found'),
          description: $t('rss-feeds-revamp.search-result_none.your-search-didnt-return')
        }"
      >
        <template #default>
          <br />
          <cy-button @click="onApplyFilter(state.filterValue)">
            {{ $t('rss-feeds-revamp.search-result_none.search-again') }}
          </cy-button>
        </template>
      </cy-empty-state>
    </div>
    <div v-if="state.loading">
      <RssFeedsShimmer />
    </div>
  </cy-height-wrapper>
</template>

<style lang="scss">
.rss-feeds {
  &__card {
    &-clicked {
      border-color: var(--P500);
    }
    &:hover {
      background-color: var(--N50) !important;
    }
    &_source {
      max-width: 15rem;
      &_image {
        width: 2rem;
        height: 2rem;
      }
      &_name {
        width: calc(100% - 2rem);
      }
    }
  }
  &__search-bar {
    width: 37rem !important;
  }
}
</style>

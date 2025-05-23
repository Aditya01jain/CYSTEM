<script setup lang="ts">
import router from '@/router';
import { reactive, defineAsyncComponent, inject, computed, onBeforeMount } from 'vue';
import { isEmpty } from 'lodash';
import { useStore } from '@/store';
import { initTestId } from '@/utils/testid';
const testId = initTestId('rss');

import { useAlertBasicsData } from '@/composables/useAlertBasicsData';
import { useCommonData } from '@/composables/useCommonData';
import { useRssFeedsData } from '@/composables/useRssFeedsData';

const RssFeedsSidebar = defineAsyncComponent(() => import('@/components/rss/RssFeedsSidebar.vue'));
const RssFeedsContent = defineAsyncComponent(() => import('@/components/rss/RssFeedsContent.vue'));
const store: Record<string, any> = useStore();
const $session: any = inject('$session');
const { fetchUserDetails, isFlagAccessableToTenant } = useCommonData();
const { fetchUserGroups, fetchAlertCategories } = useAlertBasicsData();
const { mergeRssFeedsData } = useRssFeedsData();

const state = reactive({
  viewArticle: { notEmpty: {} } as Record<string, any>,
  selectedArticles: [] as string[],
  mergedRssData: {} as Record<string, any>
});

const tlp = computed(() => {
  const tlp_version = store.getters['common/getTenantDetails']?.tlp_version || 'v1';
  return tlp_version === 'v2' ? 'CLEAR' : 'WHITE';
});

const allUserGroups = computed(() => {
  return store.getters['alertCreate/getAlertFormListData']['user-groups'] || [];
});

const cardGroups = computed(() => {
  const groups = allUserGroups.value?.length
    ? allUserGroups.value.filter(
        (group: Record<string, any>) =>
          group.group_tlp &&
          group.group_tlp.toLowerCase() === (tlp.value === 'CLEAR' ? 'clear' : 'white') &&
          group.group_type === 'ALL'
      )
    : [];
  return groups;
});

const cardCategory = computed(() => {
  const allCategories = store.getters['alertCreate/getAlertFormListData']['category-list'] || [];
  return allCategories.find((cat: Record<string, any>) => {
    return cat.category_name === 'RSS Alerts';
  });
});

function filterSelectedArticle() {
  let finalData: Record<string, any> = {};
  state.selectedArticles.forEach((rss_id: string) => {
    finalData = { ...finalData, [rss_id]: state.mergedRssData[rss_id] };
  });
  state.mergedRssData = finalData;
}

function buildSourceUrls(details: Record<string, any>) {
  return Object.entries(details).map(([_, item], index: number) => ({
    idx: index + 1,
    source: {
      source_url_name: item?.feed_name || item?.source_name || ''
    },
    url: item.link
  }));
}

function makeSingleAlertData(details: Record<string, any>) {
  const { rss_id, title, content, link, feed } = details;
  return {
    [rss_id]: {
      title,
      link,
      source_name: feed?.feed_name,
      content: content
    }
  };
}

function buildAlertPayload(rssDetails: Record<string, any>, bulkAction = true) {
  const details = bulkAction ? state.mergedRssData : makeSingleAlertData(rssDetails);
  let alertContent = '';
  let alertTitle = '';
  if (bulkAction) {
    filterSelectedArticle();
    alertContent = Object.values(details)
      ?.map(
        ({ title, content, link }) =>
          `<h4 style="font-size:16px;font-weight: 600;">${title}</h4>
           <p class="cyw-text-f14 cyw-mt-3">${content} <a href="${link}" target="_blank">See More</a></p>`
      )
      ?.join('<br/>');
  } else {
    const { title, content } = Object.values(details)?.[0];
    alertTitle = title;
    alertContent = content;
  }
  const cardGroupsValue = cardGroups.value;
  const sourceUrls = buildSourceUrls(details);
  return {
    title: alertTitle,
    content: alertContent,
    tlp: tlp.value,
    card_group: cardGroupsValue,
    card_category: cardCategory.value,
    push_notification_group: isFlagAccessableToTenant('global_push_notification')
      ? cardGroupsValue
      : [],
    email_notification_group: isFlagAccessableToTenant('global_email_alert') ? cardGroupsValue : [],
    source_urls: sourceUrls
  };
}

function createAlert(details: Record<string, any> = {}, bulkAction = true) {
  const payload = buildAlertPayload(details, bulkAction);
  if ($session?.createMultiFeedAlert) {
    $session?.createMultiFeedAlert(payload);
  } else {
    store.dispatch('alertCreate/setAlertForm', payload);
    router?.push({ name: 'alertCreateForm' });
  }
}

async function mergeRssAndCreateAlert() {
  const response = await mergeRssFeedsData({
    feed_id_list: state.selectedArticles
  });
  state.mergedRssData = response?.data || [];
  createAlert({}, true);
}

onBeforeMount(() => {
  fetchUserDetails();
  fetchUserGroups();
  fetchAlertCategories();
});
</script>

<template>
  <div class="rss-feeds cyw-h-100">
    <div class="rss-feeds__topbar cyw-flex-align-center cyw-px-4 cyw-pt-4 cyw-border-bottom-1">
      <div
        v-bind="testId('page-header')"
        class="cyw-text-f20 cyw-text-bold cyw-color-N800 cyw-pb-3"
      >
        {{ $t('rss-feeds.all-feeds-page.module-name') }}
      </div>
    </div>
    <div class="rss-feeds__layout cyw-overflow-hidden cyw-flex">
      <div class="cyw-w-25 cyw-border-right-1 cyw-flex-col">
        <RssFeedsSidebar
          @article:clicked="state.viewArticle = $event"
          @selected:articles="state.selectedArticles = $event"
          @merge:createAlert="mergeRssAndCreateAlert()"
        />
      </div>
      <div class="cyw-w-75">
        <RssFeedsContent
          :selectedArticle="state.viewArticle"
          :showEmptyState="isEmpty(state.viewArticle)"
          @create:alert="createAlert($event, false)"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.rss-feeds {
  &__topbar {
    height: 6rem;
  }
  &__layout {
    height: calc(100% - 6rem);
  }
}
</style>

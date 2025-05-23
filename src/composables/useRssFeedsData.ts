import { inject } from 'vue';

export const useRssFeedsData = () => {
  const $api: any = inject('$api');

  const fetchRssArticles = async (params = {}) => {
    try {
      const { data } = await $api.get('analyst.rssarticles', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  const fetchRssArticleData = async (params: Object) => {
    try {
      const { status, data } = await $api.get('analyst.rss_article_data', {
        params: params
      });
      return { status, data };
    } catch (error) {
      return { status: false, error };
    }
  };

  const mergeRssFeedsData = async (payload: Object) => {
    try {
      const { status, data } = await $api.post('analyst.merge_rss_data', payload);
      return { status, data };
    } catch (error) {
      return { status: false, error };
    }
  };

  return {
    fetchRssArticles,
    fetchRssArticleData,
    mergeRssFeedsData
  };
};

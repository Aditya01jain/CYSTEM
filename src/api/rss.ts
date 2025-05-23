const BASE_API = 'admin/feeds/';

export default {
  rssarticles: {
    api: `${BASE_API}rss_feed_data/`
  },
  rss_article_data: {
    api: `${BASE_API}rss_feed_data_detail/`
  },
  merge_rss_data: {
    api: `admin/bulk-feeds-detail/`
  }
};

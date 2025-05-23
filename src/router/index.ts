import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    redirect: '/situational-awareness'
  },
  {
    path: '/situational-awareness',
    name: 'alertList',
    meta: { title: 'Alerts' },
    component: () => import('../views/alert/AlertListView.vue')
  },
  {
    path: '/situational-awareness/details/:shortid?/',
    name: 'AlertDetails',
    meta: { title: 'Alert Details' },
    component: () => import('../components/alert/AlertDetailsModal.vue')
  },
  {
    path: '/situational-awareness/create/:shortid?/',
    name: 'alertCreateForm',
    meta: { title: 'Create Alert' },
    component: () => import('../views/alert/AlertCreateForm.vue')
  },
  {
    path: '/reports/intel-reporting',
    name: 'intelList',
    meta: { title: 'Cyber Threat Intel' },
    component: () => import('../components/incident/IncidentListTable.vue')
  },
  {
    path: '/rss-feeds',
    name: 'rssFeeds',
    meta: { title: 'RSS Feeds' },
    component: () => import('../views/rss/RssFeedsView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Add beforeEach hook
router?.beforeEach((to, from, next) => {
  next();
  document.title =
    to.meta && to.meta.title ? `${to.meta.title} | Cyware Enterprise` : 'Cyware Enterprise';
});

// Add afterEach hook
router?.afterEach((to, from) => {
  // console.log("After each route navigation");
});

export default router;

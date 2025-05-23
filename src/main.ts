import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import store from '@/store';
import { i18n } from '@/i18n';
import apiService from '@cyware/cy-frontend-framework-v3/apiService';
import { Theme } from '@cyware/cy-frontend-framework-v3/theme';
import '@cyware/cy-frontend-framework-v3/index.css';
import '@cyware/cyware-icons/style.css';
import '@/assets/styles/main.scss';
import analyst from '@/api/analyst';
import { isEmpty } from 'lodash';
const CyToaster = await import('@cyware/cy-frontend-framework-v3/components/toaster/index');
import './icons';
import { handleError } from '@/utils';
import { createPinia } from 'pinia';

const app = createApp(App);
const theme = new Theme('light');

const $toast: Function | undefined = CyToaster.default;
const $notify: Record<string, any> = $toast?.({
  type: 'card',
  placement: 'bottom-left'
});
const callback = handleError($notify)
const $api = apiService({
  apiServices: JSON.parse(import.meta.env.VITE_API_SERVICES),
  tokenPrefix: 'Token',
  config: { analyst }
}, callback);

app.provide('$session', { callUserDetails: true})
app.provide('isEmpty', isEmpty);
app.provide('$api', $api);
app.provide('theme', theme);
app.provide('$notify', $notify);
app.use(createPinia());
app.use(i18n);
app.use(store).use(router).mount('#app');

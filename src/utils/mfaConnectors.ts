import { createApp, type Component } from 'vue';
import apiService from '@cyware/cy-frontend-framework-v3/apiService';
import { Theme } from '@cyware/cy-frontend-framework-v3/theme';
import store from '@/store';
import '@cyware/cy-frontend-framework-v3/index.css';
import '@/assets/styles/main.scss';
import '@cyware/cyware-icons/style.css';
import analyst from '@/api/analyst';
import { i18n } from '@/i18n';
import './icons';
import { isEmpty } from 'lodash';
const CyToaster = await import('@cyware/cy-frontend-framework-v3/components/toaster/index');
import { handleError } from '@/utils';
import { createPinia } from 'pinia';

export async function initApp(
  id: string,
  options: {
    apiServices: Record<string, any>;
    component: Component;
    use?: Array<any>;
    props?: Record<string, any>;
  }
) {
  const theme = options.props?.initTheme || new Theme(options.props?.theme?.skin);
  const app = createApp(options.component, options?.props);
  if (options.use) {
    for (const component of options.use) {
      app.use(component);
    }
  }
  const $session: Record<string, any> = options.props?.session || {};
  const $permissions: Record<string, any> = options.props?.permissions || {};
  const $toast: Function | undefined = CyToaster.default;
  const $notify: Record<string, any> = $toast?.({
    type: 'card',
    placement: 'bottom-left'
  });
  const callback = handleError($notify)
  const $api = apiService({
    apiServices: options.apiServices,
    tokenPrefix: 'Token',
    config: { analyst }
  }, callback);


  app.provide('theme', theme);
  app.provide('$api', $api);
  app.provide('$session', $session);
  app.provide('$permissions', $permissions);
  app.provide('$notify', $notify);
  app.provide('isEmpty', isEmpty);
  app.use(createPinia());
  app.use(i18n);
  app.use(store).mount(`#${id}`);
  return app;
}

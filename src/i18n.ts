import { createI18n } from 'vue-i18n';
import ALERTS from '../ditto/alerts__base.json';
import RSS from '../ditto/rss-feeds-revamp__base.json';

function loadLocaleMessages() {
  const messages: any = { en: { ...ALERTS, ...RSS } };
  return messages;
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: loadLocaleMessages()
});

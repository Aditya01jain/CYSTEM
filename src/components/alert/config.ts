import store from '@/store';
import moment from 'moment';
import { useCommonData } from '@/composables/useCommonData';

const { isPermittedToMe } = useCommonData();

const isAllowedCreateAlert = () => {
  return (
    isPermittedToMe('draft', 'sa') ||
    isPermittedToMe('submitted', 'sa') ||
    isPermittedToMe('scheduled', 'sa') ||
    isPermittedToMe('published', 'sa')
  );
};

const showCopyButton = function (row: Record<string, any>) {
  return (
    ['PUBLISHED', 'EXPIRED'].includes(row.status) && !row.destructed_card && isAllowedCreateAlert()
  );
};

const showUpdateButton = function (row: Record<string, any>) {
  return (
    row.status === 'PUBLISHED' &&
    row.show_update_btn &&
    isPermittedToMe('published', 'sa') &&
    isAllowedCreateAlert()
  );
};

const isEditAllowed = function (published_time: number) {
  const userDetails = store.getters['common/getUserDetails'];
  const deadlineTime = userDetails.tenat?.alert_edit_deadline_time || 60;
  return moment().diff(moment(published_time * 1000), 'minutes') <= deadlineTime;
};

const isAlertLocked = (data: any) => {
  const userDetails = store.getters['common/getUserDetails'];
  if (data?.editor_details === null) return false;
  return data?.editor_details?.user.user_id !== userDetails?.user_id;
};

const showEditButton = function (row: Record<string, any>) {
  if (row.status === 'PUBLISHED') return isEditAllowed(row.published_time);
  if (['DRAFT', 'SUBMITTED'].includes(row.status)) return !isAlertLocked(row);
  return !(row.status == 'EXPIRED') && isAllowedCreateAlert();
};

const showAppPushButton = function (row: Record<string, any>) {
  return (
    !row.push_required &&
    !row.self_destruction &&
    isPermittedToMe('published', 'sa') &&
    row.status === 'PUBLISHED'
  );
};

const showEmailPushButton = function (row: Record<string, any>) {
  return (
    !row.push_email_notification &&
    !row.self_destruction &&
    isPermittedToMe('published', 'sa') &&
    row.status === 'PUBLISHED'
  );
};

const showExportButton = function (row: Record<string, any>) {
  return row.status === 'PUBLISHED';
};

const showCommunitySharing = function (row: Record<string, any>) {
  return (
    isPermittedToMe('published', 'sa') &&
    row.status === 'PUBLISHED' &&
    isPermittedToMe('view', 'entity_sharing')
  );
};

const showExpireButton = function (row: Record<string, any>) {
  return (
    !row.self_destruction &&
    ((isPermittedToMe('expired', 'sa') && row.status !== 'PUBLISHED') ||
      (isPermittedToMe('expire_published', 'sa') && row.status === 'PUBLISHED')) &&
    row.status !== 'EXPIRED' &&
    row.show_update_btn &&
    !isAlertLocked(row)
  );
};

export const ALERT_TAB_LIST: Record<string, any>[] = [
  {
    id: 'alerts',
    title: 'Alerts',
    permissions: 'sa'
  },
  {
    id: 'incident',
    title: 'Intel Submissions',
    permissions: 'intel_report'
  },
  {
    id: 'rfi',
    title: 'Request for Info',
    permissions: 'rfi'
  }
];

export const ALERT_LIST_COLUMNS = ($t: any): Record<string, any> => [
  {
    key: 'short_id',
    label: $t('alerts.listing-page.alert-id-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 110
  },
  {
    key: 'title',
    label: $t('alerts.listing-page.title-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 290
  },
  {
    key: 'tlp',
    label: $t('alerts.listing-page.tlp-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 160
  },
  {
    key: 'card_category',
    label: $t('alerts.listing-page.category-column'),
    type: 'object',
    childKey: 'category_name',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 170
  },
  {
    key: 'publisher',
    label: $t('alerts.listing-page.publisher-column'),
    type: 'object',
    childKey: 'full_name',
    is_display: true,
    noedit: true,
    fixed: true,
    minwidth: 135
  },
  {
    key: 'modified',
    label: $t('alerts.listing-page.modified-date-column'),
    type: 'date',
    is_display: true,
    noedit: true,
    fixed: true,
    sort: true,
    minwidth: 170
  },
  {
    key: 'status',
    label: $t('alerts.listing-page.status-column'),
    type: 'string',
    is_display: true,
    noedit: true,
    fixed: true,
    minwidth: 150
  },
  {
    key: 'push_required',
    label: $t('alerts.listing-page.mobile'),
    type: 'boolean',
    is_display: true,
    noedit: true,
    fixed: true,
    minwidth: 80
  },
  {
    key: 'push_email_notification',
    label: $t('alerts.laisting-page.email'),
    type: 'boolean',
    is_display: true,
    noedit: true,
    fixed: true,
    minwidth: 60
  }
];

export const ALERT_STATUS_MAP: Record<string, any> = {
  PUBLISHED: 'success',
  EXPIRED: 'error',
  DRAFT: 'warning',
  REVERTED: 'error',
  SUBMITTED: 'progress',
  SCHEDULED: 'warning'
};

export const ALERT_ROW_ACTIONS = ($t: any): Record<string, any> => ({
  view: {
    label: $t('alerts.options.view'),
    icon: 'fa-duotone fa-light fa-eye',
    showIf: (row: any) => {
      return ['PUBLISHED', 'EXPIRED'].includes(row?.status);
    }
  },
  edit: {
    label: $t('alerts.options.edit'),
    icon: 'fa-regular fa-pen',
    showIf: showEditButton
  },
  alertLocked: {
    label: $t('alerts.options.alert-locked'),
    icon: 'fa-regular fa-lock',
    showIf: isAlertLocked
  },
  update: {
    label: $t('alerts.options.update'),
    icon: 'fa-regular fa-rotate-right',
    showIf: showUpdateButton
  },
  clone: {
    label: $t('alerts.options.clone'),
    icon: 'fa-light fa-copy',
    showIf: showCopyButton
  },
  expire: {
    label: $t('alerts.options.expire'),
    icon: 'fa-light fa-diamond-exclamation',
    showIf: showExpireButton
  },
  copyUrlAnalyst: {
    label: $t('alerts.options.copy-url-for-analysts'),
    icon: 'fa-regular fa-link-simple',
    showDivider: false
  },
  copyUrlMember: {
    label: $t('alerts.options.copy-url-for-members'),
    icon: 'fa-regular fa-link-simple',
    showDivider: true,
    showIf: (row: any) => {
      return ['PUBLISHED'].includes(row?.status);
    }
  },
  communitySharing: {
    label: $t('alerts.options.community-sharing'),
    icon: 'fa-light fa-user-group',
    showIf: showCommunitySharing
  },
  notifyMobile: {
    label: $t('alerts.labels.send-mobile-notification'),
    icon: 'fa-regular fa-mobile',
    showIf: showAppPushButton
  },
  notifyEmail: {
    label: $t('alerts.labels.send-email-notification'),
    icon: 'fa-regular fa-envelope',
    showIf: showEmailPushButton
  },
  onExportJson: {
    label: $t('alerts.options.export-as-json'),
    icon: 'fa-kit fa-json-regular',
    iconClass: 'cyw-text-f16',
    showIf: showExportButton
  },
  onExportXml: {
    label: $t('alerts.options.export-as-xml-1'),
    icon: 'fa-kit fa-xml-regular',
    iconClass: 'cyw-text-f16',
    showIf: showExportButton
  },
  print: {
    label: $t('alerts.options.print'),
    icon: 'fa-regular fa-print',
    showIf: (row: Record<string, any>) => row.status === 'PUBLISHED'
  }
});

export const ALERT_BULK_ACTIONS = ($t: any): Record<string, any> => ({
  expire: {
    label: $t('alerts.options.expire'),
    props: {
      maxSelectionLimit: 100,
      limitMsg: $t('alerts.tooltip.expire-limit'),
      saveSelectionOnClick: true
    }
  }
});

export const ALERT_EXPORT_OPTIONS = ($t: any): Record<string, any> => [
  {
    label: $t('alerts.options.export-as-csv'),
    key: 'csv'
  },
  {
    label: $t('alerts.options.export-as-xml-1'),
    key: 'xml'
  },
  {
    label: $t('alerts.options.export-as-json'),
    key: 'json'
  }
];

export const ALERT_DETAILS_TABS = ($t: any): Record<string, any>[] => [
  {
    id: 'alertdetails',
    title: $t('alerts.publish-alert-pop-up.alert-details-section'),
    disabled: false
  },
  {
    id: 'sendingoptions',
    title: $t('alerts.alert-form.sending-options-header'),
    disabled: false
  },
  {
    id: 'responses',
    title: $t('alerts.alert-details-tab.responses'),
    disabled: false
  }
];

export const ALERT_TEMPLATE_COLUMNS = ($t: any): Record<string, any>[] => [
  {
    key: 'template_name',
    minwidth: 300,
    label: $t('alerts.listing-page.title-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true
  },
  {
    key: 'tlp',
    label: $t('alerts.listing-page.tlp-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 160
  },
  {
    key: 'category',
    minwidth: 200,
    label: $t('alerts.listing-page.category-column'),
    type: 'string',
    fixed: true,
    noedit: true,
    is_display: true
  },
  {
    key: 'modified',
    label: $t('alerts.listing-page.modified-date-column'),
    type: 'date',
    is_display: true,
    noedit: true,
    fixed: true,
    minwidth: 200,
    sort: true
  }
];

export const ALERT_FILTERS = ($t: any): Record<string, any>[] => [
  {
    label: $t('alerts.listing-page.modified-date-column'),
    key: 'modified_date',
    type: 'daterange',
    start_key: 'modified_start',
    end_key: 'modified_end'
  }
];

export const ALERT_META_DATA_LIST = ($t: any): Record<string, any> => [
  {
    key: 'short_id',
    label: $t('alerts.listing-page.alert-id-column'),
    type: 'string',
    showIf: (data: Record<string, any>) => data.short_id
  },
  {
    key: 'tlp',
    label: '',
    type: 'tlp'
  },
  {
    key: 'card_category',
    label: $t('alerts.listing-page.category-column'),
    type: 'object',
    childKey: 'category_name',
    tooltipKey: 'description'
  },
  {
    key: 'analyst_groups',
    label: $t('alerts.labels.analyst-groups'),
    type: 'tag-list',
    childKey: 'name'
  },
  {
    key: 'modified',
    label: $t('alerts.metadata.last-updated-on'),
    type: 'string',
    showIf: (data: Record<string, any>) => data.short_id
  },
  {
    key: 'published_time',
    label: $t('alerts.metadata.published-on'),
    type: 'date',
    showIf: (data: Record<string, any>) => data.short_id
  },
  {
    key: 'previous_base_card',
    label: $t('alerts.alert-metadata.previous-alert-id'),
    type: 'array',
    showIf: (data: Record<string, any>) => data.previous_base_card?.length
  },
  {
    key: 'creator',
    label: $t('alerts.metadata.created-by'),
    type: 'object',
    childKey: 'full_name',
    showIf: (data: Record<string, any>) => data.short_id
  },
  {
    key: 'created',
    label: $t('alerts.metadata.created-on'),
    type: 'date',
    showIf: (data: Record<string, any>) => data.short_id
  },
  {
    key: 'card_tag',
    label: $t('alerts.metadata.tags'),
    type: 'tags'
  }
];

export const IMAGE_OPTIONS_MAP: Record<string, any> = {
  new_image: 0,
  default_image: 1,
  category_image: 2,
  do_not_show_image: 3,
  uploaded_image: 4
};

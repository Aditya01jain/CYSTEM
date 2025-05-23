export const RECIPIENT_GROUP_TYPE = ($t: any): Record<string, any>[] => [
  {
    id: 'public',
    name: $t('alerts.group-type.public-groups')
  },
  {
    id: 'invite-only',
    name: $t('alerts.rg-type.invite-only-label')
  },
  {
    id: 'system',
    name: $t('alerts.rg-type.system-groups-label')
  },
  {
    id: 'org',
    name: $t('alerts.options.org-based-groups')
  }
];

export const THIRD_PARTY_APPS = ($t: any): Record<string, any>[] => [
  {
    title: $t('alerts.post-to-other-apps.threatstream'),
    model_param: 'post_threat_stream',
    flag: 'threat_stream'
  },
  {
    title: $t('alerts.post-to-other-apps.ctix'),
    model_param: 'post_ctix',
    flag: 'ctix_integration'
  },
  {
    title: $t('alerts.post-to-other-apps.misp'),
    model_param: 'post_to_misp',
    flag: 'misp'
  },
  {
    title: 'TruSTAR',
    model_param: 'post_to_tru',
    flag: 'trustar'
  },
  {
    title: 'Slack',
    model_param: 'post_to_slack',
    flag: 'post_to_slack'
  },
  {
    title: $t('alerts.post-to-other-apps.microsoft'),
    model_param: 'ms_teams',
    modelKey: 'webhooks',
    flag: 'ms_teams',
    channelConfig: {
      // key: GET.MS_TEAMS_CHANNELS,
      label: 'Microsoft Teams Channels *',
      labelIdentifier: 'channel_name',
      valueIdentifier: 'id',
      modelKey: 'webhooks'
    }
  },
  {
    title: $t('alerts.post-to-other-apps.threatconnect'),
    model_param: 'post_to_tconnect',
    flag: 'tconnect'
  }
];

export const ALERT_OPTIONS = ($t: any): Record<string, any>[] => [
  {
    key: 'alert-export-recipient',
    modelKey: 'export_alert_from_webapp',
    name: $t('alerts.form-interactions.allow-alert-export')
  },
  {
    key: 'alert-export-pdf',
    modelKey: 'attach_alert_export_in_doc_library',
    name: $t('alerts.form-interactions.allow-export-as-pdf')
  },
  {
    key: 'schedule-alert-publish',
    flagKey: 'status',
    dateModelKey: 'published_time',
    dateModelLabel: 'Schedule Time',
    name: $t('alerts.form-interactions.schedule-alert-publish-time')
  },
  {
    key: 'repeat-alert',
    flagKey: 'repeat_alert',
    disabled: false,
    firstModelKey: 'schedule_frequency_gap',
    firstModelLabel: 'Auto publish it every (in days)',
    dateModelKey: 'schedule_tilldate',
    dateModelLabel: 'Until',
    extraModelKey: 'schedule_tilldate_utc',
    name: $t('alerts.form-interactions.repeat-this-alert-multiple-times')
  },
  {
    key: 'self-destruct-alert',
    flagKey: 'self_destruction',
    disabled: false,
    dateModelKey: 'destruction_time',
    dateModelLabel: 'Self-destruction Time',
    name: $t('alerts.form-interactions.self-destruct-alert')
  },
  {
    key: 'schedule-alert-expire',
    flagKey: 'expire_alert',
    disabled: false,
    dateModelKey: 'expire_time',
    dateModelLabel: 'Alert Expiry time',
    name: $t('alerts.form-interactions.schedule-alert-expiry-time')
  },
  {
    key: 'notification-to-publisher',
    modelKey: 'send_notification_to_card_publisher',
    name: $t('alerts.sending-options.send-email-to-publisher')
  }
];

export const LOCATION_RADIO = ($t: any) => [
  {
    key: 'card_location_json',
    label: $t('alerts.form-interactions.location')
  },
  {
    key: 'regions',
    label: $t('alerts.form-interactions.region')
  }
];

export const ORG_RADIO = ($t: any) => [
  {
    key: 'card_organization',
    label: $t('alerts.form-interactions.organization-name')
  },
  {
    key: 'card_organization_types',
    label: $t('alerts.form-interactions.organization-type')
  }
];

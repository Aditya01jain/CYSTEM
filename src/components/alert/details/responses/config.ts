export const TA_TABLE_COLUMNS = ($t: any): Array<Object> => [
  {
    type: 'expand'
  },
  {
    key: 'user',
    label: $t('alerts.responses.user'),
    type: 'string',
    is_display: true
  },
  {
    key: 'modified',
    label: $t('alerts.responses.threat-assessment-response-date'),
    type: 'date',
    is_display: true,
    width: 250
  },
  {
    key: 'actions',
    label: $t('alerts.labels.actions'),
    type: 'actions',
    is_display: true,
    width: 250
  }
];

export const RFI_STATUS_MAP: Record<string, any> = {
  OPEN: 'success',
  CLOSED: 'error'
};

export const EVENT_COLUMNS = ($t: any): Record<string, any>[] => [
  {
    key: 'first_name',
    width: 200,
    label: $t('alerts.events-responses.member'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true
  },
  {
    key: 'email',
    width: 225,
    label: $t('alerts.form-interactions.email'),
    type: 'string',
    fixed: true,
    noedit: true,
    is_display: true
  },
  {
    key: 'organization_name',
    label: $t('alerts.responses.event-organization'),
    type: 'string',
    is_display: true,
    noedit: true,
    fixed: true,
    width: 220
  }
];

export const EVENT_TABS = ($t: any): Record<string, any>[] => [
  {
    id: 'any',
    title: $t('alerts.alert-details-events.total-invitees')
  },
  {
    id: 'yes',
    title: $t('alerts.responses.attending')
  },
  {
    id: 'maybe',
    title: $t('alerts.responses.may-be')
  },
  {
    id: 'no',
    title: $t('alerts.responses.not-attending')
  },
  {
    id: 'none',
    title: $t('alerts.events-response.not-responded')
  }
];

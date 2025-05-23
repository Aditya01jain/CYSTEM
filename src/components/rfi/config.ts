export const RFI_LIST_COLUMNS = ($t: any): Record<string, any>[] => [
  {
    key: 'incident_id',
    label: 'RFI ID',
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 150
  },
  {
    key: 'title',
    label: $t('alerts.listing-page.title-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 300
  },
  {
    key: 'tlp',
    label: $t('alerts.listing-page.tlp-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 150
  },
  {
    key: 'reported_on',
    label: $t('alerts.response.rfi-submitted-on'),
    type: 'date',
    is_display: true,
    fixed: true,
    noedit: true,
    sort: true,
    minwidth: 150
  },
  {
    key: 'reporting_user',
    label: 'Submitted by',
    type: 'object',
    childKey: 'email',
    is_display: true,
    noedit: true,
    fixed: true,
    minwidth: 200
  },
  {
    key: 'intel_media',
    label: $t('alerts.alert-form-step.attachments-section'),
    type: 'array',
    is_display: true,
    noedit: true,
    fixed: true,
    sort: true,
    minwidth: 120
  },
  {
    key: 'status',
    label: $t('alerts.listing-page.status-column'),
    type: 'status',
    is_display: true,
    noedit: true,
    fixed: true,
    minwidth: 100
  },
  {
    key: 'sa_card',
    label: $t('alerts.listing-page.alert-id-column'),
    type: 'link',
    is_display: true,
    noedit: true,
    fixed: true,
    minwidth: 100
  }
];

export const RFI_ROW_ACTIONS: Record<string, any> = {
  createAlert: {
    label: 'Create Alert',
    disabledIf: (row: any) => {
      return !!row.sa_card;
    }
  }
};

export const RFI_STATUS_MAP: Record<string, any> = {
  OPEN: 'success',
  CLOSED: 'error'
};

export const RFI_TABS: Record<string, any>[] = [
  {
    id: 'all',
    title: 'All'
  },
  {
    id: 'open',
    title: 'Open'
  },
  {
    id: 'closed',
    title: 'Closed'
  }
];

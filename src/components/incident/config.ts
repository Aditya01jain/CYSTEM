export const INTEL_LIST_COLUMNS: Record<string, any>[] = [
  {
    key: 'incident_id',
    label: 'Intel ID',
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 100
  },
  {
    key: 'title',
    label: 'Title',
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 300
  },
  {
    key: 'tlp',
    label: 'TLP',
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 150
  },
  {
    key: 'reported_on',
    label: 'Reported on',
    type: 'date',
    is_display: true,
    fixed: true,
    noedit: true,
    sort: true,
    minwidth: 150
  },
  {
    key: 'reporting_user',
    label: 'Reported by',
    type: 'object',
    childKey: 'email',
    is_display: true,
    noedit: true,
    fixed: true,
    minwidth: 150
  },
  {
    key: 'status',
    label: 'Status',
    type: 'status',
    is_display: true,
    noedit: true,
    fixed: true,
    minwidth: 100
  },
  {
    key: 'intel_media',
    label: 'Attachments',
    type: 'array',
    is_display: true,
    noedit: true,
    fixed: true,
    sort: true,
    minwidth: 100
  },
  {
    key: 'sa_card',
    label: 'Alert ID',
    type: 'link',
    is_display: true,
    noedit: true,
    fixed: true,
    minwidth: 100
  }
];

export const INTEL_ROW_ACTIONS: Record<string, any> = {
  createAlert: {
    label: 'Create Alert',
    disabledIf: (row: any) => {
      return !!row.sa_card || !(row.status === 'ACCEPTED');
    }
  }
};

export const ALERT_STATUS_MAP: Record<string, any> = {
  ACCEPTED: 'success',
  REJECTED: 'error',
  PENDING: 'warning',
  REVERTED: 'warning'
};

export const INTEL_TABS: Record<string, any>[] = [
  {
    id: 'all',
    title: 'All'
  },
  {
    id: 'accepted',
    title: 'Accepted'
  },
  {
    id: 'rejected',
    title: 'Rejected'
  },
  {
    id: 'pending',
    title: 'Pending'
  },
  {
    id: 'reverted',
    title: 'Reverted'
  }
];

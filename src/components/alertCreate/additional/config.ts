export const LINKED_ALERTS_LIST_COLUMNS = ($t: any): Record<string, any>[] => [
  {
    key: 'short_id',
    label: $t('alerts.listing-page.alert-id-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    width: 100
  },
  {
    key: 'title',
    label: $t('alerts.listing-page.title-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 400
  },
  {
    key: 'card_category',
    label: $t('alerts.listing-page.category-column'),
    type: 'object',
    childKey: 'category_name',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 200
  },
  {
    key: 'modified',
    label: $t('alerts.listing-page.modified-date-column'),
    type: 'date',
    is_display: true,
    noedit: true,
    fixed: 'right',
    sort: true,
    minwidth: 200
  }
];

export const LINKED_ALERTS_TABLE_COLUMNS = ($t: any): Record<string, any>[] => [
  {
    key: 'short_id',
    label: $t('alerts.listing-page.alert-id-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    width: 150
  },
  {
    key: 'title',
    label: $t('alerts.listing-page.title-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 500
  }
];

export const VIEW_TABLE_ACTIONS = ($t: any) => ({
  remove: {
    label: $t('alerts.buttons.remove')
  }
});

export const TD_LIST_COLUMNS = ($t: any): Record<string, any>[] => [
  {
    key: 'title',
    label: $t('alerts.listing-page.title-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 200
  },
  {
    key: 'category',
    label: $t('alerts.listing-page.category-column'),
    type: 'string',
    is_display: true,
    fixed: 'right',
    noedit: true,
    minwidth: 200
  }
];

export const TD_TABLE_COLUMNS = ($t: any): Record<string, any>[] => [
  {
    key: 'id',
    label: 'ID',
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    width: 150
  },
  {
    key: 'title',
    label: $t('alerts.listing-page.title-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 410
  }
];

export const QUESTION_TYPE = ($t: any): Record<string, any>[] => [
  {
    id: 'single-select',
    label: $t('alerts.threat-assessment-section.single-select-option'),
    key: 'SINGLE-SELECT'
  },
  {
    id: 'text-box',
    label: $t('alerts.threat-assessment-section.text-box-option'),
    key: 'TEXT-BOX'
  }
];

export const THREAT_ASSESSMENT_RADIO_OPTIONS = ($t: any): Record<string, any>[] => [
  {
    key: 'new',
    label: $t('alerts.form-interactions.create-new-1')
  },
  {
    key: 'template',
    label: $t('alerts.threat-assessment-section.templates')
  }
];

export const SLA_MAP = ($t: any): Record<string, any>[] => [
  { key: 'sla_1', label: 'SLA-1' },
  { key: 'sla_2', label: 'SLA-2' },
  { key: 'sla_3', label: 'SLA-3' }
];

export const DOC_LIB_FOLDER_COLUMNS = ($t: any): Record<string, any>[] => [
  {
    key: 'file_name',
    label: $t('alerts.doc-library-folder.name'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 220
  },
  {
    key: 'rgAssociatedtoFolder',
    label: $t('alerts.doc-library-folder.recipient-group'),
    type: 'array',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 230
  },
  {
    key: 'modified',
    label: $t('alerts.doc-library-folder.date-modified'),
    type: 'date',
    is_display: true,
    noedit: true,
    fixed: true,
    sort: true
  }
];

export const DOC_LIBRARY_LIST_COLUMNS = ($t: any): Record<string, any>[] => [
  {
    key: 'file_name',
    label: $t('alerts.doc-library-folder.name'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 300
  },
  {
    key: 'size',
    label: 'Size',
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 100
  },
  {
    key: 'type',
    label: 'Type',
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 200
  },
  {
    key: 'modified',
    label: $t('alerts.doc-library-folder.date-modified'),
    type: 'date',
    is_display: true,
    noedit: true,
    fixed: 'right',
    sort: true
  }
];

export const RECOMMENDED_ACTION_MODEL = {
  title: '',
  description: '',
  assigned_groups: [],
  recipient_type: 'BY_RECIPIENT_GROUP',
  is_recommended_action: true
};

export const CONFERENCE_DIAL_IN = ($t: any): Record<string, any>[] => [
  {
    key: 'new',
    label: $t('alerts.form-interactions.create-new-1')
  },
  {
    key: 'exisiting',
    label: $t('alerts.form-interactions.existing-in-directory')
  }
];

export const MAX_FILE_LIMIT = 20;



export const prepareFileData = (file: File, tlp: string) => ({
  document_group: [],
  groups: [],
  is_active: true,
  status: 'DRAFT',
  file_format: file.name?.substring(file.name.lastIndexOf('.') + 1) || '',
  size: file.size,
  tlp: tlp,
  new_file: true,
  file_name: file.name,
  loading: true
});

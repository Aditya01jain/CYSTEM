import Cookies from '@/services/Cookies';
import { baseUrl } from '@/shared/utils';

export const CREATE_ALERT_STEPPER = ($t: any): Record<string, any>[] => [
  {
    id: 'tab-1',
    title: $t('alerts.alert-form.basic-information-section'),
    completed: false,
    disabled: false
  },
  {
    id: 'tab-2',
    title: $t('alerts.form-interactions.additional-information'),
    completed: false,
    disabled: false
  },
  {
    id: 'tab-3',
    title: $t('alerts.alert-form.sending-options-header'),
    completed: false,
    disabled: false
  }
];

export const ADDITIONAL_SECTION_LIST = ($t: any) => [
  {
    id: 'additional-information',
    title: $t('alerts.form-interactions.additional-information')
  },
  {
    id: 'linked-alerts',
    title: $t('alerts.alert-form-step.linked-alerts-section')
  },
  {
    id: 'attachments',
    title: $t('alerts.alert-form-step.attachments-section'),
    permission: ['view', 'drive'],
    count: { show: true, key: 'attachments' }
  },
  {
    id: 'intelligence-requirement',
    title: $t('alerts.alert-form-step.intelligence-requirements-section'),
    component: 'intelligence-requirements'
  },
  {
    id: 'threat-defender',
    title: 'Threat Defender',
    permission: ['view', 'threat_defender'],
    count: { show: true, key: 'tdl_content' }
  },
  {
    id: 'threat-assessment',
    title: $t('alerts.alert-form-step.threat-assessments-section'),
    permission: ['create', 'acknowledgement_type']
  },
  {
    id: 'recommended-actions',
    title: $t('alerts.alert-form-step.recommended-actions-section'),
    tenant: 'display_action'
  },
  {
    id: 'conference-dial-in',
    title: $t('alerts.alert-form-step.conference-details-section'),
    permission: ['create', 'conference_dial'],
    tooltip: $t('alerts.conference-dial-in-section.tooltip')
  }
];

export const SENDING_OPTIONS_SECTION_LIST = ($t: any) => [
  {
    id: 'recipients',
    title: $t('alerts.form-interactions.recipients')
  },
  {
    id: 'push-notifications',
    title: $t('alerts.form-interactions.push-notifications-1')
  },
  {
    id: 'share-with-communities',
    title: $t('alerts.sending-options.share-with-communities'),
    tooltip:
      'Based on the conditions configured in rules, communities are selected automatically for sharing alerts.'
  },
  {
    id: 'post-to-other-apps',
    title: $t('alerts.alert-form-step.post-to-other-apps-section')
  },
  {
    id: 'handling-instructions',
    title: $t('alerts.alert-form.special-handling-header')
  },
  {
    id: 'restrictions-and-alert-options',
    title: $t('alerts.form-interactions.restrictions-alert-options')
  }
];

export const REQUIRED_FILEDS_MODEL: Record<string, any> = {
  title: '',
  content: '',
  card_category: null,
  campaign: null,
  tlp: '',
  card_image: ''
};

export const ADDITIONAL_FIELDS: Record<string, any>[] = [
  {
    key: 'content',
    label: 'Summary',
    defaultValue: '',
    required: true,
    type: 'text_box'
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
  }
];

export enum ALERT_STATUS {
  CREATE = 'CREATE',
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SCHEDULED = 'SCHEDULED',
  PREVIEW = 'PREVIEW',
  EXPIRED = 'EXPIRED',
  SUBMITTED = 'SUBMITTED',
  REVERTED = 'REVERTED'
}

export const FROALA_OPTIONS: Record<string, any> = {
  toolbarBottom: true,
  toolbarButtons: {
    moreText: {
      buttons: ['bold', 'italic', 'underline', 'fontSize', 'textColor', 'clearFormatting']
    },
    moreParagraph: {
      buttons: [
        'formatOL',
        'formatUL',
        'alignLeft',
        'alignCenter',
        'alignRight',
        'outdent',
        'indent'
      ],
      buttonsVisible: 2
    },
    moreRich: {
      buttons: ['quote', 'paragraphFormat', 'insertLink', 'insertTable', 'insertHR', 'insertImage'],
      buttonsVisible: 0
    },
    moreMisc: {
      buttons: ['fullscreen', 'html', 'codeSnippet'],
      buttonsVisible: 1
    }
  },
  listAdvancedTypes: true,
  htmlRemoveTags: ['script'],
  htmlAllowedEmptyTags: [
    'textarea',
    'a',
    'iframe',
    'object',
    'video',
    'style',
    'script',
    'p',
    'span',
    'div',
    'table',
    'img'
  ],
  linkAlwaysBlank: true,
  linkEditButtons: ['linkOpen', 'linkEdit', 'linkRemove'],
  linkInsertButtons: ['linkBack'],
  imageDefaultAlign: 'left',
  imageEditButtons: ['imageReplace', 'imageRemove'],
  imageUploadParams: {
    title: 'file',
    file_size: '100'
  },
  imageDefaultWidth: 200,
  imageMaxSize: 10 * 1024 * 1024,
  imageAllowedTypes: ['jpeg', 'jpg', 'png'],
  requestHeaders: (() => {
    return {
      Authorization: Cookies.getTokenCookie()
    };
  })(),
  imageUploadURL: baseUrl() + '/api/admin/upload_featured_image/v2/',
  imageUploadMethod: 'POST',
  pluginsEnabled: [
    'align',
    'charCounter',
    'link',
    'paragraphFormat',
    'wordPaste',
    'lists',
    'file',
    'quote',
    'colors',
    'fontSize',
    'codeView',
    'codeSnippet',
    'table',
    'fullscreen',
    'image'
  ],
  paragraphFormat: {
    N: 'Normal',
    H1: 'Heading 1',
    H2: 'Heading 2',
    H3: 'Heading 3'
  },
  tableEditButtons: [
    'tableHeader',
    'tableRows',
    'tableColumns',
    'tableCells',
    '-',
    'tableCellBackground',
    'tableCellVerticalAlign',
    'tableCellHorizontalAlign',
    'tableRemove'
  ]
};

export const FROALA_OPTIONS_WITH_COMMENT: Record<string, any> = {
  ...FROALA_OPTIONS,
  toolbarButtons: {
    ...FROALA_OPTIONS.toolbarButtons,
    moreMisc: {
      ...FROALA_OPTIONS.toolbarButtons.moreMisc,
      buttons: ['comment', ...FROALA_OPTIONS.toolbarButtons.moreMisc.buttons],
      buttonsVisible: FROALA_OPTIONS.toolbarButtons.moreMisc.buttonsVisible + 1
    }
  },
  pluginsEnabled: [...FROALA_OPTIONS.pluginsEnabled, 'comment']
};

export const commentIdPrefix = 'user-comment';

export const commentMsg = ($t: any): Record<string, any> => {
  return {
    title: $t('alerts.revert-speedbump.title'),
    subTitle: $t('alerts.revert-speedbump.description'),
    confirmText: $t('alerts.buttons.revert'),
    cancelText: $t('alerts.buttons.cancel')
  };
};

export const TABS = [
  { id: 'preview', name: 'Preview' },
  { id: 'comments', name: 'Comments' }
];

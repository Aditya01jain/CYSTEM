export const CONFERENCE_DIAL_RULES = ($t: any) => ({
  startDate: [
    {
      required: true,
      message: $t('alerts.validations.this-field-is-required-1'),
      trigger: 'blur'
    }
  ],
  endDate: [
    {
      required: true,
      message: $t('alerts.validations.this-field-is-required-1'),
      trigger: 'blur'
    }
  ],
  conferenceDialDirectory: [{ required: false }],
  conferenceDial: [
    {
      required: true,
      trigger: 'blur',
      message: $t('alerts.validations.this-field-is-required-1')
    }
  ]
});

export const CONFERENCE_DIAL_PATTERN_RULES = ($t: any) => ({
  conferenceDial: [
    {
      pattern: '^[0-9,#]*$',
      message: 'Invalid Format',
      trigger: 'change'
    }
  ],
  conferenceUrl: [
    {
      type: 'url',
      required: true,
      message: $t('alerts.validations.conference-details'),
      trigger: 'blur'
    }
  ]
});

export const RECOMMEND_TITLE_RULE = ($t: any) => [
  {
    required: true,
    message: $t('alerts.validations.this-field-is-required-1'),
    trigger: 'blur'
  }
];

export const RECOMMEND_DESC_RULE = ($t: any) => [
  {
    required: true,
    message: $t('alerts.validations.this-field-is-required-1'),
    trigger: 'blur'
  }
];

export const THREAT_ASSESSMENT = ($t: any) => ({
  template: [
    {
      required: true,
      message: $t('alerts.validations.this-field-is-required-1'),
      trigger: 'blur'
    }
  ],
  question_type: [
    {
      required: true,
      message: $t('alerts.validations.this-field-is-required-1'),
      trigger: 'blur'
    }
  ],
  question: [
    {
      required: true,
      message: $t('alerts.validations.this-field-is-required-1'),
      trigger: 'blur'
    }
  ],
  expire_acknowledgement_time: [
    {
      required: true,
      message: $t('alerts.validations.this-field-is-required-1'),
      trigger: 'blur'
    }
  ]
});

export const THREAT_ASSESSMENT_OPTION = ($t: any) => [
  {
    validator: (rule: any, value: string, callback: Function) => {
      if (!value) {
        return callback(new Error($t('alerts.validations.this-field-is-required-1')));
      }
      callback();
    },
    trigger: 'blur'
  }
];

export const REQUIRED_RULE = ($t: any) => [
  {
    required: true,
    message: $t('alerts.validations.this-field-is-required-1'),
    trigger: 'blur'
  }
]

export const ADDITIONAL_INFORMATION_RULE = ($t: any) => [
  {
    type: 'url',
    message: $t('alerts.validations.conference-details'),
    trigger: 'blur'
  }
];

const FILE_NAME = /^[A-Za-z0-9(){}\[\]\-_.+ ]+$/;

export const FILE_DETAILS_RULE = ($t: any) => ({
  name: [
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (!value) {
          return callback(new Error($t('alerts.validations.this-field-is-required-1')));
        }
        if (!FILE_NAME.test(value)) {
          return callback(new Error('Invalid file name format'));
        }
        callback();
      },
      trigger: 'blur'
    }
  ]
});

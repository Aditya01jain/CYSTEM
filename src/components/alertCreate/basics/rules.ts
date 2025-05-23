export const BASIC_REQUIRED_FIELDS = ($t: any) => ({
  title: [
    { required: true, message: $t('alerts.validations.this-field-is-required-1'), trigger: 'blur' }
  ],
  content: [
    { required: true, message: $t('alerts.validations.this-field-is-required-1'), trigger: 'blur' }
  ],
  analyst_groups: [
    { required: true, message: $t('alerts.validations.this-field-is-required-1'), trigger: 'blur' }
  ],
  card_category: [
    { required: true, message: $t('alerts.validations.this-field-is-required-1'), trigger: 'blur' }
  ],
  tlp: [
    { required: true, message: $t('alerts.validations.this-field-is-required-1'), trigger: 'blur' }
  ]
});

export const TIMEZONE_RULE = ($t: any) => [
  {
    required: true,
    message: $t('alerts.validations.this-field-is-required-1'),
    trigger: 'blur'
  }
];

export const THREAT_INDICATORS_RULE = ($t: any) => [
  {
    validator: (rule: any, value: any, callback: Function) => {
      if (Object.keys(value).length === 0) {
        callback(new Error($t('alerts.validations.this-field-is-required-1')));
      } else {
        callback(); // Validation passed
      }
    },
    trigger: 'blur'
  }
];

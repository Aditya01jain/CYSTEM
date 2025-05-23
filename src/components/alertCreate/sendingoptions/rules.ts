export const RECIPIENT_RULES = ($t: any) => ({
  card_group: [
    {
      required: true,
      message: $t('alerts.validations.recipients-validation'),
      trigger: 'blur'
    }
  ]
});

export const MS_TEAMS_RULE = ($t: any) => [
  {
    required: true,
    message: $t('alerts.validations.this-field-is-required-1'),
    trigger: 'blur'
  }
];

export const ALERT_RULES = ($t: any) => [
  {
    required: true,
    message: $t('alerts.validations.this-field-is-required-1'),
    trigger: 'blur'
  }
];

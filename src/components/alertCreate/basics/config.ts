export const allIocs = [
  'ip',
  'domain',
  'email',
  'url',
  'md5',
  'sha1',
  'sha256',
  'ipv4_cidr',
  'ipv6',
  'sha224',
  'sha384',
  'sha512',
  'ssdeep',
  'filepaths',
  'windows_registry_key',
  'asn',
  'directory',
  'mac_addr'
];

export const additionalIocs = ['email_description', 'email_subject'];

export const relatedAlertsColumn = ($t: any): Record<string, any> => [
  {
    key: 'short_id',
    label: $t('alerts.listing-page.alert-id-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 80
  },
  {
    key: 'title',
    label: $t('alerts.listing-page.title-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 80
  },
  {
    key: 'category',
    label: $t('alerts.listing-page.category-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 80
  },
  {
    key: 'tlp',
    label: $t('alerts.listing-page.tlp-column'),
    type: 'string',
    is_display: true,
    fixed: true,
    noedit: true,
    minwidth: 120
  },
  {
    key: 'created',
    label: 'Created',
    type: 'date',
    is_display: true,
    noedit: true,
    fixed: 'right',
    minwidth: 100,
    sort: true
  }
];

export const DAYS: {
  key: number;
  label: string;
  semiLabel: string;
  fullLabel: string;
}[] = [
  {
    key: 1,
    label: 'M',
    semiLabel: 'Mon',
    fullLabel: 'Monday'
  },
  {
    key: 2,
    label: 'T',
    semiLabel: 'Tue',
    fullLabel: 'Tuesday'
  },
  {
    key: 3,
    label: 'W',
    semiLabel: 'Wed',
    fullLabel: 'Wednesday'
  },
  {
    key: 4,
    label: 'T',
    semiLabel: 'Thu',
    fullLabel: 'Thursday'
  },
  {
    key: 5,
    label: 'F',
    semiLabel: 'Fri',
    fullLabel: 'Friday'
  },
  {
    key: 6,
    label: 'S',
    semiLabel: 'Sat',
    fullLabel: 'Saturday'
  },
  {
    key: 0,
    label: 'S',
    semiLabel: 'Sun',
    fullLabel: 'Sunday'
  }
];
export const LOGO_TYPES: Record<string, any>[] = [
  {
    id: 'webapp_logo_dark',
    header: 'Web App Primary Logo',
    iconId: 'webapp-primary',
    footerText: 'Must be atleast 200px by 200px and maximum 1.5 MB',
    mode: 'light',
    wrapClass: 'w-50 pr-2',
    visibleWidth: 200,
    visibleHeight: 200
  },
  {
    id: 'tenant_logo',
    header: 'Mobile App Primary Logo',
    iconId: 'mobile-primary',
    footerText: 'Must be atleast 150px by 150px and maximum 1.5 MB',
    mode: 'light',
    wrapClass: 'w-50 pl-3',
    visibleWidth: 100,
    visibleHeight: 100
  },
  {
    id: 'webapp_logo_light',
    header: 'Web App Primary Logo - Dark Mode',
    iconId: 'webapp-primary-dark',
    footerText: 'Must be atleast 200px by 200px and maximum 1.5 MB',
    mode: 'dark',
    wrapClass: 'w-50 pr-2 pt-3',
    visibleWidth: 200,
    visibleHeight: 200
  },
  {
    id: 'tenant_logo_light',
    header: 'Mobile App Primary Logo - Dark Mode',
    iconId: 'mobile-primary-dark',
    footerText: 'Must be atleast 150px by 150px and maximum 1.5 MB',
    mode: 'dark',
    wrapClass: 'w-50 pl-3 pt-3',
    visibleWidth: 100,
    visibleHeight: 100
  },
  {
    id: 'card_default_logo',
    header: 'Alert Default Image',
    iconId: 'alert-thumbnail',
    footerText: 'Must be atleast 900px by 300px and maximum 1.5 MB',
    mode: 'light',
    wrapClass: 'w-100 pt-3',
    visibleWidth: 750,
    visibleHeight: 250,
    validateResolution: true
  }
];

export const MAX_FILE_SIZE_ALLOWED = 1.5;

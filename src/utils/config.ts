export const INVALID_ALERT_MESSAGE = ($t: any) => ({
  title: $t('alerts.alerts-listing.empty-state-title'),
  description: $t('alerts.alerts-listing.empty-state-description')
});

export const ALERT_LOCKED_MESSAGE = ($t: any, editorName: string) => ({
  title: $t('alerts.error-message.alert-locked-title'),
  subTitle: $t('alerts.listing-pop-up.alert-locked-description', { AnalystName: editorName }),
  confirmText: 'Ok'
});

export const COMMUNITY_SHARING_MSG = ($t: any, community_sharing_number: number) => ({
  title: 'Share With Communities',
  subTitle:
    community_sharing_number === 1
      ? $t('alerts.listing-message.share-with-1-community')
      : $t('alerts.listing-message.share-with-multiple-communities', {
          community_number: community_sharing_number
        }),
  confirmText: $t('alerts.labels.yes'),
  cancelText: $t('alerts.expire-speedbump.cancel')
});

export const THREAT_REMINDER_MSG = ($t: any) => ({
  title: $t('alerts.responses-pop-up.trigger-reminder-title'),
  subTitle: $t('alerts.responses-pop-up.trigger-reminder-description'),
  confirmText: $t('alerts.responses-pop-up.trigger-button'),
  cancelText: $t('alerts.expire-speedbump.cancel')
});

export const EXPIRE_ALERT_MSG = ($t: any) => ({
  title: $t('alerts.expire-speedbump.title'),
  subTitle: $t('alerts.expire-speedbump.description'),
  confirmText: $t('alerts.expire-speedbump.positive-cta'),
  cancelText: $t('alerts.expire-speedbump.cancel')
});

export const BULK_EXPIRE_ALERT_MSG = ($t: any) => {
  return {
    title: $t('alerts.expire-speedbump.title'),
    subTitle: $t('alerts.expire-speedbump.description'),
    confirmText: $t('alerts.expire-speedbump.positive-cta'),
    cancelText: $t('alerts.expire-speedbump.cancel')
}};

export const CANCEL_ALERT_MSG = ($t: any) => ({
  title: $t('alerts.close-speedbump.warning-title'),
  subTitle: $t('alerts.close-speedbump.description'),
  confirmText: $t('alerts.close-speedbump.positive-cta'),
  cancelText: $t('alerts.expire-speedbump.cancel')
});

export const RFI_STATUS_ALERT_MSG = ($t: any) => ({
  title: $t('alerts.close-speedbump.warning-title'),
  subTitle: $t('alerts.speedbumps.rfi-status-alert'),
  confirmText: $t('alerts.speedbumps.confirm'),
  cancelText: $t('alerts.expire-speedbump.cancel')
});

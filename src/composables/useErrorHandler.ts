import { inject } from 'vue';
import { useI18n } from 'vue-i18n';

export const useErrorHandler = () => {
  const $notify: any = inject('$notify');
  const { t: $t } = useI18n();

  const showFileLimitError = (file_limit: number = 20) => {
    $notify.error({
      title: `You can only attach ${file_limit} files`,
      message: 'Review and try again'
    });
  };

  const showFileSizeError = (fileSizeLimit: number) => {
    $notify.error({
      title: $t('alerts.form-interactions.maximum-file-size', {
        FileSize: fileSizeLimit
      })
    });
  }

  return { showFileLimitError, showFileSizeError };
};

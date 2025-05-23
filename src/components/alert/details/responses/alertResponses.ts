import { Reactive, inject } from 'vue';
import FileSaver from 'file-saver';

export const alertResponses = () => {
  const $api: any = inject('$api');
  const $notify: any = inject('$notify');

  const setToasterMsg = (type = 'error', data = {}) => {
    $notify[type](data);
  };

  const fetchTAresponses = async (short_id: string) => {
    try {
      const { data } = await $api.get('analyst.threatAssessmentResponse', {
        params: {
          alert_id: short_id
        }
      });
      return data;
    } catch {
      //
    }
  };

  const fetchTAmember = async (short_id: string) => {
    try {
      const { data } = await $api.get('/admin/alert_acknowledgement/summary/' + short_id + '/', {
        params: {
          type: 'member'
        }
      });

      return {
        total: data.summary.total,
        data: [
          {
            name: 'Submitted',
            y: parseInt(data.summary.submitted),
            color: 'var(--BL500)'
          },
          {
            name: 'Not Submitted',
            y: parseInt(data.summary.total) - parseInt(data.summary.submitted),
            color: 'var(--BR200)'
          }
        ]
      };
    } catch {
      //
    }
  };

  const fetchTAorg = async (short_id: string) => {
    try {
      const { data } = await $api.get('/admin/alert_acknowledgement/summary/' + short_id + '/', {
        params: {
          type: 'org'
        }
      });
      return {
        total: data.summary.total,
        data: [
          { name: 'Submitted', y: parseInt(data.summary.submitted), color: 'var(--BL500)' },
          {
            name: 'Not Submitted',
            y: parseInt(data.summary.total) - parseInt(data.summary.submitted),
            color: 'var(--BR200)'
          }
        ]
      };
    } catch {
      //
    }
  };

  const sendTAReminder = async (short_id: string) => {
    try {
      await $api.post('/admin/alert_acknowledgement/trigger_notification/', {
        short_id: short_id
      });
      setToasterMsg('success', {
        title: 'Reminder Sent Successfully!'
      });
    } catch {
      //
    }
  };

  const exportTA = async (short_id: string) => {
    try {
      const fileName = `TA_${short_id}.csv`;
      const { data: csvData } = await $api.get('admin/export/alert_acknowledgement/', {
        params: { alert_id: short_id }
      });
      const blob: any = new Blob([csvData], { type: 'application/csv' });
      FileSaver.saveAs(blob, fileName);
      setToasterMsg('success', {
        title: 'Downloaded!'
      });
    } catch {
      //
    }
  };

  const rfiResponses = async (short_id: string, page: number) => {
    try {
      const { data } = await $api.get('admin/rfi/alert/' + short_id + '/responses/', {
        params: {
          page_size: 10,
          page: page
        }
      });
      return data;
    } catch {
      //
    }
  };

  const exportRfi = async (short_id: string) => {
    try {
      const { data } = await $api.post('/admin/rfi/responses/export/', {
        alert_id: short_id
      });
      setToasterMsg('success', {
        title: 'Success',
        message: data.detail
      });
    } catch {
      //
    }
  };

  const fetchAlertRating = async (short_id: string) => {
    try {
      const { data } = await $api.get('analyst.alertRating', {
        params: {
          card_id: short_id
        }
      });
      return data;
    } catch {
      //
    }
  };

  const fetchAlertFeedback = async (params: Record<string, any>) => {
    try {
      const { data } = await $api.get('analyst.alertFeedback', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  const exportFeedback = async (short_id: string) => {
    try {
      const { data } = await $api.get('analyst.exportFeedback', {
        params: { card_id: short_id }
      });
      setToasterMsg('success', {
        title: data.detail.title,
        message: data.detail.msg
      });
    } catch {
      //
    }
  };

  const eventInvitedDetails = async (short_id: string, params: Record<string, any>) => {
    try {
      const { data } = await $api.get('admin/card_sa/' + short_id + '/event/attendance/', {
        params: params
      });
      return data;
    } catch {
      //
    }
  };

  const eventStats = async (short_id: string, params: Record<string, any>) => {
    try {
      const { data } = await $api.get(
        'admin/card_sa/' + short_id + '/event/attendance/statistics/',
        { params: params }
      );
      return data;
    } catch {
      //
    }
  };

  const exportEvents = async (short_id: string) => {
    try {
      const fileName = `${short_id}-event-attendance.csv`;
      const { data: csvData } = await $api.get(
        'admin/card_sa/' + short_id + '/event/attendance/download/'
      );
      const blob: any = new Blob([csvData], { type: 'application/csv' });
      FileSaver.saveAs(blob, fileName);
      setToasterMsg('success', {
        title: 'Downloaded!'
      });
    } catch {
      //
    }
  };

  return {
    fetchTAresponses,
    fetchTAmember,
    fetchTAorg,
    sendTAReminder,
    exportTA,
    rfiResponses,
    exportRfi,
    fetchAlertFeedback,
    fetchAlertRating,
    exportFeedback,
    eventInvitedDetails,
    eventStats,
    exportEvents
  };
};

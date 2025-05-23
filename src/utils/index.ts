import { DateTime } from 'luxon';
export const transformUserGroupData = (groupList: Record<string, any>[]) => {
  const tlpAbbreviations: Record<string, string> = {
    RED: 'R',
    GREEN: 'G',
    AMBER: 'A',
    'AMBER+STRICT': 'AS',
    CLEAR: 'C',
    WHITE: 'W'
  };

  return groupList.map((item: Record<string, any>) => {
    const tlpLabel = tlpAbbreviations[item.group_tlp] || item.group_tlp.charAt(0);
    item.label = !isNull(item.member_count)
      ? `${item.group_name} (${tlpLabel}) [Members: ${item.member_count}]`
      : item.group_name;
    return item;
  });
};

export const isNull = (value: any) => {
  return [null, undefined].includes(value);
};

export const formatBytes = (bytes: any, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const copyToClipBoard = async (txt: string) => {
  navigator.clipboard.writeText(txt);
};

export const fileImage = (type: string) => {
  if (type === 'folder') return 'fa-thin fa-folder-open';
  const icon = (() => {
    switch (type) {
      case 'png':
      case 'jpeg':
      case 'jpg':
        return 'image';

      case 'csv':
      case 'xls':
      case 'xlsx':
        return 'excel';

      case 'doc':
      case 'docm':
      case 'docx':
      case 'dot':
        return 'word';

      case 'mp4':
      case 'mov':
      case '3gp':
      case '3gpp':
        return 'video';

      case 'mp3':
        return 'audio';

      case 'ppt':
      case 'pptx':
        return 'ppt';

      case 'pdf':
        return 'pdf';

      case 'yar':
        return 'yar';

      default:
        return 'lines';
    }
  })();

  return `fa-thin fa-file-${icon}`;
};

export const timeAgo = (date: string) => {
  const now = DateTime.now();
  const inputDate = DateTime.fromISO(date); // Replace with your date input
  const diff = now.diff(inputDate, ['seconds', 'minutes', 'hours', 'days']);

  if (diff.days >= 1) {
    return inputDate.toFormat('LLL dd yyyy, hh:mma');
  } else if (diff.hours >= 1) {
    return `${Math.floor(diff.hours)} hours ago`;
  } else if (diff.minutes >= 1) {
    return `${Math.floor(diff.minutes)} minutes ago`;
  } else {
    return `${Math.floor(diff.seconds)} seconds ago`;
  }
};

const getNormalizedTimestamp = (timestamps: number): number => {
  return timestamps > 9999999999 ? Math.floor(timestamps / 1000) : timestamps;
};

export const formatDateForTimezone = (timestamps: number, timezone: string): string => {
  const timestampInSeconds = getNormalizedTimestamp(timestamps);
  return DateTime.fromSeconds(timestampInSeconds, { zone: timezone }).toFormat('MMM dd, yyyy');
};

export const formatTimeForTimezone = (timestamps: number, timezone: string): string => {
  const timestampInSeconds = getNormalizedTimestamp(timestamps);
  return DateTime.fromSeconds(timestampInSeconds, { zone: timezone }).toFormat('HH:mm a');
};

export const getDateTimeInMS = (timestamps: number, timezone: string): string => {
  const timestampInSeconds = getNormalizedTimestamp(timestamps);
  return DateTime.fromSeconds(timestampInSeconds, { zone: timezone }).toFormat(
    'MMM dd yyyy, HH:mm a'
  );
};

export const formatDateTime = (date: any = DateTime.now().toSeconds()) => {
  return DateTime.fromSeconds(parseInt(date)).toFormat('MMM dd, yyyy, hh:mm a');
};

export const formatDate = (date: any = DateTime.now().toSeconds()) => {
  return DateTime.fromSeconds(parseInt(date)).toFormat('MMM dd, yyyy');
};

export const formatTimeRange = (
  start: any = DateTime.now().startOf('day').toSeconds(),
  end: any = DateTime.now().endOf('day').toSeconds()
) => {
  return `${DateTime.fromSeconds(parseInt(start)).toFormat('HH:mm a')} - 
  ${DateTime.fromSeconds(parseInt(end)).toFormat('HH:mm a')}`;
};

export const getDateWithOrdinal = (date: any) => {
  let dateObj = new Date(parseInt(date)).toISOString();
  const isoDateFormat = DateTime.fromISO(dateObj);
  const dayWithOrdinal = `${isoDateFormat.toFormat('d')}${getOrdinalSuffix(isoDateFormat.day)}`;
  const formattedWithOrdinal = `${isoDateFormat.monthLong} ${dayWithOrdinal} ${
    isoDateFormat.year
  }, ${isoDateFormat.toFormat('h:mm:ss a')}`;
  return formattedWithOrdinal;
};

const getOrdinalSuffix = (day: any) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const mod = day % 10;
  // Handle special cases for 11, 12, and 13 (e.g., 11th, 12th, 13th)
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  return suffixes[mod] || 'th';
};

export const handleError = ($notify: any) => {
  return (error: any) => {
    if ([400, 403].includes(error.code)) {
      let errMsg = '';
      if (error.error?.detail) {
        errMsg = Array.isArray(error.error.detail) ? error.error.detail?.[0] : error.error.detail;
      } else if (Array.isArray(error.error)) {
        errMsg = error.error[0];
      } else {
        if (typeof error.error === 'object') {
          const [key] = Object.keys(error.error);
          errMsg = error.error[key]?.[0];
        }
      }
      $notify.error({ title: 'Error', message: errMsg });
    }
  };
};

export const trimComments = (content: any) => {
  content = JSON.stringify(content);
  const cleanedText = content.replace(/<span data-commentid=\\"[^"]*".*?>(.*?)<\/span>/g, '$1');
  return JSON.parse(cleanedText);
};

export function defaultDateFilter(startKey: string, endKey: string) {
  const now = DateTime.now();
  return {
    [startKey]: parseInt(`${now.startOf('day').minus({ days: 7 }).toSeconds()}`),
    [endKey]: parseInt(`${now.endOf('day').toSeconds()}`)
  };
}

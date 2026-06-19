import dayjs from 'dayjs';

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format);
};

export const formatTime = (date: string | Date, format = 'HH:mm'): string => {
  return dayjs(date).format(format);
};

export const addDays = (date: string | Date, days: number): string => {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
};

export const isToday = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

export const isTomorrow = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs().add(1, 'day'), 'day');
};

export const isPast = (date: string | Date): boolean => {
  return dayjs(date).isBefore(dayjs(), 'day');
};

export const isThisWeek = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs(), 'week');
};

export const isNextWeek = (date: string | Date): boolean => {
  return dayjs(date).isSame(dayjs().add(1, 'week'), 'week');
};

export const getDaysDiff = (date1: string | Date, date2: string | Date): number => {
  return dayjs(date1).diff(dayjs(date2), 'day');
};

export const getRelativeDateLabel = (date: string | Date): string => {
  const target = dayjs(date);
  const today = dayjs();
  const diff = target.diff(today, 'day');
  
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff === 2) return '后天';
  if (diff === -1) return '昨天';
  if (diff > 0 && diff < 7) return `${diff}天后`;
  if (diff < 0 && diff > -7) return `${Math.abs(diff)}天前`;
  return target.format('M月D日');
};

export const getWeekday = (date: string | Date): string => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[dayjs(date).day()];
};

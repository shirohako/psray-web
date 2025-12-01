import {
  format,
  fromUnixTime,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from 'date-fns';

export const useTime = () => {
  /**
   * 计算给定 Unix 时间戳（秒）到当前时间的 Twitter 风格相对时间
   * @param timestamp Unix 时间戳 (秒) - number 或 string
   * @returns 相对时间 (如 "23h", "3d", "2w")
   */
  function timeAgoShort(timestamp: number | string): string {
    const date = new Date(Number(timestamp) * 1000); // 转换为毫秒级时间戳
    const now = new Date();

    if (isNaN(date.getTime())) {
      throw new Error('Invalid timestamp');
    }

    const seconds = differenceInSeconds(now, date);
    if (seconds < 60) return `${seconds}s`;

    const minutes = differenceInMinutes(now, date);
    if (minutes < 60) return `${minutes}m`;

    const hours = differenceInHours(now, date);
    if (hours < 24) return `${hours}h`;

    const days = differenceInDays(now, date);
    if (days < 7) return `${days}d`;

    if (days < 30) return `${Math.floor(days / 7)}w`; // 转换为周

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;

    return `${Math.floor(months / 12)}y`; // 转换为年
  }

  /**
   * 将时间戳转换为 "YYYY-MM-DD HH:mm:ss" 格式的日期字符串
   * @param timestamp 时间戳 (number 或 string)
   * @returns 格式化后的日期字符串
   */
  function formatTimestamp(timestamp: number | string): string {
    const date = fromUnixTime(Number(timestamp));

    return format(date, 'yyyy-MM-dd HH:mm:ss');
  }

  return { formatTimestamp, timeAgoShort };
};

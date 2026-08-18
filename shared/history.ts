export type HistoryBucket = "Today" | "Previous 7 Days" | "Older";

export function historyBucket(dateValue: string | Date, nowValue = Date.now()): HistoryBucket {
  const date = new Date(dateValue).getTime();
  const now = new Date(nowValue);
  const day = 86_400_000;
  const sameCalendarDay = new Date(date).toDateString() === now.toDateString();
  if (nowValue - date < day && sameCalendarDay) return "Today";
  if (nowValue - date < day * 7) return "Previous 7 Days";
  return "Older";
}

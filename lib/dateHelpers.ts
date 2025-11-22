/**
 * Gets date in YYYY-MM-DD format (local timezone)
 */
export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets Monday of the current week
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return getDateString(d);
}

/**
 * Gets array of last N days as date strings (not including today)
 */
export function getLastNDays(n: number, endDate: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = n; i >= 1; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    dates.push(getDateString(d));
  }
  return dates;
}
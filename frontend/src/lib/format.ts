import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function formatAverageQuizScore(score: number | null): string {
  if (score === null) {
    return "No quiz score yet";
  }

  return `${score.toFixed(1)}%`;
}

export function formatLastActive(lastActiveAt: string | null): string {
  if (lastActiveAt === null) {
    return "No activity yet";
  }

  const date = new Date(lastActiveAt);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function formatTrendDay(day: string): string {
  const parsedDay = parseISO(day);

  if (Number.isNaN(parsedDay.getTime())) {
    return day;
  }

  return format(parsedDay, "d MMM");
}

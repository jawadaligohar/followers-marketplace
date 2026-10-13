import { format, parseISO } from "date-fns";

export interface FormattedDateTime {
  date: string;
  time: string;
  full: string;
}

/**
 * Safely formats any date, string, or timestamp into human-readable date and time.
 * e.g. date: "Oct 13, 2026", time: "7:46 PM", full: "Oct 13, 2026 at 7:46 PM"
 */
export function formatDateTime(dateInput: string | Date | number | null | undefined): FormattedDateTime {
  if (!dateInput) {
    return { date: "—", time: "—", full: "—" };
  }

  try {
    const date = typeof dateInput === "string" ? parseISO(dateInput) : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return { date: "—", time: "—", full: "—" };
    }

    return {
      date: format(date, "MMM d, yyyy"),
      time: format(date, "h:mm a"),
      full: format(date, "MMM d, yyyy 'at' h:mm a"),
    };
  } catch {
    return { date: "—", time: "—", full: "—" };
  }
}

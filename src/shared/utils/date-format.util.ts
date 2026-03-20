/**
 * @module date-format.util
 * @description Utility functions for formatting dates and comparing dates with time offsets.
 * Uses Ukrainian locale and Europe/Kyiv timezone.
 */

/**
 * Formats a Date into a full Ukrainian date-time string.
 * @param date - The date to format.
 * @returns A formatted date string using Ukrainian locale with full date and long time style.
 * @example
 * ```ts
 * formatDate(new Date()); // "середа, 15 березня 2026 р. о 15:00:03 за східноєвропейським стандартним часом"
 * ```
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'full', timeStyle: 'long', timeZone: 'Europe/Kiev' }).format(date);
}

/**
 * Formats a Date into an accusative-case Ukrainian string.
 * Converts nominative day names to accusative where Ukrainian grammar requires it.
 * @param date - The date to format.
 * @returns A formatted date string with accusative day names.
 */
export function formatDateIntoAccusative(date: Date): string {
  return formatDate(date)
    .replace('середа', 'середу')
    .replace("п'ятниця", "п'ятницю")
    .replace('субота', 'суботу')
    .replace('неділя', 'неділю');
}

/**
 * Checks whether `compareDate` is more than `hours` after `initialDate`.
 * @param initialDate - The starting date.
 * @param compareDate - The date to compare against.
 * @param hours - The offset in hours.
 * @returns `true` if `compareDate` exceeds `initialDate` by at least `hours`.
 */
export function compareDatesWithOffset(initialDate: Date, compareDate: Date, hours: number): boolean {
  const additionalTime = 1000 * 60 * 60 * hours;

  return +initialDate + additionalTime < +compareDate;
}

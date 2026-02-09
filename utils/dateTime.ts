/**
 * Date and time utilities
 * Consolidates date/time logic previously scattered across components
 */

/**
 * Format date for display
 * @param date - Date object or ISO string
 * @param format - Format style ('short', 'medium', 'long')
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date(), 'short') // "Jan 15"
 * formatDate(new Date(), 'medium') // "Jan 15, 2024"
 * formatDate(new Date(), 'long') // "January 15, 2024"
 */
export function formatDate(
    date: Date | string | null | undefined,
    format: 'short' | 'medium' | 'long' = 'medium'
): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const options: Intl.DateTimeFormatOptions = {
        short: { month: 'short', day: 'numeric' },
        medium: { month: 'short', day: 'numeric', year: 'numeric' },
        long: { month: 'long', day: 'numeric', year: 'numeric' }
    }[format];

    return d.toLocaleDateString('en-US', options);
}

/**
 * Format time for display
 * @param date - Date object or ISO string
 * @param use24Hour - Whether to use 24-hour format
 * @returns Formatted time string
 *
 * @example
 * formatTime(new Date()) // "2:30 PM"
 * formatTime(new Date(), true) // "14:30"
 */
export function formatTime(
    date: Date | string | null | undefined,
    use24Hour: boolean = false
): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    if (use24Hour) {
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format date and time
 * @param date - Date object or ISO string
 * @returns Formatted datetime string
 *
 * @example
 * formatDateTime(new Date()) // "Jan 15, 2024 at 2:30 PM"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    return `${formatDate(d, 'medium')} at ${formatTime(d)}`;
}

/**
 * Get relative time string
 * @param date - Date object or ISO string
 * @returns Relative time string like "2 hours ago"
 *
 * @example
 * getRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 */
export function getRelativeTime(date: Date | string | null | undefined): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return 'just now';
    }
    if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }

    return formatDate(d, 'medium');
}

/**
 * Get ISO date string (YYYY-MM-DD)
 * @param date - Date object or ISO string
 * @returns ISO date string
 *
 * @example
 * getISODate(new Date()) // "2024-01-15"
 */
export function getISODate(date: Date | string | null | undefined): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    return d.toISOString().split('T')[0];
}

/**
 * Get ISO time string (HH:MM:SS)
 * @param date - Date object or ISO string
 * @returns ISO time string
 *
 * @example
 * getISOTime(new Date()) // "14:30:00"
 */
export function getISOTime(date: Date | string | null | undefined): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Get week number for a date
 * @param date - Date object or ISO string
 * @returns Week number (1-52)
 *
 * @example
 * getWeekNumber(new Date('2024-01-15')) // 3
 */
export function getWeekNumber(date: Date | string | null | undefined): number {
    if (!date) return 0;

    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    if (isNaN(d.getTime())) return 0;

    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));

    // Get first day of year
    const yearStart = new Date(d.getFullYear(), 0, 1);

    // Calculate full weeks to nearest Thursday
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

    return weekNo;
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns Boolean
 */
export function isToday(date: Date | string | null | undefined): boolean {
    if (!date) return false;

    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();

    return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
    );
}

/**
 * Check if date is yesterday
 * @param date - Date to check
 * @returns Boolean
 */
export function isYesterday(date: Date | string | null | undefined): boolean {
    if (!date) return false;

    const d = typeof date === 'string' ? new Date(date) : date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return (
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear()
    );
}

/**
 * Get start of day
 * @param date - Date object
 * @returns New Date set to 00:00:00
 */
export function startOfDay(date: Date | string | null | undefined): Date {
    const d = date
        ? (typeof date === 'string' ? new Date(date) : new Date(date))
        : new Date();

    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get end of day
 * @param date - Date object
 * @returns New Date set to 23:59:59
 */
export function endOfDay(date: Date | string | null | undefined): Date {
    const d = date
        ? (typeof date === 'string' ? new Date(date) : new Date(date))
        : new Date();

    d.setHours(23, 59, 59, 999);
    return d;
}

/**
 * Add days to a date
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New Date
 */
export function addDays(date: Date | string, days: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

/**
 * Get day name
 * @param date - Date object
 * @param format - 'short' (Mon) or 'long' (Monday)
 * @returns Day name
 */
export function getDayName(
    date: Date | string | null | undefined,
    format: 'short' | 'long' = 'short'
): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString('en-US', { weekday: format });
}

/**
 * Get month name
 * @param date - Date object
 * @param format - 'short' (Jan) or 'long' (January)
 * @returns Month name
 */
export function getMonthName(
    date: Date | string | null | undefined,
    format: 'short' | 'long' = 'short'
): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString('en-US', { month: format });
}

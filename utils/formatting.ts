/**
 * Formatting utilities for displaying numbers, volumes, and other data
 * Consolidates formatting logic previously scattered across components
 */

/**
 * Format volume with K/M/T suffixes
 * @param volume - Volume value
 * @returns Formatted string like "1.2K", "3.5M", "2.1T"
 *
 * @example
 * formatVolume(1500) // "1.5K"
 * formatVolume(1500000) // "1.5M"
 */
export function formatVolume(volume: number | null | undefined): string {
    if (volume === null || volume === undefined) return '0';

    if (volume >= 1000000000) {
        return `${(volume / 1000000000).toFixed(1)}T`;
    }
    if (volume >= 1000000) {
        return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(0);
}

/**
 * Format a number with specified decimal places, removing trailing zeros
 * @param value - Number to format
 * @param decimals - Maximum decimal places (default: 2)
 * @returns Formatted number string
 *
 * @example
 * formatNumber(100.5, 2) // "100.5"
 * formatNumber(100.00, 2) // "100"
 */
export function formatNumber(
    value: number | string | null | undefined,
    decimals: number = 2
): string {
    if (value === null || value === undefined || value === '') return '-';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';

    // Remove trailing zeros
    return parseFloat(num.toFixed(decimals)).toString();
}

/**
 * Format percentage
 * @param value - Decimal value (0-1) or percentage (0-100)
 * @param isDecimal - Whether value is a decimal
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(0.75, true) // "75%"
 * formatPercentage(75, false) // "75%"
 */
export function formatPercentage(
    value: number | null | undefined,
    isDecimal: boolean = false
): string {
    if (value === null || value === undefined) return '0%';

    const percentage = isDecimal ? value * 100 : value;
    return `${Math.round(percentage)}%`;
}

/**
 * Format weight for display
 * @param weight - Weight value
 * @param unit - Unit suffix (default: none)
 * @returns Formatted weight string
 *
 * @example
 * formatWeight(100.5) // "100.5"
 * formatWeight(100.5, 'kg') // "100.5 kg"
 */
export function formatWeight(
    weight: number | string | null | undefined,
    unit?: string
): string {
    if (weight === null || weight === undefined || weight === '') return '-';

    const w = typeof weight === 'string' ? parseFloat(weight) : weight;
    if (isNaN(w)) return '-';

    // Remove unnecessary decimals
    let formatted: string;
    if (Math.abs(w % 1) < 0.0001) {
        formatted = Math.round(w).toString();
    } else {
        formatted = parseFloat(w.toFixed(2)).toString();
    }

    return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Format distance
 * @param meters - Distance in meters
 * @returns Formatted string with appropriate unit
 *
 * @example
 * formatDistance(500) // "500 m"
 * formatDistance(1500) // "1.5 km"
 */
export function formatDistance(meters: number | null | undefined): string {
    if (meters === null || meters === undefined) return '0 m';

    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
}

/**
 * Format steps count
 * @param steps - Number of steps
 * @returns Formatted string
 *
 * @example
 * formatSteps(1500) // "1,500"
 * formatSteps(15000) // "15K"
 */
export function formatSteps(steps: number | null | undefined): string {
    if (steps === null || steps === undefined) return '0';

    if (steps >= 10000) {
        return `${(steps / 1000).toFixed(1)}K`;
    }
    return steps.toLocaleString();
}

/**
 * Pluralize a word based on count
 * @param count - The count
 * @param singular - Singular form
 * @param plural - Plural form (default: singular + 's')
 * @returns Pluralized word
 *
 * @example
 * pluralize(1, 'exercise') // "exercise"
 * pluralize(5, 'exercise') // "exercises"
 * pluralize(1, 'person', 'people') // "person"
 */
export function pluralize(
    count: number,
    singular: string,
    plural?: string
): string {
    return count === 1 ? singular : (plural || `${singular}s`);
}

/**
 * Format count with label
 * @param count - The count
 * @param singular - Singular label
 * @param plural - Plural label
 * @returns Formatted string like "5 exercises"
 *
 * @example
 * formatCount(5, 'exercise') // "5 exercises"
 * formatCount(1, 'set') // "1 set"
 */
export function formatCount(
    count: number | null | undefined,
    singular: string,
    plural?: string
): string {
    const n = count ?? 0;
    return `${n} ${pluralize(n, singular, plural)}`;
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 *
 * @example
 * truncate("Hello World", 5) // "Hello..."
 */
export function truncate(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
}

/**
 * Capitalize first letter
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Format field name from snake_case or camelCase to Title Case
 * @param field - Field name
 * @returns Formatted field name
 *
 * @example
 * formatFieldName('reps_in_reserve') // "Reps In Reserve"
 * formatFieldName('bodyWeight') // "Body Weight"
 */
export function formatFieldName(field: string): string {
    // Handle snake_case
    if (field.includes('_')) {
        return field
            .split('_')
            .map(word => capitalize(word))
            .join(' ');
    }

    // Handle camelCase
    return field
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map(word => capitalize(word))
        .join(' ');
}

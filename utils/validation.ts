/**
 * Client-side validation utilities matching backend validation rules
 */

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validate supplement dosage
 */
export const validateSupplementDosage = (dosage: number): ValidationResult => {
    const errors: string[] = [];

    if (dosage <= 0) {
        errors.push('Dosage must be greater than 0');
    }
    if (dosage > 10000) {
        errors.push('Dosage is too high. Please check your input.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate supplement frequency
 */
export const validateSupplementFrequency = (frequency: string): ValidationResult => {
    const validFrequencies = ['daily', 'weekly', 'custom'];

    if (!validFrequencies.includes(frequency.toLowerCase())) {
        return {
            isValid: false,
            errors: [`Frequency must be one of: ${validFrequencies.join(', ')}`]
        };
    }

    return { isValid: true, errors: [] };
};

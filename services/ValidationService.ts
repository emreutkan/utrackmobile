export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface BackendValidationErrors {
    [field: string]: string | string[];
}

/**
 * ValidationService - Centralized validation and error formatting
 * Consolidates validation logic from active-workout screen and other components
 */
export const ValidationService = {
    /**
     * Format backend validation errors into user-friendly messages
     * @param validationErrors - Backend validation errors object
     * @returns Formatted error message string
     */
    formatValidationErrors(validationErrors: BackendValidationErrors | null | undefined): string {
        if (!validationErrors || typeof validationErrors !== 'object') {
            return 'Validation failed';
        }

        const messages: string[] = [];

        Object.keys(validationErrors).forEach(field => {
            const fieldErrors = validationErrors[field];

            if (Array.isArray(fieldErrors)) {
                fieldErrors.forEach((error: string) => {
                    messages.push(this.mapErrorToFriendlyMessage(field, error));
                });
            } else if (typeof fieldErrors === 'string') {
                messages.push(this.mapErrorToFriendlyMessage(field, fieldErrors));
            }
        });

        return messages.join('\n');
    },

    /**
     * Map a backend error message to a user-friendly message
     * @param field - The field name
     * @param error - The backend error message
     * @returns User-friendly error message
     */
    mapErrorToFriendlyMessage(field: string, error: string): string {
        // Common backend error patterns
        if (error.includes('less than or equal to 100')) {
            if (field === 'reps') return 'Reps must be between 1 and 100';
            if (field === 'reps_in_reserve') return 'RIR must be between 0 and 100';
            return `${this.formatFieldName(field)} must be at most 100`;
        }

        if (error.includes('less than or equal to 10800')) {
            return 'Rest time cannot exceed 3 hours';
        }

        if (error.includes('less than or equal to 600')) {
            return 'Time under tension cannot exceed 10 minutes';
        }

        if (error.includes('greater than or equal to 0')) {
            return `${this.formatFieldName(field)} cannot be negative`;
        }

        if (error.includes('greater than or equal to 1')) {
            return `${this.formatFieldName(field)} must be at least 1`;
        }

        if (error.includes('required')) {
            return `${this.formatFieldName(field)} is required`;
        }

        if (error.includes('valid number') || error.includes('valid integer')) {
            return `${this.formatFieldName(field)} must be a valid number`;
        }

        // Return original error if no mapping found
        return error;
    },

    /**
     * Format field name for display
     * @param field - Field name (snake_case or camelCase)
     * @returns Human-readable field name
     */
    formatFieldName(field: string): string {
        // Handle common field names
        const fieldMap: Record<string, string> = {
            'reps': 'Reps',
            'reps_in_reserve': 'RIR',
            'rest_time_before_set': 'Rest time',
            'total_tut': 'Time under tension',
            'weight': 'Weight',
            'dosage': 'Dosage',
            'frequency': 'Frequency',
            'name': 'Name',
            'email': 'Email',
            'password': 'Password',
            'height': 'Height',
            'body_weight': 'Body weight'
        };

        if (fieldMap[field]) {
            return fieldMap[field];
        }

        // Convert snake_case to Title Case
        return field
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },

    /**
     * Validate supplement data
     * @param data - Supplement data to validate
     * @returns ValidationResult
     */
    validateSupplementData(data: {
        name?: string;
        dosage?: string | number;
        frequency?: string;
    }): ValidationResult {
        const errors: string[] = [];

        if (!data.name || data.name.trim() === '') {
            errors.push('Name is required');
        }

        if (data.dosage !== undefined && data.dosage !== '') {
            const dosage = typeof data.dosage === 'string' ? parseFloat(data.dosage) : data.dosage;
            if (isNaN(dosage) || dosage <= 0) {
                errors.push('Dosage must be a positive number');
            }
        }

        if (!data.frequency || data.frequency.trim() === '') {
            errors.push('Frequency is required');
        }

        return { isValid: errors.length === 0, errors };
    },

    /**
     * Validate measurement data (height, weight)
     * @param data - Measurement data to validate
     * @returns ValidationResult
     */
    validateMeasurementData(data: {
        height?: string | number;
        weight?: string | number;
        type: 'height' | 'weight';
    }): ValidationResult {
        const errors: string[] = [];
        const value = data.type === 'height' ? data.height : data.weight;

        if (value === undefined || value === '') {
            errors.push(`${data.type === 'height' ? 'Height' : 'Weight'} is required`);
            return { isValid: false, errors };
        }

        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numValue)) {
            errors.push(`${data.type === 'height' ? 'Height' : 'Weight'} must be a valid number`);
            return { isValid: false, errors };
        }

        if (numValue <= 0) {
            errors.push(`${data.type === 'height' ? 'Height' : 'Weight'} must be positive`);
            return { isValid: false, errors };
        }

        // Reasonable limits
        if (data.type === 'height' && (numValue < 50 || numValue > 300)) {
            errors.push('Height must be between 50 and 300 cm');
        }

        if (data.type === 'weight' && (numValue < 20 || numValue > 500)) {
            errors.push('Weight must be between 20 and 500 kg');
        }

        return { isValid: errors.length === 0, errors };
    },

    /**
     * Validate email format
     * @param email - Email string to validate
     * @returns ValidationResult
     */
    validateEmail(email: string): ValidationResult {
        const errors: string[] = [];

        if (!email || email.trim() === '') {
            errors.push('Email is required');
            return { isValid: false, errors };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('Please enter a valid email address');
        }

        return { isValid: errors.length === 0, errors };
    },

    /**
     * Validate password strength
     * @param password - Password string to validate
     * @param options - Validation options
     * @returns ValidationResult
     */
    validatePassword(
        password: string,
        options: { minLength?: number; requireNumbers?: boolean } = {}
    ): ValidationResult {
        const { minLength = 8, requireNumbers = true } = options;
        const errors: string[] = [];

        if (!password || password.length === 0) {
            errors.push('Password is required');
            return { isValid: false, errors };
        }

        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters`);
        }

        if (requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        return { isValid: errors.length === 0, errors };
    }
};

export default ValidationService;

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

/**
 * Validate date (cannot be in the future)
 */
export const validateSupplementDate = (date: string): ValidationResult => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (selectedDate > today) {
        return {
            isValid: false,
            errors: ['Date cannot be in the future']
        };
    }
    
    return { isValid: true, errors: [] };
};

/**
 * Validate time (cannot be in the future if date is today)
 */
export const validateSupplementTime = (date: string, time: string): ValidationResult => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    // If date is today, check if time is in the future
    if (selectedDate.getTime() === today.getTime()) {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const selectedDateTime = new Date();
        selectedDateTime.setHours(hours, minutes || 0, 0, 0);
        
        if (selectedDateTime > now) {
            return {
                isValid: false,
                errors: ['Time cannot be in the future if date is today']
            };
        }
    }
    
    return { isValid: true, errors: [] };
};

/**
 * Validate body measurement height
 */
export const validateHeight = (height: number): ValidationResult => {
    if (height < 50 || height > 300) {
        return {
            isValid: false,
            errors: ['Height must be between 50 and 300 cm']
        };
    }
    return { isValid: true, errors: [] };
};

/**
 * Validate body measurement weight
 */
export const validateWeight = (weight: number): ValidationResult => {
    if (weight < 20 || weight > 500) {
        return {
            isValid: false,
            errors: ['Weight must be between 20 and 500 kg']
        };
    }
    return { isValid: true, errors: [] };
};

/**
 * Validate body measurement waist
 */
export const validateWaist = (waist: number): ValidationResult => {
    if (waist < 30 || waist > 200) {
        return {
            isValid: false,
            errors: ['Waist must be between 30 and 200 cm']
        };
    }
    return { isValid: true, errors: [] };
};

/**
 * Validate body measurement neck
 */
export const validateNeck = (neck: number): ValidationResult => {
    if (neck < 20 || neck > 80) {
        return {
            isValid: false,
            errors: ['Neck must be between 20 and 80 cm']
        };
    }
    return { isValid: true, errors: [] };
};

/**
 * Validate body measurement hips (required for women)
 */
export const validateHips = (hips: number | undefined, gender: 'male' | 'female'): ValidationResult => {
    if (gender === 'female') {
        if (!hips) {
            return {
                isValid: false,
                errors: ['Hips measurement is required for women']
            };
        }
        if (hips < 50 || hips > 200) {
            return {
                isValid: false,
                errors: ['Hips must be between 50 and 200 cm']
            };
        }
    }
    return { isValid: true, errors: [] };
};

/**
 * Cross-validate waist and neck (waist must be greater than neck)
 */
export const validateWaistNeck = (waist: number, neck: number): ValidationResult => {
    if (waist <= neck) {
        return {
            isValid: false,
            errors: ['Waist must be greater than neck measurement']
        };
    }
    return { isValid: true, errors: [] };
};

/**
 * Validate all body measurements
 */
export const validateBodyMeasurements = (data: {
    height?: number;
    weight?: number;
    waist?: number;
    neck?: number;
    hips?: number;
    gender?: 'male' | 'female';
}): ValidationResult => {
    const errors: string[] = [];
    
    if (data.height !== undefined) {
        const heightResult = validateHeight(data.height);
        if (!heightResult.isValid) {
            errors.push(...heightResult.errors);
        }
    }
    
    if (data.weight !== undefined) {
        const weightResult = validateWeight(data.weight);
        if (!weightResult.isValid) {
            errors.push(...weightResult.errors);
        }
    }
    
    if (data.waist !== undefined) {
        const waistResult = validateWaist(data.waist);
        if (!waistResult.isValid) {
            errors.push(...waistResult.errors);
        }
    }
    
    if (data.neck !== undefined) {
        const neckResult = validateNeck(data.neck);
        if (!neckResult.isValid) {
            errors.push(...neckResult.errors);
        }
    }
    
    if (data.gender && data.hips !== undefined) {
        const hipsResult = validateHips(data.hips, data.gender);
        if (!hipsResult.isValid) {
            errors.push(...hipsResult.errors);
        }
    }
    
    // Cross-validation: waist > neck
    if (data.waist !== undefined && data.neck !== undefined) {
        const crossResult = validateWaistNeck(data.waist, data.neck);
        if (!crossResult.isValid) {
            errors.push(...crossResult.errors);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

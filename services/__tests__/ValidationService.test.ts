import { ValidationService } from '../ValidationService';

describe('ValidationService', () => {
    describe('formatValidationErrors', () => {
        it('should handle null input', () => {
            expect(ValidationService.formatValidationErrors(null)).toBe('Validation failed');
        });

        it('should handle undefined input', () => {
            expect(ValidationService.formatValidationErrors(undefined)).toBe('Validation failed');
        });

        it('should format array of errors', () => {
            const errors = {
                reps: ['Ensure this value is less than or equal to 100.']
            };
            const result = ValidationService.formatValidationErrors(errors);
            expect(result).toBe('Reps must be between 1 and 100');
        });

        it('should format multiple fields', () => {
            const errors = {
                reps: ['Ensure this value is less than or equal to 100.'],
                weight: ['Ensure this value is greater than or equal to 0.']
            };
            const result = ValidationService.formatValidationErrors(errors);
            expect(result).toContain('Reps must be between 1 and 100');
            expect(result).toContain('Weight cannot be negative');
        });

        it('should handle string error values', () => {
            const errors = {
                name: 'This field is required'
            };
            const result = ValidationService.formatValidationErrors(errors);
            expect(result).toBe('This field is required');
        });

        it('should format rest time error', () => {
            const errors = {
                rest_time_before_set: ['Ensure this value is less than or equal to 10800.']
            };
            const result = ValidationService.formatValidationErrors(errors);
            expect(result).toBe('Rest time cannot exceed 3 hours');
        });

        it('should format TUT error', () => {
            const errors = {
                total_tut: ['Ensure this value is less than or equal to 600.']
            };
            const result = ValidationService.formatValidationErrors(errors);
            expect(result).toBe('Time under tension cannot exceed 10 minutes');
        });
    });

    describe('mapErrorToFriendlyMessage', () => {
        it('should map reps error', () => {
            const result = ValidationService.mapErrorToFriendlyMessage(
                'reps',
                'Ensure this value is less than or equal to 100.'
            );
            expect(result).toBe('Reps must be between 1 and 100');
        });

        it('should map RIR error', () => {
            const result = ValidationService.mapErrorToFriendlyMessage(
                'reps_in_reserve',
                'Ensure this value is less than or equal to 100.'
            );
            expect(result).toBe('RIR must be between 0 and 100');
        });

        it('should return original error for unknown patterns', () => {
            const result = ValidationService.mapErrorToFriendlyMessage(
                'field',
                'Some unknown error'
            );
            expect(result).toBe('Some unknown error');
        });
    });

    describe('formatFieldName', () => {
        it('should format snake_case', () => {
            expect(ValidationService.formatFieldName('reps_in_reserve')).toBe('Reps In Reserve');
        });

        it('should handle single word', () => {
            expect(ValidationService.formatFieldName('reps')).toBe('Reps');
        });

        it('should handle known field names', () => {
            expect(ValidationService.formatFieldName('reps')).toBe('Reps');
            expect(ValidationService.formatFieldName('total_tut')).toBe('Time under tension');
        });
    });

    describe('validateSupplementData', () => {
        it('should pass valid data', () => {
            const result = ValidationService.validateSupplementData({
                name: 'Vitamin D',
                dosage: 1000,
                frequency: 'daily'
            });
            expect(result.isValid).toBe(true);
        });

        it('should reject empty name', () => {
            const result = ValidationService.validateSupplementData({
                name: '',
                dosage: 1000,
                frequency: 'daily'
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Name is required');
        });

        it('should reject negative dosage', () => {
            const result = ValidationService.validateSupplementData({
                name: 'Vitamin D',
                dosage: -1,
                frequency: 'daily'
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Dosage must be a positive number');
        });

        it('should reject empty frequency', () => {
            const result = ValidationService.validateSupplementData({
                name: 'Vitamin D',
                dosage: 1000,
                frequency: ''
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Frequency is required');
        });
    });

    describe('validateMeasurementData', () => {
        it('should pass valid height', () => {
            const result = ValidationService.validateMeasurementData({
                height: 180,
                type: 'height'
            });
            expect(result.isValid).toBe(true);
        });

        it('should pass valid weight', () => {
            const result = ValidationService.validateMeasurementData({
                weight: 75,
                type: 'weight'
            });
            expect(result.isValid).toBe(true);
        });

        it('should reject out of range height', () => {
            const result = ValidationService.validateMeasurementData({
                height: 400,
                type: 'height'
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Height must be between 50 and 300 cm');
        });

        it('should reject out of range weight', () => {
            const result = ValidationService.validateMeasurementData({
                weight: 600,
                type: 'weight'
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Weight must be between 20 and 500 kg');
        });
    });

    describe('validateEmail', () => {
        it('should pass valid email', () => {
            const result = ValidationService.validateEmail('test@example.com');
            expect(result.isValid).toBe(true);
        });

        it('should reject invalid email', () => {
            const result = ValidationService.validateEmail('invalid-email');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Please enter a valid email address');
        });

        it('should reject empty email', () => {
            const result = ValidationService.validateEmail('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Email is required');
        });
    });

    describe('validatePassword', () => {
        it('should pass valid password', () => {
            const result = ValidationService.validatePassword('password123');
            expect(result.isValid).toBe(true);
        });

        it('should reject short password', () => {
            const result = ValidationService.validatePassword('pass1');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters');
        });

        it('should reject password without numbers when required', () => {
            const result = ValidationService.validatePassword('passwordonly');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should allow password without numbers when not required', () => {
            const result = ValidationService.validatePassword('passwordonly', { requireNumbers: false });
            expect(result.isValid).toBe(true);
        });

        it('should reject empty password', () => {
            const result = ValidationService.validatePassword('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password is required');
        });
    });
});

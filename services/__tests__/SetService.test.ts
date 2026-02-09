import { SetService } from '../SetService';

describe('SetService', () => {
    describe('validateSetData', () => {
        it('should pass valid set data', () => {
            const result = SetService.validateSetData({
                weight: 100,
                reps: 10,
                reps_in_reserve: 2,
                rest_time_before_set: 90
            });

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject reps > 100', () => {
            const result = SetService.validateSetData({ reps: 101 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Reps must be between 1 and 100');
        });

        it('should reject reps < 1', () => {
            const result = SetService.validateSetData({ reps: 0 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Reps must be between 1 and 100');
        });

        it('should accept string reps', () => {
            const result = SetService.validateSetData({ reps: '10' });
            expect(result.isValid).toBe(true);
        });

        it('should reject RIR > 100', () => {
            const result = SetService.validateSetData({ reps_in_reserve: 101 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('RIR must be between 0 and 100');
        });

        it('should reject negative RIR', () => {
            const result = SetService.validateSetData({ reps_in_reserve: -1 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('RIR must be between 0 and 100');
        });

        it('should accept RIR of 0', () => {
            const result = SetService.validateSetData({ reps_in_reserve: 0 });
            expect(result.isValid).toBe(true);
        });

        it('should reject rest time > 3 hours', () => {
            const result = SetService.validateSetData({ rest_time_before_set: 10801 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Rest time cannot exceed 3 hours');
        });

        it('should reject TUT > 10 minutes', () => {
            const result = SetService.validateSetData({ total_tut: 601 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Time under tension cannot exceed 10 minutes');
        });

        it('should reject negative weight', () => {
            const result = SetService.validateSetData({ weight: -10 });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Weight cannot be negative');
        });

        it('should allow empty values', () => {
            const result = SetService.validateSetData({});
            expect(result.isValid).toBe(true);
        });
    });

    describe('formatWeight', () => {
        it('should format whole numbers without decimals', () => {
            expect(SetService.formatWeight(100)).toBe('100');
        });

        it('should format decimals correctly', () => {
            expect(SetService.formatWeight(100.5)).toBe('100.5');
        });

        it('should remove trailing zeros', () => {
            expect(SetService.formatWeight(100.00)).toBe('100');
        });

        it('should handle string input', () => {
            expect(SetService.formatWeight('100.5')).toBe('100.5');
        });

        it('should return "-" for null', () => {
            expect(SetService.formatWeight(null)).toBe('-');
        });

        it('should return "-" for undefined', () => {
            expect(SetService.formatWeight(undefined)).toBe('-');
        });

        it('should return "-" for invalid string', () => {
            expect(SetService.formatWeight('abc')).toBe('-');
        });
    });

    describe('parseRestTimeInput', () => {
        it('should parse seconds directly', () => {
            expect(SetService.parseRestTimeInput('90')).toBe(90);
        });

        it('should parse minute notation', () => {
            expect(SetService.parseRestTimeInput('1.30')).toBe(90);
        });

        it('should parse whole minutes', () => {
            expect(SetService.parseRestTimeInput('2.00')).toBe(120);
        });

        it('should return 0 for empty string', () => {
            expect(SetService.parseRestTimeInput('')).toBe(0);
        });

        it('should return 0 for invalid input', () => {
            expect(SetService.parseRestTimeInput('abc')).toBe(0);
        });
    });

    describe('formatRestTimeForDisplay', () => {
        it('should format seconds less than minute', () => {
            expect(SetService.formatRestTimeForDisplay(45)).toBe('45');
        });

        it('should format exact minutes', () => {
            expect(SetService.formatRestTimeForDisplay(120)).toBe('2');
        });

        it('should format minutes with seconds', () => {
            expect(SetService.formatRestTimeForDisplay(90)).toBe('1.30');
        });

        it('should return empty for 0', () => {
            expect(SetService.formatRestTimeForDisplay(0)).toBe('');
        });

        it('should return empty for null', () => {
            expect(SetService.formatRestTimeForDisplay(null)).toBe('');
        });
    });

    describe('calculate1RM', () => {
        it('should return weight for 1 rep', () => {
            expect(SetService.calculate1RM(100, 1)).toBe(100);
        });

        it('should calculate 1RM using Brzycki formula', () => {
            // 100kg x 10 reps ≈ 133kg 1RM
            const result = SetService.calculate1RM(100, 10);
            expect(result).toBeCloseTo(133.33, 1);
        });

        it('should return 0 for invalid inputs', () => {
            expect(SetService.calculate1RM(0, 10)).toBe(0);
            expect(SetService.calculate1RM(100, 0)).toBe(0);
        });
    });

    describe('calculateVolume', () => {
        it('should calculate weight × reps', () => {
            expect(SetService.calculateVolume(100, 10)).toBe(1000);
        });

        it('should return 0 for missing values', () => {
            expect(SetService.calculateVolume(0, 10)).toBe(0);
            expect(SetService.calculateVolume(100, 0)).toBe(0);
        });
    });

    describe('calculateTotalVolume', () => {
        it('should sum volume across sets', () => {
            const sets = [
                { weight: 100, reps: 10 },
                { weight: 100, reps: 8 },
                { weight: 90, reps: 6 }
            ];
            expect(SetService.calculateTotalVolume(sets)).toBe(2340);
        });

        it('should handle missing values', () => {
            const sets = [
                { weight: 100, reps: 10 },
                { weight: undefined, reps: 8 },
                { reps: 6 }
            ];
            expect(SetService.calculateTotalVolume(sets)).toBe(1000);
        });
    });

    describe('formatTUT', () => {
        it('should format seconds', () => {
            expect(SetService.formatTUT(45)).toBe('45s');
        });

        it('should format minutes', () => {
            expect(SetService.formatTUT(90)).toBe('1:30');
        });

        it('should return "-" for null', () => {
            expect(SetService.formatTUT(null)).toBe('-');
        });
    });
});

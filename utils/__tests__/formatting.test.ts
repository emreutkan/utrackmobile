import {
    formatVolume,
    formatNumber,
    formatPercentage,
    formatWeight,
    formatDistance,
    formatSteps,
    pluralize,
    formatCount,
    truncate,
    capitalize,
    formatFieldName
} from '../formatting';

describe('formatting utilities', () => {
    describe('formatVolume', () => {
        it('should format small numbers', () => {
            expect(formatVolume(500)).toBe('500');
        });

        it('should format thousands with K suffix', () => {
            expect(formatVolume(1500)).toBe('1.5K');
        });

        it('should format millions with M suffix', () => {
            expect(formatVolume(1500000)).toBe('1.5M');
        });

        it('should format billions with T suffix', () => {
            expect(formatVolume(1500000000)).toBe('1.5T');
        });

        it('should handle null', () => {
            expect(formatVolume(null)).toBe('0');
        });

        it('should handle undefined', () => {
            expect(formatVolume(undefined)).toBe('0');
        });
    });

    describe('formatNumber', () => {
        it('should format whole numbers', () => {
            expect(formatNumber(100)).toBe('100');
        });

        it('should format decimals', () => {
            expect(formatNumber(100.567, 2)).toBe('100.57');
        });

        it('should remove trailing zeros', () => {
            expect(formatNumber(100.50, 2)).toBe('100.5');
        });

        it('should return "-" for null', () => {
            expect(formatNumber(null)).toBe('-');
        });

        it('should handle string input', () => {
            expect(formatNumber('123.456', 2)).toBe('123.46');
        });

        it('should return "-" for invalid string', () => {
            expect(formatNumber('abc')).toBe('-');
        });
    });

    describe('formatPercentage', () => {
        it('should format decimal as percentage', () => {
            expect(formatPercentage(0.75, true)).toBe('75%');
        });

        it('should format percentage value', () => {
            expect(formatPercentage(75, false)).toBe('75%');
        });

        it('should round to nearest integer', () => {
            expect(formatPercentage(0.756, true)).toBe('76%');
        });

        it('should handle null', () => {
            expect(formatPercentage(null)).toBe('0%');
        });
    });

    describe('formatWeight', () => {
        it('should format whole numbers', () => {
            expect(formatWeight(100)).toBe('100');
        });

        it('should format decimals', () => {
            expect(formatWeight(100.5)).toBe('100.5');
        });

        it('should add unit suffix', () => {
            expect(formatWeight(100, 'kg')).toBe('100 kg');
        });

        it('should return "-" for null', () => {
            expect(formatWeight(null)).toBe('-');
        });

        it('should handle string input', () => {
            expect(formatWeight('100.5')).toBe('100.5');
        });
    });

    describe('formatDistance', () => {
        it('should format meters', () => {
            expect(formatDistance(500)).toBe('500 m');
        });

        it('should format kilometers', () => {
            expect(formatDistance(1500)).toBe('1.5 km');
        });

        it('should handle null', () => {
            expect(formatDistance(null)).toBe('0 m');
        });
    });

    describe('formatSteps', () => {
        it('should format small numbers with commas', () => {
            expect(formatSteps(1500)).toBe('1,500');
        });

        it('should format large numbers with K suffix', () => {
            expect(formatSteps(15000)).toBe('15.0K');
        });

        it('should handle null', () => {
            expect(formatSteps(null)).toBe('0');
        });
    });

    describe('pluralize', () => {
        it('should return singular for count of 1', () => {
            expect(pluralize(1, 'exercise')).toBe('exercise');
        });

        it('should return plural for count > 1', () => {
            expect(pluralize(5, 'exercise')).toBe('exercises');
        });

        it('should return plural for count of 0', () => {
            expect(pluralize(0, 'exercise')).toBe('exercises');
        });

        it('should use custom plural', () => {
            expect(pluralize(2, 'person', 'people')).toBe('people');
        });
    });

    describe('formatCount', () => {
        it('should format count with singular label', () => {
            expect(formatCount(1, 'exercise')).toBe('1 exercise');
        });

        it('should format count with plural label', () => {
            expect(formatCount(5, 'exercise')).toBe('5 exercises');
        });

        it('should handle null count', () => {
            expect(formatCount(null, 'set')).toBe('0 sets');
        });
    });

    describe('truncate', () => {
        it('should truncate long text', () => {
            expect(truncate('Hello World', 5)).toBe('Hello...');
        });

        it('should not truncate short text', () => {
            expect(truncate('Hello', 10)).toBe('Hello');
        });

        it('should handle empty string', () => {
            expect(truncate('', 5)).toBe('');
        });
    });

    describe('capitalize', () => {
        it('should capitalize first letter', () => {
            expect(capitalize('hello')).toBe('Hello');
        });

        it('should handle empty string', () => {
            expect(capitalize('')).toBe('');
        });

        it('should handle single character', () => {
            expect(capitalize('a')).toBe('A');
        });
    });

    describe('formatFieldName', () => {
        it('should format snake_case', () => {
            expect(formatFieldName('reps_in_reserve')).toBe('Reps In Reserve');
        });

        it('should handle single word', () => {
            expect(formatFieldName('reps')).toBe('Reps');
        });

        it('should format camelCase', () => {
            expect(formatFieldName('bodyWeight')).toBe('Body Weight');
        });
    });
});

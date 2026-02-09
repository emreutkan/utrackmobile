import { TimerService } from '../TimerService';

describe('TimerService', () => {
    describe('formatElapsedTime', () => {
        it('should return 00:00:00 for null input', () => {
            expect(TimerService.formatElapsedTime(null)).toBe('00:00:00');
        });

        it('should format elapsed time correctly', () => {
            // Create a date that is 1 hour, 23 minutes, and 45 seconds ago
            const now = Date.now();
            const startTime = new Date(now - (1 * 60 * 60 * 1000 + 23 * 60 * 1000 + 45 * 1000));

            const result = TimerService.formatElapsedTime(startTime);

            // Allow for slight timing differences
            expect(result).toMatch(/^01:23:4[45]$/);
        });

        it('should handle ISO string input', () => {
            const now = Date.now();
            const startTime = new Date(now - 3661000).toISOString(); // 1h 1m 1s ago

            const result = TimerService.formatElapsedTime(startTime);
            expect(result).toMatch(/^01:01:0[012]$/);
        });

        it('should handle zero elapsed time', () => {
            const result = TimerService.formatElapsedTime(new Date());
            expect(result).toBe('00:00:00');
        });
    });

    describe('getElapsedSeconds', () => {
        it('should return 0 for null input', () => {
            expect(TimerService.getElapsedSeconds(null)).toBe(0);
        });

        it('should calculate seconds correctly', () => {
            const now = Date.now();
            const startTime = new Date(now - 65000); // 65 seconds ago

            const result = TimerService.getElapsedSeconds(startTime);
            expect(result).toBeGreaterThanOrEqual(64);
            expect(result).toBeLessThanOrEqual(66);
        });
    });

    describe('formatRestTime', () => {
        it('should format 0 seconds', () => {
            expect(TimerService.formatRestTime(0)).toBe('0:00');
        });

        it('should format seconds less than a minute', () => {
            expect(TimerService.formatRestTime(45)).toBe('0:45');
        });

        it('should format minutes and seconds', () => {
            expect(TimerService.formatRestTime(90)).toBe('1:30');
        });

        it('should format multiple minutes', () => {
            expect(TimerService.formatRestTime(185)).toBe('3:05');
        });
    });

    describe('formatDuration', () => {
        it('should format seconds only', () => {
            expect(TimerService.formatDuration(45)).toBe('45s');
        });

        it('should format minutes only', () => {
            expect(TimerService.formatDuration(300)).toBe('5m');
        });

        it('should format hours and minutes', () => {
            expect(TimerService.formatDuration(5400)).toBe('1h 30m');
        });

        it('should format hours without minutes when exact', () => {
            expect(TimerService.formatDuration(3600)).toBe('1h');
        });

        it('should handle zero', () => {
            expect(TimerService.formatDuration(0)).toBe('0s');
        });

        it('should handle negative', () => {
            expect(TimerService.formatDuration(-10)).toBe('0s');
        });
    });

    describe('getRestStatus', () => {
        describe('isolation exercises', () => {
            it('should return Resting status for < 60 seconds', () => {
                const status = TimerService.getRestStatus(30, 'isolation');
                expect(status.text).toBe('Resting');
                expect(status.goal).toBe(60);
            });

            it('should return Readying status for 60-90 seconds', () => {
                const status = TimerService.getRestStatus(75, 'isolation');
                expect(status.text).toBe('Readying');
            });

            it('should return Ready status for >= 90 seconds', () => {
                const status = TimerService.getRestStatus(95, 'isolation');
                expect(status.text).toBe('Ready');
            });
        });

        describe('compound exercises', () => {
            it('should return Resting status for < 90 seconds', () => {
                const status = TimerService.getRestStatus(60, 'compound');
                expect(status.text).toBe('Resting');
                expect(status.goal).toBe(90);
            });

            it('should return Readying status for 90-180 seconds', () => {
                const status = TimerService.getRestStatus(120, 'compound');
                expect(status.text).toBe('Readying');
            });

            it('should return Ready status for >= 180 seconds', () => {
                const status = TimerService.getRestStatus(200, 'compound');
                expect(status.text).toBe('Ready');
            });
        });

        it('should default to isolation thresholds', () => {
            const status = TimerService.getRestStatus(75);
            expect(status.text).toBe('Readying');
        });
    });

    describe('calculateProgress', () => {
        it('should return 0 for 0 elapsed', () => {
            expect(TimerService.calculateProgress(0, 100)).toBe(0);
        });

        it('should return 0.5 for half progress', () => {
            expect(TimerService.calculateProgress(50, 100)).toBe(0.5);
        });

        it('should cap at 1 for exceeded goal', () => {
            expect(TimerService.calculateProgress(150, 100)).toBe(1);
        });

        it('should handle zero maxGoal', () => {
            expect(TimerService.calculateProgress(50, 0)).toBe(0);
        });
    });

    describe('formatGoal', () => {
        it('should format goal time correctly', () => {
            expect(TimerService.formatGoal(90)).toBe('1:30');
            expect(TimerService.formatGoal(180)).toBe('3:00');
            expect(TimerService.formatGoal(45)).toBe('0:45');
        });
    });
});

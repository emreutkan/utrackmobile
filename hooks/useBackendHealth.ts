import { useState, useEffect, useRef } from 'react';
import { checkApiHealth } from '@/api/healthCheck';
import axios from 'axios';

const HEALTH_CHECK_INTERVAL = 10000; // Check every 10 seconds
const MAX_CONSECUTIVE_FAILURES = 2; // Show maintenance after 2 consecutive failures

export function useBackendHealth() {
    const [isBackendDown, setIsBackendDown] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const consecutiveFailuresRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const checkHealth = async () => {
        try {
            const health = await checkApiHealth();
            if (health && 'status' in health && health.status === 'healthy') {
                consecutiveFailuresRef.current = 0;
                setIsBackendDown(false);
                setIsChecking(false);
            } else {
                consecutiveFailuresRef.current += 1;
                if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
                    setIsBackendDown(true);
                    setIsChecking(false);
                }
            }
        } catch (error: any) {
            // Network errors, timeouts, etc.
            consecutiveFailuresRef.current += 1;
            if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
                setIsBackendDown(true);
                setIsChecking(false);
            }
        }
    };

    useEffect(() => {
        // Initial check
        checkHealth();

        // Set up periodic checks
        intervalRef.current = setInterval(() => {
            if (!isBackendDown) {
                checkHealth();
            }
        }, HEALTH_CHECK_INTERVAL);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // When backend is down, keep checking for recovery
    useEffect(() => {
        if (isBackendDown) {
            const recoveryInterval = setInterval(async () => {
                try {
                    const health = await checkApiHealth();
                    if (health && 'status' in health && health.status === 'healthy') {
                        consecutiveFailuresRef.current = 0;
                        setIsBackendDown(false);
                        setIsChecking(false);
                    }
                } catch (error) {
                    // Still down, keep checking
                }
            }, HEALTH_CHECK_INTERVAL);

            return () => clearInterval(recoveryInterval);
        }
    }, [isBackendDown]);

    return { isBackendDown, isChecking };
}

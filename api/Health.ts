import HealthKitModule, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

// react-native-health uses CJS; Metro may expose it as default or as the module
const AppleHealthKit =
  (HealthKitModule as any)?.default ?? HealthKitModule;

const permissions: HealthKitPermissions = {
  permissions: {
    read: [AppleHealthKit?.Constants?.Permissions?.Steps ?? 'Steps'],
    write: [],
  },
};

export const useHealthKit = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [steps, setSteps] = useState<number | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    if (!AppleHealthKit?.initHealthKit) {
      console.warn(
        'HealthKit native module not available (e.g. Expo Go). Use a dev build for iOS.'
      );
      return;
    }

    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        console.error('Error initializing HealthKit:', error);
        setHasPermission(false);
        return;
      }
      setHasPermission(true);

      const options = {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getStepCount(options, (err: string, result: HealthValue) => {
        if (err) {
          console.error('Error getting step count:', err);
          return;
        }
        setSteps(result.value);
      });
    });
  }, []);

  return { hasPermission, steps };
};

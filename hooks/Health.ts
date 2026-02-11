import HealthKitModule, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';
import { useState, useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

// react-native-health uses CJS; Metro may expose it as default or as the module
const PackageExport = (HealthKitModule as any)?.default ?? HealthKitModule;

function getHealthKitNativeModule(): typeof NativeModules[keyof typeof NativeModules] | null {
  const names = [
    'AppleHealthKit',
    'RCTAppleHealthKit',
    'RNAppleHealthKit',
  ];
  for (const name of names) {
    const mod = (NativeModules as any)[name];
    if (mod?.initHealthKit) return mod;
  }
  // Fallback: find any native module that has initHealthKit (e.g. different RN/Expo naming)
  for (const key of Object.keys(NativeModules)) {
    const mod = (NativeModules as any)[key];
    if (mod?.initHealthKit) return mod;
  }
  return null;
}

const NativeHealthKit = getHealthKitNativeModule();
// Use the native module directly (don't spread) so bridge methods like getStepCount are preserved
const AppleHealthKit = NativeHealthKit ?? PackageExport;
if (AppleHealthKit && PackageExport?.Constants) {
  (AppleHealthKit as any).Constants = PackageExport.Constants;
}

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
      if (__DEV__) {
        const keys = Object.keys(NativeModules).filter(
          (k) =>
            k.toLowerCase().includes('health') ||
            k.toLowerCase().includes('apple')
        );
        console.warn(
          'HealthKit native module not available. Expected one of: AppleHealthKit, RCTAppleHealthKit, RNAppleHealthKit. Found related:',
          keys.length ? keys : 'none. Rebuild iOS (npx expo run:ios or prebuild --clean).'
        );
      }
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

import { Redirect } from 'expo-router';
import { useUser } from '@/hooks/useUser';
import LoadingScreen from './(loading)/LoadingView';

/**
 * Root index: ensures authenticated users land on Home (not Account).
 * Without this, Expo Router often picks (account) first (alphabetical), so the bottom tab bar shows Account as active.
 */
export default function Index() {
  const { data, isLoading } = useUser();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (data) {
    return <Redirect href="/(home)" />;
  }

  return <Redirect href="/(hero)" />;
}

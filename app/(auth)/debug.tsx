import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storeAccessToken, storeRefreshToken } from '@/hooks/Storage';
import { useLogin } from '@/hooks/useAuth';
export default function DebugView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { mutateAsync } = useLogin();

  const handleDebugLogin = async () => {
    try {
      const data = await mutateAsync({
        email: 'irfanemreutkan@outlook.com',
        password: 'irfanemreutkan@outlook.com',
      });
      if (data?.access && data?.refresh) {
        await storeAccessToken(data.access);
        await storeRefreshToken(data.refresh);
      }
      router.replace('/(home)');
    } catch (error) {
      console.error('Error during debug login:', error);
    }
  };
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>Debug Menu</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <Pressable
            style={[styles.button, { backgroundColor: '#c084fc', marginBottom: 12 }]}
            onPress={() => router.push('/hero')}
          >
            <Ionicons
              name="sparkles-outline"
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.buttonText}>Go to Hero Screen</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={handleDebugLogin}>
            <Text style={styles.buttonText}>Debug Login</Text>
          </Pressable>

          <Pressable
            style={[styles.button, { marginTop: 12, backgroundColor: '#32D74B' }]}
            onPress={() => router.replace('/(home)')}
          >
            <Ionicons name="home-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Go to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0A84FF',
    borderRadius: 22,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '400',
  },
});

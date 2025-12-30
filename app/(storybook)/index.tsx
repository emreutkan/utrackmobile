import StorybookUIRoot from '../../storybook';
import { View, StyleSheet, Text, Platform } from 'react-native';

export default function StorybookScreen() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webMessage}>
          <Text style={styles.webMessageText}>
            Storybook is only available on native platforms (iOS/Android).
          </Text>
          <Text style={styles.webMessageSubtext}>
            Please use the mobile app to access Storybook.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StorybookUIRoot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  webMessageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  webMessageSubtext: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
});




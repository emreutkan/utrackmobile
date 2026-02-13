import { theme, typographyStyles } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView as RNScrollView, StyleSheet, Text, View } from 'react-native';
import LoadingSkeleton from '../(home)/components/homeLoadingSkeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />
      <RNScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.forceHeader}>
          <Text style={typographyStyles.h1}>
            FORCE<Text style={{ color: theme.colors.status.active }}>.</Text>
          </Text>
        </View>
        <LoadingSkeleton />
        <LoadingSkeleton type="recovery" />
        <LoadingSkeleton type="templates" />
      </RNScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: { padding: theme.spacing.s },
  forceHeader: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.m,
    marginTop: theme.spacing.s,
  },
});

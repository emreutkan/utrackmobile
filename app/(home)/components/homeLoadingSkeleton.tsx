import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { View, ScrollView, StyleSheet } from 'react-native';

import { theme } from '@/constants/theme';
import { useEffect } from 'react';

interface LoadingSkeletonProps {
  type?: 'workout' | 'recovery' | 'templates';
}

const LoadingSkeleton = ({ type = 'workout' }: LoadingSkeletonProps) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (type === 'templates') {
    return (
      <View style={styles.skeletonTemplatesContainer}>
        <View style={styles.skeletonHeader} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16 }}
        >
          {[1, 2].map((i) => (
            <Animated.View key={i} style={[styles.skeletonTemplateCard, animatedStyle]} />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.skeletonContainer, type === 'recovery' && { height: 200 }]}>
      <Animated.View
        style={[styles.skeletonCard, animatedStyle, type === 'recovery' && { height: 180 }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Skeleton
  skeletonContainer: { marginBottom: theme.spacing.m },
  skeletonCard: {
    width: '100%',
    height: 160,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  skeletonTemplatesContainer: { marginTop: theme.spacing.m },
  skeletonHeader: {
    width: 150,
    height: 14,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 4,
    marginBottom: theme.spacing.m,
  },
  skeletonTemplateCard: {
    width: 280,
    height: 120,
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
});

export default LoadingSkeleton;

import { theme } from '@/constants/theme';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useCreateWorkout } from '@/hooks/useWorkout';

interface StartWorkoutMenuProps {
  visible: boolean;
  menuLayout: { x: number; y: number; width: number };
  onClose: () => void;
  onNewWorkout: () => void;
  onLogPrevious: () => void;
  onRefresh: () => void;
}

export default function StartWorkoutMenu({
  visible,
  menuLayout,
  onClose,
  onNewWorkout,
  onLogPrevious,
  onRefresh,
}: StartWorkoutMenuProps) {
  const createWorkoutMutation = useCreateWorkout();

  if (!visible) return null;

  const handleRestDay = async () => {
    onClose();
    try {
      await createWorkoutMutation.mutateAsync({ title: 'Rest Day', is_rest_day: true });
      onRefresh();
    } catch (error) {
      console.error('Error creating rest day:', error);
      Alert.alert('Error', 'Failed to create rest day');
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View
        style={[styles.popover, { top: menuLayout.y, left: menuLayout.x, width: menuLayout.width }]}
      >
        <View style={styles.popoverBlur}>
          <TouchableOpacity
            style={styles.popoverItem}
            onPress={() => {
              onClose();
              onNewWorkout();
            }}
          >
            <Text style={styles.popoverText}>New Workout</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.popoverItem}
            onPress={() => {
              onClose();
              onLogPrevious();
            }}
          >
            <Text style={styles.popoverText}>Log Previous</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.popoverItem} onPress={handleRestDay}>
            <Text style={styles.popoverText}>Rest Day</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 },
  popover: {
    position: 'absolute',
    zIndex: 101,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
  },
  popoverBlur: {
    padding: 0,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    gap: theme.spacing.s,
  },
  popoverText: { color: theme.colors.text.primary, fontSize: theme.typography.sizes.m },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.text.tertiary },
});

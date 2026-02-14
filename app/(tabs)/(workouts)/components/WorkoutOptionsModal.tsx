import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, Pressable, View } from 'react-native';

interface WorkoutOptionsModalProps {
  visible: boolean;
  workoutId: number | null;
  onClose: () => void;
  onViewSummary: (workoutId: number) => void;
  onEditWorkout: (workoutId: number) => void;
  onDeleteWorkout: (workoutId: number) => void;
}

export default function WorkoutOptionsModal({
  visible,
  workoutId,
  onClose,
  onViewSummary,
  onEditWorkout,
  onDeleteWorkout,
}: WorkoutOptionsModalProps) {
  const isDisabled = workoutId === null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Pressable
            disabled={isDisabled}
            style={styles.menuItem}
            onPress={() => {
              if (workoutId === null) return;
              onClose();
              onViewSummary(workoutId);
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="analytics" size={18} color={theme.colors.text.brand} />
            </View>
            <Text style={styles.menuText}>See Summary</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.text.tertiary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            disabled={isDisabled}
            style={styles.menuItem}
            onPress={() => {
              if (workoutId === null) return;
              onClose();
              onEditWorkout(workoutId);
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(10, 132, 255, 0.1)' }]}>
              <Ionicons name="create-outline" size={18} color="#0A84FF" />
            </View>
            <Text style={styles.menuText}>Edit Workout</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.text.tertiary} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            disabled={isDisabled}
            style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.6 }]}
            onPress={() => {
              if (workoutId === null) return;
              onClose();
              onDeleteWorkout(workoutId);
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(255, 69, 58, 0.08)' }]}>
              <Ionicons name="trash-outline" size={18} color="#FF453A" />
            </View>
            <Text style={[styles.menuText, { color: '#FF453A' }]}>Delete Workout</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.text.tertiary,
    alignSelf: 'center',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.ui.border,
    marginLeft: 50,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.ui.glass,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
});

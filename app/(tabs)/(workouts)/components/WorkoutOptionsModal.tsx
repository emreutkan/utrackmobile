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
    <Modal visible={visible} transparent animationType="fade" presentationStyle="overFullScreen" onRequestClose={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuHeader}>Workout Options</Text>

            <Pressable
              disabled={isDisabled}
              style={styles.menuItem}
              onPress={() => {
                if (workoutId === null) return;
                onClose();
                onViewSummary(workoutId);
              }}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <Ionicons name="analytics" size={20} color={theme.colors.text.brand} />
              </View>
              <Text style={styles.menuText}>See Summary</Text>
              <Ionicons name="chevron-forward" size={16} color="#545458" />
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              disabled={isDisabled}
              style={styles.menuItem}
              onPress={() => {
                if (workoutId === null) return;
                onClose();
                onEditWorkout(workoutId);
              }}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(10, 132, 255, 0.1)' }]}>
                <Ionicons name="create-outline" size={20} color="#0A84FF" />
              </View>
              <Text style={styles.menuText}>Edit Workout</Text>
              <Ionicons name="chevron-forward" size={16} color="#545458" />
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              disabled={isDisabled}
              style={styles.menuItem}
              onPress={() => {
                if (workoutId === null) return;
                onClose();
                onDeleteWorkout(workoutId);
              }}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(255, 69, 58, 0.1)' }]}>
                <Ionicons name="trash-outline" size={20} color="#FF453A" />
              </View>
              <Text style={[styles.menuText, { color: '#FF453A' }]}>Delete Workout</Text>
            </Pressable>
          </View>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    minWidth: 280,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  menuContainer: {
    paddingVertical: 8,
  },
  menuHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 16,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#3A3A3C',
    marginLeft: 48,
  },
});

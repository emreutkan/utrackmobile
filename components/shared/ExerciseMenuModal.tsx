import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';

interface ExerciseMenuModalProps {
  visible: boolean;
  onClose: () => void;
  exercise: any;
  isLocked: boolean;
  setsCount: number;
  onShowInfo?: (exercise: any) => void;
  onShowStatistics?: (exerciseId: number) => void;
  onToggleLock?: (id: number) => void;
  onDeleteAllSets?: () => void;
  onRemove?: (id: number) => void;
  exerciseId: number;
}

export const ExerciseMenuModal = ({
  visible,
  onClose,
  exercise,
  isLocked,
  setsCount,
  onShowInfo,
  onShowStatistics,
  onToggleLock,
  onDeleteAllSets,
  onRemove,
  exerciseId,
}: ExerciseMenuModalProps) => {

  const handleAction = (action: () => void) => {
    onClose();
    // Small delay to let modal close before navigation
    setTimeout(action, 150);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Exercise name header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle} numberOfLines={1}>{exercise?.name?.toUpperCase()}</Text>
          </View>

          <View style={styles.menuGroup}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => handleAction(() => onShowInfo?.(exercise))}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }]}>
                <Ionicons name="information-circle" size={18} color={theme.colors.status.active} />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuItemText}>Exercise Info</Text>
                <Text style={styles.menuItemSub}>View details & instructions</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => handleAction(() => onShowStatistics?.(exercise.id))}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.2)' }]}>
                <Ionicons name="stats-chart" size={18} color={theme.colors.status.success} />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={styles.menuItemText}>Statistics</Text>
                <Text style={styles.menuItemSub}>View performance history</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
            </Pressable>

            {onToggleLock && (
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => handleAction(() => onToggleLock(exerciseId))}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(255, 159, 10, 0.1)', borderColor: 'rgba(255, 159, 10, 0.2)' }]}>
                  <Ionicons name={isLocked ? 'lock-open' : 'lock-closed'} size={18} color={theme.colors.status.warning} />
                </View>
                <View style={styles.menuTextContent}>
                  <Text style={styles.menuItemText}>{isLocked ? 'Unlock Exercise' : 'Lock Exercise'}</Text>
                  <Text style={styles.menuItemSub}>{isLocked ? 'Allow editing sets' : 'Prevent accidental edits'}</Text>
                </View>
              </Pressable>
            )}
          </View>

          {(setsCount > 0 || onRemove) && (
            <View style={styles.dangerGroup}>
              {setsCount > 0 && onDeleteAllSets && (
                <Pressable
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                  onPress={() => {
                    onClose();
                    Alert.alert(
                      'Delete All Sets',
                      `Are you sure you want to delete all ${setsCount} set${setsCount > 1 ? 's' : ''}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete All', style: 'destructive', onPress: onDeleteAllSets },
                      ]
                    );
                  }}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: 'rgba(255, 59, 48, 0.2)' }]}>
                    <Ionicons name="trash" size={18} color={theme.colors.status.error} />
                  </View>
                  <View style={styles.menuTextContent}>
                    <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete All Sets</Text>
                    <Text style={styles.menuItemSub}>{setsCount} set{setsCount > 1 ? 's' : ''} will be removed</Text>
                  </View>
                </Pressable>
              )}

              {onRemove && (
                <Pressable
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                  onPress={() => {
                    onClose();
                    Alert.alert('Remove Exercise', 'This will remove the exercise and all its sets.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => onRemove(exerciseId) },
                    ]);
                  }}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: 'rgba(255, 59, 48, 0.2)' }]}>
                    <Ionicons name="close-circle" size={18} color={theme.colors.status.error} />
                  </View>
                  <View style={styles.menuTextContent}>
                    <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Remove Exercise</Text>
                    <Text style={styles.menuItemSub}>Remove from workout</Text>
                  </View>
                </Pressable>
              )}
            </View>
          )}

          <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.m,
    paddingBottom: 40,
  },
  sheet: {
    gap: theme.spacing.s,
  },
  sheetHeader: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderRadius: theme.borderRadius.l,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
  },
  sheetTitle: {
    color: theme.colors.text.tertiary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  menuGroup: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  dangerGroup: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.m,
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  menuTextContent: {
    flex: 1,
    gap: 1,
  },
  menuItemText: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  menuItemSub: {
    color: theme.colors.text.tertiary,
    fontSize: 11,
    fontWeight: '400',
  },
  menuItemTextDanger: {
    color: theme.colors.status.error,
  },
  cancelButton: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderRadius: theme.borderRadius.l,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  cancelButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  cancelText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

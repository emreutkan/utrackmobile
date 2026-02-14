import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  Pressable,
  TouchableWithoutFeedback,
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
  return (
    <Modal visible={visible} transparent={true} animationType="fade" presentationStyle="overFullScreen" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View style={styles.content}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onShowInfo?.(exercise);
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={theme.colors.text.primary}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.menuItemText}>Info</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onShowStatistics?.(exercise.id);
              }}
            >
              <Ionicons
                name="stats-chart-outline"
                size={22}
                color={theme.colors.text.primary}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.menuItemText}>Statistics</Text>
            </Pressable>

            {onToggleLock && (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onToggleLock(exerciseId);
                }}
              >
                <Ionicons
                  name={isLocked ? 'lock-open-outline' : 'lock-closed-outline'}
                  size={22}
                  color={isLocked ? theme.colors.status.warning : theme.colors.text.primary}
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.menuItemText}>{isLocked ? 'Unlock' : 'Lock'}</Text>
              </Pressable>
            )}

            {setsCount > 0 && onDeleteAllSets && (
              <Pressable
                style={[styles.menuItem, styles.menuItemDelete]}
                onPress={() => {
                  onClose();
                  Alert.alert(
                    'Delete All Sets',
                    `Are you sure you want to delete all ${setsCount} set${setsCount > 1 ? 's' : ''}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete All',
                        style: 'destructive',
                        onPress: onDeleteAllSets,
                      },
                    ]
                  );
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={theme.colors.status.error}
                  style={{ marginRight: 12 }}
                />
                <Text style={[styles.menuItemText, styles.menuItemTextDelete]}>
                  Delete All Sets
                </Text>
              </Pressable>
            )}

            {onRemove && (
              <Pressable
                style={[styles.menuItem, styles.menuItemDelete]}
                onPress={() => {
                  onClose();
                  Alert.alert('Delete Exercise', 'Are you sure you want to remove this exercise?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => onRemove(exerciseId),
                    },
                  ]);
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={theme.colors.status.error}
                  style={{ marginRight: 12 }}
                />
                <Text style={[styles.menuItemText, styles.menuItemTextDelete]}>
                  Delete Exercise
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderRadius: 24,
    padding: 8,
    minWidth: 220,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  menuItemDelete: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.ui.border,
    marginTop: 8,
  },
  menuItemText: {
    color: theme.colors.text.primary,
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  menuItemTextDelete: {
    color: theme.colors.status.error,
  },
});

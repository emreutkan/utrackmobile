import { UserSupplement } from '@/api/types';
import { SwipeAction } from '@/components/SwipeAction';
import { theme } from '@/constants/theme';
import { useDeleteSupplementLog, useSupplementLogs } from '@/hooks/useSupplements';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

interface HistoryModalProps {
  visible: boolean;
  onClose: () => void;
  supplement: UserSupplement | null;
}

export default function HistoryModal({ visible, onClose, supplement }: HistoryModalProps) {
  const { data: logs, isLoading } = useSupplementLogs(supplement?.id || null);
  const deleteMutation = useDeleteSupplementLog();

  const handleDelete = async (logId: number) => {
    try {
      await deleteMutation.mutateAsync(logId);
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>{supplement?.supplement_details.name} Logs</Text>
            <Text style={styles.modalSubtitle}>History</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={30} color={theme.colors.text.zinc600} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.status.active} />
          </View>
        ) : (
          <FlatList
            data={logs || []}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <ReanimatedSwipeable
                renderRightActions={(p, d) => (
                  <SwipeAction
                    progress={p}
                    dragX={d}
                    onPress={() => handleDelete(item.id)}
                    iconName="trash-outline"
                  />
                )}
                friction={2}
                enableTrackpadTwoFingerGesture
                rightThreshold={40}
              >
                <View style={[styles.logRow, index === (logs?.length || 0) - 1 && styles.logRowLast]}>
                  <Text style={styles.logDate}>
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.logDetail}>{item.time.substring(0, 5)}</Text>
                    <Text style={styles.logDosage}>
                      {item.dosage} {supplement?.supplement_details.dosage_unit}
                    </Text>
                  </View>
                </View>
              </ReanimatedSwipeable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No logs found.</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
    backgroundColor: theme.colors.ui.glassStrong,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.l,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.s,
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.ui.glassStrong,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.ui.border,
  },
  logRowLast: { borderBottomWidth: 0 },
  logDate: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.m,
    fontWeight: '600',
  },
  logDetail: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.s,
  },
  logDosage: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.m,
    fontWeight: '600',
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: {
    fontSize: theme.typography.sizes.m,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

import ExerciseSearchModal from '@/components/ExerciseSearchModal';
import WorkoutDetailView from '@/components/WorkoutDetailView';
import { commonStyles, theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkout, useDeleteWorkout, useAddExerciseToPastWorkout } from '@/hooks/useWorkout';
import {
  useAddSetToExercise,
  useDeleteSet,
  useRemoveExerciseFromWorkout,
} from '@/hooks/useExercises';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const workoutId = id ? Number(id) : null;

  // --- State ---
  const [isEditMode, setIsEditMode] = useState(false);

  // Modals
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // --- Data Fetching ---
  const { data: workout, isLoading, refetch } = useWorkout(workoutId);
  const deleteWorkoutMutation = useDeleteWorkout();
  const addExerciseMutation = useAddExerciseToPastWorkout();
  const removeExerciseMutation = useRemoveExerciseFromWorkout();
  const addSetMutation = useAddSetToExercise();
  const deleteSetMutation = useDeleteSet();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // --- Helpers ---
  const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatValidationErrors = (validationErrors: any): string => {
    if (!validationErrors || typeof validationErrors !== 'object') return 'Validation failed';
    const messages: string[] = [];
    Object.keys(validationErrors).forEach((field) => {
      const fieldErrors = validationErrors[field];
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((error: string) => {
          let friendlyMessage = error;
          if (error.includes('less than or equal to 100'))
            friendlyMessage = field === 'reps' ? 'Max 100 reps' : 'Max 100 RIR';
          else if (error.includes('less than or equal to 10800'))
            friendlyMessage = 'Max 3 hours rest';
          else if (error.includes('less than or equal to 600')) friendlyMessage = 'Max 10 min TUT';
          else if (error.includes('greater than or equal to 0'))
            friendlyMessage = `${field} cannot be negative`;
          messages.push(friendlyMessage);
        });
      } else {
        messages.push(fieldErrors);
      }
    });
    return messages.join('\n');
  };

  // --- Handlers: Workout Structure ---
  const handleAddExercise = async (exerciseId: number) => {
    if (!workout?.id) return;
    try {
      await addExerciseMutation.mutateAsync({
        workoutId: workout.id,
        request: { exercise_id: exerciseId },
      });
      setIsSearchVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to add exercise.');
    }
  };

  const handleRemoveExercise = async (workoutExerciseId: number) => {
    try {
      await removeExerciseMutation.mutateAsync(workoutExerciseId);
    } catch {
      Alert.alert('Error', 'Failed to remove exercise.');
    }
  };

  // --- Handlers: Sets ---
  const handleAddSet = async (exerciseId: number, data: any) => {
    try {
      await addSetMutation.mutateAsync({
        workoutExerciseId: exerciseId,
        data,
      });
    } catch (error: any) {
      // Handle validation errors from the API
      if (error?.response?.data?.validationErrors) {
        const msg = formatValidationErrors(error.response.data.validationErrors);
        Alert.alert('Invalid Input', msg || 'Failed to add set');
      } else {
        Alert.alert('Error', error?.message || 'Failed to add set.');
      }
    }
  };

  const handleDeleteSet = async (setId: number) => {
    try {
      await deleteSetMutation.mutateAsync(setId);
    } catch {
      Alert.alert('Error', 'Failed to delete set.');
    }
  };

  // --- Handlers: Menu Actions ---
  const handleDeleteWorkout = () => {
    setIsMenuVisible(false);
    Alert.alert('Delete Workout', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (workout?.id) {
            try {
              await deleteWorkoutMutation.mutateAsync(workout.id);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete workout.');
            }
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={commonStyles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.zinc600} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {!isEditMode ? (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setIsEditMode(true)} style={commonStyles.iconButton}>
              <Ionicons name="create-outline" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteWorkout} style={commonStyles.iconButton}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditMode(false)} style={commonStyles.iconButton}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.status.active} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WorkoutDetailView
            workout={workout}
            elapsedTime={formatDuration(workout?.duration || 0)}
            isActive={false}
            isEditMode={isEditMode}
            isViewOnly={!isEditMode}
            onAddExercise={isEditMode ? () => setIsSearchVisible(true) : undefined}
            onRemoveExercise={isEditMode ? handleRemoveExercise : undefined}
            onAddSet={isEditMode ? handleAddSet : undefined}
            onDeleteSet={isEditMode ? handleDeleteSet : undefined}
            onShowStatistics={(exerciseId: number) =>
              router.push(`/(exercise-statistics)/${exerciseId}`)
            }
          />
        </View>
      )}

      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.menuContainer}>
              <Text style={styles.menuHeader}>Options</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  setIsEditMode(true);
                }}
              >
                <Ionicons name="create-outline" size={22} color="#FFF" />
                <Text style={styles.menuText}>Edit Workout</Text>
                <Ionicons name="chevron-forward" size={16} color="#545458" />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleDeleteWorkout}>
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                <Text style={[styles.menuText, { color: '#FF3B30' }]}>Delete Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ExerciseSearchModal
        visible={isSearchVisible}
        onClose={() => setIsSearchVisible(false)}
        onSelectExercise={handleAddExercise}
        title="Add Exercise"
      />

      {isEditMode && (
        <View style={[styles.floatingBarContainer, { bottom: insets.bottom + 20 }]}>
          <View style={styles.blurPill}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsSearchVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FFF" />
              <Text style={styles.addButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.l,
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.s,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.s,
  },
  doneText: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '600',
    color: theme.colors.status.active,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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

  // Menu Modal Styles
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
  menuText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#3A3A3C',
    marginLeft: 38, // Align with text
  },

  // Floating Bar Styles
  floatingBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  blurPill: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#0A84FF', // Premium Blue
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

import { createTemplateWorkout } from '@/api/Workout';
import { Exercise } from '@/api/types/workout';
import ExerciseSearchModal from '@/components/ExerciseSearchModal';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreateTemplateHeader from './components/CreateTemplateHeader';
import EmptyExerciseState from './components/EmptyExerciseState';
import ExerciseListItem from './components/ExerciseListItem';
import TitleInput from './components/TitleInput';

// Map to store exercise details by ID
const exerciseCache = new Map<number, Exercise>();

export default function CreateTemplateScreen() {
  const [title, setTitle] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const insets = useSafeAreaInsets();

  const createButtonScale = useSharedValue(0);

  const toggleExercise = (exerciseId: number, exercise?: Exercise) => {
    setSelectedExercises((prev) => {
      const exists = prev.find((e) => e.id === exerciseId);
      if (exists) {
        return prev.filter((e) => e.id !== exerciseId);
      } else {
        // If we have the exercise object, use it
        if (exercise) {
          exerciseCache.set(exerciseId, exercise);
          return [...prev, exercise];
        }
        // Otherwise, try to get it from cache
        const cached = exerciseCache.get(exerciseId);
        if (cached) {
          return [...prev, cached];
        }
        return prev;
      }
    });
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedExercises.length - 1) return;

    const newOrder = [...selectedExercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setSelectedExercises(newOrder);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (title.trim() && selectedExercises.length > 0) {
      createButtonScale.value = withSpring(1, { damping: 12 });
    } else {
      createButtonScale.value = withSpring(0);
    }
  }, [title, selectedExercises.length, createButtonScale]);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a template name.');
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert('Error', 'Please select at least one exercise.');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createTemplateWorkout({
        title: title.trim(),
        exercises: selectedExercises.map((e) => e.id),
      });
      if (result?.id) {
        Alert.alert('Success', 'Template created successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to create template.');
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      Alert.alert('Error', 'Failed to create template.');
    } finally {
      setIsCreating(false);
    }
  };

  const createButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: createButtonScale.value }],
    opacity: createButtonScale.value,
  }));

  const selectedExerciseIds = selectedExercises.map((e) => e.id);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
        style={styles.gradientBg}
      />

      <CreateTemplateHeader paddingTop={insets.top} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <TitleInput value={title} onChangeText={setTitle} />

          <View style={styles.exercisesHeader}>
            <Text style={styles.sectionLabel}>EXERCISES ({selectedExercises.length})</Text>
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              style={styles.addInlineButton}
            >
              <Ionicons name="add" size={18} color={theme.colors.status.active} />
              <Text style={styles.addInlineText}>ADD</Text>
            </TouchableOpacity>
          </View>

          {selectedExercises.length > 0 ? (
            <View style={styles.selectedList}>
              {selectedExercises.map((exercise, index) => (
                <ExerciseListItem
                  key={`${exercise.id}-${index}`}
                  exercise={exercise}
                  index={index}
                  totalCount={selectedExercises.length}
                  onMoveUp={() => moveExercise(index, 'up')}
                  onMoveDown={() => moveExercise(index, 'down')}
                  onRemove={() => removeExercise(index)}
                />
              ))}
            </View>
          ) : (
            <EmptyExerciseState onPress={() => setIsModalVisible(true)} />
          )}
        </ScrollView>

        <Animated.View
          style={[styles.footer, createButtonStyle, { paddingBottom: insets.bottom + 16 }]}
        >
          <TouchableOpacity
            style={[styles.createButton, isCreating && styles.createButtonLoading]}
            onPress={handleCreate}
            disabled={isCreating}
            activeOpacity={0.9}
          >
            {isCreating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.createButtonText}>CONFIRM TEMPLATE</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>

      <ExerciseSearchModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelectExercise={() => {}}
        onToggleExercise={toggleExercise}
        title="Add Exercises"
        mode="multiple"
        selectedExerciseIds={selectedExerciseIds}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.l,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.s,
    paddingHorizontal: 4,
  },
  addInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    gap: 4,
  },
  addInlineText: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.status.active,
    fontStyle: 'italic',
  },
  selectedList: {
    gap: theme.spacing.s,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.m,
    backgroundColor: 'transparent',
  },
  createButton: {
    backgroundColor: theme.colors.status.active,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.status.active,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonLoading: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});

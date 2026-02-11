// Template Workout Types
import type { Exercise } from './exercise';

export type CreateTemplateWorkoutRequest = {
  title: string;
  exercises: number[];
  notes?: string;
};

export type TemplateWorkoutExercise = {
  id: number;
  exercise: Exercise;
  order: number;
};

export type TemplateWorkout = {
  id: number;
  title: string;
  exercises: TemplateWorkoutExercise[];
  primary_muscle_groups: string[];
  secondary_muscle_groups: string[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type StartTemplateWorkoutRequest = {
  template_workout_id: number;
};

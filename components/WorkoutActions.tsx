import { removeExerciseFromWorkout } from "@/api/Exercises";
import { getWorkout } from "@/api/Workout";
import { Workout } from "@/api/types";

export const handleRemoveExercise = async (WorkoutId: number, exerciseId: number): Promise<Workout | any> => {
    if (!WorkoutId) return { error: "Workout ID is required" };
    try {
        await removeExerciseFromWorkout(WorkoutId, exerciseId);
        const updatedWorkout = await getWorkout(WorkoutId);
        return updatedWorkout;
    } catch (error) {
        return { error: "Failed to remove exercise", message: (error as Error).message };
    }
};
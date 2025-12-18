import { Stack } from 'expo-router';

export default function ExerciseStatisticsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="[id]" />
        </Stack>
    );
}

import WorkoutDetailView from '@/components/shared/workout/WorkoutDetailView';
import { theme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

export default function AddWorkout() {

    return (
    <View style={styles.container}>
        <LinearGradient
            colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
            style={styles.gradientBg}
        />
        <WorkoutDetailView workout={null} elapsedTime="00:00:00" isActive={false} />
    </View>


  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});

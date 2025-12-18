import WorkoutDetailView from '@/components/WorkoutDetailView';
import { useState } from 'react';
import { View } from 'react-native';

export default function AddWorkout() {
  const [title, setTitle] = useState('');
  const [is_done, setIsDone] = useState(false);
  const [duration, setDuration] = useState(0);

    return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E' }}>
        
        <WorkoutDetailView workout={null} elapsedTime="00:00:00" isActive={false} />
    </View>


  );
}

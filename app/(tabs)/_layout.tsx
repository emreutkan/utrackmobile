import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import BottomNavigator from '@/components/BottomNavigator';
import { useActiveWorkout } from '@/hooks/useWorkout';

export default function TabsLayout() {
  // Single subscription for active-workout so tab screens (Home ActiveSection, Workouts) share one fetch
  useActiveWorkout();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
});

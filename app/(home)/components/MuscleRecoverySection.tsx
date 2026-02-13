import { MuscleRecoveryItem } from '@/api/types/index';
import { theme, typographyStyles } from '@/constants/theme';
import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRecoveryStatus } from '@/hooks/useWorkout';

interface MuscleRecoverySectionProps {
  onPress?: () => void;
}

const MuscleRecoveryCard = ({ muscle, status }: { muscle: string; status: MuscleRecoveryItem }) => {
  const pct = Number(status.recovery_percentage);
  const hoursLeft = Number(status.hours_until_recovery);
  const isReady = status.is_recovered || pct >= 90;

  const timeText = isReady ? 'Ready' : `${Math.round(hoursLeft)}H TO 100%`;
  const displayName = muscle
    .replace(/_/g, ' ')
    .split(' ')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View></View>
          <View style={styles.textContainer}>
            <Text style={typographyStyles.muscleName}>{displayName}</Text>
            <Text style={typographyStyles.labelMuted}>{timeText}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={typographyStyles.data}>{pct.toFixed(0)}%</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${pct}%`,
                  backgroundColor: '#60A5FA', // Light blue
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default function MuscleRecoverySection({ onPress }: MuscleRecoverySectionProps) {
  const { data: recoveryData, refetch } = useRecoveryStatus();

  const recoveryStatus = recoveryData?.recovery_status || {};

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Get top 3 recovering muscles, sorted by hours until recovery
  // Show muscles that are not fully recovered (recovery_percentage < 100)
  const recovering = Object.entries(recoveryStatus)
    .filter(([_, s]) => {
      const pct = Number(s.recovery_percentage);
      return pct < 100 && Number(s.hours_until_recovery) > 0;
    })
    .sort((a, b) => a[1].hours_until_recovery - b[1].hours_until_recovery)
    .slice(0, 3);

  // If no recovering muscles, show empty state or return null
  if (recovering.length === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <Text style={typographyStyles.h3}>MUSCLE RECOVERY</Text>
        <Text style={typographyStyles.labelMuted}>ANALYTICS</Text>
      </View>

      <View style={styles.cardsContainer}>
        {recovering.map(([muscle, status]) => (
          <MuscleRecoveryCard key={muscle} muscle={muscle} status={status} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.xs,
  },

  cardsContainer: {
    gap: theme.spacing.s,
  },
  card: {
    backgroundColor: theme.colors.ui.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 0.5,
    borderColor: theme.colors.ui.border,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.s,
  },

  textContainer: {
    flex: 1,
    gap: theme.spacing.xs,
  },

  cardRight: {
    alignItems: 'flex-end',
    minWidth: 80,
    gap: theme.spacing.s,
  },

  progressBar: {
    width: 80,
    height: 4,
    backgroundColor: theme.colors.ui.progressBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

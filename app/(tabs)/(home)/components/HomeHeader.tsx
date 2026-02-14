import { theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';

interface HomeHeaderProps {
  today: Date;
  insets: { top: number };
}

export default function HomeHeader({ today, insets }: HomeHeaderProps) {
  return (
    <View style={[styles.forceHeader, { paddingTop: insets.top }]}>
      <View style={styles.titleRow}>
        <Text style={typographyStyles.h1}>
          FORCE
          <Text style={{ color: theme.colors.status.active }}>.</Text>
        </Text>
        <Pressable
          onPress={() => router.push('/(account)')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.gearButton}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={theme.colors.text.secondary}
          />
        </Pressable>
      </View>
      <View style={styles.header}>
        <Text style={styles.headerDate}>
          {today.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  forceHeader: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.m,
    marginTop: theme.spacing.s,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  gearButton: {
    padding: theme.spacing.xs,
  },
  header: { marginBottom: theme.spacing.s },
  headerDate: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.tight,
  },
});

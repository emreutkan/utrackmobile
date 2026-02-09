import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme, typographyStyles } from '@/constants/theme';

export default function MaintenanceScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.terminal}>
                <View style={styles.terminalHeader}>
                    <View style={styles.terminalButtons}>
                        <View style={[styles.button, styles.buttonRed]} />
                        <View style={[styles.button, styles.buttonYellow]} />
                        <View style={[styles.button, styles.buttonGreen]} />
                    </View>
                    <Text style={styles.terminalTitle}>Terminal</Text>
                </View>
                <View style={styles.terminalBody}>
                    <View style={styles.terminalContent}>
                        <Text style={styles.terminalText}>
                            <Text style={styles.prompt}>$</Text> Checking backend status...
                        </Text>
                        <Text style={styles.terminalText}>
                            <Text style={styles.prompt}>$</Text> Connection failed
                        </Text>
                        <Text style={styles.terminalText}>
                            <Text style={styles.error}>✗</Text> Backend is currently unavailable
                        </Text>
                        <View style={styles.spacer} />
                        <View style={styles.statusContainer}>
                            <Ionicons name="construct-outline" size={24} color={theme.colors.status.warning} />
                            <Text style={styles.statusTitle}>We&apos;re on maintenance</Text>
                        </View>
                        <Text style={styles.statusMessage}>
                            Our servers are temporarily unavailable.{'\n'}
                            Please check back soon.
                        </Text>
                        <View style={styles.spacer} />
                        <View style={styles.retryContainer}>
                            <ActivityIndicator size="small" color={theme.colors.status.active} />
                            <Text style={styles.retryText}>Retrying connection...</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.l,
    },
    terminal: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: '#1a1a1a',
        borderRadius: theme.borderRadius.l,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333333',
    },
    terminalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    terminalButtons: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        marginRight: theme.spacing.m,
    },
    button: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    buttonRed: {
        backgroundColor: '#ff5f56',
    },
    buttonYellow: {
        backgroundColor: '#ffbd2e',
    },
    buttonGreen: {
        backgroundColor: '#27c93f',
    },
    terminalTitle: {
        ...typographyStyles.body,
        color: theme.colors.text.secondary,
        fontSize: 13,
    },
    terminalBody: {
        padding: theme.spacing.l,
        minHeight: 300,
    },
    terminalContent: {
        flex: 1,
    },
    terminalText: {
        fontFamily: 'monospace',
        color: '#00ff00',
        fontSize: 14,
        marginBottom: theme.spacing.xs,
    },
    prompt: {
        color: theme.colors.status.active,
        marginRight: theme.spacing.xs,
    },
    error: {
        color: theme.colors.status.error,
        marginRight: theme.spacing.xs,
    },
    spacer: {
        height: theme.spacing.l,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.m,
        gap: theme.spacing.s,
    },
    statusTitle: {
        ...typographyStyles.hero,
        fontSize: 24,
        color: theme.colors.text.primary,
    },
    statusMessage: {
        ...typographyStyles.body,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.s,
        marginTop: theme.spacing.m,
    },
    retryText: {
        ...typographyStyles.body,
        color: theme.colors.text.secondary,
        fontSize: 13,
    },
});

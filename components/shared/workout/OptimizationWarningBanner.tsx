import type { OptimizationCheckResponse, OptimizationWarning } from '@/api/types/workout';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
    data: OptimizationCheckResponse | null;
    isLoading?: boolean;
    onDismiss?: () => void;
}

function RecoveryBadge({ pct }: { pct: number }) {
    const color =
        pct >= 70
            ? theme.colors.status.warning
            : theme.colors.status.error;
    return (
        <View style={[optStyles.recoveryBadge, { borderColor: `${color}40` }]}>
            <Text style={[optStyles.recoveryBadgeText, { color }]}>{Math.round(pct)}%</Text>
        </View>
    );
}

function WarningRow({ warning, defaultExpanded }: { warning: OptimizationWarning; defaultExpanded?: boolean }) {
    const [expanded, setExpanded] = useState(defaultExpanded ?? false);
    const isError = warning.severity === 'error';
    const dotColor = isError ? theme.colors.status.error : theme.colors.status.warning;

    return (
        <View style={optStyles.warningRow}>
            <View style={optStyles.warningTop}>
                <View style={[optStyles.severityDot, { backgroundColor: dotColor }]} />
                <Text style={optStyles.warningMessage} numberOfLines={expanded ? undefined : 2}>
                    {warning.message}
                </Text>
                {warning.recovery_percent !== undefined && (
                    <RecoveryBadge pct={warning.recovery_percent} />
                )}
                {warning.sets_already_done !== undefined && (
                    <View style={optStyles.setsBadge}>
                        <Text style={optStyles.setsBadgeText}>{warning.sets_already_done} sets</Text>
                    </View>
                )}
            </View>
            <Pressable onPress={() => setExpanded(!expanded)} style={optStyles.recToggle}>
                <Text style={optStyles.recLabel}>WHAT SHOULD I DO?</Text>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color={theme.colors.text.tertiary}
                />
            </Pressable>
            {expanded && (
                <Text style={optStyles.recText}>{warning.recommendation}</Text>
            )}
        </View>
    );
}

export default function OptimizationWarningBanner({ data, isLoading, onDismiss }: Props) {
    if (isLoading) {
        return (
            <View style={optStyles.loadingBanner}>
                <ActivityIndicator size="small" color={theme.colors.status.active} />
                <Text style={optStyles.loadingText}>Checking recovery status…</Text>
            </View>
        );
    }

    // optimal → silent (no UI)
    if (!data || data.overall_status === 'optimal') return null;

    const isNotRecommended = data.overall_status === 'not_recommended';
    const borderColor = isNotRecommended
        ? `${theme.colors.status.error}35`
        : `${theme.colors.status.warning}35`;
    const bgColor = isNotRecommended
        ? 'rgba(255, 69, 58, 0.05)'
        : 'rgba(255, 159, 10, 0.05)';
    const iconColor = isNotRecommended
        ? theme.colors.status.error
        : theme.colors.status.warning;
    const iconName = isNotRecommended ? 'ban' : 'alert-circle';
    const headerLabel = isNotRecommended ? 'NOT RECOMMENDED' : 'PROCEED WITH CAUTION';

    // Split warnings into errors and warnings for display
    const errorWarnings = data.warnings.filter((w) => w.severity === 'error');
    const cautionWarnings = data.warnings.filter((w) => w.severity === 'warning');

    return (
        <View style={[optStyles.banner, { borderColor, backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={optStyles.bannerHeader}>
                <View style={optStyles.bannerHeaderLeft}>
                    <Ionicons name={iconName} size={16} color={iconColor} />
                    <Text style={[optStyles.bannerTitle, { color: iconColor }]}>{headerLabel}</Text>
                </View>
                {onDismiss && (
                    <Pressable onPress={onDismiss} style={optStyles.dismissBtn} hitSlop={8}>
                        <Ionicons name="close" size={14} color={theme.colors.text.tertiary} />
                    </Pressable>
                )}
            </View>

            {/* Error-severity warnings first */}
            {errorWarnings.map((w, i) => (
                <WarningRow key={`err-${i}`} warning={w} defaultExpanded={i === 0} />
            ))}

            {/* Caution warnings below */}
            {cautionWarnings.map((w, i) => (
                <WarningRow key={`warn-${i}`} warning={w} defaultExpanded={false} />
            ))}
        </View>
    );
}

const optStyles = StyleSheet.create({
    loadingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 12,
        marginBottom: 4,
        paddingVertical: 6,
    },
    loadingText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
    banner: {
        marginHorizontal: 12,
        marginBottom: 6,
        borderRadius: theme.borderRadius.l,
        borderWidth: 1,
        padding: 12,
        gap: 10,
    },
    bannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bannerHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bannerTitle: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    dismissBtn: {
        padding: 2,
    },
    warningRow: {
        gap: 4,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: theme.colors.ui.border,
    },
    warningTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    severityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 5,
        flexShrink: 0,
    },
    warningMessage: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 17,
        fontWeight: '500',
    },
    recoveryBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        backgroundColor: 'transparent',
        alignSelf: 'flex-start',
        flexShrink: 0,
    },
    recoveryBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
    },
    setsBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: `${theme.colors.status.warning}40`,
        backgroundColor: 'transparent',
        alignSelf: 'flex-start',
        flexShrink: 0,
    },
    setsBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: theme.colors.status.warning,
        fontVariant: ['tabular-nums'],
    },
    recToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingLeft: 12,
        paddingTop: 2,
    },
    recLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.5,
    },
    recText: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        lineHeight: 17,
        fontWeight: '400',
        paddingLeft: 12,
        paddingTop: 4,
        fontStyle: 'italic',
    },
});

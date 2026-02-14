import { createWorkout } from '@/api/Workout';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    LayoutAnimation,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    Pressable,
    View
} from 'react-native';

// Rest Day Card Component
interface RestDayCardProps {
    title?: string;
}

// Training Intensity Card Styles (used by RestDayCard)
const trainingIntensityStyles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.xxl,
        padding: theme.spacing.xxl,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        shadowColor: theme.colors.ui.brandGlow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    upperSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.l,
    },
    upperLeft: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        flex: 1,
        gap: theme.spacing.s,
    },
    intensityBars: {
        flexDirection: 'row',
        gap: 4,
    },
    bar: {
        width: 4,
        height: 12,
        borderRadius: 2,
        backgroundColor: theme.colors.status.active,
    },
    intensityTextContainer: {
        flex: 1,
    },
    intensityLabel: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.xs,
    },
    intensityValue: {
        fontSize: theme.typography.sizes.xxxl,
        fontWeight: '900',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    intensityIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.ui.primaryLight,
        borderWidth: 1,
        borderColor: theme.colors.ui.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

function RestDayCard({ title = 'Rest Day' }: RestDayCardProps) {
    return (
        <View style={trainingIntensityStyles.card}>
            <View style={trainingIntensityStyles.upperSection}>
                <View style={trainingIntensityStyles.upperLeft}>
                    <View style={trainingIntensityStyles.intensityBars}>
                        {[0.2, 0.2, 0.2].map((opacity, index) => (
                            <View
                                key={index}
                                style={[trainingIntensityStyles.bar, { opacity, backgroundColor: theme.colors.status.rest }]}
                            />
                        ))}
                    </View>
                    <View style={trainingIntensityStyles.intensityTextContainer}>
                        <Text style={trainingIntensityStyles.intensityLabel}>REST DAY</Text>
                        <Text style={[trainingIntensityStyles.intensityValue, { color: theme.colors.status.rest }]}>RECOVERY</Text>
                    </View>
                </View>
                <View style={[trainingIntensityStyles.intensityIcon, { backgroundColor: 'rgba(192, 132, 252, 0.1)', borderColor: 'rgba(192, 132, 252, 0.3)' }]}>
                    <Ionicons name="cafe" size={24} color={theme.colors.status.rest} />
                </View>
            </View>
        </View>
    );
}


interface WorkoutModalProps {
    visible: boolean;
    onClose: () => void;
    mode: 'create' | 'log';
    onSuccess?: () => void;
}

export default function WorkoutModal({ visible, onClose, mode, onSuccess }: WorkoutModalProps) {
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (visible) {
            setWorkoutTitle(mode === 'create' ? 'New Workout' : '');
            setDate(new Date());
            setShowDatePicker(false);
        }
    }, [visible, mode]);

    const toggleDatePicker = () => {
        Keyboard.dismiss();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDatePicker(!showDatePicker);
    };

    const handleSubmit = async () => {
        if (!workoutTitle.trim()) return;

        try {
            const payload = mode === 'log'
                ? { title: workoutTitle, date: date.toISOString(), is_done: true }
                : { title: workoutTitle };

            const result = await createWorkout(payload);

            if (result && typeof result === 'object' && result.error === "ACTIVE_WORKOUT_EXISTS") {
                Alert.alert("Active Workout Exists", "Please finish your current active workout first.");
                return;
            }

            if (result?.id) {
                onClose();
                setWorkoutTitle('');
                if (onSuccess) onSuccess();

                // Slight delay to allow modal to close smoothly before navigation
                setTimeout(() => {
                    if (mode === 'log') {
                        router.push(`/(workouts)/${result.id}/edit`);
                    } else {
                        router.push('/(active-workout)');
                    }
                }, 100);
            }
        } catch (error) {
            Alert.alert("Error", mode === 'log' ? "Failed to log workout." : "Failed to start workout.");
            console.error(error);
        }
    };

    const title = mode === 'create' ? 'Start Workout' : 'Log Past Workout';
    const buttonText = mode === 'create' ? 'Start Session' : 'Save Log';

    const icon = mode === 'create' ? 'flash' : 'time';
    const accentColor = mode === 'create' ? theme.colors.status.active : theme.colors.status.warning;

    return (
        <Modal
            presentationStyle="overFullScreen"
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={onClose}
                />

                <View style={styles.sheetContainer}>
                    {/* Drag handle */}
                    <View style={styles.handleRow}>
                        <View style={styles.handle} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.headerIcon, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]}>
                                <Ionicons name={icon} size={16} color={accentColor} />
                            </View>
                            <Text style={styles.modalTitle}>{title}</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeIcon}>
                            <Ionicons name="close" size={18} color={theme.colors.text.secondary} />
                        </Pressable>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputWrapper}>
                            <Ionicons
                                name="barbell-outline"
                                size={18}
                                color={theme.colors.text.tertiary}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Workout name"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={workoutTitle}
                                onChangeText={setWorkoutTitle}
                                autoFocus
                                clearButtonMode="while-editing"
                                selectionColor={accentColor}
                            />
                        </View>

                        {mode === 'log' && (
                            <>
                                <Pressable
                                    style={[styles.dateButton, showDatePicker && styles.dateButtonActive]}
                                    onPress={toggleDatePicker}
                                >
                                    <View style={styles.dateRow}>
                                        <Ionicons name="calendar-outline" size={18} color={theme.colors.text.tertiary} />
                                        <Text style={styles.dateText}>
                                            {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                    <View style={styles.timeRow}>
                                        <Text style={styles.timeText}>
                                            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        <Ionicons
                                            name={showDatePicker ? 'chevron-up' : 'chevron-down'}
                                            size={14}
                                            color={theme.colors.text.tertiary}
                                        />
                                    </View>
                                </Pressable>

                                {showDatePicker && (
                                    <View style={styles.datePickerContainer}>
                                        <DateTimePicker
                                            value={date}
                                            mode="datetime"
                                            display="spinner"
                                            themeVariant="dark"
                                            maximumDate={new Date()}
                                            onChange={(e, d) => d && setDate(d)}
                                            style={styles.picker}
                                            textColor={theme.colors.text.primary}
                                        />
                                    </View>
                                )}
                            </>
                        )}

                        <Pressable
                            style={({ pressed }) => [
                                styles.primaryButton,
                                { backgroundColor: accentColor },
                                !workoutTitle.trim() && styles.btnDisabled,
                                pressed && workoutTitle.trim() ? { opacity: 0.85 } : {},
                            ]}
                            onPress={handleSubmit}
                            disabled={!workoutTitle.trim()}
                        >
                            <Ionicons name={mode === 'create' ? 'play' : 'checkmark'} size={18} color={theme.colors.text.primary} />
                            <Text style={styles.primaryButtonText}>{buttonText}</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    sheetContainer: {
        backgroundColor: '#111114',
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: theme.colors.ui.border,
        // Extend background below visible area so keyboard gap is covered
        paddingBottom: theme.spacing.xl + 200,
        marginBottom: -200,
    },
    handleRow: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 6,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.l,
        paddingTop: theme.spacing.s,
        paddingBottom: theme.spacing.m,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text.primary,
        letterSpacing: 0.3,
    },
    closeIcon: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    formContainer: {
        paddingHorizontal: theme.spacing.l,
        gap: 10,
        paddingBottom: theme.spacing.s,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        color: theme.colors.text.primary,
        fontSize: 15,
        fontWeight: '500',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    dateButtonActive: {
        borderColor: theme.colors.ui.primaryBorder,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        color: theme.colors.text.primary,
        fontSize: 15,
        fontWeight: '500',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: {
        color: theme.colors.text.secondary,
        fontSize: 14,
        fontWeight: '500',
    },
    datePickerContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: theme.borderRadius.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    picker: {
        height: 180,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: theme.borderRadius.m,
        marginTop: 4,
    },
    btnDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        opacity: 0.4,
    },
    primaryButtonText: {
        color: theme.colors.text.primary,
        fontSize: 15,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
});

// Export RestDayCard
export { RestDayCard };


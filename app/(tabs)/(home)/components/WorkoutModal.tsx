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
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <Pressable onPress={onClose} style={styles.closeIcon}>
                            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                        </Pressable>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Workout Title"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={workoutTitle}
                                onChangeText={setWorkoutTitle}
                                autoFocus
                                clearButtonMode="while-editing"
                            />
                        </View>

                        {mode === 'log' && (
                            <View style={styles.dateSection}>
                                <Pressable
                                    style={[styles.dateButton, showDatePicker && styles.dateButtonActive]}
                                    onPress={toggleDatePicker}
                                >
                                    <View style={styles.dateRow}>
                                        <Text style={styles.dateText}>
                                            {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                    <View style={styles.timeRow}>
                                        <Text style={styles.timeText}>
                                            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={16}
                                            color={theme.colors.text.tertiary}
                                            style={{ transform: [{ rotate: showDatePicker ? '90deg' : '0deg' }] }}
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
                            </View>
                        )}

                        <Pressable
                            style={[styles.primaryButton, !workoutTitle.trim() && styles.btnDisabled]}
                            onPress={handleSubmit}
                            disabled={!workoutTitle.trim()}
                        >
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
        backgroundColor: theme.colors.ui.glass,
    },
    sheetContainer: {
        backgroundColor: theme.colors.ui.glass,
        borderRadius: theme.borderRadius.l,
        overflow: 'hidden',
        paddingBottom: theme.spacing.navHeight + 20,
        bottom: -40,
    },
    header: {
        paddingTop: 22,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.l,
        marginBottom: theme.spacing.l,
    },
    modalTitle: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '900',
        color: theme.colors.text.primary,
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.tight,
    },
    closeIcon: {
        padding: theme.spacing.xs,
        backgroundColor: theme.colors.ui.glassStrong,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    formContainer: {
        paddingHorizontal: theme.spacing.m,
        gap: theme.spacing.s,
    },
    label: {
        fontSize: theme.typography.sizes.label,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        paddingHorizontal: theme.spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.wide,
    },
    inputWrapper: {
        backgroundColor: theme.colors.ui.glassStrong,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    input: {
        padding: theme.spacing.m,
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '600',
    },
    dateSection: {
        marginTop: theme.spacing.xs,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.ui.glassStrong,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    dateButtonActive: {
        backgroundColor: theme.colors.ui.primaryLight,
        borderColor: theme.colors.status.active,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    dateText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '600',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    timeText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '500',
    },
    datePickerContainer: {
        marginTop: theme.spacing.s,
        backgroundColor: theme.colors.ui.glassStrong,
        borderRadius: theme.borderRadius.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    picker: {
        height: 180,
    },
    primaryButton: {
        backgroundColor: theme.colors.status.active,
        paddingVertical: theme.spacing.l,
        borderRadius: theme.borderRadius.l,
        alignItems: 'center',
        marginTop: theme.spacing.s,
        shadowColor: theme.colors.status.active,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnDisabled: {
        backgroundColor: theme.colors.ui.glassStrong,
        opacity: 0.5,
        shadowOpacity: 0,
    },
    primaryButtonText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: theme.typography.tracking.wide,
    },
});

// Export RestDayCard
export { RestDayCard };


import { createWorkout } from '@/api/Workout';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
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
    TouchableOpacity,
    View
} from 'react-native';

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
        } catch (e) {
            Alert.alert("Error", mode === 'log' ? "Failed to log workout." : "Failed to start workout.");
        }
    };

    const title = mode === 'create' ? 'Start Workout' : 'Log Past Workout';
    const buttonText = mode === 'create' ? 'Start Session' : 'Save Log';

    return (
        <Modal 
            visible={visible} 
            transparent 
            animationType="slide" 
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                {/* Backdrop - Tap to close */}
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                {/* Bottom Sheet Container */}
                <BlurView intensity={Platform.OS === 'ios' ? 80 : 100} tint="dark" style={styles.sheetContainer}>
     

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                            <Ionicons name="close" size={24} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    {/* Input Area */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Workout Title"
                                placeholderTextColor="#636366"
                                value={workoutTitle}
                                onChangeText={setWorkoutTitle}
                                autoFocus
                                clearButtonMode="while-editing"
                            />
                        </View>

                        {mode === 'log' && (
                            <View style={styles.dateSection}>
                                <TouchableOpacity 
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
                                            color="#636366" 
                                            style={{ transform: [{ rotate: showDatePicker ? '90deg' : '0deg' }] }}
                                        />
                                    </View>
                                </TouchableOpacity>

                                {/* Inline Date Picker (Accordion Style) */}
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
                                            textColor="#FFF"
                                        />
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Action Button */}
                        <TouchableOpacity
                            style={[styles.primaryButton, !workoutTitle.trim() && styles.btnDisabled]}
                            onPress={handleSubmit}
                            disabled={!workoutTitle.trim()}
                        >
                            <Text style={styles.primaryButtonText}>{buttonText}</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end', // Pushes content to bottom
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)', // Slightly lighter backdrop for depth
    },
    sheetContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        paddingBottom: 80, // Safe area padding 40 for ios bottom safe area and +40 for the bottom sheet to look like it goes below the keyboard
        bottom: -40, // -40 to make it look like it goes below the keyboard 
        backgroundColor: Platform.OS === 'android' ? '#1C1C1E' : undefined, // Fallback for android
    },

    header: {
        paddingTop: 22,

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.3,
    },
    closeIcon: {
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    formContainer: {
        paddingHorizontal: 16,
        gap: 12
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        paddingHorizontal: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    input: {
        padding: 16,
        color: '#FFF',
        fontSize: 17,
        fontWeight: '500',
    },
    dateSection: {
        marginTop: 4,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    dateButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderColor: '#0A84FF',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dateText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: {
        color: '#8E8E93',
        fontSize: 16,
    },
    datePickerContainer: {
        marginTop: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    picker: {
        height: 180,
    },
    primaryButton: {
        backgroundColor: '#0A84FF',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,

    },
    btnDisabled: {
        backgroundColor: '#2C2C2E',
        shadowOpacity: 0,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '300',
        letterSpacing: 0.5,
    },
});
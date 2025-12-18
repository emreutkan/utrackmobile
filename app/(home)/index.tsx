import { createWorkout, deleteWorkout, getActiveWorkout } from '@/api/Workout';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SwipeAction = ({ progress, onPress }: any) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);
        return { transform: [{ scale }] };
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.deleteAction}>
            <Animated.View style={animatedStyle}>
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function Home() {
    const [modalVisible, setModalVisible] = useState(false);
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [activeWorkout, setActiveWorkout] = useState<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const insets = useSafeAreaInsets();
    const [modalCreateButtonText, setModalCreateButtonText] = useState('Create Workout');
    const [modalCreateButtonAction, setModalCreateButtonAction] = useState('createWorkout');
    const [keyboardHeight, setKeyboardHeight] = useState(300);

    const fetchActiveWorkout = async () => {
        try {
            const workout = await getActiveWorkout();
            if (workout && typeof workout === 'object' && 'id' in workout) {
                setActiveWorkout(workout);
            } else {
                setActiveWorkout(null);
            }
        } catch (error) {
            setActiveWorkout(null);
        }
    };

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        return () => showSubscription.remove();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchActiveWorkout();
        }, [])
    );

    useEffect(() => {
        let interval: any;
        if (activeWorkout?.created_at) {
            const startTime = new Date(activeWorkout.created_at).getTime();
            const updateTimer = () => {
                const now = new Date().getTime();
                const diff = Math.max(0, now - startTime);
                const seconds = Math.floor((diff / 1000) % 60);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                const hours = Math.floor((diff / (1000 * 60 * 60)));
                setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            };
            updateTimer();
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsedTime('00:00:00');
        }
        return () => { if (interval) clearInterval(interval); };
    }, [activeWorkout]);

    // Handle initial state when modal opens
    useEffect(() => {
        if (modalVisible) {
            if (modalCreateButtonAction === 'createWorkout') {
                const now = new Date();
                const month = now.toLocaleString('default', { month: 'long' });
                setWorkoutTitle(`${month} ${now.getDate()} ${now.getFullYear()} Workout`);
            } else {
                setWorkoutTitle(''); // Force empty title for previous workout
            }
        }
    }, [modalVisible, modalCreateButtonAction]);

    const closeModal = () => {
        setModalVisible(false);
        setWorkoutTitle('');
        setDate(new Date());
        setShowDatePicker(false);
    };

    const handleCreateWorkout = async () => {
        if (!workoutTitle.trim()) return;

        try {
            const isPrevious = modalCreateButtonAction === 'addPreviousWorkout';
            const payload = isPrevious 
                ? { title: workoutTitle, date: date.toISOString() } 
                : { title: workoutTitle };

            const result = await createWorkout(payload);

            if (result && typeof result === 'object' && result.error === "ACTIVE_WORKOUT_EXISTS") {
                const errorMessage = isPrevious 
                    ? "This date is after your current active workout. Please select an earlier date or finish your active workout first."
                    : "You already have an active workout in progress.";
                
                Alert.alert("Cannot Create Workout", errorMessage, [
                    { text: "Cancel", style: "cancel", onPress: closeModal },
                    { text: "View Active", onPress: () => { closeModal(); router.push('/(active-workout)'); }}
                ]);
                return;
            }

            if (result?.id) {
                closeModal();
                isPrevious ? router.push(`/(workouts)/${result.id}/edit`) : router.push('/(active-workout)');
            }
        } catch (e) {
            Alert.alert("Error", "Failed to communicate with server.");
        }
    };

    const handleDeleteActiveWorkout = () => {
        Alert.alert("Delete Workout", "This action cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                if (activeWorkout?.id) {
                    await deleteWorkout(activeWorkout.id);
                    setActiveWorkout(null);
                    setElapsedTime('00:00:00');
                }
            }}
        ]);
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => router.push('/(account)')} hitSlop={10}>
                    <Ionicons name="person-circle-outline" size={42} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {activeWorkout?.id && (
                <View style={{ width: '100%' }}>
                    <View style={styles.contentContainer}>
                        <Text style={styles.contentTitle}>Active Workout</Text>
                    </View>
                    <ReanimatedSwipeable
                        renderRightActions={(progress, dragX) => <SwipeAction progress={progress} dragX={dragX} onPress={handleDeleteActiveWorkout} />}
                        containerStyle={{ width: '100%', marginVertical: 12 }}
                    >
                        <TouchableOpacity style={styles.activeCard} onPress={() => router.push('/(active-workout)')} activeOpacity={0.8}>
                            <View style={styles.cardHeader}>
                                <View style={styles.liveBadge}>
                                    <View style={styles.liveDot} />
                                    <Text style={styles.liveText}>IN PROGRESS</Text>
                                </View>
                                <View style={styles.timerContainer}>
                                    <Text style={styles.timerText}>{elapsedTime}</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                                </View>
                            </View>
                            <Text style={styles.cardTitle} numberOfLines={1}>{activeWorkout.title}</Text>
                        </TouchableOpacity>
                    </ReanimatedSwipeable>
                </View>
            )}

            {/* Layout Navigation Buttons */}
            <View style={[styles.workoutsButtonContainer, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity onPress={() => router.push('/(workouts)')} style={styles.fabButton}>
                    <Ionicons name="reader-outline" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={[styles.SupplementsButtonContainer, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity onPress={() => router.push('/(supplements)')} style={styles.fabButton}>
                    <MaterialIcons name="medication" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity 
                    style={styles.fabButton} 
                    onPress={() => {
                        Alert.alert("Start Workout", "Choose an option", [
                            { text: "Start New Workout", onPress: () => { setModalCreateButtonText('Start Workout'); setModalCreateButtonAction('createWorkout'); setModalVisible(true); }},
                            { text: "Add Previous Workout", onPress: () => { setModalCreateButtonText('Add Workout'); setModalCreateButtonAction('addPreviousWorkout'); setModalVisible(true); }},
                            { text: "Cancel", style: "cancel" }
                        ]);
                    }}
                >
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Workout Modal */}
            <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={closeModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalInternalTitle}>
                            {modalCreateButtonAction === 'createWorkout' ? 'Start Live Workout' : 'Log Previous Workout'}
                        </Text>
                        
                        <View style={styles.inputWrapper}>
                            <TextInput 
                                placeholder="Workout Name" 
                                placeholderTextColor="#8E8E93"
                                value={workoutTitle} 
                                onChangeText={setWorkoutTitle} 
                                style={styles.modalInput}
                                autoFocus
                            />
                            {workoutTitle.length > 0 && (
                                <TouchableOpacity onPress={() => setWorkoutTitle('')} style={styles.clearIcon}>
                                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {modalCreateButtonAction === 'addPreviousWorkout' && (
                            <TouchableOpacity 
                                style={styles.dateSelector} 
                                onPress={() => { Keyboard.dismiss(); setShowDatePicker(true); }}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#0A84FF" />
                                <Text style={styles.dateText}>{date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.modalBtnStack}>
                            <TouchableOpacity 
                                style={[styles.primaryBtn, !workoutTitle.trim() && { opacity: 0.5 }]} 
                                onPress={handleCreateWorkout}
                                disabled={!workoutTitle.trim()}
                            >
                                <Text style={styles.primaryBtnText}>{modalCreateButtonText}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryBtn} onPress={closeModal}>
                                <Text style={styles.secondaryBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {showDatePicker && (
                    <View style={styles.sheetOverlay}>
                        <TouchableOpacity style={styles.sheetBackdrop} onPress={() => setShowDatePicker(false)} />
                        <View style={[styles.bottomSheet, { height: keyboardHeight }]}>
                            <View style={styles.sheetHeader}>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={styles.doneText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={date}
                                mode="datetime"
                                display="spinner"
                                maximumDate={new Date()} // DATE LOCK: NO FUTURE DATES
                                onChange={(event, selectedDate) => { if (selectedDate) setDate(selectedDate); }}
                                textColor="#FFFFFF"
                                themeVariant="dark"
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                )}
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', padding: 8, backgroundColor: '#000000' },
    headerContainer: { paddingHorizontal: 4, alignItems: 'flex-end', width: '100%', marginBottom: -28, zIndex: 10, position: 'relative' },
    contentContainer: { width: '100%', paddingHorizontal: 4, marginBottom: 8 },
    contentTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
    activeCard: { width: '100%', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2C2C2E' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(50, 215, 75, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#32D74B', marginRight: 6 },
    liveText: { color: '#32D74B', fontSize: 12, fontWeight: '700' },
    timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timerText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
    cardTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
    workoutsButtonContainer: { position: 'absolute', left: 20 },
    SupplementsButtonContainer: { position: 'absolute', left: 90 },
    fabContainer: { position: 'absolute', right: 20 },
    fabButton: { backgroundColor: '#1C1C1E', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2C2C2E' },
    modalInternalTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 24, textAlign: 'center' },
    inputWrapper: { position: 'relative', marginBottom: 16 },
    modalInput: { backgroundColor: '#2C2C2E', borderRadius: 14, padding: 18, color: '#FFFFFF', fontSize: 17, fontWeight: '500' },
    clearIcon: { position: 'absolute', right: 14, top: 18 },
    dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2C2C2E', padding: 16, borderRadius: 14, marginBottom: 24, gap: 10 },
    dateText: { color: '#0A84FF', fontSize: 16, fontWeight: '600' },
    modalBtnStack: { gap: 12 },
    primaryBtn: { backgroundColor: '#0A84FF', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
    primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    secondaryBtn: { paddingVertical: 12, alignItems: 'center' },
    secondaryBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
    sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 9999 },
    sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    bottomSheet: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, width: '100%', overflow: 'hidden' },
    sheetHeader: { height: 50, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
    doneText: { color: '#0A84FF', fontSize: 17, fontWeight: '600' },
    deleteAction: { backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', width: 80, height: '100%', borderRadius: 16 },
});
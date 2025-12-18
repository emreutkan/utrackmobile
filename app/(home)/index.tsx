import { createWorkout, deleteWorkout, getActiveWorkout } from '@/api/Workout';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const SwipeAction = ({ progress,  onPress }: any) => {
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
    // 1. State lives here, at the top level
    const [modalVisible, setModalVisible] = useState(false);
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [activeWorkout, setActiveWorkout] = useState<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const insets = useSafeAreaInsets();
    const [modalCreateButtonText, setModalCreateButtonText] = useState('Create Workout');
    const [modalCreateButtonAction, setModalCreateButtonAction] = useState('createWorkout');
    const fetchActiveWorkout = async () => {
        try {
            const workout = await getActiveWorkout();
            // Check if workout is an object and has an id (valid workout)
            if (workout && typeof workout === 'object' && 'id' in workout) {
                setActiveWorkout(workout);
                console.log("Active Workout:", workout);
            } else {
                // If it returns an error string or object like { error: ... }
                setActiveWorkout(null);
                console.log("No active workout found or error:", workout);
            }
        } catch (error) {
            console.error("Failed to fetch active workout", error);
            setActiveWorkout(null);
        }
    };
    const [keyboardHeight, setKeyboardHeight] = useState(300); // Default fallback

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
                
                const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                setElapsedTime(formattedTime);
            };

            updateTimer(); // Initial call
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsedTime('00:00:00');
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeWorkout]);

    useEffect(() => {
        if (modalVisible) {
            const date = new Date();
            const month = date.toLocaleString('default', { month: 'long' });
            const day = date.getDate();
            const year = date.getFullYear();
            if (modalCreateButtonAction !== 'addPreviousWorkout') {
                setWorkoutTitle(`${month} ${day} ${year} Workout`);
            }
            else {
                setWorkoutTitle(`${month} ${day} ${year} Workout`);
            }
        }
    }, [modalVisible]);

    

    const handleCreateWorkout = async () => {
        if (modalCreateButtonAction === 'createWorkout') {
            try {
                const result = await createWorkout({ title: workoutTitle });
    
                if (typeof result === 'object' && 'error' in result && result.error === "ACTIVE_WORKOUT_EXISTS") {
                    Alert.alert(
                        "Active Workout Exists",
                        `You already have an active workout (ID: ${result.active_workout}).`,
                        [
                            {
                                text: "Cancel",
                                style: "cancel",
                                onPress: () => setModalVisible(false)
                            },
                            {
                                text: "View/Resume",
                                onPress: () => {
                                    setModalVisible(false);
                                    router.push('/(active-workout)');
                                }
                            }
                        ]
                    );
                    return;            }
                else if (typeof result === 'object' && 'id' in result && !('error' in result)) {
                    console.log('Workout created:', result.id);
                    setModalVisible(false);
                    setWorkoutTitle('');
                    router.push('/(active-workout)');
                    return;
                }
                else {
                    Alert.alert(
                        "Error",
                        `An unknown error occurred while creating the workout: ${result}`,
                        [
                            { text: "OK", style: "cancel", onPress: () => setModalVisible(false) }
                        ]
                    );
                }
            } catch (e) {
                console.error(e);
            } finally {
                setModalVisible(false); // Close modal
                setWorkoutTitle('');    // Reset input
            }
        } else if (modalCreateButtonAction === 'addPreviousWorkout') {
            const result = await createWorkout({ title: workoutTitle, date: date });
            if (typeof result === 'object' && 'id' in result && !('error' in result)) {
                console.log('Workout created:', result.id);
                setModalVisible(false);
                setWorkoutTitle('');
                router.push(`/(workouts)/${result.id}/edit`);
                return;
            }
            else {
                Alert.alert(
                    "Error",
                    `An unknown error occurred while creating the workout: ${result}`,
                    [
                        { text: "OK", style: "cancel", onPress: () => setModalVisible(false) }
                    ]
                );
            }
        }
    }


    const handleDeleteActiveWorkout = () => {
        Alert.alert(
            "Delete Active Workout",
            "Are you sure you want to delete this workout? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        // Second confirmation
                        Alert.alert(
                            "Confirm Deletion",
                            "This will permanently delete all data for this workout. Are you absolutely sure?",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Confirm Delete",
                                    style: "destructive",
                                    onPress: async () => {
                                        if (activeWorkout?.id) {
                                            try {
                                                await deleteWorkout(activeWorkout.id);
                                                setActiveWorkout(null);
                                                setElapsedTime('00:00:00');
                                            } catch (error) {
                                                console.error("Failed to delete workout:", error);
                                                Alert.alert("Error", "Failed to delete workout");
                                            }
                                        }
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

    const renderActiveWorkout = () => {
        if (!activeWorkout || !activeWorkout.id) return null;

        const renderRightActions = (progress: any, dragX: any) => (
            <SwipeAction progress={progress} dragX={dragX} onPress={handleDeleteActiveWorkout} />
        );

        return (
            <>
                <View style={styles.contentContainer}>
                    <Text style={styles.contentTitle}>Active Workout</Text>
                </View>
                <ReanimatedSwipeable
                    renderRightActions={renderRightActions}
                    containerStyle={{ width: '100%', marginVertical: 12 }}
                >
                    <TouchableOpacity 
                        style={[styles.activeCard, { marginVertical: 0 }]} // Remove margin from card as it's on container now
                        onPress={() => router.push('/(active-workout)')}
                        activeOpacity={0.8}
                    >
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
                        <Text style={styles.cardTitle} numberOfLines={1}>
                            {activeWorkout.title}
                        </Text>
                        
                    </TouchableOpacity>
                </ReanimatedSwipeable>
            </>
           
        );
    }

    const handleStartNewWorkout = () => {
        setModalCreateButtonText('Create Workout');
        setModalVisible(true);
    };
    const handleAddPreviousWorkoutModal = () => {
        setModalCreateButtonText('Add Previous Workout');
        setModalCreateButtonAction('addPreviousWorkout'); // Ensure this is set
        setModalVisible(true);
        // Open the picker immediately when choosing "Add Previous"
    };

    const renderAddWorkoutButton = () => {
        return (
            <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity 
                    style={styles.fabButton} 
                    onPress={() => {
                        Alert.alert(
                            "Start Workout",
                            "Choose an option",
                            [
                                {
                                    text: "Start New Workout",
                                    onPress: handleStartNewWorkout
                                },
                                {
                                    text: "Add Previous Workout",
                                    onPress: handleAddPreviousWorkoutModal
                                },
                                {
                                    text: "Cancel",
                                    style: "cancel"
                                }
                            ]
                        );
                    }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        );
    }

    const renderWorkoutsButton = () => {
        return (
            <View style={[styles.workoutsButtonContainer, { bottom: insets.bottom + 20 }]}>
            <TouchableOpacity onPress={() => router.push('/(workouts)')}
                                    style={styles.fabButton} 

                >
                <Ionicons name="reader-outline" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            </View>
        );
    }

    const renderSupplementsButton = () => {
        return (
            <View style={[styles.SupplementsButtonContainer, { bottom: insets.bottom + 20 }]}>
            <TouchableOpacity onPress={() => router.push('/(supplements)')}
                                    style={styles.fabButton} 

                >
                <MaterialIcons name="medication" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            </View>
        );
    }
    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <TouchableOpacity 
                onPress={() => router.push('/(account)')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch area
            >
                <Ionicons name="person-circle-outline" size={42} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );

    const onDateChange = (event: any, selectedDate?: Date) => {
        // Android: You MUST set this to false immediately or it won't pop up again
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        
        if (selectedDate) {
            setDate(selectedDate);
        }
    };
    

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, {  paddingTop: insets.top }]}>
            {renderHeader()}

            {renderActiveWorkout()}
            {renderWorkoutsButton()}
            {renderSupplementsButton()}
            {renderAddWorkoutButton()}

            <Modal
                visible={modalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        
                        <View style={styles.inputContainer}>
                            <TextInput 
                                placeholder="Workout Name" 
                                placeholderTextColor="#8E8E93"
                                value={workoutTitle} 
                                onChangeText={setWorkoutTitle} 
                                style={styles.modalInput}
                                autoFocus
                            />
                            {workoutTitle.length > 0 && (
                                <TouchableOpacity 
                                    onPress={() => setWorkoutTitle('')}
                                    style={styles.clearButton}
                                >
                                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity 
            style={styles.sheetBackdrop} 
            onPress={() => setShowDatePicker(false)} 
        />
        
        <TouchableOpacity 
    style={styles.datePickerTrigger} 
    onPress={() => {
        Keyboard.dismiss(); // Hide keyboard so the sheet takes its place
        setShowDatePicker(true);
    }}
>
    <Text style={styles.dateText}>{date.toLocaleString()}</Text>
</TouchableOpacity>


                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.createButton} 
                                onPress={handleCreateWorkout}
                            >
                                <Text style={styles.createButtonText}>{modalCreateButtonText}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.cancelButton} 
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                {showDatePicker && (
    <View style={styles.sheetOverlay}>

        <View style={[styles.bottomSheet, { height: keyboardHeight }]}>
            <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
            </View>

            <DateTimePicker
                value={date}
                mode="datetime"
                display="spinner" // Spinner looks best in bottom sheets
                onChange={onDateChange}
                textColor="#FFFFFF"
                themeVariant="dark"
                style={{ flex: 1 }}
            />
        </View>
    </View>
)}
            </Modal>
  
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#000000',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed background
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#1C1C1E', // Dark card
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 10,
            }
        }),
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        position: 'relative',
        marginBottom: 24,
    },
    modalInput: {
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 16,
        paddingRight: 40,
        color: '#FFFFFF',
        fontSize: 17,
    },
    clearButton: {
        position: 'absolute',
        right: 12,
        top: 16,
    },
    modalActions: {
        width: '100%',
        gap: 12,
    },
    createButton: {
        backgroundColor: '#0A84FF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        width: '100%',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#FF3B30',
        fontSize: 17,
        fontWeight: '600',
    },
    contentContainer: {
        width: '100%',
        paddingHorizontal: 4,
        marginBottom: 8,
        
    },
    contentTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
    },
    activeCard: {
        width: '100%',
        backgroundColor: '#1C1C1E', // iOS System Gray 6 (Dark)
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 12,
        marginVertical: 12, // Push content down
        borderWidth: 1,
        borderColor: '#2C2C2E', // Subtle border for definition
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
            }
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(50, 215, 75, 0.1)', // Subtle Green Tint
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#32D74B', // iOS Green
        marginRight: 6,
    },
    liveText: {
        color: '#32D74B',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timerText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    cardSubtitle: {
        color: '#8E8E93', // iOS Gray
        fontSize: 14,
        fontWeight: '500',
    },
    deleteAction: {
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderRadius: 16, // Matches card border radius
    },
    fabContainer: {
        position: 'absolute',
        right: 20,
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.3)',
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
            }
        }),
    },
    fabButton: {
        backgroundColor: '#1C1C1E', // iOS System Gray 6 (Dark)
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    headerContainer: {
        paddingHorizontal: 4,
        alignItems: 'flex-end',
        width: '100%',
        marginBottom: -28, // <--- This negative margin!
        zIndex: 10, // Ensure it's on top of overlapping content
        position: 'relative', // Needed for zIndex to work reliably
    },

        workoutsButtonContainer: {
            position: 'absolute',
            left: 20,
            
        },
        SupplementsButtonContainer: {
            position: 'absolute',
            left: 90,
            
        },
    workoutsButton: {
        backgroundColor: '#1C1C1E',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    workoutsButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    datePickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    dateText: {
        color: '#0A84FF',
        fontSize: 17,
        fontWeight: '600',
    },
    sheetOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-end',
        zIndex: 1001, // Ensure it's above your main modal
    },
    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    bottomSheet: {
        backgroundColor: '#1C1C1E', // Match keyboard/iOS dark gray
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        width: '100%',
        paddingBottom: 20,
    },
    sheetHeader: {
        height: 45,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#3A3A3C',
    },
    doneText: {
        color: '#0A84FF',
        fontSize: 17,
        fontWeight: '600',
    },
});


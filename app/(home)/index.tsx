import { createWorkout, getActiveWorkout } from '@/api/Workout';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function Home() {
    // 1. State lives here, at the top level
    const [modalVisible, setModalVisible] = useState(false);
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [activeWorkout, setActiveWorkout] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const insets = useSafeAreaInsets();

    useEffect(() => {
        getActiveWorkout().then((workout) => {
            setActiveWorkout(workout);
            console.log("Active Workout:", workout);
        });
    }, []);

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
            setWorkoutTitle(`${month} ${day} ${year} Workout`);
        }
    }, [modalVisible]);

    const handleCreateWorkout = async () => {
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
    }


    const renderActiveWorkout = () => {
        if (!activeWorkout) return null;

        return (
            <>
                        <View style={styles.contentContainer}>
                <Text style={styles.contentTitle}>Active Workout</Text>
            </View>
            <TouchableOpacity 
                style={styles.activeCard} 
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
            </>
           
        );
    }

    const renderAddWorkoutButton = () => {
        return (
            <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
                <TouchableOpacity 
                    style={styles.fabButton} 
                    onPress={() => setModalVisible(true)}
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

    return (
        <View style={[styles.container, {  paddingTop: insets.top }]}>
            {renderHeader()}

            {renderActiveWorkout()}
            {renderWorkoutsButton()}
            {renderSupplementsButton()}
            {renderAddWorkoutButton()}

            {/* 3. Render Modal conditionally based on state */}
            <Modal
                visible={modalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>New Workout</Text>
                        
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
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.createButton} 
                                onPress={handleCreateWorkout}
                            >
                                <Text style={styles.createButtonText}>Create Workout</Text>
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
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 8,
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
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
    fabContainer: {
        position: 'absolute',
        right: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
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

});


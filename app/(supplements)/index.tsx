import { addUserSupplement, deleteSupplementLog, getSupplementLogs, getSupplements, getTodayLogs, getUserSupplements, logUserSupplement, Supplement, SupplementLog, UserSupplement } from '@/api/Supplements';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// 1. COMPONENTS
// ============================================================================

const SwipeDeleteAction = ({ progress, onPress }: any) => {
    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP);
        return { transform: [{ scale }] };
    });

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.deleteAction}>
            <Animated.View style={animatedStyle}>
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            </Animated.View>
        </TouchableOpacity>
    );
};

// ============================================================================
// 2. MAIN SCREEN
// ============================================================================

export default function SupplementsScreen() {
    const insets = useSafeAreaInsets();
    
    // --- Data State ---
    const [userSupplements, setUserSupplements] = useState<UserSupplement[]>([]);
    const [availableSupplements, setAvailableSupplements] = useState<Supplement[]>([]);
    const [todayLogsMap, setTodayLogsMap] = useState<Map<number, boolean>>(new Map());
    
    // --- UI State ---
    const [modals, setModals] = useState({ add: false, history: false });
    const [isLoading, setIsLoading] = useState(false);
    
    // --- Selection & Form State ---
    const [selectedSupp, setSelectedSupp] = useState<UserSupplement | null>(null);
    const [viewingLogs, setViewingLogs] = useState<SupplementLog[]>([]);
    
    const [addStep, setAddStep] = useState<1 | 2>(1);
    const [newSuppData, setNewSuppData] = useState<{
        base: Supplement | null,
        dosage: string,
        freq: string,
        time: string
    }>({ base: null, dosage: '', freq: 'daily', time: '' });

    // --- Loading ---

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const [userData, allData, todayData] = await Promise.all([
                getUserSupplements(),
                getSupplements(),
                getTodayLogs()
            ]);
            
            setUserSupplements(userData);
            setAvailableSupplements(allData);
            
            const logMap = new Map<number, boolean>();
            if (todayData?.logs) {
                todayData.logs.forEach(log => logMap.set(log.id, true));
            }
            setTodayLogsMap(logMap);
        } catch (e) { console.error(e); }
    };

    const loadLogs = async (id: number) => {
        setIsLoading(true);
        try {
            const logs = await getSupplementLogs(id);
            setViewingLogs(logs);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    // --- Actions ---

    const handleLog = async (item: UserSupplement) => {
        // Immediate feedback
        const now = new Date();
        const result = await logUserSupplement({
            user_supplement_id: item.id,
            date: now.toISOString().split('T')[0],
            time: `${now.getHours()}:${now.getMinutes()}:00`,
            dosage: item.dosage
        });

        if (result) {
            loadData();
        } else {
            Alert.alert("Error", "Failed to log.");
        }
    };

    const handleAddSubmit = async () => {
        if (!newSuppData.base || !newSuppData.dosage) return;
        
        const result = await addUserSupplement({
            supplement_id: newSuppData.base.id,
            dosage: parseFloat(newSuppData.dosage),
            frequency: newSuppData.freq,
            time_of_day: newSuppData.time
        });

        if (result) {
            setModals(m => ({ ...m, add: false }));
            setAddStep(1);
            setNewSuppData({ base: null, dosage: '', freq: 'daily', time: '' });
            loadData();
        }
    };

    const openHistory = (item: UserSupplement) => {
        setSelectedSupp(item);
        setModals(m => ({ ...m, history: true }));
        loadLogs(item.id);
    };

    const handleDeleteLog = async (logId: number) => {
        await deleteSupplementLog(logId);
        if (selectedSupp) loadLogs(selectedSupp.id);
        loadData();
    };

    // --- Render Items ---

    const renderItem = ({ item }: { item: UserSupplement }) => {
        const isLogged = todayLogsMap.get(item.id);

        return (
            <TouchableOpacity 
                style={styles.rowItem} 
                activeOpacity={0.7}
                onPress={() => openHistory(item)}
            >
                {/* Left: Info */}
                <View style={styles.rowLeft}>
                    <Text style={styles.rowTitle}>{item.supplement_details.name}</Text>
                    <Text style={styles.rowSubtitle}>
                        {item.dosage} {item.supplement_details.dosage_unit} • {item.frequency}
                    </Text>
                </View>

                {/* Right: Action Button (Pill Style) */}
                <TouchableOpacity 
                    style={[styles.logButton, isLogged && styles.logButtonDone]}
                    onPress={() => !isLogged && handleLog(item)}
                    activeOpacity={0.8}
                    disabled={isLogged}
                >
                    <Text style={[styles.logButtonText, isLogged && styles.logButtonTextDone]}>
                        {isLogged ? "LOGGED" : "LOG"}
                    </Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <FlatList
                data={userSupplements}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={[styles.listContent, { paddingTop: 16, paddingBottom: insets.bottom + 100 }]}
                ListHeaderComponent={
                    userSupplements.length > 0 ? (
                        <Text style={styles.sectionHeader}>YOUR SUPPLEMENTS</Text>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="nutrition" size={32} color="#8E8E93" />
                        </View>
                        <Text style={styles.emptyTitle}>No Supplements</Text>
                        <Text style={styles.emptyText}>Add supplements to track your daily intake.</Text>
                    </View>
                }
            />

            {/* Floating Add Button */}
            <View style={[styles.floatingButtonContainer, { bottom: insets.bottom + 80 }]}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="dark" style={styles.floatingButtonBlur}>
                        <TouchableOpacity 
                            style={styles.floatingButton}
                            onPress={() => setModals(m => ({ ...m, add: true }))}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add" size={24} color="#0A84FF" />
                        </TouchableOpacity>
                    </BlurView>
                ) : (
                    <View style={[styles.floatingButtonBlur, styles.androidFloatingButton]}>
                        <TouchableOpacity 
                            style={styles.floatingButton}
                            onPress={() => setModals(m => ({ ...m, add: true }))}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add" size={24} color="#0A84FF" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* ================= ADD MODAL ================= */}
            <Modal visible={modals.add} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {addStep === 1 ? "Add Supplement" : "Details"}
                        </Text>
                        <TouchableOpacity onPress={() => {
                            setModals(m => ({ ...m, add: false }));
                            setAddStep(1);
                        }}>
                            <Ionicons name="close-circle" size={30} color="#3A3A3C" />
                        </TouchableOpacity>
                    </View>

                    {addStep === 1 ? (
                        // Step 1: List
                        <FlatList
                            data={availableSupplements}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.selectionRow}
                                    onPress={() => {
                                        setNewSuppData(prev => ({ 
                                            ...prev, 
                                            base: item, 
                                            dosage: item.default_dosage?.toString() || '' 
                                        }));
                                        setAddStep(2);
                                    }}
                                >
                                    <Text style={styles.selectionText}>{item.name}</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#545458" />
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        // Step 2: Form
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                            <ScrollView contentContainerStyle={styles.formContent}>
                                <View style={styles.previewBanner}>
                                    <Text style={styles.previewText}>{newSuppData.base?.name}</Text>
                                    <TouchableOpacity onPress={() => setAddStep(1)}>
                                        <Text style={styles.changeLink}>Change</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>DOSAGE ({newSuppData.base?.dosage_unit})</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newSuppData.dosage}
                                    onChangeText={t => setNewSuppData(p => ({ ...p, dosage: t }))}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#545458"
                                    autoFocus
                                />

                                <Text style={styles.label}>FREQUENCY</Text>
                                <View style={styles.pillRow}>
                                    {['Daily', 'Weekly'].map(f => (
                                        <TouchableOpacity 
                                            key={f}
                                            style={[styles.pill, newSuppData.freq.toLowerCase() === f.toLowerCase() && styles.pillActive]}
                                            onPress={() => setNewSuppData(p => ({ ...p, freq: f.toLowerCase() }))}
                                        >
                                            <Text style={[styles.pillText, newSuppData.freq.toLowerCase() === f.toLowerCase() && styles.pillTextActive]}>{f}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={styles.label}>TIME OF DAY (OPTIONAL)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newSuppData.time}
                                    onChangeText={t => setNewSuppData(p => ({ ...p, time: t }))}
                                    placeholder="Morning, Pre-workout..."
                                    placeholderTextColor="#545458"
                                />

                                <TouchableOpacity style={styles.saveButton} onPress={handleAddSubmit}>
                                    <Text style={styles.saveButtonText}>Add Supplement</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    )}
                </View>
            </Modal>

            {/* ================= HISTORY MODAL ================= */}
            <Modal visible={modals.history} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>{selectedSupp?.supplement_details.name} Logs</Text>
                            <Text style={styles.modalSubtitle}>History</Text>
                        </View>
                        <TouchableOpacity onPress={() => setModals(m => ({ ...m, history: false }))}>
                            <Ionicons name="close-circle" size={30} color="#3A3A3C" />
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#0A84FF" />
                        </View>
                    ) : (
                        <FlatList
                            data={viewingLogs}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item, index }) => (
                                <ReanimatedSwipeable
                                    renderRightActions={(p) => <SwipeDeleteAction progress={p} onPress={() => handleDeleteLog(item.id)} />}
                                    friction={2}
                                >
                                    <View style={[styles.logRow, index === viewingLogs.length - 1 && styles.logRowLast]}>
                                        <Text style={styles.logDate}>
                                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={styles.logDetail}>
                                                {item.time.substring(0, 5)}
                                            </Text>
                                            <Text style={styles.logDosage}>
                                                {item.dosage} {selectedSupp?.supplement_details.dosage_unit}
                                            </Text>
                                        </View>
                                    </View>
                                </ReanimatedSwipeable>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No logs found.</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    listContent: { padding: 16 },

    // Section Header
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#636366',
        marginBottom: 8,
        marginLeft: 16,
    },

    // List Item (Apple Style)
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    rowLeft: {
        flex: 1,
        justifyContent: 'center',
    },
    rowTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    rowSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
    },

    // Log Button (Pill)
    logButton: {
        backgroundColor: '#2C2C2E', // Dark gray background initially
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#0A84FF',
    },
    logButtonDone: {
        backgroundColor: '#1C1C1E',
        borderColor: '#32D74B', // Green border
    },
    logButtonText: {
        color: '#0A84FF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    logButtonTextDone: {
        color: '#32D74B',
    },

    // Empty State
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { 
        width: 60, height: 60, borderRadius: 30, 
        backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center', marginBottom: 16 
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 8 },
    emptyText: { fontSize: 15, color: '#8E8E93', textAlign: 'center' },

    // Modals
    modalContainer: { flex: 1, backgroundColor: '#1C1C1E' },
    modalHeader: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        padding: 20, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' 
    },
    modalTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
    modalSubtitle: { fontSize: 13, color: '#8E8E93' },

    // Selection List
    selectionRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#3A3A3C'
    },
    selectionText: { fontSize: 17, color: '#FFF' },

    // Form
    formContent: { padding: 20 },
    previewBanner: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#2C2C2E', padding: 16, borderRadius: 12, marginBottom: 24,
        borderWidth: 1, borderColor: '#3A3A3C'
    },
    previewText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
    changeLink: { color: '#0A84FF', fontSize: 15 },
    
    label: { color: '#8E8E93', fontSize: 13, fontWeight: '600', marginBottom: 8 },
    input: {
        backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16,
        fontSize: 17, color: '#FFF', marginBottom: 24,
    },
    pillRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    pill: {
        flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#2C2C2E',
        borderWidth: 1, borderColor: '#3A3A3C', alignItems: 'center'
    },
    pillActive: { backgroundColor: '#0A84FF', borderColor: '#0A84FF' },
    pillText: { color: '#8E8E93', fontWeight: '600' },
    pillTextActive: { color: '#FFF' },
    saveButton: { backgroundColor: '#0A84FF', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
    saveButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },

    // Logs
    logRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, backgroundColor: '#1C1C1E', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#3A3A3C'
    },
    logRowLast: { borderBottomWidth: 0 },
    logDate: { color: '#FFF', fontSize: 17 },
    logDetail: { color: '#8E8E93', fontSize: 15 },
    logDosage: { color: '#FFF', fontSize: 15, fontWeight: '500' },
    
    loadingContainer: { padding: 40, alignItems: 'center' },
    deleteAction: { backgroundColor: '#FF3B30', width: 80, alignItems: 'center', justifyContent: 'center' },
    
    // Floating Button
    floatingButtonContainer: {
        position: 'absolute',
        right: 12,
        zIndex: 1000,
    },
    floatingButtonBlur: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    androidFloatingButton: {
        backgroundColor: '#1C1C1E',
    },
    floatingButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
});
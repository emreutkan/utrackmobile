import { calculateBodyFatMen, calculateBodyFatWomen, createMeasurement, getMeasurements } from '@/api/Measurements';
import { deleteWeightEntry, getAccount, getWeightHistory, updateWeight } from '@/api/account';
import { BodyMeasurement, CalculateBodyFatResponse, CreateMeasurementRequest, WeightHistoryEntry } from '@/api/types';
import { useUserStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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
import Svg, { Circle, Defs, LinearGradient, Polyline, Stop } from 'react-native-svg';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48; // Account for padding
const CHART_HEIGHT = 160;

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Progress Chart Component
 * Displays a line chart with gradient fill for weight or body fat data
 */
const ProgressChart = ({ 
    data, 
    color, 
    yKey, 
    xKey, 
    unit 
}: { 
    data: any[]; 
    color: string; 
    yKey: string; 
    xKey: string;
    unit: string; 
}) => {
    // Empty state
    if (data.length === 0) {
        return (
            <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={32} color="#2C2C2E" />
                <Text style={styles.emptyChartText}>No data available</Text>
            </View>
        );
    }

    // Calculate chart values and ranges
    const values = data.map(d => parseFloat(d[yKey] || 0));
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal || 1;
    
    // Generate points for the line chart
    const points = values.map((val, index) => {
        const x = (index / (values.length - 1 || 1)) * CHART_WIDTH;
        const y = CHART_HEIGHT - ((val - minVal) / range) * (CHART_HEIGHT - 20) - 10;
        return `${x},${y}`;
    }).join(' ');

    // Get the most recent value for display
    const lastValue = values[values.length - 1];

    return (
        <View>
            <View style={styles.chartHeaderRow}>
                <Text style={[styles.chartValueBig, { color }]}>
                    {lastValue.toFixed(1)}<Text style={styles.chartUnit}>{unit}</Text>
                </Text>
            </View>
            
            <View style={{ height: CHART_HEIGHT, marginTop: 10 }}>
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                    <Defs>
                        <LinearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={color} stopOpacity="1" />
                            <Stop offset="1" stopColor={color} stopOpacity="0.5" />
                        </LinearGradient>
                    </Defs>
                    
                    {/* Main line path */}
                    <Polyline
                        points={points}
                        fill="none"
                        stroke={`url(#grad-${color})`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data point markers */}
                    {values.map((val, index) => {
                        const x = (index / (values.length - 1 || 1)) * CHART_WIDTH;
                        const y = CHART_HEIGHT - ((val - minVal) / range) * (CHART_HEIGHT - 20) - 10;
                        return (
                            <Circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="4"
                                fill="#000"
                                stroke={color}
                                strokeWidth="2"
                            />
                        );
                    })}
                </Svg>
            </View>
        </View>
    );
};

/**
 * Swipe Action Component
 * Animated delete action that appears when swiping left on history items
 */
const SwipeAction = ({ progress, onPress }: any) => {
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
// MAIN SCREEN COMPONENT
// ============================================================================

export default function MeasurementsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useUserStore();
    
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    
    // Data state
    const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
    const [weightHistory, setWeightHistory] = useState<WeightHistoryEntry[]>([]);
    const [currentWeight, setCurrentWeight] = useState<number | null>(null);
    
    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Modal state
    const [modals, setModals] = useState({
        weight: false,
        bodyFat: false
    });
    
    // Form state
    const [tempVal, setTempVal] = useState(''); // For weight input
    const [bfForm, setBfForm] = useState({
        weight: '',
        waist: '',
        neck: '',
        hips: '',
        notes: ''
    });
    const [previewResult, setPreviewResult] = useState<CalculateBodyFatResponse | null>(null);

    // Derived user info
    const userGender = (user?.gender as 'male' | 'female') || 'male';
    const userHeight = user?.height;
    const isFemale = userGender === 'female';

    // ========================================================================
    // DATA LOADING
    // ========================================================================

    // Load data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    /**
     * Load all measurement and weight data from the API
     */
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [measData, weightData, accountData] = await Promise.all([
                getMeasurements(),
                getWeightHistory(),
                getAccount()
            ]);
            
            if (Array.isArray(measData)) setMeasurements(measData);
            if (weightData?.results) setWeightHistory(weightData.results);
            if (accountData?.weight) setCurrentWeight(accountData.weight);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Open weight input modal with current weight pre-filled
     */
    const openWeightModal = () => {
        setTempVal(currentWeight?.toString() || '');
        setModals(prev => ({ ...prev, weight: true }));
    };

    /**
     * Save new weight entry
     */
    const handleSaveWeight = async () => {
        if (!tempVal) return;
        setIsProcessing(true);
        try {
            await updateWeight(parseFloat(tempVal));
            setCurrentWeight(parseFloat(tempVal));
            await loadData();
            setModals(prev => ({ ...prev, weight: false }));
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to save");
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * Calculate body fat percentage (preview or save)
     */
    const handleCalculateBodyFat = async (previewOnly = false) => {
        // Validation
        if (!bfForm.weight || !bfForm.waist || !bfForm.neck || (!userHeight)) {
            Alert.alert("Missing Data", "Please fill in all fields and ensure height is set.");
            return;
        }
        if (isFemale && !bfForm.hips) {
            Alert.alert("Missing Data", "Hips measurement is required for women.");
            return;
        }

        setIsProcessing(true);
        try {
            const baseData = {
                height: userHeight,
                weight: parseFloat(bfForm.weight),
                waist: parseFloat(bfForm.waist),
                neck: parseFloat(bfForm.neck),
            };

            // Calculate body fat based on gender
            let result;
            if (isFemale) {
                result = await calculateBodyFatWomen({ ...baseData, hips: parseFloat(bfForm.hips) });
            } else {
                result = await calculateBodyFatMen(baseData);
            }

            if (result?.error) throw new Error(result.error);

            if (previewOnly) {
                // Just show preview, don't save
                setPreviewResult(result);
            } else {
                // Save the measurement
                const payload: CreateMeasurementRequest = {
                    ...baseData,
                    notes: bfForm.notes,
                    hips: isFemale ? parseFloat(bfForm.hips) : undefined
                };
                await createMeasurement(payload);
                await loadData();
                setModals(prev => ({ ...prev, bodyFat: false }));
                setBfForm({ weight: '', waist: '', neck: '', hips: '', notes: '' });
                setPreviewResult(null);
                Alert.alert("Success", "Measurement recorded.");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Calculation failed");
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * Delete a weight/body fat entry
     */
    const handleDeleteEntry = (entry: WeightHistoryEntry) => {
        const performDelete = async (deleteBF: boolean) => {
            await deleteWeightEntry(entry.id, deleteBF);
            loadData();
        };

        // If entry has body fat data, ask user what to delete
        if (entry.bodyfat !== null) {
            Alert.alert("Delete Entry", "This entry contains body fat data.", [
                { text: "Cancel", style: "cancel" },
                { text: "Weight Only", onPress: () => performDelete(false) },
                { text: "Weight & Body Fat", style: "destructive", onPress: () => performDelete(true) }
            ]);
        } else {
            performDelete(false);
        }
    };

    /**
     * Open body fat calculator modal
     */
    const openBodyFatModal = () => {
        if (!userHeight) {
            Alert.alert("Height Required", "Please set your height in Account settings to calculate body fat.");
            return;
        }
        setModals(prev => ({ ...prev, bodyFat: true }));
        // Pre-fill weight if available
        if (currentWeight) {
            setBfForm(prev => ({ ...prev, weight: currentWeight.toString() }));
        }
    };

    // ========================================================================
    // DATA FORMATTING
    // ========================================================================

    // Prepare chart data (last 10 entries, reversed for chronological order)
    const weightChartData = weightHistory.slice(-10).reverse();
    const bfChartData = measurements
        .filter(m => m.body_fat_percentage)
        .slice(-10)
        .reverse();

    // Sort history by date (newest first)
    const sortedHistory = [...weightHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    /**
     * Format date for display
     */
    const formatDate = (d: string) => 
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // ========================================================================
    // RENDER FUNCTIONS
    // ========================================================================

    /**
     * Render a history entry item
     */
    const renderHistoryItem = ({ item, index }: { item: WeightHistoryEntry; index: number }) => (
        <ReanimatedSwipeable
            key={item.id}
            renderRightActions={(p) => (
                <SwipeAction 
                    progress={p} 
                    onPress={() => handleDeleteEntry(item)} 
                />
            )}
            friction={2}
        >
            <View style={[
                styles.historyRow, 
                index === sortedHistory.length - 1 && styles.historyRowLast
            ]}>
                <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                </View>
                <View style={styles.historyRight}>
                    <View style={styles.historyStat}>
                        <Text style={styles.historyLabel}>Weight</Text>
                        <Text style={styles.historyValue}>{item.weight}</Text>
                    </View>
                    <View style={styles.historyStat}>
                        <Text style={styles.historyLabel}>BF%</Text>
                        <Text style={styles.historyValue}>
                            {item.bodyfat 
                                ? parseFloat(item.bodyfat.toString()).toFixed(1) 
                                : '-'
                            }
                        </Text>
                    </View>
                </View>
            </View>
        </ReanimatedSwipeable>
    );

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView 
                contentContainerStyle={[
                    styles.scrollContent, 
                    { paddingBottom: insets.bottom + 100, paddingTop: 20 }
                ]}
            >
                {/* Weight Card - Quick access to current weight */}
                <TouchableOpacity 
                    style={styles.weightCard} 
                    onPress={openWeightModal} 
                    activeOpacity={0.8}
                >
                    <View style={styles.iconCircleBlue}>
                        <Ionicons name="scale" size={18} color="#0A84FF" />
                    </View>
                    <View style={styles.weightCardContent}>
                        <Text style={styles.statLabel}>Weight</Text>
                        <Text style={styles.statValue}>
                            {currentWeight ? currentWeight : '--'} 
                            <Text style={styles.statUnit}>kg</Text>
                        </Text>
                    </View>
                    <Ionicons name="add-circle" size={20} color="#0A84FF" />
                </TouchableOpacity>

                {/* Body Fat Calculator Button */}
                <TouchableOpacity 
                    style={styles.calcButton}
                    onPress={openBodyFatModal}
                >
                    <Ionicons name="calculator" size={20} color="#FFF" />
                    <Text style={styles.calcButtonText}>Calculate Body Fat</Text>
                </TouchableOpacity>

                {/* Progress Charts Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Progress Trends</Text>
                    
                    {/* Weight Chart */}
                    <View style={styles.chartCard}>
                        <View style={styles.chartTitleRow}>
                            <Ionicons 
                                name="ellipse" 
                                size={12} 
                                color="#0A84FF" 
                                style={{ marginRight: 6 }} 
                            />
                            <Text style={styles.chartTitleText}>Weight History</Text>
                        </View>
                        <ProgressChart 
                            data={weightChartData} 
                            color="#0A84FF" 
                            xKey="date" 
                            yKey="weight"
                            unit="kg"
                        />
                    </View>

                    {/* Body Fat Chart */}
                    <View style={[styles.chartCard, { marginTop: 16 }]}>
                        <View style={styles.chartTitleRow}>
                            <Ionicons 
                                name="ellipse" 
                                size={12} 
                                color="#30D158" 
                                style={{ marginRight: 6 }} 
                            />
                            <Text style={styles.chartTitleText}>Body Fat %</Text>
                        </View>
                        <ProgressChart 
                            data={bfChartData} 
                            color="#30D158" 
                            xKey="created_at" 
                            yKey="body_fat_percentage"
                            unit="%"
                        />
                    </View>
                </View>

                {/* History List Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Logs</Text>
                    {sortedHistory.length > 0 ? (
                        <View style={styles.historyContainer}>
                            <FlatList
                                data={sortedHistory}
                                renderItem={renderHistoryItem}
                                keyExtractor={item => item.id.toString()}
                                scrollEnabled={false}
                            />
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="list-outline" size={48} color="#8E8E93" />
                            <Text style={styles.emptyText}>No logs recorded yet.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* ====================================================================
                MODALS
            ==================================================================== */}

            {/* Weight Input Modal */}
            <Modal 
                visible={modals.weight} 
                transparent 
                animationType="fade"
                onRequestClose={() => setModals(prev => ({ ...prev, weight: false }))}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Update Weight</Text>
                        <View style={styles.bigInputWrapper}>
                            <TextInput
                                style={styles.bigInput}
                                value={tempVal}
                                onChangeText={setTempVal}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#3A3A3C"
                                autoFocus
                            />
                            <Text style={styles.bigInputSuffix}>kg</Text>
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.btnCancel} 
                                onPress={() => setModals(prev => ({ ...prev, weight: false }))}
                            >
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.btnSave} 
                                onPress={handleSaveWeight} 
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={[styles.btnText, { color: '#FFF' }]}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Body Fat Calculator Modal */}
            <Modal 
                visible={modals.bodyFat} 
                animationType="slide" 
                presentationStyle="pageSheet"
                onRequestClose={() => setModals(prev => ({ ...prev, bodyFat: false }))}
            >
                <View style={styles.sheetContainer}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>Body Fat Calculator</Text>
                        <TouchableOpacity 
                            onPress={() => setModals(prev => ({ ...prev, bodyFat: false }))}
                        >
                            <Ionicons name="close-circle" size={30} color="#3A3A3C" />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView contentContainerStyle={styles.sheetContent}>
                        {/* Input Grid */}
                        <View style={styles.grid}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Weight (kg)</Text>
                                <TextInput 
                                    style={styles.sheetInput} 
                                    value={bfForm.weight} 
                                    onChangeText={t => setBfForm({ ...bfForm, weight: t })} 
                                    keyboardType="numeric" 
                                    placeholder="0"
                                    placeholderTextColor="#545458"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Waist (cm)</Text>
                                <TextInput 
                                    style={styles.sheetInput} 
                                    value={bfForm.waist} 
                                    onChangeText={t => setBfForm({ ...bfForm, waist: t })} 
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#545458" 
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Neck (cm)</Text>
                                <TextInput 
                                    style={styles.sheetInput} 
                                    value={bfForm.neck} 
                                    onChangeText={t => setBfForm({ ...bfForm, neck: t })} 
                                    keyboardType="numeric" 
                                    placeholder="0"
                                    placeholderTextColor="#545458"
                                />
                            </View>
                            {/* Hips input for women only */}
                            {isFemale && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Hips (cm)</Text>
                                    <TextInput 
                                        style={styles.sheetInput} 
                                        value={bfForm.hips} 
                                        onChangeText={t => setBfForm({ ...bfForm, hips: t })} 
                                        keyboardType="numeric" 
                                        placeholder="0"
                                        placeholderTextColor="#545458"
                                    />
                                </View>
                            )}
                        </View>

                        {/* Notes Input */}
                        <Text style={styles.inputLabel}>Notes (Optional)</Text>
                        <TextInput 
                            style={[styles.sheetInput, { marginBottom: 24 }]} 
                            value={bfForm.notes} 
                            onChangeText={t => setBfForm({ ...bfForm, notes: t })} 
                            placeholder="Morning check..."
                            placeholderTextColor="#545458"
                        />

                        {/* Preview Result Display */}
                        {previewResult && (
                            <View style={styles.resultBox}>
                                <Text style={styles.resultLabel}>ESTIMATED BODY FAT</Text>
                                <Text style={styles.resultValue}>
                                    {previewResult.body_fat_percentage.toFixed(1)}%
                                </Text>
                                <Text style={styles.resultMethod}>
                                    Method: {previewResult.method}
                                </Text>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.sheetActions}>
                            <TouchableOpacity 
                                style={[styles.sheetBtn, styles.sheetBtnOutline]} 
                                onPress={() => handleCalculateBodyFat(true)}
                                disabled={isProcessing}
                            >
                                <Text style={styles.sheetBtnTextOutline}>Preview</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.sheetBtn, styles.sheetBtnPrimary]} 
                                onPress={() => handleCalculateBodyFat(false)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.sheetBtnTextPrimary}>Save Log</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#000000' 
    },
    scrollContent: { 
        padding: 16 
    },

    // Weight Card
    weightCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        gap: 12,
    },
    weightCardContent: {
        flex: 1,
    },
    iconCircleBlue: { 
        width: 28, 
        height: 28, 
        borderRadius: 14, 
        backgroundColor: 'rgba(10,132,255,0.15)', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    statLabel: { 
        fontSize: 12, 
        color: '#8E8E93', 
        fontWeight: '500', 
        textTransform: 'uppercase', 
        marginBottom: 2 
    },
    statValue: { 
        fontSize: 22, 
        color: '#FFF', 
        fontWeight: '700' 
    },
    statUnit: { 
        fontSize: 14, 
        color: '#8E8E93', 
        fontWeight: '500' 
    },

    // Action Button
    calcButton: {
        flexDirection: 'row',
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#3A3A3C'
    },
    calcButtonText: { 
        color: '#FFF', 
        fontSize: 17, 
        fontWeight: '600' 
    },

    // Sections
    section: { 
        marginBottom: 32 
    },
    sectionTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        color: '#FFF', 
        marginBottom: 16 
    },
    
    // Charts
    chartCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        overflow: 'hidden',
    },
    chartTitleRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 4 
    },
    chartTitleText: { 
        fontSize: 14, 
        color: '#8E8E93', 
        fontWeight: '600' 
    },
    chartHeaderRow: { 
        marginBottom: 16 
    },
    chartValueBig: { 
        fontSize: 34, 
        fontWeight: '700' 
    },
    chartUnit: { 
        fontSize: 18, 
        color: '#8E8E93', 
        fontWeight: '500' 
    },
    emptyChart: { 
        height: 160, 
        alignItems: 'center', 
        justifyContent: 'center', 
        opacity: 0.5 
    },
    emptyChartText: { 
        color: '#8E8E93', 
        marginTop: 8 
    },

    // History List
    historyContainer: { 
        backgroundColor: '#1C1C1E', 
        borderRadius: 20, 
        overflow: 'hidden' 
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1C1C1E',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#3A3A3C',
    },
    historyRowLast: { 
        borderBottomWidth: 0 
    },
    historyLeft: { 
        gap: 4 
    },
    historyDate: { 
        color: '#FFF', 
        fontSize: 17, 
        fontWeight: '500' 
    },
    historyRight: { 
        flexDirection: 'row', 
        gap: 24 
    },
    historyStat: { 
        alignItems: 'flex-end' 
    },
    historyLabel: { 
        color: '#8E8E93', 
        fontSize: 12 
    },
    historyValue: { 
        color: '#FFF', 
        fontSize: 16, 
        fontWeight: '600' 
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    emptyText: { 
        color: '#8E8E93', 
        textAlign: 'center', 
        marginTop: 8,
        fontSize: 17
    },
    
    // Swipe Action
    deleteAction: { 
        backgroundColor: '#FF3B30', 
        width: 80, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },

    // Weight Modal
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        justifyContent: 'center', 
        padding: 20 
    },
    modalCard: { 
        backgroundColor: '#1C1C1E', 
        borderRadius: 24, 
        padding: 24, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#2C2C2E' 
    },
    modalTitle: { 
        color: '#FFF', 
        fontSize: 20, 
        fontWeight: '700', 
        marginBottom: 24 
    },
    bigInputWrapper: { 
        flexDirection: 'row', 
        alignItems: 'baseline', 
        marginBottom: 32 
    },
    bigInput: { 
        fontSize: 56, 
        fontWeight: '700', 
        color: '#FFF', 
        minWidth: 60, 
        textAlign: 'center' 
    },
    bigInputSuffix: { 
        fontSize: 24, 
        color: '#8E8E93', 
        fontWeight: '600', 
        marginLeft: 8 
    },
    modalActions: { 
        flexDirection: 'row', 
        gap: 12, 
        width: '100%' 
    },
    btnCancel: { 
        flex: 1, 
        backgroundColor: '#2C2C2E', 
        padding: 16, 
        borderRadius: 14, 
        alignItems: 'center' 
    },
    btnSave: { 
        flex: 1, 
        backgroundColor: '#0A84FF', 
        padding: 16, 
        borderRadius: 14, 
        alignItems: 'center' 
    },
    btnText: { 
        fontSize: 17, 
        fontWeight: '600', 
        color: '#8E8E93' 
    },

    // Body Fat Sheet Modal
    sheetContainer: { 
        flex: 1, 
        backgroundColor: '#1C1C1E' 
    },
    sheetHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: '#2C2C2E' 
    },
    sheetTitle: { 
        color: '#FFF', 
        fontSize: 20, 
        fontWeight: '700' 
    },
    sheetContent: { 
        padding: 20 
    },
    grid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        gap: 12, 
        marginBottom: 24 
    },
    inputGroup: { 
        width: '48%', 
        gap: 8 
    },
    inputLabel: { 
        color: '#8E8E93', 
        fontSize: 14, 
        fontWeight: '500' 
    },
    sheetInput: { 
        backgroundColor: '#2C2C2E', 
        color: '#FFF', 
        padding: 14, 
        borderRadius: 12, 
        fontSize: 17, 
        borderWidth: 1, 
        borderColor: '#3A3A3C' 
    },
    
    // Result Preview Box
    resultBox: { 
        backgroundColor: '#0A84FF', 
        borderRadius: 16, 
        padding: 20, 
        alignItems: 'center', 
        marginBottom: 24 
    },
    resultLabel: { 
        color: 'rgba(255,255,255,0.7)', 
        fontSize: 12, 
        fontWeight: '700', 
        letterSpacing: 1 
    },
    resultValue: { 
        color: '#FFF', 
        fontSize: 42, 
        fontWeight: '800', 
        marginVertical: 4 
    },
    resultMethod: { 
        color: 'rgba(255,255,255,0.8)', 
        fontSize: 13 
    },

    // Sheet Action Buttons
    sheetActions: { 
        flexDirection: 'row', 
        gap: 12, 
        marginBottom: 40 
    },
    sheetBtn: { 
        flex: 1, 
        padding: 16, 
        borderRadius: 14, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    sheetBtnOutline: { 
        borderWidth: 1, 
        borderColor: '#3A3A3C' 
    },
    sheetBtnPrimary: { 
        backgroundColor: '#0A84FF' 
    },
    sheetBtnTextOutline: { 
        color: '#0A84FF', 
        fontSize: 17, 
        fontWeight: '600' 
    },
    sheetBtnTextPrimary: { 
        color: '#FFF', 
        fontSize: 17, 
        fontWeight: '600' 
    },
});

import { calculateBodyFatMen, calculateBodyFatWomen, createMeasurement, getMeasurements } from '@/api/Measurements';
import { getAccount, getWeightHistory } from '@/api/account';
import { BodyMeasurement, WeightHistoryEntry } from '@/api/types';
import { theme, typographyStyles } from '@/constants/theme';
import { useUserStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Dimensions,
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
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 180;
const CHART_PADDING = 20;
const CHART_WIDTH = SCREEN_WIDTH - 48 - (CHART_PADDING * 2); // Card width minus padding

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Mini Trend Graph Component
 * Small graph for cards showing trend with glow effect
 */
const MiniTrendGraph = ({ data, color, width }: { data: number[]; color: string; width: number }) => {
    if (data.length < 2 || width <= 0) return null;
    
    const MINI_HEIGHT = 50;
    
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;
    const padding = range * 0.1;
    const effectiveMin = minVal - padding;
    const effectiveMax = maxVal + padding;
    const effectiveRange = effectiveMax - effectiveMin;

    const getCoordinates = (index: number, value: number) => {
        const x = (index / (data.length - 1)) * width;
        const y = MINI_HEIGHT - ((value - effectiveMin) / effectiveRange) * (MINI_HEIGHT - 10) - 5;
        return { x, y };
    };

    let pathD = `M ${getCoordinates(0, data[0]).x} ${getCoordinates(0, data[0]).y}`;
    for (let i = 1; i < data.length; i++) {
        const p0 = getCoordinates(i - 1, data[i - 1]);
        const p1 = getCoordinates(i, data[i]);
        // Simple curve
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        pathD += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const fillPathD = `${pathD} L ${width} ${MINI_HEIGHT} L 0 ${MINI_HEIGHT} Z`;

    return (
        <View style={{ width, height: MINI_HEIGHT, overflow: 'hidden' }}>
            <Svg width={width} height={MINI_HEIGHT}>
                <Defs>
                    <LinearGradient id={`glow-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={color} stopOpacity="0.5" />
                        <Stop offset="0.5" stopColor={color} stopOpacity="0.2" />
                        <Stop offset="1" stopColor={color} stopOpacity="0" />
                    </LinearGradient>
                </Defs>
                <Path d={fillPathD} fill={`url(#glow-${color})`} />
                
                {/* Outer Glow */}
                <Path 
                    d={pathD} 
                    stroke={color} 
                    strokeWidth="5" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    opacity="0.2"
                />

                {/* Main Line */}
                <Path 
                    d={pathD} 
                    stroke={color} 
                    strokeWidth="2.5" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />
            </Svg>
        </View>
    );
};

/**
 * Combined Neural Trend Chart Component
 * Shows both weight and body fat on same graph with curved lines
 */
const NeuralTrendChart = ({ weightData, bodyFatData }: { weightData: number[]; bodyFatData: number[] }) => {
    if (weightData.length < 2 && bodyFatData.length < 2) {
        return (
            <View style={styles.emptyChart}>
                <Ionicons name="stats-chart" size={32} color={theme.colors.text.secondary} />
                <Text style={styles.emptyChartText}>Not enough data to graph</Text>
            </View>
        );
    }

    // Normalize both datasets to 0-100 scale for comparison
    const normalizeData = (data: number[]) => {
        if (data.length < 2) return [];
        const maxVal = Math.max(...data);
        const minVal = Math.min(...data);
        const range = maxVal - minVal || 1;
        const padding = range * 0.1;
        const effectiveMin = minVal - padding;
        const effectiveMax = maxVal + padding;
        const effectiveRange = effectiveMax - effectiveMin;
        return data.map(val => ((val - effectiveMin) / effectiveRange) * 100);
    };

    const normalizedWeight = normalizeData(weightData);
    const normalizedBodyFat = normalizeData(bodyFatData);
    const maxLength = Math.max(normalizedWeight.length, normalizedBodyFat.length);

    const getCoordinates = (index: number, value: number) => {
        const x = (index / (maxLength - 1 || 1)) * CHART_WIDTH;
        const y = CHART_HEIGHT - (value / 100) * (CHART_HEIGHT - 20) - 10;
        return { x, y };
    };

    const generatePath = (data: number[]) => {
        if (data.length < 2) return '';
        let d = `M ${getCoordinates(0, data[0]).x} ${getCoordinates(0, data[0]).y}`;
        for (let i = 1; i < data.length; i++) {
            const p0 = getCoordinates(i - 1, data[i - 1]);
            const p1 = getCoordinates(i, data[i]);
            const cp1x = p0.x + (p1.x - p0.x) / 2;
            d += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        return d;
    };

    const weightPathD = generatePath(normalizedWeight);
    const bodyFatPathD = generatePath(normalizedBodyFat);

    return (
        <View style={{ height: CHART_HEIGHT, width: CHART_WIDTH }}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Defs>
                    <LinearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={theme.colors.text.brand} stopOpacity="0.4" />
                        <Stop offset="1" stopColor={theme.colors.text.brand} stopOpacity="0.0" />
                    </LinearGradient>
                    <LinearGradient id="bodyFatGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={theme.colors.status.rest} stopOpacity="0.4" />
                        <Stop offset="1" stopColor={theme.colors.status.rest} stopOpacity="0.0" />
                    </LinearGradient>
                </Defs>
                
                {/* Weight gradient fill */}
                {weightPathD && (
                    <Path 
                        d={`${weightPathD} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`} 
                        fill="url(#weightGradient)" 
                    />
                )}
                
                {/* Body fat gradient fill */}
                {bodyFatPathD && (
                    <Path 
                        d={`${bodyFatPathD} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`} 
                        fill="url(#bodyFatGradient)" 
                    />
                )}
                
                {/* Weight line with glow */}
                {weightPathD && (
                    <>
                        <Path d={weightPathD} stroke={theme.colors.text.brand} strokeWidth="6" fill="none" opacity="0.1" strokeLinecap="round" strokeLinejoin="round" />
                        <Path d={weightPathD} stroke={theme.colors.text.brand} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                )}
                
                {/* Body fat line with glow */}
                {bodyFatPathD && (
                    <>
                        <Path d={bodyFatPathD} stroke={theme.colors.status.rest} strokeWidth="6" fill="none" opacity="0.1" strokeLinecap="round" strokeLinejoin="round" />
                        <Path d={bodyFatPathD} stroke={theme.colors.status.rest} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                )}
            </Svg>
        </View>
    );
};

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
    
    // State
    const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
    const [weightHistory, setWeightHistory] = useState<WeightHistoryEntry[]>([]);
    const [currentWeight, setCurrentWeight] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Modals & Forms
    const [modals, setModals] = useState({ weight: false, bodyFat: false });
    const [tempVal, setTempVal] = useState('');
    const [bfForm, setBfForm] = useState({ weight: '', waist: '', neck: '', hips: '', notes: '' });
    const [previewResult, setPreviewResult] = useState<any>(null);

    // Derived Data
    const userHeight = user?.height;
    const isFemale = user?.gender === 'female';

    // Get latest Body Fat
    const latestBodyFat = useMemo(() => {
        if (measurements.length === 0) return null;
        return measurements
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.body_fat_percentage;
    }, [measurements]);

    // Graph Data Preparation (Needs to be Chronological: Old -> New)
    const weightGraphData = useMemo(() => {
        return weightHistory
            .slice(0, 10) 
            .reverse()
            .map(item => item.weight);
    }, [weightHistory]);

    const bodyFatGraphData = useMemo(() => {
        return measurements
            .filter(m => m.body_fat_percentage)
            .slice(0, 10)
            .reverse()
            .map(m => parseFloat(m.body_fat_percentage as any));
    }, [measurements]);

    // Mini trend data for cards (last 5-7 points)
    const weightMiniData = useMemo(() => {
        return weightHistory.slice(0, 7).reverse().map(item => item.weight);
    }, [weightHistory]);

    const bodyFatMiniData = useMemo(() => {
        return measurements
            .filter(m => m.body_fat_percentage)
            .slice(0, 7)
            .reverse()
            .map(m => parseFloat(m.body_fat_percentage as any));
    }, [measurements]);

    const bodyFatChange = useMemo(() => {
        if (measurements.length < 2) return { direction: null };
        const sorted = [...measurements].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const current = parseFloat(sorted[0]?.body_fat_percentage as any);
        const previous = parseFloat(sorted[1]?.body_fat_percentage as any);
        if (!current || !previous) return { direction: null };
        return {
            direction: current < previous ? 'down' : current > previous ? 'up' : 'stable'
        };
    }, [measurements]);

    // Card width for graphs
    const [cardWidth, setCardWidth] = useState(0);

    // List Data (Newest First)
    const sortedHistory = [...weightHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const weightChange = useMemo(() => {
        if (sortedHistory.length < 2) return { value: 0, direction: null };
        const current = sortedHistory[0]?.weight;
        const previous = sortedHistory[1]?.weight;
        if (!current || !previous) return { value: 0, direction: null };
        const change = current - previous;
        return {
            value: Math.abs(change),
            direction: change > 0 ? 'up' : change < 0 ? 'down' : null
        };
    }, [sortedHistory]);

    // Load Data
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

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

    // ... (Keep existing handlers: handleSaveWeight, handleCalculateBodyFat, handleDeleteEntry) ...
    // Note: I am omitting the handler implementations to keep the focus on the UI changes, 
    // insert your existing logic functions here.
    const openWeightModal = () => { setTempVal(currentWeight?.toString() || ''); setModals(prev => ({ ...prev, weight: true })); };
    const handleSaveWeight = async () => { /* Insert existing logic */ };
    const handleCalculateBodyFat = async (previewOnly = false) => {
        if (!userHeight) {
            Alert.alert("Height Required", "Please set height in account");
            return;
        }

        const weight = parseFloat(bfForm.weight);
        const waist = parseFloat(bfForm.waist);
        const neck = parseFloat(bfForm.neck);
        const hips = isFemale ? parseFloat(bfForm.hips) : undefined;

        if (!weight || !waist || !neck || (isFemale && !hips)) {
            Alert.alert("Missing Fields", "Please fill in all required measurements");
            return;
        }

        setIsProcessing(true);
        try {
            let result;
            if (isFemale) {
                result = await calculateBodyFatWomen({
                    height: userHeight,
                    weight: weight,
                    waist: waist,
                    neck: neck,
                    hips: hips!
                });
            } else {
                result = await calculateBodyFatMen({
                    height: userHeight,
                    weight: weight,
                    waist: waist,
                    neck: neck
                });
            }

            if (result.body_fat_percentage) {
                setPreviewResult(result);
                if (!previewOnly) {
                    // Save the measurement
                    await createMeasurement({
                        height: userHeight,
                        weight: weight,
                        waist: waist,
                        neck: neck,
                        hips: isFemale ? hips : undefined,
                        notes: bfForm.notes || undefined
                    });
                    await loadData();
                    setModals(prev => ({ ...prev, bodyFat: false }));
                    setBfForm({ weight: '', waist: '', neck: '', hips: '', notes: '' });
                    setPreviewResult(null);
                }
            } else {
                Alert.alert("Error", result.message || "Failed to calculate body fat");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to calculate body fat");
        } finally {
            setIsProcessing(false);
        }
    };
    const handleDeleteEntry = (entry: WeightHistoryEntry) => { /* Insert existing logic */ };
    const openBodyFatModal = () => { if (!userHeight) { Alert.alert("Height Required", "Please set height in account"); return; } setModals(prev => ({ ...prev, bodyFat: true })); if (currentWeight) setBfForm(prev => ({ ...prev, weight: currentWeight.toString() })); };


    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.mainTitle}>MEASUREMENTS</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={openWeightModal}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.cardsRow}>
                    <TouchableOpacity 
                        style={styles.biometricCard} 
                        onPress={openWeightModal} 
                        activeOpacity={0.8}
                        onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.cardHeaderLeft}>
                                <Ionicons name="scale-outline" size={16} color={theme.colors.text.brand} />
                                <Text style={styles.cardLabel}>WEIGHT</Text>
                            </View>
                            <Ionicons 
                                name={weightChange.direction === 'down' ? 'trending-down' : weightChange.direction === 'up' ? 'trending-up' : 'remove-outline'} 
                                size={18} 
                                color={weightChange.direction === 'down' ? theme.colors.status.success : weightChange.direction === 'up' ? theme.colors.status.error : theme.colors.text.tertiary}
                            />
                        </View>
                        <View style={styles.cardValueRow}>
                            <Text style={styles.cardValue}>{currentWeight ? currentWeight.toFixed(1) : '--'}</Text>
                            <Text style={styles.cardUnit}>KG</Text>
                        </View>
                        <View style={styles.cardGraphWrapper}>
                            <MiniTrendGraph data={weightMiniData} color={theme.colors.text.brand} width={cardWidth} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.biometricCard} 
                        onPress={openBodyFatModal} 
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.cardHeaderLeft}>
                                <Ionicons name="body-outline" size={16} color={theme.colors.status.rest} />
                                <Text style={styles.cardLabel}>BODY FAT</Text>
                            </View>
                            <Ionicons 
                                name={bodyFatChange.direction === 'stable' ? 'pulse' : bodyFatChange.direction === 'down' ? 'trending-down' : 'trending-up'} 
                                size={18} 
                                color={theme.colors.status.rest}
                            />
                        </View>
                        <View style={styles.cardValueRow}>
                            <Text style={styles.cardValue}>{latestBodyFat ? parseFloat(latestBodyFat.toString()).toFixed(1) : '--'}</Text>
                            <Text style={styles.cardUnit}>%</Text>
                        </View>
                        <View style={styles.cardGraphWrapper}>
                            <MiniTrendGraph data={bodyFatMiniData} color={theme.colors.status.rest} width={cardWidth} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.neuralTrendSection}>
                    <View style={styles.graphCard}>
                    <View style={styles.neuralTrendHeader}>
                        <View style={styles.neuralTrendHeaderMain}>
                            <View style={styles.neuralTrendIconContainer}>
                                <Ionicons name="stats-chart" size={20} color={theme.colors.text.brand} />
                            </View>
                            <View>
                                <Text style={styles.neuralTrendTitle}>NEURAL TREND</Text>
                                <Text style={styles.neuralTrendSubtitle}>SOMATIC PROGRESS GRAPH</Text>
                            </View>
                        </View>
                        <View style={styles.legendContainer}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: theme.colors.text.brand }]} />
                                <Text style={styles.legendText}>MASS</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: theme.colors.status.rest }]} />
                                <Text style={styles.legendText}>FAT %</Text>
                            </View>
                        </View>
                    </View>
                        <NeuralTrendChart 
                            weightData={weightGraphData} 
                            bodyFatData={bodyFatGraphData}
                        />
                    </View>
                </View>

                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historySectionTitle}> HISTORY</Text>
                        <TouchableOpacity>
                            <Ionicons name="refresh" size={16} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                    {sortedHistory.length > 0 ? (
                        <View style={styles.historyContainer}>
                            {sortedHistory.map((item) => (
                                <ReanimatedSwipeable
                                    key={item.id}
                                    renderRightActions={(p) => <SwipeAction progress={p} onPress={() => handleDeleteEntry(item)} />}
                                    friction={2}
                                >
                                    <TouchableOpacity style={styles.historyCard} activeOpacity={0.7}>
                                        <View style={styles.historyContent}>
                                            <Text style={styles.historyDate}>
                                                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                            </Text>
                                            <View style={styles.historyMetricsContainer}>
                                                <View style={styles.historyMetric}>
                                                    <Text style={styles.historyValue}>{item.weight}</Text>
                                                    <Text style={styles.historyUnit}>KG</Text>
                                                </View>
                                                
                                                <View style={styles.historySeparator} />

                                                <View style={styles.historyMetric}>
                                                    <Text style={styles.historyBfValue}>
                                                        {item.bodyfat ? parseFloat(item.bodyfat.toString()).toFixed(1) : '--.-'}
                                                    </Text>
                                                    <Text style={styles.historyBfUnit}>%</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                                    </TouchableOpacity>
                                </ReanimatedSwipeable>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="list" size={48} color={theme.colors.text.secondary} />
                            <Text style={styles.emptyText}>No logs recorded yet.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal visible={modals.weight} transparent animationType="fade">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Update Weight</Text>
                        <View style={styles.bigInputWrapper}>
                            <TextInput style={styles.bigInput} value={tempVal} onChangeText={setTempVal} keyboardType="numeric" autoFocus placeholderTextColor={theme.colors.text.secondary} />
                            <Text style={styles.bigInputSuffix}>kg</Text>
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => setModals(prev => ({ ...prev, weight: false }))}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={handleSaveWeight}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            
             <Modal visible={modals.bodyFat} animationType="slide" presentationStyle="pageSheet">
                 <View style={styles.sheetContainer}>
                     <View style={styles.sheetContent}>
                         <View style={styles.sheetHeader}>
                             <View>
                                <Text style={styles.sheetTitle}>BODY FAT</Text>
                                <Text style={styles.sheetSubtitle}>CALCULATE YOUR PERCENTAGE</Text>
                             </View>
                             <TouchableOpacity 
                                style={styles.closeButton}
                                onPress={() => {
                                    setModals(p => ({...p, bodyFat: false}));
                                    setBfForm({ weight: '', waist: '', neck: '', hips: '', notes: '' });
                                    setPreviewResult(null);
                                }}
                             >
                                 <Ionicons name="close" size={20} color={theme.colors.text.primary} />
                             </TouchableOpacity>
                         </View>

                         <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                             {previewResult ? (
                                 <View style={styles.previewContainer}>
                                     <Text style={styles.previewTitle}>ESTIMATED BODY FAT</Text>
                                     <View style={styles.previewValueContainer}>
                                         <Text style={styles.previewValue}>{previewResult.body_fat_percentage.toFixed(1)}</Text>
                                         <Text style={styles.previewUnit}>%</Text>
                                     </View>
                                     <Text style={styles.previewMethod}>US NAVY METHOD: {previewResult.method.toUpperCase()}</Text>
                                 </View>
                             ) : null}

                             <View style={styles.inputGrid}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>WEIGHT (KG)</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="scale-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            value={bfForm.weight}
                                            onChangeText={(text) => setBfForm(prev => ({ ...prev, weight: text }))}
                                            keyboardType="numeric"
                                            placeholder="00.0"
                                            placeholderTextColor={theme.colors.text.tertiary}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>WAIST (CM)</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="resize-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            value={bfForm.waist}
                                            onChangeText={(text) => setBfForm(prev => ({ ...prev, waist: text }))}
                                            keyboardType="numeric"
                                            placeholder="00"
                                            placeholderTextColor={theme.colors.text.tertiary}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>NECK (CM)</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="shirt-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            value={bfForm.neck}
                                            onChangeText={(text) => setBfForm(prev => ({ ...prev, neck: text }))}
                                            keyboardType="numeric"
                                            placeholder="00"
                                            placeholderTextColor={theme.colors.text.tertiary}
                                        />
                                    </View>
                                </View>

                                {isFemale && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>HIPS (CM)</Text>
                                        <View style={styles.inputWrapper}>
                                            <Ionicons name="body-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                value={bfForm.hips}
                                                onChangeText={(text) => setBfForm(prev => ({ ...prev, hips: text }))}
                                                keyboardType="numeric"
                                                placeholder="00"
                                                placeholderTextColor={theme.colors.text.tertiary}
                                            />
                                        </View>
                                    </View>
                                )}
                             </View>

                             <View style={styles.inputGroup}>
                                 <Text style={styles.inputLabel}>NOTES</Text>
                                 <TextInput
                                     style={[styles.input, styles.textArea]}
                                     value={bfForm.notes}
                                     onChangeText={(text) => setBfForm(prev => ({ ...prev, notes: text }))}
                                     placeholder="OPTIONAL PROGRESS NOTES..."
                                     placeholderTextColor={theme.colors.text.tertiary}
                                     multiline
                                     numberOfLines={3}
                                 />
                             </View>

                             <View style={styles.sheetActions}>
                                 {previewResult ? (
                                     <>
                                         <TouchableOpacity 
                                             style={styles.btnSecondary} 
                                             onPress={() => setPreviewResult(null)}
                                         >
                                             <Text style={styles.btnText}>BACK</Text>
                                         </TouchableOpacity>
                                         <TouchableOpacity 
                                             style={styles.btnPrimary} 
                                             onPress={() => handleCalculateBodyFat(false)}
                                             disabled={isProcessing}
                                         >
                                             <Text style={styles.btnTextPrimary}>
                                                 {isProcessing ? 'SAVING...' : 'CONFIRM & SAVE'}
                                             </Text>
                                         </TouchableOpacity>
                                     </>
                                 ) : (
                                     <TouchableOpacity 
                                         style={styles.btnPrimary} 
                                         onPress={() => handleCalculateBodyFat(true)}
                                         disabled={isProcessing}
                                     >
                                         <Text style={styles.btnTextPrimary}>
                                             {isProcessing ? 'CALCULATING...' : 'CALCULATE PROGRESS'}
                                         </Text>
                                     </TouchableOpacity>
                                 )}
                             </View>
                         </ScrollView>
                     </View>
                 </View>
            </Modal>

        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { padding: theme.spacing.m },

    // Headers
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xl },
    headerLeft: { flex: 1 },
    mainTitle: { ...typographyStyles.h3, marginBottom: theme.spacing.xs },
    addButton: { 
        
        width: 40, height: 40, borderRadius: theme.borderRadius.l, 
        backgroundColor: theme.colors.status.rest, alignItems: 'center', justifyContent: 'center' },


    // Cards    
    cardsRow: { flexDirection: 'row', gap: theme.spacing.m, marginBottom: theme.spacing.xl },
    biometricCard: { 
        flex: 1, 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: theme.borderRadius.xl, 
        paddingTop: theme.spacing.m,
        paddingHorizontal: 0, 
        borderWidth: 1, 
        borderColor: theme.colors.ui.border,
        overflow: 'hidden'
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: theme.spacing.m,
        marginBottom: theme.spacing.m 
    },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    cardLabel: { ...typographyStyles.labelTight, color: theme.colors.text.secondary, letterSpacing: 1 },
    cardValueRow: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: theme.spacing.m, marginBottom: theme.spacing.s },
    cardValue: { ...typographyStyles.h2, color: '#FFFFFF', fontWeight: '900', fontSize: 38 },
    cardUnit: { ...typographyStyles.labelTight, color: theme.colors.text.tertiary, marginLeft: 4, fontWeight: '900', fontSize: 14, opacity: 0.5 },
    cardGraphWrapper: { marginTop: 'auto', width: '100%', bottom: -5 }, 

    // Neural Trend Section
    neuralTrendSection: { marginBottom: theme.spacing.xl },
    neuralTrendHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: theme.spacing.l 
    },
    neuralTrendHeaderMain: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
    neuralTrendIconContainer: { 
        width: 44, 
        height: 44, 
        borderRadius: 14, 
        backgroundColor: 'rgba(99, 102, 241, 0.1)', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)'
    },
    neuralTrendTitle: { 
        fontSize: 16, 
        fontWeight: '900', 
        color: '#FFFFFF', 
        textTransform: 'uppercase', 
        letterSpacing: 0.5 
    },
    neuralTrendSubtitle: { 
        fontSize: 10, 
        fontWeight: '700', 
        color: theme.colors.text.tertiary, 
        textTransform: 'uppercase', 
        letterSpacing: 1 
    },
    legendContainer: { flexDirection: 'row', gap: theme.spacing.m, marginTop: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, fontWeight: '800', color: theme.colors.text.secondary, textTransform: 'uppercase' },
    graphCard: { 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: 40, 
        padding: 24, 
        borderWidth: 1, 
        borderColor: theme.colors.ui.border, 
        overflow: 'hidden' 
    },
    emptyChart: { height: 180, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
    emptyChartText: { color: theme.colors.text.secondary, marginTop: 8, fontSize: 12 },

    // History
    historySection: { marginTop: theme.spacing.m },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.m },
    historySectionTitle: { ...typographyStyles.labelMuted },
    historyContainer: { gap: theme.spacing.m },
    historyCard: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: theme.colors.ui.glass, 
        borderRadius: 35, 
        padding: 24, 
        borderWidth: 1, 
        borderColor: theme.colors.ui.border 
    },
    historyContent: { flex: 1 },
    historyDate: { 
        fontSize: 11,
        fontWeight: '800',
        color: theme.colors.text.tertiary, 
        marginBottom: 12,
        letterSpacing: 1
    },
    historyMetricsContainer: { flexDirection: 'row', alignItems: 'center' },
    historyMetric: { flexDirection: 'row', alignItems: 'baseline' },
    historySeparator: { 
        width: 1, 
        height: 24, 
        backgroundColor: theme.colors.ui.border, 
        marginHorizontal: 20,
        opacity: 0.5
    },
    historyValue: { 
        fontSize: 28,
        color: theme.colors.text.primary,
        fontWeight: '900',
        fontStyle: 'italic'
    },
    historyUnit: { 
        fontSize: 12,
        color: theme.colors.text.tertiary, 
        marginLeft: 4,
        fontWeight: '900'
    },
    historyBfValue: { 
        fontSize: 28,
        color: theme.colors.status.rest,
        fontWeight: '900',
        fontStyle: 'italic'
    },
    historyBfUnit: { 
        fontSize: 12,
        color: theme.colors.status.rest, 
        marginLeft: 4,
        fontWeight: '900',
        opacity: 0.7
    },
    
    // Utilities
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
    emptyText: { color: theme.colors.text.secondary, marginTop: 8 },
    deleteAction: { backgroundColor: theme.colors.status.error, width: 80, alignItems: 'center', justifyContent: 'center' },
    
    // Modal Styles (Kept consistent)
    modalOverlay: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', padding: theme.spacing.l },
        modalCard: { backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.xl, padding: theme.spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.ui.border },
        modalTitle: { ...typographyStyles.h4, color: theme.colors.text.primary, marginBottom: theme.spacing.l },
    bigInputWrapper: { flexDirection: 'row', alignItems: 'baseline', marginBottom: theme.spacing.xl },
    bigInput: { ...typographyStyles.h3, color: theme.colors.status.rest, minWidth: 60, textAlign: 'center' },
    bigInputSuffix: { ...typographyStyles.labelTight, color: theme.colors.text.secondary, marginLeft: 8 },
    modalActions: { flexDirection: 'row', gap: theme.spacing.m, width: '100%' },
    btnCancel: { flex: 1, backgroundColor: theme.colors.ui.border, padding: theme.spacing.m, borderRadius: theme.borderRadius.xl, alignItems: 'center' },
    btnSave: { flex: 1, backgroundColor: theme.colors.status.rest, padding: theme.spacing.m, borderRadius: theme.borderRadius.xl, alignItems: 'center' },
    btnText: { ...typographyStyles.labelTight, color: theme.colors.text.primary },
     sheetContainer: { flex: 1, backgroundColor: theme.colors.background },
     sheetContent: { flex: 1, paddingTop: Platform.OS === 'ios' ? 20 : 20 },
     sheetHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        paddingVertical: 20,
        borderBottomWidth: 1, 
        borderBottomColor: theme.colors.ui.border 
    },
     sheetTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text.primary, letterSpacing: 0.5 },
     sheetSubtitle: { fontSize: 10, fontWeight: '700', color: theme.colors.text.tertiary, letterSpacing: 1 },
     closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center'
     },
     sheetScroll: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
     inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 8 },
     inputGroup: { marginBottom: 24, flexBasis: '47%', flexGrow: 1 },
     inputLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.text.tertiary, marginBottom: 8, letterSpacing: 1 },
     inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        borderRadius: 16,
        paddingHorizontal: 12,
     },
     inputIcon: { marginRight: 8 },
     input: { 
        flex: 1,
        height: 48,
        color: theme.colors.text.primary, 
        fontSize: 16,
        fontWeight: '600'
    },
     textArea: { minHeight: 100, textAlignVertical: 'top', paddingTop: 12, flexBasis: '100%' },
     sheetActions: { flexDirection: 'row', gap: 16, marginTop: 12, marginBottom: 40 },
     btnPrimary: { 
        flex: 2,
        backgroundColor: theme.colors.status.rest, 
        height: 56, 
        borderRadius: 18, 
        alignItems: 'center', 
        justifyContent: 'center',
        shadowColor: theme.colors.status.rest,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
     btnSecondary: { 
        flex: 1,
        backgroundColor: theme.colors.ui.glass, 
        height: 56, 
        borderRadius: 18, 
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center', 
        justifyContent: 'center' 
    },
     btnTextPrimary: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
     previewContainer: { 
        backgroundColor: 'rgba(99, 102, 241, 0.05)', 
        borderRadius: 24, 
        padding: 24, 
        marginBottom: 32, 
        borderWidth: 1, 
        borderColor: 'rgba(99, 102, 241, 0.2)', 
        alignItems: 'center' 
    },
     previewTitle: { fontSize: 10, fontWeight: '800', color: theme.colors.text.tertiary, marginBottom: 12, letterSpacing: 1 },
     previewValueContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
     previewValue: { fontSize: 48, fontWeight: '900', color: theme.colors.status.rest, fontStyle: 'italic' },
     previewUnit: { fontSize: 20, fontWeight: '900', color: theme.colors.status.rest, marginLeft: 4, opacity: 0.6 },
     previewMethod: { fontSize: 9, fontWeight: '700', color: theme.colors.text.tertiary, letterSpacing: 0.5 },
});
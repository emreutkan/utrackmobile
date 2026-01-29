import { calculateBodyFatMen, calculateBodyFatWomen, createMeasurement, getMeasurements } from '@/api/Measurements';
import { getAccount, getWeightHistory } from '@/api/account';
import { BodyMeasurement, WeightHistoryEntry } from '@/api/types';
import { extractResults } from '@/api/types/pagination';
import { SwipeAction } from '@/components/SwipeAction';
import { theme, typographyStyles, commonStyles } from '@/constants/theme';
import { useUserStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState, useEffect } from 'react';
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
    View,
    Share
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
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
                <Path d={pathD} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
        </View>
    );
};

/**
 * Combined Neural Trend Chart Component
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
                {weightPathD && <Path d={`${weightPathD} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`} fill="url(#weightGradient)" />}
                {bodyFatPathD && <Path d={`${bodyFatPathD} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`} fill="url(#bodyFatGradient)" />}
                {weightPathD && (
                    <>
                        <Path d={weightPathD} stroke={theme.colors.text.brand} strokeWidth="6" fill="none" opacity="0.1" strokeLinecap="round" strokeLinejoin="round" />
                        <Path d={weightPathD} stroke={theme.colors.text.brand} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                )}
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

// ============================================================================
// MAIN SCREEN COMPONENT
// ============================================================================

export default function MeasurementsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useUserStore();
    
    // UI Navigation
    const [activeTab, setActiveTab] = useState<'biometrics' | 'calculator'>('biometrics');

    // Biometrics State
    const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
    const [weightHistory, setWeightHistory] = useState<WeightHistoryEntry[]>([]);
    const [currentWeight, setCurrentWeight] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // 1RM Calculator State
    const [calcWeight, setCalcWeight] = useState('');
    const [calcReps, setCalcReps] = useState('');
    const [calculatedMax, setCalculatedMax] = useState<number | null>(null);

    // Modals & Forms
    const [modals, setModals] = useState({ weight: false, bodyFat: false });
    const [tempVal, setTempVal] = useState('');
    const [bfForm, setBfForm] = useState({ weight: '', waist: '', neck: '', hips: '', notes: '' });
    const [previewResult, setPreviewResult] = useState<any>(null);

    const isFemale = user?.gender === 'female';
    const userHeight = user?.height;

    // Derived Data for Biometrics
    const latestBodyFat = useMemo(() => {
        if (measurements.length === 0) return null;
        return measurements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.body_fat_percentage;
    }, [measurements]);

    const weightGraphData = useMemo(() => weightHistory.slice(0, 10).reverse().map(item => item.weight), [weightHistory]);
    const bodyFatGraphData = useMemo(() => measurements.filter(m => m.body_fat_percentage).slice(0, 10).reverse().map(m => parseFloat(m.body_fat_percentage as any)), [measurements]);
    const weightMiniData = useMemo(() => weightHistory.slice(0, 7).reverse().map(item => item.weight), [weightHistory]);
    const bodyFatMiniData = useMemo(() => measurements.filter(m => m.body_fat_percentage).slice(0, 7).reverse().map(m => parseFloat(m.body_fat_percentage as any)), [measurements]);

    const [cardWidth, setCardWidth] = useState(0);

    const sortedHistory = useMemo(() => [...weightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [weightHistory]);

    // Load Data
    useFocusEffect(useCallback(() => { loadData(); }, []));

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [measData, weightData, accountData] = await Promise.all([getMeasurements(), getWeightHistory(), getAccount()]);
            const measurementResults = extractResults(measData);
            setMeasurements(measurementResults);
            if (weightData?.results) setWeightHistory(weightData.results);
            if (accountData?.weight) setCurrentWeight(accountData.weight);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 1RM Calculation Logic
    useEffect(() => {
        const w = parseFloat(calcWeight);
        const r = parseInt(calcReps);
        if (w > 0 && r > 0) {
            // Brzycki Formula: w * (36 / (37 - r))
            if (r === 1) setCalculatedMax(w);
            else if (r >= 37) setCalculatedMax(null); // Formula breaks down
            else setCalculatedMax(w * (36 / (37 - r)));
        } else {
            setCalculatedMax(null);
        }
    }, [calcWeight, calcReps]);

    const handleShareMax = () => {
        if (!calculatedMax) return;
        Share.share({
            message: `My estimated 1-Rep Max is ${calculatedMax.toFixed(1)}kg! Calculated with FORCE.`,
        });
    };

    const openWeightModal = () => { setTempVal(currentWeight?.toString() || ''); setModals(prev => ({ ...prev, weight: true })); };
    const handleSaveWeight = async () => { /* Logic */ };
    const handleCalculateBodyFat = async (previewOnly = false) => {
        if (!userHeight) { Alert.alert("Height Required", "Please set height in account"); return; }
        const weight = parseFloat(bfForm.weight);
        const waist = parseFloat(bfForm.waist);
        const neck = parseFloat(bfForm.neck);
        const hips = isFemale ? parseFloat(bfForm.hips) : undefined;
        if (!weight || !waist || !neck || (isFemale && !hips)) { Alert.alert("Missing Fields", "Please fill in all required measurements"); return; }
        setIsProcessing(true);
        try {
            let result = isFemale 
                ? await calculateBodyFatWomen({ height: userHeight, weight, waist, neck, hips: hips! })
                : await calculateBodyFatMen({ height: userHeight, weight, waist, neck });
            if (result.body_fat_percentage) {
                setPreviewResult(result);
                if (!previewOnly) {
                    await createMeasurement({ height: userHeight, weight, waist, neck, hips: isFemale ? hips : undefined, notes: bfForm.notes || undefined });
                    await loadData();
                    setModals(prev => ({ ...prev, bodyFat: false }));
                    setBfForm({ weight: '', waist: '', neck: '', hips: '', notes: '' });
                    setPreviewResult(null);
                }
            } else { Alert.alert("Error", result.message || "Failed to calculate body fat"); }
        } catch (error: any) { Alert.alert("Error", error.message || "Failed to calculate body fat"); }
        finally { setIsProcessing(false); }
    };
    const openBodyFatModal = () => { if (!userHeight) { Alert.alert("Height Required", "Please set height in account"); return; } setModals(prev => ({ ...prev, bodyFat: true })); if (currentWeight) setBfForm(prev => ({ ...prev, weight: currentWeight.toString() })); };

    const renderBiometrics = () => (
        <>
            <View style={styles.cardsRow}>
                <TouchableOpacity style={styles.biometricCard} onPress={openWeightModal} activeOpacity={0.8} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}><Ionicons name="scale-outline" size={16} color={theme.colors.text.brand} /><Text style={styles.cardLabel}>WEIGHT</Text></View>
                        <Ionicons name="remove-outline" size={18} color={theme.colors.text.tertiary} />
                    </View>
                    <View style={styles.cardValueRow}><Text style={styles.cardValue}>{currentWeight ? currentWeight.toFixed(1) : '--'}</Text><Text style={styles.cardUnit}>KG</Text></View>
                    <View style={styles.cardGraphWrapper}><MiniTrendGraph data={weightMiniData} color={theme.colors.text.brand} width={cardWidth} /></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.biometricCard} onPress={openBodyFatModal} activeOpacity={0.8}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}><Ionicons name="body-outline" size={16} color={theme.colors.status.rest} /><Text style={styles.cardLabel}>BODY FAT</Text></View>
                        <Ionicons name="pulse" size={18} color={theme.colors.status.rest} />
                    </View>
                    <View style={styles.cardValueRow}><Text style={styles.cardValue}>{latestBodyFat ? parseFloat(latestBodyFat.toString()).toFixed(1) : '--'}</Text><Text style={styles.cardUnit}>%</Text></View>
                    <View style={styles.cardGraphWrapper}><MiniTrendGraph data={bodyFatMiniData} color={theme.colors.status.rest} width={cardWidth} /></View>
                </TouchableOpacity>
            </View>

            <View style={styles.neuralTrendSection}>
                <View style={styles.graphCard}>
                    <View style={styles.neuralTrendHeader}>
                        <View style={styles.neuralTrendHeaderMain}>
                            <View style={styles.neuralTrendIconContainer}><Ionicons name="stats-chart" size={20} color={theme.colors.text.brand} /></View>
                            <View><Text style={styles.neuralTrendTitle}>NEURAL TREND</Text><Text style={styles.neuralTrendSubtitle}>SOMATIC PROGRESS GRAPH</Text></View>
                        </View>
                        <View style={styles.legendContainer}>
                            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: theme.colors.text.brand }]} /><Text style={styles.legendText}>MASS</Text></View>
                            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: theme.colors.status.rest }]} /><Text style={styles.legendText}>FAT %</Text></View>
                        </View>
                    </View>
                    <NeuralTrendChart weightData={weightGraphData} bodyFatData={bodyFatGraphData} />
                </View>
            </View>

            <View style={styles.historySection}>
                <View style={styles.historyHeader}><Text style={styles.historySectionTitle}>HISTORY</Text><TouchableOpacity onPress={loadData}><Ionicons name="refresh" size={16} color={theme.colors.text.secondary} /></TouchableOpacity></View>
                {sortedHistory.length > 0 ? (
                    <View style={styles.historyContainer}>
                        {sortedHistory.map((item) => (
                            <TouchableOpacity key={item.id} style={styles.historyCard} activeOpacity={0.7}>
                                <View style={styles.historyContent}>
                                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</Text>
                                    <View style={styles.historyMetricsContainer}>
                                        <View style={styles.historyMetric}><Text style={styles.historyValue}>{item.weight}</Text><Text style={styles.historyUnit}>KG</Text></View>
                                        <View style={styles.historySeparator} />
                                        <View style={styles.historyMetric}><Text style={styles.historyBfValue}>{item.bodyfat ? parseFloat(item.bodyfat.toString()).toFixed(1) : '--.-'}</Text><Text style={styles.historyBfUnit}>%</Text></View>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}><Ionicons name="list" size={48} color={theme.colors.text.secondary} /><Text style={styles.emptyText}>No logs recorded yet.</Text></View>
                )}
            </View>
        </>
    );

    const renderCalculator = () => (
        <View style={styles.calcContainer}>
            <View style={styles.calcCard}>
                <View style={styles.sectionHeader}>
                    <View style={styles.neuralTrendIconContainer}><Ionicons name="calculator" size={20} color={theme.colors.text.brand} /></View>
                    <View><Text style={styles.neuralTrendTitle}>1RM CALCULATOR</Text><Text style={styles.neuralTrendSubtitle}>BRZYCKI METHOD</Text></View>
                </View>

                <View style={styles.inputStack}>
                    <View style={styles.inputGroupFull}>
                        <Text style={styles.inputLabel}>WEIGHT LIFTED</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="barbell-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                            <TextInput style={styles.input} value={calcWeight} onChangeText={setCalcWeight} keyboardType="numeric" placeholder="000.0" placeholderTextColor={theme.colors.text.tertiary} />
                            <Text style={styles.inputSuffix}>KG</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroupFull}>
                        <Text style={styles.inputLabel}>REPETITIONS</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="repeat-outline" size={18} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                            <TextInput style={styles.input} value={calcReps} onChangeText={setCalcReps} keyboardType="numeric" placeholder="00" placeholderTextColor={theme.colors.text.tertiary} />
                            <Text style={styles.inputSuffix}>REPS</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.resultContainer}>
                    <View style={styles.resultHeader}>
                        <Text style={styles.resultLabel}>ESTIMATED 1-REP MAX</Text>
                    </View>
                    <View style={styles.resultValueRow}>
                        <Text style={[styles.resultValue, !calculatedMax && { color: theme.colors.text.tertiary, opacity: 0.3 }]}>
                            {calculatedMax ? calculatedMax.toFixed(1) : '000.0'}
                        </Text>
                        <Text style={styles.resultUnit}>KG</Text>
                    </View>
                    {calculatedMax && (
                        <TouchableOpacity style={styles.shareBtn} onPress={handleShareMax}>
                            <Ionicons name="share-outline" size={16} color={theme.colors.text.brand} />
                            <Text style={styles.shareBtnText}>SHARE PERFORMANCE</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {calculatedMax && (
                <View style={styles.percentageCard}>
                    <Text style={styles.sectionTitle}>PERCENTAGE BREAKDOWN</Text>
                    <View style={styles.percentageGrid}>
                        {[95, 90, 85, 80, 75, 70].map((pct) => (
                            <View key={pct} style={styles.pctItem}>
                                <Text style={styles.pctLabel}>{pct}%</Text>
                                <Text style={styles.pctValue}>{(calculatedMax * (pct/100)).toFixed(1)}<Text style={styles.pctUnit}>kg</Text></Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.text.tertiary} />
                <Text style={styles.infoText}>
                    The Brzycki formula is most accurate for reps under 10. For higher rep counts, calculations are estimates only.
                </Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ExpoLinearGradient colors={['rgba(99, 101, 241, 0.13)', 'transparent']} style={styles.gradientBg} />
            
            <View style={styles.tabHeader}>
                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'biometrics' && styles.tabItemActive]} 
                    onPress={() => setActiveTab('biometrics')}
                >
                    <Text style={[styles.tabText, activeTab === 'biometrics' && styles.tabTextActive]}>BIOMETRICS</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'calculator' && styles.tabItemActive]} 
                    onPress={() => setActiveTab('calculator')}
                >
                    <Text style={[styles.tabText, activeTab === 'calculator' && styles.tabTextActive]}>1RM CALC</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {activeTab === 'biometrics' ? renderBiometrics() : renderCalculator()}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    scrollContent: { padding: theme.spacing.m },

    // Tabs
    tabHeader: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, gap: 10 },
    tabItem: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: theme.colors.ui.glass, borderWidth: 1, borderColor: theme.colors.ui.border },
    tabItemActive: { backgroundColor: theme.colors.text.brand, borderColor: theme.colors.text.brand },
    tabText: { fontSize: 11, fontWeight: '900', color: theme.colors.text.secondary, letterSpacing: 0.5 },
    tabTextActive: { color: '#FFF' },

    // Biometrics specific
    cardsRow: { flexDirection: 'row', gap: theme.spacing.m, marginBottom: theme.spacing.xl, marginTop: 10 },
    biometricCard: { flex: 1, backgroundColor: theme.colors.ui.glass, borderRadius: theme.borderRadius.xl, paddingTop: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.ui.border, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.m, marginBottom: theme.spacing.m },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    cardLabel: { ...typographyStyles.labelTight, color: theme.colors.text.secondary, letterSpacing: 1 },
    cardValueRow: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: theme.spacing.m, marginBottom: theme.spacing.s },
    cardValue: { ...typographyStyles.h2, color: '#FFFFFF', fontWeight: '900', fontSize: 38 },
    cardUnit: { ...typographyStyles.labelTight, color: theme.colors.text.tertiary, marginLeft: 4, fontWeight: '900', fontSize: 14, opacity: 0.5 },
    cardGraphWrapper: { marginTop: 'auto', width: '100%', bottom: -5 }, 

    neuralTrendSection: { marginBottom: theme.spacing.xl },
    neuralTrendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.l },
    neuralTrendHeaderMain: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
    neuralTrendIconContainer: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(99, 102, 241, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.2)' },
    neuralTrendTitle: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5 },
    neuralTrendSubtitle: { fontSize: 10, fontWeight: '700', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 1 },
    legendContainer: { flexDirection: 'row', gap: theme.spacing.m, marginTop: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, fontWeight: '800', color: theme.colors.text.secondary, textTransform: 'uppercase' },
    graphCard: { backgroundColor: theme.colors.ui.glass, borderRadius: 40, padding: 24, borderWidth: 1, borderColor: theme.colors.ui.border, overflow: 'hidden' },
    emptyChart: { height: 180, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
    emptyChartText: { color: theme.colors.text.secondary, marginTop: 8, fontSize: 12 },

    historySection: { marginTop: theme.spacing.m },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.m },
    historySectionTitle: { ...typographyStyles.labelMuted },
    historyContainer: { gap: theme.spacing.m },
    historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.ui.glass, borderRadius: 35, padding: 24, borderWidth: 1, borderColor: theme.colors.ui.border },
    historyContent: { flex: 1 },
    historyDate: { fontSize: 11, fontWeight: '800', color: theme.colors.text.tertiary, marginBottom: 12, letterSpacing: 1 },
    historyMetricsContainer: { flexDirection: 'row', alignItems: 'center' },
    historyMetric: { flexDirection: 'row', alignItems: 'baseline' },
    historySeparator: { width: 1, height: 24, backgroundColor: theme.colors.ui.border, marginHorizontal: 20, opacity: 0.5 },
    historyValue: { fontSize: 28, color: theme.colors.text.primary, fontWeight: '900', fontStyle: 'italic' },
    historyUnit: { fontSize: 12, color: theme.colors.text.tertiary, marginLeft: 4, fontWeight: '900' },
    historyBfValue: { fontSize: 28, color: theme.colors.status.rest, fontWeight: '900', fontStyle: 'italic' },
    historyBfUnit: { fontSize: 12, color: theme.colors.status.rest, marginLeft: 4, fontWeight: '900', opacity: 0.7 },
    
    // Calculator specific
    calcContainer: { marginTop: 10 },
    calcCard: { ...commonStyles.glassPanel, padding: 24, borderRadius: 40 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    inputStack: { gap: 20, marginBottom: 30 },
    inputGroupFull: { width: '100%' },
    inputLabel: { fontSize: 10, fontWeight: '800', color: theme.colors.text.tertiary, marginBottom: 8, letterSpacing: 1 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.ui.border, borderRadius: 16, paddingHorizontal: 16, height: 56 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: '700' },
    inputSuffix: { fontSize: 12, fontWeight: '900', color: theme.colors.text.tertiary },
    resultContainer: { alignItems: 'center', paddingVertical: 20, backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.1)' },
    resultHeader: { marginBottom: 10 },
    resultLabel: { fontSize: 10, fontWeight: '900', color: theme.colors.text.secondary, letterSpacing: 1 },
    resultValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 15 },
    resultValue: { fontSize: 48, fontWeight: '900', color: theme.colors.text.brand, fontStyle: 'italic' },
    resultUnit: { fontSize: 20, fontWeight: '900', color: theme.colors.text.brand, marginLeft: 6, opacity: 0.6 },
    shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 12 },
    shareBtnText: { fontSize: 10, fontWeight: '900', color: theme.colors.text.brand, letterSpacing: 0.5 },

    percentageCard: { marginTop: 30, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: theme.colors.text.tertiary, marginBottom: 15, letterSpacing: 1 },
    percentageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    pctItem: { flexBasis: '31%', backgroundColor: theme.colors.ui.glass, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.ui.border, alignItems: 'center' },
    pctLabel: { fontSize: 10, fontWeight: '900', color: theme.colors.text.secondary, marginBottom: 4 },
    pctValue: { fontSize: 16, fontWeight: '900', color: '#FFF' },
    pctUnit: { fontSize: 10, color: theme.colors.text.tertiary, marginLeft: 2 },

    infoCard: { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, marginTop: 30, alignItems: 'center' },
    infoText: { flex: 1, fontSize: 12, color: theme.colors.text.tertiary, lineHeight: 18 },

    emptyState: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
    emptyText: { color: theme.colors.text.secondary, marginTop: 8 },
    
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
});

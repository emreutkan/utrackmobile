import { getResearch } from '@/api/KnowledgeBase';
import { ResearchFilters, TrainingResearch } from '@/api/types';
import { commonStyles, theme, typographyStyles } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    LayoutAnimation,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UpgradeModal from '@/components/UpgradeModal';
import { useUserStore } from '@/state/userStore';

// --- Constants ---
const CATEGORIES = [
    { value: '', label: 'All' },
    { value: 'INTENSITY_GUIDELINES', label: 'Intensity' },
    { value: 'PROTEIN_SYNTHESIS', label: 'Synthesis' },
    { value: 'MUSCLE_GROUPS', label: 'Anatomy' },
    { value: 'MUSCLE_RECOVERY', label: 'Recovery' },
    { value: 'REST_PERIODS', label: 'Rest' },
    { value: 'TRAINING_FREQUENCY', label: 'Frequency' },
];

const MUSCLE_GROUPS = [
    { value: '', label: 'All Muscles' },
    { value: 'chest', label: 'Chest' },
    { value: 'shoulders', label: 'Delts' },
    { value: 'lats', label: 'Back' },
    { value: 'quads', label: 'Legs' },
    { value: 'abs', label: 'Core' },
];

// --- Helper Components ---

const FilterRow = ({ label, options, selected, onSelect }: any) => (
    <View style={styles.filterRowContainer}>
        <Text style={styles.filterRowLabel}>{label}</Text>
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterRowContent}
        >
            {options.map((opt: any) => {
                const isActive = selected === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.label}
                        onPress={() => onSelect(opt.value)}
                        style={[styles.chip, isActive && styles.chipActive]}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    </View>
);

const DiagramPlaceholder = ({ category }: { category: string }) => {
    // Strategic Diagram Injection based on context
    switch (category) {
        case 'PROTEIN_SYNTHESIS':
            return <Text style={styles.diagramTag}></Text>;
        case 'MUSCLE_GROUPS':
            return <Text style={styles.diagramTag}>

[Image of human muscle anatomy]
</Text>;
        case 'INTENSITY_GUIDELINES':
            return <Text style={styles.diagramTag}></Text>;
        case 'MUSCLE_RECOVERY':
            return <Text style={styles.diagramTag}></Text>;
        default:
            return null;
    }
};

export default function KnowledgeBaseScreen() {
    const insets = useSafeAreaInsets();
    const { user, fetchUser, isLoading: isLoadingUser } = useUserStore();
    const [research, setResearch] = useState<TrainingResearch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [filters, setFilters] = useState<ResearchFilters>({
        category: '',
        muscle_group: '',
        exercise_type: ''
    });

    // Fetch user data on mount if not already loaded
    useEffect(() => {
        if (!user && !isLoadingUser) {
            fetchUser();
        }
    }, [user, isLoadingUser, fetchUser]);

    // Check pro status at page level - block access if not pro
    useEffect(() => {
        // Wait for user data to be loaded
        if (user === null && !isLoadingUser) {
            fetchUser();
            return;
        }
        
        // Only check once user data is available
        if (user !== null && !isLoadingUser) {
            if (!user.is_pro) {
                setShowUpgradeModal(true);
                setIsLoading(false);
            } else {
                loadResearch();
            }
        }
    }, [user, isLoadingUser, fetchUser]); // Load once, filter locally for speed unless API requires params

    const loadResearch = async () => {
        setIsLoading(true);
        try {
            const data = await getResearch({}); // Fetch all, filter locally for instant UI
            if (Array.isArray(data)) setResearch(data);
        } catch (error) {
            console.error('Failed to load research:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Memoized Filtering for Performance
    const filteredData = useMemo(() => {
        return research.filter(item => {
            const matchesSearch = !searchQuery || 
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.summary.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = !filters.category || item.category === filters.category;
            const matchesMuscle = !filters.muscle_group || item.tags.includes(filters.muscle_group);

            return matchesSearch && matchesCategory && matchesMuscle;
        });
    }, [research, searchQuery, filters]);

    const renderCard = ({ item }: { item: TrainingResearch }) => {
        const confidencePercent = Math.round(item.confidence_score * 100);
        const confidenceColor = confidencePercent > 80 ? '#32D74B' : confidencePercent > 50 ? '#FF9F0A' : '#FF453A';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.badgeContainer}>
                        <View style={[styles.dot, { backgroundColor: confidenceColor }]} />
                        <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                            {confidencePercent}% Confidence
                        </Text>
                    </View>
                    <Text style={styles.categoryLabel}>{item.category.replace(/_/g, ' ')}</Text>
                </View>

                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSummary}>{item.summary}</Text>

                <DiagramPlaceholder category={item.category} />

                <View style={styles.cardFooter}>
                    <View style={styles.tagsRow}>
                        {item.tags.slice(0, 3).map(tag => (
                            <View key={tag} style={styles.miniTag}>
                                <Text style={styles.miniTagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                    {item.evidence_level && (
                        <Text style={styles.evidenceLevel}>{item.evidence_level} Evidence</Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                style={styles.gradientBg}
            />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={commonStyles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text.zinc600} />
                </TouchableOpacity>
                <Text style={typographyStyles.h2}>Research Hub</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={[styles.controlsContainer, { marginTop: 58 }]}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#8E8E93" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search topics, muscles, mechanics..."
                        placeholderTextColor="#8E8E93"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle-sharp" size={18} color="#8E8E93" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.filterStack}>
                    <FilterRow 
                        label="TOPIC"
                        options={CATEGORIES}
                        selected={filters.category}
                        onSelect={(val: string) => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setFilters(prev => ({ ...prev, category: val }));
                        }}
                    />
                    <FilterRow 
                        label="ANATOMY"
                        options={MUSCLE_GROUPS}
                        selected={filters.muscle_group}
                        onSelect={(val: string) => setFilters(prev => ({ ...prev, muscle_group: val }))}
                    />
                </View>
            </View>

            {(isLoading || isLoadingUser || !user) ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : user && !user.is_pro ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0A84FF" />
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    renderItem={renderCard}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="book-outline" size={48} color="#2C2C2E" />
                            <Text style={styles.emptyText}>No research found matching your criteria.</Text>
                        </View>
                    }
                />
            )}

            <UpgradeModal 
                visible={showUpgradeModal}
                onClose={() => {
                    setShowUpgradeModal(false);
                    router.back();
                }}
                feature="Research Hub"
                message="Access evidence-based research articles, training protocols, and science-backed insights to optimize your workouts."
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // Controls
    controlsContainer: { backgroundColor: '#000000', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#1C1C1E' },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1C1C1E', marginHorizontal: 16, marginTop: 4, marginBottom: 12,
        paddingHorizontal: 12, height: 40, borderRadius: 10,
    },
    searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16, marginLeft: 8 },
    
    // Filters
    filterStack: { gap: 12 },
    filterRowContainer: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
    filterRowLabel: { fontSize: 11, fontWeight: '700', color: '#545458', width: 60, letterSpacing: 0.5 },
    filterRowContent: { paddingRight: 16, gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 6,
        backgroundColor: '#1C1C1E', borderRadius: 16,
        borderWidth: 1, borderColor: '#2C2C2E'
    },
    chipActive: { backgroundColor: '#0A84FF', borderColor: '#0A84FF' },
    chipText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
    chipTextActive: { color: '#FFFFFF', fontWeight: '600' },

    // Content
    listContent: { padding: 16, gap: 16, paddingBottom: 40 },
    
    // Card
    card: {
        backgroundColor: '#1C1C1E', borderRadius: 20, padding: 20,
        borderWidth: 1, borderColor: '#2C2C2E',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    confidenceText: { fontSize: 12, fontWeight: '600' },
    categoryLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase' },
    
    cardTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, lineHeight: 26 },
    cardSummary: { fontSize: 16, color: '#C7C7CC', lineHeight: 24, marginBottom: 16 },
    
    // Diagram Tag Styling (Simulated visually distinct area)
    diagramTag: {
        fontSize: 13, color: '#0A84FF', fontStyle: 'italic',
        backgroundColor: 'rgba(10, 132, 255, 0.1)', padding: 12,
        borderRadius: 8, marginBottom: 16, textAlign: 'center', overflow: 'hidden'
    },

    // Footer
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2C2C2E' },
    tagsRow: { flexDirection: 'row', gap: 6 },
    miniTag: { backgroundColor: '#2C2C2E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    miniTagText: { fontSize: 11, color: '#A1A1A6' },
    evidenceLevel: { fontSize: 12, color: '#8E8E93', fontStyle: 'italic', textTransform: 'capitalize' },

    emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
    emptyText: { color: '#8E8E93', marginTop: 16, fontSize: 16 },
});
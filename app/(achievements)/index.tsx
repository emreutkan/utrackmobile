import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    FlatList,
    Dimensions,
    Image
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, typographyStyles, commonStyles } from '@/constants/theme';
import { getAchievements, getAchievementCategories } from '@/api/Achievements';
import { UserAchievement, AchievementCategoryStats, AchievementRarity } from '@/api/types';
import { extractResults, isPaginatedResponse } from '@/api/types/pagination';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RARITY_COLORS: Record<AchievementRarity, string> = {
    common: '#9CA3AF',
    uncommon: '#22C55E',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    workout_count: 'barbell-outline',
    workout_streak: 'flame-outline',
    total_volume: 'layers-outline',
    pr_weight: 'trophy-outline',
    pr_one_rep_max: 'analytics-outline',
    exercise_count: 'list-outline',
    muscle_volume: 'body-outline',
    consistency: 'calendar-outline',
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const AchievementCard = ({ item }: { item: UserAchievement }) => {
    const { achievement, is_earned, current_progress, progress_percentage, earned_at } = item;
    const rarityColor = RARITY_COLORS[achievement.rarity] || theme.colors.text.tertiary;

    const getIcon = (iconId: string) => {
        if (iconId.startsWith('workout_')) return 'barbell';
        if (iconId.startsWith('streak_')) return 'flame';
        if (iconId.startsWith('volume_')) return 'fitness';
        if (iconId.startsWith('pr_')) return 'medal';
        return 'star';
    };

    return (
        <View style={[styles.achievementCard, !is_earned && styles.achievementCardLocked]}>
            <View style={[styles.iconBox, { borderColor: is_earned ? rarityColor : theme.colors.ui.border }]}>
                <Ionicons 
                    name={getIcon(achievement.icon) as any} 
                    size={24} 
                    color={is_earned ? rarityColor : theme.colors.text.tertiary} 
                />
                {!is_earned && (
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={12} color="#FFF" />
                    </View>
                )}
            </View>
            
            <View style={styles.achievementInfo}>
                <View style={styles.nameRow}>
                    <Text style={[styles.achievementName, !is_earned && styles.textMuted]}>
                        {achievement.name.toUpperCase()}
                    </Text>
                    <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}20`, borderColor: rarityColor }]}>
                        <Text style={[styles.rarityText, { color: rarityColor }]}>
                            {achievement.rarity.toUpperCase()}
                        </Text>
                    </View>
                </View>
                
                <Text style={styles.achievementDescription} numberOfLines={2}>
                    {achievement.description}
                </Text>

                {!is_earned ? (
                    <View style={styles.progressSection}>
                        <View style={styles.progressBarBg}>
                            <View 
                                style={[
                                    styles.progressBarFill, 
                                    { width: `${progress_percentage}%`, backgroundColor: rarityColor }
                                ]} 
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {current_progress} / {achievement.requirement_value}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.earnedDate}>
                        EARNED ON {new Date(earned_at!).toLocaleDateString()}
                    </Text>
                )}
            </View>
        </View>
    );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function AchievementsScreen() {
    const insets = useSafeAreaInsets();
    const [achievements, setAchievements] = useState<UserAchievement[]>([]);
    const [categories, setCategories] = useState<AchievementCategoryStats[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchData = useCallback(async (page: number = 1, pageSize: number = 20) => {
        setIsLoading(true);
        try {
            const [achData, catData] = await Promise.all([
                getAchievements(activeCategory || undefined, page, pageSize),
                getAchievementCategories()
            ]);
            
            // Extract results from paginated or non-paginated response
            const achievementResults = extractResults(achData);
            
            // Update pagination state if paginated
            if (isPaginatedResponse(achData)) {
                setHasMore(!!achData.next);
                setCurrentPage(page);
            } else {
                setHasMore(false);
                setCurrentPage(1);
            }
            
            // If page 1, replace; otherwise append
            if (page === 1) {
                setAchievements(achievementResults);
            } else {
                setAchievements(prev => [...prev, ...achievementResults]);
            }
            
            setCategories(catData);
        } catch (error) {
            console.error('Failed to fetch achievements:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeCategory]);

    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchData(currentPage + 1);
        }
    }, [isLoading, hasMore, currentPage, fetchData]);

    useEffect(() => {
        setCurrentPage(1);
        setHasMore(false);
        fetchData(1);
    }, [fetchData]);

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>ACHIEVEMENTS</Text>
                <Text style={styles.headerSubtitle}>YOUR LEGACY IN IRON</Text>
            </View>
        </View>
    );

    const renderCategoryTabs = () => (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoryScroll}
        >
            <TouchableOpacity 
                style={[styles.categoryTab, activeCategory === null && styles.categoryTabActive]}
                onPress={() => setActiveCategory(null)}
            >
                <Text style={[styles.categoryTabText, activeCategory === null && styles.categoryTabTextActive]}>
                    ALL
                </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
                <TouchableOpacity 
                    key={cat.code}
                    style={[styles.categoryTab, activeCategory === cat.code && styles.categoryTabActive]}
                    onPress={() => setActiveCategory(cat.code)}
                >
                    <Ionicons 
                        name={CATEGORY_ICONS[cat.code] || 'trophy-outline'} 
                        size={14} 
                        color={activeCategory === cat.code ? theme.colors.text.brand : theme.colors.text.tertiary} 
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.categoryTabText, activeCategory === cat.code && styles.categoryTabTextActive]}>
                        {cat.name.toUpperCase()}
                    </Text>
                    {cat.earned > 0 && (
                        <View style={styles.catCountBadge}>
                            <Text style={styles.catCountText}>{cat.earned}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['rgba(99, 101, 241, 0.15)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
            />
            {renderHeader()}
            
            <View style={{ flex: 1 }}>
                <View style={styles.categoryContainer}>
                    {renderCategoryTabs()}
                </View>

                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={theme.colors.text.brand} />
                    </View>
                ) : (
                    <FlatList
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            hasMore && !isLoading ? (
                                <View style={styles.loadMoreContainer}>
                                    <TouchableOpacity
                                        style={styles.loadMoreButton}
                                        onPress={loadMore}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.loadMoreText}>Load More</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null
                        }
                        data={achievements}
                        keyExtractor={(item) => item.achievement.id}
                        renderItem={({ item }) => <AchievementCard item={item} />}
                        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="trophy-outline" size={48} color={theme.colors.text.zinc800} />
                                <Text style={styles.emptyText}>No achievements found</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingBottom: 15,
        gap: 15
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: { flex: 1 },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: '900', 
        color: '#FFF', 
        fontStyle: 'italic',
        letterSpacing: 0.5 
    },
    headerSubtitle: { 
        fontSize: 10, 
        fontWeight: '800', 
        color: theme.colors.text.tertiary, 
        letterSpacing: 1 
    },
    categoryContainer: {
        paddingVertical: 15,
    },
    categoryScroll: {
        paddingHorizontal: 20,
        gap: 10,
    },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: theme.colors.ui.glass,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
    },
    categoryTabActive: {
        borderColor: theme.colors.text.brand,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    categoryTabText: {
        fontSize: 10,
        fontWeight: '900',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.5,
    },
    categoryTabTextActive: {
        color: theme.colors.text.brand,
    },
    catCountBadge: {
        marginLeft: 6,
        backgroundColor: theme.colors.text.brand,
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    catCountText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#FFF',
    },
    listContent: {
        paddingHorizontal: 20,
    },
    achievementCard: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: theme.colors.ui.glass,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        gap: 16,
    },
    achievementCardLocked: {
        opacity: 0.7,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    lockOverlay: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: theme.colors.ui.border,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    achievementInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    achievementName: {
        fontSize: 13,
        fontWeight: '900',
        color: '#FFF',
        fontStyle: 'italic',
    },
    rarityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    rarityText: {
        fontSize: 8,
        fontWeight: '900',
    },
    achievementDescription: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        lineHeight: 16,
        marginBottom: 10,
    },
    progressSection: {
        marginTop: 4,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        marginBottom: 6,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 9,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        textAlign: 'right',
    },
    earnedDate: {
        fontSize: 9,
        fontWeight: '900',
        color: theme.colors.text.brand,
        letterSpacing: 0.5,
    },
    textMuted: {
        color: theme.colors.text.tertiary,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: theme.colors.text.tertiary,
        fontSize: 14,
        fontWeight: '700',
        marginTop: 16,
        textTransform: 'uppercase',
    },
    loadMoreContainer: {
        padding: theme.spacing.m,
        alignItems: 'center',
    },
    loadMoreButton: {
        backgroundColor: theme.colors.ui.glass,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.l,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.ui.border,
        minWidth: 120,
    },
    loadMoreText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.sizes.m,
        fontWeight: '600',
    },
});

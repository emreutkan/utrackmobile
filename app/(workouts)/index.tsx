import { useWorkoutStore } from "@/state/userStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Workouts() {
    const { workouts, isLoading, fetchWorkouts } = useWorkoutStore();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        fetchWorkouts();
    }, []);

    const renderItem = ({ item }: { item: any }) => {
        // Format date if available
        const date = item.created_at ? new Date(item.created_at).toLocaleDateString() : `Workout #${item.id}`;

        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => router.push(`/workout/${item.id}`)}
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.cardDate}>{date}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Workouts</Text>
                <View style={{ width: 60 }} />
            </View>

            <FlatList
                data={workouts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No workouts found.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C1C1E', // Dark Background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 44,
        marginBottom: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 60,
    },
    backText: {
        color: '#0A84FF',
        fontSize: 17,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    card: {
        backgroundColor: '#2C2C2E',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#3C3C43',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardDate: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 16,
    }
});

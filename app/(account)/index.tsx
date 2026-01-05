import { clearTokens } from '@/api/Storage';
import { changePassword, updateGender, updateHeight } from '@/api/account';
import { useUserStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================================
// 1. REUSABLE COMPONENTS
// ============================================================================

/**
 * A grouped section container, similar to iOS Settings groups.
 * Renders a title (optional) and a rounded container for rows.
 */
const SettingsSection = ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <View style={styles.sectionContainer}>
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

/**
 * A single row inside a SettingsSection.
 * Handles icons, labels, values, and chevron logic automatically.
 */
interface SettingsRowProps {
    label: string;
    value?: string | null;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    onPress: () => void;
    isDestructive?: boolean; // If true, styles text red (e.g., Logout)
    showChevron?: boolean;
    isLast?: boolean; // Removes the bottom border if it's the last item
}

const SettingsRow = ({ 
    label, 
    value, 
    icon, 
    iconColor = '#0A84FF', 
    onPress, 
    isDestructive = false,
    showChevron = true,
    isLast = false
}: SettingsRowProps) => (
    <TouchableOpacity 
        style={[styles.row, isLast && styles.rowLast]} 
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.rowLeft}>
            {/* Optional Icon Box */}
            {icon && (
                <View style={[styles.iconContainer, { backgroundColor: isDestructive ? 'rgba(255,59,48,0.15)' : 'rgba(10,132,255,0.15)' }]}>
                    <Ionicons name={icon} size={18} color={isDestructive ? '#FF3B30' : iconColor} />
                </View>
            )}
            <Text style={[styles.rowLabel, isDestructive && styles.rowLabelDestructive]}>
                {label}
            </Text>
        </View>
        
        {/* Right Side: Value + Chevron */}
        <View style={styles.rowRight}>
            {value && <Text style={styles.rowValue}>{value}</Text>}
            {showChevron && <Ionicons name="chevron-forward" size={16} color="#545458" style={{ marginLeft: 8 }} />}
        </View>
    </TouchableOpacity>
);

// ============================================================================
// 2. MAIN SCREEN COMPONENT
// ============================================================================

export default function AccountScreen() {
    const insets = useSafeAreaInsets();
    const { user, fetchUser, clearUser } = useUserStore();
    
    // --- State Management ---
    
    // Controls visibility of the 3 modals
    const [modals, setModals] = useState({
        height: false,
        gender: false,
        password: false,
    });
    
    // Loading state for async operations
    const [isSaving, setIsSaving] = useState(false);

    // Form data buffer (avoids changing user store directly before save)
    const [formData, setFormData] = useState({
        height: '',
        gender: 'male' as 'male' | 'female',
        oldPassword: '',
        newPassword: '',
    });

    // --- Effects ---

    // Initial fetch on mount
    useEffect(() => {
        fetchUser();
    }, []);

    // Sync local form state when the global user object updates
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                height: user.height?.toString() || '',
                gender: (user.gender as 'male' | 'female') || 'male',
            }));
        }
    }, [user]);

    // --- Handlers ---

    // Helper to open/close modals and clear sensitive data on close
    const toggleModal = (key: keyof typeof modals, visible: boolean) => {
        setModals(prev => ({ ...prev, [key]: visible }));
        // Security: Clear password fields when closing the modal
        if (!visible && key === 'password') {
            setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '' }));
        }
    };

    const handleLogout = () => {
        const performLogout = () => {
            clearTokens();
            clearUser();
            router.replace('/(auth)');
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to logout?")) performLogout();
        } else {
            Alert.alert("Log Out", "Are you sure you want to log out?", [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: performLogout }
            ]);
        }
    };

    // Centralized save handler for all modals
    const handleSave = async (type: 'height' | 'gender' | 'password') => {
        setIsSaving(true);
        try {
            let result;
            
            // Execute specific API call based on type
            if (type === 'height') {
                if (!formData.height) throw new Error("Please enter your height");
                result = await updateHeight(parseFloat(formData.height));
            } else if (type === 'gender') {
                result = await updateGender(formData.gender);
            } else if (type === 'password') {
                if (!formData.oldPassword || !formData.newPassword) throw new Error("Missing fields");
                if (formData.newPassword.length < 8) throw new Error("New password must be at least 8 characters");
                result = await changePassword(formData.oldPassword, formData.newPassword);
            }

            if (result?.error) throw new Error(result.error);
            
            // On success: refresh data and close modal
            await fetchUser();
            toggleModal(type, false);
            
        } catch (error: any) {
            Alert.alert("Action Failed", error.message || "Something went wrong.");
        } finally {
            setIsSaving(false);
        }
    };

    // ========================================================================
    // 3. RENDER
    // ========================================================================
    
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* --- Profile Header Card --- */}
                <View style={styles.headerContainer}>
                    <View style={styles.avatarRing}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.profileName}>
                        {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User'}
                    </Text>
                    <Text style={styles.profileEmail}>{user?.email || 'Loading...'}</Text>
                </View>

                {/* --- Personal Info Group --- */}
                <SettingsSection title="Personal Information">
                    <SettingsRow 
                        label="Height" 
                        value={user?.height ? `${user.height} cm` : 'Not set'} 
                        onPress={() => toggleModal('height', true)} 
                    />
                    <SettingsRow 
                        label="Gender" 
                        value={user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'} 
                        onPress={() => toggleModal('gender', true)} 
                        isLast
                    />
                </SettingsSection>

                {/* --- Security Group --- */}
                <SettingsSection title="Security & Access">
                    <SettingsRow 
                        label="Change Password" 
                        icon="lock-closed" 
                        onPress={() => toggleModal('password', true)} 
                    />
                    <SettingsRow 
                        label="Permissions" 
                        icon="shield-checkmark" 
                        onPress={() => router.push('/(permissions)')} 
                        isLast
                    />
                </SettingsSection>

                {/* --- Resources Group --- */}
                <SettingsSection title="Resources">
                    <SettingsRow 
                        label="Knowledge Base" 
                        icon="library" 
                        iconColor="#FF9F0A"
                        onPress={() => router.push('/(knowledge-base)')} 
                    />
                    <SettingsRow 
                        label="Volume Analysis" 
                        icon="bar-chart" 
                        iconColor="#30D158"
                        onPress={() => router.push('/(volume-analysis)')} 
                        isLast
                    />
                </SettingsSection>

                {/* --- Danger Zone --- */}
                <SettingsSection>
                    <SettingsRow 
                        label="Log Out" 
                        onPress={handleLogout} 
                        isDestructive 
                        showChevron={false}
                        isLast
                    />
                </SettingsSection>

                <Text style={styles.versionText}>v1.0.4 • Build 2024</Text>

            </ScrollView>

            {/* ===============================================================
                MODALS
            =============================================================== */}

            {/* --- Height Modal --- */}
            <Modal visible={modals.height} transparent animationType="fade" onRequestClose={() => toggleModal('height', false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Height</Text>
                            <Text style={styles.modalSubtitle}>This helps us calculate your calorie needs.</Text>
                        </View>
                        
                        {/* Big Center Input */}
                        <View style={styles.bigInputContainer}>
                            <TextInput
                                style={styles.bigInput}
                                value={formData.height}
                                onChangeText={(t) => setFormData({ ...formData, height: t })}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#3A3A3C"
                                autoFocus
                                selectionColor="#0A84FF"
                            />
                            <Text style={styles.bigInputSuffix}>cm</Text>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => toggleModal('height', false)}>
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={() => handleSave('height')} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSaveText}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* --- Gender Modal (Visual Cards) --- */}
            <Modal visible={modals.gender} transparent animationType="fade" onRequestClose={() => toggleModal('gender', false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Select Gender</Text>
                        <Text style={styles.modalSubtitle}>For physiological calculations.</Text>
                        
                        <View style={styles.genderRow}>
                            {/* Male Card */}
                            <TouchableOpacity 
                                style={[styles.genderCard, formData.gender === 'male' && styles.genderCardActive]}
                                onPress={() => setFormData({ ...formData, gender: 'male' })}
                            >
                                <Ionicons 
                                    name="male" 
                                    size={32} 
                                    color={formData.gender === 'male' ? '#FFFFFF' : '#8E8E93'} 
                                />
                                <Text style={[styles.genderLabel, formData.gender === 'male' && styles.genderLabelActive]}>Male</Text>
                            </TouchableOpacity>

                            {/* Female Card */}
                            <TouchableOpacity 
                                style={[styles.genderCard, formData.gender === 'female' && styles.genderCardActive]}
                                onPress={() => setFormData({ ...formData, gender: 'female' })}
                            >
                                <Ionicons 
                                    name="female" 
                                    size={32} 
                                    color={formData.gender === 'female' ? '#FFFFFF' : '#8E8E93'} 
                                />
                                <Text style={[styles.genderLabel, formData.gender === 'female' && styles.genderLabelActive]}>Female</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => toggleModal('gender', false)}>
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={() => handleSave('gender')} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSaveText}>Update</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* --- Password Modal --- */}
            <Modal visible={modals.password} transparent animationType="fade" onRequestClose={() => toggleModal('password', false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <Text style={styles.modalSubtitle}>Ensure your new password is secure.</Text>
                        
                        <View style={styles.inputStack}>
                            <TextInput
                                style={styles.cleanInput}
                                value={formData.oldPassword}
                                onChangeText={(t) => setFormData({ ...formData, oldPassword: t })}
                                placeholder="Current Password"
                                placeholderTextColor="#545458"
                                secureTextEntry
                            />
                            <View style={styles.inputSeparator} />
                            <TextInput
                                style={styles.cleanInput}
                                value={formData.newPassword}
                                onChangeText={(t) => setFormData({ ...formData, newPassword: t })}
                                placeholder="New Password"
                                placeholderTextColor="#545458"
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => toggleModal('password', false)}>
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={() => handleSave('password')} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSaveText}>Change</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

// ============================================================================
// 4. STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    
    // --- Header ---
    headerContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarRing: {
        padding: 3,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1C1C1E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '500',
        color: '#8E8E93',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 15,
        color: '#8E8E93',
    },

    // --- Sections ---
    sectionContainer: {
        marginTop: 24,
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#636366',
        textTransform: 'uppercase',
        marginLeft: 16,
        marginBottom: 8,
    },
    sectionContent: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16, 
        overflow: 'hidden',
    },

    // --- Rows ---
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1C1C1E',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2C2C2E',
    },
    rowLast: {
        borderBottomWidth: 0,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rowLabel: {
        fontSize: 17,
        color: '#FFFFFF',
        fontWeight: '400',
    },
    rowLabelDestructive: {
        color: '#FF3B30',
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowValue: {
        fontSize: 17,
        color: '#8E8E93',
        marginRight: 4,
    },

    versionText: {
        textAlign: 'center',
        color: '#3A3A3C',
        fontSize: 13,
        marginTop: 32,
        marginBottom: 20,
    },

    // --- Modern Modals ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)', // Darker overlay for focus
        justifyContent: 'center',
        padding: 16,
    },
    modalCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 24,
    },

    // Height Specific
    bigInputContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        marginBottom: 32,
    },
    bigInput: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFFFFF',
        minWidth: 60,
        textAlign: 'center',
    },
    bigInputSuffix: {
        fontSize: 20,
        fontWeight: '600',
        color: '#8E8E93',
        marginLeft: 8,
    },

    // Gender Specific (Visual Cards)
    genderRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
        width: '100%',
    },
    genderCard: {
        flex: 1,
        backgroundColor: '#2C2C2E',
        borderRadius: 16,
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    genderCardActive: {
        backgroundColor: '#0A84FF',
        borderColor: '#007AFF',
    },
    genderLabel: {
        marginTop: 8,
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '600',
    },
    genderLabelActive: {
        color: '#FFFFFF',
    },

    // Password Specific (Stacked Inputs)
    inputStack: {
        width: '100%',
        backgroundColor: '#2C2C2E',
        borderRadius: 14,
        marginBottom: 24,
    },
    cleanInput: {
        padding: 16,
        fontSize: 17,
        color: '#FFFFFF',
        height: 54,
    },
    inputSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3A3A3C',
        marginLeft: 16,
    },

    // Modal Action Buttons
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btnCancel: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnCancelText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    btnSave: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#0A84FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnSaveText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});
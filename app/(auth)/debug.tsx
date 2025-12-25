import { updateApiBaseUrl } from '@/api/ApiBase';
import { login } from '@/api/Auth';
import { BackendType, getBackendPreference, setBackendPreference } from '@/api/Storage';
import { debugLoginData } from '@/state/debug';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DebugView() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [backend, setBackend] = useState<BackendType>('local');

    useEffect(() => {
        loadBackendPreference();
    }, []);

    const loadBackendPreference = async () => {
        const savedBackend = await getBackendPreference();
        setBackend(savedBackend);
    };

    const handleBackendChange = async (newBackend: BackendType) => {
        await setBackendPreference(newBackend);
        updateApiBaseUrl(newBackend);
        setBackend(newBackend);
        Alert.alert('Backend Changed', `Switched to ${newBackend.toUpperCase()} backend. Restart the app for changes to take full effect.`);
    };

    const handleDebugLogin = async () => {
        const { email, password } = debugLoginData();
        try {
            const result = await login(email, password);
            if (typeof result === 'object' && result.access && result.refresh) {
                router.replace('/(home)');
            } else {
                Alert.alert("Debug Login Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e) {
            Alert.alert("Error", "An unexpected error occurred during debug login.");
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title}>Debug Menu</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions</Text>
                    <TouchableOpacity 
                        style={styles.button}
                        onPress={handleDebugLogin}
                    >
                        <Text style={styles.buttonText}>Debug Login</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Change Backend</Text>
                    <Text style={styles.sectionDescription}>Current: {backend.toUpperCase()}</Text>
                    
                    <TouchableOpacity 
                        style={[styles.backendButton, backend === 'local' && styles.backendButtonActive]}
                        onPress={() => handleBackendChange('local')}
                    >
                        <Text style={[styles.backendButtonText, backend === 'local' && styles.backendButtonTextActive]}>
                            Local (192.168.1.7:8000)
                        </Text>
                        {backend === 'local' && (
                            <Ionicons name="checkmark-circle" size={20} color="#0A84FF" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.backendButton, backend === 'ec2' && styles.backendButtonActive]}
                        onPress={() => handleBackendChange('ec2')}
                    >
                        <Text style={[styles.backendButtonText, backend === 'ec2' && styles.backendButtonTextActive]}>
                            EC2 (api.utrack.irfanemreutkan.com)
                        </Text>
                        {backend === 'ec2' && (
                            <Ionicons name="checkmark-circle" size={20} color="#0A84FF" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#0A84FF',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    backendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    backendButtonActive: {
        borderColor: '#0A84FF',
        backgroundColor: '#1A1A2E',
    },
    backendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    backendButtonTextActive: {
        color: '#0A84FF',
        fontWeight: '600',
    },
});


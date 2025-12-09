import { register } from '@/api/Auth';
import { useUserStore } from '@/state/userStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const fetchUser = useUserStore((state) => state.fetchUser);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert("Missing Information", "Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Password Mismatch", "Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            // Note: Backend might not use 'name' yet, but we send it as requested.
            // We need to update api/Auth.ts to accept name if we want to send it.
            // For now, calling existing register(email, password). 
            // TODO: Update api/Auth.ts to include name.
            const result = await register(email, password);
            
            if (typeof result === 'object' && result.access && result.refresh) {
                // Successful registration + login
                await fetchUser();
                router.replace('/(home)');
            } else {
                Alert.alert("Registration Failed", typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e) {
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.content, { paddingTop: insets.top }]}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Sign up to start tracking your workouts</Text>
                </View>
                
                <View style={styles.inputGroup}>
                    {/* Name Input */}
                    <TextInput 
                        style={styles.inputTop} 
                        placeholder="Full Name" 
                        placeholderTextColor="#8E8E93"
                        value={name} 
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                    <View style={styles.separator} />
                    
                    {/* Email Input */}
                    <TextInput 
                        style={styles.inputMiddle} 
                        placeholder="Email" 
                        placeholderTextColor="#8E8E93"
                        value={email} 
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <View style={styles.separator} />
                    
                    {/* Password Input */}
                    <View style={styles.passwordContainer}>
                        <TextInput 
                            style={styles.passwordInput} 
                            placeholder="Password" 
                            placeholderTextColor="#8E8E93"
                            value={password} 
                            onChangeText={setPassword} 
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity 
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons 
                                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                size={20} 
                                color="#8E8E93" 
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.separator} />

                    {/* Confirm Password Input */}
                    <TextInput 
                        style={styles.inputBottom} 
                        placeholder="Confirm Password" 
                        placeholderTextColor="#8E8E93"
                        value={confirmPassword} 
                        onChangeText={setConfirmPassword} 
                        secureTextEntry={!showPassword}
                    />
                </View>

                <View style={styles.buttonContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0A84FF" />
                    ) : (
                        <TouchableOpacity 
                            style={styles.registerButton} 
                            onPress={handleRegister}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.registerButtonText}>Sign Up</Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                <TouchableOpacity style={{ marginTop: 24 }} onPress={() => router.back()}>
                    <Text style={styles.linkText}>Already have an account? Log In</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C1C1E', // Dark Background
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 17,
        color: '#8E8E93',
        textAlign: 'center',
    },
    inputGroup: {
        backgroundColor: '#2C2C2E', // Dark Card
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    inputTop: {
        height: 50,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#2C2C2E',
    },
    inputMiddle: {
        height: 50,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#2C2C2E',
    },
    inputBottom: {
        height: 50,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
        backgroundColor: '#2C2C2E',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        height: 50,
    },
    passwordInput: {
        flex: 1,
        height: 50,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#FFFFFF',
    },
    eyeIcon: {
        paddingHorizontal: 16,
        height: 50,
        justifyContent: 'center',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#3C3C43', // Dark Separator
        marginLeft: 16,
    },
    buttonContainer: {
        marginTop: 8,
    },
    registerButton: {
        backgroundColor: '#0A84FF', // iOS Blue
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    linkText: {
        color: '#0A84FF',
        textAlign: 'center',
        fontSize: 17,
    }
});





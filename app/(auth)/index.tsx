import { login } from '@/api/Auth';
import debug, { DebugLoginButton } from '@/state/debug';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Button, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();


    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await login(email, password);
            if (typeof result === 'object' && result.access && result.refresh) {
                router.replace('/(home)');
            } else {
                setError(typeof result === 'string' ? result : 'An unknown error occurred');
            }
        } catch (e) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        {debug ? <DebugLoginButton /> : null}
         <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.form}>
                <Text style={styles.title}>Welcome Back</Text>
                
                <View style={styles.inputGroup}>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Email" 
                        value={email} 
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput 
                        style={styles.input} 
                        placeholder="Password" 
                        value={password} 
                        onChangeText={setPassword} 
                        secureTextEntry
                    />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.buttonContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#007AFF" />
                    ) : (
                        <Button title="Login" onPress={handleLogin} />
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
        </>
       
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        padding: 20,
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        gap: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputGroup: {
        gap: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    buttonContainer: {
        marginTop: 10,
    },
    error: {
        color: 'red',
        textAlign: 'center',
        backgroundColor: '#ffebee',
        padding: 10,
        borderRadius: 8,
    }
});

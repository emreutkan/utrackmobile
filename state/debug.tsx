import { router } from "expo-router";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const debug: boolean = true;
export default debug;

export const debugLoginData = (): { email: string, password: string } => {
    return {
        email: 'irfanemreutkan@outlook.com',
        password: 'irfanemreutkan@outlook.com'
    }
}

export const DebugLoginButton = () => {
    return (
        <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/(auth)/debug')}
        >
            <Text style={styles.buttonText}>Debug</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
});
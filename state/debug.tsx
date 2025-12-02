import { login } from "@/api/Auth";
import { router } from "expo-router";
import { Button } from "react-native";

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
        <Button title="Debug" onPress={async () => {
            const { email, password } = debugLoginData();
            const result = await login(email, password);
            if (typeof result === 'object' && result.access && result.refresh) {
                router.replace('/(home)');
            } else {
                console.error(typeof result === 'string' ? result : 'An unknown error occurred');
            }
        }} />
    )
}
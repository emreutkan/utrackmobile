import { getWorkout } from "@/api/Workout";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Modal, StyleSheet, Text, View } from "react-native";

export default function AddExerciseScreen() {
    const { workoutID } = useLocalSearchParams();
    const [, setWorkout] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger the modal to open immediately when the screen mounts
        setIsVisible(true);

        if (workoutID) {
            getWorkout(Number(workoutID)).then((workout: any) => {
                setWorkout(workout);
            });
        }
    }, [workoutID]);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for animation to finish before going back
        setTimeout(() => {
            router.back();
        }, 300); // Default close animation time
    };

    return (
        <View style={styles.container}>
            <Modal
            presentationStyle="formSheet"
                visible={isVisible}
                onRequestClose={handleClose}
            >
                <View style={styles.sheet}>
                    <LinearGradient
                        colors={['rgba(99, 101, 241, 0.13)', 'transparent']}
                        style={styles.gradientBg}
                    />
                    <View style={styles.handle} />
                    <Text style={styles.text}>Add Exercise</Text>
                    <Button title="Close" onPress={handleClose} />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent', // Important
    },
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    sheet: {
        height: '90%',
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        overflow: 'hidden',
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: 'gray',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 20,
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
});

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { DraggableZoomable } from '../DraggableZoomable';

interface DragZoomExperimentProps {
    onBack: () => void;
}

export const DragZoomExperiment: React.FC<DragZoomExperimentProps> = ({ onBack }) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Drag & Zoom Experiment</Text>
            </View>

            <View style={styles.content}>
                <DraggableZoomable minScale={0.5} maxScale={4} initialScale={1}>
                    <View style={styles.draggableBox}>
                        <Text style={styles.text}>Drag me around!</Text>
                        <Text style={styles.subText}>Pinch to zoom</Text>
                        <Text style={styles.subText}>Double tap to reset</Text>
                        <Text style={styles.subText}>Rotate with two fingers</Text>
                    </View>
                </DraggableZoomable>

                <View style={styles.instructions}>
                    <Text style={styles.instructionsTitle}>How to use:</Text>
                    <Text style={styles.instructionText}>• Drag with one finger to move</Text>
                    <Text style={styles.instructionText}>• Pinch with two fingers to zoom</Text>
                    <Text style={styles.instructionText}>• Rotate with two fingers to spin</Text>
                    <Text style={styles.instructionText}>• Double tap to reset or zoom in</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        padding: 8,
        marginRight: 16,
    },
    backButtonText: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: '500',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    draggableBox: {
        width: 200,
        height: 200,
        backgroundColor: '#4A90E2',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    text: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subText: {
        color: 'white',
        fontSize: 11,
        opacity: 0.9,
        textAlign: 'center',
        marginBottom: 2,
    },
    instructions: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 4,
    },
});
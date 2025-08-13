// React core for component creation and state management
import React, { useState, useEffect, useRef } from 'react';
// React Native UI components for building the interface
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native';
// Gesture handling for drawing interactions
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
// Animation library for smooth interactions
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    runOnJS,
} from 'react-native-reanimated';
// AsyncStorage for persisting drawings
import AsyncStorage from '@react-native-async-storage/async-storage';
// SVG for drawing capabilities
import Svg, { Path } from 'react-native-svg';

// Get device dimensions for responsive layout
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// TypeScript interface defining props for the drawing experiment component
interface DrawingCanvasExperimentProps {
    onBack: () => void; // Callback function to return to the main menu
}

// Interface for storing individual path data
interface PathData {
    d: string;      // SVG path data
    color: string;  // Path color
    width: number;  // Path stroke width
}

// Storage key for persisting drawings
const DRAWING_STORAGE_KEY = 'drawing_canvas_paths';

// Main Drawing Canvas Experiment Component
export const DrawingCanvasExperiment: React.FC<DrawingCanvasExperimentProps> = ({ onBack }) => {
    // State for storing all drawn paths
    const [paths, setPaths] = useState<PathData[]>([]);
    // Current path being drawn
    const [currentPath, setCurrentPath] = useState<string>('');
    // Drawing tools state
    const [currentColor, setCurrentColor] = useState<string>('#000000');
    const [strokeWidth, setStrokeWidth] = useState<number>(3);
    const [isEraser, setIsEraser] = useState<boolean>(false);
    
    // Shared values for gesture handling
    const isDrawing = useSharedValue(false);
    
    // Load saved drawings on component mount
    useEffect(() => {
        loadSavedDrawing();
    }, []);

    // Function to load saved drawing from AsyncStorage
    const loadSavedDrawing = async () => {
        try {
            const savedPaths = await AsyncStorage.getItem(DRAWING_STORAGE_KEY);
            if (savedPaths) {
                const parsedPaths: PathData[] = JSON.parse(savedPaths);
                setPaths(parsedPaths);
            }
        } catch (error) {
            console.error('Error loading saved drawing:', error);
        }
    };

    // Function to save current drawing to AsyncStorage
    const saveDrawing = async (pathsToSave: PathData[]) => {
        try {
            await AsyncStorage.setItem(DRAWING_STORAGE_KEY, JSON.stringify(pathsToSave));
        } catch (error) {
            console.error('Error saving drawing:', error);
        }
    };

    // Handle start of drawing gesture
    const handleDrawStart = (x: number, y: number) => {
        isDrawing.value = true;
        const newPath = `M${x},${y}`;
        setCurrentPath(newPath);
    };

    // Handle drawing movement
    const handleDrawMove = (x: number, y: number) => {
        if (!isDrawing.value) return;
        setCurrentPath(prev => `${prev} L${x},${y}`);
    };

    // Handle end of drawing gesture
    const handleDrawEnd = () => {
        if (!isDrawing.value || !currentPath) return;
        
        isDrawing.value = false;
        
        // Add completed path to paths array
        const newPathData: PathData = {
            d: currentPath,
            color: isEraser ? '#FFFFFF' : currentColor,
            width: isEraser ? strokeWidth * 2 : strokeWidth,
        };
        
        const updatedPaths = [...paths, newPathData];
        setPaths(updatedPaths);
        setCurrentPath('');
        
        // Auto-save the drawing
        saveDrawing(updatedPaths);
    };

    // Pan gesture for drawing
    const panGesture = Gesture.Pan()
        .onStart((event) => {
            runOnJS(handleDrawStart)(event.x, event.y);
        })
        .onUpdate((event) => {
            runOnJS(handleDrawMove)(event.x, event.y);
        })
        .onEnd(() => {
            runOnJS(handleDrawEnd)();
        });

    // Clear canvas function
    const clearCanvas = () => {
        Alert.alert(
            'Clear Canvas',
            'Are you sure you want to clear the entire canvas? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        setPaths([]);
                        setCurrentPath('');
                        saveDrawing([]);
                    },
                },
            ]
        );
    };

    // Undo last path
    const undoLastPath = () => {
        if (paths.length > 0) {
            const newPaths = paths.slice(0, -1);
            setPaths(newPaths);
            saveDrawing(newPaths);
        }
    };

    // Color selection options
    const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with back button and title */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Drawing Canvas</Text>
                <View style={styles.spacer} />
            </View>

            {/* Drawing Tools */}
            <View style={styles.toolsContainer}>
                {/* Color Palette */}
                <View style={styles.colorPalette}>
                    {colors.map((color) => (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorButton,
                                { backgroundColor: color },
                                currentColor === color && !isEraser && styles.selectedColor,
                            ]}
                            onPress={() => {
                                setCurrentColor(color);
                                setIsEraser(false);
                            }}
                        />
                    ))}
                    
                    {/* Eraser Tool */}
                    <TouchableOpacity
                        style={[
                            styles.eraserButton,
                            isEraser && styles.selectedEraser,
                        ]}
                        onPress={() => setIsEraser(!isEraser)}
                    >
                        <Text style={styles.eraserText}>E</Text>
                    </TouchableOpacity>
                </View>

                {/* Stroke Width Controls */}
                <View style={styles.strokeControls}>
                    <Text style={styles.strokeLabel}>Size:</Text>
                    {[1, 3, 5, 8].map((width) => (
                        <TouchableOpacity
                            key={width}
                            style={[
                                styles.strokeButton,
                                strokeWidth === width && styles.selectedStroke,
                            ]}
                            onPress={() => setStrokeWidth(width)}
                        >
                            <View style={[styles.strokePreview, { 
                                width: width * 2, 
                                height: width * 2,
                                backgroundColor: currentColor 
                            }]} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.undoButton} onPress={undoLastPath}>
                        <Text style={styles.buttonText}>Undo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
                        <Text style={styles.buttonText}>Clear</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Drawing Canvas */}
            <View style={styles.canvasContainer}>
                <GestureDetector gesture={panGesture}>
                    <Animated.View style={styles.canvas}>
                        <Svg height="100%" width="100%" style={styles.svg}>
                            {/* Render all completed paths */}
                            {paths.map((path, index) => (
                                <Path
                                    key={index}
                                    d={path.d}
                                    stroke={path.color}
                                    strokeWidth={path.width}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                />
                            ))}
                            {/* Render current path being drawn */}
                            {currentPath && (
                                <Path
                                    d={currentPath}
                                    stroke={isEraser ? '#FFFFFF' : currentColor}
                                    strokeWidth={isEraser ? strokeWidth * 2 : strokeWidth}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                />
                            )}
                        </Svg>
                    </Animated.View>
                </GestureDetector>
            </View>

            {/* Status Info */}
            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                    Mode: {isEraser ? 'Eraser' : 'Draw'} | 
                    Color: {isEraser ? 'White' : currentColor} | 
                    Size: {strokeWidth}px | 
                    Paths: {paths.length}
                </Text>
                <Text style={styles.autoSaveText}>✓ Auto-saves across restarts</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#6c757d',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
        flex: 1,
    },
    spacer: {
        width: 80,
    },
    toolsContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    colorPalette: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    colorButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
        marginBottom: 5,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedColor: {
        borderColor: '#007AFF',
        borderWidth: 3,
    },
    eraserButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#6c757d',
        marginRight: 10,
        marginBottom: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedEraser: {
        borderColor: '#007AFF',
        borderWidth: 3,
    },
    eraserText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    strokeControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    strokeLabel: {
        fontSize: 14,
        color: '#6c757d',
        marginRight: 10,
        fontWeight: '600',
    },
    strokeButton: {
        padding: 8,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        borderRadius: 6,
    },
    selectedStroke: {
        borderColor: '#007AFF',
    },
    strokePreview: {
        borderRadius: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    undoButton: {
        backgroundColor: '#17a2b8',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        marginRight: 10,
    },
    clearButton: {
        backgroundColor: '#dc3545',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    canvasContainer: {
        flex: 1,
        margin: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    canvas: {
        flex: 1,
    },
    svg: {
        backgroundColor: '#fff',
    },
    statusContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    statusText: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
    },
    autoSaveText: {
        fontSize: 11,
        color: '#28a745',
        textAlign: 'center',
        marginTop: 2,
        fontWeight: '500',
    },
});
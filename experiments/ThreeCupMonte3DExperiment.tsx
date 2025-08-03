// React core for component creation and state management
import React, { useState } from 'react';
// React Native UI components for building the interface
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
// Gesture handling for touch interactions (tap gestures on cups)
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
// Animation library for smooth, 60fps animations
import Animated, {
    useSharedValue,    // Creates animated values that persist across renders
    useAnimatedStyle,  // Creates styles that update based on animated values
    withTiming,        // Smooth timing-based animations with easing
    withSequence,      // Chains multiple animations in sequence
    runOnJS,          // Executes JavaScript functions from animation context
    Easing,           // Easing functions for natural animation curves
    interpolate,      // Maps input ranges to output ranges
} from 'react-native-reanimated';

// Get device screen width for responsive layout
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Calculate cup dimensions as percentages of screen width for responsive design
const CUP_WIDTH = SCREEN_WIDTH * 0.25;    // Cup width = 25% of screen width
const CUP_HEIGHT = CUP_WIDTH * 1.2;       // Cup height = 120% of cup width (taller than wide)
const BALL_SIZE = 20;                     // Fixed ball size in pixels
const LIFT_HEIGHT = -60;                  // How high cups lift during movement (negative = up)

// TypeScript interface defining props for the main experiment component
interface ThreeCupMonte3DExperimentProps {
    onBack: () => void; // Callback function to return to the main menu
}

// TypeScript interface defining the structure of a cup position
interface CupPosition {
    x: number; // Horizontal position in pixels
    y: number; // Vertical position in pixels
}

// Define the three fixed positions where cups can be placed
// These create evenly spaced positions across the screen
const CUP_POSITIONS: CupPosition[] = [
    { x: SCREEN_WIDTH * 0.065, y: 0 },    // Left position: 6.5% from left edge
    { x: SCREEN_WIDTH * 0.3775, y: 0 },   // Center position: 37.75% from left edge
    { x: SCREEN_WIDTH * 0.69, y: 0 },     // Right position: 69% from left edge
];

// Individual animated cup component with 2D curved movement
const AnimatedCup3D: React.FC<{
    cupId: number;        // Unique identifier (0, 1, or 2)
    position: number;     // Current position index (0=left, 1=center, 2=right)
    onCupTap: (cupId: number) => void;  // Callback when cup is tapped
    isShuffling: boolean; // Whether cups are currently moving (disables interaction)
    hasBall: boolean;     // Whether this cup has the ball under it
    showBall: boolean;    // Whether the ball should be visible
    isSwapping: boolean;  // Whether this specific cup is currently in a swap animation
}> = ({ cupId, position, onCupTap, isShuffling, hasBall, showBall, isSwapping }) => {
    // Shared values are the core of Reanimated - they persist across renders
    // and can trigger animations when changed
    const translateX = useSharedValue(CUP_POSITIONS[position].x); // Cup's X position
    const translateY = useSharedValue(CUP_POSITIONS[position].y); // Cup's Y position  
    const scale = useSharedValue(1); // Cup's scale (1 = normal size, used for tap feedback)
    const rotation = useSharedValue(0); // Cup's rotation for 3D effect during movement
    
    // Create tap gesture handler for cup interaction
    const tapGesture = Gesture.Tap()
        .enabled(!isShuffling)  // Only allow taps when not shuffling
        .onStart(() => {
            // Create a bounce effect when tapped for visual feedback
            scale.value = withSequence(
                withTiming(0.95, { duration: 100 }),  // Shrink to 95% size quickly
                withTiming(1, { duration: 100 })      // Return to normal size
            );
            // Execute the tap callback in JavaScript context (crosses thread boundary)
            runOnJS(onCupTap)(cupId);
        });

    // Function to animate cup to a new position with curved 2D movement
    const animateToPosition = (targetPosition: number, delay: number = 0) => {
        'worklet';
        const target = CUP_POSITIONS[targetPosition];
        const startX = translateX.value;
        const startY = translateY.value;
        
        // Calculate if this is a horizontal movement (same Y, different X)
        const isHorizontalMove = Math.abs(target.x - startX) > 10;
        
        if (isHorizontalMove) {
            // Create curved movement with lift effect
            setTimeout(() => {
                // Phase 1: Lift up with slight rotation and scale
                translateY.value = withTiming(LIFT_HEIGHT, {
                    duration: 300,
                    easing: Easing.out(Easing.quad),
                });
                scale.value = withTiming(1.05, {
                    duration: 300,
                    easing: Easing.out(Easing.quad),
                });
                rotation.value = withTiming(target.x > startX ? 8 : -8, {
                    duration: 300,
                    easing: Easing.out(Easing.quad),
                });
                
                // Phase 2: Move horizontally while lifted
                setTimeout(() => {
                    translateX.value = withTiming(target.x, {
                        duration: 400,
                        easing: Easing.inOut(Easing.quad),
                    });
                }, 200);
                
                // Phase 3: Lower down to final position
                setTimeout(() => {
                    translateY.value = withTiming(target.y, {
                        duration: 300,
                        easing: Easing.in(Easing.quad),
                    });
                    scale.value = withTiming(1, {
                        duration: 300,
                        easing: Easing.in(Easing.quad),
                    });
                    rotation.value = withTiming(0, {
                        duration: 300,
                        easing: Easing.in(Easing.quad),
                    });
                }, 400);
                
            }, delay);
        } else {
            // Direct movement for same position (shouldn't happen in normal swaps)
            setTimeout(() => {
                translateX.value = withTiming(target.x, {
                    duration: 600,
                    easing: Easing.inOut(Easing.quad),
                });
                translateY.value = withTiming(target.y, {
                    duration: 600,
                    easing: Easing.inOut(Easing.quad),
                });
            }, delay);
        }
    };

    // This effect runs whenever the 'position' prop changes
    // It triggers the curved animation to the new position
    React.useEffect(() => {
        if (isSwapping) {
            animateToPosition(position, 0);
        } else {
            // Direct movement when not in a swap (initial positioning)
            const target = CUP_POSITIONS[position];
            translateX.value = withTiming(target.x, {
                duration: 600,
                easing: Easing.inOut(Easing.quad),
            });
            translateY.value = withTiming(target.y, {
                duration: 600,
                easing: Easing.inOut(Easing.quad),
            });
        }
    }, [position, isSwapping]);

    // Convert animated values into actual CSS transform styles
    // This function runs on the UI thread for 60fps performance
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },  // Move horizontally
                { translateY: translateY.value },  // Move vertically (includes lift effect)
                { scale: scale.value },            // Scale up/down for tap feedback and lift effect
                { rotate: `${rotation.value}deg` }, // Rotate during movement for 3D feel
            ],
            // Add shadow that changes with height for depth effect
            shadowOpacity: interpolate(
                translateY.value,
                [LIFT_HEIGHT, 0],
                [0.4, 0.2]
            ),
            shadowRadius: interpolate(
                translateY.value,
                [LIFT_HEIGHT, 0],
                [12, 6]
            ),
            elevation: interpolate(
                translateY.value,
                [LIFT_HEIGHT, 0],
                [15, 8]
            ),
        };
    });

    // Ball animation style - follows the cup's position and can fade in/out
    const ballAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: showBall ? 1 : 0,  // Fade ball in/out based on game state
            transform: [
                // Position ball centered horizontally under the cup
                { translateX: translateX.value + CUP_WIDTH / 2 - BALL_SIZE / 2 },
                // Position ball just below the cup, following its Y movement
                { translateY: translateY.value + CUP_HEIGHT + 10 },
            ],
        };
    });

    // Render the cup and ball (if this cup has it)
    return (
        <>
            {/* Wrap cup in GestureDetector to handle tap interactions */}
            <GestureDetector gesture={tapGesture}>
                <Animated.View style={[styles.cup, animatedStyle]}>
                    {/* Cup top rim */}
                    <View style={styles.cupTop} />
                    {/* Main cup body */}
                    <View style={styles.cupBody} />
                    {/* Cup number label (1, 2, or 3) */}
                    <Text style={styles.cupNumber}>{cupId + 1}</Text>
                </Animated.View>
            </GestureDetector>
            
            {/* Ball under the cup - only render if this cup has the ball */}
            {hasBall && (
                <Animated.View style={[styles.ball, ballAnimatedStyle]} />
            )}
        </>
    );
};

// Main Three Cup Monte 3D game component
export const ThreeCupMonte3DExperiment: React.FC<ThreeCupMonte3DExperimentProps> = ({ onBack }) => {
    // Game state management using React hooks
    const [isShuffling, setIsShuffling] = useState(false);     // Is animation currently running?
    const [ballUnderCup, setBallUnderCup] = useState(1);       // Which cup has ball (0, 1, or 2)
    const [showBall, setShowBall] = useState(true);            // Should ball be visible?
    const [gameStarted, setGameStarted] = useState(false);     // Has game round started?
    const [gameStats, setGameStats] = useState({ correct: 0, total: 0 }); // Player statistics
    const [lastGuess, setLastGuess] = useState<{ cupId: number; correct: boolean } | null>(null); // Last guess result
    const [swappingCups, setSwappingCups] = useState<number[]>([]); // Track which cups are currently swapping
    
    // Position tracking system: cupPositions[cupId] = positionIndex
    // Example: [0, 1, 2] means Cup0→Pos0, Cup1→Pos1, Cup2→Pos2 (initial state)
    // Example: [2, 0, 1] means Cup0→Pos2, Cup1→Pos0, Cup2→Pos1 (after shuffling)
    const [cupPositions, setCupPositions] = useState([0, 1, 2]);

    // Enhanced shuffling function with curved 2D animations
    const performShuffle = () => {
        if (isShuffling) return; // Prevent multiple simultaneous shuffles
        
        // Set up game state for shuffling
        setIsShuffling(true);    // Lock interactions during animation
        setShowBall(false);      // Hide ball during shuffle
        setGameStarted(true);    // Mark game as active
        setLastGuess(null);      // Clear previous guess result

        // Define a sequence of position swaps that create realistic shuffling
        // Each sub-array [a, b] means "swap the cups at positions a and b"
        const swapSequence = [
            [0, 1], // Swap left and center positions
            [1, 2], // Swap center and right positions  
            [0, 2], // Swap left and right positions
            [0, 1], // Swap left and center again
            [1, 2], // Swap center and right again
        ];

        // Keep track of current positions as we perform swaps
        let currentPositions = [...cupPositions]; // Copy current state to avoid mutation
        
        // Execute each swap with a delay to create sequential animation
        swapSequence.forEach((swap, index) => {
            setTimeout(() => {
                const [pos1, pos2] = swap; // Extract positions to swap
                
                // Find which cups are currently at these positions
                // findIndex returns the cup ID that has the specified position
                const cup1 = currentPositions.findIndex(pos => pos === pos1);
                const cup2 = currentPositions.findIndex(pos => pos === pos2);
                
                // Mark these cups as currently swapping for enhanced animation
                setSwappingCups([cup1, cup2]);
                
                // Perform the swap using destructuring assignment
                [currentPositions[cup1], currentPositions[cup2]] = 
                [currentPositions[cup2], currentPositions[cup1]];
                
                // Update state to trigger re-render and animations
                setCupPositions([...currentPositions]); // Create new array to trigger update
                
                // Clear swapping state after animation completes
                setTimeout(() => {
                    setSwappingCups([]);
                }, 800);
                
                // If this is the final swap, end the shuffling sequence
                if (index === swapSequence.length - 1) {
                    setTimeout(() => {
                        setIsShuffling(false); // Re-enable interactions
                    }, 1000); // Wait for final animation to complete (longer for 3D effect)
                }
            }, index * 1000); // Stagger each swap by 1000ms for visible curved movement
        });
    };

    // Handle player's guess when they tap a cup
    const handleCupTap = (cupId: number) => {
        // Only allow guesses after game starts and while not shuffling
        if (!gameStarted || isShuffling) return;

        // Check if the guess is correct by comparing with ball location
        const correct = cupId === ballUnderCup;
        
        // Store the guess result for display feedback
        setLastGuess({ cupId, correct });
        
        // Show the ball to reveal the correct answer
        setShowBall(true);
        
        // Update player statistics
        setGameStats(prev => ({
            correct: prev.correct + (correct ? 1 : 0), // Add 1 if correct, 0 if wrong
            total: prev.total + 1, // Always increment total guesses
        }));

        // Reset for next round after showing result for 2 seconds
        setTimeout(() => {
            setShowBall(true);           // Ensure ball is visible for next round
            setGameStarted(false);       // Reset game state to allow new shuffle
            setBallUnderCup(Math.floor(Math.random() * 3)); // Random new ball position (0, 1, or 2)
        }, 2000);
    };

    // Reset all game state to initial values
    const resetGame = () => {
        setGameStats({ correct: 0, total: 0 }); // Clear player statistics
        setLastGuess(null);                      // Clear last guess display
        setGameStarted(false);                   // Reset game state
        setIsShuffling(false);                   // Ensure shuffling is stopped
        setShowBall(true);                       // Make ball visible
        setBallUnderCup(1);                      // Put ball under center cup (cup ID 1)
        setCupPositions([0, 1, 2]);              // Reset cups to original positions
        setSwappingCups([]);                     // Clear any swapping state
    };

    // Main UI render - creates the game interface
    return (
        <SafeAreaView style={styles.container}>
            {/* Header with back button and title */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Three Cup Monte 3D</Text>
            </View>

            {/* Statistics display showing player performance */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{gameStats.correct}</Text>
                    <Text style={styles.statLabel}>Correct</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{gameStats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {/* Calculate success percentage, avoid division by zero */}
                        {gameStats.total > 0 ? Math.round((gameStats.correct / gameStats.total) * 100) : 0}%
                    </Text>
                    <Text style={styles.statLabel}>Success</Text>
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                    <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
            </View>

            {/* Main game area containing cups and controls */}
            <View style={styles.gameArea}>
                {/* Container for the three cups with relative positioning */}
                <View style={styles.cupsContainer}>
                    {/* Render three cups, each with its current position and 3D animation */}
                    {[0, 1, 2].map((cupId) => (
                        <AnimatedCup3D
                            key={cupId}                          // React key for efficient updates
                            cupId={cupId}                        // Cup identifier (0, 1, or 2)
                            position={cupPositions[cupId]}       // Current position from state array
                            onCupTap={handleCupTap}             // Tap handler function
                            isShuffling={isShuffling}           // Animation state to disable interaction
                            hasBall={cupId === ballUnderCup}    // Does this cup have the ball?
                            showBall={showBall && !gameStarted} // Show ball only before game starts
                            isSwapping={swappingCups.includes(cupId)} // Is this cup currently in a swap?
                        />
                    ))}
                </View>

                {/* Shuffle button to start the game */}
                <TouchableOpacity 
                    style={[styles.shuffleButton, isShuffling && styles.shuffleButtonDisabled]} 
                    onPress={performShuffle}
                    disabled={isShuffling} // Disable during animation
                >
                    <Text style={styles.shuffleButtonText}>
                        {isShuffling ? 'Shuffling...' : 'Shuffle Cups 3D'}
                    </Text>
                </TouchableOpacity>

                {/* Result display - only shows after player makes a guess */}
                {lastGuess && (
                    <View style={[styles.resultContainer, lastGuess.correct ? styles.correctResult : styles.incorrectResult]}>
                        <Text style={styles.resultText}>
                            {lastGuess.correct ? '🎉 Correct!' : '❌ Wrong!'}
                        </Text>
                        <Text style={styles.resultSubtext}>
                            You chose cup {lastGuess.cupId + 1}
                        </Text>
                    </View>
                )}
            </View>

            {/* Game instructions at the bottom */}
            <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>Enhanced 3D Experience:</Text>
                <Text style={styles.instructionText}>• Watch cups lift and move in curved paths</Text>
                <Text style={styles.instructionText}>• Enhanced shadows and rotation effects</Text>
                <Text style={styles.instructionText}>• Tap "Shuffle Cups 3D" for realistic movement</Text>
                <Text style={styles.instructionText}>• Track the ball through the 3D animations</Text>
            </View>
        </SafeAreaView>
    );
};

// Styles for the Three Cup Monte 3D experiment
// Uses responsive design with enhanced shadows and 3D effects
const styles = StyleSheet.create({
    // Main container - fills screen with light gray background
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    statLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 4,
    },
    resetButton: {
        backgroundColor: '#e74c3c',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    gameArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    cupsContainer: {
        height: CUP_HEIGHT + 100, // Extra height for lift animation
        width: SCREEN_WIDTH,
        marginBottom: 40,
        position: 'relative',
    },
    cup: {
        position: 'absolute',
        width: CUP_WIDTH,
        height: CUP_HEIGHT,
        alignItems: 'center',
        // Enhanced shadow for 3D effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8,
    },
    cupTop: {
        width: CUP_WIDTH,
        height: 8,
        backgroundColor: '#8B4513',
        borderRadius: 4,
        marginBottom: 2,
        // Add subtle gradient effect
        shadowColor: '#654321',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
        elevation: 2,
    },
    cupBody: {
        width: CUP_WIDTH * 0.9,
        height: CUP_HEIGHT - 10,
        backgroundColor: '#A0522D',
        borderBottomLeftRadius: CUP_WIDTH * 0.1,
        borderBottomRightRadius: CUP_WIDTH * 0.1,
        // Enhanced shadows for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    cupNumber: {
        position: 'absolute',
        top: CUP_HEIGHT / 2,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    ball: {
        position: 'absolute',
        width: BALL_SIZE,
        height: BALL_SIZE,
        borderRadius: BALL_SIZE / 2,
        backgroundColor: '#ff4757',
        // Enhanced shadow for ball
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 6,
    },
    shuffleButton: {
        backgroundColor: '#9b59b6',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
        marginBottom: 20,
    },
    shuffleButtonDisabled: {
        backgroundColor: '#bdc3c7',
    },
    shuffleButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    resultContainer: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    correctResult: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: '#4CAF50',
        borderWidth: 2,
    },
    incorrectResult: {
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        borderColor: '#F44336',
        borderWidth: 2,
    },
    resultText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    resultSubtext: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    instructions: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        margin: 20,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
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
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
} from 'react-native-reanimated';

// Get device screen width for responsive layout
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Calculate cup dimensions as percentages of screen width for responsive design
const CUP_WIDTH = SCREEN_WIDTH * 0.25;    // Cup width = 25% of screen width
const CUP_HEIGHT = CUP_WIDTH * 1.2;       // Cup height = 120% of cup width (taller than wide)
const BALL_SIZE = 20;                     // Fixed ball size in pixels

// TypeScript interface defining props for the main experiment component
interface ThreeCupMonteExperimentProps {
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
    { x: SCREEN_WIDTH * 0.125, y: 0 },   // Left position: 12.5% from left edge
    { x: SCREEN_WIDTH * 0.4375, y: 0 },  // Center position: 43.75% from left edge  
    { x: SCREEN_WIDTH * 0.75, y: 0 },    // Right position: 75% from left edge
];

// Individual animated cup component - handles one cup's animation and interaction
const AnimatedCup: React.FC<{
    cupId: number;        // Unique identifier (0, 1, or 2)
    position: number;     // Current position index (0=left, 1=center, 2=right)
    onCupTap: (cupId: number) => void;  // Callback when cup is tapped
    isShuffling: boolean; // Whether cups are currently moving (disables interaction)
    hasBall: boolean;     // Whether this cup has the ball under it
    showBall: boolean;    // Whether the ball should be visible
}> = ({ cupId, position, onCupTap, isShuffling, hasBall, showBall }) => {
    // Shared values are the core of Reanimated - they persist across renders
    // and can trigger animations when changed
    const translateX = useSharedValue(CUP_POSITIONS[position].x); // Cup's X position
    const translateY = useSharedValue(CUP_POSITIONS[position].y); // Cup's Y position  
    const scale = useSharedValue(1); // Cup's scale (1 = normal size, used for tap feedback)

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

    // This effect runs whenever the 'position' prop changes
    // It smoothly animates the cup to its new position during shuffling
    React.useEffect(() => {
        const target = CUP_POSITIONS[position]; // Get target position coordinates
        
        // Animate X position with smooth easing curve
        translateX.value = withTiming(target.x, {
            duration: 600,  // Animation takes 600ms
            easing: Easing.inOut(Easing.quad),  // Smooth acceleration/deceleration
        });
        
        // Animate Y position (usually stays 0, but could be used for vertical movement)
        translateY.value = withTiming(target.y, {
            duration: 600,
            easing: Easing.inOut(Easing.quad),
        });
    }, [position]); // Only run when position changes

    // Convert animated values into actual CSS transform styles
    // This function runs on the UI thread for 60fps performance
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },  // Move horizontally
                { translateY: translateY.value },  // Move vertically
                { scale: scale.value },            // Scale up/down for tap feedback
            ],
        };
    });

    // Ball animation style - follows the cup's position and can fade in/out
    const ballAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: showBall ? 1 : 0,  // Fade ball in/out based on game state
            transform: [
                // Position ball centered horizontally under the cup
                { translateX: translateX.value + CUP_WIDTH / 2 - BALL_SIZE / 2 },
                // Position ball just below the cup (10px gap)
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

// Main Three Cup Monte game component
export const ThreeCupMonteExperiment: React.FC<ThreeCupMonteExperimentProps> = ({ onBack }) => {
    // Game state management using React hooks
    const [isShuffling, setIsShuffling] = useState(false);     // Is animation currently running?
    const [ballUnderCup, setBallUnderCup] = useState(1);       // Which cup has ball (0, 1, or 2)
    const [showBall, setShowBall] = useState(true);            // Should ball be visible?
    const [gameStarted, setGameStarted] = useState(false);     // Has game round started?
    const [gameStats, setGameStats] = useState({ correct: 0, total: 0 }); // Player statistics
    const [lastGuess, setLastGuess] = useState<{ cupId: number; correct: boolean } | null>(null); // Last guess result
    
    // Position tracking system: cupPositions[cupId] = positionIndex
    // Example: [0, 1, 2] means Cup0→Pos0, Cup1→Pos1, Cup2→Pos2 (initial state)
    // Example: [2, 0, 1] means Cup0→Pos2, Cup1→Pos0, Cup2→Pos1 (after shuffling)
    const [cupPositions, setCupPositions] = useState([0, 1, 2]);

    // Main shuffling function - creates the cup shuffling animation sequence
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
                
                // Perform the swap using destructuring assignment
                [currentPositions[cup1], currentPositions[cup2]] = 
                [currentPositions[cup2], currentPositions[cup1]];
                
                // Update state to trigger re-render and animations
                setCupPositions([...currentPositions]); // Create new array to trigger update
                
                // If this is the final swap, end the shuffling sequence
                if (index === swapSequence.length - 1) {
                    setTimeout(() => {
                        setIsShuffling(false); // Re-enable interactions
                    }, 700); // Wait for final animation to complete
                }
            }, index * 700); // Stagger each swap by 700ms for visible movement
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
    };

    // Main UI render - creates the game interface
    return (
        <SafeAreaView style={styles.container}>
            {/* Header with back button and title */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Three Cup Monte</Text>
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
                    {/* Render three cups, each with its current position */}
                    {[0, 1, 2].map((cupId) => (
                        <AnimatedCup
                            key={cupId}                          // React key for efficient updates
                            cupId={cupId}                        // Cup identifier (0, 1, or 2)
                            position={cupPositions[cupId]}       // Current position from state array
                            onCupTap={handleCupTap}             // Tap handler function
                            isShuffling={isShuffling}           // Animation state to disable interaction
                            hasBall={cupId === ballUnderCup}    // Does this cup have the ball?
                            showBall={showBall && !gameStarted} // Show ball only before game starts
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
                        {isShuffling ? 'Shuffling...' : 'Shuffle Cups'}
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
                <Text style={styles.instructionsTitle}>How to play:</Text>
                <Text style={styles.instructionText}>• Watch the ball under the center cup</Text>
                <Text style={styles.instructionText}>• Tap "Shuffle Cups" to start the game</Text>
                <Text style={styles.instructionText}>• Track the cup with the ball as they shuffle</Text>
                <Text style={styles.instructionText}>• Tap the cup you think has the ball</Text>
            </View>
        </SafeAreaView>
    );
};

// Styles for the Three Cup Monte experiment
// Uses responsive design with percentages and shadows for depth
const styles = StyleSheet.create({
    // Main container - fills screen with light gray background
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
        height: CUP_HEIGHT + 50,
        width: SCREEN_WIDTH,
        marginBottom: 40,
        position: 'relative',
    },
    cup: {
        position: 'absolute',
        width: CUP_WIDTH,
        height: CUP_HEIGHT,
        alignItems: 'center',
    },
    cupTop: {
        width: CUP_WIDTH,
        height: 8,
        backgroundColor: '#8B4513',
        borderRadius: 4,
        marginBottom: 2,
    },
    cupBody: {
        width: CUP_WIDTH * 0.9,
        height: CUP_HEIGHT - 10,
        backgroundColor: '#A0522D',
        borderBottomLeftRadius: CUP_WIDTH * 0.1,
        borderBottomRightRadius: CUP_WIDTH * 0.1,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    shuffleButton: {
        backgroundColor: '#4A90E2',
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
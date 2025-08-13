// Import all the stuff we need to build our swipe cards app
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler'; // This handles touch gestures like swiping
import Animated, {
    useSharedValue,    // Like useState but for animations - keeps track of values that change smoothly
    useAnimatedStyle,  // Creates styles that can animate (like moving, rotating, fading)
    withSpring,        // Makes animations bouncy like a spring
    withTiming,        // Makes animations smooth over a set time
    runOnJS,          // Lets us run regular JavaScript code from animation code
    interpolate,      // Converts one range of numbers to another (like 0-100 becomes 0-1)
} from 'react-native-reanimated';

// Get the phone's screen size so we can make cards that fit nicely
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;    // Cards are 85% of screen width
const CARD_HEIGHT = SCREEN_HEIGHT * 0.6;   // Cards are 60% of screen height
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3; // How far you need to swipe before the card flies away

// This tells TypeScript what props our main component expects
interface SwipeCardsExperimentProps {
    onBack: () => void; // A function to call when user taps the back button
}

// This describes what data each card needs to have
interface CardData {
    id: number;      // Unique number to identify each card
    title: string;   // Main text on the card
    subtitle: string; // Smaller text below the title
    color: string;   // Background color of the card
    emoji: string;   // Fun emoji to show on the card
}

// Here's our deck of cards with some cool tech topics
// Think of this like a stack of trading cards, but for programming stuff!
const SAMPLE_CARDS: CardData[] = [
    { id: 1, title: 'Bella', subtitle: 'Golden Retriever • 3 years old', color: '#FFD700', emoji: '🐶' },
    { id: 2, title: 'Milo', subtitle: 'Tabby Cat • 2 years old', color: '#FFB6C1', emoji: '🐱' },
    { id: 3, title: 'Charlie', subtitle: 'Cockatiel • 1 year old', color: '#B0E0E6', emoji: '🐦' },
    { id: 4, title: 'Luna', subtitle: 'Holland Lop Rabbit • 4 years old', color: '#E6E6FA', emoji: '🐰' },
    { id: 5, title: 'Max', subtitle: 'Bearded Dragon • 5 years old', color: '#F4A460', emoji: '🦎' },
    { id: 6, title: 'Daisy', subtitle: 'Guinea Pig • 2 years old', color: '#98FB98', emoji: '🐹' },
];

// This is a single swipeable card component - like one card in a deck
const SwipeCard: React.FC<{
    card: CardData;                                    // The data for this specific card
    index: number;                                     // Which position this card is in (0 = top card)
    totalCards: number;                                // How many cards are in the stack
    onSwipe: (direction: 'left' | 'right') => void;   // Function to call when card gets swiped
}> = ({ card, index, totalCards, onSwipe }) => {
    // These are like variables that can change smoothly for animations
    // Think of them as the card's current position and appearance
    const translateX = useSharedValue(0);  // How far left/right the card has moved
    const translateY = useSharedValue(0);  // How far up/down the card has moved  
    const scale = useSharedValue(1);       // How big/small the card is (1 = normal size)
    const opacity = useSharedValue(1);     // How see-through the card is (1 = solid, 0 = invisible)

    // This handles what happens when someone drags the card with their finger
    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            // Move the card to follow the user's finger
            translateX.value = event.translationX;           // Move left/right with finger
            translateY.value = event.translationY * 0.3;     // Move up/down but only a little bit

            // Make the card slightly smaller when being dragged (feels more natural)
            const dragDistance = Math.abs(event.translationX); // How far they've dragged
            scale.value = interpolate(dragDistance, [0, SCREEN_WIDTH], [1, 0.95]); // Convert drag distance to scale
        })
        .onEnd((event) => {
            // When user lifts their finger, decide if they swiped far enough
            const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;

            if (shouldSwipe) {
                // They swiped far enough! Figure out which direction
                const direction = event.translationX > 0 ? 'right' : 'left';
                const targetX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

                // Make the card fly off the screen with smooth animations
                translateX.value = withTiming(targetX, { duration: 300 }, () => {
                    // Tell the parent component that a swipe happened (after animation finishes)
                    runOnJS(onSwipe)(direction);
                });
                translateY.value = withTiming(event.translationY * 0.5, { duration: 300 }); // Keep some vertical movement
                opacity.value = withTiming(0, { duration: 300 });                   // Fade out
                // scale.value = withTiming(0.8, { duration: 300 });                   // Shrink a bit
            } else {
                // They didn't swipe far enough, so bounce the card back to center
                translateX.value = withSpring(0);  // Spring back to center horizontally
                translateY.value = withSpring(0);  // Spring back to center vertically
                scale.value = withSpring(1);       // Return to normal size
            }
        });

    // This creates the visual style that changes as the card moves
    const animatedStyle = useAnimatedStyle(() => {
        // Make the card rotate as it's swiped (like real cards being thrown)
        const rotation = interpolate(translateX.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-30, 30]);

        return {
            transform: [
                { translateX: translateX.value },  // Move left/right
                { translateY: translateY.value },  // Move up/down
                { scale: scale.value },            // Make bigger/smaller
                { rotate: `${rotation}deg` },      // Rotate the card
            ],
            opacity: opacity.value,              // How see-through it is
            zIndex: totalCards - index,          // Stack order (top card appears above others)
        };
    });

    // This creates a colored overlay that shows when swiping (green for like, red for pass)
    const backgroundStyle = useAnimatedStyle(() => {
        // Calculate how strong the red/green overlay should be based on swipe distance
        const leftOpacity = interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [0.8, 0]);   // Red when swiping left
        const rightOpacity = interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 0.8]);   // Green when swiping right

        return {
            // Show green overlay when swiping right (like), red when swiping left (pass)
            backgroundColor: translateX.value > 0 ? `rgba(76, 175, 80, ${rightOpacity})` : `rgba(244, 67, 54, ${leftOpacity})`,
        };
    });

    // This is what actually gets drawn on screen
    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.card, animatedStyle, { backgroundColor: card.color }]}>
                {/* Colored overlay that appears when swiping */}
                <Animated.View style={[styles.cardOverlay, backgroundStyle]} />

                {/* The main content of the card */}
                <View style={styles.cardContent}>
                    <Text style={styles.cardEmoji}>{card.emoji}</Text>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>

                {/* "LIKE" text that appears when swiping right */}
                <Animated.View style={[styles.swipeIndicator, styles.likeIndicator, {
                    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]) // Fade in as you swipe right
                }]}>
                    <Text style={styles.indicatorText}>LIKE</Text>
                </Animated.View>

                {/* "PASS" text that appears when swiping left */}
                <Animated.View style={[styles.swipeIndicator, styles.passIndicator, {
                    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0]) // Fade in as you swipe left
                }]}>
                    <Text style={styles.indicatorText}>PASS</Text>
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
};

// This is the main component that holds everything together
export const SwipeCardsExperiment: React.FC<SwipeCardsExperimentProps> = ({ onBack }) => {
    // Keep track of which cards are still in the deck (starts with all of them)
    const [cards, setCards] = useState(SAMPLE_CARDS);
    // Keep track of how many likes and passes the user has made
    const [swipeStats, setSwipeStats] = useState({ likes: 0, passes: 0 });

    // This function gets called every time a card is swiped
    const handleSwipe = (direction: 'left' | 'right') => {
        // Remove the top card from the deck (the one that just got swiped)
        setCards(prev => prev.slice(1)); // slice(1) means "give me everything except the first item"

        // Update the stats - add 1 to either likes or passes depending on swipe direction
        setSwipeStats(prev => ({
            ...prev, // Keep the existing stats
            [direction === 'right' ? 'likes' : 'passes']: prev[direction === 'right' ? 'likes' : 'passes'] + 1
        }));
    };

    // Reset everything back to the beginning
    const resetCards = () => {
        setCards(SAMPLE_CARDS);           // Put all cards back in the deck
        setSwipeStats({ likes: 0, passes: 0 }); // Reset the counters to zero
    };

    // This is the main screen layout
    return (
        <SafeAreaView style={styles.container}>
            {/* Top header with back button and title */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Swipe Cards</Text>
            </View>

            {/* Stats section showing likes and passes count */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{swipeStats.likes}</Text>
                    <Text style={styles.statLabel}>Likes</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{swipeStats.passes}</Text>
                    <Text style={styles.statLabel}>Passes</Text>
                </View>
            </View>

            {/* Main area where the cards appear */}
            <View style={styles.cardContainer}>
                {cards.length === 0 ? (
                    // Show this when all cards have been swiped
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🎉</Text>
                        <Text style={styles.emptyTitle}>All done!</Text>
                        <Text style={styles.emptySubtitle}>You've swiped through all cards</Text>
                        <TouchableOpacity style={styles.resetButton} onPress={resetCards}>
                            <Text style={styles.resetButtonText}>Reset Cards</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Show up to 3 cards at once (only top one is swipeable, others are just for visual depth)
                    cards.slice(0, 3).map((card, index) => (
                        <SwipeCard
                            key={card.id}                              // Unique identifier for React
                            card={card}                                // The card data
                            index={index}                              // Position in stack (0 = top)
                            totalCards={Math.min(cards.length, 3)}    // How many cards to show
                            onSwipe={handleSwipe}                      // What to do when swiped
                        />
                    ))
                )}
            </View>

            {/* Instructions at the bottom */}
            <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>How to swipe:</Text>
                <Text style={styles.instructionText}>• Swipe right to like 👍</Text>
                <Text style={styles.instructionText}>• Swipe left to pass 👎</Text>
                <Text style={styles.instructionText}>• Cards rotate and scale as you drag</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
        padding: 20,
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    statLabel: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    cardContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    card: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cardOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
    },
    cardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    cardEmoji: {
        fontSize: 60,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    cardSubtitle: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        opacity: 0.9,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    swipeIndicator: {
        position: 'absolute',
        top: 40,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 3,
    },
    likeIndicator: {
        right: 20,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    passIndicator: {
        left: 20,
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
    indicatorText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyEmoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        marginBottom: 30,
    },
    resetButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
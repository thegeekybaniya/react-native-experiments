import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.275; // Reduced to 50% of original

// Stagger positions for the deck - each card is slightly lower and smaller
const CARD_POSITIONS = [
    { translateY: 0, scale: 1.0, zIndex: 5 },      // Top card - fully visible
    { translateY: 15, scale: 0.95, zIndex: 4 },    // Second card - slightly behind
    { translateY: 30, scale: 0.90, zIndex: 3 },    // Third card
    { translateY: 45, scale: 0.85, zIndex: 2 },    // Fourth card
    { translateY: 60, scale: 0.80, zIndex: 1 },    // Bottom card - most hidden
];

interface CardDeckExperimentProps {
    onBack: () => void;
}

interface CardData {
    id: number;
    title: string;
    subtitle: string;
    color: string;
    emoji: string;
}

// Example credit card data for the deck
const DECK_CARDS: CardData[] = [
    {
        id: 1,
        title: 'Visa Platinum',
        subtitle: '**** 1234  Exp: 12/26',
        color: '#1A1F71', // Visa blue
        emoji: '💳', // Credit card emoji
    },
    {
        id: 2,
        title: 'Mastercard Gold',
        subtitle: '**** 5678  Exp: 09/25',
        color: '#F79E1B', // Mastercard orange
        emoji: '🏦', // Bank emoji
    },
    {
        id: 3,
        title: 'American Express',
        subtitle: '**** 9012  Exp: 03/27',
        color: '#2E77BB', // Amex blue
        emoji: '🛡️', // Shield emoji
    },
    {
        id: 4,
        title: 'Discover Cashback',
        subtitle: '**** 3456  Exp: 07/24',
        color: '#FF6000', // Discover orange
        emoji: '💰', // Money bag emoji
    },
    {
        id: 5,
        title: 'Apple Card',
        subtitle: '**** 7890  Exp: 11/28',
        color: '#E5E5EA', // Apple Card silver/white
        emoji: '🍏', // Apple emoji
    },
];

const DeckCard: React.FC<{
    card: CardData;
    position: number; // 0 = top, 4 = bottom
    onTap: () => void;
    isAnimating: boolean;
    shouldAnimate: boolean; // Whether this card should perform the dramatic animation
}> = ({ card, position, onTap, isAnimating, shouldAnimate }) => {
    // Ensure position is within bounds
    const safePosition = Math.max(0, Math.min(position, CARD_POSITIONS.length - 1));
    const initialPosition = CARD_POSITIONS[safePosition];

    const translateY = useSharedValue(initialPosition.translateY);
    const scale = useSharedValue(initialPosition.scale);
    const zIndex = useSharedValue(initialPosition.zIndex);
    const rotation = useSharedValue(0);

    const tapGesture = Gesture.Tap()
        .enabled(!isAnimating && position === 0) // Only top card is tappable
        .onStart(() => {
            runOnJS(onTap)();
        });

    // Perform dramatic animation when shouldAnimate becomes true
    React.useEffect(() => {
        if (shouldAnimate && position === 0) {
            // Step 1: Move up 1.3x card height with 15° rotation
            translateY.value = withSpring(-CARD_HEIGHT * 1.3, {
                damping: 12,
                stiffness: 100,
            }, (finished) => {
                'worklet';
                if (finished) {
                    // Step 2: After upward animation completes, move behind deck
                    zIndex.value = -1; // Direct assignment instead of animation to avoid precision issues
                    
                    // Move to bottom position with proper sequencing
                    translateY.value = withSpring(CARD_POSITIONS[4].translateY, {
                        damping: 15,
                        stiffness: 120,
                    });
                    scale.value = withSpring(CARD_POSITIONS[4].scale, {
                        damping: 15,
                        stiffness: 120,
                    });
                    rotation.value = withSpring(0, {
                        damping: 15,
                        stiffness: 120,
                    });
                }
            });
            
            rotation.value = withSpring(15, {
                damping: 12,
                stiffness: 100,
            });
        }
    }, [shouldAnimate]);

    // Animate to new position when position changes (for non-animating cards)
    React.useEffect(() => {
        if (!shouldAnimate) {
            const safePos = Math.max(0, Math.min(position, CARD_POSITIONS.length - 1));
            const targetPosition = CARD_POSITIONS[safePos];

            translateY.value = withSpring(targetPosition.translateY, {
                damping: 15,
                stiffness: 150,
            });
            scale.value = withSpring(targetPosition.scale, {
                damping: 15,
                stiffness: 150,
            });
            zIndex.value = targetPosition.zIndex;
            rotation.value = withSpring(0, {
                damping: 15,
                stiffness: 150,
            });
        }
    }, [position, shouldAnimate]);

    const animatedStyle = useAnimatedStyle(() => {
        // Add precision safeguards to prevent arithmetic conversion errors
        const clampedTranslateY = Math.max(-10000, Math.min(10000, translateY.value));
        const clampedScale = Math.max(0.1, Math.min(10, scale.value));
        const clampedRotation = Math.max(-360, Math.min(360, rotation.value));
        const clampedZIndex = Math.max(-100, Math.min(100, Math.round(zIndex.value)));
        
        return {
            transform: [
                { translateY: clampedTranslateY },
                { scale: clampedScale },
                { rotate: `${clampedRotation}deg` },
            ],
            zIndex: clampedZIndex,
        };
    });

    return (
        <GestureDetector gesture={tapGesture}>
            <Animated.View style={[styles.card, animatedStyle, { backgroundColor: card.color }]}>
                <View style={styles.cardContent}>
                    <Text style={styles.cardEmoji}>{card.emoji}</Text>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>

                {/* Tap indicator for top card */}
                {position === 0 && !isAnimating && (
                    <View style={styles.tapIndicator}>
                        <Text style={styles.tapText}>TAP</Text>
                    </View>
                )}
            </Animated.View>
        </GestureDetector>
    );
};

export const CardDeckExperiment: React.FC<CardDeckExperimentProps> = ({ onBack }) => {
    const [cardOrder, setCardOrder] = useState([0, 1, 2, 3, 4]); // Indices of cards in order from top to bottom
    const [isAnimating, setIsAnimating] = useState(false);
    const [animatingCardId, setAnimatingCardId] = useState<number | null>(null);
    const [cycleCount, setCycleCount] = useState(0);

    const handleCardTap = () => {
        if (isAnimating) return; // Prevent multiple taps during animation
        
        setIsAnimating(true);

        // Mark the top card for animation
        const topCardIndex = cardOrder[0];
        setAnimatingCardId(DECK_CARDS[topCardIndex].id);

        // Use more reliable timing based on spring animation duration
        setTimeout(() => {
            setCardOrder(prev => {
                const [topCard, ...restCards] = prev;
                return [...restCards, topCard];
            });
        }, 650); // Slightly shorter for better responsiveness

        setCycleCount(prev => prev + 1);

        // Reset animation state after all animations complete
        setTimeout(() => {
            setIsAnimating(false);
            setAnimatingCardId(null);
        }, 1200); // Reduced timing to prevent accumulation
    };

    const resetDeck = () => {
        setCardOrder([0, 1, 2, 3, 4]);
        setCycleCount(0);
        setIsAnimating(false);
        setAnimatingCardId(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Card Deck</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{cycleCount}</Text>
                    <Text style={styles.statLabel}>Cycles</Text>
                </View>
                <TouchableOpacity style={styles.resetButton} onPress={resetDeck}>
                    <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.deckContainer}>
                {cardOrder.map((cardIndex, position) => (
                    <DeckCard
                        key={DECK_CARDS[cardIndex].id}
                        card={DECK_CARDS[cardIndex]}
                        position={position}
                        onTap={handleCardTap}
                        isAnimating={isAnimating}
                        shouldAnimate={animatingCardId === DECK_CARDS[cardIndex].id}
                    />
                ))}
            </View>

            <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>How it works:</Text>
                <Text style={styles.instructionText}>• Tap the top card to cycle it to the back</Text>
                <Text style={styles.instructionText}>• Cards animate upward then move to back of stack</Text>
                <Text style={styles.instructionText}>• Continuous loop with smooth depth transitions</Text>
                <Text style={styles.instructionText}>• Each card maintains proper layering and scaling</Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
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
    resetButton: {
        backgroundColor: '#e74c3c',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    deckContainer: {
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
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
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
    tapIndicator: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    tapText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
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
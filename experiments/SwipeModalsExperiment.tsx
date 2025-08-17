// React core imports for component creation and state management
import React, { useState } from 'react';
// React Native components for UI and layout
import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity, 
    SafeAreaView, 
    Dimensions,
    StatusBar
} from 'react-native';
// Gesture handling for swipe detection
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
// Animation library for smooth modal transitions
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
} from 'react-native-reanimated';

// Get device dimensions for responsive modal sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// TypeScript interface for component props
interface SwipeModalsExperimentProps {
    onBack: () => void; // Callback to return to main menu
}

// Type for modal directions
type ModalDirection = 'left' | 'right' | 'top' | 'bottom' | null;

// Modal content data for each direction
const MODAL_CONTENT = {
    left: {
        title: 'Left Panel',
        subtitle: 'Settings & Options',
        icon: '⚙️',
        content: 'This modal slides in from the left side. Perfect for navigation menus, settings panels, or sidebar content.',
        backgroundColor: '#4A90E2',
        items: ['Profile Settings', 'App Preferences', 'Privacy Options', 'Account Details']
    },
    right: {
        title: 'Right Panel',
        subtitle: 'Quick Actions',
        icon: '⚡',
        content: 'This modal slides in from the right side. Great for quick actions, filters, or contextual tools.',
        backgroundColor: '#E94560',
        items: ['Share Content', 'Quick Edit', 'Favorite Item', 'More Options']
    },
    top: {
        title: 'Top Panel',
        subtitle: 'Notifications',
        icon: '🔔',
        content: 'This modal slides down from the top. Ideal for notifications, alerts, or status updates.',
        backgroundColor: '#2ECC71',
        items: ['New Message', 'System Update', 'Friend Request', 'Achievement Unlocked']
    },
    bottom: {
        title: 'Bottom Panel',
        subtitle: 'Action Sheet',
        icon: '📋',
        content: 'This modal slides up from the bottom. Perfect for action sheets, forms, or additional content.',
        backgroundColor: '#F39C12',
        items: ['Add New Item', 'Upload Photo', 'Create Post', 'Scan QR Code']
    }
};

// Main Swipe Modals Experiment Component
export const SwipeModalsExperiment: React.FC<SwipeModalsExperimentProps> = ({ onBack }) => {
    // State for tracking which modal is currently open
    const [activeModal, setActiveModal] = useState<ModalDirection>(null);

    // Animation values for each modal direction
    const leftModalX = useSharedValue(-SCREEN_WIDTH);
    const rightModalX = useSharedValue(SCREEN_WIDTH);
    const topModalY = useSharedValue(-SCREEN_HEIGHT);
    const bottomModalY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    // Open modal from specified direction
    const openModal = (direction: ModalDirection) => {
        if (!direction || activeModal) return; // Prevent opening if already open
        
        setActiveModal(direction);
        
        // Show backdrop
        backdropOpacity.value = withTiming(0.5, { duration: 300 });
        
        // Animate modal into view based on direction
        switch (direction) {
            case 'left':
                leftModalX.value = withSpring(0, { damping: 20, stiffness: 150 });
                break;
            case 'right':
                rightModalX.value = withSpring(0, { damping: 20, stiffness: 150 });
                break;
            case 'top':
                topModalY.value = withSpring(0, { damping: 20, stiffness: 150 });
                break;
            case 'bottom':
                bottomModalY.value = withSpring(0, { damping: 20, stiffness: 150 });
                break;
        }
    };

    // Close currently active modal
    const closeModal = () => {
        if (!activeModal) return;
        
        // Hide backdrop
        backdropOpacity.value = withTiming(0, { duration: 300 });
        
        // Animate modal out of view based on direction
        switch (activeModal) {
            case 'left':
                leftModalX.value = withSpring(-SCREEN_WIDTH, { damping: 20, stiffness: 150 });
                break;
            case 'right':
                rightModalX.value = withSpring(SCREEN_WIDTH, { damping: 20, stiffness: 150 });
                break;
            case 'top':
                topModalY.value = withSpring(-SCREEN_HEIGHT, { damping: 20, stiffness: 150 });
                break;
            case 'bottom':
                bottomModalY.value = withSpring(SCREEN_HEIGHT, { damping: 20, stiffness: 150 });
                break;
        }
        
        // Clear active modal after animation
        setTimeout(() => setActiveModal(null), 400);
    };

    // Single gesture handler for edge swipes - more reliable approach
    const edgeSwipeGesture = Gesture.Pan()
        .maxPointers(1)
        .enabled(!activeModal) // Only when no modal is open
        .onBegin((event) => {
            'worklet';
            // Store initial touch position for edge detection
        })
        .onEnd((event) => {
            'worklet';
            // Calculate where the gesture started
            const startX = event.absoluteX - event.translationX;
            const startY = event.absoluteY - event.translationY;
            
            // Define edge zones
            const EDGE_THRESHOLD = 50;
            const SWIPE_THRESHOLD = 80;
            
            // Check for left edge swipe (swipe right from left edge)
            if (startX < EDGE_THRESHOLD && event.translationX > SWIPE_THRESHOLD) {
                runOnJS(openModal)('left');
                return;
            }
            
            // Check for right edge swipe (swipe left from right edge)  
            if (startX > SCREEN_WIDTH - EDGE_THRESHOLD && event.translationX < -SWIPE_THRESHOLD) {
                runOnJS(openModal)('right');
                return;
            }
            
            // Check for top edge swipe (swipe down from top edge)
            if (startY < EDGE_THRESHOLD + 100 && event.translationY > SWIPE_THRESHOLD) { // +100 for status bar area
                runOnJS(openModal)('top');
                return;
            }
            
            // Check for bottom edge swipe (swipe up from bottom edge)
            if (startY > SCREEN_HEIGHT - EDGE_THRESHOLD && event.translationY < -SWIPE_THRESHOLD) {
                runOnJS(openModal)('bottom');
                return;
            }
        });

    // Gesture for dismissing modals by swiping them back out
    const dismissGesture = Gesture.Pan()
        .enabled(!!activeModal)
        .onUpdate((event) => {
            'worklet';
            if (!activeModal) return;
            
            // Only allow dismissal in the correct direction
            switch (activeModal) {
                case 'left':
                    if (event.translationX < 0) {
                        leftModalX.value = Math.max(event.translationX, -SCREEN_WIDTH);
                    }
                    break;
                case 'right':
                    if (event.translationX > 0) {
                        rightModalX.value = Math.min(event.translationX, SCREEN_WIDTH);
                    }
                    break;
                case 'top':
                    if (event.translationY < 0) {
                        topModalY.value = Math.max(event.translationY, -SCREEN_HEIGHT);
                    }
                    break;
                case 'bottom':
                    if (event.translationY > 0) {
                        bottomModalY.value = Math.min(event.translationY, SCREEN_HEIGHT);
                    }
                    break;
            }
            
            // Update backdrop opacity based on modal position
            const progress = Math.abs(
                activeModal === 'left' ? leftModalX.value / -SCREEN_WIDTH :
                activeModal === 'right' ? rightModalX.value / SCREEN_WIDTH :
                activeModal === 'top' ? topModalY.value / -SCREEN_HEIGHT :
                bottomModalY.value / SCREEN_HEIGHT
            );
            backdropOpacity.value = interpolate(progress, [0, 1], [0.5, 0]);
        })
        .onEnd((event) => {
            'worklet';
            if (!activeModal) return;
            
            // Determine if we should dismiss or snap back
            const threshold = 150;
            let shouldDismiss = false;
            
            switch (activeModal) {
                case 'left':
                    shouldDismiss = event.translationX < -threshold;
                    break;
                case 'right':
                    shouldDismiss = event.translationX > threshold;
                    break;
                case 'top':
                    shouldDismiss = event.translationY < -threshold;
                    break;
                case 'bottom':
                    shouldDismiss = event.translationY > threshold;
                    break;
            }
            
            if (shouldDismiss) {
                runOnJS(closeModal)();
            } else {
                // Snap back to open position
                switch (activeModal) {
                    case 'left':
                        leftModalX.value = withSpring(0, { damping: 20, stiffness: 150 });
                        break;
                    case 'right':
                        rightModalX.value = withSpring(0, { damping: 20, stiffness: 150 });
                        break;
                    case 'top':
                        topModalY.value = withSpring(0, { damping: 20, stiffness: 150 });
                        break;
                    case 'bottom':
                        bottomModalY.value = withSpring(0, { damping: 20, stiffness: 150 });
                        break;
                }
                backdropOpacity.value = withTiming(0.5, { duration: 200 });
            }
        });

    // Animated styles for each modal
    const leftModalStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: leftModalX.value }],
    }));

    const rightModalStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: rightModalX.value }],
    }));

    const topModalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: topModalY.value }],
    }));

    const bottomModalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: bottomModalY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    // Render modal content
    const renderModalContent = (direction: ModalDirection) => {
        if (!direction) return null;
        const content = MODAL_CONTENT[direction];
        
        return (
            <View style={[styles.modalContent, { backgroundColor: content.backgroundColor }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalIcon}>{content.icon}</Text>
                    <View style={styles.modalTitleContainer}>
                        <Text style={styles.modalTitle}>{content.title}</Text>
                        <Text style={styles.modalSubtitle}>{content.subtitle}</Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.modalDescription}>{content.content}</Text>
                
                <View style={styles.modalItems}>
                    {content.items.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.modalItem}>
                            <Text style={styles.modalItemText}>{item}</Text>
                            <Text style={styles.modalItemArrow}>→</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Swipe Modals</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Main content area with gesture detection */}
            <GestureDetector gesture={edgeSwipeGesture}>
                <View style={styles.mainContent}>
                    <Text style={styles.instructionTitle}>Swipe from screen edges to open modals</Text>
                    
                    {/* Directional buttons for easy testing */}
                    <View style={styles.buttonGrid}>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity 
                                style={[styles.directionButton, { backgroundColor: MODAL_CONTENT.top.backgroundColor }]}
                                onPress={() => openModal('top')}
                            >
                                <Text style={styles.buttonIcon}>↑</Text>
                                <Text style={styles.buttonText}>Top Modal</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.buttonRow}>
                            <TouchableOpacity 
                                style={[styles.directionButton, { backgroundColor: MODAL_CONTENT.left.backgroundColor }]}
                                onPress={() => openModal('left')}
                            >
                                <Text style={styles.buttonIcon}>←</Text>
                                <Text style={styles.buttonText}>Left Modal</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.directionButton, { backgroundColor: MODAL_CONTENT.right.backgroundColor }]}
                                onPress={() => openModal('right')}
                            >
                                <Text style={styles.buttonIcon}>→</Text>
                                <Text style={styles.buttonText}>Right Modal</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.buttonRow}>
                            <TouchableOpacity 
                                style={[styles.directionButton, { backgroundColor: MODAL_CONTENT.bottom.backgroundColor }]}
                                onPress={() => openModal('bottom')}
                            >
                                <Text style={styles.buttonIcon}>↓</Text>
                                <Text style={styles.buttonText}>Bottom Modal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Swipe zones indicators */}
                    <View style={styles.swipeZones}>
                        <View style={[styles.swipeZone, styles.leftZone]}>
                            <Text style={styles.zoneText}>Swipe →</Text>
                        </View>
                        <View style={[styles.swipeZone, styles.rightZone]}>
                            <Text style={styles.zoneText}>← Swipe</Text>
                        </View>
                        <View style={[styles.swipeZone, styles.topZone]}>
                            <Text style={styles.zoneText}>Swipe ↓</Text>
                        </View>
                        <View style={[styles.swipeZone, styles.bottomZone]}>
                            <Text style={styles.zoneText}>↑ Swipe</Text>
                        </View>
                    </View>
                </View>
            </GestureDetector>

            {/* Backdrop */}
            {activeModal && (
                <Animated.View style={[styles.backdrop, backdropStyle]}>
                    <TouchableOpacity 
                        style={styles.backdropTouchable} 
                        onPress={closeModal}
                        activeOpacity={1}
                    />
                </Animated.View>
            )}

            {/* Modals */}
            <GestureDetector gesture={dismissGesture}>
                <View style={styles.modalsContainer} pointerEvents={activeModal ? 'auto' : 'none'}>
                    {/* Left Modal */}
                    <Animated.View style={[styles.leftModal, leftModalStyle]}>
                        {renderModalContent('left')}
                    </Animated.View>

                    {/* Right Modal */}
                    <Animated.View style={[styles.rightModal, rightModalStyle]}>
                        {renderModalContent('right')}
                    </Animated.View>

                    {/* Top Modal */}
                    <Animated.View style={[styles.topModal, topModalStyle]}>
                        {renderModalContent('top')}
                    </Animated.View>

                    {/* Bottom Modal */}
                    <Animated.View style={[styles.bottomModal, bottomModalStyle]}>
                        {renderModalContent('bottom')}
                    </Animated.View>
                </View>
            </GestureDetector>
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
    },
    backButtonText: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: '500',
    },
    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
        marginLeft: -52,
    },
    headerSpacer: {
        width: 52,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    instructionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: 40,
    },
    buttonGrid: {
        alignItems: 'center',
        marginBottom: 40,
    },
    buttonRow: {
        flexDirection: 'row',
        marginBottom: 15,
        gap: 15,
    },
    directionButton: {
        width: 120,
        height: 80,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    buttonIcon: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    buttonText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
    },
    swipeZones: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    swipeZone: {
        position: 'absolute',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        borderColor: 'rgba(74, 144, 226, 0.3)',
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    leftZone: {
        left: 0,
        top: 100,
        bottom: 100,
        width: 50,
        borderRightWidth: 2,
    },
    rightZone: {
        right: 0,
        top: 100,
        bottom: 100,
        width: 50,
        borderLeftWidth: 2,
    },
    topZone: {
        top: 0,
        left: 50,
        right: 50,
        height: 50,
        borderBottomWidth: 2,
    },
    bottomZone: {
        bottom: 0,
        left: 50,
        right: 50,
        height: 50,
        borderTopWidth: 2,
    },
    zoneText: {
        fontSize: 10,
        color: '#4A90E2',
        fontWeight: '600',
        textAlign: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
    },
    backdropTouchable: {
        flex: 1,
    },
    modalsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    leftModal: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: SCREEN_WIDTH * 0.8,
    },
    rightModal: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: SCREEN_WIDTH * 0.8,
    },
    topModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.4,
    },
    bottomModal: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.6,
    },
    modalContent: {
        flex: 1,
        padding: 20,
        paddingTop: 60, // Account for status bar
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalIcon: {
        fontSize: 32,
        marginRight: 15,
    },
    modalTitleContainer: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    modalDescription: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 24,
        marginBottom: 30,
    },
    modalItems: {
        gap: 12,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 16,
        borderRadius: 12,
    },
    modalItemText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    modalItemArrow: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: 'bold',
    },
});

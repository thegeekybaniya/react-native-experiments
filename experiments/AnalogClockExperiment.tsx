// Import React and essential hooks for component lifecycle and state management
import React, { useState, useEffect } from 'react';
// React Native components for building the user interface
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
// Gesture handling for interactive clock manipulation
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
// Advanced animation library for smooth, performant animations
import Animated, {
    useSharedValue,           // Shared values that persist across re-renders and drive animations
    useAnimatedStyle,         // Creates animated styles that respond to shared value changes
    withTiming,              // Smooth timing-based animations
    withSpring,              // Physics-based spring animations for natural feel
    runOnJS,                 // Bridge between animation worklet and JS thread
    useDerivedValue,         // Computed values that automatically update when dependencies change
} from 'react-native-reanimated';

// Get device screen dimensions for responsive layout
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Calculate clock size as 70% of screen width, ensuring it fits well on all devices
const CLOCK_SIZE = SCREEN_WIDTH * 0.7;
// Clock center point (half the size since we position from top-left)
const CLOCK_CENTER = CLOCK_SIZE / 2;

// Define the props interface for type safety
interface AnalogClockExperimentProps {
    onBack: () => void; // Callback function to return to main menu
}

// Helper function to convert angle in degrees to radians for trigonometric calculations
const degreesToRadians = (degrees: number) => {
    'worklet';
    return (degrees * Math.PI) / 180;
};

// Helper function to calculate the endpoint of a clock hand based on angle and length
// Returns {x, y} coordinates relative to clock center
const getHandPosition = (angle: number, length: number) => {
    'worklet';
    // Subtract 90 degrees because 0° points to 3 o'clock, but we want 12 o'clock as 0°
    const radians = degreesToRadians(angle - 90);
    return {
        x: Math.cos(radians) * length,  // Horizontal component
        y: Math.sin(radians) * length,  // Vertical component
    };
};

// Main Analog Clock Experiment Component
export const AnalogClockExperiment: React.FC<AnalogClockExperimentProps> = ({ onBack }) => {
    // State to track whether we're in manual mode (user can set time) or auto mode (real-time)
    const [isManualMode, setIsManualMode] = useState(false);
    // Keep track of which hand user is currently dragging (if any)
    const [isDraggingHand, setIsDraggingHand] = useState<'hour' | 'minute' | null>(null);
    // State for digital time display (to avoid worklet issues)
    const [displayTime, setDisplayTime] = useState({ hours: 12, minutes: 0, seconds: 0 });

    // Shared values for hand angles (in degrees)
    // These drive the rotation animations of each clock hand
    const hourAngle = useSharedValue(0);     // Hour hand: 0-360° (12 hours)
    const minuteAngle = useSharedValue(0);   // Minute hand: 0-360° (60 minutes)
    const secondAngle = useSharedValue(0);   // Second hand: 0-360° (60 seconds)
    const draggingHand = useSharedValue('none'); // Track which hand is being dragged: 'hour', 'minute', or 'none'

    // Previous second angle to handle wrap-around
    const prevSecondAngle = useSharedValue(0);

    // Helper function to update display time from current hand angles
    const updateDisplayFromAngles = () => {
        const hours = Math.floor((hourAngle.value % 360) / 30) || 12;
        const minutes = Math.floor((minuteAngle.value % 360) / 6);
        const seconds = Math.floor((secondAngle.value % 360) / 6);
        setDisplayTime({ hours, minutes, seconds });
    };

    // Update clock hands to show current real time
    const updateToCurrentTime = () => {
        const now = new Date();
        const hours = now.getHours() % 12; // Convert to 12-hour format
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // Calculate angles for each hand
        // Hour hand moves 30° per hour (360° / 12 hours) plus additional movement based on minutes
        const newHourAngle = (hours * 30) + (minutes * 0.5); // 0.5° per minute for smooth hour hand movement
        // Minute hand moves 6° per minute (360° / 60 minutes)
        const newMinuteAngle = minutes * 6;
        // Second hand moves 6° per second (360° / 60 seconds)
        let newSecondAngle = seconds * 6;

        // Handle seconds hand wrap-around to prevent backwards animation
        // If we're going from 59 seconds (354°) to 0 seconds (0°), add 360° to make it go forward
        if (prevSecondAngle.value > 300 && newSecondAngle < 60) {
            // We've wrapped around from 59 to 0, add 360° to continue forward
            newSecondAngle += 360;
        }
        
        // Update previous angle for next comparison
        prevSecondAngle.value = newSecondAngle % 360;

        // Reset dragging state
        draggingHand.value = 'none';
        setIsDraggingHand(null);

        // Update display time immediately and synchronously
        setDisplayTime({ hours: hours || 12, minutes, seconds });

        // Animate hands to new positions with smooth spring animations
        hourAngle.value = withSpring(newHourAngle, { damping: 15, stiffness: 150 });
        minuteAngle.value = withSpring(newMinuteAngle, { damping: 15, stiffness: 150 });
        
        // Use withTiming for seconds hand to ensure smooth, consistent movement
        secondAngle.value = withTiming(newSecondAngle, { 
            duration: 200 // Quick, smooth transition
        }, (finished) => {
            'worklet';
            if (finished) {
                // Normalize angle after animation completes to prevent infinite growth
                secondAngle.value = secondAngle.value % 360;
            }
        });
    };

    // Set up real-time clock updates when in automatic mode
    useEffect(() => {
        if (!isManualMode) {
            // Update immediately when switching to auto mode
            updateToCurrentTime();
            
            // Set up interval to update every second
            const interval = setInterval(updateToCurrentTime, 1000);
            
            // Cleanup interval when component unmounts or mode changes
            return () => clearInterval(interval);
        }
    }, [isManualMode]);

    // Initialize clock with current time when component mounts
    useEffect(() => {
        // Initialize previous second angle
        const now = new Date();
        const seconds = now.getSeconds();
        prevSecondAngle.value = seconds * 6;
        
        updateToCurrentTime();
        // Also update display from angles to ensure sync
        updateDisplayFromAngles();
    }, []);

    // Unified gesture handler for the entire clock face
    const clockGesture = Gesture.Pan()
        .enabled(isManualMode)
        .onStart((event) => {
            'worklet';
            // Calculate touch position relative to clock center
            const deltaX = event.x - CLOCK_CENTER;
            const deltaY = event.y - CLOCK_CENTER;
            const touchDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Simpler hand selection based on distance from center
            // If touch is closer to center, select hour hand, otherwise minute hand
            const hourHandLength = CLOCK_CENTER * 0.5;
            
            if (touchDistance < hourHandLength + 30) {
                // Close to center - select hour hand
                draggingHand.value = 'hour';
                runOnJS(setIsDraggingHand)('hour');
            } else {
                // Further from center - select minute hand
                draggingHand.value = 'minute';
                runOnJS(setIsDraggingHand)('minute');
            }
        })
        .onUpdate((event) => {
            'worklet';
            // Calculate angle from center of clock to current touch position
            const deltaX = event.x - CLOCK_CENTER;
            const deltaY = event.y - CLOCK_CENTER;
            
            // Use atan2 to get angle in radians, then convert to degrees
            let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            // Adjust so 0° points to 12 o'clock instead of 3 o'clock
            angle += 90;
            // Ensure angle is in 0-360° range
            if (angle < 0) angle += 360;
            
            if (draggingHand.value === 'hour') {
                // Update hour hand angle with minute precision
                const currentMinutes = (minuteAngle.value % 360) / 6;
                const baseHourAngle = Math.floor(angle / 30) * 30; // Get base hour
                hourAngle.value = baseHourAngle + (currentMinutes * 0.5);
                
                // Update digital display
                runOnJS(updateDisplayFromAngles)();
            } else if (draggingHand.value === 'minute') {
                minuteAngle.value = angle;
                
                // Update hour hand to reflect the new minute position
                const currentHour = Math.floor(hourAngle.value / 30);
                const newMinutes = angle / 6;
                hourAngle.value = (currentHour * 30) + (newMinutes * 0.5);
                
                // Update digital display
                runOnJS(updateDisplayFromAngles)();
            }
        })
        .onEnd(() => {
            'worklet';
            if (draggingHand.value === 'hour') {
                // Snap hour hand to nearest hour position
                const snapAngle = Math.round(hourAngle.value / 30) * 30;
                hourAngle.value = withSpring(snapAngle, { damping: 15, stiffness: 200 }, () => {
                    'worklet';
                    // Update display after snap animation completes
                    runOnJS(updateDisplayFromAngles)();
                });
            } else if (draggingHand.value === 'minute') {
                // Snap minute hand to nearest 5-minute mark
                const snapAngle = Math.round(minuteAngle.value / 30) * 30;
                minuteAngle.value = withSpring(snapAngle, { damping: 15, stiffness: 200 });
                
                // Update hour hand accordingly
                const currentHour = Math.floor(hourAngle.value / 30);
                const newMinutes = snapAngle / 6;
                hourAngle.value = withSpring((currentHour * 30) + (newMinutes * 0.5), { damping: 15, stiffness: 200 }, () => {
                    'worklet';
                    // Update display after snap animation completes
                    runOnJS(updateDisplayFromAngles)();
                });
            }
            
            // Clear dragging state
            draggingHand.value = 'none';
            runOnJS(setIsDraggingHand)(null);
        });

    // Animated style for hour hand rotation
    const hourHandStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${hourAngle.value}deg` }, // Rotate based on current angle
            ],
            // Highlight hand when being dragged
            opacity: isDraggingHand === 'hour' ? 0.8 : 1,
        };
    });

    // Animated style for minute hand rotation
    const minuteHandStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${minuteAngle.value}deg` },
            ],
            opacity: isDraggingHand === 'minute' ? 0.8 : 1,
        };
    });

    // Animated style for second hand rotation (not interactive, just follows time)
    const secondHandStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${secondAngle.value}deg` },
            ],
        };
    });

    // Toggle between manual and automatic time modes
    const toggleMode = () => {
        setIsManualMode(!isManualMode);
        setIsDraggingHand(null);
        draggingHand.value = 'none';
        
        // When switching back to auto mode, sync with current time
        if (isManualMode) {
            updateToCurrentTime();
        }
    };

    // Render individual hour markers (1-12) around the clock face
    const renderHourMarkers = () => {
        const markers = [];
        for (let i = 1; i <= 12; i++) {
            // Calculate position for each hour marker
            const angle = (i * 30) - 90; // 30° per hour, offset by 90° for 12 o'clock start
            const radians = degreesToRadians(angle);
            const radius = CLOCK_CENTER - 30; // Position markers inside the clock rim
            
            // Calculate x,y position for this marker
            const x = CLOCK_CENTER + Math.cos(radians) * radius;
            const y = CLOCK_CENTER + Math.sin(radians) * radius;
            
            markers.push(
                <View
                    key={i}
                    style={[
                        styles.hourMarker,
                        {
                            left: x - 8, // Center the marker (half of marker width)
                            top: y - 8,  // Center the marker (half of marker height)
                        },
                    ]}
                >
                    <Text style={styles.hourMarkerText}>{i}</Text>
                </View>
            );
        }
        return markers;
    };

    // Render minute tick marks around the clock (every 5 minutes)
    const renderMinuteTicks = () => {
        const ticks = [];
        for (let i = 0; i < 60; i += 5) { // Every 5 minutes
            const angle = (i * 6) - 90; // 6° per minute
            const radians = degreesToRadians(angle);
            const tickRadius = CLOCK_CENTER - 15; // Position ticks on the rim
            
            // Calculate center position for each tick
            const x = CLOCK_CENTER + Math.cos(radians) * tickRadius;
            const y = CLOCK_CENTER + Math.sin(radians) * tickRadius;
            
            ticks.push(
                <View
                    key={i}
                    style={[
                        styles.minuteTick,
                        {
                            left: x - 1, // Center the tick (half of tick width)
                            top: y - 5,  // Center the tick (half of tick height)
                            transform: [{ rotate: `${angle + 90}deg` }], // Rotate tick to point toward center
                        },
                    ]}
                />
            );
        }
        return ticks;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with back button and title */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Analog Clock</Text>
            </View>

            {/* Digital time display for reference */}
            <View style={styles.digitalTimeContainer}>
                <Text style={styles.digitalTime}>
                    {displayTime.hours.toString().padStart(2, '0')}:
                    {displayTime.minutes.toString().padStart(2, '0')}:
                    {displayTime.seconds.toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity style={styles.modeButton} onPress={toggleMode}>
                    <Text style={styles.modeButtonText}>
                        {isManualMode ? 'Switch to Auto' : 'Switch to Manual'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Main clock container */}
            <View style={styles.clockContainer}>
                <GestureDetector gesture={clockGesture}>
                    <View style={styles.clock}>
                        {/* Clock face background */}
                        <View style={styles.clockFace} />
                        
                        {/* Hour markers and minute ticks */}
                        {renderHourMarkers()}
                        {renderMinuteTicks()}
                        
                        {/* Clock hands */}
                        {/* Hour hand with visual feedback */}
                        <Animated.View style={[styles.hourHandContainer, hourHandStyle]}>
                            <View style={[styles.hourHand, isDraggingHand === 'hour' && styles.handHighlight]} />
                            {isManualMode && (
                                <View style={[styles.handTouchArea, isDraggingHand === 'hour' && styles.activeHandTouchArea]} />
                            )}
                        </Animated.View>
                        
                        {/* Minute hand with visual feedback */}
                        <Animated.View style={[styles.minuteHandContainer, minuteHandStyle]}>
                            <View style={[styles.minuteHand, isDraggingHand === 'minute' && styles.handHighlight]} />
                            {isManualMode && (
                                <View style={[styles.handTouchArea, isDraggingHand === 'minute' && styles.activeHandTouchArea]} />
                            )}
                        </Animated.View>
                        
                        {/* Second hand (non-interactive) */}
                        <Animated.View style={[styles.secondHand, secondHandStyle]} />
                        
                        {/* Center dot */}
                        <View style={styles.centerDot} />
                    </View>
                </GestureDetector>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>How it works:</Text>
                <Text style={styles.instructionText}>
                    • Auto mode: Clock shows real time with precise second-by-second updates
                </Text>
                <Text style={styles.instructionText}>
                    • Manual mode: Touch near any hand to grab and drag it
                </Text>
                <Text style={styles.instructionText}>
                    • Active hand highlights in blue during dragging
                </Text>
                <Text style={styles.instructionText}>
                    • Hands snap to clean positions when released
                </Text>
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
    digitalTimeContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    digitalTime: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50',
        fontFamily: 'monospace', // Monospace font for consistent digit spacing
        marginBottom: 15,
    },
    modeButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    modeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    clockContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    clock: {
        width: CLOCK_SIZE,
        height: CLOCK_SIZE,
        position: 'relative',
    },
    clockFace: {
        width: CLOCK_SIZE,
        height: CLOCK_SIZE,
        borderRadius: CLOCK_SIZE / 2,
        backgroundColor: '#fff',
        borderWidth: 8,
        borderColor: '#34495e',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    hourMarker: {
        position: 'absolute',
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hourMarkerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    minuteTick: {
        position: 'absolute',
        backgroundColor: '#7f8c8d',
        width: 2,
        height: 10,
    },
    hourHandContainer: {
        position: 'absolute',
        width: CLOCK_CENTER, // Full width for easier touch detection
        height: CLOCK_CENTER * 0.6, // Slightly larger than hand for touch area
        left: CLOCK_CENTER / 2, // Center the container
        top: CLOCK_CENTER - (CLOCK_CENTER * 0.6), // Position from center
        transformOrigin: 'bottom center', // Rotate around bottom center point
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    hourHand: {
        width: 8, // Slightly thicker for easier visibility
        height: CLOCK_CENTER * 0.5, // Hour hand is 50% of radius
        backgroundColor: '#2c3e50',
        borderRadius: 4,
        position: 'absolute',
        bottom: 0,
    },
    minuteHandContainer: {
        position: 'absolute',
        width: CLOCK_CENTER, // Full width for easier touch detection
        height: CLOCK_CENTER * 0.8, // Slightly larger than hand for touch area
        left: CLOCK_CENTER / 2, // Center the container
        top: CLOCK_CENTER - (CLOCK_CENTER * 0.8), // Position from center
        transformOrigin: 'bottom center',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    minuteHand: {
        width: 6, // Slightly thicker for easier visibility
        height: CLOCK_CENTER * 0.75, // Minute hand is 75% of radius
        backgroundColor: '#34495e',
        borderRadius: 3,
        position: 'absolute',
        bottom: 0,
    },
    handTouchArea: {
        position: 'absolute',
        width: 40, // Large touch area
        height: '100%',
        backgroundColor: 'rgba(74, 144, 226, 0.2)', // Semi-transparent blue in manual mode
        borderRadius: 20,
    },
    activeHandTouchArea: {
        backgroundColor: 'rgba(74, 144, 226, 0.4)', // Brighter when being dragged
    },
    handHighlight: {
        backgroundColor: '#4A90E2', // Bright blue when being dragged
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 8,
    },
    secondHand: {
        position: 'absolute',
        width: 2,
        height: CLOCK_CENTER * 0.8, // Second hand is 80% of radius
        backgroundColor: '#e74c3c', // Red color for second hand
        left: CLOCK_CENTER - 1,
        top: CLOCK_CENTER - (CLOCK_CENTER * 0.8),
        borderRadius: 1,
        transformOrigin: 'bottom center',
    },
    centerDot: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2c3e50',
        left: CLOCK_CENTER - 6, // Center the dot
        top: CLOCK_CENTER - 6,
        zIndex: 1, // Lower z-index so it doesn't interfere with hand touches
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

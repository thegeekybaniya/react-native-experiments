// Import all the tools we need to make things move and respond to touch
import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// Get the phone screen size so we know the boundaries
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// This defines what options you can pass to our component
interface DraggableZoomableProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

// Main component: makes any content draggable and zoomable
// minScale: Can shrink to half size (default: 0.5)
// maxScale: Can grow to 3x size (default: 3)  
// initialScale: Starts at normal size (default: 1)
export const DraggableZoomable: React.FC<DraggableZoomableProps> = ({
  children,
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1
}) => {
  // These are like variables that can change smoothly and trigger animations
  // Think of them as the "memory" of where things are and how big they are

  // Current position (how far left/right and up/down from center)
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Current and saved zoom level
  const scale = useSharedValue(initialScale);
  const savedScale = useSharedValue(initialScale);

  // Remember position when dragging starts (so we can add to it, not replace it)
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // DRAGGING: This handles when someone drags with their finger
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // When dragging starts, remember where we currently are
      // (so we can add the drag distance to this starting point)
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      // While dragging, move the item by adding the drag distance
      // to where we started from
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      // When dragging stops, make sure we don't go too far off screen
      const maxTranslateX = SCREEN_WIDTH / 2;
      const maxTranslateY = SCREEN_HEIGHT / 2;

      // Bounce back to screen if we went too far (with smooth spring animation)
      translateX.value = withSpring(
        Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX.value))
      );
      translateY.value = withSpring(
        Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY.value))
      );
    });

  // PINCH TO ZOOM: This handles when someone pinches with two fingers
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      // Remember how zoomed we were when pinching started
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      // Calculate new zoom level: starting zoom × pinch amount
      // (event.scale = 1 means no change, 2 means twice as big, 0.5 means half size)
      const newScale = savedScale.value * event.scale;

      // Make sure zoom stays within our limits (not too small or too big)
      scale.value = Math.max(minScale, Math.min(maxScale, newScale));
    })
    .onEnd(() => {
      // Add a smooth spring animation when pinching stops
      scale.value = withSpring(scale.value);
    });

  // DOUBLE TAP: This handles when someone taps twice quickly
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > initialScale) {
        // If we're zoomed in, double tap resets everything back to normal
        scale.value = withSpring(initialScale);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        // If we're at normal size, double tap zooms in to 70% of max zoom
        scale.value = withSpring(maxScale * 0.7);
      }
    });

  // COMBINE ALL GESTURES: Allow dragging, pinching, and double-tapping at the same time
  const composedGesture = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    doubleTapGesture
  );

  // ANIMATION STYLE: This converts our values into actual visual changes
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

// Basic styling to center the content
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
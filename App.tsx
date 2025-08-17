import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DragZoomExperiment } from './experiments/DragZoomExperiment';
import { SwipeCardsExperiment } from './experiments/SwipeCardsExperiment';
import { CardDeckExperiment } from './experiments/CardDeckExperiment';
import { ThreeCupMonteExperiment } from './experiments/ThreeCupMonteExperiment';
import { ThreeCupMonte3DExperiment } from './experiments/ThreeCupMonte3DExperiment';
import { DrawingCanvasExperiment } from './experiments/DrawingCanvasExperiment';
import { AnalogClockExperiment } from './experiments/AnalogClockExperiment';

type Screen = 'home' | 'dragZoom' | 'swipeCards' | 'cardDeck' | 'threeCupMonte' | 'threeCupMonte3D' | 'drawingCanvas' | 'analogClock';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const renderHomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.homeContent}>
        <Text style={styles.title}>React Native Experiments</Text>
        <Text style={styles.subtitle}>Tap an experiment to try it out</Text>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.experimentsGrid}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.experimentButton}
            onPress={() => setCurrentScreen('dragZoom')}
          >
            <Text style={styles.experimentTitle}>Drag & Zoom</Text>
            <Text style={styles.experimentDescription}>
              Interactive draggable and zoomable object with gestures
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.experimentButton, { borderLeftColor: '#FF6B6B' }]}
            onPress={() => setCurrentScreen('swipeCards')}
          >
            <Text style={styles.experimentTitle}>Swipe Cards</Text>
            <Text style={styles.experimentDescription}>
              Tinder-like swipe interface with smooth animations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.experimentButton, { borderLeftColor: '#4ECDC4' }]}
            onPress={() => setCurrentScreen('cardDeck')}
          >
            <Text style={styles.experimentTitle}>Card Deck</Text>
            <Text style={styles.experimentDescription}>
              Cycling card deck with depth, scaling, and smooth transitions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.experimentButton, { borderLeftColor: '#E67E22' }]}
            onPress={() => setCurrentScreen('threeCupMonte')}
          >
            <Text style={styles.experimentTitle}>Three Cup Monte</Text>
            <Text style={styles.experimentDescription}>
              Classic shell game with animated cup shuffling and ball tracking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.experimentButton, { borderLeftColor: '#9B59B6' }]}
            onPress={() => setCurrentScreen('threeCupMonte3D')}
          >
            <Text style={styles.experimentTitle}>Three Cup Monte 3D</Text>
            <Text style={styles.experimentDescription}>
              Enhanced shell game with curved 2D animations, lift effects, and realistic movement
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.experimentButton, { borderLeftColor: '#28a745' }]}
            onPress={() => setCurrentScreen('drawingCanvas')}
          >
            <Text style={styles.experimentTitle}>Drawing Canvas</Text>
            <Text style={styles.experimentDescription}>
              Interactive drawing canvas with persistence, colors, and tools
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.experimentButton, { borderLeftColor: '#f39c12' }]}
            onPress={() => setCurrentScreen('analogClock')}
          >
            <Text style={styles.experimentTitle}>Analog Clock</Text>
            <Text style={styles.experimentDescription}>
              Interactive analog clock with real-time updates and manual time setting
            </Text>
          </TouchableOpacity>

          {/* Placeholder for future experiments */}
          <View style={[styles.experimentButton, styles.comingSoon]}>
            <Text style={[styles.experimentTitle, styles.comingSoonText]}>More Coming Soon</Text>
            <Text style={[styles.experimentDescription, styles.comingSoonText]}>
              Future experiments will appear here
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'dragZoom':
        return <DragZoomExperiment onBack={() => setCurrentScreen('home')} />;
      case 'swipeCards':
        return <SwipeCardsExperiment onBack={() => setCurrentScreen('home')} />;
      case 'cardDeck':
        return <CardDeckExperiment onBack={() => setCurrentScreen('home')} />;
      case 'threeCupMonte':
        return <ThreeCupMonteExperiment onBack={() => setCurrentScreen('home')} />;
      case 'threeCupMonte3D':
        return <ThreeCupMonte3DExperiment onBack={() => setCurrentScreen('home')} />;
      case 'drawingCanvas':
        return <DrawingCanvasExperiment onBack={() => setCurrentScreen('home')} />;
      case 'analogClock':
        return <AnalogClockExperiment onBack={() => setCurrentScreen('home')} />;
      default:
        return renderHomeScreen();
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {renderCurrentScreen()}
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  homeContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 40,
    textAlign: 'center',
  },
  experimentsGrid: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingBottom: 20,
  },
  experimentButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  comingSoon: {
    borderLeftColor: '#bdc3c7',
    opacity: 0.6,
  },
  experimentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  experimentDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  comingSoonText: {
    color: '#95a5a6',
  },
});

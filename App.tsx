import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DragZoomExperiment } from './experiments/DragZoomExperiment';
import { SwipeCardsExperiment } from './experiments/SwipeCardsExperiment';

type Screen = 'home' | 'dragZoom' | 'swipeCards';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const renderHomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.homeContent}>
        <Text style={styles.title}>React Native Experiments</Text>
        <Text style={styles.subtitle}>Tap an experiment to try it out</Text>
        
        <View style={styles.experimentsGrid}>
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
          
          {/* Placeholder for future experiments */}
          <View style={[styles.experimentButton, styles.comingSoon]}>
            <Text style={[styles.experimentTitle, styles.comingSoonText]}>More Coming Soon</Text>
            <Text style={[styles.experimentDescription, styles.comingSoonText]}>
              Future experiments will appear here
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'dragZoom':
        return <DragZoomExperiment onBack={() => setCurrentScreen('home')} />;
      case 'swipeCards':
        return <SwipeCardsExperiment onBack={() => setCurrentScreen('home')} />;
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
    padding: 20,
    alignItems: 'center',
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
    flex: 1,
    width: '100%',
    maxWidth: 400,
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

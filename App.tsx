import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DraggableZoomable } from './DraggableZoomable';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.content}>
        <DraggableZoomable minScale={0.5} maxScale={4} initialScale={1}>
          <View style={styles.draggableBox}>
            <Text style={styles.text}>Drag me around!</Text>
            <Text style={styles.subText}>Pinch to zoom</Text>
            <Text style={styles.subText}>Double tap to reset</Text>
          </View>
        </DraggableZoomable>
        <StatusBar style="auto" />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draggableBox: {
    width: 200,
    height: 200,
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
});

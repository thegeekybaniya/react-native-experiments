// React core imports for component creation and lifecycle management
import React, { useState, useEffect, useRef } from 'react';
// React Native components for UI and layout
import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity, 
    SafeAreaView, 
    Dimensions, 
    FlatList, 
    Image,
    ActivityIndicator,
    RefreshControl,
    Modal,
    StatusBar
} from 'react-native';

// Animation library for smooth transitions
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';

// Get device dimensions for responsive layout
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Calculate column width for 2-column masonry layout
const COLUMN_WIDTH = (SCREEN_WIDTH - 30) / 2; // 30 = padding + gap
const IMAGE_BASE_URL = 'https://picsum.photos'; // Free image API

// TypeScript interface for component props
interface PinterestStyleExperimentProps {
    onBack: () => void; // Callback to return to main menu
}

// Interface for image data structure
interface ImageItem {
    id: string;
    width: number;
    height: number;
    url: string;
    author: string;
    calculatedHeight: number; // Height scaled to fit our column width
}

// Interface for masonry column structure
interface MasonryColumn {
    data: ImageItem[];
    height: number; // Total height of items in this column
}

// Main Pinterest Style Experiment Component
export const PinterestStyleExperiment: React.FC<PinterestStyleExperimentProps> = ({ onBack }) => {
    // State for managing image data and UI
    const [images, setImages] = useState<ImageItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    // Refs for managing component state
    const flatListRef = useRef<FlatList>(null);

    // Animation values for modal
    const modalScale = useSharedValue(0);
    const modalOpacity = useSharedValue(0);

    // Generate random image data using Picsum API
    const generateImageData = (count: number): ImageItem[] => {
        return Array.from({ length: count }, (_, index) => {
            // Generate truly unique ID using timestamp and random number
            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`;
            // Random dimensions for varied masonry layout
            const width = 400; // Base width from API
            const height = Math.floor(Math.random() * 800) + 200; // Random height between 200 and 1000 for varied masonry effect
            // Calculate height that fits our column width
            const calculatedHeight = (height * COLUMN_WIDTH) / width;
            
            // Use a simpler random parameter for the image URL
            const randomSeed = Math.floor(Math.random() * 1000);
            
            return {
                id,
                width,
                height,
                url: `${IMAGE_BASE_URL}/${width}/${height}?random=${randomSeed}`,
                author: `Photographer ${Math.floor(Math.random() * 100) + 1}`,
                calculatedHeight,
            };
        });
    };

    // Organize images into masonry columns for balanced layout
    const organizeIntoColumns = (imageList: ImageItem[]): [MasonryColumn, MasonryColumn] => {
        const leftColumn: MasonryColumn = { data: [], height: 0 };
        const rightColumn: MasonryColumn = { data: [], height: 0 };

        // Distribute images to balance column heights
        imageList.forEach((image) => {
            if (leftColumn.height <= rightColumn.height) {
                leftColumn.data.push(image);
                leftColumn.height += image.calculatedHeight + 10; // 10 = gap between items
            } else {
                rightColumn.data.push(image);
                rightColumn.height += image.calculatedHeight + 10;
            }
        });

        return [leftColumn, rightColumn];
    };

    // Load initial images when component mounts
    useEffect(() => {
        loadImages(true);
    }, []);

    // Load images from API (or generate mock data)
    const loadImages = async (isInitial = false) => {
        if (loading) return;
        
        setLoading(true);
        
        try {
            // Simulate API loading delay for realistic experience
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const newImages = generateImageData(20); // Load 20 images at a time
            
            if (isInitial) {
                setImages(newImages);
            } else {
                setImages(prev => [...prev, ...newImages]);
            }
        } catch (error) {
            console.error('Error loading images:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle pull-to-refresh functionality
    const handleRefresh = async () => {
        setRefreshing(true);

        
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const newImages = generateImageData(20);
            setImages(newImages);
        } catch (error) {
            console.error('Error refreshing images:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Handle image tap to show in modal
    const handleImagePress = (image: ImageItem) => {
        setSelectedImage(image);
        setModalVisible(true);
        
        // Animate modal appearance
        modalScale.value = withSpring(1, { damping: 15, stiffness: 150 });
        modalOpacity.value = withTiming(1, { duration: 300 });
    };

    // Close modal with animation
    const closeModal = () => {
        modalScale.value = withTiming(0, { duration: 200 });
        modalOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
            if (finished) {
                runOnJS(setModalVisible)(false);
                runOnJS(setSelectedImage)(null);
            }
        });
    };

    // Animated styles for modal
    const modalAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: modalScale.value }],
            opacity: modalOpacity.value,
        };
    });

    // Render individual image item with touch interaction
    const renderImageItem = ({ item }: { item: ImageItem }) => {
        return (
            <TouchableOpacity
                style={[styles.imageContainer, { height: item.calculatedHeight }]}
                onPress={() => handleImagePress(item)}
                activeOpacity={0.9}
            >
                <Image
                    source={{ uri: item.url }}
                    style={styles.image}
                    resizeMode="cover"
                />
                {/* Overlay with author info */}
                <View style={styles.imageOverlay}>
                    <Text style={styles.authorText}>{item.author}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    // Render masonry column
    const renderColumn = (columnData: ImageItem[]) => {
        return (
            <View style={styles.column}>
                {columnData.map((item) => (
                    <View key={item.id}>
                        {renderImageItem({ item })}
                    </View>
                ))}
            </View>
        );
    };

    // Organize images into columns for display
    const [leftColumn, rightColumn] = organizeIntoColumns(images);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Header with back button and title */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Pinterest Style</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Stats bar showing loaded images count */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{images.length}</Text>
                    <Text style={styles.statLabel}>Photos</Text>
                </View>
                <TouchableOpacity 
                    style={styles.loadMoreButton} 
                    onPress={() => loadImages(false)}
                    disabled={loading}
                >
                    <Text style={styles.loadMoreText}>
                        {loading ? 'Loading...' : 'Load More'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Main masonry grid content */}
            <FlatList
                ref={flatListRef}
                data={[{ key: 'masonry' }]} // Single item to render our custom layout
                renderItem={() => (
                    <View style={styles.masonryContainer}>
                        {renderColumn(leftColumn.data)}
                        {renderColumn(rightColumn.data)}
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#4A90E2']}
                        tintColor="#4A90E2"
                    />
                }
                showsVerticalScrollIndicator={false}
                onEndReached={() => {
                    if (!loading) {
                        loadImages(false);
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => 
                    loading ? (
                        <View style={styles.loadingFooter}>
                            <ActivityIndicator size="large" color="#4A90E2" />
                            <Text style={styles.loadingText}>Loading more photos...</Text>
                        </View>
                    ) : null
                }
            />

            {/* Modal for full-size image viewing */}
            <Modal
                visible={modalVisible}
                transparent={true}
                statusBarTranslucent={true}
                onRequestClose={closeModal}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity 
                        style={styles.modalBackdrop} 
                        activeOpacity={1}
                        onPress={closeModal}
                    />
                    
                    <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
                        {selectedImage && (
                            <>
                                <Image
                                    source={{ uri: selectedImage.url }}
                                    style={styles.modalImage}
                                    resizeMode="contain"
                                />
                                <View style={styles.modalInfo}>
                                    <Text style={styles.modalAuthor}>{selectedImage.author}</Text>
                                    <Text style={styles.modalDimensions}>
                                        {selectedImage.width} × {selectedImage.height}
                                    </Text>
                                </View>
                                
                                <TouchableOpacity 
                                    style={styles.modalCloseButton}
                                    onPress={closeModal}
                                >
                                    <Text style={styles.modalCloseText}>✕</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </Animated.View>
                </View>
            </Modal>


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
        marginLeft: -52, // Compensate for back button width to center title
    },
    headerSpacer: {
        width: 52, // Same width as back button for balance
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8ed',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    statLabel: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    loadMoreButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    loadMoreText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    masonryContainer: {
        flexDirection: 'row',
        padding: 10,
        gap: 10,
    },
    column: {
        flex: 1,
        gap: 10,
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 8,
    },
    authorText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    loadingFooter: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#7f8c8d',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        width: SCREEN_WIDTH * 0.9,
        height: SCREEN_HEIGHT * 0.8,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    modalImage: {
        flex: 1,
        width: '100%',
    },
    modalInfo: {
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e1e8ed',
    },
    modalAuthor: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 4,
    },
    modalDimensions: {
        fontSize: 14,
        color: '#7f8c8d',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

});

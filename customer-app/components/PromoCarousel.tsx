import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Linking } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 40;

const BANNERS = [
  { id: '1', title: '50% OFF BEYOND BURGER', subtitle: 'Valid until 9 PM tonight!', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=600&auto=format&fit=crop', color: '#0891b2', link: 'https://www.uber.com' },
  { id: '2', title: 'FREE DELIVERY WEEKEND', subtitle: 'All drone missions over 5 km!', image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=600&auto=format&fit=crop', color: '#10b981', link: 'https://glovoapp.com' },
  { id: '3', title: 'NEWRY PHARMACY LIVE', subtitle: 'Same day medicine delivery.', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?q=80&w=600&auto=format&fit=crop', color: '#8b5cf6', link: 'https://www.goodrx.com' },
];

export const PromoCarousel = () => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= BANNERS.length) {
        nextIndex = 0;
      }
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 5000); // Change ad every 5 seconds

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handlePress = (link: string) => {
      Linking.openURL(link);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={BANNERS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / CAROUSEL_WIDTH);
            setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { backgroundColor: item.color }]} onPress={() => handlePress(item.link)}>
            <ExpoImage source={item.image} style={styles.image} contentFit="cover" transition={300} />
            <View style={styles.overlay}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 180, marginBottom: 20 },
  card: { width: CAROUSEL_WIDTH, height: 180, borderRadius: 24, overflow: 'hidden', marginRight: 20 },
  image: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  overlay: { flex: 1, padding: 25, justifyContent: 'flex-end' },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, fontWeight: 'bold' },
});

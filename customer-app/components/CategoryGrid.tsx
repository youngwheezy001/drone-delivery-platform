import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 60) / 3;

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory: (id: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onSelectCategory }) => {
  return (
    <View style={styles.grid}>
      {categories.map(cat => (
        <TouchableOpacity 
          key={cat.id} 
          style={styles.tile}
          onPress={() => onSelectCategory(cat.id)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.5)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.tileTag}>
            <Text style={[styles.tileTagText, { color: cat.color }]}>{cat.tag}</Text>
          </View>
          <LinearGradient colors={[cat.color + '30', 'transparent']} style={styles.iconCircle}>
            <Ionicons name={cat.icon as any} size={28} color={cat.color} />
          </LinearGradient>
          <Text style={styles.tileText}>{cat.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 15, 
    paddingHorizontal: 20, 
    justifyContent: 'space-between' 
  },
  tile: { 
    width: TILE_SIZE, 
    height: TILE_SIZE + 35, 
    borderRadius: 35, 
    padding: 15, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)', 
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden'
  },
  tileTag: { 
    position: 'absolute', 
    top: 15, 
    right: 15 
  },
  tileTagText: { 
    fontSize: 7, 
    fontWeight: '900',
    letterSpacing: 0.5
  },
  iconCircle: { 
    width: 65, 
    height: 65, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)'
  },
  tileText: { 
    color: '#f8fafc', 
    fontSize: 12, 
    fontWeight: '900',
    letterSpacing: -0.2
  },
});

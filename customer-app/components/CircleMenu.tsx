import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const MENU_SIZE = width * 0.85;
const BUBBLE_SIZE = 85;

interface Sector {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'ion' | 'mci';
}

const SECTORS: Sector[] = [
  { id: 'pizza', name: 'Pizza', icon: 'pizza', color: '#ff4444', type: 'mci' },
  { id: 'pharmacy', name: 'Medicine', icon: 'medical', color: '#00ffcc', type: 'ion' },
  { id: 'groceries', name: 'Groceries', icon: 'cart', color: '#fbbf24', type: 'ion' },
  { id: 'burger', name: 'Food', icon: 'hamburger', color: '#f97316', type: 'mci' },
  { id: 'drinks', name: 'Drinks', icon: 'beer', color: '#3b82f6', type: 'mci' },
  { id: 'health', name: 'Health', icon: 'heart-pulse', color: '#ec4899', type: 'mci' },
  { id: 'anything', name: 'Anything', icon: 'cube-scan', color: '#fff', type: 'mci' }, // Center Bubble
];

interface CircleMenuProps {
  onSelect: (id: string) => void;
}

export const CircleMenu: React.FC<CircleMenuProps> = ({ onSelect }) => {
  const renderBubble = (sector: Sector, index: number) => {
    const isCenter = sector.id === 'anything';
    const angle = (index * 60) * (Math.PI / 180);
    const radius = MENU_SIZE * 0.38;
    
    const x = isCenter ? 0 : Math.cos(angle) * radius;
    const y = isCenter ? 0 : Math.sin(angle) * radius;

    return (
      <TouchableOpacity 
        key={sector.id}
        style={[
          styles.bubbleContainer, 
          { 
            transform: [{ translateX: x }, { translateY: y }],
            zIndex: isCenter ? 10 : 1
          }
        ]}
        onPress={() => onSelect(sector.id)}
        activeOpacity={0.7}
      >
        <LinearGradient 
           colors={isCenter ? ['#00ffcc', '#00cccc'] : ['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.6)']} 
           style={[styles.bubble, isCenter && styles.centerBubble]}
        >
          {sector.type === 'ion' ? (
            <Ionicons name={sector.icon as any} size={isCenter ? 32 : 28} color={isCenter ? '#000' : sector.color} />
          ) : (
            <MaterialCommunityIcons name={sector.icon as any} size={isCenter ? 32 : 28} color={isCenter ? '#000' : sector.color} />
          )}
        </LinearGradient>
        {(!isCenter) && (
          <View style={styles.labelBox}>
            <Text style={styles.labelText}>{sector.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.menuRing}>
         <LinearGradient 
            colors={['rgba(0, 255, 204, 0.05)', 'transparent']} 
            style={styles.innerRing}
         />
         {SECTORS.map((s, i) => renderBubble(s, i))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    width: MENU_SIZE, 
    height: MENU_SIZE, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginVertical: 40 
  },
  menuRing: { 
    width: '100%', 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  innerRing: {
    position: 'absolute',
    width: MENU_SIZE * 0.7,
    height: MENU_SIZE * 0.7,
    borderRadius: MENU_SIZE * 0.35,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 204, 0.1)',
    borderStyle: 'dashed'
  },
  bubbleContainer: { 
    position: 'absolute', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  bubble: { 
    width: BUBBLE_SIZE, 
    height: BUBBLE_SIZE, 
    borderRadius: BUBBLE_SIZE / 2, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  centerBubble: {
    width: BUBBLE_SIZE + 10,
    height: BUBBLE_SIZE + 10,
    borderRadius: (BUBBLE_SIZE + 10) / 2,
    shadowColor: '#00ffcc',
    shadowOpacity: 0.5,
    shadowRadius: 20
  },
  labelBox: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  labelText: { 
    color: '#94a3b8', 
    fontSize: 9, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
});

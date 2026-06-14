import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, Category } from '../../types';

interface ProductModalProps {
  visible: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onUpdateProduct: (product: Product) => void;
  onSave: (product: Product) => void;
}

export const ProductModal = ({
  visible,
  product,
  categories,
  onClose,
  onUpdateProduct,
  onSave,
}: ProductModalProps) => {
  if (!product) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{product.id ? 'MOD PAYLOAD' : 'NEW NODE'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>IDENTITY</Text>
            <TextInput 
              style={styles.modalInput} 
              value={product.name} 
              onChangeText={t => onUpdateProduct({ ...product, name: t })} 
              placeholder="Product Name" 
              placeholderTextColor="#334155" 
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>PRICE (KES)</Text>
                <TextInput 
                  style={styles.modalInput} 
                  keyboardType="numeric" 
                  value={product.price?.toString()} 
                  onChangeText={t => onUpdateProduct({ ...product, price: parseFloat(t) || 0 })} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>WEIGHT (KG)</Text>
                <TextInput 
                  style={styles.modalInput} 
                  keyboardType="numeric" 
                  value={product.weight_kg?.toString()} 
                  onChangeText={t => onUpdateProduct({ ...product, weight_kg: parseFloat(t) || 0 })} 
                />
              </View>
            </View>
            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.catRow}>
              {categories.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.catChip, product.category_id === c.id && styles.catChipActive]} 
                  onPress={() => onUpdateProduct({ ...product, category_id: c.id })}
                >
                  <Text style={{ color: product.category_id === c.id ? '#000' : '#64748b', fontSize: 10 }}>
                    {c.name.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>LOGISTICS DESCRIPTION</Text>
            <TextInput 
              style={[styles.modalInput, { height: 80 }]} 
              multiline 
              value={product.description} 
              onChangeText={t => onUpdateProduct({ ...product, description: t })} 
            />
            <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(product)}>
              <Text style={styles.saveText}>DEPLOY TO HUB</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: '#0f172a', 
    borderRadius: 30, 
    padding: 25, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  modalTitle: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '900' 
  },
  label: { 
    color: '#64748b', 
    fontSize: 9, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    marginTop: 15 
  },
  modalInput: { 
    backgroundColor: '#1e293b', 
    borderRadius: 15, 
    padding: 15, 
    color: '#fff', 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  catRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  catChip: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    backgroundColor: '#1e293b', 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  catChipActive: { 
    backgroundColor: '#00ffcc', 
    borderColor: '#00ffcc' 
  },
  saveBtn: { 
    backgroundColor: '#00ffcc', 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 30 
  },
  saveText: { 
    color: '#000', 
    fontWeight: 'bold', 
    letterSpacing: 1 
  },
});

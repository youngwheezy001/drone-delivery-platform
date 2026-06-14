import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsModalProps {
  visible: boolean;
  language: string;
  onClose: () => void;
  onSelectLanguage: (lang: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  language,
  onClose,
  onSelectLanguage,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>HUB SETTINGS</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>TACTICAL LANGUAGE</Text>
          
          <TouchableOpacity 
            style={styles.langItem} 
            onPress={() => onSelectLanguage("ENGLISH")}
          >
            <Text style={[styles.langText, language === "ENGLISH" && styles.langTextActive]}>
              ENGLISH (GLOBAL)
            </Text>
            {language === "ENGLISH" && <Ionicons name="shield-checkmark" size={16} color="#00ffcc" />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.langItem} 
            onPress={() => onSelectLanguage("SWAHILI")}
          >
            <Text style={[styles.langText, language === "SWAHILI" && styles.langTextActive]}>
              KISWAHILI (KES)
            </Text>
            {language === "SWAHILI" && <Ionicons name="shield-checkmark" size={16} color="#00ffcc" />}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveBtn} onPress={onClose}>
            <Text style={styles.saveText}>APPLY CHANGES</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 15, 
    marginTop: 15 
  },
  langItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#1e293b', 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  langText: { 
    color: '#64748b', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  langTextActive: { 
    color: '#00ffcc' 
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

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, ChatMessage } from '../../types';

interface ChatModalProps {
  visible: boolean;
  activeChatOrder: Order | null;
  chatMessages: ChatMessage[];
  tabletIdentity: string;
  chatText: string;
  onClose: () => void;
  onUpdateChatText: (text: string) => void;
  onSendMessage: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  activeChatOrder,
  chatMessages,
  tabletIdentity,
  chatText,
  onClose,
  onUpdateChatText,
  onSendMessage,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              FLIGHT-SUPPORT: {activeChatOrder?.customer_id.split('@')[0].toUpperCase()}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={{ height: 300 }} 
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.map((msg, i) => {
              const isMe = msg.sender_id === tabletIdentity;
              const isSystem = msg.sender_id === "SYSTEM";
              return (
                <View key={msg.id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', marginBottom: 15 }}>
                  <View style={{ 
                    backgroundColor: isMe ? '#fb923c' : isSystem ? '#1e293b50' : '#1e293b', 
                    padding: 12, 
                    borderRadius: 15, 
                    borderBottomRightRadius: isMe ? 0 : 15, 
                    borderBottomLeftRadius: isMe ? 15 : 0 
                  }}>
                    <Text style={{ color: isMe ? '#000' : '#fff', fontSize: 13, fontStyle: isSystem ? 'italic' : 'normal' }}>
                      {msg.message}
                    </Text>
                  </View>
                  <Text style={{ color: '#334155', fontSize: 8, marginTop: 4 }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <TextInput 
              style={[styles.modalInput, { flex: 1 }]} 
              placeholder="Transmitting support signal..." 
              placeholderTextColor="#334155" 
              value={chatText}
              onChangeText={onUpdateChatText}
            />
            <TouchableOpacity 
              style={[styles.saveBtn, { marginTop: 0, padding: 15 }]} 
              onPress={onSendMessage}
            >
              <Ionicons name="send" size={20} color="#000" />
            </TouchableOpacity>
          </View>
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
  modalInput: { 
    backgroundColor: '#1e293b', 
    borderRadius: 15, 
    padding: 15, 
    color: '#fff', 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  saveBtn: { 
    backgroundColor: '#00ffcc', 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 30 
  },
});

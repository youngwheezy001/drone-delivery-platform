import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Config } from '../constants/Config';
import { router } from 'expo-router';

const MOCK_MESSAGES = [
  { id: '1', text: 'Hello! Welcome to Tustar Support.', sender: 'system' },
  { id: '2', text: 'How can we help you with your drone mission today?', sender: 'system' },
];

export default function SupportChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now().toString(), text: inputText, sender: 'user' };
    setMessages([...messages, userMsg]);
    setInputText("");
    setIsSending(true);

    // 🔴 AUTO-LOG AS BACKEND COMPLAINT
    try {
      await fetch(`${Config.HTTP_URL}/api/v1/marketplace/complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subject: "Live Chat Session", 
          description: `User Message: ${inputText}` 
        })
      });

      // Simple AI support logic
      setTimeout(() => {
        const aiMsg = { 
          id: (Date.now()+1).toString(), 
          text: "Understood. Our logistics hub has logged this request. An operator will review your mission coordinates shortly.", 
          sender: 'system' 
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsSending(false);
      }, 1500);
    } catch (e) {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Live Chat</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>TUSTAR OPS ONLINE</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={scrollRef}
        style={styles.chatArea} 
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.msgWrapper, msg.sender === 'user' ? styles.userWrapper : styles.systemWrapper]}>
            <View style={[styles.msgBubble, msg.sender === 'user' ? styles.userBubble : styles.systemBubble]}>
              <Text style={[styles.msgText, msg.sender === 'system' && {color: '#fff'}]}>{msg.text}</Text>
            </View>
            <Text style={styles.msgTime}>Just now</Text>
          </View>
        ))}
        {isSending && <ActivityIndicator color="#00ffcc" style={{ alignSelf: 'flex-start', marginLeft: 20 }} />}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={100}>
        <View style={styles.inputArea}>
          <TextInput 
            style={styles.input} 
            placeholder="Describe your issue..." 
            placeholderTextColor="#64748b" 
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
            <Ionicons name="send" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
  onlineText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' },
  
  chatArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  msgWrapper: { marginBottom: 20, maxWidth: '80%' },
  userWrapper: { alignSelf: 'flex-end' },
  systemWrapper: { alignSelf: 'flex-start' },
  msgBubble: { padding: 15, borderRadius: 24 },
  userBubble: { backgroundColor: '#00ffcc', borderBottomRightRadius: 4 },
  systemBubble: { backgroundColor: '#1e293b', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#334155' },
  msgText: { fontSize: 14, fontWeight: '600', color: '#000', lineHeight: 20 },
  msgTime: { color: '#334155', fontSize: 9, marginTop: 4, textTransform: 'uppercase', fontWeight: 'bold' },
  
  inputArea: { flexDirection: 'row', padding: 20, backgroundColor: '#111827', alignItems: 'center', gap: 15, borderTopWidth: 1, borderTopColor: '#1e293b' },
  input: { flex: 1, backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#00ffcc', alignItems: 'center', justifyContent: 'center' },
});

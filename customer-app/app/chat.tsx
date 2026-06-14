import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Config } from '../constants/Config';

export default function ChatScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { orderId, hubId } = params;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchHistory();
    connectWS();
    return () => ws.current?.close();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${Config.HTTP_URL}/api/v1/chat/history/${orderId}`);
      if (res.ok) setMessages(await res.json());
    } catch (e) {}
  };

  const connectWS = () => {
    const socket = new WebSocket(`${Config.WS_URL}/api/v1/chat/ws/${user?.email}`);
    ws.current = socket;

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => {
      setIsConnected(false);
      setTimeout(connectWS, 3000); // Auto-reconnect
    };
    
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages(prev => [...prev, data]);
    };
  };

  const sendMessage = () => {
    if (!inputText.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      if (ws.current?.readyState !== WebSocket.OPEN) {
        Alert.alert("Link Failure", "Neural uplink is synchronizing. Please standby.");
      }
      return;
    }
    
    const payload = {
      order_id: orderId,
      recipient_id: hubId,
      message: inputText
    };

    ws.current.send(JSON.stringify(payload));
    
    // Optimistic UI update
    const optimisticMsg = {
      id: Date.now().toString(),
      sender_id: user?.email,
      message: inputText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInputText("");
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{hubId?.toString().toUpperCase()}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#00ffcc' : '#ef4444' }]} />
            <Text style={styles.statusText}>{isConnected ? 'UPLINK ACTIVE' : 'RECONNECTING...'}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={{ padding: 20 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.email;
          return (
            <View key={msg.id || i} style={[styles.msgRow, isMe ? styles.msgMe : styles.msgThem]}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.msgText, isMe ? styles.textMe : styles.textThem]}>{msg.message}</Text>
              </View>
              <Text style={styles.timeText}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput 
          style={styles.input}
          placeholder="Transmitting signal..."
          placeholderTextColor="#64748b"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { color: '#64748b', fontSize: 9, fontWeight: 'bold' },

  chatArea: { flex: 1 },
  msgRow: { marginBottom: 20, maxWidth: '80%' },
  msgMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  
  bubble: { padding: 15, borderRadius: 20, borderBottomLeftRadius: 5 },
  bubbleMe: { backgroundColor: '#00ffcc', borderBottomLeftRadius: 20, borderBottomRightRadius: 5 },
  bubbleThem: { backgroundColor: '#1e293b', borderBottomLeftRadius: 5 },
  
  msgText: { fontSize: 15, fontWeight: '500' },
  textMe: { color: '#000' },
  textThem: { color: '#fff' },
  timeText: { color: '#334155', fontSize: 9, fontWeight: 'bold', marginTop: 5 },

  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 40, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b' },
  input: { flex: 1, backgroundColor: '#1e293b', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, color: '#fff', fontSize: 16, marginRight: 15, maxHeight: 100 },
  sendBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#00ffcc', alignItems: 'center', justifyContent: 'center' }
});

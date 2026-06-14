import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const POSIntegrationPanel = () => {
  const [isAutoDispatch, setIsAutoDispatch] = useState(false);
  const [apiKey, setApiKey] = useState("tustar_sk_live_9x8f7d6e5c4b3a21");

  const regenerateKey = () => {
    setApiKey(`tustar_sk_live_${Math.random().toString(36).substring(2, 15)}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="code-working-outline" size={32} color="#00ffcc" />
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.title}>ENTERPRISE POS API</Text>
          <Text style={styles.subtitle}>Directly link your native systems (Agiza, Oracle, etc.) to the Swarm Grid.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>API ACCESS KEY</Text>
        <Text style={styles.cardDesc}>Use this key to authenticate your POS payloads.</Text>
        
        <View style={styles.keyBox}>
          <Text style={styles.keyText}>{apiKey}</Text>
          <TouchableOpacity onPress={regenerateKey}>
            <Ionicons name="refresh" size={20} color="#00ffcc" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>ZERO-CLICK DISPATCH</Text>
            <Text style={styles.cardDesc}>If enabled, drones will autonomously launch the millisecond an order is rung up on your POS, skipping the manual 'Stage on Pad' confirmation.</Text>
          </View>
          <Switch 
            value={isAutoDispatch}
            onValueChange={setIsAutoDispatch}
            trackColor={{ false: "#1e293b", true: "#00ffcc50" }}
            thumbColor={isAutoDispatch ? "#00ffcc" : "#64748b"}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>EXAMPLE CURL PAYLOAD</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>
{`curl -X POST https://api.tustar.io/v1/dispatch \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "POS-9941",
    "customer_lat": -1.2921,
    "customer_lon": 36.7884,
    "payload_weight_kg": 1.2
  }'`}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingHorizontal: 5 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: '#64748b', fontSize: 10, fontWeight: 'bold', marginTop: 4, maxWidth: '90%' },
  
  card: { backgroundColor: '#0f172a', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#1e293b' },
  cardTitle: { color: '#94a3b8', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  cardDesc: { color: '#64748b', fontSize: 11, marginBottom: 15, lineHeight: 16 },
  
  keyBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#00ffcc30' },
  keyText: { color: '#00ffcc', fontSize: 13, fontFamily: 'monospace', fontWeight: 'bold' },
  
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  
  codeBlock: { backgroundColor: '#000', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
  codeText: { color: '#38bdf8', fontSize: 11, fontFamily: 'monospace', lineHeight: 18 }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types';
import { StatusBadge } from '../Shared/StatusBadge';

interface OrderCardProps {
  order: Order;
  onChat: (order: Order) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onChat, onUpdateStatus }) => {
  const isScheduled = order.status === "SCHEDULED";
  
  // --- FINANCIER UPGRADES STATE ---
  const [showCGCheck, setShowCGCheck] = useState(false);
  const [cgWeightInput, setCgWeightInput] = useState("");
  const [isVerifyingCG, setIsVerifyingCG] = useState(false);
  const [cgError, setCgError] = useState("");
  const [liveTemp, setLiveTemp] = useState("4.2");

  // Simulate Cold-Chain temp fluctuations
  useEffect(() => {
    if (order.status === "EN_ROUTE") {
      const interval = setInterval(() => {
        const temp = (4.0 + Math.random() * 0.8).toFixed(1);
        setLiveTemp(temp);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [order.status]);

  const runCGVerification = () => {
    if (!cgWeightInput) {
      setCgError("Input payload weight.");
      return;
    }
    const inputWeight = parseFloat(cgWeightInput);
    const expectedWeight = order.package_weight_kg || 1.2;
    
    // Allow a 10% tolerance for CG check
    if (Math.abs(inputWeight - expectedWeight) > (expectedWeight * 0.1)) {
       setCgError("CG Mismatch! Re-weigh payload.");
       return;
    }

    setCgError("");
    setIsVerifyingCG(true);
    setTimeout(() => {
       setIsVerifyingCG(false);
       setShowCGCheck(false);
       onUpdateStatus(order.id, "READY_FOR_PICKUP");
    }, 1500);
  };
  
  return (
    <View style={[styles.orderCard, isScheduled && { borderColor: '#fb923c30' }]}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>
            {order.id.includes('-') ? `#${order.id.split('-')[0].toUpperCase()}` : order.id}
          </Text>
          <Text style={styles.orderMeta}>UPLINK STABLE • 5.8 GHz</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <View>
           <Text style={styles.customerText}>TARGET: {order.customer_id}</Text>
           <Text style={[styles.orderMeta, { marginTop: 4, color: '#38bdf8' }]}>
             ⚖️ {(order.package_weight_kg || 1.2).toFixed(1)}kg  |  🗺️ {(order.distance_km || 4.5).toFixed(1)}km
           </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
           <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 16 }}>KES {(order.estimated_cost || 1200).toLocaleString()}</Text>
           <Text style={[styles.orderMeta, { fontSize: 8 }]}>NETWORK YIELD</Text>
        </View>
      </View>

      {!isScheduled && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
               {order.status !== "READY" && order.status !== "READY_FOR_PICKUP" && order.status !== "PREPARING" && (
                 <Ionicons name="radio-outline" size={14} color="#ef4444" style={{ opacity: Math.random() > 0.5 ? 1 : 0.5 }} />
               )}
               <Text style={styles.progressTitle}>
                 {order.status === "PREPARING" ? "TACTICAL PACKING" : 
                  order.status === "READY" || order.status === "READY_FOR_PICKUP" ? "STAGED FOR DEPLOYMENT" : 
                  "UAV EN-ROUTE"}
               </Text>
            </View>
             
             {/* 🌡️ COLD-CHAIN UI UPGRADE */}
             {order.status === "EN_ROUTE" && (
                <View style={styles.coldChainBadge}>
                  <Ionicons name="snow" size={10} color="#38bdf8" />
                  <Text style={styles.coldChainText}>{liveTemp}°C</Text>
                </View>
             )}

            <Text style={styles.progressValue}>
              {order.status === "READY" || order.status === "READY_FOR_PICKUP" ? "100%" : 
               order.status === "PREPARING" ? "65%" : 
               `${Math.round((order.progress || 0.4) * 100)}%`}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { 
              width: order.status === "READY" || order.status === "READY_FOR_PICKUP" ? "100%" : 
                     order.status === "PREPARING" ? "65%" : 
                     `${(order.progress || 0.4) * 100}%` 
            }]} />
          </View>
        </View>
      )}

      {order.scheduled_at && (
        <View style={styles.scheduledLabel}>
          <Ionicons name="time-outline" size={12} color="#fb923c" />
          <Text style={styles.scheduledLabelText}>
            T-MINUS: {new Date(order.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}

      <View style={styles.orderActions}>
        {/* ⚖️ CG VERIFICATION INLINE UI */}
        {showCGCheck ? (
          <View style={styles.cgCheckContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.cgTitle}>CENTER OF GRAVITY (CG) CHECK</Text>
              <TouchableOpacity onPress={() => setShowCGCheck(false)}>
                <Ionicons name="close" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.cgInputRow}>
              <TextInput 
                style={styles.cgInput} 
                placeholder="Enter Weight (kg)" 
                placeholderTextColor="#475569" 
                keyboardType="decimal-pad"
                value={cgWeightInput}
                onChangeText={setCgWeightInput}
              />
              <TouchableOpacity style={styles.cgVerifyBtn} onPress={runCGVerification} disabled={isVerifyingCG}>
                {isVerifyingCG ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.cgVerifyText}>VERIFY</Text>
                )}
              </TouchableOpacity>
            </View>
            {cgError ? <Text style={styles.cgErrorText}>{cgError}</Text> : null}
          </View>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.chatAction}
              onPress={() => onChat(order)}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#00ffcc" />
              <Text style={styles.chatActionText}>COMMS</Text>
            </TouchableOpacity>

            {order.status === "DISPATCHED" && (
              <TouchableOpacity 
                style={styles.mainAction} 
                onPress={() => onUpdateStatus(order.id, "PREPARING")}
              >
                <Text style={styles.mainActionText}>START PACKING</Text>
              </TouchableOpacity>
            )}
            
            {order.status === "PREPARING" && (
              <TouchableOpacity 
                style={[styles.mainAction, { backgroundColor: '#f97316' }]} 
                onPress={() => onUpdateStatus(order.id, "READY")}
              >
                <Text style={[styles.mainActionText, { color: '#fff' }]}>MARK READY</Text>
              </TouchableOpacity>
            )}

            {order.status === "READY" && (
              <TouchableOpacity 
                style={[styles.mainAction, { backgroundColor: '#38bdf8' }]} 
                onPress={() => setShowCGCheck(true)}
              >
                <Text style={[styles.mainActionText, { color: '#fff' }]}>STAGE ON PAD</Text>
              </TouchableOpacity>
            )}

            {order.status === "READY_FOR_PICKUP" && (
              <TouchableOpacity 
                style={[styles.mainAction, { backgroundColor: '#8b5cf6' }]} 
                onPress={() => onUpdateStatus(order.id, "EN_ROUTE")}
              >
                <Text style={[styles.mainActionText, { color: '#fff' }]}>SIMULATE DISPATCH (UAV)</Text>
              </TouchableOpacity>
            )}

            {order.status === "EN_ROUTE" && (
              <TouchableOpacity 
                style={[styles.mainAction, { backgroundColor: '#10b981' }]} 
                onPress={() => onUpdateStatus(order.id, "DELIVERED")}
              >
                <Text style={[styles.mainActionText, { color: '#fff' }]}>CONFIRM DROP-OFF</Text>
              </TouchableOpacity>
            )}

            {order.status === "DELIVERED" && (
              <View style={[styles.mainAction, { backgroundColor: '#1e293b' }]}>
                <Text style={[styles.mainActionText, { color: '#10b981' }]}>MISSION ACCOMPLISHED</Text>
              </View>
            )}

            {isScheduled && (
              <TouchableOpacity 
                style={[styles.mainAction, { backgroundColor: '#fb923c' }]} 
                onPress={() => onUpdateStatus(order.id, "DISPATCHED")}
              >
                <Text style={[styles.mainActionText, { color: '#000' }]}>PRIORITIZE NOW</Text>
              </TouchableOpacity>
            )}
          </  >
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  orderCard: { 
    backgroundColor: '#0f172a', 
    padding: 20, 
    borderRadius: 25, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  orderHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  orderId: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  orderMeta: { 
    color: '#475569', 
    fontSize: 8, 
    fontWeight: 'bold', 
    marginTop: 2 
  },
  customerText: { 
    color: '#94a3b8', 
    fontSize: 12, 
    marginTop: 15, 
    fontWeight: 'bold' 
  },
  progressSection: { 
    marginTop: 20 
  },
  progressHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8 
  },
  progressTitle: { 
    color: '#64748b', 
    fontSize: 8, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
  progressValue: { 
    color: '#00ffcc', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  progressBarBg: { 
    height: 4, 
    backgroundColor: '#1e293b', 
    borderRadius: 2, 
    overflow: 'hidden' 
  },
  progressBarFill: { 
    height: '100%', 
    backgroundColor: '#00ffcc' 
  },
  scheduledLabel: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#fb923c10', 
    padding: 8, 
    borderRadius: 8, 
    marginTop: 10 
  },
  scheduledLabelText: { 
    color: '#fb923c', 
    fontSize: 9, 
    fontWeight: 'bold' 
  },
  orderActions: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 25 
  },
  chatAction: { 
    flex: 1, 
    backgroundColor: '#0f172a', 
    borderColor: '#1e293b', 
    borderWidth: 1, 
    borderRadius: 15, 
    padding: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10 
  },
  chatActionText: { 
    color: '#00ffcc', 
    fontSize: 11, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
  mainAction: { 
    flex: 2, 
    backgroundColor: '#00ffcc', 
    borderRadius: 15, 
    padding: 15, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  mainActionText: { 
    color: '#000', 
    fontSize: 11, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
  
  // Financier Upgrades Styles
  coldChainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  coldChainText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: 'bold'
  },
  cgCheckContainer: {
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    width: '100%'
  },
  cgTitle: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10
  },
  cgInputRow: {
    flexDirection: 'row',
    gap: 10
  },
  cgInput: {
    flex: 1,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    color: '#fff',
    paddingHorizontal: 15,
    fontSize: 12,
    fontWeight: 'bold'
  },
  cgVerifyBtn: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10
  },
  cgVerifyText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  cgErrorText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 8
  }
});

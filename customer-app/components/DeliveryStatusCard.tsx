import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlightPhase } from '../types';

interface DeliveryStatusCardProps {
  status: FlightPhase;
  missionId: string;
  eta: string;
  scheduledAt?: string;
  progress: number; // 0 to 1
  onContactHub: () => void;
  aiAssessment?: any;
}

export const DeliveryStatusCard: React.FC<DeliveryStatusCardProps> = ({
  status,
  missionId,
  eta,
  scheduledAt,
  progress,
  onContactHub,
  aiAssessment
}) => {
  const isCritical = aiAssessment?.risk_score > 60;
  
  const [winchDepth, setWinchDepth] = useState(12.5);
  const [winchStatus, setWinchStatus] = useState<"LOWERING" | "RELEASED" | "SYNCING">("LOWERING");
  
  const handleOpticalSync = async () => {
    try {
      setWinchStatus("SYNCING");
      const res = await fetch(`http://10.0.7.147:8000/api/v1/deliveries/${missionId}/optical-sync`, { method: 'POST' });
      if (res.ok) {
        setWinchStatus("RELEASED");
      } else {
        setWinchStatus("LOWERING");
      }
    } catch(e) {
      setWinchStatus("LOWERING");
    }
  };

  useEffect(() => {
    if ((status === "ARRIVED" || status === "ARRIVED_AT_DROPZONE") && winchStatus === "LOWERING") {
      const interval = setInterval(() => {
        setWinchDepth((prev) => {
          if (prev <= 0.5) {
            clearInterval(interval);
            // Don't auto-release if ARRIVED_AT_DROPZONE (Optical Sync required)
            if (status !== "ARRIVED_AT_DROPZONE") {
               setWinchStatus("RELEASED");
            }
            return 0.0;
          }
          return prev - 0.5;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [status, winchStatus]);

  return (
    <View style={styles.container}>
      {/* Risk HUD Layer */}
      {status === "SCHEDULED" && aiAssessment && (
        <View style={[styles.aiHud, isCritical && styles.aiHudCritical]}>
           <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                 <Ionicons name="shield-checkmark" size={14} color={isCritical ? "#ef4444" : "#00ffcc"} />
                 <Text style={[styles.hudTitle, isCritical && {color: '#ef4444'}]}>AI_RELIABILITY_OS</Text>
              </View>
              <Text style={styles.riskScore}>{100 - aiAssessment.risk_score}% CONFIDENCE</Text>
           </View>
           
           <View style={styles.windowBox}>
              <Text style={styles.windowLab}>OPTIMAL_DISPATCH_WINDOW</Text>
              <Text style={styles.windowTime}>
                 {aiAssessment.optimal_delay > 0 
                    ? `+${aiAssessment.optimal_delay} MIN (RECO)` 
                    : "IMMEDIATE_CLEARANCE"}
              </Text>
           </View>
        </View>
      )}

      <View style={styles.missionHeader}>
        <View style={styles.pulseContainer}>
          <View style={styles.pulse} />
          <Text style={styles.liveTag}>MISSION_LOCKED</Text>
        </View>
        <Text style={styles.etaText}>ETA: {eta}</Text>
      </View>
      
      {status === "ARRIVED" || status === "ARRIVED_AT_DROPZONE" ? (
        <View style={styles.tetherContainer}>
          {winchStatus === "LOWERING" ? (
            <>
              <View style={styles.tetherWarningBox}>
                <Ionicons name="warning" size={20} color="#eab308" />
                <Text style={styles.tetherWarningText}>WINCH UNWINDING • DO NOT APPROACH</Text>
              </View>
              <Text style={styles.tetherDepthText}>Tether Length: {winchDepth.toFixed(1)}m</Text>
            </>
          ) : winchStatus === "SYNCING" ? (
            <View style={styles.tetherSyncBox}>
              <Ionicons name="scan-circle" size={24} color="#0ea5e9" />
              <Text style={styles.tetherSyncText}>SYNCING TARGET...</Text>
            </View>
          ) : winchStatus === "RELEASED" ? (
            <View style={styles.tetherSuccessBox}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.tetherSuccessText}>RELEASE SUCCESSFUL</Text>
              <Text style={styles.tetherSubText}>Safe to retrieve payload.</Text>
            </View>
          ) : null}

          {status === "ARRIVED_AT_DROPZONE" && winchDepth === 0 && winchStatus === "LOWERING" && (
            <TouchableOpacity style={styles.syncBtn} onPress={handleOpticalSync}>
              <Ionicons name="scan" size={20} color="#fff" />
              <Text style={styles.syncBtnText}>OPTICAL SYNC DROPZONE</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : status === "DELIVERED" ? (
         <Text style={styles.statusSuccess}>MISSION_ACCOMPLISHED</Text>
      ) : (
        <Text style={styles.statusMain}>
          {status === "SCHEDULED" ? "QUEUED_FOR_SORTIE" : status.replace('_', ' ')}
        </Text>
      )}
      <Text style={styles.missionId}>M_ID: {missionId.substring(0,10).toUpperCase()}</Text>
      
      <TouchableOpacity style={styles.chatBtn} onPress={onContactHub}>
         <Ionicons name="chatbubble-ellipses" size={18} color="#00ffcc" />
         <Text style={styles.chatBtnText}>UPLINK TO LOGISTICS HUB</Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg} />
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        <View style={[styles.droneIcon, { left: `${progress * 100}%`, marginLeft: -18 }]}>
          <Ionicons name="airplane" size={16} color="#00ffcc" />
        </View>
      </View>

      <View style={styles.nodesRow}>
        <Text style={styles.nodeLab}>HUB_01</Text>
        <Text style={styles.nodeLab}>DEST_NODE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
    padding: 25, 
    borderRadius: 40, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  aiHud: {
    backgroundColor: 'rgba(0, 255, 204, 0.05)',
    padding: 16,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 204, 0.15)',
  },
  aiHudCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  hudTitle: {
    color: '#00ffcc',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginLeft: 6,
  },
  riskScore: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 8,
    fontWeight: 'bold',
  },
  windowBox: {
    marginTop: 5,
  },
  windowLab: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 7,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  windowTime: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  missionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  pulseContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  pulse: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#00ffcc', 
    marginRight: 8 
  },
  liveTag: { 
    color: 'rgba(255, 255, 255, 0.3)', 
    fontSize: 8, 
    fontWeight: '900', 
    letterSpacing: 2 
  },
  etaText: { 
    color: '#00ffcc', 
    fontSize: 12, 
    fontWeight: '900' 
  },
  statusMain: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: '900', 
    letterSpacing: -0.5 
  },
  statusSuccess: {
     color: '#00ffcc',
     fontSize: 22,
     fontWeight: '900',
     letterSpacing: -0.5
  },
  missionId: { 
    color: 'rgba(255, 255, 255, 0.2)', 
    fontSize: 9, 
    fontWeight: 'bold', 
    marginTop: 2 
  },
  chatBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    padding: 16, 
    borderRadius: 24, 
    marginTop: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 10
  },
  chatBtnText: { 
    color: 'rgba(255, 255, 255, 0.6)', 
    fontSize: 10, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
  progressContainer: { 
    height: 40, 
    justifyContent: 'center', 
    marginTop: 25, 
    position: 'relative' 
  },
  progressBarBg: { 
    height: 2, 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    borderRadius: 1, 
    position: 'absolute', 
    left: 0, 
    right: 0 
  },
  progressBarFill: { 
    height: 2, 
    backgroundColor: '#00ffcc', 
    borderRadius: 1, 
    position: 'absolute', 
    left: 0 
  },
  droneIcon: { 
    position: 'absolute', 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(0, 255, 204, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(0, 255, 204, 0.3)', 
    top: 2 
  },
  nodesRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10 
  },
  nodeLab: { 
    color: 'rgba(255, 255, 255, 0.15)', 
    fontSize: 9, 
    fontWeight: '900',
    letterSpacing: 1
  },
  
  // Tether Safety UI
  tetherContainer: { marginVertical: 10 },
  tetherWarningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(234, 179, 8, 0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.3)', gap: 10 },
  tetherWarningText: { color: '#eab308', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  tetherDepthText: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 10, fontVariant: ['tabular-nums'] },
  
  tetherSuccessBox: { alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  tetherSuccessText: { color: '#10b981', fontSize: 16, fontWeight: '900', letterSpacing: 1, marginTop: 5 },
  tetherSubText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 10, marginTop: 4, fontWeight: 'bold' },

  tetherSyncBox: { alignItems: 'center', backgroundColor: 'rgba(14, 165, 233, 0.1)', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(14, 165, 233, 0.3)' },
  tetherSyncText: { color: '#0ea5e9', fontSize: 16, fontWeight: '900', letterSpacing: 1, marginTop: 5 },

  syncBtn: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },
  syncBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1
  }
});

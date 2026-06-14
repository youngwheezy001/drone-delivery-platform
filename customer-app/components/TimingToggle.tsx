import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TimingToggleProps {
  scheduledTime: Date | null;
  onSelectImmediate: () => void;
  onSelectScheduled: () => void;
}

export const TimingToggle: React.FC<TimingToggleProps> = ({
  scheduledTime,
  onSelectImmediate,
  onSelectScheduled,
}) => {
  return (
    <View style={styles.timingCard}>
       <Text style={styles.timingTitle}>MISSION DEPLOYMENT WINDOW</Text>
       <View style={styles.timingRow}>
          <TouchableOpacity 
             style={[styles.timingBtn, !scheduledTime && styles.timingBtnActive]}
             onPress={onSelectImmediate}
          >
             <Text style={[styles.timingBtnText, !scheduledTime && styles.timingBtnTextActive]}>
               IMMEDIATE
             </Text>
          </TouchableOpacity>
          <TouchableOpacity 
             style={[styles.timingBtn, !!scheduledTime && styles.timingBtnActive]}
             onPress={onSelectScheduled}
          >
             <Text style={[styles.timingBtnText, !!scheduledTime && styles.timingBtnTextActive]}>
               SCHEDULED
             </Text>
          </TouchableOpacity>
       </View>
       {scheduledTime && (
         <Text style={styles.scheduledInfo}>
           Target Sortie: {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </Text>
       )}
    </View>
  );
};

const styles = StyleSheet.create({
  timingCard: { 
    backgroundColor: '#0f172a', 
    padding: 20, 
    borderRadius: 25, 
    borderWidth: 1, 
    borderColor: '#1e293b', 
    marginTop: 10 
  },
  timingTitle: { 
    color: '#64748b', 
    fontSize: 8, 
    fontWeight: '900', 
    letterSpacing: 2, 
    marginBottom: 15 
  },
  timingRow: { 
    flexDirection: 'row', 
    gap: 10 
  },
  timingBtn: { 
    flex: 1, 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#1e293b', 
    alignItems: 'center' 
  },
  timingBtnActive: { 
    backgroundColor: '#00ffcc10', 
    borderColor: '#00ffcc' 
  },
  timingBtnText: { 
    color: '#64748b', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  timingBtnTextActive: { 
    color: '#00ffcc' 
  },
  scheduledInfo: { 
    color: '#fb923c', 
    fontSize: 10, 
    marginTop: 12, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
});

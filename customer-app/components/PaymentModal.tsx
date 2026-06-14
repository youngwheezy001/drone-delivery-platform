import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ActivityIndicator, Image, Animated, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (phone: string) => void;
  amount: string;
}

export default function PaymentModal({ visible, onClose, onSuccess, amount }: PaymentModalProps) {
  const [step, setStep] = useState<"Phone" | "Biometric" | "PIN" | "Processing" | "Success">("Phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    if (step === "Processing") {
      Animated.timing(progress, {
        toValue: 1,
        duration: 3500,
        useNativeDriver: false
      }).start(() => {
        setStep("Success");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(onSuccess, 2000);
      });
    }
  }, [step]);

  const handleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      // Fallback if no biometrics
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep("PIN");
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'AUTHORIZE LOGISTICS MISSION',
      fallbackLabel: 'Enter PIN',
    });

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("Processing");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("AUTHORIZATION FAILED", "Biometric credentials could not be verified.");
    }
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "Phone") {
      onSuccess(phone);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.content}>
          
          <View style={styles.header}>
            <View style={styles.brandingRow}>
              <Ionicons name="shield-checkmark" size={20} color="#00ffcc" />
              <Text style={styles.brandText}>MISSION AUTHORIZATION</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {step === "Phone" && (
            <View style={styles.body}>
              <Image 
                source={{ uri: 'https://cdn.iconscout.com/icon/free/png-256/free-m-pesa-3444038-2875151.png' }} 
                style={styles.mpesaLogo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Confirm Payload Logic</Text>
              <Text style={styles.subtitle}>Enter account identifier for mission fee clearing.</Text>
              <TextInput 
                style={styles.input} 
                value={phone} 
                onChangeText={setPhone} 
                placeholder="07XX XXX XXX" 
                placeholderTextColor="#334155"
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.nextBtn} onPress={handleNextStep}>
                <Text style={styles.nextText}>INITIATE AUTH GRID</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === "Biometric" && (
            <View style={styles.body}>
               <View style={styles.secureBadge}><Ionicons name="finger-print" size={32} color="#00ffcc" /></View>
               <Text style={styles.title}>Secure Authorization</Text>
               <Text style={styles.subtitle}>Use Biometrics to verify mission deployment command.</Text>
               
               <TouchableOpacity style={styles.nextBtn} onPress={handleBiometricAuth}>
                <Text style={styles.nextText}>SCAN BIOMETRICS</Text>
                <Ionicons name="scan" size={16} color="#000" />
              </TouchableOpacity>
              
              <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setStep("PIN")}>
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>USE ACCESS PIN INSTEAD</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === "PIN" && (
            <View style={styles.body}>
              <View style={styles.secureBadge}><Ionicons name="keypad" size={24} color="#00ffcc" /></View>
              <Text style={styles.title}>Backdoor Access PIN</Text>
              <Text style={styles.subtitle}>Manual authorization for KES {amount}.</Text>
              <TextInput 
                style={styles.input} 
                value={pin} 
                onChangeText={setPin} 
                placeholder="XXXX" 
                placeholderTextColor="#334155"
                secureTextEntry
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
              />
              <TouchableOpacity style={styles.nextBtn} onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setStep("Processing");
              }}>
                <Text style={styles.nextText}>OVERRIDE & AUTHORIZE</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === "Processing" && (
            <View style={styles.body}>
              <ActivityIndicator size="large" color="#00ffcc" />
              <Text style={styles.title}>Syncing Grid Nodes...</Text>
              <Text style={styles.subtitle}>Distributing encrypted mission payload to flight deck.</Text>
              <View style={styles.progressBg}>
                <Animated.View style={[styles.progressFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
              </View>
            </View>
          )}

          {step === "Success" && (
            <View style={styles.body}>
              <View style={styles.successCircle}>
                <Ionicons name="airplane-sharp" size={48} color="#000" />
              </View>
              <Text style={styles.title}>MISSION DEPLOYED</Text>
              <Text style={styles.subtitle}>Command received. UAV is now in flight status.</Text>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000cc', justifyContent: 'flex-end' },
  content: { backgroundColor: '#0f172a', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 25, borderWidth: 1, borderColor: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  brandingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(30, 41, 59, 0.5)', alignItems: 'center', justifyContent: 'center' },

  body: { alignItems: 'center', paddingBottom: 40 },
  mpesaLogo: { width: 80, height: 40, marginBottom: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { color: '#64748b', fontSize: 13, textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 },
  input: { backgroundColor: '#000', width: '100%', borderRadius: 24, padding: 22, color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', borderWidth: 1, borderColor: '#334155', marginBottom: 25 },
  nextBtn: { backgroundColor: '#00ffcc', width: '100%', padding: 22, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, shadowColor: '#00ffcc', shadowOpacity: 0.3, shadowRadius: 15 },
  nextText: { color: '#000', fontSize: 14, fontWeight: 'black', letterSpacing: 1 },

  secureBadge: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0, 255, 204, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0, 255, 204, 0.2)' },

  progressBg: { width: '80%', height: 6, backgroundColor: '#1e293b', borderRadius: 3, marginTop: 40, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#00ffcc' },

  successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#00ffcc', alignItems: 'center', justifyContent: 'center', marginBottom: 25, shadowColor: '#00ffcc', shadowOpacity: 0.5, shadowRadius: 20 },
});

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Email and password are required.');
      return;
    }
    setLocalLoading(true);
    try {
      await signIn(email, password);
      // Returns back to previous screen (the cart/checkout flow!)
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/landing');
      }
    } catch (error: any) {
      Alert.alert('Authentication Failed', error.message || 'Invalid credentials.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleMock = () => {
    if (!email) {
      Alert.alert('Google Sign-In', 'Please type your Google email address in the Email field above first.');
      return;
    }
    setLocalLoading(true);
    setTimeout(async () => {
      try {
        await signInWithGoogle(email);
        if (router.canGoBack()) router.back();
        else router.replace('/landing');
      } catch (e: any) {
        Alert.alert('Google Sign-In Error', e.message);
      } finally {
        setLocalLoading(false);
      }
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>What's your email?</Text>
          <Text style={styles.subtitle}>Log in to your Tustar profile to authorize missions and track your drone payloads.</Text>

          <View style={styles.inputBox}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input} 
              placeholder="name@example.com" 
              placeholderTextColor="#334155"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={[styles.inputBox, { marginTop: 20 }]}>
            <Text style={styles.label}>Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor="#334155"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={handleLogin}
            disabled={localLoading || isLoading}
          >
            {localLoading || isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerBox}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleMock} disabled={localLoading}>
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Tustar? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.footerLink}>Create a profile</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { paddingTop: 60, paddingHorizontal: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(30, 41, 59, 0.5)', alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 40, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1, marginBottom: 10 },
  subtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 22, marginBottom: 40 },
  
  inputBox: { width: '100%' },
  label: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 18, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#1e293b' },
  
  primaryBtn: { backgroundColor: '#00ffcc', padding: 20, borderRadius: 16, marginTop: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  
  dividerBox: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1e293b' },
  dividerText: { color: '#64748b', paddingHorizontal: 15, fontWeight: 'bold' },
  
  googleBtn: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#334155' },
  googleBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#64748b', fontSize: 14 },
  footerLink: { color: '#00ffcc', fontSize: 14, fontWeight: 'bold' }
});

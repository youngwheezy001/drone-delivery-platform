import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Config, discoverActiveNode } from '../constants/Config';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }
    setLocalLoading(true);
    try {
      const node = await discoverActiveNode();
      const response = await fetch(`${node}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role: 'CUSTOMER' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Registration failed");
      }

      Alert.alert('Profile Created', 'Your account has been created! Please log in.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Unable to create profile.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (!fullName || !email) {
      Alert.alert('Google Sign-Up', 'Please provide your Full Name and Google Email Address first.');
      return;
    }
    setLocalLoading(true);
    try {
      const node = await discoverActiveNode();
      // Register with a mock password since it's "Google Auth"
      const response = await fetch(`${node}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'GOOGLE_OAUTH_MOCK', full_name: fullName, role: 'CUSTOMER' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Google Registration failed");
      }

      // Automatically sign in after Google Registration
      await signInWithGoogle(email);
      Alert.alert('Profile Linked', 'Your Google account was linked successfully!', [
        { text: 'Launch Hub', onPress: () => {
            if (router.canGoBack()) router.back();
            else router.replace('/landing');
        } }
      ]);
    } catch (error: any) {
      Alert.alert('Google Sign-Up Failed', error.message || 'Unable to link profile.');
    } finally {
      setLocalLoading(false);
    }
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
          <Text style={styles.title}>Create a profile</Text>>
          <Text style={styles.subtitle}>Join Tustar to access autonomous drone delivery and secure payload transport.</Text>

          <View style={styles.inputBox}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="John Doe" 
              placeholderTextColor="#334155"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={[styles.inputBox, { marginTop: 20 }]}>
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
            onPress={handleRegister}
            disabled={localLoading}
          >
            {localLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Create Profile</Text>
                <Ionicons name="person-add" size={20} color="#000" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerBox}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleRegister} disabled={localLoading}>
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.googleBtnText}>Sign up with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have a profile? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.footerLink}>Log in</Text>
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

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      Alert.alert("Input Required", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName, "CUSTOMER");
        Alert.alert("Success!", "Account created. Please log in.");
        setIsLogin(true);
      }
    } catch (e: any) {
      Alert.alert("Auth Error", e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="airplane" size={40} color="#00ffcc" />
          </View>
          <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.subtitle}>Elite Drone Delivery Network</Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#94a3b8" />
              <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#64748b" value={fullName} onChangeText={setFullName}/>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#94a3b8" />
            <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail}/>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b" secureTextEntry value={password} onChangeText={setPassword}/>
          </View>

          <TouchableOpacity style={styles.mainButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleButton} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure 256-bit AES Encryption</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconContainer: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(0, 255, 204, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', letterSpacing: -1 },
  subtitle: { color: '#64748b', fontSize: 14, marginTop: 5, letterSpacing: 1, textTransform: 'uppercase' },
  form: { width: '100%' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 15, marginBottom: 15, height: 60 },
  input: { flex: 1, marginLeft: 15, color: '#f8fafc', fontSize: 16 },
  mainButton: { backgroundColor: '#00ffcc', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#00ffcc', shadowOpacity: 0.3, shadowRadius: 10 },
  buttonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  toggleButton: { marginTop: 25, alignItems: 'center' },
  toggleText: { color: '#94a3b8', fontSize: 14 },
  footer: { marginTop: 50, alignItems: 'center' },
  footerText: { color: '#334155', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 },
});

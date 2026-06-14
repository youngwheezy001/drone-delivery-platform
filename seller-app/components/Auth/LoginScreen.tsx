import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  ScrollView, 
  Image, 
  StatusBar, 
  Switch,
  Animated,
  Dimensions,
  ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Hub } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  isHubsLoading?: boolean;
  hubs?: Hub[];
  hasDiscoveryTimedOut?: boolean;
  manualIP?: string;
  onManualIPChange?: (ip: string) => void;
  onManualConnect?: () => void;
  onLaunchDemo: () => void;
  onLogin: (email: string, pass: string) => void;
  onRefreshPolling?: () => void;
  isStandaloneMode?: boolean;
  isStandaloneForced?: boolean;
  onToggleStandalone?: (val: boolean) => void;
}

export const LoginScreen = ({
  isHubsLoading = false,
  hubs = [],
  hasDiscoveryTimedOut = false,
  manualIP = "",
  onManualIPChange = () => {},
  onManualConnect = () => {},
  onLaunchDemo,
  onLogin,
  onRefreshPolling = () => {},
  isStandaloneMode = false,
  isStandaloneForced = false,
  onToggleStandalone = () => {},
}: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground 
        source={require('../../assets/icon.png')} 
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <LinearGradient 
          colors={['rgba(2, 6, 23, 0.98)', 'rgba(0, 0, 0, 0.95)']} 
          style={StyleSheet.absoluteFill} 
        />
      </ImageBackground>
      
      <SafeAreaView style={styles.authContainer}>
        <Animated.ScrollView 
            contentContainerStyle={styles.authInner} 
            style={{ opacity: fadeAnim }}
            showsVerticalScrollIndicator={false}
        >
          <View style={styles.topHud}>
             <View style={styles.brandingRow}>
                <View style={styles.brandBadge}>
                   <MaterialCommunityIcons name="drone" size={20} color="#00ffcc" />
                </View>
                <View>
                   <Text style={styles.hudLabel}>OPERATOR TERMINAL</Text>
                   <Text style={styles.hudValue}>Nairobi Hub • Unit 8.4</Text>
                </View>
             </View>
             <View style={styles.secureIndicator}>
                <Ionicons name="lock-closed" size={10} color="#00ffcc" />
                <Text style={styles.secureText}>ENCRYPTED</Text>
             </View>
          </View>

          <View style={styles.mainHero}>
             <Text style={styles.heroTitle}>OPERATOR LOGIN</Text>
             <Text style={styles.heroSub}>SIGN IN TO MANAGE YOUR STORE</Text>
          </View>

          <View style={styles.authCard}>
            <LinearGradient
                colors={['rgba(30, 41, 59, 0.4)', 'rgba(15, 23, 42, 0.6)']}
                style={StyleSheet.absoluteFill}
            />
            
            <View style={styles.formContainer}>
               <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>OPERATOR IDENTITY</Text>
                  <TextInput 
                    style={styles.formInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="operator@tustar.io"
                    placeholderTextColor="#475569"
                    autoCapitalize="none"
                  />
               </View>

               <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SECURE ACCESS KEY</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput 
                      style={[styles.formInput, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#475569"
                      secureTextEntry={!isPasswordVisible}
                    />
                    <TouchableOpacity 
                      style={styles.eyeToggle}
                      onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      <Ionicons 
                        name={isPasswordVisible ? "eye-off" : "eye"} 
                        size={20} 
                        color={isPasswordVisible ? "#00ffcc" : "#64748b"} 
                      />
                    </TouchableOpacity>
                  </View>
               </View>

               <View style={styles.overrideRow}>
                  <View>
                    <Text style={styles.overrideLabel}>SOVEREIGNTY COMMAND</Text>
                    <Text style={styles.overrideSub}>Local grid bypass authorization</Text>
                  </View>
                  <Switch 
                    value={isStandaloneForced}
                    onValueChange={onToggleStandalone}
                    trackColor={{ false: '#334155', true: '#00ffcc30' }}
                    thumbColor={isStandaloneForced ? '#00ffcc' : '#64748b'}
                  />
               </View>

               <TouchableOpacity 
                 style={styles.loginBtn}
                 onPress={() => onLogin(email, password)}
                 activeOpacity={0.8}
               >
                  <LinearGradient colors={['#00ffcc', '#00cccc']} style={styles.loginBtnGradient}>
                    <Text style={styles.loginBtnText}>LOGIN TO STORE</Text>
                    <Ionicons name="log-in" size={16} color="#000" />
                  </LinearGradient>
               </TouchableOpacity>
            </View>

            <TouchableOpacity 
               style={styles.discoveryToggle}
               onPress={() => setIsDiscoveryOpen(!isDiscoveryOpen)}
            >
               <Text style={styles.discoveryToggleText}>
                  {isDiscoveryOpen ? 'CONCEAL GRID FREQUENCIES' : 'SCAN FOR GRID NODES'}
               </Text>
               <Ionicons name={isDiscoveryOpen ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
            </TouchableOpacity>

            {isDiscoveryOpen && (
              <View style={styles.discoverySection}>
                {isHubsLoading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator color="#00ffcc" />
                    <Text style={styles.loadingText}>TUSTAR MERCHANT HUB LOADING...</Text>
                  </View>
                ) : (
                  <View style={{ maxHeight: 250 }}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {hubs.map(hub => (
                        <View key={hub.id} style={styles.hubItem}>
                          <View>
                            <Text style={styles.hubName}>{hub.full_name}</Text>
                            <Text style={styles.hubCid}>ID: {hub.company_id} • {hub.region}</Text>
                          </View>
                          <View style={styles.statusDot} />
                        </View>
                      ))}
                      
                      {(hubs.length === 0 || hasDiscoveryTimedOut) && (
                        <View style={styles.troubleBox}>
                          <Text style={styles.troubleTitle}>UPLINK FAILURE</Text>
                          <TextInput 
                            style={styles.manualInput}
                            value={manualIP}
                            onChangeText={onManualIPChange}
                            placeholder="Manual Gateway IPv4"
                            placeholderTextColor="#475569"
                          />
                          <TouchableOpacity style={styles.manualBtn} onPress={onManualConnect}>
                            <Text style={styles.manualBtnText}>ESTABLISH MANUAL LINK</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.demoBtn} onPress={onLaunchDemo}>
             <Text style={styles.demoBtnText}>SIMULATE SANDBOX SESSION</Text>
          </TouchableOpacity>

          <View style={styles.footerBranding}>
             <Text style={styles.versionText}>NAIROBI LOGISTICS GRID • SECURE OPERATOR CLIENT</Text>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  authContainer: { flex: 1 },
  authInner: { paddingHorizontal: 30, paddingBottom: 50 },
  
  topHud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 40 },
  brandingRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  brandBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0, 255, 204, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0, 255, 204, 0.2)' },
  hudLabel: { color: '#64748b', fontSize: 7, fontWeight: '900', letterSpacing: 2 },
  hudValue: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  secureIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0, 255, 204, 0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  secureText: { color: '#00ffcc', fontSize: 7, fontWeight: '900' },

  mainHero: { alignItems: 'center', marginBottom: 40 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 4 },
  heroSub: { color: '#64748b', fontSize: 8, fontWeight: '900', letterSpacing: 2, marginTop: 10 },

  authCard: { 
    borderRadius: 35, 
    width: '100%', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    padding: 30
  },
  
  formContainer: { gap: 20 },
  inputGroup: { gap: 10 },
  inputLabel: { color: '#64748b', fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  formInput: { 
    backgroundColor: 'rgba(30, 41, 59, 0.3)', 
    borderRadius: 18, 
    padding: 18, 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)'
  },
  passwordContainer: { flexDirection: 'row', alignItems: 'center' },
  eyeToggle: { paddingHorizontal: 18, height: '100%', justifyContent: 'center', position: 'absolute', right: 0 },
  
  overrideRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.2)', padding: 15, borderRadius: 18, marginTop: 5 },
  overrideLabel: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  overrideSub: { color: '#64748b', fontSize: 8, marginTop: 2 },
  
  loginBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 10 },
  loginBtnGradient: { padding: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loginBtnText: { color: '#000', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  
  discoveryToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 25 },
  discoveryToggleText: { color: '#64748b', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  
  discoverySection: { marginTop: 20, backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: 20, padding: 15 },
  loadingBox: { alignItems: 'center', padding: 20 },
  loadingText: { color: '#00ffcc', fontSize: 8, fontWeight: '900', marginTop: 10, letterSpacing: 2 },
  
  hubItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.02)' },
  hubName: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  hubCid: { color: '#64748b', fontSize: 9, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ffcc', elevation: 10, shadowColor: '#00ffcc', shadowOpacity: 1, shadowRadius: 5 },
  
  troubleBox: { padding: 20, alignItems: 'center' },
  troubleTitle: { color: '#fb923c', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
  manualInput: { backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 15, padding: 15, color: '#fff', fontSize: 12, width: '100%', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  manualBtn: { backgroundColor: '#1e293b', padding: 15, borderRadius: 15, width: '100%', alignItems: 'center', borderBottomWidth: 3, borderBottomColor: '#00ffcc' },
  manualBtnText: { color: '#00ffcc', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  demoBtn: { marginTop: 40, padding: 20, alignItems: 'center' },
  demoBtnText: { color: '#00ffcc', fontSize: 9, fontWeight: '900', letterSpacing: 2, opacity: 0.8 },
  
  footerBranding: { marginTop: 20, alignItems: 'center' },
  versionText: { color: '#1e293b', fontSize: 7, fontWeight: 'bold', letterSpacing: 3 }
});

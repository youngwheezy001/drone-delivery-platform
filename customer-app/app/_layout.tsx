import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { Stack } from 'expo-router';
import * as Updates from 'expo-updates';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

export default function RootLayout() {
  // --- OTA UPDATE LOGIC ---
  useEffect(() => {
    async function onFetchUpdateAsync() {
      // 🔒 SILENT BYPASS: Skip cloud checks in offline or unverified environments
      if (!Updates.isEnabled) return;
      
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          // Check for 'critical' flag in manifest metadata
          const isCritical = update.manifest && (update.manifest as any).extra?.expoClient?.extra?.isCritical;

          if (isCritical) {
            console.log("🛰️ [OTA] Critical Customer Update detected. Auto-applying...");
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
            return;
          }

          // Optional update -> Prompt
          Alert.alert(
            "SYSTEM UPDATE 🛰️",
            "A new mission patch is available. Deploy now?",
            [
              { text: "LATER", style: "cancel" },
              { 
                text: "DEPLOY", 
                onPress: async () => {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                } 
              }
            ]
          );
        }
      } catch (error) {
        console.warn("⚠️ [OTA] Mission Patch Gateway unreachable.");
      }
    }
    if (!__DEV__) onFetchUpdateAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <Stack initialRouteName="landing">
            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ title: 'Mission Planning', headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
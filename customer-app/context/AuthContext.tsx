import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications'; // Removed due to Expo Go SDK 53 incompatibility
import { Platform } from 'react-native';
import { Config, discoverActiveNode } from '../constants/Config';

interface AuthContextType {
  token: string | null;
  user: any | null;
  isLoading: boolean;
  activeNode: string;
  signIn: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: (email: string) => Promise<void>;
  debugSignIn: () => void;
  signOut: () => Promise<void>;
  signUp: (email: string, pass: string, name: string, role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [token, setToken] = useState<string | null>("MOCK_PRESENTATION_TOKEN");
  const [user, setUser] = useState<any | null>({ email: "vip@tustar.io", name: "VIP Customer", role: "CUSTOMER" });
  const [isLoading, setIsLoading] = useState(false);
  const [activeNode, setActiveNode] = useState(Config.HTTP_URL);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const node = await discoverActiveNode();
        setActiveNode(node);

        const storedToken = await SecureStore.getItemAsync('userToken');
        const storedUser = await SecureStore.getItemAsync('userData');
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (e) {}
      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      setTimeout(() => {
        setToken("MOCK_PRESENTATION_TOKEN");
        setUser({ email, name: "Customer User", role: "CUSTOMER" });
        SecureStore.setItemAsync('userToken', "MOCK_PRESENTATION_TOKEN");
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const registerForPushNotificationsAsync = async (authToken: string, node: string) => {
    // 🛑 Push Notifications in Expo Go (Android) are disabled in SDK 53+
    // Suppressed to prevent "warnOfExpoGoPushUsage" fatal error on boot.
    console.log("Push notifications skipped for Expo Go compatibility.");
    return;
  };

  const signInWithGoogle = async (email: string) => {
    setIsLoading(true);
    try {
      setTimeout(() => {
        setToken("MOCK_PRESENTATION_TOKEN");
        setUser({ email, name: "Google Customer" });
        SecureStore.setItemAsync('userToken', "MOCK_PRESENTATION_TOKEN");
      }, 500);
    } catch (e: any) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name: string, role: string = "OPERATOR") => {
    setIsLoading(true);
    try {
      setTimeout(() => {
        setToken("MOCK_PRESENTATION_TOKEN");
        setUser({ email, name, role });
        SecureStore.setItemAsync('userToken', "MOCK_PRESENTATION_TOKEN");
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const debugSignIn = async () => {
    const debugToken = "DEBUG";
    await SecureStore.setItemAsync('userToken', debugToken);
    await SecureStore.setItemAsync('userData', JSON.stringify({ email: 'lewis@tustar.io', full_name: 'Lewis Hamilton' }));
    setToken(debugToken);
    setUser({ email: 'lewis@tustar.io', full_name: 'Lewis Hamilton' });
  };

  const signOut = async () => {
    // Disable signout for testing
    return;
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, activeNode, signIn, signInWithGoogle, signOut, signUp, debugSignIn }}>
      {children}
    </AuthContext.Provider>
  );
};

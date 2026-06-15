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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      const node = await discoverActiveNode();
      setActiveNode(node);

      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', pass);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${node}/api/v1/auth/login/access-token`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Invalid Credentials");
      
      const { access_token } = await response.json();
      await SecureStore.setItemAsync('userToken', access_token);
      setToken(access_token);
      setUser({ email }); 

      // 📲 Register for Push Notifications
      await registerForPushNotificationsAsync(access_token, node);

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
      const node = await discoverActiveNode();
      setActiveNode(node);

      const response = await fetch(`${node}/api/v1/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Google account not registered");
      }

      const data = await response.json();
      setToken(data.access_token);
      await SecureStore.setItemAsync('userToken', data.access_token);

      const userResp = await fetch(`${node}/api/v1/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      if (userResp.ok) {
        const userData = await userResp.json();
        setUser(userData);
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      }
    } catch (e: any) {
      setIsLoading(false);
      throw e;
    }
    setIsLoading(false);
  };

  const signUp = async (email: string, pass: string, name: string, role: string = "OPERATOR") => {
    setIsLoading(true);
    try {
      const response = await fetch(`${Config.HTTP_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, full_name: name, role })
      });
      if (!response.ok) throw new Error("Registration Failed");
      // Prompt user to sign in or auto-sign in here
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
    setIsLoading(true);
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, activeNode, signIn, signInWithGoogle, signOut, signUp, debugSignIn }}>
      {children}
    </AuthContext.Provider>
  );
};

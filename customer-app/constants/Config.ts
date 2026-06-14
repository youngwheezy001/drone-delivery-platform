import { Platform } from 'react-native';

const PHYSICAL_IP = "10.0.7.147";
const EMULATOR_IP = "10.0.2.2";

const IS_PROD = !__DEV__;
const PROD_URL = "https://drone-delivery-platform-1.onrender.com";
const PROD_WS = "wss://drone-delivery-platform-1.onrender.com";

const BACKEND_IP = (__DEV__ && Platform.OS === 'android') 
  ? EMULATOR_IP 
  : PHYSICAL_IP;

export const Config = {
  BACKEND_IP,
  HTTP_URL: IS_PROD ? PROD_URL : `http://${BACKEND_IP}:8000`,
  WS_URL: IS_PROD ? PROD_WS : `ws://${BACKEND_IP}:8000`,
  
  // --- TACTICAL DISCOVERY SHIELD ---
  PROBE_TARGETS: [
    `http://10.0.7.147:8000`,
    `http://10.0.8.141:8000`, 
    `http://192.168.137.1:8000`, 
    `http://10.0.2.2:8000`
  ],

  // --- HQ SETTINGS ---
  HQ_LOCATION: { 
    latitude: -1.2921, 
    longitude: 36.7884 
  },
};

/**
 * 🛰️ GRID SWEEP: Concurrently probes all mission nodes to find the active machine IP.
 */
export async function discoverActiveNode(endpoint: string = "/api/v1/admin/hubs") {
    const targets = [Config.HTTP_URL, ...Config.PROBE_TARGETS];
    const probePromises = targets.map(url => {
        return new Promise<{url: string, res: Response}>((resolve, reject) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000);
            fetch(`${url}${endpoint}`, { signal: controller.signal })
                .then(res => {
                    clearTimeout(id);
                    if (res.ok) resolve({ url, res });
                    else reject(new Error("HTTP Error"));
                })
                .catch(e => {
                    clearTimeout(id);
                    reject(e);
                });
        });
    });

    try {
        const { url } = await Promise.any(probePromises);
        return url;
    } catch (e) {
        return Config.HTTP_URL; // Fallback to default if all fail
    }
}

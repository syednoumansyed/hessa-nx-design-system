import type { CapacitorConfig } from '@capacitor/cli';
import { environment } from './src/environments/environment';

const config: CapacitorConfig = {
  appId: environment.APP_ID,
  appName: environment.APP_NAME,
  webDir: 'www/browser',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: new URL(environment.FE_BASE_URL).hostname,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: [],
    },
    CapacitorHttp: {
      enabled: false,
    },
    Permissions: {
      ios: {
        locationWhenInUse:
          'We need your location to continue with student pickup',
        locationAlways: 'We need your location to continue with student pickup',
      },
      android: {
        permissions: [
          'android.permission.ACCESS_COARSE_LOCATION',
          'android.permission.ACCESS_FINE_LOCATION',
        ],
      },
    },
    CapacitorUpdater: {
      autoUpdate: true,
      version: process.env['CAPGO_VERSION'] ?? '1.0.0', // This version is uses by CapGo for build upload as well as for OTA update
      defaultChannel: process.env['ENVIRONMENT'] ?? 'production', // this will change as per the environment, having some issues in passing the environment variable here
      publicKey: process.env['CAPGO_PUBLIC_KEY'] ?? '', // Do not keep key static
    },
  },
};

export default config;

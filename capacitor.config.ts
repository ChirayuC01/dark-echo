import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.resonance.soundgame',
  appName: 'Resonance',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#000000',
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#000000',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;

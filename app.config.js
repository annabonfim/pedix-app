// app.config.js
// Injeta o hash do commit no build (lido em runtime na tela "Sobre o App")
const { execSync } = require('child_process');

function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (_) {
    return 'unknown';
  }
}

module.exports = {
  expo: {
    name: 'pedix',
    slug: 'pedix',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'pedix',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.annabonfim.pedix',
    },
    android: {
      package: 'com.annabonfim.pedix',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-router', 'expo-notifications'],
    extra: {
      commitHash: getCommitHash(),
    },
  },
};

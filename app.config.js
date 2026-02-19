const appJson = require('./app.json');

// Load .env so env vars are available during build
require('dotenv').config();

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
// Reverse "151902184202-xxx.apps.googleusercontent.com"
// → "com.googleusercontent.apps.151902184202-xxx"
const reversedIosClientId = iosClientId.split('.').reverse().join('.');

// Replace the Google Sign-In plugin entry with the real URL scheme from env
const plugins = appJson.expo.plugins.map((plugin) => {
  if (
    Array.isArray(plugin) &&
    plugin[0] === '@react-native-google-signin/google-signin'
  ) {
    return [plugin[0], { iosUrlScheme: reversedIosClientId }];
  }
  return plugin;
});

module.exports = {
  expo: {
    ...appJson.expo,
    plugins,
    extra: {
      ...appJson.expo.extra,
      RC_TEST_API: process.env.RC_TEST_API,
    },
  },
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { start } from '@storybook/react-native';

import './rn-addons';

// Import all story files - they auto-register with CSF format
require('../components/UnifiedHeader.stories');

const view = start({
  annotations: [],
  storyEntries: [],
});

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
  shouldDisableKeyboardAvoidingView: true,
  enableAddons: true,
});

export default StorybookUIRoot;


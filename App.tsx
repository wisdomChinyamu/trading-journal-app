import './src/polyfills/crypto';
import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import { TabNavigator } from './src/navigation/TabNavigator';
import ThemeProvider from './src/components/ThemeProvider';

// Conditional imports for native-only modules
let GestureHandlerRootView: any = React.Fragment;
let StatusBar: any = null;

if (Platform.OS !== 'web') {
  const { GestureHandlerRootView: GHR } = require('react-native-gesture-handler');
  GestureHandlerRootView = GHR;
  const SB = require('expo-status-bar').StatusBar;
  StatusBar = SB;
}

export default function App() {
  const RootView = GestureHandlerRootView;
  const rootProps = Platform.OS === 'web' ? {} : { style: { flex: 1 } };

  return (
    <RootView {...rootProps}>
      <AppProvider>
        <ThemeProvider initial="dark">
          <NavigationContainer>
            {StatusBar && <StatusBar />}
            <TabNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </AppProvider>
    </RootView>
  );
}

import React from 'react';
import { View, SafeAreaView, StyleSheet, Platform } from 'react-native';
import { useTheme } from './ThemeProvider';

export default function ScreenLayout({ children, style }: { children: React.ReactNode; style?: any }) {
  const { colors } = useTheme();

  // On web, SafeAreaView is a no-op but adds unnecessary wrapper
  // Use conditional rendering to avoid extra nesting on web
  const innerView = (
    <View style={[styles.container, style]}>{children}</View>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.safe, { backgroundColor: colors.background }]}>
        {innerView}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {innerView}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : Platform.OS === 'ios' ? 16 : 8,
  },
});

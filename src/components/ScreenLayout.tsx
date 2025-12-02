import React from 'react';
import { View, SafeAreaView, StyleSheet, Platform, ScrollView } from 'react-native';
import { useTheme } from './ThemeProvider';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: any;
  scrollable?: boolean;
  noPadding?: boolean;
  showGradient?: boolean;
}

export default function ScreenLayout({ 
  children, 
  style, 
  scrollable = false,
  noPadding = false,
  showGradient = false,
}: ScreenLayoutProps) {
  const { colors } = useTheme();

  // Gradient overlay for cinematic effect
  const GradientOverlay = () =>
    showGradient ? (
      <View
        style={[
          styles.gradientOverlay,
          {
            backgroundColor: `${colors.highlight}05`,
            pointerEvents: 'none' as const,
          },
        ]}
        // pointerEvents="none"

      />
    ) : null;

  const containerStyle = [
    styles.container,
    noPadding && styles.noPadding,
    style,
  ];

  const innerContent = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={containerStyle}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {children}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  ) : (
    <View style={containerStyle}>
      {children}
    </View>
  );

  // On web, SafeAreaView is a no-op but adds unnecessary wrapper
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.safe, { backgroundColor: colors.background }]}>
        <GradientOverlay />
        {innerContent}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <GradientOverlay />
      {innerContent}
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
    paddingTop: Platform.select({
      android: 16,
      ios: 20,
      web: 12,
    }),
  },
  noPadding: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  bottomSpacing: {
    height: 24,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.3,
    zIndex: 0,
  },
});
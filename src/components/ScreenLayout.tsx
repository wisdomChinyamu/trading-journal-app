import React from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  Platform,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { useTheme } from "./ThemeProvider";

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
  const { width } = Dimensions.get("window");
  const isMobile = width < 768;
  const bgImage = isMobile
    ? require("../../assets/images/bg-img-mobile.png")
    : require("../../assets/images/bg-img-desktop.png");

  // Gradient overlay for cinematic effect
  const GradientOverlay = () =>
    showGradient ? (
      <View
        style={[
          styles.gradientOverlay,
          {
            backgroundColor: `${colors.highlight}05`,
            pointerEvents: "none" as const,
          },
        ]}
        // pointerEvents="none"
      />
    ) : null;

  // Reserve extra bottom space so bottom tab bar isn't clipped on small/mobile screens
  const tabBarHeight = Platform.OS === "ios" ? 85 : 70;
  const containerStyle = [
    styles.container,
    noPadding && styles.noPadding,
    // Only add extra bottom padding when not explicitly opting out via `noPadding`
    !noPadding && { paddingBottom: isMobile ? tabBarHeight + 16 : undefined },
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
      <View style={{ height: tabBarHeight + 24 }} />
    </ScrollView>
  ) : (
    <View style={containerStyle}>{children}</View>
  );

  // On web, SafeAreaView is a no-op but adds unnecessary wrapper
  if (Platform.OS === "web") {
    return (
      <View style={[styles.safe, { backgroundColor: colors.background }]}>
        <Image source={bgImage} style={styles.backgroundImage} />
        <GradientOverlay />
        {innerContent}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Image source={bgImage} style={styles.backgroundImage} />
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.3,
    zIndex: 0,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    zIndex: -1,
    overflow: "hidden",
  },
});

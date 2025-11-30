import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, Animated } from "react-native";
import { auth } from "../services/firebaseService";
import { onAuthStateChanged } from "firebase/auth";
import { TabNavigator } from "../navigation/TabNavigator";
import LoginScreen from "./LoginScreen";
import SignUpScreen from "./SignUpScreen";

export default function AuthNavigator() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animate loading screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if user is already authenticated
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Animated Background Gradient Effect */}
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />
        <View style={styles.gradientCircle3} />

        <Animated.View
          style={[
            styles.loadingContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* App Logo/Branding */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>📊</Text>
            </View>
            <Text style={styles.appName}>Caprianne Trdz</Text>
            <Text style={styles.appTagline}>Trading Performance System</Text>
          </View>

          {/* Loading Indicator */}
          <View style={styles.loaderWrapper}>
            <ActivityIndicator size="large" color="#00d4d4" />
            <Text style={styles.loadingText}>Loading your workspace...</Text>
          </View>

          {/* Loading Progress Dots */}
          <View style={styles.dotsContainer}>
            <LoadingDot delay={0} />
            <LoadingDot delay={200} />
            <LoadingDot delay={400} />
          </View>
        </Animated.View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>
    );
  }

  // User is logged in, show app
  if (user) {
    return <TabNavigator />;
  }

  // User is not logged in, show auth screens
  if (showSignUp) {
    return (
      <SignUpScreen navigation={{ navigate: () => setShowSignUp(false) }} />
    );
  }

  return (
    <LoginScreen
      navigation={{ navigate: () => setShowSignUp(true), replace: () => {} }}
    />
  );
}

// Animated Loading Dot Component
function LoadingDot({ delay }: { delay: number }) {
  const animValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
    position: 'relative',
    overflow: 'hidden',
  },
  gradientCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#00d4d4',
    opacity: 0.05,
    top: -100,
    right: -100,
  },
  gradientCircle2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#4caf50',
    opacity: 0.03,
    bottom: -150,
    left: -150,
  },
  gradientCircle3: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#00d4d4',
    opacity: 0.04,
    bottom: 100,
    right: -50,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    borderWidth: 3,
    borderColor: '#00d4d4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#00d4d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoIcon: {
    fontSize: 48,
  },
  appName: {
    color: '#f5f5f5',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  appTagline: {
    color: '#00d4d4',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  loaderWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00d4d4',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 32,
  },
  versionText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
});
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { auth } from "../services/firebaseService";
import { onAuthStateChanged } from "firebase/auth";
import { TabNavigator } from "../navigation/TabNavigator";
import LoginScreen from "./LoginScreen";
import SignUpScreen from "./SignUpScreen";

export default function AuthNavigator() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0d0d0d",
        }}
      >
        <ActivityIndicator size="large" color="#00d4d4" />
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

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebaseService";

export default function ResetPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      Alert.alert(
        "Success",
        `Password reset link sent to ${email}. Check your inbox.`
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Reset Password</Text>

      <Text style={styles.description}>
        Enter your email address and we'll send you a link to reset your
        password.
      </Text>

      <View style={styles.section}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!resetSent}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading || resetSent}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Sending..."
              : resetSent
              ? "Email Sent"
              : "Send Reset Link"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      {resetSent && (
        <View style={styles.successMessage}>
          <Text style={styles.successText}>
            ✓ Check your email for the password reset link. It may take a few
            minutes to arrive.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181c20",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
    color: "#f5f5f5",
  },
  description: {
    color: "#888",
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  input: {
    width: "100%",
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  button: {
    backgroundColor: "#00d4d4",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#181c20",
    fontWeight: "700",
    fontSize: 16,
  },
  link: {
    color: "#00d4d4",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  successMessage: {
    backgroundColor: "#1a3a1a",
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  successText: {
    color: "#4caf50",
    fontWeight: "600",
    lineHeight: 20,
  },
});

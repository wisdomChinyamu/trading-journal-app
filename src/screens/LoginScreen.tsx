import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { useTheme } from "../components/ThemeProvider";

export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email address");
      return false;
    }
    if (!email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    if (!password) {
      Alert.alert("Validation Error", "Please enter your password");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Welcome back to Caprianne Trdz!");
      navigation.replace("Dashboard"); // Navigate to dashboard after login
    } catch (error: any) {
      let errorMessage = "An error occurred during login";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email. Please sign up first.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again or reset your password.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled. Please contact support.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later or reset your password.";
      }
      
      Alert.alert("Login Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoBadge, { backgroundColor: `${colors.highlight}20` }]}>
            <Text style={[styles.logoIcon, { color: colors.highlight }]}>📊</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Sign in to continue tracking your trades
          </Text>
        </View>

        {/* Form Card */}
        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Email Address
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    focusedField === "email"
                      ? colors.highlight
                      : `${colors.text}20`,
                  borderWidth: 2,
                },
              ]}
            >
              <Text style={[styles.inputIcon, { color: colors.subtext }]}>
                ✉️
              </Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="trader@example.com"
                placeholderTextColor={colors.subtext}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    focusedField === "password"
                      ? colors.highlight
                      : `${colors.text}20`,
                  borderWidth: 2,
                },
              ]}
            >
              <Text style={[styles.inputIcon, { color: colors.subtext }]}>
                🔒
              </Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.subtext}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={[styles.eyeIcon, { color: colors.subtext }]}>
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate("ResetPassword")}
            style={styles.forgotPassword}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.highlight }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: loading ? colors.neutral : colors.highlight,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color={colors.background} />
                <Text style={[styles.buttonText, { color: colors.background }]}>
                  Signing In...
                </Text>
              </View>
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statIcon, { color: colors.highlight }]}>
                📈
              </Text>
              <Text style={[styles.statText, { color: colors.subtext }]}>
                Track Trades
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.neutral }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statIcon, { color: colors.highlight }]}>
                📊
              </Text>
              <Text style={[styles.statText, { color: colors.subtext }]}>
                Analytics
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.neutral }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statIcon, { color: colors.highlight }]}>
                🎯
              </Text>
              <Text style={[styles.statText, { color: colors.subtext }]}>
                SMC Tools
              </Text>
            </View>
          </View>
        </View>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.subtext }]}>
            Don't have an account?
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("SignUp")}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[styles.link, { color: colors.highlight }]}>
              Sign up here
            </Text>
          </TouchableOpacity>
        </View>

        {/* Branding */}
        <View style={styles.branding}>
          <Text style={[styles.brandingText, { color: colors.subtext }]}>
            Caprianne Trdz
          </Text>
          <Text style={[styles.brandingSubtext, { color: colors.subtext }]}>
            Professional Trading Performance System
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500",
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    shadowColor: '#00d4d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonText: {
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: "row",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  statIcon: {
    fontSize: 20,
  },
  statText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    opacity: 0.3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  link: {
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  branding: {
    alignItems: "center",
    marginTop: 32,
    gap: 4,
  },
  brandingText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  brandingSubtext: {
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.7,
  },
});
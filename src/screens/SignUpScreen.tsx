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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { useTheme } from "../components/ThemeProvider";

export default function SignUpScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email address");
      return false;
    }
    if (!email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "Account created successfully! Welcome to Caprianne Trdz.");
      navigation.replace("Dashboard"); // Navigate to dashboard after signup
    } catch (error: any) {
      let errorMessage = "An error occurred during sign up";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please login instead.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please use a stronger password.";
      }
      
      Alert.alert("Sign Up Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: "", color: colors.subtext };
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    let label = "";
    let color = colors.lossEnd;
    
    if (strength <= 25) {
      label = "Weak";
      color = colors.lossEnd;
    } else if (strength <= 50) {
      label = "Fair";
      color = "#ffa726";
    } else if (strength <= 75) {
      label = "Good";
      color = colors.profitStart;
    } else {
      label = "Strong";
      color = colors.profitEnd;
    }
    
    return { strength, label, color };
  };

  const passwordStrength = getPasswordStrength();

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
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Join Caprianne Trdz and start tracking your trades
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
                placeholder="Minimum 6 characters"
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
            
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={[styles.strengthBar, { backgroundColor: `${colors.text}10` }]}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${passwordStrength.strength}%`,
                        backgroundColor: passwordStrength.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Confirm Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    focusedField === "confirmPassword"
                      ? colors.highlight
                      : `${colors.text}20`,
                  borderWidth: 2,
                },
              ]}
            >
              <Text style={[styles.inputIcon, { color: colors.subtext }]}>
                🔐
              </Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.subtext}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Text style={[styles.eyeIcon, { color: colors.subtext }]}>
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <View style={styles.matchContainer}>
                {password === confirmPassword ? (
                  <Text style={[styles.matchText, { color: colors.profitEnd }]}>
                    ✓ Passwords match
                  </Text>
                ) : (
                  <Text style={[styles.matchText, { color: colors.lossEnd }]}>
                    ✗ Passwords do not match
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: loading ? colors.neutral : colors.highlight,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color={colors.background} />
                <Text style={[styles.buttonText, { color: colors.background }]}>
                  Creating Account...
                </Text>
              </View>
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Features List */}
          <View style={styles.featuresList}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>
              What you'll get:
            </Text>
            <View style={styles.feature}>
              <Text style={[styles.featureIcon, { color: colors.highlight }]}>
                ✓
              </Text>
              <Text style={[styles.featureText, { color: colors.subtext }]}>
                Track unlimited trades with detailed analytics
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={[styles.featureIcon, { color: colors.highlight }]}>
                ✓
              </Text>
              <Text style={[styles.featureText, { color: colors.subtext }]}>
                Custom SMC checklists and strategies
              </Text>
            </View>
            <View style={styles.feature}>
              <Text style={[styles.featureIcon, { color: colors.highlight }]}>
                ✓
              </Text>
              <Text style={[styles.featureText, { color: colors.subtext }]}>
                Psychology logging and emotional tracking
              </Text>
            </View>
          </View>
        </View>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.subtext }]}>
            Already have an account?
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[styles.link, { color: colors.highlight }]}>
              Login here
            </Text>
          </TouchableOpacity>
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
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    minWidth: 50,
  },
  matchContainer: {
    marginTop: 8,
  },
  matchText: {
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 8,
    marginBottom: 20,
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
  featuresList: {
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    fontSize: 16,
    fontWeight: "700",
  },
  featureText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    lineHeight: 18,
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
});
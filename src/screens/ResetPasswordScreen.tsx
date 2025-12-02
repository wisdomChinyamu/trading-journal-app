import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";
import { useTheme } from "../components/ThemeProvider";

export default function ResetPasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateEmail = () => {
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email address");
      return false;
    }
    if (!email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      Alert.alert(
        "Success",
        `Password reset link sent to ${email}. Check your inbox and spam folder.`
      );
    } catch (error: any) {
      let errorMessage = "Failed to send reset email";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = () => {
    setResetSent(false);
    setEmail("");
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
          <View style={[styles.iconBadge, { backgroundColor: `${colors.highlight}20` }]}>
            <Text style={[styles.iconText, { color: colors.highlight }]}>
              🔐
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Enter your email address and we'll send you a link to reset your password
          </Text>
        </View>

        {/* Form Card */}
        {!resetSent ? (
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

            {/* Reset Button */}
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: loading ? colors.neutral : colors.highlight,
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color={colors.background} />
                  <Text style={[styles.buttonText, { color: colors.background }]}>
                    Sending Link...
                  </Text>
                </View>
              ) : (
                <Text style={[styles.buttonText, { color: colors.background }]}>
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>

            {/* Info Section */}
            <View style={[styles.infoSection, { backgroundColor: `${colors.highlight}10` }]}>
              <Text style={[styles.infoIcon, { color: colors.highlight }]}>
                ℹ️
              </Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>
                  What happens next?
                </Text>
                <Text style={[styles.infoText, { color: colors.subtext }]}>
                  We'll send you an email with a secure link to reset your password. 
                  The link expires in 1 hour for security.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* Success Card */
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <View style={[styles.successBadge, { backgroundColor: `${colors.profitEnd}20` }]}>
              <Text style={[styles.successIcon, { color: colors.profitEnd }]}>
                ✓
              </Text>
            </View>
            
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Check Your Email
            </Text>
            
            <Text style={[styles.successText, { color: colors.subtext }]}>
              We've sent a password reset link to:
            </Text>
            
            <View style={[styles.emailBadge, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emailText, { color: colors.highlight }]}>
                {email}
              </Text>
            </View>

            <View style={[styles.instructionsCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.instructionsTitle, { color: colors.text }]}>
                Next Steps:
              </Text>
              <View style={styles.step}>
                <Text style={[styles.stepNumber, { color: colors.highlight }]}>
                  1
                </Text>
                <Text style={[styles.stepText, { color: colors.subtext }]}>
                  Check your inbox (and spam folder)
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={[styles.stepNumber, { color: colors.highlight }]}>
                  2
                </Text>
                <Text style={[styles.stepText, { color: colors.subtext }]}>
                  Click the reset link in the email
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={[styles.stepNumber, { color: colors.highlight }]}>
                  3
                </Text>
                <Text style={[styles.stepText, { color: colors.subtext }]}>
                  Create a new secure password
                </Text>
              </View>
            </View>

            {/* Resend Button */}
            <TouchableOpacity
              style={[
                styles.resendButton,
                { backgroundColor: colors.surface, borderColor: colors.highlight },
              ]}
              onPress={handleResendEmail}
              activeOpacity={0.7}
            >
              <Text style={[styles.resendButtonText, { color: colors.highlight }]}>
                Send to Different Email
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Back to Login */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, { color: colors.subtext }]}>←</Text>
          <Text style={[styles.backText, { color: colors.text }]}>
            Back to Login
          </Text>
        </TouchableOpacity>

        {/* Support */}
        <View style={styles.supportSection}>
          <Text style={[styles.supportText, { color: colors.subtext }]}>
            Need help?
          </Text>
          <Text style={[styles.supportEmail, { color: colors.highlight }]}>
            support@capriannetrdz.com
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconText: {
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
    maxWidth: 320,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 24,
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
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
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
  infoSection: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
    gap: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  successCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 40,
    fontWeight: "700",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  successText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 16,
  },
  emailBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  emailText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  instructionsCard: {
    borderRadius: 12,
    padding: 20,
    width: "100%",
    marginBottom: 24,
    gap: 16,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "900",
    width: 24,
    height: 24,
    textAlign: "center",
    lineHeight: 24,
  },
  stepText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    lineHeight: 20,
  },
  resendButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 2,
    width: "100%",
    alignItems: "center",
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  backIcon: {
    fontSize: 20,
  },
  backText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  supportSection: {
    alignItems: "center",
    gap: 6,
  },
  supportText: {
    fontSize: 13,
    fontWeight: "500",
  },
  supportEmail: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
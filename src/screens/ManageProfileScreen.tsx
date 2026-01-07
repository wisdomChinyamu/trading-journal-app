import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useAppContext } from "../hooks/useAppContext";
import { useTheme } from "../components/ThemeProvider";
import { createUserProfile } from "../services/firebaseService";

export default function ManageProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { state: appState, dispatch } = useAppContext();
  const [firstName, setFirstName] = useState(appState.user?.firstName || "");
  const [lastName, setLastName] = useState(appState.user?.lastName || "");
  const [username, setUsername] = useState(appState.user?.username || "");
  const [loading, setLoading] = useState(false);
  const [displayPreference, setDisplayPreference] = useState<
    "firstName" | "username"
  >(
    (appState.user as any)?.displayPreference === "username"
      ? "username"
      : "firstName"
  );

  useEffect(() => {
    setFirstName(appState.user?.firstName || "");
    setLastName(appState.user?.lastName || "");
    setUsername(appState.user?.username || "");
    setDisplayPreference(
      (appState.user as any)?.displayPreference === "username"
        ? "username"
        : "firstName"
    );
  }, [appState.user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const uid = appState.user?.uid;
      if (!uid) throw new Error("No authenticated user");
      await createUserProfile(uid, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        username: username || undefined,
        displayPreference,
      });

      const updatedUser = {
        uid: appState.user?.uid || "",
        email: appState.user?.email || "",
        username: username || appState.user?.username || "",
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        displayPreference,
        timezone:
          appState.user?.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: appState.user?.createdAt || new Date(),
      };

      dispatch({ type: "SET_USER", payload: updatedUser });

      try {
        navigation.navigate("SettingsMain");
      } catch (e) {
        navigation.goBack();
      }
    } catch (e) {
      console.error("Failed to save profile", e);
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Manage Profile
        </Text>
      </View> */}

      <View style={[styles.form, { backgroundColor: colors.card }]}>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
          placeholderTextColor={colors.subtext}
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.text },
          ]}
        />
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
          placeholderTextColor={colors.subtext}
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.text },
          ]}
        />
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor={colors.subtext}
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.text },
          ]}
        />

        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.subtext, marginBottom: 8 }}>
            Display name on Dashboard
          </Text>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => setDisplayPreference("firstName")}
              style={[
                styles.scaleOption,
                displayPreference === "firstName" && styles.scaleOptionActive,
                {
                  flex: 1,
                  paddingVertical: 10,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.scaleOptionText,
                  {
                    color:
                      displayPreference === "firstName"
                        ? colors.highlight
                        : colors.text,
                  },
                ]}
              >
                First name
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDisplayPreference("username")}
              style={[
                styles.scaleOption,
                displayPreference === "username" && styles.scaleOptionActive,
                {
                  flex: 1,
                  paddingVertical: 10,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.scaleOptionText,
                  {
                    color:
                      displayPreference === "username"
                        ? colors.highlight
                        : colors.text,
                  },
                ]}
              >
                Username
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.highlight }]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={[styles.saveText, { color: colors.background }]}>
            Save Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  title: { fontSize: 20, fontWeight: "800" },
  form: { margin: 16, borderRadius: 12, padding: 16 },
  input: { borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1 },
  saveButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { fontWeight: "800" },
  scaleOption: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  scaleOptionActive: { borderWidth: 1, borderColor: "#888" },
  scaleOptionText: { fontWeight: "700" },
});

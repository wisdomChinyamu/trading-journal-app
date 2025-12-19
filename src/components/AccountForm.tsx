import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { TradingAccount } from "../types";

interface AccountFormProps {
  account?: TradingAccount | null;
  onSave: (name: string, startingBalance: number) => Promise<void>;
  onCancel: () => void;
  onDelete?: (accountId: string) => Promise<void>;
}

export default function AccountForm({
  account,
  onSave,
  onCancel,
  onDelete,
}: AccountFormProps) {
  const [name, setName] = useState(account?.name || "");
  const [startingBalance, setStartingBalance] = useState(
    account?.startingBalance.toString() || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setStartingBalance(account.startingBalance.toString());
    }
  }, [account]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter an account name");
      return;
    }

    const balance = parseFloat(startingBalance);
    if (isNaN(balance) || balance <= 0) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid starting balance"
      );
      return;
    }

    setIsLoading(true);
    try {
      await onSave(name, balance);
    } catch (error) {
      console.error("Error saving account:", error);
      Alert.alert(
        "Error",
        account
          ? "Failed to update account"
          : "Failed to create account"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;

    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete this account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (onDelete) {
              setIsLoading(true);
              try {
                await onDelete(account.id);
              } catch (error) {
                console.error("Error deleting account:", error);
                Alert.alert("Error", "Failed to delete account");
              } finally {
                setIsLoading(false);
              }
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {account ? "Edit Account" : "Create Account"}
          </Text>
          <Text style={styles.subtitle}>
            {account
              ? "Update your account details"
              : "Add a new trading account"}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Demo Account"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Starting Balance ($)</Text>
            <TextInput
              style={styles.input}
              value={startingBalance}
              onChangeText={setStartingBalance}
              placeholder="0.00"
              keyboardType="decimal-pad"
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? "Saving..." : account ? "Update" : "Create"}
            </Text>
          </TouchableOpacity>
        </View>

        {account && onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isLoading}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  input: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#2a2a2a",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#00d4d4",
  },
  saveButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    padding: 16,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f4433620",
  },
  deleteButtonText: {
    color: "#f44336",
    fontSize: 16,
    fontWeight: "600",
  },
});
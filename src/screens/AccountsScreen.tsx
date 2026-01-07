// @ts-ignore
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useAppContext } from "../hooks/useAppContext";
import {
  createAccount,
  updateAccount,
  deleteAccount,
  getUserAccounts,
  addAccountTransaction,
} from "../services/firebaseService";
import ConfirmModal from "../components/ConfirmModal";
import { auth } from "../config/firebase";
import { useToast } from "../context/ToastContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import AccountCard from "../components/AccountDetailsPanel";
import AccountModal from "../components/AccountModal";
import { TradingAccount } from "../types";

const AccountsScreen = () => {
  const { state, dispatch } = useAppContext();
  const toast = useToast();
  const navigation = useNavigation();
  const route = useRoute();
  const originTab = (route as any)?.params?.origin;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(
    null
  );
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const handleCreateAccount = async (
    name: string,
    startingBalance: number,
    type: "demo" | "live" = "demo"
  ) => {
    try {
      if (!state.user?.uid) {
        throw new Error("User not authenticated");
      }

      const currentUid = auth?.currentUser?.uid;
      if (!currentUid) {
        throw new Error("No authenticated user found. Cannot create account.");
      }

      if (state.user.uid !== currentUid) {
        console.warn(
          `State user UID (${state.user.uid}) differs from auth.currentUser.uid (${currentUid}). Using authenticated UID.`
        );
      }

      const accountId = await createAccount(
        currentUid,
        name,
        startingBalance,
        type
      );

      // Refresh accounts list
      const updatedAccounts = await getUserAccounts(state.user.uid);
      dispatch({ type: "SET_ACCOUNTS", payload: updatedAccounts });

      setIsModalVisible(false);
      setEditingAccount(null);
      try {
        toast.show("Account created successfully", "success");
      } catch (e) {}
    } catch (error) {
      console.error("Error creating account:", error);
      try {
        toast.show("Failed to create account", "error");
      } catch (e) {}
      Alert.alert("Error", "Failed to create account");
    }
  };

  const handleUpdateAccount = async (
    accountId: string,
    updates: Partial<TradingAccount>
  ) => {
    try {
      await updateAccount(accountId, updates);

      // Refresh accounts list
      if (state.user?.uid) {
        const updatedAccounts = await getUserAccounts(state.user.uid);
        dispatch({ type: "SET_ACCOUNTS", payload: updatedAccounts });
      }

      setEditingAccount(null);
      setIsModalVisible(false);
      try {
        toast.show("Account updated successfully", "success");
      } catch (e) {}
    } catch (error) {
      console.error("Error updating account:", error);
      try {
        toast.show("Failed to update account", "error");
      } catch (e) {}
      Alert.alert("Error", "Failed to update account");
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteAccount(accountId);

      // Refresh accounts list
      if (state.user?.uid) {
        const updatedAccounts = await getUserAccounts(state.user.uid);
        dispatch({ type: "SET_ACCOUNTS", payload: updatedAccounts });
      }

      setEditingAccount(null);
      setIsModalVisible(false);
      try {
        toast.show("Account deleted successfully", "success");
      } catch (e) {}
    } catch (error) {
      console.error("Error deleting account:", error);
      try {
        toast.show("Failed to delete account", "error");
      } catch (e) {}
      Alert.alert("Error", "Failed to delete account");
    }
  };

  const handleTransaction = async (
    accountId: string,
    newBalance: number,
    type?: "deposit" | "withdrawal",
    amount?: number
  ) => {
    try {
      await updateAccount(accountId, { currentBalance: newBalance });

      // record the transaction if we have type/amount and a user
      if (type && typeof amount === "number" && state.user?.uid) {
        try {
          await addAccountTransaction(
            state.user.uid,
            accountId,
            type,
            amount,
            newBalance
          );
        } catch (err) {
          console.warn("Failed to persist transaction record", err);
        }
      }

      if (state.user?.uid) {
        const updatedAccounts = await getUserAccounts(state.user.uid);
        dispatch({ type: "SET_ACCOUNTS", payload: updatedAccounts });
      }
    } catch (error) {
      console.error("Error applying transaction:", error);
      try {
        toast.show("Failed to apply transaction", "error");
      } catch (e) {}
      Alert.alert("Error", "Failed to apply transaction");
    }
  };

  const openEditModal = (account: TradingAccount) => {
    setEditingAccount(account);
    setIsModalVisible(true);
  };

  const openCreateModal = () => {
    setEditingAccount(null);
    setIsModalVisible(true);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {originTab ? (
            <TouchableOpacity
              onPress={() => {
                try {
                  if (originTab === "Dashboard")
                    (navigation as any).navigate("Dashboard");
                  else if (originTab === "Journal")
                    (navigation as any).navigate("Journal");
                  else if (originTab === "Analytics")
                    (navigation as any).navigate("Analytics");
                  else navigation.goBack();
                } catch (e) {
                  navigation.goBack();
                }
              }}
              style={{ padding: 8 }}
            >
              <Text style={{ color: "#00d4d4", fontWeight: "700" }}>
                ← Back
              </Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.subtitle}>
              Manage your demo and live trading accounts
            </Text>
          </View>
          <View style={{ width: 64 }} />
        </View>
      </View>

      {/* Add Account Button */}
      <TouchableOpacity
        style={styles.addAccountButton}
        onPress={openCreateModal}
      >
        <Text style={styles.addAccountButtonText}>+ Add New Account</Text>
      </TouchableOpacity>

      {/* Accounts List */}
      <View style={styles.accountsList}>
        {state.accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No accounts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first trading account to get started
            </Text>
          </View>
        ) : (
          state.accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => openEditModal(account)}
              onDelete={() => {
                setAccountToDelete(account.id);
                setConfirmDeleteVisible(true);
              }}
              onTransaction={handleTransaction}
            />
          ))
        )}
      </View>

      <ConfirmModal
        visible={confirmDeleteVisible}
        title="Delete Account"
        message="Are you sure you want to delete this account? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          setConfirmDeleteVisible(false);
          if (accountToDelete) await handleDeleteAccount(accountToDelete);
          setAccountToDelete(null);
        }}
        onCancel={() => {
          setConfirmDeleteVisible(false);
          setAccountToDelete(null);
        }}
      />

      {/* Account Modal */}
      <AccountModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setEditingAccount(null);
        }}
        accounts={state.accounts}
        selectedAccountId={editingAccount?.id || ""}
        onSelect={() => {}}
        onAddAccount={openCreateModal}
        onCreateAccount={handleCreateAccount}
        onUpdateAccount={handleUpdateAccount}
        onDeleteAccount={handleDeleteAccount}
        editingAccount={editingAccount}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
  },
  addAccountButton: {
    backgroundColor: "#00d4d4",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  addAccountButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  accountsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#888",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

export default AccountsScreen;

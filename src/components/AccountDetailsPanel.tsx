import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { TradingAccount } from "../types";
import {
  getAccountTransactions,
  deleteAccountTransaction,
} from "../services/firebaseService";
import ConfirmModal from "./ConfirmModal";

interface AccountDetailsPanelProps {
  account: TradingAccount;
  onEdit?: () => void;
  onDelete?: () => void;
  onTransaction?: (
    accountId: string,
    newBalance: number,
    type: "deposit" | "withdrawal",
    amount: number,
    transactionTime?: Date | string,
  ) => Promise<void> | void;
}

export default function AccountDetailsPanel({
  account,
  onEdit,
  onDelete,
  onTransaction,
}: AccountDetailsPanelProps) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<
    "deposit" | "withdrawal"
  >("deposit");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [transactionTimeText, setTransactionTimeText] = useState<string>(
    new Date().toISOString().slice(11, 16),
  );
  const [transactions, setTransactions] = useState<any[]>([]);
  const [deleteTransactionVisible, setDeleteTransactionVisible] =
    useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null,
  );

  const balanceChange = account.currentBalance - account.startingBalance;
  const balanceChangePercentage = (
    (balanceChange / account.startingBalance) *
    100
  ).toFixed(2);
  const isProfit = balanceChange >= 0;

  const handleTransaction = () => {
    // Parse amount and apply transaction via callback if provided
    const parsed = Number(amount) || 0;
    if (parsed <= 0) {
      // ignore or show error
      setShowTransactionModal(false);
      setAmount("");
      return;
    }
    const newBalance =
      transactionType === "deposit"
        ? Number(account.currentBalance || 0) + parsed
        : Number(account.currentBalance || 0) - parsed;

    // Build transaction timestamp from selected date + time string (HH:MM)
    let txnTime: Date | undefined = undefined;
    try {
      const td = transactionDate ? new Date(transactionDate) : new Date();
      const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
      if (transactionTimeText && timeRegex.test(transactionTimeText)) {
        const [hh, mm] = transactionTimeText
          .split(":")
          .map((s) => parseInt(s, 10));
        if (!isNaN(hh) && !isNaN(mm)) {
          td.setHours(hh, mm, 0, 0);
          txnTime = td;
        }
      } else {
        // If user didn't provide valid time, default to start of day time
        td.setHours(0, 0, 0, 0);
        txnTime = td;
      }
    } catch (e) {
      txnTime = new Date(); // Default to current moment
    }

    // Ensure txnTime is never undefined (should default to now)
    if (!txnTime) {
      txnTime = new Date();
    }

    if (onTransaction) {
      try {
        // allow parent to persist and refresh accounts and record transaction
        const maybePromise = onTransaction(
          account.id,
          newBalance,
          transactionType,
          parsed,
          txnTime,
        );
        Promise.resolve(maybePromise).then(() => fetchTransactions());
      } catch (err) {
        console.error("Transaction error", err);
      }
    }

    setShowTransactionModal(false);
    setAmount("");
  };

  const fetchTransactions = async () => {
    try {
      const items = await getAccountTransactions(account.id, 10);
      // Normalize createdAt to Date and ensure id exists
      const normalized = (items || []).map((it: any) => ({
        id: it.id || `${Math.random().toString(36).slice(2, 9)}`,
        ...it,
        createdAt:
          it?.createdAt &&
          typeof it.createdAt === "object" &&
          typeof it.createdAt.toDate === "function"
            ? it.createdAt.toDate()
            : it?.createdAt instanceof Date
              ? it.createdAt
              : new Date(it?.createdAt || Date.now()),
      }));
      // Normalize transactionTime as well (use it for display/calculation if available, fallback to createdAt)
      const withTransactionTime = normalized.map((it: any) => ({
        ...it,
        transactionTime:
          it?.transactionTime &&
          typeof it.transactionTime === "object" &&
          typeof it.transactionTime.toDate === "function"
            ? it.transactionTime.toDate()
            : it?.transactionTime instanceof Date
              ? it.transactionTime
              : it?.transactionTime
                ? new Date(it.transactionTime)
                : it.createdAt,
      }));
      console.debug(
        "fetched transactions for account",
        account.id,
        withTransactionTime.length,
      );
      setTransactions(withTransactionTime);
    } catch (err) {
      console.error("Failed to load transactions", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [account.id]);

  return (
    <>
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{account.name}</Text>
            <Text style={styles.accountId}>ID: {account.id}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isProfit ? "#4caf5020" : "#f4433620" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isProfit ? "#4caf50" : "#f44336" },
              ]}
            >
              {isProfit ? "↑" : "↓"}{" "}
              {Math.abs(parseFloat(balanceChangePercentage))}%
            </Text>
          </View>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceGrid}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceIcon}>
              <Text style={styles.balanceIconText}>💰</Text>
            </View>
            <Text style={styles.balanceLabel}>Starting</Text>
            <Text style={styles.balanceValue}>
              ${account.startingBalance.toLocaleString()}
            </Text>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceIcon}>
              <Text style={styles.balanceIconText}>📊</Text>
            </View>
            <Text style={styles.balanceLabel}>Current</Text>
            <Text style={[styles.balanceValue, { color: "#00d4d4" }]}>
              ${account.currentBalance.toLocaleString()}
            </Text>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceIcon}>
              <Text style={styles.balanceIconText}>
                {isProfit ? "📈" : "📉"}
              </Text>
            </View>
            <Text style={styles.balanceLabel}>Change</Text>
            <Text
              style={[
                styles.balanceValue,
                { color: isProfit ? "#4caf50" : "#f44336" },
              ]}
            >
              {isProfit ? "+" : ""}${balanceChange.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Performance Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ROI</Text>
            <Text
              style={[
                styles.statValue,
                { color: isProfit ? "#4caf50" : "#f44336" },
              ]}
            >
              {isProfit ? "+" : ""}
              {balanceChangePercentage}%
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Type</Text>
            <Text style={styles.statValue}>
              {account.type
                ? account.type === "demo"
                  ? "Demo"
                  : "Live"
                : "Demo"}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statValue, { color: "#4caf50" }]}>Active</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.depositButton]}
            onPress={() => {
              setTransactionType("deposit");
              setTransactionDate(new Date());
              setTransactionTimeText(new Date().toISOString().slice(11, 16));
              setShowTransactionModal(true);
            }}
          >
            <Text style={styles.actionIcon}>💵</Text>
            <Text style={styles.actionText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => {
              setTransactionType("withdrawal");
              setTransactionDate(new Date());
              setTransactionTimeText(new Date().toISOString().slice(11, 16));
              setShowTransactionModal(true);
            }}
          >
            <Text style={styles.actionIcon}>💸</Text>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Edit/Delete Actions */}
        {(onEdit || onDelete) && (
          <View
            style={[
              styles.accountActions,
              {
                justifyContent: "space-between",
                borderTopWidth: 1,
                borderTopColor: "#333",
                paddingTop: 16,
                marginTop: 16,
              },
            ]}
          >
            {onEdit && (
              <TouchableOpacity
                style={[
                  styles.accountActionButton,
                  { padding: 8, backgroundColor: "#2a2a2a" },
                ]}
                onPress={onEdit}
              >
                <Text style={[styles.editIcon, { marginRight: 6 }]}>✏️</Text>
                <Text style={[styles.accountActionText, { fontWeight: "600" }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[
                  styles.accountActionButton,
                  { padding: 8, backgroundColor: "#2a2a2a" },
                ]}
                onPress={onDelete}
              >
                <Text style={[styles.deleteIcon, { marginRight: 6 }]}>🗑️</Text>
                <Text style={[styles.accountActionText, { fontWeight: "600" }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          {transactions && transactions.length > 0 ? (
            <View style={{ gap: 8 }}>
              {transactions.map((t) => (
                <View
                  key={t.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#0d0d0d",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {t.type === "deposit" ? "Deposit" : "Withdrawal"}
                    </Text>
                    <Text style={{ color: "#888", fontSize: 12 }}>
                      {new Date(
                        t.transactionTime || t.createdAt,
                      ).toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                    <Text
                      style={{
                        color: t.type === "deposit" ? "#4caf50" : "#f44336",
                        fontWeight: "700",
                      }}
                    >
                      ${Number(t.amount).toLocaleString()}
                    </Text>
                    <Text style={{ color: "#888", fontSize: 12 }}>
                      Balance: ${Number(t.balanceAfter).toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setTransactionToDelete(t.id);
                      setDeleteTransactionVisible(true);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Text style={{ fontSize: 16 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No recent transactions</Text>
            </View>
          )}
        </View>
      </View>

      {/* Delete Transaction Confirmation Modal */}
      <ConfirmModal
        visible={deleteTransactionVisible}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This will revert the balance change."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          if (transactionToDelete) {
            try {
              await deleteAccountTransaction(transactionToDelete);
              setDeleteTransactionVisible(false);
              setTransactionToDelete(null);
              await fetchTransactions();
            } catch (err) {
              console.error("Error deleting transaction", err);
            }
          }
        }}
        onCancel={() => {
          setDeleteTransactionVisible(false);
          setTransactionToDelete(null);
        }}
      />

      {/* Transaction Modal */}
      <Modal
        visible={showTransactionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {transactionType === "deposit"
                  ? "💵 Deposit Funds"
                  : "💸 Withdraw Funds"}
              </Text>
              <TouchableOpacity onPress={() => setShowTransactionModal(false)}>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={styles.inputLabel}>Transaction Date</Text>
                {Platform.OS === "web" ? (
                  <input
                    type="date"
                    value={
                      transactionDate && !isNaN(transactionDate.getTime())
                        ? transactionDate.toISOString().slice(0, 10)
                        : ""
                    }
                    onChange={(e: any) => {
                      const v = e?.target?.value;
                      if (!v) return;
                      const d = new Date(v);
                      if (!isNaN(d.getTime())) setTransactionDate(d);
                    }}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: "#0d0d0d",
                      color: "#fff",
                      border: "1px solid rgba(0,212,212,0.08)",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <TextInput
                    style={styles.priceInput}
                    value={
                      transactionDate && !isNaN(transactionDate.getTime())
                        ? transactionDate.toISOString().slice(0, 10)
                        : ""
                    }
                    onChangeText={(t) => {
                      const d = new Date(t);
                      if (!isNaN(d.getTime())) setTransactionDate(d);
                    }}
                  />
                )}

                <View style={{ marginTop: 12 }} />
                <Text style={styles.inputLabel}>Transaction Time (HH:MM)</Text>
                <TextInput
                  style={styles.priceInput}
                  value={transactionTimeText}
                  onChangeText={setTransactionTimeText}
                  placeholder="14:30"
                />
              </View>

              <View style={styles.quickAmounts}>
                {["100", "500", "1000", "5000"].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={styles.quickAmountButton}
                    onPress={() => setAmount(preset)}
                  >
                    <Text style={styles.quickAmountText}>${preset}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleTransaction}
                >
                  <Text style={styles.confirmButtonText}>
                    {transactionType === "deposit"
                      ? "Deposit Funds"
                      : "Withdraw Funds"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowTransactionModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Transaction Confirmation Modal */}
      <ConfirmModal
        visible={deleteTransactionVisible}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This will revert the balance change."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          if (transactionToDelete) {
            try {
              await deleteAccountTransaction(transactionToDelete);
              setDeleteTransactionVisible(false);
              setTransactionToDelete(null);
              await fetchTransactions();
            } catch (err) {
              console.error("Error deleting transaction", err);
            }
          }
        }}
        onCancel={() => {
          setDeleteTransactionVisible(false);
          setTransactionToDelete(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.15)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
    color: "#fff",
  },
  accountId: {
    fontSize: 11,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  balanceGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  balanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceIconText: {
    fontSize: 18,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceValue: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 212, 212, 0.05)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  depositButton: {
    backgroundColor: "#4caf50",
  },
  withdrawButton: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#00d4d4",
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  activitySection: {
    marginTop: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  emptyActivity: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0d0d0d",
    borderRadius: 8,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
  accountActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 16,
    marginTop: 16,
  },
  accountActionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#2a2a2a",
  },
  editIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  deleteIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  accountActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 212, 0.2)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  closeIcon: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#aaa",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#00d4d4",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00d4d4",
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  quickAmounts: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    alignItems: "center",
  },
  quickAmountText: {
    color: "#00d4d4",
    fontSize: 13,
    fontWeight: "700",
  },
  priceInputWrapper: {
    gap: 8,
  },
  priceInput: {
    flex: 1,
    color: "#f5f5f5",
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
  },
  modalActions: {
    gap: 10,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#00d4d4",
  },
  confirmButtonText: {
    color: "#0d0d0d",
    fontSize: 15,
    fontWeight: "700",
  },
  cancelButton: {
    backgroundColor: "#2a2a2a",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

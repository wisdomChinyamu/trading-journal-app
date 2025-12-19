import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from "react-native";
import { TradingAccount } from "../types";

interface AccountDetailsPanelProps {
  account: TradingAccount;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function AccountDetailsPanel({
  account,
  onEdit,
  onDelete,
}: AccountDetailsPanelProps) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');

  const balanceChange = account.currentBalance - account.startingBalance;
  const balanceChangePercentage = ((balanceChange / account.startingBalance) * 100).toFixed(2);
  const isProfit = balanceChange >= 0;

  const handleTransaction = () => {
    // Handle deposit/withdrawal logic here
    console.log(`${transactionType}: $${amount}`);
    setShowTransactionModal(false);
    setAmount('');
  };

  return (
    <>
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{account.name}</Text>
            <Text style={styles.accountId}>ID: {account.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isProfit ? '#4caf5020' : '#f4433620' }]}>
            <Text style={[styles.statusText, { color: isProfit ? '#4caf50' : '#f44336' }]}>
              {isProfit ? '↑' : '↓'} {Math.abs(parseFloat(balanceChangePercentage))}%
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
            <Text style={[styles.balanceValue, { color: '#00d4d4' }]}>
              ${account.currentBalance.toLocaleString()}
            </Text>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceIcon}>
              <Text style={styles.balanceIconText}>{isProfit ? '📈' : '📉'}</Text>
            </View>
            <Text style={styles.balanceLabel}>Change</Text>
            <Text style={[styles.balanceValue, { color: isProfit ? '#4caf50' : '#f44336' }]}>
              {isProfit ? '+' : ''}${balanceChange.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Performance Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ROI</Text>
            <Text style={[styles.statValue, { color: isProfit ? '#4caf50' : '#f44336' }]}>
              {isProfit ? '+' : ''}{balanceChangePercentage}%
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Type</Text>
            <Text style={styles.statValue}>Demo</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statValue, { color: '#4caf50' }]}>Active</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.depositButton]}
            onPress={() => {
              setTransactionType('deposit');
              setShowTransactionModal(true);
            }}
          >
            <Text style={styles.actionIcon}>💵</Text>
            <Text style={styles.actionText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => {
              setTransactionType('withdrawal');
              setShowTransactionModal(true);
            }}
          >
            <Text style={styles.actionIcon}>💸</Text>
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
        
        {/* Edit/Delete Actions */}
        {(onEdit || onDelete) && (
          <View style={[styles.accountActions, {justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 16, marginTop: 16}]}>
            {onEdit && (
              <TouchableOpacity style={[styles.accountActionButton, {padding: 8, backgroundColor: '#2a2a2a'}]} onPress={onEdit}>
                <Text style={[styles.editIcon, {marginRight: 6}]}>✏️</Text>
                <Text style={[styles.accountActionText, {fontWeight: '600'}]}>Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={[styles.accountActionButton, {padding: 8, backgroundColor: '#2a2a2a'}]} onPress={onDelete}>
                <Text style={[styles.deleteIcon, {marginRight: 6}]}>🗑️</Text>
                <Text style={[styles.accountActionText, {fontWeight: '600'}]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Recent Activity Placeholder */}
        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No recent transactions</Text>
          </View>
        </View>
      </View>

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
                {transactionType === 'deposit' ? '💵 Deposit Funds' : '💸 Withdraw Funds'}
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

              <View style={styles.quickAmounts}>
                {['100', '500', '1000', '5000'].map((preset) => (
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
                    {transactionType === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
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
    borderColor: 'rgba(0, 212, 212, 0.15)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  balanceGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  balanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 212, 212, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  depositButton: {
    backgroundColor: '#4caf50',
  },
  withdrawButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#00d4d4',
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  activitySection: {
    marginTop: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  emptyActivity: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0d0d0d',
    borderRadius: 8,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  accountActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
    marginTop: 16,
  },
  accountActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 212, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00d4d4',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00d4d4',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    color: '#00d4d4',
    fontSize: 13,
    fontWeight: '700',
  },
  modalActions: {
    gap: 10,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#00d4d4',
  },
  confirmButtonText: {
    color: '#0d0d0d',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#2a2a2a',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
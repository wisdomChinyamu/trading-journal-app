// @ts-ignore
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { createAccount, updateAccount, deleteAccount, getUserAccounts } from '../services/firebaseService';
import AccountCard from '../components/AccountDetailsPanel';
import AccountModal from '../components/AccountModal';
import { TradingAccount } from '../types';

const AccountsScreen = () => {
  const { state, dispatch } = useAppContext();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);

  const handleCreateAccount = async (name: string, startingBalance: number) => {
    try {
      if (!state.user?.uid) {
        throw new Error('User not authenticated');
      }

      const accountId = await createAccount(state.user.uid, name, startingBalance);
      
      // Refresh accounts list
      const updatedAccounts = await getUserAccounts(state.user.uid);
      dispatch({ type: 'SET_ACCOUNTS', payload: updatedAccounts });
      
      setIsModalVisible(false);
      setEditingAccount(null);
      Alert.alert('Success', 'Account created successfully');
    } catch (error) {
      console.error('Error creating account:', error);
      Alert.alert('Error', 'Failed to create account');
    }
  };

  const handleUpdateAccount = async (accountId: string, updates: Partial<TradingAccount>) => {
    try {
      await updateAccount(accountId, updates);
      
      // Refresh accounts list
      if (state.user?.uid) {
        const updatedAccounts = await getUserAccounts(state.user.uid);
        dispatch({ type: 'SET_ACCOUNTS', payload: updatedAccounts });
      }
      
      setEditingAccount(null);
      setIsModalVisible(false);
      Alert.alert('Success', 'Account updated successfully');
    } catch (error) {
      console.error('Error updating account:', error);
      Alert.alert('Error', 'Failed to update account');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteAccount(accountId);
      
      // Refresh accounts list
      if (state.user?.uid) {
        const updatedAccounts = await getUserAccounts(state.user.uid);
        dispatch({ type: 'SET_ACCOUNTS', payload: updatedAccounts });
      }
      
      setEditingAccount(null);
      setIsModalVisible(false);
      Alert.alert('Success', 'Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account');
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
        <Text style={styles.title}>Trading Accounts</Text>
        <Text style={styles.subtitle}>Manage your demo and live trading accounts</Text>
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
            <Text style={styles.emptyStateSubtext}>Create your first trading account to get started</Text>
          </View>
        ) : (
          state.accounts.map((account) => (
            <AccountCard 
              key={account.id} 
              account={account} 
              onEdit={() => openEditModal(account)}
              onDelete={() => handleDeleteAccount(account.id)}
            />

          ))
        )}
      </View>

      {/* Account Modal */}
      <AccountModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setEditingAccount(null);
        }}
        accounts={state.accounts}
        selectedAccountId={editingAccount?.id || ''}
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
    backgroundColor: '#121212',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  addAccountButton: {
    backgroundColor: '#00d4d4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  addAccountButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  accountsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default AccountsScreen;
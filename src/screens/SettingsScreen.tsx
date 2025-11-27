import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useAppContext } from "../hooks/useAppContext";
import EditableChecklistTable from "../components/EditableChecklistTable";
import { ChecklistItem, Strategy } from "../types";
import {
  getUserStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
} from "../services/firebaseService";

export default function SettingsScreen() {
  const userId = "current-user"; // Replace with actual user ID from context/auth
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState("");

  useEffect(() => {
    setLoading(true);
    getUserStrategies(userId)
      .then(setStrategies)
      .finally(() => setLoading(false));
  }, []);

  const handleCreateStrategy = async () => {
    if (!newStrategyName.trim()) return;
    setLoading(true);
    const id = await createStrategy(userId, newStrategyName, []);
    const updated = await getUserStrategies(userId);
    setStrategies(updated);
    setNewStrategyName("");
    setSelectedStrategyId(id);
    setLoading(false);
  };

  const handleUpdateChecklist = async (items: ChecklistItem[]) => {
    if (!selectedStrategyId) return;
    setLoading(true);
    await updateStrategy(selectedStrategyId, { checklist: items });
    const updated = await getUserStrategies(userId);
    setStrategies(updated);
    setLoading(false);
  };

  const handleDeleteStrategy = async (id: string) => {
    setLoading(true);
    await deleteStrategy(id);
    const updated = await getUserStrategies(userId);
    setStrategies(updated);
    setSelectedStrategyId(null);
    setLoading(false);
  };
  const { state, dispatch } = useAppContext();

  const handleAddItem = (item: Omit<ChecklistItem, "id" | "createdAt">) => {
    dispatch({
      type: "ADD_CHECKLIST_ITEM",
      payload: { ...item, id: `item-${Date.now()}`, createdAt: new Date() },
    });
  };

  const handleUpdateItem = (item: ChecklistItem) => {
    dispatch({
      type: "UPDATE_CHECKLIST_ITEM",
      payload: item,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    dispatch({
      type: "DELETE_CHECKLIST_ITEM",
      payload: itemId,
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Settings</Text>

      {/* Strategy Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strategies & Checklists</Text>
        <Text style={styles.sectionDescription}>
          Create and manage strategies. Each strategy has its own checklist.
        </Text>

        {/* Create new strategy */}
        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="New strategy name"
            value={newStrategyName}
            onChangeText={setNewStrategyName}
            placeholderTextColor="#888"
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateStrategy}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* List strategies */}
        {strategies.map((strategy) => (
          <View key={strategy.id} style={styles.strategyRow}>
            <TouchableOpacity
              onPress={() => setSelectedStrategyId(strategy.id)}
              style={{ flex: 1 }}
            >
              <Text
                style={[
                  styles.strategyName,
                  selectedStrategyId === strategy.id &&
                    styles.strategyNameActive,
                ]}
              >
                {strategy.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteStrategy(strategy.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Checklist editor for selected strategy */}
        {selectedStrategyId && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>
              Checklist for Selected Strategy
            </Text>
            <EditableChecklistTable
              items={
                strategies.find((s) => s.id === selectedStrategyId)
                  ?.checklist || []
              }
              onAddItem={(item) => {
                const current =
                  strategies.find((s) => s.id === selectedStrategyId)
                    ?.checklist || [];
                handleUpdateChecklist([
                  ...current,
                  { ...item, id: `item-${Date.now()}`, createdAt: new Date() },
                ]);
              }}
              onUpdateItem={(item) => {
                const current =
                  strategies.find((s) => s.id === selectedStrategyId)
                    ?.checklist || [];
                handleUpdateChecklist(
                  current.map((i) => (i.id === item.id ? item : i))
                );
              }}
              onDeleteItem={(itemId) => {
                const current =
                  strategies.find((s) => s.id === selectedStrategyId)
                    ?.checklist || [];
                handleUpdateChecklist(current.filter((i) => i.id !== itemId));
              }}
            />
          </View>
        )}
      </View>
      {/* Theme Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Text style={styles.settingValue}>Active</Text>
        </TouchableOpacity>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Manage Firebase Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Export Data (CSV/PDF)</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: "#f5f5f5",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionDescription: {
    color: "#888",
    fontSize: 12,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 10,
  },
  strategyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#181c20",
    borderRadius: 8,
    padding: 8,
  },
  strategyName: {
    color: "#f5f5f5",
    fontSize: 15,
    fontWeight: "600",
  },
  strategyNameActive: {
    color: "#00d4d4",
    fontWeight: "700",
  },
  deleteButton: {
    marginLeft: 12,
    backgroundColor: "#f44336",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  createButton: {
    backgroundColor: "#00d4d4",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    color: "#0d0d0d",
    fontWeight: "700",
    fontSize: 14,
  },
  settingItem: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#00d4d4",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    color: "#f5f5f5",
    fontSize: 14,
    fontWeight: "600",
  },
  settingValue: {
    color: "#00d4d4",
    fontSize: 12,
    fontWeight: "600",
  },
});

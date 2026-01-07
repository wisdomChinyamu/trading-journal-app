import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useTheme } from "../components/ThemeProvider";
import { useAppContext } from "../hooks/useAppContext";
import EditableChecklistTable from "../components/EditableChecklistTable";
import {
  getUserStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
} from "../services/firebaseService";
import { ActivityIndicator } from "react-native";
import ConfirmModal from "../components/ConfirmModal";

export default function ManageStrategyScreen() {
  const { colors } = useTheme();
  const { state, dispatch } = useAppContext();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    null
  );
  const [confirmStrategyId, setConfirmStrategyId] = useState<string | null>(
    null
  );
  const [confirmVisible, setConfirmVisible] = useState(false);

  const load = async () => {
    if (!state.user?.uid) return;
    try {
      setLoading(true);
      const s = await getUserStrategies(state.user.uid);
      setStrategies(s || []);
    } catch (e) {
      console.error("Failed to load strategies", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [state.user?.uid]);

  const handleCreate = async () => {
    if (!newName.trim()) return Alert.alert("Error", "Enter a strategy name");
    if (!state.user?.uid) return Alert.alert("Error", "Not authenticated");
    try {
      setLoading(true);
      const id = await createStrategy(state.user.uid, newName, []);
      setNewName("");
      await load();
      Alert.alert("Created", "Strategy created");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to create strategy");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChecklist = async (items: any[]) => {
    if (!selectedStrategyId) return;
    setLoading(true);
    try {
      await updateStrategy(selectedStrategyId, { checklist: items });
      await load();
    } catch (e) {
      console.error("Failed to update checklist", e);
      Alert.alert("Error", "Failed to update checklist");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    setLoading(true);
    try {
      await deleteStrategy(id);
      setSelectedStrategyId((s) => (s === id ? null : s));
      await load();
    } catch (e) {
      console.error("Failed to delete strategy", e);
      Alert.alert("Error", "Failed to delete strategy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 

      <ScrollView
        style={[styles.form, { backgroundColor: colors.card }]}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          placeholder="New strategy name"
          placeholderTextColor={colors.subtext}
          value={newName}
          onChangeText={setNewName}
          style={[
            styles.input,
            { backgroundColor: colors.surface, color: colors.text },
          ]}
        />
        <TouchableOpacity
          onPress={handleCreate}
          style={[styles.button, { backgroundColor: colors.highlight }]}
        >
          <Text style={{ color: colors.background, fontWeight: "700" }}>
            Create
          </Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="small" color={colors.highlight} />
        ) : (
          <FlatList
            data={strategies}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.row,
                  {
                    borderColor: colors.neutral,
                    backgroundColor:
                      selectedStrategyId === item.id
                        ? `${colors.highlight}10`
                        : colors.surface,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setSelectedStrategyId(item.id)}
                  style={{ flex: 1, paddingRight: 8 }}
                >
                  <Text
                    style={{ color: colors.text }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 12 }}>
                    {(item.checklist || []).length} items
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setConfirmStrategyId(item.id);
                    setConfirmVisible(true);
                  }}
                  style={styles.deleteButton}
                >
                  <Text style={[styles.deleteButtonText, { color: colors.lossEnd }]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        {selectedStrategyId && (
          <View style={{ marginTop: 12 }}>
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
                  current.map((i: any) => (i.id === item.id ? item : i))
                );
              }}
              onDeleteItem={(itemId) => {
                const current =
                  strategies.find((s) => s.id === selectedStrategyId)
                    ?.checklist || [];
                handleUpdateChecklist(
                  current.filter((i: any) => i.id !== itemId)
                );
              }}
            />
          </View>
        )}

        <ConfirmModal
          visible={confirmVisible}
          title="Delete Strategy"
          message="Delete this strategy and its checklist? This cannot be undone."
          onCancel={() => {
            setConfirmVisible(false);
            setConfirmStrategyId(null);
          }}
          onConfirm={async () => {
            const id = confirmStrategyId;
            setConfirmVisible(false);
            setConfirmStrategyId(null);
            if (!id) return;
            await handleDeleteStrategy(id);
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: "800" },
  form: { margin: 16, borderRadius: 12, padding: 12 },
  input: { padding: 12, borderRadius: 8, marginBottom: 8 },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
});

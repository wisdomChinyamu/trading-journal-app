import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useAppContext } from "../hooks/useAppContext";
import { useTheme } from "../components/ThemeProvider";
import EditableChecklistTable from "../components/EditableChecklistTable";
import { ChecklistItem, Strategy } from "../types";
import {
  getUserStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
} from "../services/firebaseService";

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { state: appContextState, dispatch } = useAppContext();
  const userId = appContextState.user?.uid || "current-user"; // Replace with actual user ID from context/auth
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState("");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const toggleMode = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (userId && userId !== "current-user") {
      setLoading(true);
      getUserStrategies(userId)
        .then(setStrategies)
        .finally(() => setLoading(false));
    }
  }, [userId]);

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Manage your trading preferences
          </Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: `${colors.highlight}20` }]}>
          <Text style={[styles.headerBadgeText, { color: colors.highlight }]}>
            ⚙️
          </Text>
        </View>
      </View>

      {/* Strategy Management Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📊 Strategies & Checklists
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.subtext }]}>
              Create and manage strategies. Each strategy has its own checklist.
            </Text>
          </View>
          {strategies.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: `${colors.highlight}15` }]}>
              <Text style={[styles.countBadgeText, { color: colors.highlight }]}>
                {strategies.length}
              </Text>
            </View>
          )}
        </View>

        {/* Create new strategy */}
        <View style={styles.createStrategyContainer}>
          <TextInput
            style={[
              styles.input,
              {
                flex: 1,
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: `${colors.highlight}30`,
              },
            ]}
            placeholder="New strategy name (e.g., SMC Breakout)"
            value={newStrategyName}
            onChangeText={setNewStrategyName}
            placeholderTextColor={colors.subtext}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: newStrategyName.trim() ? colors.highlight : colors.neutral,
              },
            ]}
            onPress={handleCreateStrategy}
            disabled={loading || !newStrategyName.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={[styles.createButtonText, { color: colors.background }]}>
                + Add
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* List strategies */}
        {strategies.length > 0 ? (
          <View style={styles.strategiesList}>
            {strategies.map((strategy) => {
              const isSelected = selectedStrategyId === strategy.id;
              const isHovered = hoveredItem === strategy.id;
              
              return (
                <View
                  key={strategy.id}
                  style={[
                    styles.strategyRow,
                    {
                      backgroundColor: isSelected
                        ? `${colors.highlight}15`
                        : colors.surface,
                      borderColor: isSelected ? colors.highlight : 'transparent',
                      borderWidth: 2,
                    },
                  ]}
                  {...Platform.select({
                    web: {
                      onMouseEnter: () => setHoveredItem(strategy.id),
                      onMouseLeave: () => setHoveredItem(null)
                    }
                  })}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedStrategyId(strategy.id)}
                    style={styles.strategyInfo}
                    activeOpacity={0.7}
                  >
                    <View style={styles.strategyNameContainer}>
                      <Text
                        style={[
                          styles.strategyName,
                          {
                            color: isSelected ? colors.highlight : colors.text,
                          },
                        ]}
                      >
                        {strategy.name}
                      </Text>
                      {isSelected && (
                        <View
                          style={[
                            styles.activeBadge,
                            { backgroundColor: `${colors.highlight}30` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.activeBadgeText,
                              { color: colors.highlight },
                            ]}
                          >
                            Active
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.checklistCount, { color: colors.subtext }]}>
                      {strategy.checklist?.length || 0} items
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleDeleteStrategy(strategy.id)}
                    style={[
                      styles.deleteButton,
                      { backgroundColor: `${colors.lossEnd}20` },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.deleteButtonText, { color: colors.lossEnd }]}>
                      🗑️
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateIcon, { color: colors.subtext }]}>
              📋
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.subtext }]}>
              No strategies yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.subtext }]}>
              Create your first trading strategy above
            </Text>
          </View>
        )}

        {/* Checklist editor for selected strategy */}
        {selectedStrategyId && (
          <View style={styles.checklistEditor}>
            <View style={styles.checklistHeader}>
              <Text style={[styles.checklistTitle, { color: colors.text }]}>
                ✏️ Edit Checklist
              </Text>
              <Text style={[styles.checklistSubtitle, { color: colors.subtext }]}>
                {strategies.find((s) => s.id === selectedStrategyId)?.name}
              </Text>
            </View>
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
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🎨 Theme
        </Text>
        <TouchableOpacity
          style={[
            styles.settingItem,
            { backgroundColor: colors.surface, borderColor: `${colors.highlight}30` },
          ]}
          onPress={toggleMode}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Text style={[styles.settingIcon, { color: colors.highlight }]}>
              {mode === 'dark' ? '🌙' : '☀️'}
            </Text>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>
              <Text style={[styles.settingHint, { color: colors.subtext }]}>
                Tap to switch theme
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${colors.profitEnd}20` }]}>
            <Text style={[styles.statusBadgeText, { color: colors.profitEnd }]}>
              Active
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Account Settings */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          👤 Account
        </Text>
        
        <TouchableOpacity
          style={[
            styles.settingItem,
            { backgroundColor: colors.surface, borderColor: `${colors.highlight}30` },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Text style={[styles.settingIcon, { color: colors.highlight }]}>
              🔐
            </Text>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Manage Firebase Account
              </Text>
              <Text style={[styles.settingHint, { color: colors.subtext }]}>
                Security & authentication
              </Text>
            </View>
          </View>
          <Text style={[styles.chevron, { color: colors.subtext }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.settingItem,
            { backgroundColor: colors.surface, borderColor: `${colors.highlight}30` },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Text style={[styles.settingIcon, { color: colors.highlight }]}>
              📤
            </Text>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Export Data
              </Text>
              <Text style={[styles.settingHint, { color: colors.subtext }]}>
                Download as CSV or PDF
              </Text>
            </View>
          </View>
          <Text style={[styles.chevron, { color: colors.subtext }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.infoText, { color: colors.subtext }]}>
          Caprianne Trdz v1.0.0
        </Text>
        <Text style={[styles.infoText, { color: colors.subtext }]}>
          Built for disciplined traders
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  headerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: {
    fontSize: 28,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 36,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  createStrategyContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: "500",
    borderWidth: 2,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  createButtonText: {
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  strategiesList: {
    gap: 12,
  },
  strategyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  strategyInfo: {
    flex: 1,
    gap: 4,
  },
  strategyNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  checklistCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyStateIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.7,
  },
  checklistEditor: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  checklistHeader: {
    marginBottom: 16,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  checklistSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  settingHint: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chevron: {
    fontSize: 24,
    fontWeight: "300",
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
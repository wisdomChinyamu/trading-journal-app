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
import { Alert } from "react-native";
import { useAppContext } from "../hooks/useAppContext";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../components/ThemeProvider";
import EditableChecklistTable from "../components/EditableChecklistTable";
import { ChecklistItem, Strategy } from "../types";
import {
  getUserStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
} from "../services/firebaseService";
import { logout } from "../services/firebaseService";
import ConfirmModal from "../components/ConfirmModal";

export default function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const { state: appContextState, dispatch } = useAppContext();
  const navigation = useNavigation();
  const userId = appContextState.user?.uid || "current-user"; // Replace with actual user ID from context/auth
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState("");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [confirmStrategyId, setConfirmStrategyId] = useState<string | null>(
    null
  );
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  const toggleMode = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  const handleUiScaleChange = (scale: "small" | "normal" | "large") => {
    dispatch({ type: "SET_UI_SCALE", payload: scale });
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
        <View
          style={[
            styles.headerBadge,
            { backgroundColor: `${colors.highlight}20` },
          ]}
        >
          <Text style={[styles.headerBadgeText, { color: colors.highlight }]}>
            ⚙️
          </Text>
        </View>
      </View>

      {/* Profile management moved to its own screen */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              👤 Profile
            </Text>
            <Text
              style={[styles.sectionDescription, { color: colors.subtext }]}
            >
              Manage your profile information
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.surface }]}
          activeOpacity={0.8}
          onPress={() => (navigation as any).navigate("ManageProfile")}
        >
          <View style={styles.settingLeft}>
            <Text style={[styles.settingIcon, { color: colors.highlight }]}>
              👤
            </Text>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Edit Profile
              </Text>
              <Text style={[styles.settingHint, { color: colors.subtext }]}>
                Change display name and username
              </Text>
            </View>
          </View>
          <Text style={[styles.chevron, { color: colors.subtext }]}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📊 Strategies & Checklists
            </Text>
            <Text
              style={[styles.sectionDescription, { color: colors.subtext }]}
            >
              Manage your strategies and their checklists on a dedicated screen.
            </Text>
          </View>
          {strategies.length > 0 && (
            <View
              style={[
                styles.countBadge,
                { backgroundColor: `${colors.highlight}15`, alignSelf: "flex-start" },
              ]}
            >
              <Text
                style={[styles.countBadgeText, { color: colors.highlight }]}
              >
                {strategies.length}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.surface }]}
          activeOpacity={0.8}
          onPress={() => (navigation as any).navigate("ManageStrategy")}
        >
          <View style={styles.settingLeft}>
            <Text style={[styles.settingIcon, { color: colors.highlight }]}>
              📊
            </Text>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Manage Strategies
              </Text>
              <Text style={[styles.settingHint, { color: colors.subtext }]}>
                Create and edit strategies and their checklists
              </Text>
            </View>
          </View>
          <Text style={[styles.chevron, { color: colors.subtext }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* UI Scale Settings */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🔍 UI Scale
        </Text>
        <View style={styles.scaleOptionsContainer}>
          <TouchableOpacity
            style={[
              styles.scaleOption,
              appContextState.uiScale === "small" && styles.scaleOptionActive,
              { backgroundColor: colors.surface },
            ]}
            onPress={() => handleUiScaleChange("small")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.scaleOptionText,
                {
                  color:
                    appContextState.uiScale === "small"
                      ? colors.highlight
                      : colors.text,
                },
              ]}
            >
              Small
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.scaleOption,
              appContextState.uiScale === "normal" && styles.scaleOptionActive,
              { backgroundColor: colors.surface },
            ]}
            onPress={() => handleUiScaleChange("normal")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.scaleOptionText,
                {
                  color:
                    appContextState.uiScale === "normal"
                      ? colors.highlight
                      : colors.text,
                },
              ]}
            >
              Normal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.scaleOption,
              appContextState.uiScale === "large" && styles.scaleOptionActive,
              { backgroundColor: colors.surface },
            ]}
            onPress={() => handleUiScaleChange("large")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.scaleOptionText,
                {
                  color:
                    appContextState.uiScale === "large"
                      ? colors.highlight
                      : colors.text,
                },
              ]}
            >
              Large
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme Settings */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🎨 Theme
        </Text>
        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: colors.surface,
              borderColor: `${colors.highlight}30`,
            },
          ]}
          onPress={toggleMode}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Text style={[styles.settingIcon, { color: colors.highlight }]}>
              {mode === "dark" ? "🌙" : "☀️"}
            </Text>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {mode === "dark" ? "Dark Mode" : "Light Mode"}
              </Text>
              <Text style={[styles.settingHint, { color: colors.subtext }]}>
                Tap to switch theme
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${colors.profitEnd}20` },
            ]}
          >
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
            {
              backgroundColor: colors.surface,
              borderColor: `${colors.highlight}30`,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => (navigation as any).navigate("Accounts")}
        >
          <View style={styles.settingLeft}>
            <Text style={[styles.settingIcon, { color: colors.highlight }]}>
              🏦
            </Text>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Manage Accounts
              </Text>
              <Text style={[styles.settingHint, { color: colors.subtext }]}>
                Create and edit trading accounts
              </Text>
            </View>
          </View>
          <Text style={[styles.chevron, { color: colors.subtext }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: colors.surface,
              borderColor: `${colors.highlight}30`,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => setLogoutConfirmVisible(true)}
        >
          <View style={styles.settingLeft}>
            <Text style={[styles.settingIcon, { color: colors.highlight }]}>
              ⏏️
            </Text>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Logout
              </Text>
              <Text style={[styles.settingHint, { color: colors.subtext }]}>
                Sign out of this device
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <ConfirmModal
          visible={logoutConfirmVisible}
          title="Confirm Logout"
          message="Are you sure you want to logout?"
          confirmText="Logout"
          cancelText="Cancel"
          onCancel={() => setLogoutConfirmVisible(false)}
          onConfirm={async () => {
            setLogoutConfirmVisible(false);
            try {
              await logout();
              try {
                dispatch({ type: "SET_USER", payload: null });
              } catch {}
              navigation.reset({ index: 0, routes: [{ name: "Login" }] } as any);
              Alert.alert("Logged out", "You have been logged out successfully.");
            } catch (e) {
              console.error("Logout failed", e);
              Alert.alert("Error", "Failed to logout.");
            }
          }}
        />

        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: colors.surface,
              borderColor: `${colors.highlight}30`,
            },
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
      <ConfirmModal
        visible={confirmVisible}
        title="Delete Strategy"
        message="Delete this strategy and its checklist? This cannot be undone."
        onCancel={() => {
          setConfirmVisible(false);
          setConfirmStrategyId(null);
        }}
        onConfirm={async () => {
          if (!confirmStrategyId) return;
          setConfirmVisible(false);
          const id = confirmStrategyId;
          setConfirmStrategyId(null);
          setLoading(true);
          try {
            await handleDeleteStrategy(id);
          } catch (e) {
            console.error("Failed to delete strategy", e);
            Alert.alert("Error", "Failed to delete strategy");
          } finally {
            setLoading(false);
          }
        }}
      />
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
    shadowColor: "#000",
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
  sectionHeaderLeft: {
    flex: 1,
    marginRight: 8,
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
    maxWidth: 84,
    overflow: "hidden",
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
        shadowColor: "#000",
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
  scaleOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  scaleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    marginHorizontal: 4,
  },
  scaleOptionActive: {
    borderColor: "#00d4d4", // highlight color
  },
  scaleOptionText: {
    fontSize: 15,
    fontWeight: "700",
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

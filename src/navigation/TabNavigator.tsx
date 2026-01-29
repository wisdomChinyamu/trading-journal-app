import React from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Conditional import based on platform to avoid bundling native-stack on web
const createStackNavigator =
  Platform.OS === "web"
    ? () => require("@react-navigation/stack").createStackNavigator()
    : () =>
        require("@react-navigation/native-stack").createNativeStackNavigator();

const Stack = createStackNavigator();

import DashboardScreen from "../screens/DashboardScreen";
import JournalScreen from "../screens/JournalScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import RoutineScreen from "../screens/RoutineScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AccountsScreen from "../screens/AccountsScreen";
import TradeDetailScreen from "../screens/TradeDetailScreen";
import AddTradeScreen from "../screens/AddTradeScreen";
import ManageProfileScreen from "../screens/ManageProfileScreen";
import ManageStrategyScreen from "../screens/ManageStrategyScreen";
import NotesScreen from "../screens/NotesScreen";

const Tab = createBottomTabNavigator();

// Tab icon mapping with emojis
const tabIcons: Record<string, { active: string; inactive: string }> = {
  Dashboard: { active: "📊", inactive: "📊" },
  Journal: { active: "📓", inactive: "📓" },
  Notes: { active: "📝", inactive: "📝" },
  Analytics: { active: "📈", inactive: "📈" },
  Routine: { active: "✅", inactive: "✅" },
  Settings: { active: "⚙️", inactive: "⚙️" },
};
function NotesStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen
        name="NotesMain"
        component={NotesScreen}
        options={{
          title: "Notes",
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>📝</Text>
              </View>
            </View>
          ),
        }}
      />
    </Stack.Navigator>
  );
}

// Custom tab bar icon component
const TabIcon = ({
  name,
  focused,
  color,
}: {
  name: string;
  focused: boolean;
  color: string;
}) => {
  const icon = tabIcons[name];
  const emoji = focused ? icon.active : icon.inactive;

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={[styles.icon, { opacity: focused ? 1 : 0.6 }]}>{emoji}</Text>
      {focused && (
        <View style={[styles.activeDot, { backgroundColor: color }]} />
      )}
    </View>
  );
};

// Define enhanced header options
const headerOptions = {
  headerStyle: {
    backgroundColor: "#1a1a1a",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 212, 212, 0.2)",
  },
  headerTintColor: "#00d4d4",
  headerTitleStyle: {
    fontWeight: "800",
    fontSize: 20,
    letterSpacing: 0.5,
    color: "#f5f5f5",
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>📊</Text>
              </View>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="AddTrade"
        component={AddTradeScreen}
        options={{
          title: "New Trade",
          presentation: Platform.OS === "web" ? "card" : "modal",
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>➕</Text>
              </View>
            </View>
          ),
        }}
      />
    </Stack.Navigator>
  );
}

function JournalStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen
        name="JournalMain"
        component={JournalScreen}
        options={{
          title: "Trade Journal",
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>📓</Text>
              </View>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="TradeDetail"
        component={TradeDetailScreen}
        options={({ route }: any) => ({
          title: route.params?.pair || "Trade Details",
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>📋</Text>
              </View>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="AddTrade"
        component={AddTradeScreen}
        options={{
          title: "New Trade",
          presentation: Platform.OS === "web" ? "card" : "modal",
        }}
      />
    </Stack.Navigator>
  );
}

function AnalyticsStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen
        name="AnalyticsMain"
        component={AnalyticsScreen}
        options={{
          title: "Analytics",
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>📈</Text>
              </View>
            </View>
          ),
        }}
      />
    </Stack.Navigator>
  );
}

function RoutineStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen
        name="RoutineMain"
        component={RoutineScreen}
        options={{
          title: "Trading Routine",
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>✅</Text>
              </View>
            </View>
          ),
        }}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{
          title: "Settings",
          headerLeft: () => (
            <View style={styles.headerLeftContainer}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>⚙️</Text>
              </View>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="ManageProfile"
        component={ManageProfileScreen}
        options={{
          title: "Manage Profile",
        }}
      />
      <Stack.Screen
        name="ManageStrategy"
        component={ManageStrategyScreen}
        options={{
          title: "Manage Strategies",
        }}
      />
      <Stack.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{
          title: "Accounts",
        }}
      />
    </Stack.Navigator>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopColor: "rgba(0, 212, 212, 0.3)",
          borderTopWidth: 2,
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          paddingTop: 12,
          height: Platform.OS === "ios" ? 85 : 70,
          elevation: 20,
          shadowColor: "#00d4d4",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: "#00d4d4",
        tabBarInactiveTintColor: "#666666",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.5,
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarHideOnKeyboard: Platform.OS !== "ios",
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: "Dashboard",
          tabBarAccessibilityLabel: "Dashboard tab",
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalStack}
        options={{
          tabBarLabel: "Journal",
          tabBarAccessibilityLabel: "Journal tab",
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesStack}
        options={{
          tabBarLabel: "Notes",
          tabBarAccessibilityLabel: "Notes tab",
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsStack}
        options={{
          tabBarLabel: "Analytics",
          tabBarAccessibilityLabel: "Analytics tab",
          tabBarBadge: undefined, // Can be used to show notification count
        }}
      />
      <Tab.Screen
        name="Routine"
        component={RoutineStack}
        options={{
          tabBarLabel: "Routine",
          tabBarAccessibilityLabel: "Routine tab",
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          tabBarLabel: "Settings",
          tabBarAccessibilityLabel: "Settings tab",
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            try {
              // Ensure Settings stack resets to its main screen when tapping the tab
              (navigation as any).navigate("Settings", {
                screen: "SettingsMain",
              });
            } catch (err) {
              // fallback: do nothing
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 36,
    position: "relative",
  },
  iconContainerActive: {
    transform: [{ scale: 1.1 }],
  },
  icon: {
    fontSize: 24,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: -2,
  },
  headerLeftContainer: {
    marginLeft: 16,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0, 212, 212, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: {
    fontSize: 18,
  },
});

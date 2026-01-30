import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";

export interface SlashCommand {
  id: string;
  label: string;
  icon: string;
  type: string;
  description?: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "text",
    label: "Text",
    icon: "📝",
    type: "paragraph",
    description: "Start typing",
  },
  {
    id: "h1",
    label: "Heading 1",
    icon: "📌",
    type: "heading",
    description: "Large title",
  },
  {
    id: "h2",
    label: "Heading 2",
    icon: "📎",
    type: "heading2",
    description: "Medium title",
  },
  {
    id: "h3",
    label: "Heading 3",
    icon: "📍",
    type: "heading3",
    description: "Small title",
  },
  {
    id: "image",
    label: "Image",
    icon: "🖼️",
    type: "image",
    description: "Upload image",
  },
  {
    id: "todo",
    label: "To-Do",
    icon: "☑️",
    type: "todo",
    description: "Checklist item",
  },
  {
    id: "list",
    label: "List",
    icon: "📋",
    type: "list",
    description: "Bullet list",
  },
  {
    id: "quote",
    label: "Quote",
    icon: "💬",
    type: "quote",
    description: "Quoted text",
  },
  {
    id: "divider",
    label: "Divider",
    icon: "—",
    type: "divider",
    description: "Separator line",
  },
];

interface SlashCommandMenuProps {
  visible: boolean;
  onSelectCommand: (command: SlashCommand) => void;
  onClose: () => void;
  searchText?: string;
}

export default function SlashCommandMenu({
  visible,
  onSelectCommand,
  onClose,
  searchText = "",
}: SlashCommandMenuProps) {
  const filteredCommands = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(searchText.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        // Prevent accidental closing when tapping outside - keep menu open until user selects
        onPress={() => {}}
      >
        <View
          style={styles.containerWrapper}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.container} onStartShouldSetResponder={() => true}>
            <ScrollView
              style={styles.menuList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              scrollEnabled={filteredCommands.length > 5}
            >
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd) => (
                  <TouchableOpacity
                    key={cmd.id}
                    style={styles.commandItem}
                    onPress={() => {
                      onSelectCommand(cmd);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.commandIcon}>{cmd.icon}</Text>
                    <View style={styles.commandInfo}>
                      <Text style={styles.commandLabel}>{cmd.label}</Text>
                      {cmd.description && (
                        <Text style={styles.commandDescription}>
                          {cmd.description}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No commands found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  containerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    maxHeight: "70%",
    width: "95%",
    maxWidth: 800,
    borderWidth: 1,
    borderColor: "#00d4d4",
    overflow: "hidden",
  },
  menuList: {
    maxHeight: "100%",
  },
  commandItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#222",
  },
  commandIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  commandInfo: {
    flex: 1,
  },
  commandLabel: {
    color: "#f5f5f5",
    fontSize: 15,
    fontWeight: "600",
  },
  commandDescription: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#666",
    fontSize: 14,
  },
});

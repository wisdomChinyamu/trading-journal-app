import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useAppContext } from "../hooks/useAppContext";
import {
  listNoteBlocks,
  createNoteBlock,
  updateNoteBlock,
  deleteNoteBlock,
  updateNotePage,
} from "../services/firebaseService";
import { NoteBlock } from "../types/notes";
import SlashCommandMenu, { SlashCommand } from "./SlashCommandMenu";

const BLOCK_TYPE_LABELS: Record<string, string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  heading2: "Heading 2",
  heading3: "Heading 3",
  image: "Image",
  todo: "To-Do",
  list: "List",
  quote: "Quote",
  divider: "Divider",
};

// EditableBlock component for viewing and editing blocks
const EditableBlock = ({
  block,
  onUpdate,
  onDelete,
  onAddBlockAfter,
}: {
  block: NoteBlock;
  onUpdate: (updatedBlock: NoteBlock) => void;
  onDelete: (blockId: string) => void;
  onAddBlockAfter: (blockType: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(block.properties?.text || "");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashSearch, setSlashSearch] = useState("");
  const [imageUri, setImageUri] = useState(block.properties?.url || "");
  const [showImageModal, setShowImageModal] = useState(false);

  const handleSave = () => {
    if (text.trim() === "" && !imageUri) {
      onDelete(block.blockId);
      return;
    }

    const updatedBlock = {
      ...block,
      properties: {
        ...block.properties,
        text: block.type === "image" ? "" : text,
        url: block.type === "image" ? imageUri : undefined,
      },
    };
    onUpdate(updatedBlock);
    setIsEditing(false);
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSave();
      onAddBlockAfter(block.type);
    } else if (e.nativeEvent.key === "Backspace") {
      // If block is empty and not an image, delete the block
      if (text.trim() === "" && !imageUri) {
        e.preventDefault();
        onDelete(block.blockId);
      }
      // If it's an image block and user presses backspace, delete the image
      else if (block.type === "image" && imageUri) {
        e.preventDefault();
        setImageUri("");
        // Update block to remove image
        const updatedBlock = {
          ...block,
          type: "paragraph",
          properties: {
            ...block.properties,
            url: undefined,
            text: "",
          },
        };
        onUpdate(updatedBlock);
      }
    }
  };

  const handleTextChange = (newText: string) => {
    const oldText = text;
    setText(newText);

    // Detect backspace when text is shorter
    if (newText.length < oldText.length && oldText.length > 0) {
      // Backspace detected
      if (newText === "") {
        // If block becomes empty, delete it (unless it's an image block)
        if (block.type !== "image" && !imageUri) {
          onDelete(block.blockId);
          return;
        }
      }
    }

    // Check for slash command
    if (newText.endsWith("/")) {
      setShowSlashMenu(true);
      setSlashSearch("");
    } else if (newText.includes("/") && showSlashMenu) {
      const parts = newText.split("/");
      if (parts.length > 0) {
        const search = parts[parts.length - 1];
        setSlashSearch(search);
      }
    }
  };

  const handleSlashCommand = (command: SlashCommand) => {
    // Remove the "/" from text
    const cleanText = text.replace(/\/$/, "");
    setText(cleanText);
    setShowSlashMenu(false);

    // If it's an image, show uploader
    if (command.type === "image") {
      setShowImageModal(true);
    }
  };

  const handleImagePaste = (imageUrl: string) => {
    setImageUri(imageUrl);
    setShowImageModal(false);
    // Save the image block with URL
    const updatedBlock = {
      ...block,
      type: "image",
      properties: {
        ...block.properties,
        url: imageUrl,
        text: "",
      },
    };
    onUpdate(updatedBlock);
    setIsEditing(false);
  };

  const getBlockIcon = () => {
    const icons: Record<string, string> = {
      paragraph: "📝",
      heading: "📌",
      heading2: "📎",
      heading3: "📍",
      image: "🖼️",
      todo: "☑️",
      list: "📋",
      quote: "💬",
      divider: "—",
    };
    return icons[block.type] || "📄";
  };

  if (isEditing) {
    return (
      <>
        <View style={styles.editableBlockContainer}>
          <Text style={styles.blockIcon}>{getBlockIcon()}</Text>
          {block.type === "image" && imageUri ? (
            <View style={styles.imageEditContainer}>
              <TextInput
                style={styles.editableInput}
                value={`Image: ${imageUri.split("/").pop() || "Image"}`}
                editable={false}
                multiline
                placeholder={`Image block - press backspace to delete...`}
                placeholderTextColor="#555"
              />
            </View>
          ) : (
            <TextInput
              style={styles.editableInput}
              value={text}
              onChangeText={handleTextChange}
              onBlur={handleSave}
              multiline
              autoFocus
              placeholder={`Type "/" for options... or just start typing...`}
              placeholderTextColor="#555"
              onSubmitEditing={handleKeyPress}
            />
          )}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>✓</Text>
          </TouchableOpacity>
        </View>
        <SlashCommandMenu
          visible={showSlashMenu}
          onSelectCommand={handleSlashCommand}
          onClose={() => setShowSlashMenu(false)}
          searchText={slashSearch}
        />
        <ImageUploadModal
          visible={showImageModal}
          onImageUrl={handleImagePaste}
          onCancel={() => setShowImageModal(false)}
        />
      </>
    );
  }

  return (
    <TouchableOpacity
      style={styles.blockRow}
      onPress={() => setIsEditing(true)}
    >
      <Text style={styles.blockIcon}>{getBlockIcon()}</Text>
      <View style={styles.blockInfo}>
        <Text style={styles.blockContent}>
          {block.type === "image" && block.properties?.url
            ? `Image: ${block.properties.url.split("/").pop()}`
            : block.properties?.text || "(Empty)"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Simple Image Upload Modal
const ImageUploadModal = ({
  visible,
  onImageUrl,
  onCancel,
}: {
  visible: boolean;
  onImageUrl: (url: string) => void;
  onCancel: () => void;
}) => {
  const [imageUrl, setImageUrl] = useState("");

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      onImageUrl(imageUrl.trim());
      setImageUrl("");
    } else {
      Alert.alert("Error", "Please enter a valid image URL");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Image</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter image URL from Supabase or web..."
            placeholderTextColor="#666"
            value={imageUrl}
            onChangeText={setImageUrl}
            multiline={false}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButtonCancel}
              onPress={onCancel}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonConfirm}
              onPress={handleAddImage}
            >
              <Text style={styles.modalButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default function NotesBlockList({
  pageId,
  pageTitle = "Untitled Page",
}: {
  pageId: string;
  pageTitle?: string;
}) {
  const { state } = useAppContext();
  const userId = state.user?.uid;
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPageTitle, setEditingPageTitle] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState(pageTitle);

  const fetchBlocks = async () => {
    if (!userId || !pageId) return;
    setLoading(true);
    const data = await listNoteBlocks(userId, pageId);
    setBlocks(
      data.map((d: any) => ({
        blockId: d.blockId,
        pageId: d.pageId,
        parentId: d.parentId,
        type: d.type,
        properties: d.properties ?? {},
        order: d.order ?? 0,
        depth: d.depth ?? 0,
        isCollapsed: d.isCollapsed ?? false,
        createdAt: d.createdAt?.toDate
          ? d.createdAt.toDate()
          : new Date(d.createdAt),
        updatedAt: d.updatedAt?.toDate
          ? d.updatedAt.toDate()
          : new Date(d.updatedAt),
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchBlocks();
  }, [userId, pageId]);

  const handleAddBlock = async (blockType: string = "paragraph") => {
    if (!userId || !pageId) return;
    await createNoteBlock(userId, {
      pageId,
      parentId: pageId,
      type: blockType,
      properties: blockType === "divider" ? {} : { text: "" },
      order: blocks.length,
      depth: 0,
    });
    fetchBlocks();
  };

  const handleUpdateBlock = async (updatedBlock: NoteBlock) => {
    if (!userId) return;

    // Update local state optimistically
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.blockId === updatedBlock.blockId ? updatedBlock : block,
      ),
    );

    // Update in Firebase
    await updateNoteBlock(userId, updatedBlock.blockId, {
      properties: updatedBlock.properties,
      updatedAt: new Date(),
    });
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!userId) return;

    // Update local state optimistically
    setBlocks((prevBlocks) =>
      prevBlocks.filter((block) => block.blockId !== blockId),
    );

    // Delete from Firebase
    await deleteNoteBlock(userId, blockId);
  };

  const handleSavePageTitle = async () => {
    if (!userId || !pageId) return;

    await updateNotePage(userId, pageId, {
      title: newPageTitle,
      updatedAt: new Date(),
    });

    setEditingPageTitle(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        {editingPageTitle ? (
          <View style={styles.editPageTitleContainer}>
            <TextInput
              style={styles.editPageTitleInput}
              value={newPageTitle}
              onChangeText={setNewPageTitle}
              onBlur={handleSavePageTitle}
              onSubmitEditing={handleSavePageTitle}
              autoFocus
              placeholder="Page title..."
              placeholderTextColor="#555"
            />
            <TouchableOpacity
              style={styles.savePageTitleBtn}
              onPress={handleSavePageTitle}
            >
              <Text style={styles.savePageTitleText}>✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditingPageTitle(true)}>
            <View>
              <Text style={styles.pageTitle}>{newPageTitle}</Text>
              <Text style={styles.blockCount}>
                {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => handleAddBlock()}
        >
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#00d4d4" />
      ) : (
        <View style={styles.blocksWrapper}>
          {blocks.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyState}
              onPress={() => handleAddBlock()}
            >
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateText}>No blocks yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap here, press "+" or press Enter to start writing
              </Text>
            </TouchableOpacity>
          ) : (
            <FlatList
              data={blocks}
              keyExtractor={(item) => item.blockId}
              renderItem={({ item }) => (
                <EditableBlock
                  block={item}
                  onUpdate={handleUpdateBlock}
                  onDelete={handleDeleteBlock}
                  onAddBlockAfter={handleAddBlock}
                />
              )}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            />
          )}
          {blocks.length > 0 && (
            <TouchableOpacity
              style={styles.bottomCreateArea}
              onPress={() => handleAddBlock()}
              activeOpacity={0.3}
            >
              <Text style={styles.bottomCreateText}>Tap to add block</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  blocksWrapper: {
    flex: 1,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#222",
  },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#f5f5f5" },
  blockCount: { fontSize: 12, color: "#666", marginTop: 4 },
  editPageTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  editPageTitleInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "#f5f5f5",
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 30,
  },
  savePageTitleBtn: {
    backgroundColor: "#00d4d4",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  savePageTitleText: {
    color: "#0d0d0d",
    fontWeight: "bold",
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: "#00d4d4",
    borderRadius: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: { color: "#0d0d0d", fontSize: 20, fontWeight: "800" },
  blockRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  blockIcon: { fontSize: 18, marginRight: 10, marginTop: 2 },
  blockInfo: {
    flex: 1,
    flexDirection: "column",
  },
  blockContent: { fontSize: 15, color: "#f5f5f5", lineHeight: 20 },
  editableBlockContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: "#222",
  },
  editableInput: {
    flex: 1,
    fontSize: 15,
    color: "#f5f5f5",
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    padding: 8,
    minHeight: 40,
    textAlignVertical: "top",
    marginLeft: 8,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    padding: 8,
    marginLeft: 8,
    justifyContent: "center",
  },
  imageEditContainer: {
    flex: 1,
  },
  imageUrl: {
    color: "#00d4d4",
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: "#00d4d4",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#0d0d0d",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f5f5f5",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#666",
  },
  bottomCreateArea: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#222",
    minHeight: 50,
  },
  bottomCreateText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#00d4d4",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#0d0d0d",
    color: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalButtonCancel: {
    backgroundColor: "#222",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalButtonConfirm: {
    backgroundColor: "#00d4d4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalButtonText: {
    color: "#0d0d0d",
    fontWeight: "600",
    fontSize: 14,
  },
});
